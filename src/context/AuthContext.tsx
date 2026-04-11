import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (email: string, code: string) => Promise<User>;
  logout: () => void;
  sendOtp: (email: string) => Promise<void>;
  completeProfile: (data: { role: 'buyer' | 'seller'; fullName?: string; phone?: string }) => Promise<void>;
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

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const sendOtp = async (email: string) => {
    await authService.sendOtp(email);
  };

  const login = async (email: string, code: string) => {
    const data = await authService.verifyOtp(email, code);
    const userData: User = {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name,
      phone: data.user.user_metadata?.phone || data.user.phone,
      role: data.user.user_metadata?.role,
      isProfileComplete: !!data.user.user_metadata?.role,
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const completeProfile = async (profileData: { role: 'buyer' | 'seller'; fullName?: string; phone?: string }) => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          role: profileData.role,
          name: profileData.fullName,
          phone: profileData.phone 
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const updatedUser = {
        ...user,
        role: profileData.role,
        fullName: profileData.fullName || user.fullName,
        phone: profileData.phone || user.phone,
        isProfileComplete: true,
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sendOtp, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

