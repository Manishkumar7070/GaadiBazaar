import express from 'express';
import retry from "async-retry";
import { authenticate, AuthRequest } from '../middleware/auth';
import { getSupabaseClient } from '../clients';
import { supabaseBreaker } from '../lib/resilience';
import { cache } from '../lib/cache';
import { serverLogger } from '../logger';

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const cachedVehicles = await cache.get("vehicles:all");
    if (cachedVehicles) {
      return res.json(JSON.parse(cachedVehicles));
    }

    const data = await supabaseBreaker.fire(async () => {
      return await retry(async (bail) => {
        const { data, error } = await getSupabaseClient().from("vehicles").select("*");
        if (error) {
          if (error.code === "429") bail(new Error("Supabase is temporarily rate limiting requests."));
          throw error;
        }
        return data;
      }, {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
      });
    }).catch(err => {
      if (err.message === 'Breaker is open') {
        throw new Error('Database is temporarily unavailable due to high traffic. Retrying in a few seconds...');
      }
      throw err;
    });
    
    await cache.setex("vehicles:all", 300, JSON.stringify(data));
    res.json(data);
  } catch (error: any) {
    serverLogger.error("Error fetching vehicles", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticate, async (req: AuthRequest, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized", message: "You must be logged in to list a vehicle" });
    }
    
    const vehicleData = req.body;
    const requiredFields = ["title", "price", "brand", "model", "city", "state", "sellerId"];
    const missingFields = requiredFields.filter(f => !vehicleData[f]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: "Validation Failed", 
        message: `Missing required fields: ${missingFields.join(", ")}` 
      });
    }

    const data = await supabaseBreaker.fire(async () => {
      return await retry(async (bail) => {
        const { data, error } = await getSupabaseClient()
          .from("vehicles")
          .insert([
            {
              ...vehicleData,
              status: "active",
              isFeatured: false,
              isVerified: false,
              viewsCount: 0,
              createdAt: new Date().toISOString(),
            },
          ])
          .select();

        if (error) {
          if (error.code === "400") bail(new Error("The provided vehicle information is invalid. Please check and try again."));
          throw error;
        }
        return data[0];
      }, {
        retries: 2,
      });
    }).catch(err => {
      if (err.message === 'Breaker is open') {
        throw new Error('Our database is currently processing too many requests. Please wait a moment.');
      }
      throw err;
    });

    await cache.del("vehicles:all");
    res.status(201).json(data);
  } catch (error: any) {
    serverLogger.error("Error creating vehicle", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get("/wishlist/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await getSupabaseClient()
      .from("user_wishlist")
      .select("*, vehicles(*)")
      .eq("user_id", userId);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    serverLogger.error("Error fetching wishlist", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.post("/wishlist", async (req, res) => {
  const { userId, vehicleId } = req.body;
  if (!userId || !vehicleId) return res.status(400).json({ error: "User ID and Vehicle ID are required" });

  try {
    const { data, error } = await getSupabaseClient()
      .from("user_wishlist")
      .insert([{ user_id: userId, vehicle_id: vehicleId }])
      .select();

    if (error) {
      if (error.code === "23505") return res.status(409).json({ error: "Already in wishlist" });
      throw error;
    }
    res.status(201).json(data[0]);
  } catch (error: any) {
    serverLogger.error("Error adding to wishlist", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.delete("/wishlist/:userId/:vehicleId", async (req, res) => {
  const { userId, vehicleId } = req.params;
  try {
    const { error } = await getSupabaseClient()
      .from("user_wishlist")
      .delete()
      .eq("user_id", userId)
      .eq("vehicle_id", vehicleId);

    if (error) throw error;
    res.json({ message: "Removed from wishlist" });
  } catch (error: any) {
    serverLogger.error("Error removing from wishlist", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;
