import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User, PlusCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showBadge, setShowBadge] = useState(true);
  const scrollRef = React.useRef(0);

  useEffect(() => {
    // Initial hide timeout
    const hideTimeout = setTimeout(() => {
      setShowBadge(false);
    }, 3000);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > scrollRef.current + 10) {
        // Scrolling down
        setShowBadge(false);
      } else if (currentScrollY < scrollRef.current - 20) {
        // Scrolling up
        setShowBadge(true);
      }
      
      scrollRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(hideTimeout);
    };
  }, []);

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
    { icon: MapPin, label: 'Dealers', path: '/find-dealers' },
    { icon: User, label: 'Profile', path: '/profile', onClick: () => {
      if (!user) {
        navigate('/login?reason=profile&redirect=/profile');
      } else {
        navigate('/profile');
      }
    }},
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 px-4 z-50 lg:hidden pointer-events-none">
      <nav className="max-w-[400px] mx-auto h-[72px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex justify-between items-center px-4 relative pointer-events-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          if (item.primary) {
            return (
              <div key={index} className="relative -mt-12 flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <AnimatePresence>
                    {showBadge && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg shadow-lg shadow-orange-500/40 whitespace-nowrap border-2 border-white uppercase tracking-tighter"
                      >
                        Free Listing
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <button
                    onClick={item.onClick}
                    className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-[0_12px_24px_-8px_rgba(249,115,22,0.6)] flex items-center justify-center border-4 border-white dark:border-slate-900 relative group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Icon size={28} strokeWidth={3} className="drop-shadow-sm" />
                  </button>
                  
                  {/* Subtle ambient glow */}
                  <div className="absolute inset-0 -z-10 bg-orange-500/30 blur-2xl rounded-full scale-110" />
                </motion.div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest mt-2",
                  isActive ? "text-orange-600" : "text-slate-400"
                )}>
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
                "flex flex-col items-center justify-center gap-1 w-14 h-14 relative transition-colors duration-300",
                isActive ? "text-orange-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className="relative">
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={cn("transition-transform duration-300", isActive && "scale-110")} 
                />
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute -inset-2 bg-orange-500/10 rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wide",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId="activeLine"
                  className="absolute bottom-0 w-1 h-1 bg-orange-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNav;
