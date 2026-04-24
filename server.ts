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
    message: "Too many requests from this IP, please try again after 15 minutes",
  });

  // 3. Strict Auth Rate Limiting (Prevent Brute Force/Abuse)
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 OTP requests per hour
    message: "Too many login attempts. Please try again in an hour.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", speedLimiter);
  app.use("/api/", limiter);
  app.use("/api/auth/send-otp", authLimiter);

  // Supabase Client (Server-side)
  // Use lazy check or safe init to prevent server crash if variables are missing
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("CRITICAL: Supabase server-side credentials missing. API routes depending on Supabase will fail.");
  }

  const supabase = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : (null as any);

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
    try {
      // Check dependencies
      await cache.ping();
      res.status(200).send("READY");
    } catch (err) {
      res.status(503).send("NOT READY");
    }
  });

  // OTP Send Route
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email, phone } = req.body;
    const identifier = email || phone;
    const channel = email ? "email" : "sms";

    if (!identifier) return res.status(400).json({ error: "Email or Phone is required" });

    // Development / Mock Mode
    // If Twilio is not configured, we "simulate" success for testing
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifyServiceSid) {
      console.warn("Twilio not configured. Using MOCK OTP mode.");
      // In mock mode, we just return success. The "code" to verify will be '000000'
      return res.json({ 
        message: "OTP sent successfully (MOCK MODE)", 
        isMock: true,
        note: "Twilio credentials missing. Use '000000' to verify." 
      });
    }

    try {
      await twilioBreaker.fire(async () => {
        await getTwilioClient().verify.v2
          .services(verifyServiceSid)
          .verifications.create({ to: identifier, channel });
      });
      
      return res.json({ message: "OTP sent successfully" });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      
      // Handle specific Twilio Authentication Error (20003)
      if (error.code === 20003 || (error.status === 401 && error.message?.includes('Authenticate'))) {
        return res.status(401).json({ 
          error: "Twilio Authentication Failed", 
          message: "The Twilio Account SID or Auth Token provided in your secrets is incorrect. Please verify them in the Settings > Secrets menu." 
        });
      }

      // Handle invalid service SID (20404)
      if (error.code === 20404) {
        return res.status(404).json({
          error: "Invalid Verify Service SID",
          message: "The TWILIO_VERIFY_SERVICE_SID is invalid. Please create a Verify Service in your Twilio console and update your secrets."
        });
      }

      res.status(500).json({ error: error.message });
    }
  });

  // OTP Verify Route
  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, phone, code } = req.body;
    const identifier = email || phone;

    if (!identifier || !code) return res.status(400).json({ error: "Identifier and code are required" });

    // Mock Verification
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifyServiceSid) {
      if (code === "000000") {
        return res.json({ status: "verified", user: { email: email || "mock@example.com", id: "mock-user-id" } });
      } else {
        return res.status(401).json({ error: "Invalid MOCK OTP. Use '000000'." });
      }
    }

    try {
      const verification = await getTwilioClient().verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({ to: identifier, code });

      if (verification.status === "approved") {
        // 1. Create or get user in Supabase
        let supabaseUser = null;
        try {
          const userEmail = email || `${phone}@mobile.user`;
          
          // Try to find existing user first
          const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
          const existingUser = (existingUsers as any)?.users?.find((u: any) => u.email === userEmail || u.user_metadata?.phone === phone);

          if (existingUser) {
            supabaseUser = existingUser;
          } else {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: userEmail,
              email_confirm: true,
              user_metadata: { phone, auth_method: "otp" }
            });
            if (createError) throw createError;
            supabaseUser = newUser.user;
          }
        } catch (supabaseError) {
          console.error("Supabase User Management Error:", supabaseError);
        }
        
        return res.json({ 
          status: "verified", 
          user: supabaseUser || { email: identifier } 
        });
      } else {
        return res.status(401).json({ error: "Invalid OTP" });
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);

      // Handle specific Twilio Authentication Error (20003)
      if (error.code === 20003 || (error.status === 401 && error.message?.includes('Authenticate'))) {
        return res.status(401).json({ 
          error: "Twilio Authentication Failed", 
          message: "The Twilio Account SID or Auth Token provided in your secrets is incorrect. Please verify them in the Settings > Secrets menu." 
        });
      }

      res.status(500).json({ error: error.message });
    }
  });

  // Complete Profile Route
  app.post("/api/auth/complete-profile", async (req, res) => {
    const { userId, role, name, phone } = req.body;
    if (!userId || !role) return res.status(400).json({ error: "User ID and role are required" });

    try {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
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
          const { data, error } = await supabase.from("vehicles").select("*");
          if (error) {
            if (error.code === "429") bail(new Error("Rate limited by Supabase"));
            throw error;
          }
          return data;
        }, {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 5000,
        });
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
      const data = await supabaseBreaker.fire(async () => {
        return await retry(async (bail) => {
          const { data, error } = await supabase
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
            if (error.code === "400") bail(new Error("Invalid vehicle data"));
            throw error;
          }
          return data[0];
        }, {
          retries: 2,
        });
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { error } = await supabase
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
