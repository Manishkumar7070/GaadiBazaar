import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, User, Heart, Package, Settings, LogOut, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/auth/LoginModal';
import CitySelector from './CitySelector';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSellClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      navigate('/list-vehicle');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
              G
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">
              Gaadi<span className="text-primary">Bazaar</span>
            </span>
          </Link>
          
          <div className="hidden sm:block">
            <CitySelector />
          </div>
        </div>

        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search cars, bikes..." 
            className="pl-10 bg-slate-100 border-none focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="sm:hidden">
            <CitySelector />
          </div>
          <Button variant="ghost" size="icon" className="text-slate-600">
            <Bell size={20} />
          </Button>
          
          {user ? (
            <Link to="/profile">
              <Button variant="ghost" className="hidden md:flex gap-2 items-center text-slate-700 font-semibold">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User size={18} />
                </div>
                {user.name || 'Account'}
              </Button>
            </Link>
          ) : (
            <Button 
              variant="outline" 
              className="hidden md:flex border-primary text-primary hover:bg-primary/5"
              onClick={() => setIsLoginModalOpen(true)}
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
            <SheetContent side="right" className="w-[300px] sm:w-[400px] rounded-l-3xl">
              <SheetHeader className="text-left pb-6 border-b">
                <SheetTitle className="text-2xl font-bold">
                  Gaadi<span className="text-primary">Bazaar</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="py-6 space-y-6">
                {user ? (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
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

                <nav className="space-y-2">
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </header>
  );
};

export default Header;
