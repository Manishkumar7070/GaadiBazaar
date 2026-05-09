import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Car, Bike, Truck, Clock, Store, Star, ChevronRight, ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, Shield, Users, Briefcase, Compass, IndianRupee, Mountain, Heart } from 'lucide-react';
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
import { Helmet } from 'react-helmet-async';
import HeroCarousel from '@/features/home/HeroCarousel';

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
        const queryFilters: any = { verificationStatus: 'verified' };
        if (selectedCity && selectedCity !== 'India') {
          queryFilters.userCity = selectedCity;
        }
        
        const [vehicleData, shopData] = await Promise.all([
          vehicleService.fetchVehicles(queryFilters),
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
      <Helmet>
        <title>Buy & Sell Used Cars in {selectedCity || 'India'} | AsoneDealer</title>
        <meta name="description" content={`Find 100% verified used cars, bikes, and commercial vehicles in ${selectedCity || 'India'}. Connect directly with certified showrooms and dealers. Best prices and free paperwork.`} />
        <meta name="keywords" content={`used cars ${selectedCity}, second hand cars Indian, buy used cars, sell my car, certified showrooms, asonedealer, car market India`} />
        <link rel="canonical" href="https://asonedealer.com/" />
      </Helmet>
      {/* Hero / Search Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-24 sm:pt-28 sm:pb-32 overflow-hidden bg-slate-900">
        {/* Carousel Background */}
        <div className="absolute inset-0 z-0">
          <HeroCarousel />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center space-y-4 sm:space-y-10">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-white text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl"
          >
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
            Live in {selectedCity || 'India'} • 2,400+ Verified Cars
          </motion.div>

          <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8">
            <div className="space-y-2 sm:space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem] font-[1000] leading-[1.1] sm:leading-[1] md:leading-[0.85] tracking-[-0.05em] text-white"
              >
                Find your <br className="sm:hidden" />
                Next <span className="text-primary underline decoration-white underline-offset-[8px] sm:underline-offset-[12px] decoration-2 sm:decoration-4">Legend.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/80 text-sm sm:text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed font-semibold px-4"
              >
                The dealer-first marketplace for people who value <br className="hidden md:block" />
                transparency, local trust, and premium service.
              </motion.p>
            </div>

            <div className="w-full max-w-4xl space-y-6 sm:space-y-10 mt-2">
              {/* Primary High-Converting CTAs */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-row items-center justify-center gap-2 sm:gap-8 px-2"
              >
                <div className="relative group flex-1">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-600 rounded-2xl sm:rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <Button 
                    onClick={() => navigate('/search')}
                    className="relative w-full h-16 sm:h-20 md:h-24 px-4 sm:px-8 rounded-xl sm:rounded-3xl bg-slate-900 text-white hover:bg-slate-800 font-[950] uppercase text-[10px] sm:text-base md:text-xl tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-0 sm:gap-1"
                  >
                    <span>Find Best Car</span>
                    <span className="text-[7px] sm:text-[10px] text-white/50 font-black tracking-[0.2em] sm:tracking-[0.3em]">Browse Inventory</span>
                  </Button>
                </div>

                <div className="relative group flex-1">
                  <Button 
                    onClick={() => navigate('/list-vehicle')}
                    variant="outline"
                    className="w-full h-16 sm:h-20 md:h-24 px-4 sm:px-8 rounded-xl sm:rounded-3xl border-2 border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 font-[950] uppercase text-[10px] sm:text-base md:text-xl tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center gap-0 sm:gap-1"
                  >
                    <span>Sell Your Car</span>
                    <span className="text-[7px] sm:text-[10px] text-white/50 font-black tracking-[0.2em] sm:tracking-[0.3em]">Instant Valuations</span>
                  </Button>
                </div>
              </motion.div>

              {/* Integrated Search Command Center */}
              <div className="space-y-2 sm:space-y-4 w-full px-2 sm:px-0">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="relative"
                >
                  <div className="bg-white p-1 rounded-2xl sm:rounded-full shadow-2xl border border-white/10">
                    <form 
                      onSubmit={handleSearch}
                      className="flex flex-row items-center h-10 sm:h-12 md:h-14"
                    >
                      <div className="flex-1 relative flex items-center h-full">
                        <Search className="absolute left-3 sm:left-6 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <Input 
                          placeholder="Search cars, brands..." 
                          className="bg-transparent border-none text-slate-900 placeholder:text-slate-400 h-full pl-10 sm:pl-14 pr-4 focus-visible:ring-0 text-sm sm:text-base font-bold"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        <SearchSuggestions 
                          suggestions={suggestions}
                          query={searchQuery}
                          isVisible={showSuggestions}
                          onSelect={handleSuggestionSelect}
                        />
                      </div>
                      
                      <div className="h-6 w-px bg-slate-100 hidden sm:block mx-2" />
                      
                      <div className="flex items-center gap-1 sm:gap-2 pr-1">
                        <CitySelector 
                          className="bg-transparent hover:bg-slate-50 text-slate-900 border-none h-full px-2 sm:px-4 font-black text-[10px] sm:text-xs hidden md:flex"
                        />
                        <Button 
                          type="submit"
                          className="h-8 sm:h-10 md:h-12 px-3 sm:px-8 rounded-lg sm:rounded-full bg-primary hover:bg-orange-600 text-white font-black text-[10px] sm:text-sm shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          Search
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>

                {/* Quick Discovery Tags Row */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap justify-center gap-4 sm:gap-10 px-4"
                >
                  {[
                    { label: "Family Cars", icon: Users },
                    { label: "Luxury SUVs", icon: Star },
                    { label: "Budget Friendly", icon: IndianRupee },
                    { label: "Verified Dealers", icon: Store }
                  ].map((tag) => (
                    <button 
                      key={tag.label}
                      onClick={() => {
                        setSearchQuery(tag.label);
                        handleSearch();
                      }}
                      className="flex items-center gap-2 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-primary transition-all group"
                    >
                      <tag.icon size={10} className="text-white/20 group-hover:text-primary transition-colors" />
                      {tag.label}
                    </button>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Background Assets */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] pointer-events-none opacity-40 mix-blend-multiply overflow-hidden">
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px]" />
        </div>
      </section>

      {/* Trust & Transparency Dashboard (Bento Grid) */}
      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {/* Main Value Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 lg:col-span-3 bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between min-h-[320px] shadow-2xl overflow-hidden relative group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <ShieldCheck size={180} strokeWidth={1} />
            </div>
            <div className="relative z-10 space-y-4">
              <Badge className="bg-primary hover:bg-primary text-white border-none text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full">
                Transparency Audit
              </Badge>
              <h3 className="text-4xl font-black leading-tight tracking-tighter">
                Showroom Verified. <br />
                Expert Approved.
              </h3>
              <p className="text-slate-400 font-medium max-w-sm">
                Every vehicle on our platform undergoes a rigorous 120-point physical inspection at the dealer's site.
              </p>
            </div>
            <div className="relative z-10 pt-6 border-t border-white/10 flex items-center gap-6">
               <div className="flex -space-x-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                     <img src={`https://i.pravatar.cc/100?u=${i+20}`} alt="Expert" referrerPolicy="no-referrer" />
                   </div>
                 ))}
               </div>
               <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
                 Audit Team Live
               </span>
            </div>
          </motion.div>

          {/* Sell Car Quick Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 lg:col-span-3 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl flex flex-col justify-between min-h-[320px] relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-10 text-primary/5 group-hover:text-primary/10 transition-colors">
               <TrendingUp size={160} strokeWidth={3} />
             </div>
             <div className="space-y-4 relative z-10">
               <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-primary mb-6">
                 <ArrowRight size={32} />
               </div>
               <h3 className="text-4xl font-black leading-tight tracking-tighter text-slate-900">
                 Sell Your Car <br />
                 In 24 Hours.
               </h3>
               <p className="text-slate-500 font-medium max-w-xs">
                 Get an instant AI valuation and receive offers from verified buyers across {selectedCity || 'India'}.
               </p>
             </div>
             <div className="pt-6 relative z-10">
               <Button 
                onClick={() => navigate('/list-vehicle')}
                variant="outline" 
                className="rounded-2xl h-14 px-8 border-primary text-primary hover:bg-primary hover:text-white font-black uppercase text-xs tracking-widest transition-all"
               >
                 Get Valuation Now
               </Button>
             </div>
          </motion.div>

          {/* Paperwork Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 lg:col-span-2 bg-indigo-50 rounded-[3rem] p-8 space-y-6 flex flex-col justify-center border border-indigo-100 group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-indigo-900">Zero Paperwork</h4>
              <p className="text-sm font-medium text-indigo-700/70">RC Transfer and Insurance handled by our team at no extra cost.</p>
            </div>
          </motion.div>

          {/* Financing Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 lg:col-span-2 bg-emerald-50 rounded-[3rem] p-8 space-y-6 flex flex-col justify-center border border-emerald-100 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Star size={24} fill="currentColor" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-emerald-900">Easy EMI</h4>
              <p className="text-sm font-medium text-emerald-700/70">Connect with 12+ banking partners for instant loan approvals.</p>
            </div>
          </motion.div>

          {/* Live Activity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="md:col-span-4 lg:col-span-2 bg-slate-50 rounded-[3rem] p-8 flex flex-col justify-center border border-slate-200 overflow-hidden relative"
          >
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Pulse</p>
              <div className="space-y-3">
                {[
                  { text: "Swift sold in Delhi", time: "2m ago" },
                  { text: "Thar verified in Pune", time: "15m ago" },
                  { text: "New Audi listed", time: "1h ago" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      {item.text}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
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
                    className={cn(
                      "w-full h-full object-cover transition-transform group-hover:scale-110",
                      vehicle.status === 'sold' && "grayscale opacity-80"
                    )}
                    referrerPolicy="no-referrer"
                  />
                  {vehicle.status === 'sold' && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                      <Badge className="bg-white/10 border border-white/40 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg backdrop-blur-sm">
                        Sold
                      </Badge>
                    </div>
                  )}
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

      {/* Browse by Purpose Section */}
      <section className="container mx-auto px-4 py-12 space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <Badge variant="outline" className="text-primary border-primary/20 px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black">
            Personalized Discovery
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
            Browse by <span className="text-primary italic">Purpose.</span>
          </h2>
          <p className="text-slate-500 font-medium max-w-xl">
            Choose the perfect vehicle based on how you actually plan to use it.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { id: 'family', label: 'Family First', desc: 'Space, Safety & Comfort', icon: Users, color: 'bg-blue-50 text-blue-600', hover: 'hover:bg-blue-600' },
            { id: 'commute', label: 'Office/Daily', desc: 'Efficiency & Ease', icon: Briefcase, color: 'bg-indigo-50 text-indigo-600', hover: 'hover:bg-indigo-600' },
            { id: 'touring', label: 'Long Drive', desc: 'Power & Performance', icon: Compass, color: 'bg-orange-50 text-orange-600', hover: 'hover:bg-orange-600' },
            { id: 'budget', label: 'Mileage King', desc: 'Savings & Value', icon: IndianRupee, color: 'bg-green-50 text-green-600', hover: 'hover:bg-green-600' },
            { id: 'offroad', label: 'Off-Roading', desc: 'Rugged & Capable', icon: Mountain, color: 'bg-slate-50 text-slate-600', hover: 'hover:bg-slate-900' }
          ].map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/search?purpose=${item.id}`)}
              className="group bg-white border border-slate-100 rounded-[2rem] p-6 flex flex-col items-center text-center gap-4 cursor-pointer hover:border-transparent hover:shadow-2xl transition-all duration-300"
            >
              <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300`}>
                <item.icon size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{item.label}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Browse by Budget Section */}
      <section className="bg-slate-900 py-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -ml-48 -mb-48" />
        
        <div className="container mx-auto px-4 relative z-10 space-y-12">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="space-y-2">
              <Badge className="bg-primary/20 text-primary border-none px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black">
                Price Transparency
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                Browse by <span className="text-primary italic">Budget.</span>
              </h2>
            </div>
            <Link to="/search" className="text-slate-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-2">
              View Price Trends <TrendingUp size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Under ₹3 Lakhs', range: [0, 300000], img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=400' },
              { label: '₹3L – ₹7 Lakhs', range: [300000, 700000], img: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=400' },
              { label: '₹7L – ₹15 Lakhs', range: [700000, 1500000], img: 'https://images.unsplash.com/photo-1567808291548-fc3ee04dbac0?q=80&w=400' },
              { label: 'Premium (15L+)', range: [1500000, 200000000], img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=400' }
            ].map((budget, i) => (
              <motion.div
                key={budget.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(`/search?minPrice=${budget.range[0]}&maxPrice=${budget.range[1]}`)}
                className="group relative h-48 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-2xl"
              >
                <img 
                  src={budget.img} 
                  alt={budget.label} 
                  className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:scale-110 group-hover:opacity-60 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <h3 className="text-xl font-black text-white">{budget.label}</h3>
                  <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transition-transform">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">View Vehicles</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Super Discovery Rail (Lifestyle Patterns) */}
      <section className="space-y-8 pt-20 overflow-hidden">
        <div className="container mx-auto px-4 flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
              Explore by <span className="text-primary italic">Lifestyle.</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">What drives you today?</p>
          </div>
          <div className="hidden md:flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border",
                  activeCategory === cat.id 
                    ? "bg-slate-900 text-white border-slate-900" 
                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar px-5 md:px-[calc((100vw-1280px)/2+20px)] lg:px-[calc((100vw-1280px)/2+20px)] xl:px-[calc((100vw-1280px)/2+20px)]">
          {[
            { id: 'luxury', label: 'Luxury Icons', sub: 'Rolls, Benz, BMW', img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=600&auto=format&fit=crop', color: 'bg-indigo-900' },
            { id: 'suv', label: 'Adventure SUVs', sub: 'Thar, Fortuner, Creta', img: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=600&auto=format&fit=crop', color: 'bg-emerald-900' },
            { id: 'hatchback', label: 'City Daily', sub: 'Swift, i20, Baleno', img: 'https://images.unsplash.com/photo-1567808291548-fc3ee04dbac0?q=80&w=600&auto=format&fit=crop', color: 'bg-orange-900' },
            { id: 'electric', label: 'EV Revolution', sub: 'Nexon EV, MG ZS', img: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=600&auto=format&fit=crop', color: 'bg-blue-900' },
          ].map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-none w-[300px] md:w-[400px] h-[500px] rounded-[3.5rem] overflow-hidden relative group cursor-pointer"
              onClick={() => {
                setActiveCategory(item.id === 'luxury' ? 'car' : item.id === 'suv' ? 'car' : 'all');
                navigate(`/search?q=${item.label}`);
              }}
            >
              <img 
                src={item.img} 
                alt={item.label} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-10 left-10 right-10 space-y-2">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-none text-[8px] uppercase tracking-[0.3em] font-black py-1 px-3">
                  Featured Category
                </Badge>
                <h3 className="text-3xl font-black text-white leading-tight">{item.label}</h3>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider">{item.sub}</p>
                <div className="pt-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                   <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
                      <ArrowRight size={20} />
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Showrooms */}
      {shops.length > 0 && (
        <section className="container mx-auto px-4 py-8 sm:py-16 space-y-6 sm:space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="text-primary border-primary/20 px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black">
                Featured Showrooms
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
                <Store className="text-primary" size={32} /> Trusted Partners
              </h2>
              <p className="text-slate-500 font-medium text-sm sm:text-base">Verified dealerships with 100% genuine inventory & service guarantee.</p>
            </div>
            <Link to="/search" className="group flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest hover:text-primary/80 transition-colors">
              Explore All Showrooms
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {shops.slice(0, 4).map((shop) => (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                onClick={() => navigate(`/dealer/${shop.id}`)}
                className="group bg-white rounded-[2.5rem] border border-slate-100 p-5 space-y-5 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 cursor-pointer"
              >
                <div className="aspect-[16/10] rounded-3xl overflow-hidden bg-slate-100 relative">
                  <img 
                    src={shop.logo || shop.images[0] || 'https://picsum.photos/seed/shop/800/600'} 
                    alt={shop.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {shop.isPremium && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary text-white border-none px-3 py-1 font-black text-[8px] uppercase tracking-widest h-6 rounded-full shadow-lg">
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="space-y-3 px-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-xl text-slate-900 group-hover:text-primary transition-colors truncate">{shop.name}</h3>
                    <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full text-orange-600 border border-orange-100">
                      <Star size={14} fill="currentColor" />
                      <span className="text-sm font-black">{shop.rating || '4.5'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <MapPin size={16} className="text-primary" />
                    <span>{shop.city}, {shop.state}</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Verified Showroom</span>
                    <ArrowRight size={16} className="text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Brand Discovery */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <Badge variant="outline" className="text-primary border-primary/20 px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black">
            The Elite Network
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
            Shop by <span className="text-primary">Trusted Brands.</span>
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: 'Maruti Suzuki', img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=200&auto=format&fit=crop' },
            { name: 'Hyundai', img: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=200&auto=format&fit=crop' },
            { name: 'Toyota', img: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=200&auto=format&fit=crop' },
            { name: 'Tata Motors', img: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=200&auto=format&fit=crop' },
            { name: 'Mahindra', img: 'https://images.unsplash.com/photo-1631195123280-9975f81f185d?q=80&w=200&auto=format&fit=crop' },
            { name: 'BMW', img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=200&auto=format&fit=crop' },
          ].map((brand, i) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/search?q=${brand.name}`)}
              className="group bg-white border border-slate-100 rounded-3xl p-6 flex flex-col items-center gap-4 cursor-pointer hover:border-primary/30 hover:shadow-xl transition-all"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <img 
                  src={brand.img} 
                  alt={brand.name} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                  referrerPolicy="no-referrer"
                 />
              </div>
              <span className="text-xs font-black text-slate-600 group-hover:text-slate-900">{brand.name}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center mt-12">
          <Button 
            variant="outline" 
            className="rounded-full px-12 h-14 border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-lg shadow-slate-200/50"
            onClick={() => navigate('/brands')}
          >
            Explore All Manufacturers
          </Button>
        </div>
      </section>

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
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] bg-indigo-900 p-6 sm:p-12 lg:p-16">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2000&auto=format&fit=crop" 
              alt="Maps background" 
              className="w-full h-full object-cover opacity-10"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-indigo-900/80 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 sm:gap-12">
            <div className="flex-1 space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <div className="flex justify-center lg:justify-start">
                  <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-none py-1.5 px-4 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest">
                    Interactive Map
                  </Badge>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight sm:leading-[0.95] tracking-tighter">
                  Explore Dealers <br />
                  <span className="text-indigo-400 italic">Right on the Map</span>
                </h2>
                <p className="text-indigo-100 text-base sm:text-xl max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                  Looking for the nearest certified showroom? Use our built-in map to explore dealerships across India, see their current inventory, and get instant directions.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Button 
                  onClick={() => navigate('/find-dealers')}
                  className="bg-white text-indigo-900 hover:bg-indigo-50 h-14 sm:h-16 px-8 sm:px-10 rounded-xl sm:rounded-2xl text-base sm:text-lg font-black shadow-2xl transition-all hover:scale-105"
                >
                  Find Dealers Near Me <MapPin className="ml-2" size={20} />
                </Button>
                <div className="flex items-center justify-center gap-3 px-6 h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white">
                  <div className="flex -space-x-3 sm:space-x-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-indigo-900 overflow-hidden">
                        <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="User" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] sm:text-xs font-bold leading-tight text-left">
                    <span className="text-indigo-300">Join 5,100+</span> <br />
                    Verified Dealers
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full relative">
               <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 transform md:rotate-2 hover:rotate-0 transition-transform duration-700 h-[250px] sm:h-[350px] lg:h-[450px]">
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
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40 relative z-10"
                          >
                            <MapPin size={20} className="sm:w-6 sm:h-6" />
                          </motion.div>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-2 bg-black/20 rounded-full blur-sm" />
                        </div>
                     </div>
                  </div>
                  
                  {/* Floating card on mock map */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:w-64 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl animate-in slide-in-from-bottom-8 duration-1000">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-100 overflow-hidden">
                          <img src="https://picsum.photos/seed/shop1/100/100" alt="Shop" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs font-black text-slate-900 truncate">Bhopal Motors</p>
                          <p className="text-[9px] sm:text-[10px] text-slate-500">MP Nagar, Zone 1</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Insights / Blog Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <div className="bg-slate-50 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-12 lg:p-16 border border-slate-100 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="space-y-4">
                <Badge variant="outline" className="text-primary border-primary/20 px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black">
                  Industry Insights
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tighter">
                  Master the <span className="text-primary italic">Second Hand Car Market</span> in India
                </h2>
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
                  Thinking to <span className="font-bold text-slate-900">buy used cars India</span>? Our comprehensive guide covers trends in Bihar, Delhi, and Bangalore, along with popular models and expert tips to ensure you get the best value for your money.
                </p>
              </div>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4">
                {[
                  { icon: CheckCircle2, text: "1000+ Word Guide", color: "text-green-500" },
                  { icon: Clock, text: "8 Min Read", color: "text-primary" },
                  { icon: TrendingUp, text: "2026 Trends", color: "text-primary" }
                ].map((tag, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-tiny">
                    <tag.icon size={14} className={tag.color} />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700">{tag.text}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <Link to="/blog/used-car-market-india">
                  <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black h-14 px-10 rounded-2xl text-base uppercase tracking-widest group">
                    Read Full Guide <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full lg:w-auto relative group">
              <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-primary/10">
                 <img 
                   src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop" 
                   alt="Buying Used Cars Guide" 
                   className="w-full h-full object-cover aspect-[4/3] transition-transform duration-1000 group-hover:scale-110"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                 <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white">
                   <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Featured Article</p>
                   <h3 className="text-xl sm:text-3xl font-black leading-tight">Navigating the Indian Used Car Market in 2026</h3>
                 </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-3xl z-[-1] group-hover:scale-125 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section id="download-section" className="container mx-auto px-4 py-20">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
          {/* Background Glow */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -ml-48 -mt-48" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -mr-48 -mb-48" />

          <div className="flex-1 space-y-8 relative z-10 text-center md:text-left">
            <div className="space-y-4">
              <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 rounded-full uppercase text-[10px] tracking-[0.3em] font-black">
                Coming Soon to Stores
              </Badge>
              <h2 className="text-4xl md:text-6xl font-[1000] text-white tracking-tighter leading-[0.95]">
                The Future of <br />
                <span className="text-primary italic">Auto Trading</span> <br />
                In Your Pocket.
              </h2>
              <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl">
                Experience the smoothest way to buy and sell vehicles. Real-time notifications, instant valuations, and secure chat with dealers.
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <button className="flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 px-6 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 group">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                   <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.523 15.3414C17.5108 15.3536 17.1511 15.7001 16.6433 16.2922C15.8209 17.2608 15.228 17.962 14.8624 18.2575C14.0722 18.8997 13.149 19 12.0917 18.5583C11.6669 18.3813 11.1611 18.1593 10.5739 17.8924C10.027 17.6521 9.48918 17.4118 8.96001 17.1714C8.43085 16.9311 7.91189 16.7111 7.39423 16.5113C6.46648 16.1493 5.48513 16.4803 4.93922 17.3392C4.39332 18.1981 4.49216 19.2618 5.18683 20.0031C5.43842 20.2721 5.67295 20.5234 5.89045 20.757C6.67137 21.5975 7.42436 21.7371 8.14881 21.1764L13.1706 17.3013C13.5684 16.9947 13.7915 16.5298 13.7548 16.0371C13.7182 15.5444 13.4278 15.1099 12.9806 14.8967L6.8203 12.0163C6.38605 11.8153 5.86791 11.8727 5.48312 12.1643C5.09833 12.4559 4.88636 12.9515 4.93489 13.4475L5.4384 19.3394C5.45265 19.505 5.54848 19.65 5.69805 19.7347C5.84762 19.8194 6.03362 19.8315 6.19323 19.7663L16.6341 15.5134C16.9404 15.3888 17.2023 15.1763 17.3752 14.9082C17.5481 14.6401 17.6212 14.3312 17.5816 14.0258L16.4172 5.0963C16.3786 4.8009 16.2081 4.5427 15.9458 4.382C15.6835 4.2213 15.3619 4.1788 15.0568 4.2644L5.61528 6.9157C5.23438 7.0227 4.93489 7.3204 4.81432 7.6917C4.69375 8.0631 4.76779 8.4627 5.01168 8.7619L11.761 17.0232C12.0621 17.3917 12.5186 17.6019 12.9972 17.5915C13.4758 17.5811 13.916 17.3516 14.1802 16.9482C14.7335 16.108 15.3129 15.384 15.918 14.7762C16.4386 14.2496 16.9248 13.8833 17.3768 13.6772C18.2435 13.2829 19.1678 13.3934 20.1504 14.02C20.4851 14.2332 20.8201 14.4464 21.1554 14.6596C21.6834 14.9947 22.2117 15.3298 22.7402 15.6651C23.6335 16.2307 24.1685 17.2023 24.0881 18.2575Z"></path></svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Download for</p>
                  <p className="text-sm font-black uppercase">App Store</p>
                </div>
              </button>

              <button className="flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 px-6 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 group">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                   <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M3.609 1.814L13.792 12 3.609 22.186c-.18.18-.281.425-.281.68s.101.5.281.68c.375.375.983.375 1.358 0L16.508 12.01l-11.541-11.541c-.375-.375-.983-.375-1.358 0-.18.18-.281.425-.281.68s.101.5.281.68l-.001-.015zM22.5 12c0-.5-.2-1-.6-1.4l-3-3c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4l1.6 1.6H9c-.6 0-1 .4-1 1s.4 1 1 1h10.1l-1.6 1.6c-.4.4-.4 1 0 1.4.2.2.5.3.7.3s.5-.1.7-.3l3-3c.4-.4.6-.9.6-1.4z"></path></svg>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Get it on</p>
                  <p className="text-sm font-black uppercase">Google Play</p>
                </div>
              </button>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-6 pt-4">
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-800">
                     <img src={`https://i.pravatar.cc/100?u=${i+100}`} alt="User" referrerPolicy="no-referrer" />
                   </div>
                 ))}
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span className="text-white">12K+</span> Early waitlist users
              </p>
            </div>
          </div>

          <div className="flex-1 relative hidden lg:block">
            <div className="relative z-10 w-[320px] aspect-[9/19] bg-slate-800 rounded-[3rem] border-[8px] border-slate-700 shadow-2xl mx-auto overflow-hidden rotate-6 hover:rotate-0 transition-transform duration-700 group">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 flex justify-center items-end pb-1">
                <div className="w-16 h-1 rounded-full bg-slate-700" />
              </div>
              <img 
                src="/src/assets/images/regenerated_image_1778243130971.png" 
                alt="App Screenshot" 
                className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent flex flex-col justify-end p-8 text-white">
                <p className="text-2xl font-black italic">Buy your legend.</p>
              </div>
            </div>
            {/* Ambient Shadow */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-12 bg-black/40 blur-3xl rounded-full" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
