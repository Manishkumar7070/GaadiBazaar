import { Vehicle, VerificationStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { MOCK_VEHICLES } from '@/constants/mockData';

export const vehicleService = {
  async fetchVehicles(filters?: { shopId?: string; sellerId?: string; verificationStatus?: VerificationStatus; userCity?: string }): Promise<Vehicle[]> {
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
      
      if (error) {
        if (error.code === 'PGRST205') {
          console.warn('Table "vehicles" not found in Supabase. Falling back to mock data.');
          let fallback = MOCK_VEHICLES;
          if (filters?.shopId) fallback = fallback.filter(v => v.shopId === filters.shopId);
          if (filters?.sellerId) fallback = fallback.filter(v => v.sellerId === filters.sellerId);
          if (filters?.verificationStatus) fallback = fallback.filter(v => v.verificationStatus === filters.verificationStatus);
          
          // Sort fallback by priority and location
          return this.sortVehiclesByPriority(fallback, filters?.userCity);
        }
        throw error;
      }

      if (!data || data.length === 0) {
        let fallback = MOCK_VEHICLES;
        if (filters?.shopId) fallback = fallback.filter(v => v.shopId === filters.shopId);
        if (filters?.sellerId) fallback = fallback.filter(v => v.sellerId === filters.sellerId);
        if (filters?.verificationStatus) fallback = fallback.filter(v => v.verificationStatus === filters.verificationStatus);
        
        return this.sortVehiclesByPriority(fallback, filters?.userCity);
      }

      const vehicles = (data || []).map(v => ({
        ...v,
        shopId: v.shop_id,
        sellerId: v.seller_id,
        verificationStatus: v.verification_status,
        paymentStatus: v.payment_status,
        kilometersDriven: v.kilometers_driven,
        vehicleType: v.vehicle_type,
        fuelType: v.fuel_type,
        listingType: v.listing_type || 'free',
        priorityScore: v.priority_score || 0,
        registrationNumber: v.registration_number,
        assemblyType: v.assembly_type,
        vin: v.vin,
        imageMetadata: v.image_metadata,
        engineStartVideo: v.engine_start_video,
        engineSoundVideo: v.engine_sound_video,
        walkaroundVideo: v.walkaround_video,
        rating: v.rating,
        reviewsCount: v.reviews_count,
        createdAt: v.created_at,
        updatedAt: v.updated_at
      })) as any;

      return this.sortVehiclesByPriority(vehicles, filters?.userCity);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      let fallback = MOCK_VEHICLES;
      if (filters?.shopId) fallback = fallback.filter(v => v.shopId === filters.shopId);
      if (filters?.sellerId) fallback = fallback.filter(v => v.sellerId === filters.sellerId);
      if (filters?.verificationStatus) fallback = fallback.filter(v => v.verificationStatus === filters.verificationStatus);
      return this.sortVehiclesByPriority(fallback, filters?.userCity);
    }
  },

  sortVehiclesByPriority(vehicles: Vehicle[], userCity?: string): Vehicle[] {
    const typeWeights = {
      'sponsored': 10000,
      'featured': 5000,
      'premium': 2000,
      'free': 0
    };

    return [...vehicles].sort((a, b) => {
      let scoreA = (typeWeights[a.listingType] || 0) + (a.priorityScore || 0);
      let scoreB = (typeWeights[b.listingType] || 0) + (b.priorityScore || 0);
      
      // Location Boost (CTO Strategy: Relevance first)
      if (userCity) {
        if (a.city?.toLowerCase() === userCity.toLowerCase()) scoreA += 3000;
        if (b.city?.toLowerCase() === userCity.toLowerCase()) scoreB += 3000;
      }

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // If scores are equal, sort by newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    try {
      const payload: any = {
        seller_id: vehicleData.sellerId,
        shop_id: vehicleData.shopId || null,
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
        engine_start_video: vehicleData.engineStartVideo || null,
        engine_sound_video: vehicleData.engineSoundVideo || null,
        walkaround_video: vehicleData.walkaroundVideo || null,
        status: vehicleData.status || 'active',
        verification_status: vehicleData.verificationStatus || 'pending',
        payment_status: vehicleData.paymentStatus || 'none',
        listing_type: vehicleData.listingType || 'free',
        priority_score: vehicleData.priorityScore || 0,
        registration_number: vehicleData.registrationNumber || null,
        mileage: vehicleData.mileage || null,
        color: vehicleData.color || null,
        assembly_type: vehicleData.assemblyType || 'Local',
        vin: vehicleData.vin || null,
        image_metadata: vehicleData.imageMetadata || {}
      };

      console.log('Inserting vehicle payload:', payload);

      let { data, error } = await supabase
        .from('vehicles')
        .insert([payload])
        .select();

      if (error) {
        // Handle missing columns gracefully (Schema out of sync or PostgREST cache issues)
        if (error.code === '42703' || error.code === 'PGRST204' || error.message.includes('column')) {
          console.warn('Schema mismatch detected. Retrying with essential fields only.');
          const essentialPayload = {
            seller_id: payload.seller_id,
            shop_id: payload.shop_id,
            title: payload.title,
            description: payload.description,
            price: payload.price,
            brand: payload.brand,
            model: payload.model,
            year: payload.year,
            vehicle_type: payload.vehicle_type,
            fuel_type: payload.fuel_type,
            transmission: payload.transmission,
            kilometers_driven: payload.kilometers_driven,
            city: payload.city,
            state: payload.state,
            images: payload.images,
            status: payload.status,
            verification_status: payload.verification_status,
            payment_status: payload.payment_status,
            listing_type: payload.listing_type
          };
          
          const retry = await supabase
            .from('vehicles')
            .insert([essentialPayload])
            .select();
          
          data = retry.data;
          error = retry.error;
        }
        
        if (error) {
          console.error('Supabase error inserting vehicle:', error);
          throw error;
        }
      }
      if (!data || data.length === 0) throw new Error('Failed to create vehicle record');
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
          assembly_type: vehicleData.assemblyType,
          vin: vehicleData.vin,
          image_metadata: vehicleData.imageMetadata,
          registration_number: vehicleData.registrationNumber,
          mileage: vehicleData.mileage,
          color: vehicleData.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  async updateListingType(vehicleId: string, listingType: 'free' | 'premium' | 'featured' | 'sponsored'): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          listing_type: listingType,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating listing type:', error);
      throw error;
    }
  },

  async updatePaymentStatus(vehicleId: string, status: 'completed' | 'failed' | 'pending'): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          payment_status: status === 'completed' ? 'paid' : status,
          status: status === 'completed' ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating payment status:', error);
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
