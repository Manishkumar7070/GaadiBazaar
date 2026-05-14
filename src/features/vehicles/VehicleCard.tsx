import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Gauge, User, ShieldCheck, Heart, ArrowLeftRight, Phone, Clock, XCircle, Share2, Star, Zap, Crown, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Vehicle } from '@/types';
import { useComparison } from '@/hooks/useComparison';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { MOCK_DEALERS } from '@/constants/mockData';

interface VehicleCardProps {
  vehicle: Vehicle;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToComparison, removeFromComparison, isVehicleSelected } = useComparison();
  const isSelected = isVehicleSelected(vehicle.id);
  const shop = vehicle.shopId ? MOCK_DEALERS.find(d => d.id === vehicle.shopId) : null;

  const isSponsored = vehicle.listingType === 'sponsored';
  const isFeaturedListing = vehicle.listingType === 'featured';
  const isPremiumListing = vehicle.listingType === 'premium';
  const isSold = vehicle.status === 'sold';

  // Smart Badges Logic
  const hasPriceHistory = vehicle.priceHistory && vehicle.priceHistory.length > 1;
  const isPriceDropped = hasPriceHistory && vehicle.price < vehicle.priceHistory![vehicle.priceHistory!.length - 2].price;
  const isBestDeal = vehicle.price < 400000 && vehicle.kilometersDriven < 50000; // Simplified logic
  const isRecentlyListed = new Date().getTime() - new Date(vehicle.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000;

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelected) {
      removeFromComparison(vehicle.id);
    } else {
      addToComparison(vehicle);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate(`/login?reason=favorite_vehicle&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    alert('Added to favorites!');
  };

  const handleContactSeller = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate(`/login?reason=contact_seller&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    alert('Contacting seller...');
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareData = {
      title: vehicle.title,
      text: `Check out this ${vehicle.title} on AsOneDealer!`,
      url: `${window.location.origin}/vehicle/${vehicle.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
      className="cursor-pointer relative"
    >
      {/* Premium Highlight Border */}
      {(isSponsored || isFeaturedListing || isPremiumListing) && (
        <div className={cn(
          "absolute -inset-[2px] rounded-[34px] z-0 animate-pulse opacity-70 blur-[1px]",
          isSponsored ? "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" :
          isFeaturedListing ? "bg-gradient-to-r from-secondary/60 via-secondary to-secondary/60" :
          "bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400"
        )} />
      )}

      <Card className={cn(
        "group overflow-hidden border-none shadow-sm hover:shadow-2xl transition-all duration-300 bg-white rounded-3xl relative z-10",
        isSponsored && "bg-gradient-to-b from-amber-50/30 to-white",
        isFeaturedListing && "bg-gradient-to-b from-secondary/5 to-white"
      )}>
        {/* Shimmer Effect for Premium listings */}
        {(isSponsored || isPremiumListing) && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div 
              animate={{ x: ['100%', '-100%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] w-full h-full"
            />
          </div>
        )}

        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={vehicle.images[0]} 
            alt={vehicle.title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
              isSponsored && "scale-[1.02]",
              isSold && "grayscale opacity-80"
            )}
            referrerPolicy="no-referrer"
          />

          {isSold && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/10 border-2 border-white/50 px-6 py-2 rounded-xl backdrop-blur-md"
              >
                <span className="text-white text-2xl font-black tracking-widest uppercase">Sold Out</span>
              </motion.div>
            </div>
          )}

          {/* Top Listing Ribbon */}
          {isSponsored && (
            <div className="absolute top-0 right-0 z-20">
              <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider py-1 px-8 translate-x-[28%] translate-y-[45%] rotate-45 shadow-lg flex items-center gap-1 justify-center min-w-[140px]">
                <Zap size={10} fill="currentColor" /> Sponsored Listing <Zap size={10} fill="currentColor" />
              </div>
            </div>
          )}

          <div className="absolute top-4 left-4 flex flex-wrap gap-2 pr-12">
            {isSold && (
              <Badge className="bg-slate-900 text-white border-none shadow-lg flex gap-1 items-center px-3 py-1 font-black">
                <XCircle size={12} /> SOLD
              </Badge>
            )}
            {isSponsored && (
              <Badge className="bg-amber-500 text-white border-none shadow-lg animate-bounce-slow flex gap-1 items-center">
                <Crown size={12} fill="white" /> Top Ad
              </Badge>
            )}
            {isFeaturedListing && (
              <Badge className="bg-secondary text-white border-none shadow-lg flex gap-1 items-center">
                <Star size={12} fill="white" /> Featured
              </Badge>
            )}
            {isPremiumListing && (
              <Badge className="bg-emerald-600 text-white border-none shadow-lg flex gap-1 items-center">
                <Star size={12} /> Premium
              </Badge>
            )}

            {vehicle.verificationStatus === 'verified' && (
              <VerifiedBadge status={vehicle.verificationStatus} type="vehicle" showLabel={false} className="shadow-sm" />
            )}

            {isPriceDropped && (
              <Badge className="bg-orange-500 text-white border-none shadow-lg animate-pulse flex gap-1 items-center">
                <TrendingDown size={12} /> Recently Price Dropped
              </Badge>
            )}

            {isBestDeal && (
              <Badge className="bg-indigo-600 text-white border-none shadow-lg flex gap-1 items-center">
                <Zap size={12} fill="white" /> Best Deal
              </Badge>
            )}

            {isRecentlyListed && (
              <Badge className="bg-slate-900 text-white border-none shadow-lg text-[10px] uppercase font-black tracking-widest h-5 px-2">
                New Arrival
              </Badge>
            )}
          </div>
          
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
            <button 
              onClick={handleFavorite}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 transition-all hover:scale-110 shadow-sm"
            >
              <Heart size={20} />
            </button>
            <button 
              onClick={handleShare}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-primary transition-all hover:scale-110 shadow-sm"
              title="Share"
            >
              <Share2 size={20} />
            </button>
            <button 
              onClick={toggleCompare}
              className={cn(
                "w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm",
                isSelected ? "bg-primary text-white" : "bg-white/80 text-slate-600 hover:text-primary"
              )}
            >
              <ArrowLeftRight size={20} />
            </button>
          </div>

          <div className="absolute bottom-4 left-4">
            <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight">
              {vehicle.city} • {vehicle.state}
            </div>
          </div>
        </div>
        
        <CardContent className="p-5 space-y-4 relative bg-transparent">
          <div className="space-y-1">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors flex-1">
                {vehicle.title}
              </h3>
              {vehicle.clicksCount > 100 && (
                <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <Zap size={10} /> Hot Deal
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 text-[10px] sm:text-xs font-medium">
              <div className="flex items-center gap-1">
                <Calendar size={12} className="text-slate-400 sm:w-3.5 sm:h-3.5" />
                <span>{vehicle.year}</span>
              </div>
              <div className="flex items-center gap-1">
                <Gauge size={12} className="text-slate-400 sm:w-3.5 sm:h-3.5" />
                <span>{vehicle.kilometersDriven.toLocaleString()} km</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <User size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>{vehicle.ownership}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className={cn(
              "text-lg sm:text-2xl font-black transition-all",
              isSponsored ? "text-amber-600" : "text-slate-900"
            )}>
              ₹{vehicle.price.toLocaleString()}
            </div>
            <Badge variant="secondary" className="bg-slate-50 text-slate-500 capitalize rounded-lg border-slate-100 text-[9px] sm:text-[10px] font-bold px-1.5 py-0">
              {vehicle.fuelType}
            </Badge>
          </div>

          <div className="bg-[#E9F0E9] rounded-xl p-3 border border-[#D5E2D5]">
            <div className="flex items-center gap-2 text-[#2E4D2E]">
              <span className="text-sm">✨</span>
              <p className="text-[10px] font-black uppercase tracking-wider">5 YEARS FREE SERVICE</p>
            </div>
            <p className="text-[9px] text-[#2E4D2E]/70 font-bold mt-0.5">Professional mechanic visits • Monthly • ₹5L value</p>
          </div>

          {shop && (
            <div className="flex items-center gap-2 p-1.5 sm:p-2 bg-slate-50 rounded-xl border border-slate-100/50">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-white shadow-sm shrink-0 border border-slate-100">
                <img src={shop.images[0]} alt={shop.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <Link 
                    to={`/dealer/${shop.id}`} 
                    onClick={(e) => e.stopPropagation()} 
                    className="text-[10px] sm:text-xs font-bold text-slate-700 hover:text-primary transition-colors truncate"
                  >
                    {shop.name}
                  </Link>
                  {shop.isPremium && (
                    <div className="bg-amber-100 text-amber-700 rounded-full p-0.5 shrink-0" title="Premium Seller">
                      <Star size={6} className="sm:w-2 sm:h-2" fill="currentColor" />
                    </div>
                  )}
                  {shop.verificationStatus === 'verified' && (
                    <VerifiedBadge status={shop.verificationStatus} type="dealer" showLabel={false} size="sm" />
                  )}
                </div>
                <div className="text-[8px] sm:text-[10px] text-slate-400 flex items-center gap-1 truncate">
                   {vehicle.rating ? (
                     <>
                       <Star size={8} className="fill-blue-400 text-blue-400 sm:w-2.5 sm:h-2.5" /> {vehicle.rating} ({vehicle.reviewsCount})
                     </>
                   ) : (
                     <Star size={8} className="fill-amber-400 text-amber-400 sm:w-2.5 sm:h-2.5" />
                   )}
                   <span className="truncate"> {shop.rating || '4.5'} • 100+ items</span>
                </div>
              </div>
            </div>
          )}

          <Button 
            className={cn(
              "w-full rounded-xl font-bold flex gap-2 h-9 sm:h-11 text-xs sm:text-sm transition-all active:scale-[0.98]",
              isSold ? "bg-slate-200 text-slate-500 hover:bg-slate-200 cursor-not-allowed" :
              isSponsored ? "bg-amber-500 hover:bg-amber-600 text-white" :
              isFeaturedListing ? "bg-secondary hover:bg-secondary/90 text-white" :
              "bg-primary hover:bg-primary/90 text-white"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!isSold) {
                navigate(`/vehicle/${vehicle.id}`);
              }
            }}
            disabled={isSold}
          >
            {isSold ? (
              <>
                <XCircle size={14} className="sm:w-[18px] sm:h-[18px]" />
                Sold Out
              </>
            ) : (
              <>
                <Zap size={14} className="sm:w-[18px] sm:h-[18px]" />
                Book for ₹{Number(5000).toLocaleString()}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VehicleCard;
