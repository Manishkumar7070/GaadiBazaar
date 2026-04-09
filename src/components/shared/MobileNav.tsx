import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/auth/LoginModal';

const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: PlusCircle, label: 'Sell', path: '#', primary: true, onClick: () => {
      if (!user) {
        setIsLoginModalOpen(true);
      } else {
        alert('Redirecting to sell vehicle page...');
      }
    }},
    { icon: Heart, label: 'Saved', path: '/profile' },
    { icon: User, label: 'Profile', path: '/profile' },
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
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
};

export default MobileNav;
