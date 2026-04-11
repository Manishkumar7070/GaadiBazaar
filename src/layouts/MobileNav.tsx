import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: PlusCircle, label: 'Sell', path: '/list-vehicle', primary: true, onClick: () => {
      if (!user) {
        navigate('/login?reason=list_vehicle&redirect=/list-vehicle');
      } else {
        navigate('/list-vehicle');
      }
    }},
    { icon: Heart, label: 'Saved', path: '/profile', onClick: () => {
      if (!user) {
        navigate('/login?reason=profile&redirect=/profile');
      } else {
        navigate('/profile');
      }
    }},
    { icon: User, label: 'Profile', path: '/profile', onClick: () => {
      if (!user) {
        navigate('/login?reason=profile&redirect=/profile');
      } else {
        navigate('/profile');
      }
    }},
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center md:hidden mobile-nav-shadow z-50">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          if (item.primary) {
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="flex flex-col items-center -mt-8 bg-primary text-white p-3 rounded-full shadow-lg"
              >
                <Icon size={24} />
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={item.onClick || (() => navigate(item.path))}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-slate-500"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default MobileNav;
