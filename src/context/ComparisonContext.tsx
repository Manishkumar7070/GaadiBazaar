import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Vehicle } from '@/types';

interface ComparisonContextType {
  selectedVehicles: Vehicle[];
  addToComparison: (vehicle: Vehicle) => void;
  removeFromComparison: (vehicleId: string) => void;
  clearComparison: () => void;
  isVehicleSelected: (vehicleId: string) => boolean;
}

export const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);

  const addToComparison = (vehicle: Vehicle) => {
    if (selectedVehicles.length >= 4) {
      alert('You can compare up to 4 vehicles at a time.');
      return;
    }
    if (!selectedVehicles.find((v) => v.id === vehicle.id)) {
      setSelectedVehicles([...selectedVehicles, vehicle]);
    }
  };

  const removeFromComparison = (vehicleId: string) => {
    setSelectedVehicles(selectedVehicles.filter((v) => v.id !== vehicleId));
  };

  const clearComparison = () => {
    setSelectedVehicles([]);
  };

  const isVehicleSelected = (vehicleId: string) => {
    return !!selectedVehicles.find((v) => v.id === vehicleId);
  };

  return (
    <ComparisonContext.Provider
      value={{
        selectedVehicles,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isVehicleSelected,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
};

