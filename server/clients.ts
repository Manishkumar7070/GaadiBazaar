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
    
    serverLogger.info(`Initializing Supabase Client with URL: ${url}`);
    
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    
    const customFetch = (rawUrl: any, rawOptions: any) => {
       const controller = new AbortController();
       const id = setTimeout(() => controller.abort(), 10000); // 10s budget for physical latency or database cold-starts
       return fetch(rawUrl, {
         ...rawOptions,
         signal: controller.signal
       }).finally(() => clearTimeout(id));
     };

    supabaseClientInstance = createClient(url, key, {
      global: {
        fetch: customFetch
      }
    });
  }
  return supabaseClientInstance;
};

// Firebase Admin (Lazy initialization with safe fallbacks)
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

    serverLogger.info(`Initializing Firebase Admin for project: ${projectId || 'unconfigured'}`);

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
      } else if (projectId) {
        // Fallback to Application Default Credentials but with specific projectId
        firebaseAdminInstance = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: projectId || undefined,
        }, "admin-app-" + Date.now());
      } else {
        serverLogger.warn("No firebase project configured on backend. Returning dummy auth instances.");
        return null;
      }
    } catch (err: any) {
      serverLogger.warn("Failed to initialize Firebase Admin gracefully", { error: err.message });
      return null;
    }
  }
  return firebaseAdminInstance;
};

export const getFirestore = () => {
  const adminApp = getFirebaseAdmin();
  if (!adminApp) {
    serverLogger.warn("Firebase Admin unconfigured. getFirestore returning dummy handler.");
    return null;
  }
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
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_Stxh0jbmCj7dY7';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '976YpoKpCMq7ouV40MNjyrNo';
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
