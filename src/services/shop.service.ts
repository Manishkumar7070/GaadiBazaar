import { Shop } from '@/types';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export const shopService = {
  async fetchShops(): Promise<Shop[]> {
    const path = 'shops';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
      } as Shop));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async fetchUserShop(userId: string): Promise<Shop | null> {
    const path = 'shops';
    try {
      const q = query(collection(db, path), where('ownerId', '==', userId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const docData = snapshot.docs[0];
      return {
        id: docData.id,
        ...docData.data(),
        createdAt: (docData.data().createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
      } as Shop;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async fetchShopById(shopId: string): Promise<Shop | null> {
    const path = `shops/${shopId}`;
    try {
      const docRef = doc(db, 'shops', shopId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
      } as Shop;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    const path = 'shops';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...shopData,
        verificationStatus: 'pending',
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...shopData } as Shop;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateShopVerification(shopId: string, status: 'verified' | 'rejected'): Promise<void> {
    const path = `shops/${shopId}`;
    try {
      const docRef = doc(db, 'shops', shopId);
      await updateDoc(docRef, { verificationStatus: status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  }
};
