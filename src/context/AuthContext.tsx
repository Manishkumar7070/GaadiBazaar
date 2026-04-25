import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authService } from '@/services/auth.service';
import { AlertCircle } from 'lucide-react';

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
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  completeProfile: (data: { role: 'buyer' | 'seller'; fullName?: string; phone?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Configuration Needed</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Supabase environment variables are missing. If you've deployed this to Vercel, 
            make sure to add <code className="bg-slate-100 px-1 rounded text-sm font-mono tracking-tight text-pink-600">VITE_SUPABASE_URL</code> and 
            <code className="bg-slate-100 px-1 rounded text-sm font-mono tracking-tight text-pink-600">VITE_SUPABASE_ANON_KEY</code> in your project settings.
          </p>
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
          >
            Go to Supabase Dashboard
          </a>
        </div>
      </div>
    );
  }

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
    <AuthContext.Provider value={{ user, loading, sendOtp, verifyOtp, logout, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

