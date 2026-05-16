import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Bell, Menu, User, Heart, Package, Settings, LogOut, PlusCircle, Handshake, X, Star, BarChart3, Instagram, Smartphone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';

const STATES_LIST = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh', 'Jammu & Kashmir', 'Ladakh'
];
import { ChevronDown, Car as CarIcon, Bike, Globe, Store, History, Info } from 'lucide-react';

import CitySelector from '@/components/shared/CitySelector';
import SearchSuggestions from '@/features/search/SearchSuggestions';
import { vehicleService } from '@/services/vehicle.service';

import LoginModal from '@/components/auth/LoginModal';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popularMetadata, setPopularMetadata] = useState<{ brands: string[], models: string[], cities: string[], states: string[] }>({ brands: [], models: [], cities: [], states: [] });

  useEffect(() => {
    const fetchMetadata = async () => {
      const data = await vehicleService.fetchPopularMetadata();
      // Ensure states are included or derived
      const vehicles = await vehicleService.fetchVehicles({ verificationStatus: 'verified' });
      const uniqueStates = Array.from(new Set(vehicles.map(v => v.state).filter(Boolean))) as string[];
      setPopularMetadata({ ...data, states: uniqueStates });
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
      // Show popular items when focused but empty
      const popularSuggestions = [
        ...popularMetadata.brands.map(b => ({ id: `b-${b}`, text: b, type: 'vehicle' as const, subtext: 'Popular Brand' })),
        ...popularMetadata.cities.map(c => ({ id: `c-${c}`, text: c, type: 'location' as const, subtext: 'Popular City' }))
      ].slice(0, 8);
      setSuggestions(popularSuggestions);
      return;
    }

    // Direct matches from metadata
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
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
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

  const handleSellClick = () => {
    if (!user) {
      navigate('/login?reason=list_vehicle&redirect=/list-vehicle');
    } else {
      navigate('/list-vehicle');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-4">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Logo fontSize="text-xl sm:text-2xl" iconSize={24} />
        </Link>

        <div className="hidden lg:flex items-center gap-2 ml-2">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  onClick={() => navigate('/search?type=car')}
                  className="bg-transparent hover:bg-transparent data-[state=open]:bg-transparent text-sm font-bold text-slate-600 hover:text-primary transition-colors h-10 px-3 cursor-pointer"
                >
                  Buy Used Car
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[500px] gap-3 p-4 md:grid-cols-2 bg-white rounded-3xl shadow-2xl border-none">
                    <div className="space-y-4">
                      <div className="px-2 py-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Quick Browse</p>
                        <div className="grid gap-2">
                          <button onClick={() => navigate('/search?type=car')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors text-left group">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                              <CarIcon size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">All Used Cars</p>
                              <p className="text-[10px] text-slate-500 font-medium">Sedans, SUVs, Luxury</p>
                            </div>
                          </button>
                          <button onClick={() => navigate('/search?type=bike')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors text-left group">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                              <Bike size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">Used Bikes</p>
                              <p className="text-[10px] text-slate-500 font-medium">Sport, Daily, Cruisers</p>
                            </div>
                          </button>
                          <button onClick={() => navigate('/find-dealers')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors text-left group">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                              <Store size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">Verified Dealers</p>
                              <p className="text-[10px] text-slate-500 font-medium">Buy with total confidence</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Browse by State</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        {(popularMetadata.states.length > 0 ? popularMetadata.states : STATES_LIST).slice(0, 16).map(state => (
                          <button 
                            key={state} 
                            onClick={() => navigate(`/search?state=${encodeURIComponent(state)}`)}
                            className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-primary hover:bg-white rounded-lg transition-all text-left truncate"
                          >
                            {state}
                          </button>
                        ))}
                        <button 
                          onClick={() => navigate('/search')}
                          className="col-span-2 mt-2 px-3 py-2 text-[10px] font-black uppercase text-primary hover:bg-primary/5 rounded-lg transition-all border border-primary/10 text-center"
                        >
                          View All 20+ States
                        </button>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  onClick={handleSellClick}
                  className="bg-transparent hover:bg-transparent data-[state=open]:bg-transparent text-sm font-bold text-slate-600 hover:text-primary transition-colors h-10 px-3 cursor-pointer"
                >
                  Sell Car
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[300px] p-4 bg-white rounded-3xl shadow-2xl border-none">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Seller Services</p>
                    <div className="grid gap-2">
                      <button onClick={handleSellClick} className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 hover:bg-primary border border-primary/10 group transition-all">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-secondary shadow-lg group-hover:bg-white group-hover:text-primary transition-colors">
                          <PlusCircle size={20} strokeWidth={2.5} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-slate-900 group-hover:text-white transition-colors">QUICK LIST</p>
                          <p className="text-[10px] text-primary group-hover:text-white font-black uppercase tracking-widest transition-colors">Free Listing</p>
                        </div>
                      </button>
                      
                      <button onClick={() => navigate('/seller-dashboard')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:text-primary">
                          <BarChart3 size={16} />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Manage Listings</p>
                      </button>

                      <button onClick={() => navigate('/blog/used-car-market-india')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors text-left group">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <History size={16} />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Valuation Guide</p>
                      </button>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Link to="/buyer-hub" className="text-sm font-bold text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1 px-4 border-l border-slate-100">
            <Handshake size={14} /> Smart Buyer Hub
          </Link>
        </div>

        <div className="hidden lg:flex flex-1 max-w-xl items-center gap-2">
          <div className="flex-1 relative z-50">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search cars, bikes..." 
                className="pl-10 pr-10 bg-slate-100 border-none focus-visible:ring-primary h-11 rounded-xl w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </form>
            <SearchSuggestions 
              suggestions={suggestions}
              query={searchQuery}
              isVisible={showSuggestions}
              onSelect={handleSuggestionSelect}
            />
          </div>
          <CitySelector 
            onSelect={(city) => {
              navigate(`/search?city=${encodeURIComponent(city)}`);
            }}
            className="bg-slate-100 h-11 border-none"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <a 
            href="https://www.instagram.com/asonedealer.in?igsh=ZHUzeTU0cHM4YTR6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden md:flex h-10 w-10 items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <Instagram size={20} />
          </a>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-600 lg:hidden h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => navigate('/search')}
          >
            <Search size={18} />
          </Button>

          <Button variant="ghost" size="icon" className="text-slate-600 hidden md:flex h-10 w-10">
            <Bell size={20} />
          </Button>
          
          {user?.role === 'admin' && (
            <Link to="/admin">
              <Button variant="ghost" className="hidden lg:flex gap-2 items-center text-primary font-bold">
                <Settings size={18} /> Admin Panel
              </Button>
            </Link>
          )}

          <div className="hidden lg:flex items-center gap-2">
            {user ? (
               <DropdownMenu>
                 <DropdownMenuTrigger render={<Button variant="ghost" className="flex gap-2 items-center text-slate-700 font-semibold px-2" />}>
                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                     <User size={18} />
                   </div>
                   <span className="max-w-[100px] truncate">{user.fullName || 'Account'}</span>
                   <ChevronDown size={14} className="text-slate-400" />
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-56 rounded-2xl p-2 shadow-2xl border-none">
                   <DropdownMenuLabel className="flex items-center gap-3 p-3">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                       <User size={20} />
                     </div>
                     <div className="flex flex-col">
                       <span className="font-bold text-sm truncate">{user.fullName}</span>
                       <span className="text-[10px] text-slate-400 font-bold uppercase truncate">{user.role} Account</span>
                     </div>
                   </DropdownMenuLabel>
                   <DropdownMenuSeparator className="my-1 bg-slate-100" />
                   <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl flex items-center gap-3 p-3 cursor-pointer">
                     <Package size={16} className="text-slate-400" />
                     <span className="font-semibold text-sm">Dashboard</span>
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl flex items-center gap-3 p-3 cursor-pointer">
                     <Heart size={16} className="text-slate-400" />
                     <span className="font-semibold text-sm">Wishlist</span>
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl flex items-center gap-3 p-3 cursor-pointer">
                     <Settings size={16} className="text-slate-400" />
                     <span className="font-semibold text-sm">Settings</span>
                   </DropdownMenuItem>
                   <DropdownMenuSeparator className="my-1 bg-slate-100" />
                   <DropdownMenuItem 
                     onClick={() => {
                       logout();
                       navigate('/');
                     }} 
                     className="rounded-xl flex items-center gap-3 p-3 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                   >
                     <LogOut size={16} />
                     <span className="font-semibold text-sm">Logout</span>
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary/5 rounded-xl h-10"
                onClick={() => setIsLoginModalOpen(true)}
              >
                Login
              </Button>
            )}
          </div>
          
          <LoginModal 
            isOpen={isLoginModalOpen} 
            onClose={() => setIsLoginModalOpen(false)} 
          />
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden h-10 w-10" />}>
                <Menu size={24} />
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] rounded-l-3xl p-0">
              <div className="flex flex-col h-full">
                <SheetHeader className="text-left p-6 border-b">
                  <SheetTitle>
                    <Logo fontSize="text-2xl" iconSize={28} />
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                  {user ? (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={24} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-bold text-lg"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                    >
                      Login / Register
                    </Button>
                  )}

                  <div className="px-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Your Location</p>
                    <CitySelector 
                      onSelect={(city) => {
                        setIsMobileMenuOpen(false);
                        navigate(`/search?city=${encodeURIComponent(city)}`);
                      }}
                      className="w-full justify-start h-14 bg-slate-50 border-slate-100 rounded-2xl"
                    />
                  </div>

                  <nav className="space-y-1">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                      <Search size={20} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">Browse Vehicles</span>
                    </Link>
                    <Link to="/brands" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                      <Star size={20} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">View Brands</span>
                    </Link>
                    <Link to="/find-dealers" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                      <MapPin size={20} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">Find Dealers</span>
                    </Link>
                    <Link to="/buyer-hub" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 bg-secondary/5 text-secondary rounded-xl transition-colors border border-secondary/10">
                      <ShieldCheck size={20} className="text-secondary" />
                      <span className="font-bold">Smart Buyer Hub</span>
                      <Badge className="ml-auto bg-secondary text-white border-none text-[8px] px-1 h-4">NEW</Badge>
                    </Link>
                    
                    <div className="grid grid-cols-2 gap-2 p-2">
                      <a 
                        href="https://www.instagram.com/asonedealer.in?igsh=ZHUzeTU0cHM4YTR6" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-100"
                      >
                        <Instagram size={24} className="text-[#E4405F]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Instagram</span>
                      </a>
                      <button 
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-100"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          document.getElementById('download-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <Smartphone size={24} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Get App</span>
                      </button>
                    </div>

                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors border border-primary/10">
                        <Settings size={20} className="text-primary" />
                        <span className="font-bold text-primary">Admin Dashboard</span>
                      </Link>
                    )}
                    <button 
                      onClick={handleSellClick} 
                      className="w-full flex items-center gap-4 p-4 bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all border border-primary/20 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg group-active:scale-95 transition-transform">
                        <PlusCircle size={22} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">Sell Your Vehicle</span>
                        <span className="text-[10px] text-primary font-black uppercase tracking-widest">Free Listing</span>
                      </div>
                    </button>
                    {user && (
                      <>
                        <Link to="/seller-dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors border border-primary/10">
                          <BarChart3 size={20} className="text-primary" />
                          <span className="font-bold text-primary">Seller Dashboard</span>
                        </Link>
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                          <Package size={20} className="text-slate-400" />
                          <span className="font-semibold text-slate-700">My Listings</span>
                        </Link>
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                          <Heart size={20} className="text-slate-400" />
                          <span className="font-semibold text-slate-700">Favorites</span>
                        </Link>
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                          <Settings size={20} className="text-slate-400" />
                          <span className="font-semibold text-slate-700">Settings</span>
                        </Link>
                        <button 
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                            navigate('/');
                          }} 
                          className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-xl transition-colors text-left text-red-500"
                        >
                          <LogOut size={20} />
                          <span className="font-semibold">Logout</span>
                        </button>
                      </>
                    )}
                  </nav>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
