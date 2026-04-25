import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export const authService = {
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Use the current origin for redirection
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  async verifyOtp(email: string, token: string) {
    // Try both 'email' and 'signup' types to be safe
    const types: ('email' | 'signup')[] = ['email', 'signup'];
    
    for (const type of types) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type
        });
        if (!error && data.user) return data;
      } catch (err) {
        console.warn(`Failed verification with type ${type}`, err);
      }
    }
    
    throw new Error('Verification failed. Please check your code or try again.');
  }
};
