import { Vehicle, VerificationStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { MOCK_VEHICLES } from '@/constants/mockData';
import { sanitizeObject } from '@/lib/sanitizer';
import { logger } from '@/lib/logger';

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
          logger.warn('Table "vehicles" not found in Supabase. Falling back to mock data.');
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

      const vehicles: Vehicle[] = (data || []).map(v => ({
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
      })) as Vehicle[];

      return this.sortVehiclesByPriority(vehicles, filters?.userCity);
    } catch (error) {
      logger.error('Error fetching vehicles', { data: error });
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
      const sanitizedData = sanitizeObject(vehicleData);
      const payload: any = {
        seller_id: sanitizedData.sellerId,
        shop_id: sanitizedData.shopId || null,
        title: sanitizedData.title,
        description: sanitizedData.description,
        price: sanitizedData.price,
        brand: sanitizedData.brand,
        model: sanitizedData.model,
        year: sanitizedData.year,
        vehicle_type: sanitizedData.vehicleType,
        fuel_type: sanitizedData.fuelType,
        transmission: sanitizedData.transmission,
        kilometers_driven: sanitizedData.kilometersDriven,
        ownership: sanitizedData.ownership,
        city: sanitizedData.city,
        state: sanitizedData.state,
        images: sanitizedData.images,
        engine_start_video: sanitizedData.engineStartVideo || null,
        engine_sound_video: sanitizedData.engineSoundVideo || null,
        walkaround_video: sanitizedData.walkaroundVideo || null,
        status: sanitizedData.status || 'active',
        verification_status: sanitizedData.verificationStatus || 'pending',
        payment_status: sanitizedData.paymentStatus || 'none',
        listing_type: sanitizedData.listingType || 'free',
        priority_score: sanitizedData.priorityScore || 0,
        registration_number: sanitizedData.registrationNumber || null,
        mileage: sanitizedData.mileage || null,
        color: sanitizedData.color || null,
        assembly_type: sanitizedData.assemblyType || 'Local',
        vin: sanitizedData.vin || null,
        image_metadata: sanitizedData.imageMetadata || {}
      };

      logger.info('Inserting vehicle payload', { data: payload });

      let { data, error } = await supabase
        .from('vehicles')
        .insert([payload])
        .select();

      if (error) {
        const errorMessage = error.message?.toLowerCase() || '';
        // Handle common schema or connectivity issues that lead to PostgREST parsing errors
        if (
          error.code === '42703' || 
          error.code === 'PGRST204' || 
          errorMessage.includes('column') || 
          errorMessage.includes('expected json array') ||
          errorMessage.includes('not acceptable')
        ) {
          logger.warn('Potential schema mismatch or PostgREST error detected. Retrying with ultra-minimal payload.', { data: error });
          
          // The most basic payload that should work if the table exists at all
          const minimalPayload = {
            seller_id: payload.seller_id,
            title: payload.title,
            price: Number(payload.price),
            description: payload.description || '',
            images: Array.isArray(payload.images) ? payload.images : [],
            status: 'active'
          };
          
          const { data: retryData, error: retryError } = await supabase
            .from('vehicles')
            .insert([minimalPayload])
            .select();
          
          if (retryError) {
            logger.error('Retry failed as well', { data: retryError });
            throw new Error(`Database Error: ${retryError.message}`);
          }
          data = retryData;
        } else {
          logger.error('Supabase error inserting vehicle', { data: error });
          throw new Error(`Listing Failed: ${error.message}`);
        }
      }
      
      if (!data || data.length === 0) {
        throw new Error('Server returned empty data. The listing might not have been saved.');
      }
      
      const v = data[0];
      return {
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
        createdAt: v.created_at,
        updatedAt: v.updated_at
      } as unknown as Vehicle;
    } catch (error) {
      logger.error('Error creating vehicle', { data: error });
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
          payment_status: vehicleData.paymentStatus,
          listing_type: vehicleData.listingType,
          priority_score: vehicleData.priorityScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error updating vehicle', { data: error });
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
      logger.error('Error updating listing type', { data: error });
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
      logger.error('Error updating payment status', { data: error });
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
      logger.error('Error updating vehicle verification', { data: error });
      throw error;
    }
  },

  async fetchPopularMetadata(): Promise<{ brands: string[], models: string[], cities: string[], states: string[] }> {
    try {
      const vehicles = await this.fetchVehicles({ verificationStatus: 'verified' });
      
      const brandsCount: Record<string, number> = {};
      const modelsCount: Record<string, number> = {};
      const citiesCount: Record<string, number> = {};
      const statesCount: Record<string, number> = {};

      vehicles.forEach(v => {
        if (v.brand) brandsCount[v.brand] = (brandsCount[v.brand] || 0) + 1;
        if (v.model) modelsCount[v.model] = (modelsCount[v.model] || 0) + 1;
        if (v.city) citiesCount[v.city] = (citiesCount[v.city] || 0) + 1;
        if (v.state) statesCount[v.state] = (statesCount[v.state] || 0) + 1;
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
        .slice(0, 12)
        .map(([city]) => city);
      
      const states = Object.entries(statesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([state]) => state);

      // Fallback for demo if data is sparse
      const defaultStates = ['Delhi-NCR', 'Bihar', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Punjab', 'Rajasthan', 'Haryana', 'Madhya Pradesh'];
      const finalStates = states.length > 0 ? states : defaultStates;

      return { brands, models, cities, states: finalStates };
    } catch (error) {
      logger.error('Error fetching popular metadata', { data: error });
      return { brands: [], models: [], cities: [], states: [] };
    }
  }
};
