import { Shop } from '@/types';
import { supabase } from '@/lib/supabase';
import { MOCK_DEALERS } from '@/constants/mockData';
import { logger } from '@/lib/logger';

export const shopService = {
  async fetchShops(): Promise<Shop[]> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205') {
          logger.warn('Table "shops" not found in Supabase. Falling back to mock data.');
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
        logo: s.logo,
        bannerImage: s.banner_image,
        website: s.website,
        businessHours: s.business_hours,
        rating: s.rating,
        reviewsCount: s.reviews_count,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      })) as Shop[];
    } catch (error) {
      logger.error('Error fetching shops', { data: error });
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
        logo: data.logo,
        bannerImage: data.banner_image,
        website: data.website,
        businessHours: data.business_hours,
        rating: data.rating,
        reviewsCount: data.reviews_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Shop;
    } catch (error) {
      logger.error('Error fetching user shop', { data: error });
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
        logo: data.logo,
        bannerImage: data.banner_image,
        website: data.website,
        businessHours: data.business_hours,
        rating: data.rating,
        reviewsCount: data.reviews_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      } as Shop;
    } catch (error) {
      logger.error('Error fetching shop by ID', { data: error });
      return MOCK_DEALERS.find(s => s.id === shopId) || null;
    }
  },

  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    try {
      const payload: Record<string, any> = {
        owner_id: shopData.ownerId,
        name: shopData.name,
        description: shopData.description,
        address: shopData.address,
        city: shopData.city,
        state: shopData.state,
        phone: shopData.phone,
        images: shopData.images,
        map_embed_url: shopData.mapEmbedUrl,
        logo: shopData.logo,
        banner_image: shopData.bannerImage,
        website: shopData.website,
        business_hours: shopData.businessHours,
        verification_status: 'pending'
      };

      let { data, error } = await supabase
        .from('shops')
        .insert([payload])
        .select();

      if (error) {
        // Fallback if columns don't exist yet
        if (error.code === '42703' || error.code === 'PGRST204') {
          logger.warn('Shop schema mismatch, retrying with essential fields');
          const essentialPayload = {
            owner_id: payload.owner_id,
            name: payload.name,
            description: payload.description,
            address: payload.address,
            city: payload.city,
            state: payload.state,
            phone: payload.phone,
            images: payload.images,
            map_embed_url: payload.map_embed_url,
            verification_status: 'pending'
          };
          const retry = await supabase.from('shops').insert([essentialPayload]).select();
          data = retry.data;
          error = retry.error;
        }
        if (error) throw error;
      }
      
      return data![0] as unknown as Shop;
    } catch (error) {
      logger.error('Error creating shop', { data: error });
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
      logger.error('Error updating shop verification', { data: error });
      throw error;
    }
  },

  async updateShop(shopId: string, shopData: Partial<Shop>): Promise<void> {
    try {
      const payload: Record<string, any> = {
        name: shopData.name,
        description: shopData.description,
        address: shopData.address,
        city: shopData.city,
        state: shopData.state,
        phone: shopData.phone,
        images: shopData.images,
        map_embed_url: shopData.mapEmbedUrl,
        logo: shopData.logo,
        banner_image: shopData.bannerImage,
        website: shopData.website,
        business_hours: shopData.businessHours,
        updated_at: new Date().toISOString()
      };

      let { error } = await supabase
        .from('shops')
        .update(payload)
        .eq('id', shopId);

      if (error && (error.code === '42703' || error.code === 'PGRST204')) {
         const essentialPayload = {
            name: shopData.name,
            description: shopData.description,
            address: shopData.address,
            city: shopData.city,
            state: shopData.state,
            phone: shopData.phone,
            images: shopData.images,
            map_embed_url: shopData.mapEmbedUrl,
            updated_at: new Date().toISOString()
          };
          const retry = await supabase.from('shops').update(essentialPayload).eq('id', shopId);
          error = retry.error;
      }

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating shop', { data: error });
      throw error;
    }
  }
};
