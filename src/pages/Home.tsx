import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Car, Bike, Truck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MOCK_VEHICLES } from '@/constants/mockData';
import VehicleCard from '@/features/vehicles/VehicleCard';
import VehicleCardSkeleton from '@/features/vehicles/VehicleCardSkeleton';
import { motion } from 'motion/react';
import { Vehicle } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { vehicleService } from '@/services/vehicle.service';

const Home = () => {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [recentlyViewed, setRecentlyViewed] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVehicles = async () => {
      setIsLoading(true);
      try {
        const data = await vehicleService.fetchVehicles({ verificationStatus: 'verified' });
        // If no vehicles in Firestore, use mock data for demo
        setVehicles(data.length > 0 ? data : MOCK_VEHICLES);
      } catch (error) {
        console.error('Error loading vehicles:', error);
        setVehicles(MOCK_VEHICLES);
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicles();

    const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    // Ensure unique IDs
    const uniqueIds = Array.from(new Set(viewedIds)) as string[];
    const viewedVehicles = uniqueIds
      .map((id: string) => MOCK_VEHICLES.find(v => v.id === id))
      .filter(Boolean)
      .slice(0, 4) as Vehicle[];
    setRecentlyViewed(viewedVehicles);
  }, []);

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

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      // Save to recent searches
      const saved = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [searchQuery.trim(), ...saved.filter((s: string) => s !== searchQuery.trim())].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
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
              <span>Verified Listings in Bhopal</span>
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
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input 
                placeholder="Search brand, model..." 
                className="bg-transparent border-none text-white placeholder:text-slate-400 h-12 pl-12 focus-visible:ring-0 text-base w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-px bg-white/20 hidden sm:block h-8" />
            <div className="flex items-center gap-2 px-4 py-2 sm:py-0">
              <MapPin className="text-primary shrink-0" size={20} />
              <span className="text-sm font-medium whitespace-nowrap">Bhopal, MP</span>
            </div>
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

      {/* Featured Listings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Listings</h2>
          <div className="flex gap-2">
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
    </div>
  );
};

export default Home;
