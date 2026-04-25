import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'motion/react';

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
    { icon: Heart, label: 'Wishlist', path: '/profile', onClick: () => {
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-2 py-2 flex justify-around items-end md:hidden z-50 h-20 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        if (item.primary) {
          return (
            <div key={index} className="relative -top-10 flex flex-col items-center">
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative flex flex-col items-center"
              >
                {/* CTA Badge */}
                <div className="absolute -top-6 bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-xl border border-white/20 animate-bounce">
                  SELL NOW
                </div>
                
                <button
                  onClick={item.onClick}
                  className="w-16 h-16 bg-gradient-to-br from-primary to-orange-600 text-white rounded-full shadow-[0_12px_30px_-10px_rgba(249,115,22,0.6)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 border-4 border-white ring-2 ring-slate-100 flex-shrink-0"
                >
                  <Icon size={30} strokeWidth={2.5} />
                </button>
                <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 animate-pulse scale-150 blur-xl" />
              </motion.div>
              <span className="text-[11px] font-black text-slate-800 mt-2 uppercase tracking-widest drop-shadow-sm">
                {item.label}
              </span>
            </div>
          );
        }

        return (
          <button
            key={item.label + index}
            onClick={item.onClick || (() => navigate(item.path))}
            className={cn(
              "flex flex-col items-center gap-1.5 pb-2 transition-all duration-300 w-16 relative",
              isActive ? "text-primary" : "text-slate-400"
            )}
          >
            {isActive && (
              <motion.span 
                layoutId="activeTabCircle"
                className="absolute -top-2 w-1.5 h-1.5 bg-primary rounded-full" 
              />
            )}
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform", isActive && "scale-110")} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-tight transition-all",
              isActive ? "opacity-100" : "opacity-60"
            )}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNav;
