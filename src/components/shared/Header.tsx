import React from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
            G
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:block">
            Gaadi<span className="text-primary">Bazaar</span>
          </span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search cars, bikes..." 
            className="pl-10 bg-slate-100 border-none focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="text-slate-600">
            <MapPin size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-600">
            <Bell size={20} />
          </Button>
          <Button variant="outline" className="hidden md:flex border-primary text-primary hover:bg-primary/5">
            Login
          </Button>
          <Button className="hidden md:flex bg-primary hover:bg-primary/90">
            Sell Vehicle
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu size={24} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
