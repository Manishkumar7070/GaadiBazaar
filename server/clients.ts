import { createClient } from "@supabase/supabase-js";
import admin from "firebase-admin";
import { getFirestore as getFirestoreAdmin } from "firebase-admin/firestore";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { serverLogger } from "./logger";

dotenv.config();

// Supabase Client (Lazy initialization)
let supabaseClientInstance: any = null;
export const getSupabaseClient = () => {
  if (!supabaseClientInstance) {
    let url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      serverLogger.error("Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are required");
      throw new Error("Supabase credentials missing");
    }
    
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    supabaseClientInstance = createClient(url, key);
  }
  return supabaseClientInstance;
};

// Firebase Admin (Lazy initialization)
let firebaseAdminInstance: admin.app.App | null = null;
export const getFirebaseAdmin = () => {
  if (!firebaseAdminInstance) {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let configProjectId = '';
    
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        configProjectId = config.projectId;
      } catch (e) {
        serverLogger.warn("Failed to parse firebase-applet-config.json for projectId");
      }
    }

    const projectId = configProjectId || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

    serverLogger.info(`Initializing Firebase Admin for project: ${projectId}`);

    try {
      if (projectId && clientEmail && privateKeyEnv) {
        const privateKey = privateKeyEnv.replace(/\\n/g, '\n');
        firebaseAdminInstance = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        }, "admin-app-" + Date.now());
      } else {
        // Fallback to Application Default Credentials but with specific projectId
        firebaseAdminInstance = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: projectId || undefined,
        }, "admin-app-" + Date.now());
      }
    } catch (err: any) {
      serverLogger.error("Failed to initialize Firebase Admin", { error: err.message });
      throw err;
    }
  }
  return firebaseAdminInstance;
};

export const getFirestore = () => {
  const adminApp = getFirebaseAdmin();
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.firestoreDatabaseId) {
        try {
          return getFirestoreAdmin(adminApp, config.firestoreDatabaseId);
        } catch (initErr) {
          serverLogger.warn(`Specific Firestore DB ${config.firestoreDatabaseId} failed, falling back to default`, { error: initErr });
        }
      }
    }
  } catch (err) {
    serverLogger.warn("Could not load firestoreDatabaseId from config", { error: err });
  }
  return getFirestoreAdmin(adminApp);
};

// Razorpay Client (Lazy initialization)
let razorpayClientInstance: Razorpay | null = null;
export const getRazorpay = () => {
  if (!razorpayClientInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      serverLogger.error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for payments");
      throw new Error("Razorpay credentials missing");
    }
    razorpayClientInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayClientInstance;
};
