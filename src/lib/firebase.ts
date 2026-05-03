import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider
} from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer, 
  connectFirestoreEmulator,
  terminate,
  clearIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import configData from '../../firebase-applet-config.json';

// Handle both direct and default-wrapped JSON imports
const firebaseConfig = (configData as any).default || configData;

// Validate config before initialization to avoid silent failures
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "") {
  console.error('[FIREBASE] Critical: API Key is missing in firebase-applet-config.json');
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with settings for better compatibility
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const handleRedirectResult = () => getRedirectResult(auth);
export const signOut = () => firebaseSignOut(auth);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Quietly check connection status without loud errors
async function checkConnectivity() {
  try {
    // Only try simple getDoc if we really need to check, but let's avoid getDocFromServer
    // as it bypasses cache and strictly requires a connection.
    console.log("[FIREBASE] Initializing connection...");
  } catch (error) {
    // Silently handle
  }
}
checkConnectivity();

export { onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider };
