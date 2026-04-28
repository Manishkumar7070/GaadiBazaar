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

const DealerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dealer, setDealer] = React.useState<Shop | null>(null);
  const [dealerVehicles, setDealerVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mapType, setMapType] = React.useState<'standard' | '3d'>('standard');
  
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
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
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

      {/* Dealer Info Card */}
      <section>
        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1 space-y-2 p-4">
              <div className="aspect-square rounded-3xl overflow-hidden relative">
                <img 
                  src={dealer.images[0]} 
                  alt={dealer.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {dealer.verificationStatus === 'verified' ? (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-green-500 text-white border-none px-3 py-1 flex gap-1 items-center shadow-lg">
                      <ShieldCheck size={14} /> Verified
                    </Badge>
                  </div>
                ) : user?.id === dealer.ownerId && (
                  <div className="absolute top-4 left-4">
                    <Badge 
                      variant={dealer.verificationStatus === 'rejected' ? 'destructive' : 'secondary'} 
                      className={`border-none px-3 py-1 flex gap-1 items-center shadow-lg ${dealer.verificationStatus === 'pending' ? 'bg-orange-500 text-white' : ''}`}
                    >
                      {dealer.verificationStatus === 'pending' ? <Clock size={14} /> : <XCircle size={14} />} 
                      {dealer.verificationStatus.charAt(0).toUpperCase() + dealer.verificationStatus.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>
              {dealer.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {dealer.images.slice(1, 5).map((img, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100">
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2 p-8 md:p-12 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight">{dealer.name}</h2>
                      {user?.id === dealer.ownerId && (
                        <Link to="/edit-shop">
                          <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary font-bold hover:bg-primary/5">
                            Edit Shop
                          </Button>
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={20} 
                            className={cn(
                              "transition-all",
                              star <= Math.round(dealer.rating || 4.5) 
                                ? "text-orange-500 fill-orange-500" 
                                : "text-slate-200"
                            )} 
                          />
                        ))}
                      </div>
                      <span className="text-lg font-bold text-slate-900">{dealer.rating || '4.5'}</span>
                      <Separator orientation="vertical" className="h-4 bg-slate-200" />
                      <span className="text-sm font-bold text-primary hover:underline cursor-pointer">
                        {dealer.reviewCount || '0'} Verified Reviews
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-500 flex items-center gap-2 font-medium">
                  <MapPin size={18} className="text-primary" />
                  {dealer.address}, {dealer.city}, {dealer.state} - {dealer.pincode}
                </p>
              </div>

              <p className="text-slate-600 leading-relaxed">
                {dealer.description}
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <a href={`tel:${dealer.phone}`} className="flex-1 md:flex-none">
                  <Button className="w-full rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold flex gap-2">
                    <Phone size={20} /> Call Dealer
                  </Button>
                </a>
                <Button variant="outline" className="rounded-2xl h-14 px-8 border-primary text-primary font-bold flex gap-2 flex-1 md:flex-none">
                  <MessageSquare size={20} /> Chat
                </Button>
              </div>
            </div>
          </div>
        </Card>
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
      <section className="space-y-6">
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

      {/* Reviews Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-primary" /> Customer Reviews
            <span className="text-sm font-normal text-slate-400 ml-2">({dealer.reviewCount || 0})</span>
          </h3>
          <Button variant="outline" className="rounded-xl border-primary text-primary font-bold">
            Write a Review
          </Button>
        </div>

        {dealer.reviews && dealer.reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dealer.reviews.map((review) => (
              <Card key={review.id} className="border-none shadow-sm rounded-3xl bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {review.userName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{review.userName}</p>
                      <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-lg text-sm font-bold">
                    <Star size={14} fill="currentColor" />
                    {review.rating}
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  "{review.comment}"
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
            <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">No reviews yet for this dealer.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DealerDetail;
