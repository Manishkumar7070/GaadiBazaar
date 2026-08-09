import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { serverLogger } from '../logger';

// Initialize Sentry with basic config if SENTRY_DSN is configured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
  serverLogger.info('Sentry SDK initialized in Error Tracker Sub-System.');
}

interface CustomErrorRequest extends Request {
  user?: {
    uid?: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
}

// Multi-tier sanitizer to remove keys containing passwords, pins, OTPs, or authentication tokens
const sanitizePayload = (body: any): any => {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'token', 'cvv', 'card', 'secret', 'otp_code', 'otp', 'authorization'];
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
 * Deep Error Tracker utility for capturing unhandled exceptions.
 * Processes the error, enriches it with extensive request metadata and user context,
 * logs it with Winston, and dispatches it to Sentry for real-time alerting.
 */
export const errorTracker = (err: any, req: CustomErrorRequest, res: Response, next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const path = req.originalUrl || req.path;
  
  const actorId = req.user?.uid || null;
  const actorEmail = req.user?.email || null;
  const actorRole = req.user?.role || null;

  const errorMetadata = {
    method: req.method,
    path,
    statusCode,
    clientIp,
    userAgent: req.headers['user-agent'] || 'unknown',
    userContext: {
      userId: actorId,
      email: actorEmail,
      role: actorRole
    },
    request: {
      headers: sanitizePayload(req.headers || {}),
      body: sanitizePayload(req.body || {}),
      params: req.params || {},
      query: req.query || {}
    },
    errorMessage: err.message || 'No explicit error message',
    errorStack: err.stack || null,
    errorDetails: err.details || err.data || null
  };

  // 1. Log to server logs via Winston with all context
  serverLogger.error(`[UNHANDLED ERROR] ${req.method} ${path} - Status: ${statusCode} - Msg: ${err.message || err}`, {
    error: err.message || err,
    stack: err.stack,
    metadata: errorMetadata
  });

  // 2. Report to Sentry with complete structural tagging and user context
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      // Set level of error
      scope.setLevel(statusCode >= 500 ? 'error' : 'warning');
      
      // Set core context tags
      scope.setTag('method', req.method);
      scope.setTag('path', path);
      scope.setTag('status_code', String(statusCode));
      
      if (actorId) scope.setTag('user_id', String(actorId));
      if (actorEmail) scope.setTag('user_email', String(actorEmail));
      if (actorRole) scope.setTag('user_role', String(actorRole));

      // Append rich request contexts
      scope.setContext('user_context', {
        id: actorId,
        email: actorEmail,
        role: actorRole,
        ip: clientIp
      });

      scope.setContext('request_payloads', {
        body: errorMetadata.request.body,
        params: errorMetadata.request.params,
        query: errorMetadata.request.query,
        headers: errorMetadata.request.headers
      });

      if (err.details || err.data) {
        scope.setContext('error_details', {
          details: err.details || err.data
        });
      }

      // Capture Exception
      Sentry.captureException(err);
    });
  }

  // 3. Return a clean API response
  res.status(statusCode).json({
    error: process.env.NODE_ENV === "production" 
      ? "An internal error occurred. Our team has been notified." 
      : err.message || "An unexpected error occurred."
  });
};
