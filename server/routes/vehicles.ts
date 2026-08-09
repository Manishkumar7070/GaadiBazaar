import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest, requireAuth } from '../middleware/auth';
import { getSupabaseClient } from '../clients';
import { supabaseBreaker } from '../lib/resilience';
import { cache } from '../lib/cache';
import { serverLogger } from '../logger';
import { isUUID } from '../lib/validation';
import { rateLimitHandler } from '../middleware/rate-limit-monitor';

const router = express.Router();

let isLocalDbOffline = false;
let dbOfflineDetectTime = 0;
const DB_OFFLINE_RETRY_INTERVAL = 30000; // Fast-recovery 30 seconds test window for resilient healing

// Track active, in-flight query promises by cacheKey to prevent a cache stampede / thundering herd under concurrent request traffic
const inFlightQueries = new Map<string, Promise<any>>();

// Granular scraper defense: Max 300 vehicle search/list API operations per minute to handle higher user traffic density.
const searchScraperLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 300, // Max 300 queries per IP address per minute for active customers
  message: { error: "Too many search requests. Searching rates are limited to prevent vehicle pricing data scraping." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// GET /api/vehicles - Public access with caching and rate limiter scraping defense
router.get("/", searchScraperLimiter, async (req, res) => {
  const { shopId, sellerId, verificationStatus } = req.query;
  const cacheKey = `vehicles:list:${shopId || 'all'}:${sellerId || 'all'}:${verificationStatus || 'all'}`;

  try {
    // 1. Try Cache FIRST. Serving stale/existing cached listings is always better than empty lists under traffic spikes!
    const cachedVehicles = await cache.get(cacheKey);
    if (cachedVehicles) {
      return res.json(JSON.parse(cachedVehicles));
    }

    // 2. ONLY apply fast-fallback blank response if the cache has expired AND the database was flagged offline very recently.
    if (isLocalDbOffline && (Date.now() - dbOfflineDetectTime < DB_OFFLINE_RETRY_INTERVAL)) {
      return res.json([]);
    }

    // Coalesce / deduplicate multiple concurrent database requests for the same cache key
    let dataPromise = inFlightQueries.get(cacheKey);
    if (!dataPromise) {
      dataPromise = supabaseBreaker.fire(async () => {
        let query = getSupabaseClient().from("vehicles").select("*");
        
        if (shopId && typeof shopId === 'string' && isUUID(shopId)) {
          query = query.eq('shop_id', shopId);
        }
        if (sellerId && typeof sellerId === 'string' && isUUID(sellerId)) {
          query = query.eq('seller_id', sellerId);
        }
        if (verificationStatus && typeof verificationStatus === 'string') {
          query = query.eq('verification_status', verificationStatus);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
      });

      inFlightQueries.set(cacheKey, dataPromise);

      // Assure completion cleanup and swallow side-branch rejections to prevent unhandled rejection events
      dataPromise.finally(() => {
        inFlightQueries.delete(cacheKey);
      }).catch(() => {});
    }

    const data = await dataPromise;
    
    // Reset offline tracking if query succeeded
    isLocalDbOffline = false;
    
    await cache.setex(cacheKey, 300, JSON.stringify(data));
    res.json(data);
  } catch (error: any) {
    serverLogger.error("[VEHICLES] Database query error, engaging local offline fallback protocol", { error: error.message });
    // Set offline trackers to bypass DB on next queries (breathing room for database connection pool)
    isLocalDbOffline = true;
    dbOfflineDetectTime = Date.now();

    // Cache empty list as secondary safeguard only for 10 seconds to avoid long freeze periods
    try {
      await cache.setex(cacheKey, 10, JSON.stringify([]));
    } catch (cacheErr: any) {
      // Quietly continue
    }
    res.json([]);
  }
});

// POST /api/vehicles - Authenticated access with ownership check
router.post("/", authenticate, requireAuth, async (req: AuthRequest, res: any) => {
  try {
    const { title, price, brand, model, city, state, sellerId } = req.body;
    
    // Ownership check (IDOR prevention)
    if (sellerId !== req.user.uid) {
      return res.status(403).json({ error: "Forbidden", message: "User identity mismatch" });
    }

    if (!title || !price || !brand || !model || !city || !state || !sellerId) {
      return res.status(400).json({ 
        error: "Validation Failed", 
        message: "Missing required fields" 
      });
    }

    // Explicit Sanitization (Mass Assignment prevention)
    const cleanData = {
      title, 
      price, 
      brand, 
      model, 
      city, 
      state, 
      seller_id: sellerId, // Mapping to snake_case used in DB
      status: "active",
      is_featured: false,
      is_verified: false,
      views_count: 0,
      created_at: new Date().toISOString(),
    };

    const data = await supabaseBreaker.fire(async () => {
      const { data, error } = await getSupabaseClient()
        .from("vehicles")
        .insert([cleanData])
        .select();

      if (error) throw error;
      return data[0];
    });

    await cache.delPattern("vehicles:*");
    res.status(201).json(data);
  } catch (error: any) {
    serverLogger.error("Error creating vehicle", { error: error.message });
    res.status(500).json({ error: "Failed to create vehicle listing." });
  }
});

// GET /api/vehicles/wishlist/:userId - Protected IDOR check
router.get("/wishlist/:userId", authenticate, requireAuth, async (req: AuthRequest, res) => {
  const { userId } = req.params;
  
  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Forbidden", message: "Access denied" });
  }

  try {
    const { data, error } = await getSupabaseClient()
      .from("user_wishlist")
      .select("*, vehicles(*)")
      .eq("user_id", userId);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    serverLogger.error("Error fetching wishlist", { error: error.message });
    res.status(500).json({ error: "Error retrieving wishlist" });
  }
});

// POST /api/vehicles/wishlist - Protected IDOR check
router.post("/wishlist", authenticate, requireAuth, async (req: AuthRequest, res) => {
  const { userId, vehicleId } = req.body;

  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Forbidden", message: "Cannot modify other wishlists" });
  }

  if (!userId || !vehicleId || !isUUID(vehicleId)) {
    return res.status(400).json({ error: "Valid data required" });
  }

  try {
    const { data, error } = await getSupabaseClient()
      .from("user_wishlist")
      .insert([{ user_id: userId, vehicle_id: vehicleId }])
      .select();

    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "Already exists" });
      throw error;
    }
    res.status(201).json(data[0]);
  } catch (error: any) {
    serverLogger.error("Error adding to wishlist", { error: error.message });
    res.status(500).json({ error: "Error adding item" });
  }
});

// DELETE /api/vehicles/wishlist/:userId/:vehicleId - Protected IDOR check
router.delete("/wishlist/:userId/:vehicleId", authenticate, requireAuth, async (req: AuthRequest, res) => {
  const { userId, vehicleId } = req.params;

  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Forbidden", message: "Action denied" });
  }
  
  if (!isUUID(vehicleId)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  try {
    const { error } = await getSupabaseClient()
      .from("user_wishlist")
      .delete()
      .eq("user_id", userId)
      .eq("vehicle_id", vehicleId);

    if (error) throw error;
    res.json({ message: "Removed" });
  } catch (error: any) {
    serverLogger.error("Error removing from wishlist", { error: error.message });
    res.status(500).json({ error: "Error removing item" });
  }
});

export default router;
