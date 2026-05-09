import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInWithGoogle, handleRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { logger } from '@/lib/logger';
import { AlertCircle, WifiOff } from 'lucide-react';
import { User, MembershipTier } from '@/types';

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

  useEffect(() => {
    // Handle redirect result
    const checkRedirect = async () => {
      try {
        const result = await handleRedirectResult();
        if (result?.user) {
          logger.info('Redirect Sign-In handled', { data: result.user.uid });
        }
      } catch (error) {
        logger.error('Redirect Sign-In Error', { data: error });
      }
    };
    checkRedirect();

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) unsubscribeProfile();

      if (firebaseUser) {
        // Fallback user while loading from Firestore
        const fallbackUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || 'User',
          phone: firebaseUser.phoneNumber || '',
          role: 'buyer' as const,
          isProfileComplete: false,
          walletBalance: 0,
          membershipTier: 'none' as const,
          createdAt: new Date().toISOString(),
        };
        setUser(fallbackUser);

        // Real-time listener for profile
        const profileRef = doc(db, 'profiles', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            // Removed hardcoded admin check in favor of database-driven role
            setUser({
              ...fallbackUser,
              ...data,
              role: data.role || 'buyer',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || fallbackUser.createdAt),
            });
            setError(null);
          } else {
            // New user or no profile doc yet
            setUser(fallbackUser);
          }
          setLoading(false);
        }, (err) => {
          logger.warn('Profile listener error', { data: err });
          if (err.message?.includes('offline')) {
            // Don't show loud error for background listener issues if we have auth data
            logger.info('Client is offline, using persistence/auth data');
          } else {
            setError('Account sync issue. Please refresh.');
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setError(null);
      await signInWithGoogle();
      logger.info('Google Sign-In initiated');
    } catch (error) {
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
    if (!auth.currentUser) return;

    const path = `profiles/${auth.currentUser.uid}`;
    const profileRef = doc(db, 'profiles', auth.currentUser.uid);
    const validProfileData: any = {
      fullName: profileData.fullName,
      role: profileData.role,
      phone: profileData.phone,
      cityName: profileData.cityName,
      address: profileData.address,
      isProfileComplete: true,
      updatedAt: serverTimestamp(),
      walletBalance: 0,
      membershipTier: 'none'
    };

    // Only include location data if it exists and is valid
    if (profileData.latitude !== undefined && profileData.longitude !== undefined) {
      validProfileData.latitude = profileData.latitude;
      validProfileData.longitude = profileData.longitude;
    }

    try {
      await setDoc(profileRef, {
        ...validProfileData,
        createdAt: serverTimestamp(),
      }, { merge: true });

      setUser(prev => prev ? {
        ...prev,
        ...validProfileData,
        isProfileComplete: true,
      } : null);
      setError(null);
      logger.info('Profile completed successfully', { data: auth.currentUser.uid });
    } catch (error) {
      logger.error('Error completing profile', { data: error });
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const logout = async () => {
    await firebaseSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, logout, completeProfile }}>
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


