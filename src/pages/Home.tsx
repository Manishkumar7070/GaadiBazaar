import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Car, Bike, Truck, Clock, Store, Star, ChevronRight, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MOCK_VEHICLES } from '@/constants/mockData';
import VehicleCard from '@/features/vehicles/VehicleCard';
import VehicleCardSkeleton from '@/features/vehicles/VehicleCardSkeleton';
import SearchSuggestions from '@/features/search/SearchSuggestions';
import { motion } from 'motion/react';
import { Vehicle } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { vehicleService } from '@/services/vehicle.service';
import { shopService } from '@/services/shop.service';
import { Shop } from '@/types';
import CitySelector from '@/components/shared/CitySelector';
import { useLocation } from '@/context/LocationContext';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { selectedCity } = useLocation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [recentlyViewed, setRecentlyViewed] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const filters: any = { verificationStatus: 'verified' };
        if (selectedCity && selectedCity !== 'India') {
          filters.city = selectedCity;
        }
        
        const [vehicleData, shopData] = await Promise.all([
          vehicleService.fetchVehicles(filters),
          shopService.fetchShops()
        ]);
        setVehicles(vehicleData.length > 0 ? vehicleData : MOCK_VEHICLES);
        setShops(shopData);
      } catch (error) {
        console.error('Error loading data:', error);
        setVehicles(MOCK_VEHICLES);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up Real-time subscription for vehicles
    const channel = supabase
      .channel('home_vehicles_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'vehicles' 
      }, async (payload) => {
        console.log('Real-time update received:', payload);
        const updatedVehicles = await vehicleService.fetchVehicles({ verificationStatus: 'verified' });
        setVehicles(updatedVehicles);
      })
      .subscribe();

    const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    // Ensure unique IDs
    const uniqueIds = Array.from(new Set(viewedIds)) as string[];
    const viewedVehicles = uniqueIds
      .map((id: string) => MOCK_VEHICLES.find(v => v.id === id))
      .filter(Boolean)
      .slice(0, 4) as Vehicle[];
    setRecentlyViewed(viewedVehicles);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCity]);

  const categories = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'car', label: 'Cars', icon: Car },
    { id: 'bike', label: 'Bikes', icon: Bike },
    { id: 'commercial', label: 'Commercial', icon: Truck },
  ];

  const filteredVehicles = activeCategory === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.vehicleType === activeCategory);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularMetadata, setPopularMetadata] = useState<{ brands: string[], models: string[], cities: string[] }>({ brands: [], models: [], cities: [] });

  useEffect(() => {
    const fetchMetadata = async () => {
      const data = await vehicleService.fetchPopularMetadata();
      setPopularMetadata(data);
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const query = debouncedQuery.toLowerCase().trim();
    
    if (!query) {
      const popularSuggestions = [
        ...popularMetadata.brands.map(b => ({ id: `b-${b}`, text: b, type: 'vehicle' as const, subtext: 'Popular Brand' })),
        ...popularMetadata.cities.map(c => ({ id: `c-${c}`, text: c, type: 'location' as const, subtext: 'Popular City' }))
      ].slice(0, 8);
      setSuggestions(popularSuggestions);
      return;
    }

    const brandMatches = popularMetadata.brands
      .filter(b => b.toLowerCase().includes(query))
      .map(b => ({ id: `b-${b}`, text: b, type: 'vehicle' as const, subtext: 'Brand' }));

    const modelMatches = popularMetadata.models
      .filter(m => m.toLowerCase().includes(query))
      .map(m => ({ id: `m-${m}`, text: m, type: 'vehicle' as const, subtext: 'Model' }));

    const cityMatches = popularMetadata.cities
      .filter(c => c.toLowerCase().includes(query))
      .map(c => ({ id: `c-${c}`, text: c, type: 'location' as const, subtext: 'City' }));

    const genericSearch = { id: 'search-query', text: debouncedQuery, type: 'combined' as const, subtext: `Search for "${debouncedQuery}"` };

    setSuggestions([genericSearch, ...brandMatches, ...modelMatches, ...cityMatches].slice(0, 8));
  }, [debouncedQuery, popularMetadata]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cityParam = selectedCity && selectedCity !== 'India' ? `&city=${encodeURIComponent(selectedCity)}` : '';
    
    if (searchQuery.trim()) {
      // Save to recent searches
      const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [searchQuery.trim(), ...saved.filter((s: string) => s !== searchQuery.trim())].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}${cityParam}`);
    } else {
      navigate(`/search?${cityParam.startsWith('&') ? cityParam.substring(1) : cityParam}`);
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    setSearchQuery(suggestion.text);
    if (suggestion.type === 'location') {
      navigate(`/search?city=${encodeURIComponent(suggestion.text)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(suggestion.text)}`);
    }
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero / Search Section */}
      <section className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 text-white p-6 sm:p-10 md:p-16 lg:p-24 min-h-[500px] lg:min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40 object-center scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Responsive Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/20 to-slate-900/90 lg:bg-gradient-to-r lg:from-slate-900 lg:via-slate-900/60 lg:to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-4xl space-y-8 lg:space-y-12">
          <div className="space-y-4 lg:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-primary text-sm font-bold"
            >
              <Badge className="bg-primary hover:bg-primary text-white border-none">New</Badge>
              <span>Verified Listings in {selectedCity}</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter"
            >
              Find Your <br />
              Perfect <span className="text-primary">Ride.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-300 text-lg sm:text-2xl max-w-xl leading-relaxed font-medium"
            >
              Discover verified vehicles from trusted dealers. The smartest way to buy and sell in your city.
            </motion.p>
          </div>
          
            <motion.form 
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 backdrop-blur-xl p-3 rounded-[2rem] border border-white/20 shadow-2xl max-w-3xl"
            >
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <Input 
                  placeholder="Search brand, model..." 
                  className="bg-transparent border-none text-white placeholder:text-slate-400 h-12 pl-12 focus-visible:ring-0 text-base w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <div className="text-slate-900">
                  <SearchSuggestions 
                    suggestions={suggestions}
                    query={searchQuery}
                    isVisible={showSuggestions}
                    onSelect={handleSuggestionSelect}
                  />
                </div>
              </div>
            <div className="w-px bg-white/20 hidden sm:block h-8" />
            <CitySelector 
              className="bg-transparent hover:bg-white/10 text-white border-none h-12 px-6"
            />
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 w-full sm:w-auto"
            >
              Search
            </Button>
          </motion.form>
        </div>
      </section>

      {/* Recently Viewed (Continue Browsing) */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="text-primary" size={24} />
              Continue Browsing
            </h2>
            <Link to="/profile" className="text-primary text-sm font-semibold hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentlyViewed.map((vehicle) => (
              <Link key={vehicle.id} to={`/vehicle/${vehicle.id}`}>
                <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                  <img 
                    src={vehicle.images[0]} 
                    alt={vehicle.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                    <p className="text-white text-xs font-bold truncate">{vehicle.title}</p>
                    <p className="text-primary text-xs font-bold">₹{vehicle.price.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Categories</h2>
          <Button variant="link" className="text-primary p-0">View All</Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-2xl min-w-[100px] transition-all",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white border border-slate-100 text-slate-600 hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  isActive ? "bg-white/20" : "bg-slate-50"
                )}>
                  <Icon size={24} />
                </div>
                <span className="text-sm font-semibold">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Top Showrooms */}
      {shops.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Store className="text-primary" /> Trusted Showrooms
              </h2>
              <p className="text-slate-500 font-medium">Verified dealerships with best track records.</p>
            </div>
            <Link to="/search" className="group flex items-center gap-1 text-primary font-bold hover:text-primary/80 transition-colors">
              Explore All
              <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 px-1 no-scrollbar">
            {shops.map((shop) => (
              <Link 
                key={shop.id} 
                to={`/dealer/${shop.id}`}
                className="flex-none w-[280px] group"
              >
                <div className="bg-white rounded-[2rem] border border-slate-100 p-4 space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100">
                    <img 
                      src={shop.images[0] || 'https://picsum.photos/seed/shop/800/600'} 
                      alt={shop.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors truncate pr-2">{shop.name}</h3>
                      <div className="flex items-center gap-1 text-orange-500 text-sm font-bold bg-orange-50 px-2 py-0.5 rounded-lg">
                        <Star size={14} fill="currentColor" />
                        <span>{shop.rating || '4.5'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                      <MapPin size={14} className="text-slate-300" />
                      <span>{shop.city}, {shop.state}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Listings */}
      <section className="space-y-4 pt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Listings</h2>
          <div className="flex gap-2">
            <Link to="/search">
              <Button variant="ghost" className="text-primary font-bold">
                View All Listings
              </Button>
            </Link>
            <Button variant="outline" size="icon" className="rounded-full">
              <Filter size={18} />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))
          ) : (
            filteredVehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <VehicleCard vehicle={vehicle} />
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Dealer Map Promotion Section */}
      <section className="relative overflow-hidden rounded-[3rem] bg-indigo-900 p-8 sm:p-12 lg:p-16">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2000&auto=format&fit=crop" 
            alt="Maps background" 
            className="w-full h-full object-cover opacity-10"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-indigo-900/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-none py-1.5 px-4 rounded-full text-xs font-black uppercase tracking-widest">
                Interactive Map
              </Badge>
              <h2 className="text-4xl lg:text-6xl font-black text-white leading-[0.95] tracking-tighter">
                Explore Dealers <br />
                <span className="text-indigo-400 italic">Right on the Map</span>
              </h2>
              <h3 className="sr-only">Find Certified Showrooms</h3>
              <p className="text-indigo-100 text-xl max-w-xl font-medium leading-relaxed">
                Looking for the nearest certified showroom? Use our built-in map to explore dealerships across India, see their current inventory, and get instant directions.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => navigate('/find-dealers')}
                className="bg-white text-indigo-900 hover:bg-indigo-50 h-16 px-10 rounded-2xl text-lg font-black shadow-2xl transition-all hover:scale-105"
              >
                Find Dealers Near Me <MapPin className="ml-2" size={24} />
              </Button>
              <div className="flex items-center gap-3 px-6 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white">
                <div className="flex -space-x-4">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-900 overflow-hidden">
                       <img src={`https://i.pravatar.cc/150?u=${i}`} alt="User" referrerPolicy="no-referrer" />
                     </div>
                   ))}
                </div>
                <div className="text-xs font-bold leading-tight">
                  <span className="text-indigo-300">Join 5,000+</span> <br />
                  Verified Dealers
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full lg:w-auto relative">
             <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 transform md:rotate-2 hover:rotate-0 transition-transform duration-700 aspect-video lg:aspect-auto h-[300px] lg:h-[450px]">
                {/* Mock map visual */}
                <div className="absolute inset-0 bg-[#e5e3df] flex items-center justify-center">
                   <div className="relative w-full h-full opacity-60">
                     <img 
                      src="https://static.vecteezy.com/system/resources/previews/000/094/281/original/vector-world-map.jpg" 
                      alt="Map Visual"
                      className="w-full h-full object-cover grayscale"
                      referrerPolicy="no-referrer"
                     />
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40 relative z-10"
                        >
                          <MapPin size={24} />
                        </motion.div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />
                      </div>
                   </div>
                </div>
                
                {/* Floating card on mock map */}
                <div className="absolute bottom-6 left-6 right-6 lg:right-auto lg:w-64 bg-white rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom-8 duration-1000">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">
                        <img src="https://picsum.photos/seed/shop1/100/100" alt="Shop" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">Bhopal Motors</p>
                        <p className="text-[10px] text-slate-500">MP Nagar, Zone 1</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Market Insights / Blog Section */}
      <section className="py-12 bg-slate-50 -mx-4 px-4 rounded-[3rem] mt-12 border border-slate-100 hidden md:block">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
              Master the <span className="text-primary italic">Second Hand Car Market</span> in India
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              Thinking to <span className="font-bold text-slate-900">buy used cars India</span>? Our comprehensive guide covers trends in Bihar, Delhi, and Bangalore, along with popular models and expert tips to ensure you get the best value for your money.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-xs font-bold text-slate-700">1000+ Word Guide</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <Clock size={16} className="text-primary" />
                <span className="text-xs font-bold text-slate-700">8 Min Read</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <TrendingUp size={16} className="text-primary" />
                <span className="text-xs font-bold text-slate-700">2026 Trends</span>
              </div>
            </div>
            <Link to="/blog/used-car-market-india">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-black h-14 px-8 rounded-2xl text-lg uppercase tracking-widest mt-4">
                Read Full Guide <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>
          <div className="flex-1 relative">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
               <img 
                 src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop" 
                 alt="Buying Used Cars Guide" 
                 className="w-full h-full object-cover aspect-[4/3]"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
               <div className="absolute bottom-8 left-8 right-8 text-white">
                 <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Featured Article</p>
                 <h3 className="text-2xl font-bold leading-tight">Navigating the Indian Used Car Market in 2026</h3>
               </div>
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl z-[-1]" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
