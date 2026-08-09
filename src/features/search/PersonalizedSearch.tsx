import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  FileText, 
  Building, 
  MapPin, 
  IndianRupee, 
  Car, 
  Bike,
  Truck,
  ChevronDown, 
  Check, 
  X,
  Gauge,
  Briefcase,
  Star,
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '@/context/LocationContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Defined types for search parameters
interface BudgetOption {
  label: string;
  minPrice?: number;
  maxPrice?: number;
}

const BUDGET_OPTIONS: BudgetOption[] = [
  { label: 'All Budgets' },
  { label: 'Under ₹3 Lakhs', maxPrice: 300000 },
  { label: '₹3L – ₹7 Lakhs', minPrice: 300000, maxPrice: 700000 },
  { label: '₹7L – ₹15 Lakhs', minPrice: 700000, maxPrice: 1500000 },
  { label: 'Above ₹15 Lakhs', minPrice: 1500000 }
];

const BRAND_OPTIONS = [
  'All Brands',
  'Maruti Suzuki',
  'Hyundai',
  'Tata',
  'Mahindra',
  'Toyota',
  'Honda',
  'Kia',
  'BMW',
  'Mercedes-Benz',
  'Audi'
];

const BIHAR_UP_CITIES = [
  'Bikramganj, Bihar',
  'Patna, Bihar',
  'Ara, Bihar',
  'Sasaram, Bihar',
  'Buxar, Bihar',
  'Delhi NCR',
  'Bangalore',
  'Mumbai',
  'Pune',
  'Lucknow, UP',
  'Varanasi, UP'
];

const VEHICLE_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'car', label: 'Cars (Sedan/SUV)' },
  { value: 'bike', label: 'Bikes & Scooters' },
  { value: 'commercial', label: 'Commercial Vehicles' }
];

export const PersonalizedSearch = () => {
  const navigate = useNavigate();
  const { selectedCity, setSelectedCity } = useLocation();
  const [activeTab, setActiveTab] = useState<'find_car' | 'list_car' | 'dealer'>('find_car');
  
  // Selection states
  const [selectedBudget, setSelectedBudget] = useState<BudgetOption>(BUDGET_OPTIONS[0]);
  const [selectedBrand, setSelectedBrand] = useState<string>('All Brands');
  const [citySearchValue, setCitySearchValue] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Bikramganj, Bihar');
  const [selectedType, setSelectedType] = useState<{ value: string; label: string }>(VEHICLE_TYPES[0]);

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState<'budget' | 'brand' | 'location' | 'type' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update selected location if context city changes (to keep synchronized optionally)
  useEffect(() => {
    if (selectedCity && selectedCity !== 'India') {
      const match = BIHAR_UP_CITIES.find(c => c.toLowerCase().includes(selectedCity.toLowerCase()));
      if (match) {
        setSelectedLocation(match);
      } else {
        setSelectedLocation(`${selectedCity}, India`);
      }
    }
  }, [selectedCity]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // Brand search query
    if (selectedBrand && selectedBrand !== 'All Brands') {
      params.set('q', selectedBrand);
    }

    // Budget constraints
    if (selectedBudget.minPrice !== undefined) {
      params.set('minPrice', selectedBudget.minPrice.toString());
    }
    if (selectedBudget.maxPrice !== undefined) {
      params.set('maxPrice', selectedBudget.maxPrice.toString());
    }

    // Location query
    if (selectedLocation) {
      // Extract city name before comma
      const cityName = selectedLocation.split(',')[0].trim();
      params.set('city', cityName);
      
      // Update global context
      setSelectedCity(cityName);
    }

    // Vehicle Type
    if (selectedType && selectedType.value !== 'all') {
      params.set('type', selectedType.value);
    }

    navigate(`/search?${params.toString()}`);
  };

  const handleTabClick = (tab: 'find_car' | 'list_car' | 'dealer') => {
    setActiveTab(tab);
    if (tab === 'list_car') {
      navigate('/list-vehicle');
    } else if (tab === 'dealer') {
      navigate('/find-dealers');
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-[580px] mx-auto lg:mx-0 relative z-30">
      
      {/* 1. Header Navigation Pills */}
      <div className="bg-[#151926] p-1.5 rounded-[1.25rem] flex items-center justify-between shadow-xl mb-4 border border-slate-800">
        <button
          onClick={() => handleTabClick('find_car')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[0.85rem] text-xs font-black transition-all cursor-pointer",
            activeTab === 'find_car'
              ? "bg-gradient-to-r from-orange-600 to-[#F25C1D] text-white shadow-lg shadow-orange-600/35"
              : "text-slate-400 hover:text-white"
          )}
        >
          <div className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center",
            activeTab === 'find_car' ? "bg-white/20" : "bg-sky-500/10 text-sky-400"
          )}>
            <Search size={10} className={activeTab === 'find_car' ? "text-white" : "text-sky-400"} />
          </div>
          Find a Car
        </button>

        <button
          onClick={() => handleTabClick('list_car')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[0.85rem] text-xs font-black transition-all cursor-pointer",
            activeTab === 'list_car'
              ? "bg-gradient-to-r from-orange-600 to-[#F25C1D] text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          )}
        >
          <FileText size={14} className="text-pink-400/90" />
          List My Car
        </button>

        <button
          onClick={() => handleTabClick('dealer')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[0.85rem] text-xs font-black transition-all cursor-pointer",
            activeTab === 'dealer'
              ? "bg-gradient-to-r from-orange-600 to-[#F25C1D] text-white shadow-lg"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Building size={14} className="text-indigo-400" />
          I'm a Dealer
        </button>
      </div>

      {/* 2. Search Parameters Grid */}
      <div className="bg-white rounded-[2rem] p-5 shadow-2xl border border-slate-100 flex flex-col gap-4 relative">
        
        <div className="grid grid-cols-2 gap-3.5 relative">
          
          {/* Card A: Budget */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
              className={cn(
                "w-full bg-white text-left p-4 rounded-2xl border transition-all hover:border-slate-350 cursor-pointer flex flex-col justify-between h-[82px] relative",
                activeDropdown === 'budget' ? "border-[#F25C1D] ring-2 ring-orange-500/10 shadow-md" : "border-slate-200"
              )}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                Budget
              </div>
              <div className="flex items-center justify-between w-full mt-2">
                <span className="text-sm font-black text-slate-900 line-clamp-1">
                  {selectedBudget.label}
                </span>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </div>
            </button>

            {/* Dropdown A: Budget selection drop block */}
            <AnimatePresence>
              {activeDropdown === 'budget' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-[88px] z-40 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2.5 space-y-1"
                >
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setSelectedBudget(opt);
                        setActiveDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
                        selectedBudget.label === opt.label
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span>{opt.label}</span>
                      {selectedBudget.label === opt.label && <Check size={12} className="text-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card B: Brand */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'brand' ? null : 'brand')}
              className={cn(
                "w-full bg-white text-left p-4 rounded-2xl border transition-all hover:border-slate-350 cursor-pointer flex flex-col justify-between h-[82px] relative",
                activeDropdown === 'brand' ? "border-[#F25C1D] ring-2 ring-orange-500/10 shadow-md" : "border-slate-200"
              )}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                Brand
              </div>
              <div className="flex items-center justify-between w-full mt-2">
                <span className="text-sm font-black text-slate-900 line-clamp-1">
                  {selectedBrand}
                </span>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </div>
            </button>

            {/* Dropdown B: Brand selection drop block */}
            <AnimatePresence>
              {activeDropdown === 'brand' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-[88px] z-40 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2.5 max-h-[220px] overflow-y-auto space-y-1"
                >
                  {BRAND_OPTIONS.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => {
                        setSelectedBrand(brand);
                        setActiveDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
                        selectedBrand === brand
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span>{brand}</span>
                      {selectedBrand === brand && <Check size={12} className="text-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card C: Location */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'location' ? null : 'location')}
              className={cn(
                "w-full bg-white text-left p-4 rounded-2xl border transition-all hover:border-slate-350 cursor-pointer flex flex-col justify-between h-[82px] relative",
                activeDropdown === 'location' ? "border-[#F25C1D] ring-2 ring-orange-500/10 shadow-md" : "border-slate-200"
              )}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                Location
              </div>
              <div className="flex items-center justify-between w-full mt-2">
                <span className="text-sm font-black text-slate-900 line-clamp-1">
                  {selectedLocation}
                </span>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </div>
            </button>

            {/* Dropdown C: Location Input & Select custom block */}
            <AnimatePresence>
              {activeDropdown === 'location' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-[88px] z-40 bg-white border border-slate-100 shadow-2xl rounded-2xl p-3.5 space-y-3.5 w-[260px] sm:w-[320px]"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Type custom city name</span>
                    <input
                      type="text"
                      placeholder="e.g. Ara, Bihar"
                      value={citySearchValue}
                      onChange={(e) => setCitySearchValue(e.target.value)}
                      className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-orange-500"
                    />
                    {citySearchValue && (
                      <button
                        onClick={() => {
                          setSelectedLocation(citySearchValue);
                          setCitySearchValue('');
                          setActiveDropdown(null);
                        }}
                        className="w-full mt-1.5 bg-slate-900 hover:bg-slate-850 text-white text-[10px] font-black uppercase h-9 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MapPin size={10} /> Lock In "{citySearchValue}"
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Fast Selection</span>
                    <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto">
                      {BIHAR_UP_CITIES.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setSelectedLocation(city);
                            setActiveDropdown(null);
                          }}
                          className={cn(
                            "px-2 py-1.5 rounded-lg text-left text-[10px] font-bold uppercase tracking-tight transition-colors truncate cursor-pointer",
                            selectedLocation === city
                              ? "bg-orange-500 text-white"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Card D: Vehicle Type */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
              className={cn(
                "w-full bg-white text-left p-4 rounded-2xl border transition-all hover:border-slate-350 cursor-pointer flex flex-col justify-between h-[82px] relative",
                activeDropdown === 'type' ? "border-[#F25C1D] ring-2 ring-orange-500/10 shadow-md" : "border-slate-200"
              )}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block select-none">
                Vehicle Type
              </div>
              <div className="flex items-center justify-between w-full mt-2">
                <span className="text-sm font-black text-slate-900 line-clamp-1">
                  {selectedType.label}
                </span>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </div>
            </button>

            {/* Dropdown D: Vehicle Select Block */}
            <AnimatePresence>
              {activeDropdown === 'type' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-[88px] z-40 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2.5 space-y-1"
                >
                  {VEHICLE_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setSelectedType(type);
                        setActiveDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
                        selectedType.value === type.value
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        {type.value === 'car' && <Car size={12} />}
                        {type.value === 'bike' && <Bike size={12} />}
                        {type.value === 'commercial' && <Truck size={12} />}
                        {type.label}
                      </span>
                      {selectedType.value === type.value && <Check size={12} className="text-primary" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* 3. Search Action button */}
        <Button
          onClick={handleSearch}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-[#F25C1D] hover:from-orange-700 hover:to-[#df4d12] text-white font-[950] text-sm uppercase tracking-widest shadow-xl shadow-orange-600/30 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer mt-2"
        >
          Search Available Cars
        </Button>

        {/* 4. Small Footer Indicators row */}
        <div className="flex items-center justify-center gap-2 select-none border-t border-slate-50 pt-3 mt-1 text-slate-400 font-bold text-[9px] uppercase tracking-wide">
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-[#FF5A3C]" /> Verified Dealers
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Star size={12} strokeWidth={3} className="text-[#FF5A3C] fill-[#FF5A3C]" /> Rated Inventory
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Zap size={12} className="text-[#FF5A3C] animate-pulse" /> Live Availability
          </span>
        </div>

      </div>

    </div>
  );
};
