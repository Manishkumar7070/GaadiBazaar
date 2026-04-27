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

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Server returned invalid JSON response');
      }
    } else {
      const text = await response.text();
      throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) throw new Error(data?.error || data?.message || 'Failed to send OTP');
    return data;
  },

  async verifyOtp(identifier: { email?: string; phone?: string }, code: string) {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...identifier, code }),
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (err) {
        throw new Error('Server returned invalid JSON response');
      }
    } else {
      const text = await response.text();
      throw new Error(text || `Server error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) throw new Error(data?.error || data?.message || 'Failed to verify OTP');

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
