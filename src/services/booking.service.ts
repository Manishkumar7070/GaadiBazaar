import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface Booking {
  id: string;
  vehicleId: string;
  userId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  appointmentDate: string;
  appointmentTime: string;
  createdAt: string;
}

export const bookingService = {
  async fetchUserBookings(userId: string): Promise<Booking[]> {
    try {
      // Mock for now using localStorage path for persistence in demo
      const localBookings = JSON.parse(localStorage.getItem(`bookings_${userId}`) || '[]');
      return localBookings;
      
      /* Real implementation 
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId);
      ...
      */
    } catch (error) {
      logger.error('Error fetching bookings', { data: error });
      return [];
    }
  },

  async isVehicleBookedByUser(vehicleId: string, userId: string): Promise<boolean> {
    const bookings = await this.fetchUserBookings(userId);
    return bookings.some(b => b.vehicleId === vehicleId && b.status === 'confirmed');
  },

  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> {
    const newBooking: Booking = {
      ...bookingData,
      id: `book_${Math.random().toString(36).substr(2, 9)}`,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    const currentBookings = await this.fetchUserBookings(bookingData.userId);
    localStorage.setItem(
      `bookings_${bookingData.userId}`, 
      JSON.stringify([...currentBookings, newBooking])
    );

    return newBooking;
  }
};
