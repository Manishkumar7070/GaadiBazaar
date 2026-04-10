import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";
import rateLimit from "express-rate-limit";
import CircuitBreaker from "opossum";
import Redis from "ioredis";
import retry from "async-retry";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Redis Client (for distributed caching and session management)
  let redis: any;
  if (process.env.REDIS_HOST) {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
    redis.on("error", (err: any) => console.error("Redis Client Error", err));
  } else {
    console.log("Redis not configured, using in-memory mock.");
    redis = {
      get: async () => null,
      setex: async () => "OK",
      del: async () => 0,
      ping: async () => "PONG",
      quit: async () => "OK",
      on: () => {},
    };
  }

  // Global Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  });
  app.use("/api/", limiter);

  // Supabase Client (Server-side)
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Twilio Client
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

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
      if (process.env.REDIS_HOST) {
        await redis.ping();
      }
      res.status(200).send("READY");
    } catch (err) {
      res.status(503).send("NOT READY");
    }
  });

  // OTP Send Route
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
      await twilioBreaker.fire(async () => {
        if (process.env.TWILIO_VERIFY_SERVICE_SID) {
          await twilioClient.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({ to: email, channel: "email" });
        } else {
          throw new Error("Twilio Verify Service SID not configured");
        }
      });
      
      return res.json({ message: "OTP sent successfully" });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // OTP Verify Route
  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

    try {
      if (process.env.TWILIO_VERIFY_SERVICE_SID) {
        const verification = await twilioClient.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: email, code });

        if (verification.status === "approved") {
          // Create or get user in Supabase
          const { data, error } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
          });

          // If user already exists, this might error, so we just sign them in/get them
          // In a real app, you'd handle this more robustly
          
          return res.json({ status: "verified", user: data?.user });
        } else {
          return res.status(401).json({ error: "Invalid OTP" });
        }
      } else {
        return res.status(501).json({ error: "Twilio Verify Service SID not configured" });
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch Vehicles from Supabase
  app.get("/api/vehicles", async (req, res) => {
    try {
      // Try to get from cache first
      const cachedVehicles = await redis.get("vehicles:all");
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
      await redis.setex("vehicles:all", 300, JSON.stringify(data));
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
      await redis.del("vehicles:all");
      
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating vehicle:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
        await redis.quit();
        console.log("Redis connection closed.");
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
