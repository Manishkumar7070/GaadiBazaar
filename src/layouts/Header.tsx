import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Bell, Menu, User, Heart, Package, Settings, LogOut, PlusCircle, Handshake, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';

import CitySelector from '@/components/shared/CitySelector';
import SearchSuggestions from '@/features/search/SearchSuggestions';
import { vehicleService } from '@/services/vehicle.service';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo fontSize="text-2xl" iconSize={28} />
        </Link>

        <div className="hidden lg:flex items-center gap-6 ml-4">
          <Link to="/search" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            Explore
          </Link>
          <Link to="/search?type=car" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            Cars
          </Link>
          <Link to="/search?type=bike" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            Bikes
          </Link>
          <Link to="/find-dealers" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
            Dealers
          </Link>
          <Link to="/blog/used-car-market-india" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors hidden xl:block">
            Market Trends
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

        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-600 lg:hidden h-9 w-9"
            onClick={() => navigate('/search')}
          >
            <Search size={18} />
          </Button>

          <CitySelector 
            onSelect={(city) => {
              navigate(`/search?city=${encodeURIComponent(city)}`);
            }}
            className="lg:hidden px-1"
          />
          
          <Button variant="ghost" size="icon" className="text-slate-600 hidden sm:flex">
            <Bell size={20} />
          </Button>
          
          {user?.role === 'admin' && (
            <Link to="/admin">
              <Button variant="ghost" className="hidden lg:flex gap-2 items-center text-primary font-bold">
                <Settings size={18} /> Admin Panel
              </Button>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link to="/admin">
              <Button variant="ghost" className="hidden lg:flex gap-2 items-center text-primary font-bold">
                <Settings size={18} /> Admin Panel
              </Button>
            </Link>
          )}

          {user ? (
            <Link to="/profile">
              <Button variant="ghost" className="hidden lg:flex gap-2 items-center text-slate-700 font-semibold">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={18} />
                </div>
                {user.fullName || 'Account'}
              </Button>
            </Link>
          ) : (
            <Button 
              variant="outline" 
              className="hidden lg:flex border-primary text-primary hover:bg-primary/5"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}

          <Button 
            className="hidden lg:flex bg-primary hover:bg-primary/90"
            onClick={handleSellClick}
          >
            Sell Vehicle
          </Button>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
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
                        navigate('/login');
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
                    <Link to="/find-dealers" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors">
                      <MapPin size={20} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">Find Dealers</span>
                    </Link>
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
