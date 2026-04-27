import { Vehicle, VerificationStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { MOCK_VEHICLES } from '@/constants/mockData';

export const vehicleService = {
  async fetchVehicles(filters?: { shopId?: string; sellerId?: string; verificationStatus?: VerificationStatus }): Promise<Vehicle[]> {
    try {
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.shopId) {
        query = query.eq('shop_id', filters.shopId);
      }
      if (filters?.sellerId) {
        query = query.eq('seller_id', filters.sellerId);
      }
      if (filters?.verificationStatus) {
        query = query.eq('verification_status', filters.verificationStatus);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return (data || []).map(v => ({
        ...v,
        shopId: v.shop_id,
        sellerId: v.seller_id,
        verificationStatus: v.verification_status,
        kilometersDriven: v.kilometers_driven,
        vehicleType: v.vehicle_type,
        fuelType: v.fuel_type,
        registrationNumber: v.registration_number,
        assemblyType: v.assembly_type,
        engineStartVideo: v.engine_start_video,
        engineSoundVideo: v.engine_sound_video,
        walkaroundVideo: v.walkaround_video,
        createdAt: v.created_at,
        updatedAt: v.updated_at
      })) as any;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  },

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          seller_id: vehicleData.sellerId,
          shop_id: vehicleData.shopId,
          title: vehicleData.title,
          description: vehicleData.description,
          price: vehicleData.price,
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year,
          vehicle_type: vehicleData.vehicleType,
          fuel_type: vehicleData.fuelType,
          transmission: vehicleData.transmission,
          kilometers_driven: vehicleData.kilometersDriven,
          ownership: vehicleData.ownership,
          city: vehicleData.city,
          state: vehicleData.state,
          images: vehicleData.images,
          engine_start_video: vehicleData.engineStartVideo,
          engine_sound_video: vehicleData.engineSoundVideo,
          walkaround_video: vehicleData.walkaroundVideo,
          status: 'active',
          verification_status: 'pending'
        }])
        .select();

      if (error) throw error;
      return data[0] as any;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  async updateVehicle(vehicleId: string, vehicleData: Partial<Vehicle>): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          title: vehicleData.title,
          description: vehicleData.description,
          price: vehicleData.price,
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year,
          vehicle_type: vehicleData.vehicleType,
          fuel_type: vehicleData.fuelType,
          transmission: vehicleData.transmission,
          kilometers_driven: vehicleData.kilometersDriven,
          ownership: vehicleData.ownership,
          city: vehicleData.city,
          state: vehicleData.state,
          images: vehicleData.images,
          engine_start_video: vehicleData.engineStartVideo,
          engine_sound_video: vehicleData.engineSoundVideo,
          walkaround_video: vehicleData.walkaroundVideo,
          status: vehicleData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  async updateVehicleVerification(vehicleId: string, status: 'verified' | 'rejected'): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ verification_status: status })
        .eq('id', vehicleId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating vehicle verification:', error);
      throw error;
    }
  },

  async fetchPopularMetadata(): Promise<{ brands: string[], models: string[], cities: string[] }> {
    try {
      // In Supabase, we can use distinct or specific selects if needed
      // For now, consistent with previous behavior, fetch and aggregate
      const vehicles = await this.fetchVehicles({ verificationStatus: 'verified' });
      
      const brandsCount: Record<string, number> = {};
      const modelsCount: Record<string, number> = {};
      const citiesCount: Record<string, number> = {};

      vehicles.forEach(v => {
        if (v.brand) brandsCount[v.brand] = (brandsCount[v.brand] || 0) + 1;
        if (v.model) modelsCount[v.model] = (modelsCount[v.model] || 0) + 1;
        if (v.city) citiesCount[v.city] = (citiesCount[v.city] || 0) + 1;
      });

      const brands = Object.entries(brandsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([brand]) => brand);

      const models = Object.entries(modelsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([model]) => model);

      const cities = Object.entries(citiesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([city]) => city);

      return { brands, models, cities };
    } catch (error) {
      console.error('Error fetching popular metadata:', error);
      return { brands: [], models: [], cities: [] };
    }
  }
};
