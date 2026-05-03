import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Car, Bike, Truck, Clock, Store, Star, ChevronRight, ArrowRight, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
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
import { generateStartupSpecPDF } from '@/services/pdfService';
import { FileText } from 'lucide-react';

import { Helmet } from 'react-helmet-async';

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
      <Helmet>
        <title>Buy & Sell Used Cars in {selectedCity || 'India'} | AsoneDealer</title>
        <meta name="description" content={`Find 100% verified used cars, bikes, and commercial vehicles in ${selectedCity || 'India'}. Connect directly with certified showrooms and dealers. Best prices and free paperwork.`} />
        <meta name="keywords" content={`used cars ${selectedCity}, second hand cars Indian, buy used cars, sell my car, certified showrooms, asonedealer, car market India`} />
        <link rel="canonical" href="https://asonedealer.com/" />
      </Helmet>
      {/* Hero / Search Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-20 overflow-hidden bg-slate-50">
        {/* Modern Graphic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,99,33,0.08)_0%,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -mr-96 -mb-96" />
          <div className="absolute top-1/4 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -ml-32" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live in {selectedCity || 'India'} • 2,400+ Verified Cars
          </motion.div>

          <div className="flex flex-col items-center gap-6 sm:gap-8">
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] font-black leading-[0.9] sm:leading-[0.85] tracking-[-0.04em] text-slate-900"
              >
                The Modern <br />
                Way to <span className="text-primary italic">Drive.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-500 text-base sm:text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium px-4"
              >
                Transparent showrooms. AI-powered valuations. <br className="hidden md:block" />
                Direct access to the best used cars in {selectedCity || 'India'}.
              </motion.p>
            </div>

            {/* Core Actions & Search Hub */}
            <div className="w-full max-w-4xl space-y-8 sm:space-y-12">
              {/* Buy & Sell Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
              >
                <Button 
                  onClick={() => navigate('/search')}
                  className="w-full sm:w-auto h-16 sm:h-20 px-8 sm:px-12 rounded-2xl sm:rounded-3xl bg-primary hover:bg-orange-600 text-white font-black uppercase text-base sm:text-lg tracking-widest shadow-2xl shadow-primary/40 transition-all hover:scale-105 active:scale-95 group"
                >
                  Buy a Car
                  <ArrowRight className="ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
                <Button 
                  onClick={() => navigate('/list-vehicle')}
                  variant="outline"
                  className="w-full sm:w-auto h-16 sm:h-20 px-8 sm:px-12 rounded-2xl sm:rounded-3xl border-slate-200 bg-white/50 backdrop-blur-sm text-slate-900 hover:bg-white hover:border-slate-300 font-black uppercase text-base sm:text-lg tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                  Sell Your Car
                </Button>
              </motion.div>

                {/* PDF Export Link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex justify-center"
                >
                  <button 
                    onClick={generateStartupSpecPDF}
                    className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-all group"
                  >
                    <FileText size={14} className="group-hover:scale-110 transition-transform" />
                    Download Feature Guide (PDF)
                  </button>
                </motion.div>

                {/* Search Command Center */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-white p-2 rounded-[2rem] md:rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-slate-100 backdrop-blur-sm group transition-all hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.16)] mx-4">
                    <form 
                      onSubmit={handleSearch}
                      className="flex flex-col md:flex-row items-center gap-1"
                    >
                      <div className="flex-1 w-full relative flex items-center min-h-[56px] md:min-h-[64px]">
                        <Search className="absolute left-6 md:left-7 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
                        <Input 
                          placeholder="Search Brand or Model..." 
                          className="bg-transparent border-none text-slate-900 placeholder:text-slate-400 h-14 md:h-20 pl-14 md:pl-16 pr-6 focus-visible:ring-0 text-base md:text-lg font-medium"
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
                      
                      <div className="h-12 w-px bg-slate-200 hidden md:block" />
                      
                      <div className="flex w-full md:w-auto flex-col sm:flex-row items-center gap-2 p-2 md:p-0">
                        <CitySelector 
                          className="bg-slate-50 md:bg-transparent hover:bg-slate-50 text-slate-800 border-none h-14 md:h-16 px-6 md:px-8 font-black text-sm md:text-base w-full md:w-auto rounded-2xl md:rounded-none"
                        />
                        <Button 
                          type="submit"
                          className="w-full md:w-auto h-14 md:h-16 px-10 md:px-12 rounded-2xl md:rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-base md:text-lg shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                          Find Cars
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Advanced Shortcuts */}
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 px-4">
                    {[
                      { label: "Luxury SUVs", icon: Car },
                      { label: "Under 5 Lakhs", icon: TrendingUp },
                      { label: "Automatic", icon: ArrowRight },
                      { label: "Direct Dealer", icon: Store }
                    ].map((tag) => (
                      <button 
                        key={tag.label}
                        onClick={() => {
                          setSearchQuery(tag.label);
                          handleSearch();
                        }}
                        className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary" />
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
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

      {/* Super Discovery Rail */}
      <section className="space-y-8 pt-12 overflow-hidden">
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
