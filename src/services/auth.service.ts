import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export const authService = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  async verifyOtp(email: string, token: string) {
    // Try 'email' type first (standard for OTP/MagicLink)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      if (error) throw error;
      return data;
    } catch (err: any) {
      // If it fails with 'email' type, it might be a first-time 'signup'
      // Supabase requires the 'signup' type for the initial email confirmation code
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });
      if (error) throw error;
      return data;
    }
  }
};
