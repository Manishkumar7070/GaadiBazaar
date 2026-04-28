import React, { useState, useEffect } from 'react';
import { Shop } from '@/types';
import { shopService } from '@/services/shop.service';
import DealerMap from '@/features/dealers/DealerMap';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Filter, 
  ChevronRight, 
  ShieldCheck, 
  Navigation,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const FindDealers: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadShops = async () => {
      setLoading(true);
      const data = await shopService.fetchShops();
      setShops(data);
      setFilteredShops(data);
      setLoading(false);
    };
    loadShops();
  }, []);

  useEffect(() => {
    let result = shops;
    
    if (searchQuery) {
      result = result.filter(shop => 
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCity) {
      result = result.filter(shop => shop.city === selectedCity);
    }
    
    setFilteredShops(result);
  }, [searchQuery, selectedCity, shops]);

  const uniqueCities = Array.from(new Set(shops.map(s => s.city)));

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <Badge className="bg-primary/10 text-primary border-none mb-3 px-3 py-1 text-xs font-black uppercase tracking-widest">
            Network Search
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 leading-tight mb-4">
            Find Trusted Dealers <span className="text-secondary italic">Near You</span>
          </h1>
          <p className="text-slate-500 max-w-2xl text-lg">
            Locate certified car and bike dealers across India. Explore listings, view ratings, and get directions instantly.
          </p>
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-3xl border-none shadow-sm p-6 space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Search by name or city..." 
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-none shadow-inner focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Quick Filters</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={!selectedCity ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setSelectedCity(null)}
                      className="rounded-full text-xs font-bold"
                    >
                      All Cities
                    </Button>
                    {uniqueCities.map(city => (
                      <Button 
                        key={city}
                        variant={selectedCity === city ? "default" : "secondary"}
                        size="sm"
                        onClick={() => setSelectedCity(city)}
                        className="rounded-full text-xs font-bold"
                      >
                        {city}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-slate-900">{filteredShops.length} Dealers Found</p>
                  <Filter size={16} className="text-slate-400" />
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="animate-spin text-primary" size={32} />
                      <p className="text-xs font-bold text-slate-400">Loading dealer network...</p>
                    </div>
                  ) : filteredShops.length > 0 ? (
                    filteredShops.map(shop => (
                      <motion.div
                        key={shop.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate(`/dealer/${shop.id}`)}
                        className="group p-3 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                      >
                        <div className="flex gap-3">
                          <img 
                            src={shop.images[0]} 
                            alt={shop.name}
                            className="w-16 h-16 rounded-xl object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                              {shop.name}
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                              <MapPin size={10} className="text-secondary" />
                              <span className="truncate">{shop.city}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex items-center gap-0.5 text-yellow-500">
                                <Star size={10} fill="currentColor" />
                                <span className="text-[10px] font-bold">{shop.rating}</span>
                              </div>
                              {shop.verificationStatus === 'verified' && (
                                <Badge className="bg-green-100 text-green-700 border-none text-[9px] px-1.5 py-0 h-4">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 self-center group-hover:text-primary transition-transform group-hover:translate-x-1" />
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-sm font-bold text-slate-400 italic">No dealers found matching your search.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <DealerMap 
              shops={filteredShops} 
              className="h-[650px] shadow-sm"
              initialCenter={filteredShops.length > 0 && filteredShops[0].latitude ? [filteredShops[0].latitude, filteredShops[0].longitude] : [22.9734, 78.6569]}
              initialZoom={selectedCity ? 12 : 5}
            />
            
            <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-secondary/10 rounded-[2rem] border border-secondary/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-white shadow-lg shadow-secondary/20">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Become a Certified Partner</p>
                  <p className="text-xs text-slate-500">List your inventory and join India's fastest growing premium auto network.</p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/seller/onboarding')}
                className="bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl px-6"
              >
                Join as Dealer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindDealers;
