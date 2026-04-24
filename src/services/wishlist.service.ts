import { supabase } from '@/lib/supabase';
import { WishlistItem } from '../types';

class WishlistService {
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('*, vehicles(*)')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        vehicleId: item.vehicle_id,
        createdAt: item.created_at,
        vehicle: item.vehicles
      }));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }

  async addToWishlist(userId: string, vehicleId: string): Promise<WishlistItem> {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .insert([{ user_id: userId, vehicle_id: vehicleId }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error('Already in wishlist');
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        vehicleId: data.vehicle_id,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  async removeFromWishlist(userId: string, vehicleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('vehicle_id', vehicleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  }
}

export const wishlistService = new WishlistService();
