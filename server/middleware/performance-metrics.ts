import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { serverLogger } from '../logger';

/**
 * Performance Metrics Middleware
 * Intercepts all incoming API requests, measures response latency precisely, 
 * and outputs structured metrics to Winston for parsing/ingestion by Prometheus or Grafana.
 */
export const performanceMetrics = (req: Request, res: Response, next: NextFunction) => {
  const hrStartJoin = process.hrtime();
  
  res.on('finish', () => {
    const hrDiff = process.hrtime(hrStartJoin);
    // Convert high-resolution real time to milliseconds
    const responseTimeMs = (hrDiff[0] * 1e3 + hrDiff[1] * 1e-6).toFixed(3);
    const numericResponseTime = parseFloat(responseTimeMs);
    
    // Normalize path to exclude dynamic route identifiers for aggregated dashboard indexing
    let routePattern = req.route?.path;
    if (!routePattern || routePattern === '/' || routePattern === '*') {
      routePattern = req.originalUrl || req.path;
    }
    // Strip trailing query parameters
    routePattern = routePattern.split('?')[0];

    const statusCode = res.statusCode;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    const logPayload = {
      measure: 'http_response_time',
      method: req.method,
      pattern: routePattern,
      originalUrl: req.originalUrl || req.path,
      statusCode,
      durationMs: numericResponseTime,
      clientIp,
      contentLength: res.get('content-length') ? parseInt(res.get('content-length') as string, 10) : undefined,
    };

    // Classify performance category for easier alerting
    let performanceCategory = 'optimal';
    if (numericResponseTime > 1000) {
      performanceCategory = 'critical';
    } else if (numericResponseTime > 500) {
      performanceCategory = 'warning';
    } else if (numericResponseTime > 200) {
      performanceCategory = 'nominal';
    }

    const logMessage = `[PERF] ${req.method} ${routePattern} - Status: ${statusCode} - Time: ${responseTimeMs}ms (${performanceCategory})`;

    if (performanceCategory === 'critical') {
      serverLogger.error(logMessage, { ...logPayload, performanceCategory });
    } else if (performanceCategory === 'warning') {
      serverLogger.warn(logMessage, { ...logPayload, performanceCategory });
    } else {
      serverLogger.info(logMessage, { ...logPayload, performanceCategory });
    }

    // Capture performance bottleneck events directly in Sentry if configured
    if (process.env.SENTRY_DSN && (performanceCategory === 'critical' || performanceCategory === 'warning')) {
      Sentry.withScope((scope) => {
        scope.setLevel(performanceCategory === 'critical' ? 'error' : 'warning');
        scope.setTag('method', req.method);
        scope.setTag('route', routePattern);
        scope.setTag('status_code', String(statusCode));
        scope.setTag('performance_category', performanceCategory);
        scope.setExtra('duration_ms', numericResponseTime);
        scope.setExtra('client_ip', clientIp);
        scope.setExtra('original_url', req.originalUrl || req.path);
        
        Sentry.captureMessage(`[PERFORMANCE ALERT] Slow Response: ${req.method} ${routePattern} took ${responseTimeMs}ms`);
      });
    }
  });

  next();
};
