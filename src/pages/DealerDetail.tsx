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
  Lock,
  Loader2
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { MOCK_VEHICLES, MOCK_DEALERS } from '@/constants/mockData';
import VehicleCard from '@/features/vehicles/VehicleCard';
import { motion } from 'motion/react';
import { TrustScore } from '@/components/TrustScore';
import { shopService } from '@/services/shop.service';
import { vehicleService } from '@/services/vehicle.service';
import { Shop, Vehicle } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';

import { bookingService, Booking } from '@/services/booking.service';

const DealerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dealer, setDealer] = React.useState<Shop | null>(null);
  const [dealerVehicles, setDealerVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mapType, setMapType] = React.useState<'standard' | '3d'>('standard');
  const [reviewRefreshKey, setReviewRefreshKey] = React.useState(0);
  const [userBookings, setUserBookings] = React.useState<Booking[]>([]);

  const hasBookingWithDealer = userBookings.some(b => {
    const vehicle = dealerVehicles.find(v => v.id === b.vehicleId);
    return !!vehicle;
  });

  React.useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        if (user) {
          const bookings = await bookingService.fetchUserBookings(user.id);
          setUserBookings(bookings);
        }
        
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

      {/* Inventory Section - Primary View */}
      <section id="inventory-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
             <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Car className="text-primary" /> Available Inventory
             </h3>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Directly from {dealer.name}</p>
          </div>
          <Badge variant="outline" className="rounded-full px-4 border-slate-200 text-slate-400 font-black h-8">
             {dealerVehicles.length} Total Vehicles
          </Badge>
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

      <Separator className="bg-slate-100" />

      {/* Dealer info card */}
      <section className="space-y-8">
        <div className="space-y-1">
           <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Showroom Details</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify showroom credentials and location</p>
        </div>
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
                    <VerifiedBadge status={dealer.verificationStatus} type="dealer" showLabel={false} size="lg" />
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 space-y-4 pt-12 md:pt-14">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{dealer.name}</h2>
                    {dealer.verificationStatus === 'verified' && (
                      <VerifiedBadge status={dealer.verificationStatus} type="dealer" />
                    )}
                    <TrustScore score={dealer.trustScore || 8.5} className="ml-2" variant="stars" />
                  </div>
                  <div className="flex flex-wrap items-center gap-6 mt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response Rate</span>
                        <span className="text-sm font-bold text-slate-900">{dealer.responseTime || 'Under 2 hours'}</span>
                      </div>
                      <Separator orientation="vertical" className="h-8 bg-slate-200" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Experience</span>
                        <span className="text-sm font-bold text-slate-900">{dealer.yearsInBusiness || '5+'} Years</span>
                      </div>
                      <Separator orientation="vertical" className="h-8 bg-slate-200" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quality Score</span>
                        <span className="text-sm font-bold text-slate-900">{dealer.inventoryQualityScore || '9.2'}/10</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-6">
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

            {/* Locked Content Warning */}
            {!(hasBookingWithDealer || user?.id === dealer.ownerId) && (
              <div className="mt-8 bg-slate-900 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Lock size={24} className="text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase italic tracking-tight">Full Showroom Access Locked</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 italic">Showroom bio, exact location and contact details reveal after booking any car below</p>
                  </div>
                </div>
                <Badge className="bg-primary hover:bg-primary text-white border-none py-2 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest cursor-default">
                  COMMITMENT: ₹5,000
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
              <div className="md:col-span-2 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-slate-400">About Showroom</h3>
                  <p className={cn("text-slate-600 text-lg leading-relaxed", !(hasBookingWithDealer || user?.id === dealer.ownerId) && "blur-md select-none opacity-40")}>
                    {dealer.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group transition-all relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                      <Phone className="text-primary" size={18} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Number</span>
                    </div>
                    {hasBookingWithDealer || user?.id === dealer.ownerId ? (
                      <a href={`tel:${dealer.phone}`} className="text-lg font-bold text-slate-900 hover:text-primary transition-colors inline-block">
                        {dealer.phone}
                      </a>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-slate-300" />
                        <span className="text-sm font-black text-slate-300 uppercase italic">Locked</span>
                      </div>
                    )}
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

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 md:col-span-2 group transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="text-primary" size={18} />
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">Location Address</span>
                    </div>
                    <p className={cn("text-lg font-black transition-all", !(hasBookingWithDealer || user?.id === dealer.ownerId) && "blur-sm select-none opacity-50")}>
                      {hasBookingWithDealer || user?.id === dealer.ownerId ? (
                        `${dealer.address}, ${dealer.city}, ${dealer.state} - ${dealer.pincode}`
                      ) : (
                        `${dealer.city}, ${dealer.state} (Exact location locked)`
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  {hasBookingWithDealer || user?.id === dealer.ownerId ? (
                    <div className="flex flex-wrap gap-4 w-full">
                      <a href={`tel:${dealer.phone}`} className="flex-1 md:flex-none">
                        <Button className="w-full rounded-2xl h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white font-black flex gap-2 shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                          <Phone size={22} /> {dealer.phone}
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
                  ) : (
                    <div className="flex-1 bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <p className="text-[10px] font-black uppercase text-primary leading-tight">Book any car below to reveal contact details</p>
                      <Button 
                        size="sm" 
                        className="rounded-xl h-10 px-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest"
                        onClick={() => {
                          const inventorySection = document.getElementById('inventory-section');
                          if (inventorySection) inventorySection.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                         Inventory Below
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {(dealer.showroomVideoUrl || true) && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold uppercase tracking-wider text-slate-400">Virtual Showroom</h3>
                    <Card className="rounded-[2.5rem] overflow-hidden bg-slate-900 aspect-video relative group border-none shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                      {(hasBookingWithDealer || user?.id === dealer.ownerId) ? (
                        dealer.showroomVideoUrl ? (
                           <video 
                             src={dealer.showroomVideoUrl} 
                             className="w-full h-full object-cover"
                             controls
                             poster={dealer.bannerImage}
                           />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-4 relative z-20">
                            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                              <Car className="text-white" size={32} />
                            </div>
                            <div className="space-y-1">
                              <p className="text-lg font-black italic text-white uppercase">Walkthrough Coming Soon</p>
                              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Get a 360° view of the dealership</p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4 z-20">
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                            <Lock size={24} className="text-primary" />
                          </div>
                          <p className="text-sm font-black italic text-white uppercase tracking-tight">Showroom Video Locked</p>
                        </div>
                      )}
                      
                      <div className="absolute bottom-6 left-6 z-20">
                        <Badge className="bg-primary/90 text-white border-none py-1 px-4 rounded-full font-black text-[10px] uppercase tracking-widest">
                          Live Walkthrough
                        </Badge>
                      </div>
                    </Card>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-xl font-bold uppercase tracking-wider text-slate-400">Showroom Gallery</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {dealer.images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 group relative">
                        <img 
                          src={img} 
                          alt="" 
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
                            !(hasBookingWithDealer || user?.id === dealer.ownerId) && "blur-md opacity-50 grayscale"
                          )} 
                          referrerPolicy="no-referrer" 
                        />
                        {!(hasBookingWithDealer || user?.id === dealer.ownerId) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                    ))}
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
            mapType === '3d' && "ring-4 ring-primary/20",
            !hasBookingWithDealer && "grayscale blur-[2px] opacity-60"
          )}>
            {hasBookingWithDealer && dealer.mapEmbedUrl ? (
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
            ) : !hasBookingWithDealer ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-4 p-12 text-center">
                 <div className="p-8 bg-white/50 backdrop-blur-md rounded-full shadow-xl">
                    <Lock size={48} className="text-primary" />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-900">Map location locked</h4>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Pay ₹5,000 commitment to reveal showroom location</p>
                 </div>
                 <Button variant="secondary" className="rounded-xl h-10 px-8 font-black text-[10px] uppercase tracking-widest">
                    Book a Car below to unlock
                 </Button>
              </div>
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

      {/* Review System */}
      <section className="space-y-8 pb-12">
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
