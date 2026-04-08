import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, MapPin, Bookmark, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_VEHICLES } from '@/lib/mock-data';
import VehicleCard from '@/components/vehicles/VehicleCard';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { SavedSearch, SearchFilters } from '@/types';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  
  const [filters, setFilters] = useState<SearchFilters>({
    brand: initialQuery,
    minPrice: undefined,
    maxPrice: undefined,
    vehicleType: undefined,
    city: undefined,
  });

  useEffect(() => {
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const min = searchParams.get('min');
    const max = searchParams.get('max');

    if (q || type || city || min || max) {
      if (q) setSearchQuery(q);
      setFilters({
        brand: q || '',
        vehicleType: (type as any) || undefined,
        city: city || undefined,
        minPrice: min ? parseInt(min) : undefined,
        maxPrice: max ? parseInt(max) : undefined,
      });
    }
  }, [searchParams]);

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;

    const newSavedSearch: SavedSearch = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'u1', // Mock user
      name: searchName,
      filters: { 
        ...filters,
        brand: searchQuery || filters.brand 
      },
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    localStorage.setItem('savedSearches', JSON.stringify([...existing, newSavedSearch]));
    
    setIsSaveDialogOpen(false);
    setSearchName('');
    alert('Search saved successfully! You can find it in your profile.');
  };

  const filteredVehicles = MOCK_VEHICLES.filter(v => {
    const matchesQuery = !searchQuery || 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !filters.vehicleType || v.vehicleType === filters.vehicleType;
    const matchesMinPrice = !filters.minPrice || v.price >= filters.minPrice;
    const matchesMaxPrice = !filters.maxPrice || v.price <= filters.maxPrice;
    const matchesCity = !filters.city || v.city.toLowerCase() === filters.city.toLowerCase();

    return matchesQuery && matchesType && matchesMinPrice && matchesMaxPrice && matchesCity;
  });

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md py-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search cars, bikes..." 
              className="pl-10 h-12 rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl text-primary border-primary/20 hover:bg-primary/5">
                <Bookmark size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Save this search</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-slate-500">Give your search a name so you can easily find it later.</p>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Search Name</label>
                  <Input 
                    placeholder="e.g., Budget SUVs in Bhopal" 
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Current Filters</p>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && <Badge variant="secondary">Query: {searchQuery}</Badge>}
                    {filters.vehicleType && <Badge variant="secondary">Type: {filters.vehicleType}</Badge>}
                    {filters.city && <Badge variant="secondary">City: {filters.city}</Badge>}
                    {(filters.minPrice || filters.maxPrice) && (
                      <Badge variant="secondary">
                        Price: {filters.minPrice ? `₹${filters.minPrice.toLocaleString()}` : '0'} - {filters.maxPrice ? `₹${filters.maxPrice.toLocaleString()}` : 'Any'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveSearch} className="bg-primary hover:bg-primary/90 rounded-xl">Save Search</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
                <Filter size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle>Filter Search</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold">Vehicle Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['car', 'bike', 'commercial'].map((type) => (
                      <Button
                        key={type}
                        variant={filters.vehicleType === type ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full capitalize"
                        onClick={() => setFilters(prev => ({ ...prev, vehicleType: prev.vehicleType === type ? undefined : type as any }))}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold">Price Range</label>
                  <div className="flex gap-4">
                    <Input 
                      type="number" 
                      placeholder="Min Price" 
                      className="rounded-xl"
                      value={filters.minPrice || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value ? parseInt(e.target.value) : undefined }))}
                    />
                    <Input 
                      type="number" 
                      placeholder="Max Price" 
                      className="rounded-xl"
                      value={filters.maxPrice || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value ? parseInt(e.target.value) : undefined }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold">Location</label>
                  <Input 
                    placeholder="e.g., Bhopal" 
                    className="rounded-xl"
                    value={filters.city || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={() => {
                    setFilters({ brand: searchQuery });
                    setIsFilterDialogOpen(false);
                  }}
                >
                  Reset
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => setIsFilterDialogOpen(false)}
                >
                  Apply Filters
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Button variant="secondary" size="sm" className="rounded-full">Price: Low to High</Button>
          <Button variant="secondary" size="sm" className="rounded-full">Year: Newest</Button>
          <Button variant="secondary" size="sm" className="rounded-full">Kilometers: Low</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <SearchIcon size={40} />
            </div>
            <h3 className="text-xl font-bold">No vehicles found</h3>
            <p className="text-slate-500">Try adjusting your filters or search query.</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setFilters({ brand: '' });
            }}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
