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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-200 px-2 py-2 flex justify-around items-end md:hidden z-50 h-20 shadow-[0_-15px_40px_rgba(0,0,0,0.12)]">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        if (item.primary) {
          return (
            <div key={index} className="relative -top-11 flex flex-col items-center">
              <motion.div
                animate={{
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative flex flex-col items-center"
              >
                <AnimatePresence>
                  {showBadge && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: 10 }}
                      className="absolute -top-7 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap shadow-2xl border-2 border-white ring-1 ring-primary/20 animate-bounce tracking-tight z-20"
                    >
                      FREE LISTING
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button
                  onClick={item.onClick}
                  className="w-18 h-18 bg-gradient-to-tr from-primary via-orange-500 to-orange-400 text-white rounded-full shadow-[0_15px_35px_-12px_rgba(249,115,22,0.7)] flex items-center justify-center transition-all hover:scale-110 active:scale-90 border-[5px] border-white ring-4 ring-slate-50 flex-shrink-0 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
                  <Icon size={34} strokeWidth={3} className="relative z-10 drop-shadow-md" />
                </button>
                
                {/* Visual Glow */}
                <div className="absolute -inset-2 -z-10 rounded-full bg-primary/25 animate-pulse scale-150 blur-2xl" />
              </motion.div>
              <span className="text-[12px] font-black text-primary mt-2 uppercase tracking-widest drop-shadow-sm brightness-90">
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
