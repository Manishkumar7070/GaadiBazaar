import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth.service';

interface User {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  role?: 'buyer' | 'seller' | 'dealer' | 'admin';
  isProfileComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  completeProfile: (data: { role: 'buyer' | 'seller'; fullName?: string; phone?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await refreshProfile(session.user);
      }
      setLoading(false);
    };

    checkUser();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await refreshProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async (supabaseUser: any) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.warn('Profile fetch error (might be new user):', error.message);
    }

    let role = profile?.role;
    // Admin override
    if (supabaseUser.email === '9162808640abcd@gmail.com') {
      role = 'admin';
    }

    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      fullName: profile?.full_name,
      phone: profile?.phone,
      role: role,
      isProfileComplete: profile?.is_profile_complete || false,
    });
  };

  const loginWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Google Login Error:', error);
      throw error;
    }
  };

  const completeProfile = async (profileData: { role: 'buyer' | 'seller'; fullName?: string; phone?: string }) => {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session?.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          role: profileData.role,
          full_name: profileData.fullName,
          phone: profileData.phone,
          is_profile_complete: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setUser(prev => prev ? {
        ...prev,
        role: profileData.role,
        fullName: profileData.fullName || prev.fullName,
        phone: profileData.phone || prev.phone,
        isProfileComplete: true,
      } : null);
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    }
  };

  const sendOtp = async (email: string) => {
    await authService.sendOtp(email);
  };

  const verifyOtp = async (email: string, code: string) => {
    await authService.verifyOtp(email, code);
  };

  const logout = async () => {
    await authService.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, sendOtp, verifyOtp, logout, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

