import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import compression from "compression";
import { fileURLToPath } from "url";

// Internal modules
import { serverLogger } from "./server/logger";
import { cache } from "./server/lib/cache";
import { getSupabaseClient } from "./server/clients";

// Routes
import authRoutes from "./server/routes/auth";
import vehicleRoutes from "./server/routes/vehicles";
import paymentRoutes from "./server/routes/payments";
import reviewRoutes from "./server/routes/reviews";
import aiRoutes from "./server/routes/ai";
import mediaRoutes from "./server/routes/media";
import { rateLimitHandler, rateLimitApproachingMonitor } from "./server/middleware/rate-limit-monitor";
import { authenticate } from "./server/middleware/auth";
import { auditLogger } from "./server/middleware/audit-logger";
import { performanceMetrics } from "./server/middleware/performance-metrics";
import { errorTracker } from "./server/middleware/error-tracker";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  console.log(`Starting server with NODE_ENV=${process.env.NODE_ENV}`);

  // Security Headers in Production
  if (process.env.NODE_ENV === "production") {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "img-src": ["'self'", "data:", "https:", "http:"],
          "connect-src": ["'self'", "https://*.supabase.co", "https://*.firebaseio.com", "https://*.googleapis.com", "wss://*.run.app"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));
  } else {
    // Development headers to allow iframe embedding
    app.use((req, res, next) => {
      res.setHeader("X-Frame-Options", "ALLOWALL");
      res.setHeader("Access-Control-Allow-Origin", "*");
      next();
    });
  }

  app.set("trust proxy", 1);
  
  // Restricted CORS
  app.use(cors({
    origin: process.env.NODE_ENV === "production" 
      ? [/\.run\.app$/, /\.vercel\.app$/] 
      : "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }));

  // Payload Limits to prevent DoS
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Global Request Timeout
  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request Timeout" });
      }
    });
    next();
  });

  // Track latency for all API routes early in the stack
  app.use("/api/", performanceMetrics);

  // Rate Limiting (Production Only)
  if (process.env.NODE_ENV === "production") {
    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: 100,
      delayMs: (hits) => hits * 100,
      maxDelayMs: 2000,
    });

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5000, // Increased from 200 to 5000 to handle higher concurrent customer volumes without dropping sessions
      message: { error: "Too many requests, please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler,
    });

    app.use("/api/", speedLimiter);
    app.use("/api/", limiter);
    app.use("/api/", rateLimitApproachingMonitor);
  }

  // Auth and Resource Audit middleware layers
  app.use("/api/", authenticate);
  app.use("/api/", auditLogger);

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/vehicles", vehicleRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/media", mediaRoutes);

  // Health Checks
  app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
  app.get("/healthz", (req, res) => res.status(200).send("OK"));
  app.get("/readyz", async (req, res) => {
    const health = {
      status: "UP",
      timestamp: new Date().toISOString(),
      checks: {
        cache: "UP",
        supabase: "UP",
      }
    };
    try {
      await cache.ping();
      const client = getSupabaseClient();
      const start = Date.now();
      const { error, data } = await client.from("vehicles").select("id").limit(1);
      const duration = Date.now() - start;
      if (error) {
        health.checks.supabase = `DOWN: ${error.message} (took ${duration}ms)`;
        serverLogger.error(`Supabase health check failed: ${error.message}`, { error });
      } else {
        health.checks.supabase = `UP (took ${duration}ms)`;
      }
      res.json(health);
    } catch (err: any) {
      health.checks.supabase = `DOWN Error: ${err.message}`;
      serverLogger.error(`Supabase health check threw error: ${err.message}`, { error: err });
      res.status(503).json({ ...health, status: "DOWN" });
    }
  });

  // Client serving
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Enable micro-cached static asset serving for fast response under high load
    app.use(express.static(distPath, {
      maxAge: "1d",
      etag: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          // Entry HTML should never be cached permanently so users get new deployments instantly
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (filePath.match(/\.(js|css|woff2?|ico|png|jpe?g|svg|webp)$/)) {
          // Bundled, hashed build files can be cached permanently on users and Edge CDN layers
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));

    app.get("*", (req, res) => {
      // Prevent browser cache on index.html to ensure instant updates
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler
  app.use(errorTracker);

  const server = app.listen(PORT, "0.0.0.0", () => {
    serverLogger.info(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal: string) => {
    serverLogger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(async () => {
      try {
        await cache.quit();
        process.exit(0);
      } catch (err) {
        serverLogger.error("Error during shutdown", { error: err });
        process.exit(1);
      }
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  
  process.on("unhandledRejection", (reason) => {
    serverLogger.error("Unhandled Rejection", { reason });
  });

  process.on("uncaughtException", (error) => {
    serverLogger.error("Uncaught Exception", { error: error.message, stack: error.stack });
    // In production, you might want to gracefully shutdown and let the orchestrator restart
    // shutdown("uncaughtException");
  });
}

startServer();
