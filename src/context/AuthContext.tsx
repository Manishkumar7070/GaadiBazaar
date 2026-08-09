import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { WifiOff } from 'lucide-react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeProfile: (data: { 
    role: 'buyer' | 'seller'; 
    fullName?: string; 
    phone?: string;
    latitude?: number;
    longitude?: number;
    cityName?: string;
    address?: string;
  }) => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileAndSetUser = async (supabaseUser: any) => {
    if (!supabaseUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fallbackUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      fullName: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
      phone: supabaseUser.user_metadata?.phone || supabaseUser.phone || '',
      role: 'buyer' as const,
      isProfileComplete: false,
      walletBalance: 0,
      membershipTier: 'none' as const,
      createdAt: supabaseUser.created_at || new Date().toISOString(),
    };

    try {
      // Query profiles table
      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (dbError) throw dbError;

      if (profile) {
        setUser({
          ...fallbackUser,
          id: profile.id,
          fullName: profile.full_name || fallbackUser.fullName,
          phone: profile.phone || fallbackUser.phone,
          role: profile.role || 'buyer',
          isProfileComplete: profile.is_profile_complete || false,
          walletBalance: 0,
          membershipTier: 'none',
          createdAt: profile.created_at || fallbackUser.createdAt,
        });
      } else {
        setUser(fallbackUser);
      }
    } catch (err: any) {
      logger.warn('Failed to load user profile from Supabase db', { data: err.message });
      // Fallback gracefully so they aren't locked out of the UI
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfileAndSetUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    } catch (err) {
      logger.error('Error refreshing Supabase auth session', { data: err });
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check active session on mount
    refreshSession();

    // Listen for auth state events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info(`[AUTH EVENT] Supabase Auth event detected: ${event}`);
      if (session?.user) {
        await fetchProfileAndSetUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const { error: oAuthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (oAuthError) throw oAuthError;
      logger.info('Google Sign-In initiated successfully via Supabase');
    } catch (error: any) {
      logger.error('Google Sign-In Error', { data: error });
      throw error;
    }
  };

  const completeProfile = async (profileData: { 
    role: 'buyer' | 'seller'; 
    fullName?: string; 
    phone?: string;
    latitude?: number;
    longitude?: number;
    cityName?: string;
    address?: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error("Active session is required to complete profile setup.");
    }

    const userId = session.user.id;
    const body = {
      userId,
      role: profileData.role,
      name: profileData.fullName || 'User',
      phone: profileData.phone || session.user.phone || '',
      latitude: profileData.latitude,
      longitude: profileData.longitude,
      cityName: profileData.cityName,
      address: profileData.address
    };

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to complete profile inside backend');
      }

      // Re-fetch profile values to sync context status
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        setUser(prev => prev ? {
          ...prev,
          fullName: profile.full_name || prev.fullName,
          phone: profile.phone || prev.phone,
          role: profile.role,
          isProfileComplete: true,
        } : null);
      }
      setError(null);
      logger.info('Profile completed successfully on Supabase source');
    } catch (error: any) {
      logger.error('Error completing profile setup', { data: error });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err: any) {
      logger.error('Failed to log out cleanly', { data: err });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, logout, completeProfile, refreshSession }}>
      {children}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <WifiOff size={24} />
            <div>
              <p className="font-bold text-sm">Connection Issue</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
