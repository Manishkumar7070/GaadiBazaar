import { supabase } from '@/lib/supabase';
import { User, VerificationStatus } from '@/types';
import { logger } from '@/lib/logger';

export const userService = {
  async fetchUsers(role?: 'seller' | 'dealer' | 'buyer' | 'admin'): Promise<User[]> {
    try {
      let query = supabase.from('profiles').select('*').order('updated_at', { ascending: false });
      
      if (role) {
        query = query.eq('role', role);
      }
      
      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        fullName: item.full_name || 'User',
        phone: item.phone || '',
        role: item.role || 'buyer',
        email: item.email || '',
        latitude: item.latitude,
        longitude: item.longitude,
        cityName: item.city_name,
        address: item.address,
        isProfileComplete: item.is_profile_complete || false,
        rating: Number(item.rating || 0),
        reviewsCount: item.reviews_count || 0,
        responseTime: item.response_time,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      } as any));
    } catch (error) {
      logger.error('Error fetching users from Supabase', { data: error });
      return [];
    }
  },

  async updateUserVerification(userId: string, _status: VerificationStatus): Promise<void> {
    try {
      // Profiles doesn't have verification_status under raw sql, but we update updated_at or generic status if expected
      const { error } = await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      logger.info('User metadata updated in Supabase', { data: { userId } });
    } catch (error) {
      logger.error('Error updating user in Supabase', { data: error });
    }
  },

  async fetchUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        fullName: data.full_name || 'User',
        phone: data.phone || '',
        role: data.role || 'buyer',
        email: data.email || '',
        latitude: data.latitude,
        longitude: data.longitude,
        cityName: data.city_name,
        address: data.address,
        isProfileComplete: data.is_profile_complete || false,
        rating: Number(data.rating || 0),
        reviewsCount: data.reviews_count || 0,
        responseTime: data.response_time,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as any;
    } catch (error) {
      logger.error('Error fetching user from Supabase by id', { data: error });
      return null;
    }
  }
};
