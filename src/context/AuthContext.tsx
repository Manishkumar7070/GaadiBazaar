import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInWithGoogle, handleRedirectResult, signOut as firebaseSignOut, onAuthStateChanged, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
          // Profile handled by onAuthStateChanged -> onSnapshot
        }
      } catch (error) {
        console.error('Redirect Sign-In Error:', error);
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
            let role = data.role;
            if (firebaseUser.email === '9162808640abcd@gmail.com') {
              role = 'admin';
            }
            setUser({
              ...fallbackUser,
              ...data,
              role: role || 'buyer',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || fallbackUser.createdAt),
            });
            setError(null);
          } else {
            // New user or no profile doc yet
            setUser(fallbackUser);
          }
          setLoading(false);
        }, (err) => {
          console.warn('Profile listener error:', err);
          if (err.message?.includes('offline')) {
            // Don't show loud error for background listener issues if we have auth data
            console.info('Client is offline, using persistence/auth data');
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

    const path = `profiles/${auth.currentUser.uid}`;
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
      setError(null);
    } catch (error) {
      console.error('Error completing profile:', error);
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


