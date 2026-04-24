import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! The application will not function correctly. Please visit the Settings > Secrets menu and provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Default to a safe object structure if initialization fails to prevent total app breakage
// though most features will still fail, it won't be an "Uncaught Error" on load.
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);
