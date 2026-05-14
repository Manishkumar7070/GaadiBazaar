import React from 'react';
import { Shield, TrendingUp, Award, CheckCircle2, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface TrustScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showDetails?: boolean;
  variant?: 'badge' | 'stars';
}

export const TrustScore: React.FC<TrustScoreProps> = ({ 
  score, 
  size = 'md', 
  className,
  showDetails = false,
  variant = 'badge'
}) => {
  const getScoreColor = (s: number) => {
    if (s >= 9) return 'text-green-500';
    if (s >= 7) return 'text-blue-500';
    if (s >= 5) return 'text-amber-500';
    return 'text-slate-400';
  };

  const getScoreBg = (s: number) => {
    if (s >= 9) return 'bg-green-500/10 border-green-500/20';
    if (s >= 7) return 'bg-blue-500/10 border-blue-500/20';
    if (s >= 5) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-slate-500/10 border-slate-500/20';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 9) return 'Highly Trusted';
    if (s >= 8) return 'Reliable';
    if (s >= 7) return 'Verified Plus';
    if (s >= 5) return 'Verified';
    return 'Processing';
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 24
  };

  const renderStars = () => {
    const starCount = Math.round(score / 2);
    return (
      <div className={cn("flex flex-col gap-1 items-start", className)}>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star 
                key={i} 
                size={iconSizes[size]} 
                className={cn(
                  i <= starCount ? "text-blue-500 fill-blue-500" : "text-slate-200 fill-slate-100"
                )} 
              />
            ))}
          </div>
          <span className={cn(
            "font-black uppercase tracking-widest ml-1",
            size === 'sm' ? "text-[8px]" : size === 'md' ? "text-[10px]" : "text-xs",
            getScoreColor(score)
          )}>
            {getScoreLabel(score)}
          </span>
        </div>
        <div className={cn(
          "bg-blue-50 text-blue-600 px-2 rounded-md font-bold uppercase tracking-tighter",
          size === 'sm' ? "text-[7px]" : "text-[9px]"
        )}>
          {score.toFixed(1)} Trust Score
        </div>
      </div>
    );
  };

  if (variant === 'stars') {
    return renderStars();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className={cn(
        "inline-flex items-center gap-2 rounded-full border transition-all duration-500",
        getScoreBg(score),
        sizes[size]
      )}>
        <Shield size={iconSizes[size]} className={getScoreColor(score)} />
        <span className="font-black tracking-tighter uppercase italic">
          <span className={getScoreColor(score)}>{score.toFixed(1)}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="text-slate-500">10</span>
        </span>
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <span className={cn("font-bold uppercase tracking-widest text-[9px]", getScoreColor(score))}>
          {getScoreLabel(score)}
        </span>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Identity Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">high response</span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Quality Inventory</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustScore;
