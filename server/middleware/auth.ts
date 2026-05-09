import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from '../clients';
import { serverLogger } from '../logger';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // Continue without user
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const adminApp = getFirebaseAdmin();
    const decodedToken = await adminApp.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    serverLogger.error("[AUTH] Firebase token verification failed", { error });
    next();
  }
};
