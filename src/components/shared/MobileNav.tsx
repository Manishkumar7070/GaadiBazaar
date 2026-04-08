import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: PlusCircle, label: 'Sell', path: '/sell', primary: true },
    { icon: Heart, label: 'Favorites', path: '/favorites' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center md:hidden mobile-nav-shadow z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        if (item.primary) {
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center -mt-8 bg-primary text-white p-3 rounded-full shadow-lg"
            >
              <Icon size={24} />
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-slate-500"
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
