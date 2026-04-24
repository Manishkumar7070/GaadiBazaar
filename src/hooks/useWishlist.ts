import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { WishlistItem } from '@/types';
import { wishlistService } from '@/services/wishlist.service';

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    if (!user) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const items = await wishlistService.getWishlist(user.id);
      setWishlist(items);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, [user]);

  const isInWishlist = (vehicleId: string) => {
    return wishlist.some(item => item.vehicleId === vehicleId);
  };

  const toggleWishlist = async (vehicleId: string) => {
    if (!user) return;
    
    const isItemInWishlist = isInWishlist(vehicleId);
    
    try {
      if (isItemInWishlist) {
        await wishlistService.removeFromWishlist(user.id, vehicleId);
        setWishlist(prev => prev.filter(item => item.vehicleId !== vehicleId));
      } else {
        const newItem = await wishlistService.addToWishlist(user.id, vehicleId);
        setWishlist(prev => [...prev, newItem]);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  return { wishlist, loading, isInWishlist, toggleWishlist, refreshWishlist: loadWishlist };
};
