import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInWithGoogle, signOut as firebaseSignOut, onAuthStateChanged, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AlertCircle } from 'lucide-react';
import { User, MembershipTier } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await refreshProfile(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async (firebaseUser: any) => {
    try {
      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);
      
      const profile = profileSnap.data();

      let role = profile?.role;
      // Admin override (matching previous logic)
      if (firebaseUser.email === '9162808640abcd@gmail.com') {
        role = 'admin';
      }

      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        fullName: profile?.fullName || firebaseUser.displayName || '',
        phone: profile?.phone || firebaseUser.phoneNumber || '',
        role: role || 'buyer',
        isProfileComplete: profile?.isProfileComplete || false,
        walletBalance: profile?.walletBalance || 0,
        membershipTier: (profile?.membershipTier as MembershipTier) || 'none',
        membershipExpiresAt: profile?.membershipExpiresAt,
        latitude: profile?.latitude,
        longitude: profile?.longitude,
        cityName: profile?.cityName,
        address: profile?.address,
        createdAt: profile?.createdAt?.toDate ? profile.createdAt.toDate().toISOString() : (profile?.createdAt || new Date().toISOString()),
      });
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google Sign-In Error:', error);
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
    if (!auth.currentUser) return;

    try {
      const profileRef = doc(db, 'profiles', auth.currentUser.uid);
      await setDoc(profileRef, {
        fullName: profileData.fullName,
        role: profileData.role,
        phone: profileData.phone,
        latitude: profileData.latitude,
        longitude: profileData.longitude,
        cityName: profileData.cityName,
        address: profileData.address,
        isProfileComplete: true,
        updatedAt: serverTimestamp(),
        // Only set these if it's a new profile
        createdAt: serverTimestamp(),
        walletBalance: 0,
        membershipTier: 'none'
      }, { merge: true });

      setUser(prev => prev ? {
        ...prev,
        role: profileData.role,
        fullName: profileData.fullName || prev.fullName,
        phone: profileData.phone || prev.phone,
        latitude: profileData.latitude || prev.latitude,
        longitude: profileData.longitude || prev.longitude,
        cityName: profileData.cityName || prev.cityName,
        address: profileData.address || prev.address,
        isProfileComplete: true,
      } : null);
    } catch (error) {
      console.error('Error completing profile:', error);
      throw error;
    }
  };

  const logout = async () => {
    await firebaseSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
};


