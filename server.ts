import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import admin from "firebase-admin";
import { getFirestore as getFirestoreAdmin } from "firebase-admin/firestore";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import CircuitBreaker from "opossum";
import retry from "async-retry";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy is required for express-rate-limit to work behind Nginx/Cloud Run
  app.set("trust proxy", 1);

  app.use(express.json());

  // Global Request Timeout (30 seconds)
  // This ensures that long-running requests don't hang the server during high load
  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request Timeout", message: "The server took too long to respond." });
      }
    });
    next();
  });

  // In-memory Cache (Free 0-cost alternative to Redis)
  const memoryCache = new Map<string, { value: string; expires: number }>();
  const cache = {
    get: async (key: string) => {
      const item = memoryCache.get(key);
      if (!item) return null;
      if (Date.now() > item.expires) {
        memoryCache.delete(key);
        return null;
      }
      return item.value;
    },
    setex: async (key: string, seconds: number, value: string) => {
      memoryCache.set(key, {
        value,
        expires: Date.now() + seconds * 1000,
      });
      return "OK";
    },
    del: async (key: string) => {
      return memoryCache.delete(key) ? 1 : 0;
    },
    ping: async () => "PONG",
    quit: async () => "OK",
  };

  // Global Rate Limiting & Load Management
  // 1. "Soft" Rate Limiting (Slow Down)
  // Instead of blocking, we slow down requests after a certain threshold.
  // This "manages" the load gracefully when usage increases.
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes, then...
    delayMs: (hits) => hits * 100, // add 100ms of delay per request above 50
    maxDelayMs: 2000, // max delay of 2 seconds
  });

  // 2. "Hard" Rate Limiting (Block)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ 
        error: "Too many requests", 
        message: "Too many requests from this IP, please try again after 15 minutes" 
      });
    }
  });

  // 3. Strict Auth Rate Limiting (Prevent Brute Force/Abuse)
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 OTP requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ 
        error: "Rate limit exceeded", 
        message: "Too many login attempts. Please try again in an hour." 
      });
    }
  });

  app.use("/api/", speedLimiter);
  app.use("/api/", limiter);
  app.use("/api/auth/send-otp", authLimiter);
  
  // Check for missing environment variables on startup (Log only, don't crash)
  const requiredEnvVars = [
    'SUPABASE_URL', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    console.warn(`[WARN] Missing environment variables: ${missingVars.join(', ')}. Some API features will be disabled.`);
  }

  // Supabase Client (Lazy initialization)
  let supabaseClientInstance: any = null;
  const getSupabaseClient = () => {
    if (!supabaseClientInstance) {
      let url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error("Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are required");
      }
      
      // Auto-fix URL if protocol is missing (helps with some environment misconfigurations)
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      
      supabaseClientInstance = createClient(url, key);
    }
    return supabaseClientInstance;
  };

  // Firebase Admin (Lazy initialization)
  let firebaseAdminInstance: admin.app.App | null = null;
  const getFirebaseAdmin = () => {
    if (!firebaseAdminInstance) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

      if (!projectId || !clientEmail || !privateKeyEnv) {
        throw new Error("Missing Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
      }

      const privateKey = privateKeyEnv.replace(/\\n/g, '\n');

      firebaseAdminInstance = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      }, "admin-app-" + Date.now());
    }
    return firebaseAdminInstance;
  };

  const getFirestore = () => {
    const adminApp = getFirebaseAdmin();
    try {
      // Try to get database ID from config file
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.firestoreDatabaseId) {
          try {
            return getFirestoreAdmin(adminApp, config.firestoreDatabaseId);
          } catch (initErr) {
            console.warn(`[AUTH] Specific Firestore DB ${config.firestoreDatabaseId} failed, falling back to default:`, initErr);
          }
        }
      }
    } catch (err) {
      console.warn("[AUTH] Could not load firestoreDatabaseId from config:", err);
    }
    return getFirestoreAdmin(adminApp);
  };

  // Circuit Breaker for Supabase
  const supabaseBreaker = new CircuitBreaker(async (fn: any) => await fn(), {
    timeout: 3000, // If the function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
    resetTimeout: 30000, // After 30 seconds, try again
  });

  supabaseBreaker.on("open", () => console.warn("Supabase Circuit Breaker OPEN"));
  supabaseBreaker.on("close", () => console.log("Supabase Circuit Breaker CLOSED"));

  // Circuit Breaker for Firebase
  const firebaseBreaker = new CircuitBreaker(async (fn: any) => await fn(), {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  });

  // Firebase Auth Middleware
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Continue without user
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      const adminApp = getFirebaseAdmin();
      const decodedToken = await adminApp.auth().verifyIdToken(idToken);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error("[AUTH] Firebase token verification failed:", error);
      next();
    }
  };

  app.use(authenticate);

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Kubernetes Liveness & Readiness Probes
  app.get("/healthz", (req, res) => res.status(200).send("OK"));
  app.get("/readyz", async (req, res) => {
    const health = {
      status: "UP",
      timestamp: new Date().toISOString(),
      checks: {
        cache: "UNKNOWN",
        supabase: "UNKNOWN",
        firebase: "NOT_CONFIGURED"
      }
    };

    try {
      // 1. Check Cache
      await cache.ping();
      health.checks.cache = "UP";

      // 2. Check Supabase (Lite query)
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { error } = await getSupabaseClient().from("vehicles").select("id").limit(1);
          health.checks.supabase = error ? "DOWN" : "UP";
        } catch (e) {
          health.checks.supabase = "DOWN";
        }
      } else {
        health.checks.supabase = "NOT_CONFIGURED";
      }

      // 3. Check Firebase Configuration
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
        health.checks.firebase = "READY";
      } else {
        health.checks.firebase = "NOT_CONFIGURED";
      }

      const isUnhealthy = health.checks.cache === "DOWN" || health.checks.supabase === "DOWN";
      
      if (isUnhealthy) {
        health.status = "DOWN";
        return res.status(503).json(health);
      }

      res.status(200).json(health);
    } catch (err: any) {
      health.status = "DOWN";
      console.error("Readiness check failed:", err.message);
      res.status(503).json(health);
    }
  });

  // Manual OTP Generator (6 digits)
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Complete Profile Route
  app.post("/api/auth/complete-profile", async (req, res) => {
    const { userId, role, name, phone, latitude, longitude, cityName, address } = req.body;
    if (!userId || !role) return res.status(400).json({ error: "User ID and role are required" });

    try {
      // Sync to Firestore profiles
      await getFirestore().collection("profiles").doc(userId).set({
        role,
        fullName: name,
        phone: phone,
        latitude,
        longitude,
        cityName,
        address,
        isProfileComplete: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      res.json({ message: "Profile updated successfully" });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: error.message });
    }
  });


  // Fetch Vehicles from Supabase
  app.get("/api/vehicles", async (req, res) => {
    try {
      // Try to get from cache first
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
      
      // Cache for 5 minutes
      await cache.setex("vehicles:all", 300, JSON.stringify(data));
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create Vehicle in Supabase
  app.post("/api/vehicles", authenticate, async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized", message: "You must be logged in to list a vehicle" });
      }
      
      const vehicleData = req.body;
      
      // Server-side validation
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

      // Invalidate cache
      await cache.del("vehicles:all");
      
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch Wishlist for User
  app.get("/api/wishlist/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const { data, error } = await getSupabaseClient()
        .from("user_wishlist")
        .select("*, vehicles(*)")
        .eq("user_id", userId);

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add to Wishlist
  app.post("/api/wishlist", async (req, res) => {
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
      console.error("Error adding to wishlist:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Remove from Wishlist
  app.delete("/api/wishlist/:userId/:vehicleId", async (req, res) => {
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
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- Reviews API Implementation ---

  // Helper to re-calculate and sync average ratings
  const syncAverageRating = async (targetId: string, targetType: 'vehicle' | 'shop') => {
    try {
      const db = getFirestore();
      
      // Calculate new average using Firestore
      const reviewsSnapshot = await db.collection("reviews")
        .where("target_id", "==", targetId)
        .where("target_type", "==", targetType)
        .get();

      const count = reviewsSnapshot.size;
      let totalRating = 0;
      reviewsSnapshot.forEach(doc => {
        totalRating += doc.data().rating;
      });

      const avg = count > 0 
        ? parseFloat((totalRating / count).toFixed(1))
        : 0;

      // Update aggregate in Firestore (optional but good for consistency)
      const targetCollection = targetType === 'vehicle' ? 'vehicles' : 'shops';
      try {
        await db.collection(targetCollection).doc(targetId).set({ 
          rating: avg, 
          reviews_count: count,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } catch (fErr) {
        // Silently fail if firestore collection doesn't exist yet
      }

      // Sync back to Supabase if possible
      try {
        const table = targetType === 'vehicle' ? 'vehicles' : 'shops';
        const { error: updateError } = await getSupabaseClient()
          .from(table)
          .update({ rating: avg, reviews_count: count })
          .eq('id', targetId);

        if (!updateError) {
          console.log(`[REVIEWS] Synced rating for ${targetType} ${targetId} to Supabase: ${avg} (${count} reviews)`);
        }
      } catch (sErr) {
        // Log quietly
        console.warn(`[REVIEWS] Supabase sync skipped for ${targetId}: ${targetType}`);
      }
      
      // Invalidate vehicle cache
      if (targetType === 'vehicle') {
        await cache.del("vehicles:all");
      }
    } catch (error) {
      console.error(`[REVIEWS] Error syncing average rating:`, error);
    }
  };

  // Get Reviews for a target
  app.get("/api/reviews/:targetType/:targetId", async (req, res) => {
    const { targetType, targetId } = req.params;
    
    if (!['vehicle', 'shop'].includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type" });
    }

    try {
      const reviewsSnapshot = await getFirestore().collection("reviews")
        .where("target_id", "==", targetId)
        .where("target_type", "==", targetType)
        .orderBy('created_at', 'desc')
        .get();

      const reviews = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch user profile info for each review if needed (or assume it's stored)
      // For performance, we usually store the name/role in the review itself
      
      res.json(reviews);
    } catch (error: any) {
      console.error("[REVIEWS] Error fetching reviews from Firestore:", error.message);
      res.json([]); // Return empty list on error for safety
    }
  });

  // POST Review
  app.post("/api/reviews", authenticate, async (req: any, res: any) => {
    const { userId, targetId, targetType, rating, comment, images, userName, userRole } = req.body;

    if (!req.user || req.user.uid !== userId) {
      return res.status(401).json({ error: "Unauthorized", message: "Invalid user session" });
    }

    if (!userId || !targetId || !targetType || !rating) {
      return res.status(400).json({ error: "Missing required review fields" });
    }

    try {
      const db = getFirestore();
      
      // 1. Check if user already reviewed this target
      const existingQuery = await db.collection("reviews")
        .where("user_id", "==", userId)
        .where("target_id", "==", targetId)
        .where("target_type", "==", targetType)
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        return res.status(409).json({ error: "You have already reviewed this item" });
      }

      // 2. Insert Review into Firestore
      const newReview = {
        user_id: userId,
        user_name: userName || req.user.name || "Anonymous",
        user_role: userRole || "buyer",
        target_id: targetId,
        target_type: targetType,
        rating: Number(rating),
        comment: comment || "",
        images: images || [],
        created_at: new Date().toISOString()
      };

      const docRef = await db.collection("reviews").add(newReview);

      // 3. Sync Average
      syncAverageRating(targetId, targetType);

      res.status(201).json({ 
        message: "Review submitted successfully", 
        review: { id: docRef.id, ...newReview } 
      });
    } catch (error: any) {
      console.error("[REVIEWS] Error submitting review to Firestore:", error.message);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful Shutdown Logic
  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Starting graceful shutdown...`);
    server.close(async () => {
      console.log("HTTP server closed.");
      try {
        await cache.quit();
        console.log("Cache closed.");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
      }
    });

    // Force close after 10s
    setTimeout(() => {
      console.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
