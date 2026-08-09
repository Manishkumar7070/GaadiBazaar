import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { serverLogger } from '../logger';

// Initialize Sentry with basic config if DSN is supplied
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
  serverLogger.info('Sentry SDK initialized successfully in Rate Limit Monitor middleware.');
} else {
  serverLogger.warn('SENTRY_DSN is not configured. Sentry tracking will run in mock/silent mode.');
}

/**
 * Interface representing the custom request properties augmented by express-rate-limit
 */
interface RateLimitRequest extends Request {
  rateLimit?: {
    limit: number;
    current: number;
    remaining: number;
    resetTime?: Date;
  };
}

/**
 * Custom handler function to be linked as the 'handler' parameter in express-rate-limit
 */
export const rateLimitHandler = (req: Request, res: Response, next: NextFunction, options: any) => {
  const customReq = req as RateLimitRequest;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  const userAgent = req.headers['user-agent'] || 'unknown';
  const referer = req.headers['referer'] || 'none';
  const path = req.originalUrl || req.path;
  
  const logMetadata = {
    clientIp,
    path,
    method: req.method,
    userAgent,
    referer,
    rateLimitLimit: customReq.rateLimit?.limit || options.limit || options.max,
    rateLimitCurrent: customReq.rateLimit?.current,
    rateLimitResetTime: customReq.rateLimit?.resetTime,
    headers: { ...req.headers, authorization: req.headers.authorization ? '[REDACTED]' : undefined }
  };

  // 1. Log to Winston (Server logs)
  serverLogger.error(`[Rate Limit Violation] IP ${clientIp} exceeded rate limits on path: ${path}`, logMetadata);

  // 2. Capture message in Sentry with complete contextual tags for DDoS analysis
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      scope.setTag('ip', String(clientIp));
      scope.setTag('path', path);
      scope.setTag('method', req.method);
      scope.setTag('violation_type', 'rate_limit_exceeded');
      scope.setExtra('metadata', logMetadata);
      Sentry.captureMessage(`Rate Limit Exceeded - Possible DDoS Pattern from ${clientIp}`, 'warning');
    });
  }

  // 3. Respond with configured too many requests message
  res.status(options.statusCode || 429).json(options.message || {
    error: 'Too many requests, please try again later.'
  });
};

/**
 * An express middleware to monitor general api routes and alert if requests are approaching limits
 */
export const rateLimitApproachingMonitor = (req: Request, res: Response, next: NextFunction) => {
  // express-rate-limit processes the request and appends 'rateLimit' property.
  // We hook into the post-processing phase by executing after express-rate-limit or as a inline observer.
  res.on('finish', () => {
    const customReq = req as RateLimitRequest;
    if (customReq.rateLimit) {
      const { limit, current, remaining } = customReq.rateLimit;
      const threshold = Math.floor(limit * 0.85); // Alert when 85% of limit is consumed

      if (current >= threshold) {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        const msg = `[Rate Limit Warning] IP ${clientIp} is approaching limit. Count: ${current}/${limit}`;
        
        serverLogger.warn(msg, {
          clientIp,
          path: req.originalUrl || req.path,
          current,
          limit,
          remaining
        });

        if (process.env.SENTRY_DSN) {
          Sentry.withScope((scope) => {
            scope.setLevel('info');
            scope.setTag('ip', String(clientIp));
            scope.setTag('path', req.originalUrl || req.path);
            scope.setTag('violation_type', 'approaching_limit');
            Sentry.captureMessage(`Approaching Rate Limit - ${clientIp}`, 'info');
          });
        }
      }
    }
  });

  next();
};
