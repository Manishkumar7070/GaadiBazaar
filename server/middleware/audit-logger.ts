import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../clients';
import { serverLogger } from '../logger';

interface AuditRequest extends Request {
  user?: {
    uid?: string;
    email?: string;
    [key: string]: any;
  };
}

// Check if string matches UUID format precisely
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper to project database table names based on API resource path
const inferTargetTable = (path: string): string => {
  const lowerPath = path.toLowerCase();
  if (lowerPath.includes('/vehicles') || lowerPath.includes('/cars')) return 'cars';
  if (lowerPath.includes('/payments') || lowerPath.includes('/transactions')) return 'transactions';
  if (lowerPath.includes('/reviews')) return 'reviews';
  if (lowerPath.includes('/dealers') || lowerPath.includes('/shops')) return 'dealers';
  if (lowerPath.includes('/media')) return 'car_media';
  if (lowerPath.includes('/auth') || lowerPath.includes('/users')) return 'users';
  return 'unknown';
};

// Extractor to find target resource identifiers
const extractTargetId = (req: Request): string | null => {
  const sources = [
    req.params?.id,
    req.body?.id,
    req.body?.carId,
    req.body?.car_id,
    req.body?.dealerId,
    req.body?.dealer_id,
  ];

  for (const val of sources) {
    if (typeof val === 'string' && isUUID(val)) {
      return val;
    }
  }

  // Fallback to searching URL path segments for UUID keys
  const urlParts = (req.originalUrl || req.path || '').split('/');
  for (const part of urlParts) {
    if (isUUID(part)) {
      return part;
    }
  }

  return null;
};

// Multi-tier sanitizer to remove credentials and API secrets
const sanitizePayload = (body: any): any => {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'token', 'cvv', 'card', 'secret', 'otp_code', 'otp'];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key]);
    }
  }
  return sanitized;
};

/**
 * Audit Logging Middleware
 * Intercepts all write requests (POST, PUT, PATCH, DELETE) to Winston and Postgres
 */
export const auditLogger = (req: AuditRequest, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'OPTIONS') {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', async () => {
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const userAgent = req.headers['user-agent'] || 'unknown';
      const path = req.originalUrl || req.path;
      
      const actorId = req.user?.uid && isUUID(req.user.uid) ? req.user.uid : null;
      const action = `${req.method} ${path.split('?')[0]}`;
      const targetTable = inferTargetTable(path);
      const targetId = extractTargetId(req);
      const responseTimeMs = Date.now() - startTime;

      const metadata = {
        method: req.method,
        path,
        ip: clientIp,
        userAgent,
        statusCode: res.statusCode,
        responseTimeMs,
        userEmail: req.user?.email || null,
        rawActorId: req.user?.uid || null,
        requestBody: sanitizePayload(req.body || {}),
        requestParams: req.params || {},
        requestQuery: req.query || {}
      };

      // 1. Winston Server Logging
      serverLogger.info(`[AUDIT] Action: ${action} | Actor: ${req.user?.email || 'Anonymous'} | Table: ${targetTable} | Status: ${res.statusCode}`, {
        actorId,
        targetTable,
        targetId,
        metadata
      });

      // 2. PostgreSQL Insertion via Supabase Client (Service Role key bypasses RLS safely)
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          actor_id: actorId,
          action,
          target_table: targetTable,
          target_id: targetId,
          payload: metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        serverLogger.warn(`[AUDIT] Database storage skip: ${error.message} (Audit captured in Winston)`, { errorMsg: error.message });
      }
    } catch (err: any) {
      serverLogger.error(`[AUDIT] Middleware exception: ${err.message}`, { error: err });
    }
  });

  next();
};
