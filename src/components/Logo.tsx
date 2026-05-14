import React from 'react';
import { cn } from '@/lib/utils';
import { Car } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  fontSize?: string;
  variant?: 'default' | 'light';
}

const Logo: React.FC<LogoProps> = ({ className, iconSize = 24, fontSize = "text-xl", variant = 'default' }) => {
  const isLight = variant === 'light';
  
  return (
    <div className={cn("flex items-center gap-2 font-black tracking-tighter group cursor-pointer", className)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
        <Car size={18} fill="white" />
      </div>
      <div className="flex items-center gap-0">
        <div className={cn("flex items-center", fontSize)}>
          <span className="text-amber-500">ASONE</span>
          <span className={isLight ? "text-white" : "text-slate-900"}>DEALER</span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
