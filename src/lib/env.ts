/**
 * Environment variable validation at runtime
 * As recommended in the CTO roadmap to prevent startup failures
 * and improve security awareness.
 */

import { logger } from './logger';

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_RAZORPAY_KEY_ID',
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      logger.error(`CRITICAL: Missing environment variables: ${missing.join(', ')}`);
    } else {
      logger.warn(`Missing environment variables: ${missing.join(', ')}. Check your .env file.`);
    }
  }

  // Check for common misconfigurations
  if (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.startsWith('http')) {
    logger.error('VITE_SUPABASE_URL must be a valid URL starting with http/https');
  }
}
