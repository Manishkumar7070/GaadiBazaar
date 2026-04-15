import { Vehicle, VerificationStatus } from '@/types';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp, doc, updateDoc } from 'firebase/firestore';

export const vehicleService = {
  async fetchVehicles(filters?: { shopId?: string; sellerId?: string; verificationStatus?: VerificationStatus }): Promise<Vehicle[]> {
    const path = 'vehicles';
    try {
      let q = query(collection(db, path), orderBy('createdAt', 'desc'));
      
      if (filters?.shopId) {
        q = query(collection(db, path), where('shopId', '==', filters.shopId), orderBy('createdAt', 'desc'));
      } else if (filters?.sellerId) {
        q = query(collection(db, path), where('sellerId', '==', filters.sellerId), orderBy('createdAt', 'desc'));
      } else if (filters?.verificationStatus) {
        q = query(collection(db, path), where('verificationStatus', '==', filters.verificationStatus), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp)?.toDate()?.toISOString() || new Date().toISOString()
      } as Vehicle));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const path = 'vehicles';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...vehicleData,
        status: 'active',
        verificationStatus: 'pending',
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, ...vehicleData } as Vehicle;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateVehicleVerification(vehicleId: string, status: 'verified' | 'rejected'): Promise<void> {
    const path = `vehicles/${vehicleId}`;
    try {
      const docRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(docRef, { verificationStatus: status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  }
};
