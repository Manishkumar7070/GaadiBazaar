import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, MapPin, Bookmark, Save, Car, Bike, Truck, Zap, Mic, MicOff, X, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_VEHICLES } from '@/constants/mockData';
import VehicleCard from '@/features/vehicles/VehicleCard';
import VehicleCardSkeleton from '@/features/vehicles/VehicleCardSkeleton';
import SearchSuggestions from '@/features/search/SearchSuggestions';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { SavedSearch, SearchFilters, Vehicle } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { POPULAR_CITIES, INDIAN_STATES } from '@/constants/cities';
import { vehicleService } from '@/services/vehicle.service';

const POPULAR_BRANDS = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Toyota', 'Mahindra', 
  'Honda', 'Kia', 'Volkswagen', 'MG', 'Skoda', 
  'BMW', 'Mercedes-Benz', 'Audi', 'Jeep', 'Ford',
  'Royal Enfield', 'KTM', 'Hero', 'Yamaha', 'Bajaj'
];

const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - i);

const SearchPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(initialQuery);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'newest' | 'km-low' | 'city-asc' | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularMetadata, setPopularMetadata] = useState<{ brands: string[], models: string[], cities: string[] }>({ brands: [], models: [], cities: [] });
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(saved);
    
    const fetchMetadata = async () => {
      const data = await vehicleService.fetchPopularMetadata();
      setPopularMetadata(data);
    };
    fetchMetadata();
  }, []);

  const addToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoading(true);
      try {
        const data = await vehicleService.fetchVehicles({ verificationStatus: 'verified' });
        setVehicles(data.length > 0 ? data : MOCK_VEHICLES);
      } catch (error) {
        console.error('Error loading vehicles:', error);
        setVehicles(MOCK_VEHICLES);
      } finally {
        setIsLoading(false);
      }
    };
    loadVehicles();
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery.length > 0) {
      const query = debouncedSearchQuery.toLowerCase();
      
      // 1. Match Popular Brands & Models
      const brandMatches = popularMetadata.brands
        .filter(b => b.toLowerCase().includes(query))
        .map(b => ({ id: `pb-${b}`, text: b, type: 'vehicle' as const, subtext: 'Brand' }));

      const modelMatches = popularMetadata.models
        .filter(m => m.toLowerCase().includes(query))
        .map(m => ({ id: `pm-${m}`, text: m, type: 'vehicle' as const, subtext: 'Model' }));

      // 2. Match Vehicles from current results (more specific)
      const vehicleMatches = Array.from(new Set(vehicles
        .filter(v => (v.brand.toLowerCase().includes(query) || v.model.toLowerCase().includes(query)) && 
                     !popularMetadata.brands.some(b => b.toLowerCase() === v.brand.toLowerCase()) &&
                     !popularMetadata.models.some(m => m.toLowerCase() === v.model.toLowerCase()))
        .map(v => `${v.brand} ${v.model}`)))
        .slice(0, 3)
        .map(text => ({ id: `v-${text}`, text, type: 'vehicle' as const }));

      // 3. Match Locations (City or State)
      const popularCityMatches = popularMetadata.cities
        .filter(c => c.toLowerCase().includes(query))
        .map(c => ({ id: `pc-${c}`, text: c, type: 'location' as const, subtext: 'Popular City' }));

      const cityMatches = POPULAR_CITIES
        .filter(c => c.name.toLowerCase().includes(query) && !popularMetadata.cities.includes(c.name))
        .slice(0, 2)
        .map(c => ({ id: `l-${c.name}`, text: c.name, subtext: c.state, type: 'location' as const, state: c.state }));

      const stateMatches = INDIAN_STATES
        .filter(s => s.toLowerCase().includes(query))
        .slice(0, 2)
        .map(s => ({ id: `s-${s}`, text: s, type: 'location' as const, state: s }));

      // 4. Combined Logic (e.g., "Swift in Bihar")
      let combinedMatches: any[] = [];
      if (query.includes(' in ')) {
        const [carPart, locPart] = query.split(' in ');
        if (carPart && locPart) {
          combinedMatches = [{
            id: 'combined-1',
            text: `${carPart.trim()} in ${locPart.trim()}`,
            type: 'combined' as const,
            subtext: 'Search by car and location'
          }];
        }
      }

      // 5. Match Recent Searches
      const historyMatches = recentSearches
        .filter(s => s.toLowerCase().includes(query) && s.toLowerCase() !== query)
        .slice(0, 2)
        .map(s => ({ id: `h-${s}`, text: s, type: 'history' as const }));

      const genericSearch = { id: 'search-query', text: debouncedSearchQuery, type: 'combined' as const, subtext: `Search for "${debouncedSearchQuery}"` };

      setSuggestions([
        genericSearch,
        ...combinedMatches, 
        ...brandMatches, 
        ...modelMatches, 
        ...vehicleMatches, 
        ...popularCityMatches,
        ...cityMatches, 
        ...stateMatches, 
        ...historyMatches
      ].slice(0, 8));
    } else {
      // Show recent searches when query is empty but focused
      setSuggestions(recentSearches.map(s => ({ id: `h-${s}`, text: s, type: 'history' as const })));
    }
  }, [debouncedSearchQuery, recentSearches, popularMetadata, vehicles]);

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    setSuggestions([]);
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser.');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      addToRecentSearches(transcript);
    };

    recognition.start();
  };

  const parseSmartQuery = (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) {
      setFilters(prev => ({ ...prev, brand: '' }));
      return;
    }

    if (q.includes(' in ')) {
      const [carPart, locPart] = q.split(' in ');
      const loc = locPart.trim();
      const state = INDIAN_STATES.find(s => s.toLowerCase() === loc);
      const city = POPULAR_CITIES.find(c => c.name.toLowerCase() === loc);
      
      const vehiclePart = carPart.trim();
      const matchedBrand = POPULAR_BRANDS.find(b => b.toLowerCase() === vehiclePart || b.toLowerCase().includes(vehiclePart));

      setFilters(prev => ({
        ...prev,
        brand: matchedBrand || '',
        model: !matchedBrand ? vehiclePart : undefined,
        state: state || (city ? city.state : undefined),
        city: city ? city.name : undefined
      }));
      setSearchQuery(vehiclePart);
    } else {
      const state = INDIAN_STATES.find(s => s.toLowerCase() === q);
      const city = POPULAR_CITIES.find(c => c.name.toLowerCase() === q);
      const matchedBrand = POPULAR_BRANDS.find(b => b.toLowerCase() === q || b.toLowerCase().includes(q));
      
      if (state || city) {
        setFilters(prev => ({
          ...prev,
          state: state || (city ? city.state : undefined),
          city: city ? city.name : undefined,
          brand: ''
        }));
        setSearchQuery('');
      } else if (matchedBrand) {
        setFilters(prev => ({ ...prev, brand: matchedBrand, model: undefined }));
      } else {
        // If not a location or direct brand, it might be a model or general query
        setFilters(prev => ({ ...prev, brand: '', model: query }));
      }
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    setSearchQuery(suggestion.text);
    parseSmartQuery(suggestion.text);
    addToRecentSearches(suggestion.text);
    setShowSuggestions(false);
  };
  
  const [filters, setFilters] = useState<SearchFilters>({
    brand: initialQuery,
    minPrice: undefined,
    maxPrice: undefined,
    vehicleType: undefined,
    city: undefined,
    fuelType: undefined,
    transmission: undefined,
    ownership: undefined,
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    const minKm = searchParams.get('minKm');
    const maxKm = searchParams.get('maxKm');
    const fuel = searchParams.get('fuel');
    const trans = searchParams.get('trans');
    const owner = searchParams.get('owner');

    if (q || type || city || state || minPrice || maxPrice || brand || model || minYear || maxYear || minKm || maxKm || fuel || trans || owner) {
      if (q) {
        setSearchQuery(q);
        parseSmartQuery(q);
      }
      setFilters({
        brand: brand || q || '',
        model: model || undefined,
        vehicleType: (type as any) || undefined,
        city: city || undefined,
        state: state || undefined,
        minPrice: minPrice ? parseInt(minPrice) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        minYear: minYear ? parseInt(minYear) : undefined,
        maxYear: maxYear ? parseInt(maxYear) : undefined,
        minKm: minKm ? parseInt(minKm) : undefined,
        maxKm: maxKm ? parseInt(maxKm) : undefined,
        fuelType: (fuel as any) || undefined,
        transmission: (trans as any) || undefined,
        ownership: (owner as any) || undefined,
      });
    }
    setCurrentPage(1);
    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const handleSaveSearch = () => {
    if (!user) {
      navigate('/login?reason=save_search&redirect=/search');
      return;
    }
    if (!searchName.trim()) return;

    const newSavedSearch: SavedSearch = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
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

  const filteredVehicles = vehicles.filter(v => {
    // 1. Broad Text Match (Only if brand/model filters are NOT explicitly set, or to complement them)
    const matchesQuery = !debouncedSearchQuery || 
      v.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
      v.brand.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    // 2. Structural Filters (Explicit selection)
    const matchesType = !filters.vehicleType || v.vehicleType === filters.vehicleType;
    const matchesMinPrice = filters.minPrice === undefined || v.price >= filters.minPrice;
    const matchesMaxPrice = filters.maxPrice === undefined || v.price <= filters.maxPrice;
    const matchesCity = !filters.city || v.city.toLowerCase() === filters.city.toLowerCase();
    const matchesState = !filters.state || v.state.toLowerCase() === filters.state.toLowerCase();
    
    // Exact brand match if selected from list, otherwise inclusion check
    const matchesBrand = !filters.brand || v.brand.toLowerCase().includes(filters.brand.toLowerCase());
    const matchesModel = !filters.model || v.model.toLowerCase().includes(filters.model.toLowerCase());
    
    const matchesMinYear = filters.minYear === undefined || v.year >= filters.minYear;
    const matchesMaxYear = filters.maxYear === undefined || v.year <= filters.maxYear;
    const matchesMinKm = filters.minKm === undefined || v.kilometersDriven >= filters.minKm;
    const matchesMaxKm = filters.maxKm === undefined || v.kilometersDriven <= filters.maxKm;
    const matchesFuel = !filters.fuelType || v.fuelType === filters.fuelType;
    const matchesTrans = !filters.transmission || v.transmission === filters.transmission;
    const matchesOwnership = !filters.ownership || v.ownership === filters.ownership;

    return matchesQuery && matchesType && matchesMinPrice && matchesMaxPrice && matchesCity && matchesState && 
           matchesBrand && matchesModel && matchesMinYear && matchesMaxYear && matchesMinKm && matchesMaxKm && 
           matchesFuel && matchesTrans && matchesOwnership;
  })
.sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'newest') return b.year - a.year;
    if (sortBy === 'km-low') return a.kilometersDriven - b.kilometersDriven;
    if (sortBy === 'city-asc') return a.city.localeCompare(b.city);
    return 0;
  });

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-md py-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search cars, bikes, or 'Swift in Bihar'..." 
              className="pl-10 pr-24 h-12 rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  parseSmartQuery(searchQuery);
                  addToRecentSearches(searchQuery);
                  setShowSuggestions(false);
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 rounded-lg transition-colors",
                  isListening ? "text-red-500 bg-red-50" : "text-slate-400 hover:text-primary"
                )}
                onClick={handleVoiceSearch}
              >
                {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
              </Button>
            </div>

            <SearchSuggestions 
              suggestions={suggestions}
              query={searchQuery}
              isVisible={showSuggestions}
              onSelect={handleSuggestionSelect}
              onClearRecent={handleClearRecentSearches}
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-12 w-12 rounded-xl text-primary border-primary/20 hover:bg-primary/5"
            onClick={() => {
              if (!user) {
                navigate(`/login?reason=save_search&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
              } else {
                setIsSaveDialogOpen(true);
              }
            }}
          >
            <Bookmark size={20} />
          </Button>

          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
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
                    {filters.brand && <Badge variant="secondary">Make: {filters.brand}</Badge>}
                    {filters.model && <Badge variant="secondary">Model: {filters.model}</Badge>}
                    {filters.city && <Badge variant="secondary">City: {filters.city}</Badge>}
                    {filters.state && <Badge variant="secondary">State: {filters.state}</Badge>}
                    {(filters.minPrice || filters.maxPrice) && (
                      <Badge variant="secondary">
                        Price: {filters.minPrice ? `₹${filters.minPrice.toLocaleString()}` : '0'} - {filters.maxPrice ? `₹${filters.maxPrice.toLocaleString()}` : 'Any'}
                      </Badge>
                    )}
                    {(filters.minYear || filters.maxYear) && (
                      <Badge variant="secondary">
                        Year: {filters.minYear || 'Any'} - {filters.maxYear || 'Any'}
                      </Badge>
                    )}
                    {(filters.minKm || filters.maxKm) && (
                      <Badge variant="secondary">
                        KM: {filters.minKm || '0'} - {filters.maxKm || 'Any'}
                      </Badge>
                    )}
                    {filters.fuelType && <Badge variant="secondary">Fuel: {filters.fuelType}</Badge>}
                    {filters.transmission && <Badge variant="secondary">Trans: {filters.transmission}</Badge>}
                    {filters.ownership && <Badge variant="secondary">Owner: {filters.ownership}</Badge>}
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
            <DialogTrigger render={<Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" />}>
              <Filter size={20} />
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filter Search</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold">Vehicle Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'car', label: 'Cars', icon: Car },
                      { id: 'bike', label: 'Bikes', icon: Bike },
                      { id: 'scooter', label: 'Scooters', icon: Zap },
                      { id: 'commercial', label: 'Commercial', icon: Truck },
                    ].map((type) => {
                      const Icon = type.icon;
                      const isActive = filters.vehicleType === type.id;
                      return (
                        <Button
                          key={type.id}
                          variant={isActive ? 'default' : 'outline'}
                          className={cn(
                            "h-12 rounded-xl justify-start gap-3 px-4",
                            isActive ? "bg-primary border-primary" : "hover:bg-primary/5 hover:border-primary/20"
                          )}
                          onClick={() => setFilters(prev => ({ ...prev, vehicleType: prev.vehicleType === type.id ? undefined : type.id as any }))}
                        >
                          <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                          <span className="font-bold">{type.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold">Brand (Make)</label>
                    <select 
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={filters.brand || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value || undefined }))}
                    >
                      <option value="">All Brands</option>
                      {POPULAR_BRANDS.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold">Model</label>
                    <Input 
                      placeholder="e.g., Swift, Classic 350" 
                      className="rounded-xl"
                      value={filters.model || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value || undefined }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold">Year Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">From Year</label>
                      <select 
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filters.minYear || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, minYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                      >
                        <option value="">Any</option>
                        {YEAR_OPTIONS.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">To Year</label>
                      <select 
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filters.maxYear || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, maxYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                      >
                        <option value="">Any</option>
                        {YEAR_OPTIONS.filter(y => !filters.minYear || y >= filters.minYear).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold">Price Range</label>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Min Price (₹)</label>
                        <Input 
                          type="number" 
                          placeholder="e.g., 100000" 
                          className="rounded-xl"
                          value={filters.minPrice || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value ? parseInt(e.target.value) : undefined }))}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Price (₹)</label>
                        <Input 
                          type="number" 
                          placeholder="e.g., 500000" 
                          className="rounded-xl"
                          value={filters.maxPrice || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value ? parseInt(e.target.value) : undefined }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold">Kilometers Driven</label>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Min KM</label>
                        <Input 
                          type="number" 
                          placeholder="Min KM" 
                          className="rounded-xl"
                          value={filters.minKm || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, minKm: e.target.value ? parseInt(e.target.value) : undefined }))}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max KM</label>
                        <Input 
                          type="number" 
                          placeholder="Max KM" 
                          className="rounded-xl"
                          value={filters.maxKm || ''}
                          onChange={(e) => setFilters(prev => ({ ...prev, maxKm: e.target.value ? parseInt(e.target.value) : undefined }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold">Fuel Type</label>
                    <select 
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={filters.fuelType || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, fuelType: e.target.value as any || undefined }))}
                    >
                      <option value="">All Fuel Types</option>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="cng">CNG</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold">Transmission</label>
                    <select 
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={filters.transmission || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, transmission: e.target.value as any || undefined }))}
                    >
                      <option value="">All Transmissions</option>
                      <option value="manual">Manual</option>
                      <option value="automatic">Automatic</option>
                      <option value="semi-automatic">Semi-Automatic</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold">Ownership</label>
                    <select 
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={filters.ownership || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, ownership: e.target.value as any || undefined }))}
                    >
                      <option value="">All Owners</option>
                      <option value="1st">1st Owner</option>
                      <option value="2nd">2nd Owner</option>
                      <option value="3rd">3rd Owner</option>
                      <option value="4th">4th Owner</option>
                      <option value="4th+">4th+ Owner</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold">Location</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">City</label>
                      <select 
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filters.city || ''}
                        onChange={(e) => {
                          const city = e.target.value;
                          const cityData = POPULAR_CITIES.find(c => c.name === city);
                          setFilters(prev => ({ 
                            ...prev, 
                            city: city || undefined,
                            state: cityData ? cityData.state : prev.state
                          }));
                        }}
                      >
                        <option value="">All Cities</option>
                        {POPULAR_CITIES.map(city => (
                          <option key={city.name} value={city.name}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">State</label>
                      <select 
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={filters.state || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value || undefined }))}
                      >
                        <option value="">All States</option>
                        {(filters.city 
                          ? [POPULAR_CITIES.find(c => c.name === filters.city)?.state].filter(Boolean)
                          : INDIAN_STATES
                        ).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
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
          <Button 
            variant={sortBy?.startsWith('price') ? 'default' : 'secondary'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setSortBy(prev => prev === 'price-asc' ? 'price-desc' : 'price-asc')}
          >
            Price: {sortBy === 'price-asc' ? 'Low to High' : sortBy === 'price-desc' ? 'High to Low' : 'Sort by Price'}
          </Button>
          <Button 
            variant={sortBy === 'newest' ? 'default' : 'secondary'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setSortBy(prev => prev === 'newest' ? null : 'newest')}
          >
            Year: Newest
          </Button>
          <Button 
            variant={sortBy === 'km-low' ? 'default' : 'secondary'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setSortBy(prev => prev === 'km-low' ? null : 'km-low')}
          >
            Kilometers: Low
          </Button>
          <Button 
            variant={sortBy === 'city-asc' ? 'default' : 'secondary'} 
            size="sm" 
            className="rounded-full"
            onClick={() => setSortBy(prev => prev === 'city-asc' ? null : 'city-asc')}
          >
            City: A-Z
          </Button>

          <div className="h-6 w-px bg-slate-200 mx-1 flex-shrink-0" />

          <select 
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium border-none outline-none flex-shrink-0 transition-colors",
              filters.fuelType ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
            value={filters.fuelType || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, fuelType: e.target.value as any || undefined }))}
          >
            <option value="">Fuel: All</option>
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="cng">CNG</option>
            <option value="hybrid">Hybrid</option>
          </select>

          <select 
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium border-none outline-none flex-shrink-0 transition-colors",
              filters.transmission ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
            value={filters.transmission || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, transmission: e.target.value as any || undefined }))}
          >
            <option value="">Trans: All</option>
            <option value="manual">Manual</option>
            <option value="automatic">Automatic</option>
            <option value="semi-automatic">Semi-Auto</option>
          </select>

          <select 
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium border-none outline-none flex-shrink-0 transition-colors",
              filters.ownership ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
            value={filters.ownership || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, ownership: e.target.value as any || undefined }))}
          >
            <option value="">Owner: All</option>
            <option value="1st">1st Owner</option>
            <option value="2nd">2nd Owner</option>
            <option value="3rd">3rd Owner</option>
            <option value="4th">4th Owner</option>
            <option value="4th+">4th+ Owner</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))
        ) : paginatedVehicles.length > 0 ? (
          paginatedVehicles.map((vehicle) => (
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

      {totalPages > 1 && (
        <div className="py-10">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) handlePageChange(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {(() => {
                const pages = [];
                const showMax = 5;
                
                if (totalPages <= showMax) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage <= 3) {
                    pages.push(2, 3, 4, 'ellipsis', totalPages);
                  } else if (currentPage >= totalPages - 2) {
                    pages.push('ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                  } else {
                    pages.push('ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
                  }
                }

                return pages.map((page, i) => {
                  if (page === 'ellipsis') {
                    return (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        href="#" 
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(page as number);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                });
              })()}

              <PaginationItem>
                <PaginationNext 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) handlePageChange(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
