import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Auto-fix URL if protocol is missing
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn('Supabase credentials missing! The application will not function correctly. Please visit the Settings > Secrets menu and provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Export the "isConfigured" flag to allow components to handle it gracefully
export const isSupabaseConfigured = isConfigured;

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get: (_, prop) => {
        if (prop === 'auth') {
          return new Proxy({} as any, {
            get: (_, authProp) => {
              return () => {
                throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
              };
            }
          });
        }
        return () => {
          throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
        };
      }
    });
