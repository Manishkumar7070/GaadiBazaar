import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, getDoc } from 'firebase/firestore';
import { User, VerificationStatus } from '@/types';
import { logger } from '@/lib/logger';

export const userService = {
  async fetchUsers(role?: 'seller' | 'dealer' | 'buyer' | 'admin'): Promise<User[]> {
    try {
      const usersRef = collection(db, 'profiles');
      let q = query(usersRef, orderBy('updatedAt', 'desc'));
      
      if (role) {
        q = query(usersRef, where('role', '==', role), orderBy('updatedAt', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          reviewsCount: data.reviews_count || 0,
          responseTime: data.response_time,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        } as User;
      });
    } catch (error) {
      logger.error('Error fetching users', { data: error });
      handleFirestoreError(error, OperationType.LIST, 'profiles');
      return [];
    }
  },

  async updateUserVerification(userId: string, status: VerificationStatus): Promise<void> {
    try {
      const userRef = doc(db, 'profiles', userId);
      await updateDoc(userRef, {
        verificationStatus: status,
        updatedAt: new Date()
      });
      logger.info('User verification updated', { data: { userId, status } });
    } catch (error) {
      logger.error('Error updating user verification', { data: error });
      handleFirestoreError(error, OperationType.WRITE, `profiles/${userId}`);
    }
  },

  async fetchUserById(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'profiles', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
          const data = userSnap.data();
          return {
              ...data,
              id: userSnap.id,
              reviewsCount: data.reviews_count || 0,
              responseTime: data.response_time,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          } as User;
      }
      return null;
    } catch (error) {
      logger.error('Error fetching user by id', { data: error });
      return null;
    }
  }
};
