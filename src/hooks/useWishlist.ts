import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { WishlistItem, Vehicle } from '@/types';
import { MOCK_VEHICLES } from '@/constants/mockData';

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'wishlists'), where('userId', '==', user.id));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        // Enrich with mock vehicle data for UI
        const vehicle = MOCK_VEHICLES.find(v => v.id === data.vehicleId);
        return {
          id: doc.id,
          userId: data.userId,
          vehicleId: data.vehicleId,
          createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
          vehicle
        } as WishlistItem;
      });
      setWishlist(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'wishlists');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const isInWishlist = (vehicleId: string) => {
    return wishlist.some(item => item.vehicleId === vehicleId);
  };

  const toggleWishlist = async (vehicleId: string) => {
    if (!user) return;
    
    const wishlistId = `${user.id}_${vehicleId}`;
    const isItemInWishlist = isInWishlist(vehicleId);
    
    try {
      if (isItemInWishlist) {
        await deleteDoc(doc(db, 'wishlists', wishlistId));
      } else {
        await setDoc(doc(db, 'wishlists', wishlistId), {
          userId: user.id,
          vehicleId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `wishlists/${wishlistId}`);
    }
  };

  return { wishlist, loading, isInWishlist, toggleWishlist };
};
