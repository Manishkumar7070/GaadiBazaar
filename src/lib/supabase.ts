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

let isSupabaseOffline = false;
let supabaseOfflineTime = 0;
const OFFLINE_THRESHOLD = 30000; // 30 seconds

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options) => {
          if (isSupabaseOffline && (Date.now() - supabaseOfflineTime < OFFLINE_THRESHOLD)) {
            return Promise.reject(new Error('Supabase is flagged offline (fast-fallback)'));
          }

          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 10000); // 10s budget

          return fetch(url, {
            ...options,
            signal: controller.signal
          }).then(res => {
            isSupabaseOffline = false;
            return res;
          }).catch(err => {
            isSupabaseOffline = true;
            supabaseOfflineTime = Date.now();
            throw err;
          }).finally(() => clearTimeout(id));
        }
      }
    })
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
