import React, { useState, useEffect } from 'react';
import { Shop } from '@/types';
import { shopService } from '@/services/shop.service';
import DealerMap from '@/features/dealers/DealerMap';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Star, Phone, Filter, ChevronRight, ShieldCheck, Navigation, Loader2, Handshake } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { TrustScore } from '@/components/TrustScore';

const FindDealers: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'trust' | 'nearest' | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setSortBy('nearest');
      }, (error) => {
        console.error("Error getting location:", error);
        // On mobile/Sandboxed iframes, this might fail, so we just log it
      });
    }
  };

  useEffect(() => {
    const loadShops = async () => {
      setLoading(true);
      const data = await shopService.fetchShops();
      setShops(data);
      setFilteredShops(data);
      setLoading(false);
      
      // Auto-trigger location if param exists
      const params = new URLSearchParams(location.search);
      if (params.get('nearMe') === 'true') {
        requestLocation();
      }
    };
    loadShops();
  }, [location.search]);

  useEffect(() => {
    let result = [...shops];
    
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

    if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'trust') {
      result.sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0));
    } else if (sortBy === 'nearest' && userLocation) {
      // Sort by crow-flies distance
      result.sort((a, b) => {
        if (!a.latitude || !a.longitude || !b.latitude || !b.longitude) return 0;
        const distA = Math.sqrt(Math.pow(a.latitude - userLocation[0], 2) + Math.pow(a.longitude - userLocation[1], 2));
        const distB = Math.sqrt(Math.pow(b.latitude - userLocation[0], 2) + Math.pow(b.longitude - userLocation[1], 2));
        return distA - distB;
      });
    }
    
    setFilteredShops(result);
  }, [searchQuery, selectedCity, sortBy, shops, userLocation]);

  const uniqueCities = Array.from(new Set(shops.map(s => s.city)));

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <Helmet>
        <title>Find Verified Car & Bike Dealers | AsOneDealer Network</title>
        <meta name="description" content="Locate our certified network of car and bike dealers across India. Interactive map, verified ratings, and direct contact info for trusted showrooms." />
        <meta name="keywords" content="find car dealers, bike showrooms India, verified auto dealers, AsOneDealer network" />
      </Helmet>
      
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
                      variant={sortBy === 'nearest' ? "default" : "secondary"}
                      size="sm"
                      onClick={() => {
                        if (sortBy === 'nearest') {
                          setSortBy(null);
                        } else {
                          requestLocation();
                        }
                      }}
                      className="rounded-full text-xs font-bold gap-1.5"
                    >
                      <MapPin size={12} />
                      Nearest
                    </Button>
                    <Button 
                      variant={sortBy === 'trust' ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setSortBy(prev => prev === 'trust' ? null : 'trust')}
                      className="rounded-full text-xs font-bold gap-1.5"
                    >
                      <ShieldCheck size={12} />
                      Top Quality
                    </Button>
                    <div className="w-full h-px bg-slate-100 my-1" />
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
                            src={shop.logo || shop.images[0] || '/placeholder-shop.jpg'} 
                            alt={shop.name}
                            className="w-16 h-16 rounded-xl object-cover bg-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                                {shop.name}
                              </h4>
                              {shop.verificationStatus === 'verified' && (
                                <ShieldCheck size={12} className="text-primary" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-tight mb-2">
                              <MapPin size={10} className="text-primary" />
                              <span className="truncate">{shop.city} • {shop.yearsInBusiness || '5+'}Y Exp</span>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                              <TrustScore score={shop.trustScore || 8.5} size="sm" variant="stars" />
                              <div className="flex items-center gap-0.5 text-yellow-500">
                                <Star size={10} fill="currentColor" />
                                <span className="text-[10px] font-black">{shop.rating || '4.5'}</span>
                              </div>
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
              userLocation={userLocation}
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
