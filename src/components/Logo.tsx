import React from 'react';
import { Handshake, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconSize?: number;
  fontSize?: string;
  variant?: 'default' | 'light';
}

const Logo: React.FC<LogoProps> = ({ className, iconSize = 24, fontSize = "text-xl", variant = 'default' }) => {
  const isLight = variant === 'light';
  const darkColor = isLight ? "text-white" : "text-[#8B3D52]";
  const orangeColor = isLight ? "text-white/90" : "text-[#F5A661]";

  return (
    <div className={cn("flex items-center gap-0 font-bold tracking-tight", className, fontSize)}>
      <span className={darkColor}>As</span>
      <div className="relative flex items-center justify-center px-1">
        <div className="relative">
          <Handshake 
            size={iconSize} 
            className={orangeColor} 
          />
          <ShieldCheck 
            size={iconSize * 0.5} 
            className={cn("absolute -top-2 left-1/2 -translate-x-1/2", orangeColor, isLight ? "fill-white/10" : "fill-[#F5A661]/20")} 
          />
        </div>
      </div>
      <span className={orangeColor}>ne</span>
      <span className={darkColor}>Dealer</span>
    </div>
  );
};

export default Logo;
