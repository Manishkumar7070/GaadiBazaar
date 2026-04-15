import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInAnonymously,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

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
  loginQuickly: (data: { fullName?: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: userData.fullName,
            phone: userData.phone,
            role: userData.role,
            isProfileComplete: userData.isProfileComplete,
          });
        } else {
          // New user, initial state
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            isProfileComplete: false,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check if user exists in Firestore, if not create basic profile
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: firebaseUser.displayName,
          createdAt: serverTimestamp(),
          isProfileComplete: false
        });
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      throw error;
    }
  };

  const completeProfile = async (profileData: { role: 'buyer' | 'seller'; fullName?: string; phone?: string }) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        role: profileData.role,
        fullName: profileData.fullName,
        phone: profileData.phone,
        isProfileComplete: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

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

  const loginQuickly = async (data: { fullName?: string; phone?: string }) => {
    try {
      const result = await signInAnonymously(auth);
      const firebaseUser = result.user;
      
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        fullName: data.fullName || '',
        phone: data.phone || '',
        createdAt: serverTimestamp(),
        isProfileComplete: false,
        authMethod: 'anonymous'
      });
    } catch (error) {
      console.error('Quick Login Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginQuickly, logout, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

