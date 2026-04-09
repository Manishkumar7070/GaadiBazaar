import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Supabase Client (Server-side)
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Twilio Client
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // OTP Send Route
  app.post("/api/auth/send-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
      // Using Twilio Verify Service if SID is provided
      if (process.env.TWILIO_VERIFY_SERVICE_SID) {
        await twilioClient.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({ to: email, channel: "email" });
        
        return res.json({ message: "OTP sent successfully" });
      } else {
        // Fallback or custom implementation
        return res.status(501).json({ error: "Twilio Verify Service SID not configured" });
      }
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
      const { data, error } = await supabase
        .from("vehicles")
        .select("*");
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
