import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  MapPin, 
  Star, 
  Phone, 
  MessageSquare, 
  ShieldCheck,
  Clock,
  XCircle,
  Car,
  Loader2
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { MOCK_VEHICLES, MOCK_DEALERS } from '@/constants/mockData';
import VehicleCard from '@/features/vehicles/VehicleCard';
import { motion } from 'motion/react';
import { shopService } from '@/services/shop.service';
import { vehicleService } from '@/services/vehicle.service';
import { Shop, Vehicle } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';

const DealerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dealer, setDealer] = React.useState<Shop | null>(null);
  const [dealerVehicles, setDealerVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mapType, setMapType] = React.useState<'standard' | '3d'>('standard');
  const [reviewRefreshKey, setReviewRefreshKey] = React.useState(0);
  
  React.useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const shop = await shopService.fetchShopById(id);
        if (shop) {
          setDealer(shop);
          const vehicles = await vehicleService.fetchVehicles({ shopId: id, verificationStatus: 'verified' });
          setDealerVehicles(vehicles);
        } else {
          // Fallback to mock for demo
          const mockDealer = MOCK_DEALERS.find(d => d.id === id);
          if (mockDealer) {
            setDealer(mockDealer as any);
            setDealerVehicles(MOCK_VEHICLES.filter(v => v.shopId === id));
          }
        }
      } catch (error) {
        console.error('Error loading dealer data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <XCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold">Dealer not found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 pb-20">
      <Helmet>
        <title>{`${dealer.name} - Verified Car Dealer in ${dealer.city} | AsOneDealer`}</title>
        <meta name="description" content={dealer.description ? `${dealer.description.substring(0, 155)}... - Visit ${dealer.name} in ${dealer.city} for quality verified used cars.` : `View verified used car inventory and reviews for ${dealer.name} in ${dealer.city}. Trusted AsOneDealer partner.`} />
        <meta name="keywords" content={`${dealer.name}, ${dealer.city} car dealer, used cars in ${dealer.city}, verified car shop ${dealer.city}, reliable car sellers ${dealer.city}, AsOneDealer partner`} />
        
        <meta property="og:title" content={`${dealer.name} - Best Used Cars in ${dealer.city} | AsOneDealer`} />
        <meta property="og:description" content={dealer.description ? `${dealer.description.substring(0, 200)}` : `Explore verified vehicle inventory at ${dealer.name} in ${dealer.city}.`} />
        <meta property="og:image" content={dealer.images[0]} />
        <meta property="og:type" content="business.business" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${dealer.name} - ${dealer.city}`} />
        <meta name="twitter:description" content={`Discover the best deals on verified used cars at ${dealer.name} in ${dealer.city}.`} />
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full bg-white shadow-sm"
          >
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold">Dealer Profile</h1>
        </div>
        {user?.id === dealer.ownerId && (
          <Link to="/edit-shop">
            <Button variant="outline" className="rounded-xl border-primary text-primary font-bold hover:bg-primary/5">
              Edit Shop Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Dealer info card */}
      <section>
        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white relative">
          {/* Banner */}
          <div className="w-full h-48 md:h-64 bg-slate-100 relative">
            {dealer.bannerImage ? (
              <img 
                src={dealer.bannerImage} 
                alt="Banner" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
          </div>

          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row gap-8 -mt-12">
              {/* Logo / Profile Image */}
              <div className="flex-shrink-0 relative group">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden bg-white p-2 shadow-xl border-4 border-white transition-transform duration-500 group-hover:scale-105">
                  <img 
                    src={dealer.logo || (dealer.images && dealer.images[0]) || '/placeholder-shop.jpg'} 
                    alt={dealer.name} 
                    className="w-full h-full object-cover rounded-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {dealer.verificationStatus === 'verified' && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-green-500 text-white rounded-full p-1.5 shadow-lg border-2 border-white">
                      <ShieldCheck size={20} />
                    </div>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 space-y-4 pt-12 md:pt-14">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{dealer.name}</h2>
                    {dealer.verificationStatus === 'verified' && (
                      <Badge className="bg-primary hover:bg-primary text-white border-none px-3 py-1 text-[10px] uppercase font-black tracking-widest h-6">
                        Verified Dealer
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-6 mt-3">
                    <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                      <Star size={16} className="text-orange-500 fill-orange-500" />
                      <span className="text-sm font-bold text-slate-900">{dealer.rating || '4.5'}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4 bg-slate-200" />
                    <span className="text-sm font-bold text-slate-500">
                      {dealer.reviewsCount || '0'} Reviews
                    </span>
                    {dealer.city && (
                      <>
                        <Separator orientation="vertical" className="h-4 bg-slate-200" />
                        <span className="text-sm font-bold text-primary flex items-center gap-1">
                          <MapPin size={16} /> {dealer.city}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
              <div className="md:col-span-2 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-slate-400">About Showroom</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">
                    {dealer.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="text-primary" size={18} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Number</span>
                    </div>
                    <a href={`tel:${dealer.phone}`} className="text-lg font-bold text-slate-900 hover:text-primary transition-colors inline-block">
                      {dealer.phone}
                    </a>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="text-primary" size={18} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Business Hours</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {dealer.businessHours || 'Open: 10AM - 8PM'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 md:col-span-2 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="text-primary" size={18} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Location Address</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {dealer.address}, {dealer.city}, {dealer.state} - {dealer.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  <a href={`tel:${dealer.phone}`} className="flex-1 md:flex-none">
                    <Button className="w-full rounded-2xl h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white font-black flex gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                      <Phone size={22} /> Call Now
                    </Button>
                  </a>
                  {dealer.website && (
                    <a href={dealer.website} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none">
                      <Button variant="outline" className="w-full rounded-2xl h-14 px-10 border-slate-200 text-slate-700 font-black flex gap-2 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shadow-sm">
                        Visit Website
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-slate-400">Showroom Gallery</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {dealer.images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 group relative">
                        <img 
                          src={img} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    ))}
                    {dealer.images.length === 0 && (
                      <div className="aspect-square rounded-2xl bg-slate-100 flex items-center justify-center col-span-2 text-slate-400">
                        No photos uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Trust Banner Reflected from SWOT */}
      <section className="px-4">
        <div className="bg-gradient-to-r from-primary to-orange-400 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <ShieldCheck size={200} />
          </div>
          <div className="relative z-10 max-w-2xl space-y-4">
            <Badge className="bg-white/20 text-white border-none px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black">
              Digital Showroom Guarantee
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Buying from <span className="underline decoration-white/30 underline-offset-8">Verified Dealers</span> means buying with peace of mind.
            </h2>
            <p className="text-white/80 font-medium text-lg">
              We physically visit every showroom to verify their inventory, pricing integrity, and registration certificates. No fake listings, ever.
            </p>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="text-primary" /> Store Location
          </h3>
          {dealer.mapEmbedUrl && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <Button 
                variant={mapType === 'standard' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={cn("rounded-lg text-xs font-bold px-4 h-8 bg-transparent transition-all", mapType === 'standard' && "bg-white shadow-sm")}
                onClick={() => setMapType('standard')}
              >
                Standard
              </Button>
              <Button 
                variant={mapType === '3d' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={cn("rounded-lg text-xs font-bold px-4 h-8 bg-transparent flex gap-1 items-center transition-all", mapType === '3d' && "bg-white shadow-sm text-primary")}
                onClick={() => setMapType('3d')}
              >
                {mapType === '3d' && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                3D View
              </Button>
            </div>
          )}
        </div>
        
        <motion.div
          animate={mapType === '3d' ? { 
            rotateX: 10,
            perspective: 1000,
            scale: 1.02
          } : { 
            rotateX: 0,
            perspective: 1000,
            scale: 1
          }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative"
        >
          <Card className={cn(
            "border-none shadow-2xl rounded-[2.5rem] overflow-hidden h-[500px] bg-slate-100 relative group transition-all duration-500",
            mapType === '3d' && "ring-4 ring-primary/20"
          )}>
            {dealer.mapEmbedUrl ? (
              <>
                <iframe 
                  src={mapType === '3d' ? `${dealer.mapEmbedUrl}&maptype=satellite` : dealer.mapEmbedUrl}
                  className="w-full h-full border-none transition-all duration-1000"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Shop Location"
                />
                
                {/* Immersive 3D HUD Elements */}
                {mapType === '3d' && (
                  <>
                    {/* Viewport Corners */}
                    <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-xl pointer-events-none" />
                    <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-primary/40 rounded-tr-xl pointer-events-none" />
                    <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-primary/40 rounded-bl-xl pointer-events-none" />
                    <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-xl pointer-events-none" />
                    
                    {/* Metadata HUD */}
                    <div className="absolute top-10 left-10 space-y-1 pointer-events-none">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black tracking-widest text-primary/80 uppercase">Satellite link active</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500/80">ALT: 1500m | HDG: 342°</div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/20 shadow-2xl pointer-events-none">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">Longitude</span>
                        <span className="text-xs text-white font-mono">{dealer.longitude || '77.4243'}</span>
                      </div>
                      <Separator orientation="vertical" className="h-6 bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">Latitude</span>
                        <span className="text-xs text-white font-mono">{dealer.latitude || '23.2515'}</span>
                      </div>
                      <Separator orientation="vertical" className="h-6 bg-white/10" />
                      <Badge className="bg-primary hover:bg-primary text-white border-none text-[10px] py-0 h-5">3D ENABLED</Badge>
                    </div>

                    {/* Center Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                      <div className="w-20 h-20 border border-primary rounded-full animate-ping" />
                      <div className="absolute w-6 h-0.5 bg-primary" />
                      <div className="absolute h-6 w-0.5 bg-primary" />
                    </div>
                  </>
                )}
                
                {/* Overlay Vignette */}
                <div className={cn(
                  "absolute inset-0 pointer-events-none transition-opacity duration-1000",
                  mapType === '3d' ? "bg-radial-[rgba(0,0,0,0)_60%,rgba(0,0,0,0.4)_100%]" : "opacity-0"
                )} />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-2">
                <div className="p-6 bg-white/50 backdrop-blur-sm rounded-full mb-4">
                  <MapPin size={48} className="text-primary/40" />
                </div>
                <p className="font-bold text-slate-600">Location Map: {dealer.city}</p>
                <p className="text-sm font-medium">Coordinates: {dealer.latitude || '23.2515'}N, {dealer.longitude || '77.4243'}E</p>
                <Button variant="outline" className="mt-4 rounded-xl border-slate-200">Request 3D Map View</Button>
              </div>
            )}
          </Card>
        </motion.div>
      </section>

      {/* Inventory Section */}
      <section className="space-y-6 pb-12 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Car className="text-primary" /> Dealer Inventory
            <span className="text-sm font-normal text-slate-400 ml-2">({dealerVehicles.length} vehicles)</span>
          </h3>
        </div>

        {dealerVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dealerVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
            <Car className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">This dealer currently has no active listings.</p>
          </div>
        )}
      </section>

      {/* Review System */}
      <section className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <ReviewList targetId={dealer.id} targetType="shop" refreshKey={reviewRefreshKey} />
          </div>
          <div className="md:sticky md:top-24 h-fit">
            <ReviewForm targetId={dealer.id} targetType="shop" onSuccess={() => setReviewRefreshKey(prev => prev + 1)} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default DealerDetail;
