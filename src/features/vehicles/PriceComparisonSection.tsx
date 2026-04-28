import React from 'react';
import { Vehicle } from '@/types';
import { ComparisonResult, smartComparisonService } from '@/services/smartComparisonService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, TrendingDown, Zap, ShieldCheck, ChevronRight, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface PriceComparisonSectionProps {
  vehicle: Vehicle;
  allVehicles: Vehicle[];
}

const PriceComparisonSection: React.FC<PriceComparisonSectionProps> = ({ vehicle, allVehicles }) => {
  const [result, setResult] = React.useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchComparison = async () => {
      setIsLoading(true);
      const res = await smartComparisonService.getBetterDeals(vehicle, allVehicles);
      setResult(res);
      setIsLoading(false);
    };
    fetchComparison();
  }, [vehicle, allVehicles]);

  const itemsToShow = result.betterDeals.length > 0 ? result.betterDeals : result.alternatives;
  const sectionTitle = result.betterDeals.length > 0 ? "Similar Cars at Better Prices Nearby" : "Great Alternatives in Your Budget";

  if (isLoading || !result || itemsToShow.length === 0) return null;

  return (
    <div className="my-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">Smart Comparison</span>
            <span className="text-slate-400 text-xs font-medium">Real-time price intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">
            {sectionTitle.split(' ').slice(0, -1).join(' ')} <span className="text-primary italic">{sectionTitle.split(' ').slice(-1)}</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          {result.insights.slice(0, 2).map((insight, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap",
                insight.severity === 'success' ? "bg-green-50 text-green-700 border-green-100" :
                insight.severity === 'warning' ? "bg-amber-50 text-amber-700 border-amber-100" :
                "bg-blue-50 text-blue-700 border-blue-100"
              )}
            >
              {insight.type === 'price' && <TrendingDown size={14} />}
              {insight.type === 'distance' && <MapPin size={14} />}
              {insight.type === 'deal' && <Zap size={14} />}
              {insight.message}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {itemsToShow.map((deal, idx) => {
          const savings = vehicle.price - deal.price;
          const isBetterPrice = savings > 0;
          const isLowest = idx === 0 && isBetterPrice;

          return (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="relative group"
            >
              {isLowest && (
                <div className="absolute -top-3 left-6 z-20">
                    <Badge className="bg-green-600 text-white border-none shadow-lg px-3 py-0.5 text-[10px] font-black uppercase tracking-tighter animate-bounce-slow">
                        Lowest Price Nearby
                    </Badge>
                </div>
              )}

              <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl bg-white border-slate-100">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img 
                    src={deal.images[0]} 
                    alt={deal.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 flex flex-col gap-0.5">
                    <span className="text-[10px] text-white/70 font-medium uppercase tracking-widest">{deal.brand}</span>
                    <h4 className="text-white font-bold text-sm line-clamp-1">{deal.model}</h4>
                  </div>
                  
                  {isBetterPrice && (
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-red-500 text-white border-none text-[10px] font-black">
                          Save ₹{savings.toLocaleString('en-IN')}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-black text-slate-900">₹{deal.price.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] font-bold text-slate-400">{deal.year} • {deal.kilometersDriven.toLocaleString()} km</div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                     <MapPin size={10} className="text-primary" />
                     <span className="truncate">{deal.shopId ? "Trusted Dealer" : deal.city}</span>
                     {deal.isVerified && (
                        <div className="ml-auto flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                            <ShieldCheck size={10} /> Verified
                        </div>
                     )}
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs font-black text-primary hover:text-white hover:bg-primary transition-all p-0 h-8 rounded-lg group/btn"
                    onClick={() => navigate(`/vehicle/${deal.id}`)}
                  >
                    View Better Deal <ArrowRight size={12} className="ml-1 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      {/* Smart Suggestion Banner */}
      {result.isPricedHigh && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4 items-center"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Pricing Intelligence</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Based on our current data for {vehicle.city}, this specific listing is approximately <span className="font-bold underline underline-offset-2 italic">{Math.round(((vehicle.price - result.averagePrice!) / result.averagePrice!) * 100)}% higher</span> than the market average for this model and year. We recommend negotiating or exploring the nearby listings above.
            </p>
          </div>
          <Button variant="outline" className="shrink-0 text-[10px] font-black uppercase h-8 px-4 rounded-xl border-amber-200 text-amber-700 bg-white hover:bg-amber-50">
            View Analytics
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default PriceComparisonSection;
