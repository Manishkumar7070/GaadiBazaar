import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Bell, Menu, User, Heart, Package, Settings, LogOut, PlusCircle, Handshake } from 'lucide-react';
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

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo fontSize="text-2xl" iconSize={28} />
        </Link>

        <div className="hidden md:flex flex-1 max-w-2xl items-center gap-2">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search cars, bikes..." 
              className="pl-10 bg-slate-100 border-none focus-visible:ring-primary h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <CitySelector 
            onSelect={(city) => {
              navigate(`/search?city=${encodeURIComponent(city)}`);
            }}
            className="bg-slate-100 h-11 border-none"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-600 md:hidden"
            onClick={() => navigate('/search')}
          >
            <Search size={20} />
          </Button>

          <CitySelector 
            onSelect={(city) => {
              navigate(`/search?city=${encodeURIComponent(city)}`);
            }}
            className="md:hidden px-1"
          />
          
          <Button variant="ghost" size="icon" className="text-slate-600 hidden sm:flex">
            <Bell size={20} />
          </Button>
          
          {user ? (
            <Link to="/profile">
              <Button variant="ghost" className="hidden md:flex gap-2 items-center text-slate-700 font-semibold">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={18} />
                </div>
                {user.fullName || 'Account'}
              </Button>
            </Link>
          ) : (
            <Button 
              variant="outline" 
              className="hidden md:flex border-primary text-primary hover:bg-primary/5"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}

          <Button 
            className="hidden md:flex bg-primary hover:bg-primary/90"
            onClick={handleSellClick}
          >
            Sell Vehicle
          </Button>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
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
                    <button onClick={handleSellClick} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors text-left">
                      <PlusCircle size={20} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">Sell Your Vehicle</span>
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
