import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";
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
    'TWILIO_ACCOUNT_SID', 
    'TWILIO_AUTH_TOKEN',
    'TWILIO_VERIFY_SERVICE_SID'
  ];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    console.warn(`[WARN] Missing environment variables: ${missingVars.join(', ')}. Some API features will be disabled.`);
  }

  // Supabase Client (Lazy initialization)
  let supabaseClientInstance: any = null;
  const getSupabaseClient = () => {
    if (!supabaseClientInstance) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error("Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are required");
      }
      supabaseClientInstance = createClient(url, key);
    }
    return supabaseClientInstance;
  };

  // Twilio Client (Lazy initialization)
  let twilioClientInstance: any = null;
  const getTwilioClient = () => {
    if (!twilioClientInstance) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      
      if (!accountSid || !authToken) {
        throw new Error("Twilio credentials (ACCOUNT_SID or AUTH_TOKEN) are missing");
      }
      
      twilioClientInstance = twilio(accountSid, authToken);
    }
    return twilioClientInstance;
  };

  // Circuit Breaker for Supabase
  const supabaseBreaker = new CircuitBreaker(async (fn: any) => await fn(), {
    timeout: 3000, // If the function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
    resetTimeout: 30000, // After 30 seconds, try again
  });

  supabaseBreaker.on("open", () => console.warn("Supabase Circuit Breaker OPEN"));
  supabaseBreaker.on("close", () => console.log("Supabase Circuit Breaker CLOSED"));

  // Circuit Breaker for Twilio
  const twilioBreaker = new CircuitBreaker(async (fn: any) => await fn(), {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  });

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
        twilio: "NOT_CONFIGURED"
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

      // 3. Check Twilio Configuration
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        health.checks.twilio = process.env.TWILIO_VERIFY_SERVICE_SID ? "READY" : "CONFIGURED_NO_VERIFY";
      } else {
        health.checks.twilio = "NOT_CONFIGURED";
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

  // OTP Send Route (Twilio Implementation)
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email, phone } = req.body;
    const identifier = email || phone;
    const channel = email ? "email" : "sms";

    console.log(`[AUTH] OTP request for: ${identifier} via ${channel}`);

    if (!identifier) return res.status(400).json({ error: "Email or Phone is required" });

    try {
      const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

      // Twilio Verify (Natively supports SMS and Email)
      if (verifyServiceSid) {
        try {
          await twilioBreaker.fire(async () => {
            await getTwilioClient().verify.v2
              .services(verifyServiceSid)
              .verifications.create({ to: identifier, channel });
          });
          
          console.log(`[AUTH] Sent Twilio Verify OTP to ${identifier} via ${channel}`);
          return res.json({ message: `OTP sent successfully via Twilio ${channel}`, status: "sent" });
        } catch (error: any) {
          console.error("[AUTH] Twilio Verify error:", error);
          
          if (error.message === 'Breaker is open') {
            throw new Error('Our verification service is currently under heavy load. Please try again in 30 seconds.');
          }
          
          if (error.message && (error.message.includes('Authenticate') || error.status === 401)) {
            throw new Error('Verification service configuration error. Please contact the administrator.');
          }
          throw error;
        }
      }

      // PRIORITY 2: Manual Development Mode (Last Resort)
      console.warn("[AUTH] No Twilio Verify service found. Falling back to manual mode.");
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await getSupabaseClient().from("otps").insert([{ email: identifier, code, expires_at: expiresAt }]);
      
      return res.json({ 
        message: "OTP sent (Manual/Dev Mode)",
        isManual: true,
        code: process.env.NODE_ENV !== "production" ? code : undefined
      });

    } catch (error: any) {
      console.error("[AUTH] Error sending OTP:", error);
      const errorMessage = error instanceof Error ? error.message : "Internal server error during OTP dispatch";
      res.status(500).json({ error: errorMessage });
    }
  });

  // OTP Verify Route (Twilio Implementation)
  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, phone, code } = req.body;
    const identifier = email || phone;

    if (!identifier || !code) return res.status(400).json({ error: "Identifier and code are required" });

    try {
      let isVerified = false;
      const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

      if (!verifyServiceSid) {
        // Fallback check in DB
        const { data: otpData } = await getSupabaseClient()
          .from("otps")
          .select("*")
          .eq("email", identifier)
          .eq("code", code)
          .gt("expires_at", new Date().toISOString())
          .limit(1);

        if (otpData && otpData.length > 0) {
          isVerified = true;
          await getSupabaseClient().from("otps").delete().eq("email", identifier);
        }
      } else {
        // Verify with Twilio
        try {
          const verification = await getTwilioClient().verify.v2
            .services(verifyServiceSid)
            .verificationChecks.create({ to: identifier, code });

          if (verification.status === "approved") {
            isVerified = true;
          }
        } catch (error: any) {
          console.error("[AUTH] Twilio verification error:", error);
          if (error.message && (error.message.includes('Authenticate') || error.status === 401)) {
            throw new Error('Verification service is temporarily unavailable (Configuration Error).');
          }
          throw error;
        }
      }

      if (!isVerified) {
        return res.status(401).json({ error: "Invalid or expired OTP code" });
      }

      // Login/User logic
      let user = null;
      const loginEmail = email || `${phone.replace('+', '')}@phone.verify`;

      try {
        const { data: userData, error: listError } = await getSupabaseClient().auth.admin.listUsers();
        if (listError) throw listError;
        
        const existingUser = userData?.users?.find((u: any) => u.email === loginEmail || u.user_metadata?.phone === phone);

        if (existingUser) {
          user = existingUser;
        } else {
          const { data: newUser, error: createError } = await getSupabaseClient().auth.admin.createUser({
            email: loginEmail,
            email_confirm: true,
            user_metadata: { 
              auth_method: "twilio_otp",
              phone: phone 
            }
          });
          if (createError) throw createError;
          user = newUser.user;
        }

        // Generate session link
        const { data: linkData, error: linkError } = await getSupabaseClient().auth.admin.generateLink({
          type: 'magiclink',
          email: loginEmail,
          options: { redirectTo: process.env.VITE_APP_URL || req.get('origin') || 'http://localhost:3000' }
        });

        if (linkError) throw linkError;

        return res.json({ 
          status: "verified", 
          user,
          hashedToken: linkData.properties.hashed_token
        });

      } catch (authError: any) {
        console.error("[AUTH] Supabase Admin Error:", authError);
        const msg = authError.message === "Authenticate" 
          ? "System authentication error. Our team has been notified. Please try again later."
          : authError.message;
        throw new Error(msg);
      }

    } catch (error: any) {
      console.error("[AUTH] Error verifying OTP:", error.message);
      res.status(500).json({ error: error.message });
    }
  });


  // Complete Profile Route
  app.post("/api/auth/complete-profile", async (req, res) => {
    const { userId, role, name, phone } = req.body;
    if (!userId || !role) return res.status(400).json({ error: "User ID and role are required" });

    try {
      const { data, error } = await getSupabaseClient().auth.admin.updateUserById(userId, {
        user_metadata: {
          role,
          full_name: name,
          phone: phone,
        },
      });

      if (error) throw error;
      res.json({ message: "Profile updated successfully", user: data.user });
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
  app.post("/api/vehicles", async (req, res) => {
    try {
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
