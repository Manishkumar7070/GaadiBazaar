import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export const authService = {
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendOtp(identifier: { email?: string; phone?: string }) {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(identifier),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  },

  async verifyOtp(identifier: { email?: string; phone?: string }, code: string) {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...identifier, code }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to verify OTP');

    // If verification was successful, use the magic link logic to complete the session
    if (data.status === 'verified' && data.hashedToken) {
      const email = identifier.email || `${identifier.phone?.replace('+', '')}@phone.verify`;
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: data.hashedToken,
        type: 'magiclink'
      });
      if (error) throw error;
      return { user: data.user };
    }
    
    throw new Error('Verification failed. Please check your code or try again.');
  }
};
