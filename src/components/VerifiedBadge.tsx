import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerificationStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  status: VerificationStatus | boolean;
  type?: 'seller' | 'dealer' | 'vehicle';
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  status,
  type = 'seller',
  showLabel = true,
  className,
  size = 'md'
}) => {
  const isVerified = status === 'verified' || status === true;
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20
  }[size];

  if (isRejected) return null;

  const label = {
    seller: 'Verified Seller',
    dealer: 'Verified Dealer',
    vehicle: 'Inspected'
  }[type];

  if (!isVerified && !isPending) return null;

  const badge = (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {isVerified ? (
        <div className={cn(
          "bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm",
          size === 'sm' ? "p-0.5" : "p-1"
        )}>
          <ShieldCheck size={iconSize} />
        </div>
      ) : (
        <div className={cn(
          "bg-amber-500 text-white rounded-full flex items-center justify-center shadow-sm",
          size === 'sm' ? "p-0.5" : "p-1"
        )}>
          <Clock size={iconSize} />
        </div>
      )}
      
      {showLabel && (
        <Badge 
          variant="outline" 
          className={cn(
            "border-none px-2 py-0 h-6 font-black uppercase text-[10px] tracking-widest",
            isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          )}
        >
          {isVerified ? label : 'Verification Pending'}
        </Badge>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 text-white border-slate-800 rounded-xl px-4 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest">
            {isVerified 
              ? `${label}: This ${type} has been physically verified by AsOneDealer experts.`
              : 'Verification in progress: Our team is currently auditing this account.'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifiedBadge;
