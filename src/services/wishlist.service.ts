import { WishlistItem } from '../types';

class WishlistService {
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    const response = await fetch(`/api/wishlist/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch wishlist');
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      vehicleId: item.vehicle_id,
      createdAt: item.created_at,
      vehicle: item.vehicles // Supabase join returns the object
    }));
  }

  async addToWishlist(userId: string, vehicleId: string): Promise<WishlistItem> {
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, vehicleId }),
    });
    if (!response.ok) {
      if (response.status === 409) throw new Error('Already in wishlist');
      throw new Error('Failed to add to wishlist');
    }
    const data = await response.json();
    return {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      createdAt: data.created_at
    };
  }

  async removeFromWishlist(userId: string, vehicleId: string): Promise<void> {
    const response = await fetch(`/api/wishlist/${userId}/${vehicleId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove from wishlist');
  }
}

export const wishlistService = new WishlistService();
