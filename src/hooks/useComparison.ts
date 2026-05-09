import { useComparisonStore } from '@/store/useComparisonStore';

export const useComparison = () => {
  const selectedVehicles = useComparisonStore((state) => state.selectedVehicles);
  const addToComparison = useComparisonStore((state) => state.addToComparison);
  const removeFromComparison = useComparisonStore((state) => state.removeFromComparison);
  const clearComparison = useComparisonStore((state) => state.clearComparison);
  const isVehicleSelected = useComparisonStore((state) => state.isVehicleSelected);

  return {
    selectedVehicles,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isVehicleSelected,
  };
};
