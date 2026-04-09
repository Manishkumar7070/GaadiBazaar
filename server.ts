import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Mock Infrastructure API ---
  
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });

  app.get("/api/infra/status", (req, res) => {
    res.json({
      eks: { status: "Healthy", nodes: 12, version: "1.28" },
      rds: { status: "Healthy", connections: 1240, region: "us-east-1" },
      kafka: { status: "Healthy", throughput: "45.2 MB/s", topics: 24 },
      istio: { status: "Healthy", mTLS: "Strict", meshHealth: "99.98%" },
      cloudfront: { status: "Healthy", edgeLocations: 412 }
    });
  });

  app.get("/api/infra/events", (req, res) => {
    const events = [
      { id: 1, time: new Date().toISOString(), type: "USER_CREATED", service: "user-service", severity: "info" },
      { id: 2, time: new Date(Date.now() - 300000).toISOString(), type: "AUTH_SUCCESS", service: "auth-service", severity: "info" },
      { id: 3, time: new Date(Date.now() - 600000).toISOString(), type: "DB_BACKUP_COMPLETED", service: "rds", severity: "success" },
      { id: 4, time: new Date(Date.now() - 900000).toISOString(), type: "CANARY_ROLLOUT_10%", service: "istio", severity: "warning" },
    ];
    res.json(events);
  });

  // --- Mock Microservices Endpoints ---

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "password") {
      res.json({ token: "mock-jwt-token-for-preview", user: { id: 1, username: "admin", role: "admin" } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/users/profile", (req, res) => {
    res.json({
      id: "usr_921",
      username: "jdoe",
      email: "john.doe@enterprise.com",
      role: "Platform Engineer",
      lastLogin: new Date().toISOString()
    });
  });

  // --- Vite Middleware ---

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Cloud Console running on http://localhost:${PORT}`);
  });
}

startServer();
