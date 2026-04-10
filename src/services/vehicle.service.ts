import { Vehicle } from '@/types';

export const vehicleService = {
  async fetchVehicles(): Promise<Vehicle[]> {
    const response = await fetch('/api/vehicles');
    if (!response.ok) {
      throw new Error('Failed to fetch vehicles');
    }
    return response.json();
  },

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const response = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create vehicle');
    }

    return response.json();
  }
};
