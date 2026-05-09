import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", 1);
  app.use(cors());
  app.use(express.json());

  // Global Request Timeout
  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request Timeout" });
      }
    });
    next();
  });

  // Rate Limiting
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: (hits) => hits * 100,
    maxDelayMs: 2000,
  });

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", speedLimiter);
  app.use("/api/", limiter);

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/vehicles", vehicleRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/reviews", reviewRoutes);

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
      const { error } = await getSupabaseClient().from("vehicles").select("id").limit(1);
      if (error) health.checks.supabase = "DOWN";
      res.json(health);
    } catch {
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
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

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
}

startServer();
