import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Vehicle } from '@/types';

interface ComparisonState {
  selectedVehicles: Vehicle[];
  addToComparison: (vehicle: Vehicle) => void;
  removeFromComparison: (vehicleId: string) => void;
  clearComparison: () => void;
  isVehicleSelected: (vehicleId: string) => boolean;
}

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      selectedVehicles: [],
      
      addToComparison: (vehicle) => {
        const { selectedVehicles } = get();
        if (selectedVehicles.length >= 4) {
          alert('You can compare up to 4 vehicles at a time.');
          return;
        }
        if (!selectedVehicles.find((v) => v.id === vehicle.id)) {
          set({ selectedVehicles: [...selectedVehicles, vehicle] });
        }
      },

      removeFromComparison: (vehicleId) => {
        const { selectedVehicles } = get();
        set({
          selectedVehicles: selectedVehicles.filter((v) => v.id !== vehicleId)
        });
      },

      clearComparison: () => {
        set({ selectedVehicles: [] });
      },

      isVehicleSelected: (vehicleId) => {
        const { selectedVehicles } = get();
        return !!selectedVehicles.find((v) => v.id === vehicleId);
      },
    }),
    {
      name: 'comparison-storage', // persists comparison state across sessions
    }
  )
);
