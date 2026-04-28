import { Shop } from '@/types';
import { supabase } from '@/lib/supabase';
import { MOCK_DEALERS } from '@/constants/mockData';

export const shopService = {
  async fetchShops(): Promise<Shop[]> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          console.warn('Table "shops" not found in Supabase. Falling back to mock data.');
          return MOCK_DEALERS;
        }
        throw error;
      }
      
      if (!data || data.length === 0) return MOCK_DEALERS;

      return (data || []).map(s => ({
        ...s,
        ownerId: s.owner_id,
        verificationStatus: s.verification_status,
        mapEmbedUrl: s.map_embed_url,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      })) as any;
    } catch (error) {
      console.error('Error fetching shops:', error);
      return MOCK_DEALERS;
    }
  },

  async fetchUserShop(userId: string): Promise<Shop | null> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        if (error.code === 'PGRST205') {
          return MOCK_DEALERS.find(s => s.ownerId === userId) || null;
        }
        throw error;
      }
      
      if (!data) return null;

      return {
        ...data,
        ownerId: data.owner_id,
        verificationStatus: data.verification_status,
        mapEmbedUrl: data.map_embed_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as any;
    } catch (error) {
      console.error('Error fetching user shop:', error);
      return MOCK_DEALERS.find(s => s.ownerId === userId) || null;
    }
  },

  async fetchShopById(shopId: string): Promise<Shop | null> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) {
        if (error.code === 'PGRST205') {
          return MOCK_DEALERS.find(s => s.id === shopId) || null;
        }
        throw error;
      }
      
      return {
        ...data,
        ownerId: data.owner_id,
        verificationStatus: data.verification_status,
        mapEmbedUrl: data.map_embed_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as any;
    } catch (error) {
      console.error('Error fetching shop by ID:', error);
      return MOCK_DEALERS.find(s => s.id === shopId) || null;
    }
  },

  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .insert([{
          owner_id: shopData.ownerId,
          name: shopData.name,
          description: shopData.description,
          address: shopData.address,
          city: shopData.city,
          state: shopData.state,
          phone: shopData.phone,
          images: shopData.images,
          map_embed_url: shopData.mapEmbedUrl,
          verification_status: 'pending'
        }])
        .select();

      if (error) throw error;
      return data[0] as any;
    } catch (error) {
      console.error('Error creating shop:', error);
      throw error;
    }
  },

  async updateShopVerification(shopId: string, status: 'verified' | 'rejected'): Promise<void> {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ verification_status: status })
        .eq('id', shopId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating shop verification:', error);
      throw error;
    }
  },

  async updateShop(shopId: string, shopData: Partial<Shop>): Promise<void> {
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: shopData.name,
          description: shopData.description,
          address: shopData.address,
          city: shopData.city,
          state: shopData.state,
          phone: shopData.phone,
          images: shopData.images,
          map_embed_url: shopData.mapEmbedUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating shop:', error);
      throw error;
    }
  }
};
