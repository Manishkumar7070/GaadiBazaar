import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin, getSupabaseClient } from '../clients';
import { serverLogger } from '../logger';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split("Bearer ")[1];

  // Try Supabase verification first, since the primary auth & database is on Supabase
  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (user && !error) {
      req.user = {
        uid: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || "User",
        role: user.user_metadata?.role || "buyer",
        ...user
      };
      serverLogger.info(`[AUTH] Supabase token verified for user ${user.id}`);
      return next();
    }
  } catch (supabaseError: any) {
    serverLogger.debug("[AUTH] Supabase verification failed, falling back to Firebase", { error: supabaseError.message });
  }

  // Fallback to Firebase verification (since OTP/Messaging might use Firebase)
  try {
    const adminApp = getFirebaseAdmin();
    if (adminApp) {
      const decodedToken = await adminApp.auth().verifyIdToken(token);
      req.user = decodedToken;
      serverLogger.info(`[AUTH] Firebase token verified for user ${decodedToken.uid}`);
      return next();
    }
  } catch (error: any) {
    serverLogger.debug("[AUTH] Firebase token verification failed", { error: error.message });
  }
  next();
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
  }
  next();
};
