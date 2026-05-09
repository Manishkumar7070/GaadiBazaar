/**
 * Environment variable validation at runtime
 * As recommended in the CTO roadmap to prevent startup failures
 * and improve security awareness.
 */

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`CRITICAL: Missing environment variables: ${missing.join(', ')}`);
      // In production we might want to fail hard or show a maintenance page
    } else {
      console.warn(`Missing environment variables: ${missing.join(', ')}. Check your .env file.`);
    }
  }

  // Check for common misconfigurations
  if (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.startsWith('http')) {
    console.error('VITE_SUPABASE_URL must be a valid URL starting with http/https');
  }
}
