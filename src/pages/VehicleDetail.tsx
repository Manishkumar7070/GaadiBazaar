import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight,
  Share2, 
  Heart, 
  MapPin, 
  Calendar, 
  Gauge, 
  Fuel, 
  Settings, 
  User, 
  ShieldCheck,
  Phone,
  MessageSquare,
  Clock,
  XCircle,
  FileText,
  Droplets,
  ArrowLeftRight,
  X,
  Maximize2,
  Palette,
  Wrench,
  CheckCircle2,
  Info,
  Lock,
  Zap,
  UserCheck,
  Star,
  Activity
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { MOCK_VEHICLES } from '@/constants/mockData';
import { motion, AnimatePresence } from 'motion/react';
import VehicleCard from '@/features/vehicles/VehicleCard';
import PriceHistoryChart from '@/features/vehicles/PriceHistoryChart';
import VehicleAIInsights from '@/features/vehicles/VehicleAIInsights';
import PriceComparisonSection from '@/features/vehicles/PriceComparisonSection';
import { useComparison } from '@/hooks/useComparison';
import { cn } from '@/lib/utils';
import { vehicleService } from '@/services/vehicle.service';
import { shopService } from '@/services/shop.service';
import { Vehicle, Shop } from '@/types';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ChatWindow } from '@/features/chat/ChatWindow';

const Magnifier = ({ src, alt, onClick }: { src: string; alt: string; onClick?: () => void }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
    setCursorPosition({ x: e.clientX - left, y: e.clientY - top });
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden cursor-zoom-in group"
      onMouseEnter={() => setShowMagnifier(true)}
      onMouseLeave={() => setShowMagnifier(false)}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <img 
        src={src} 
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-transform duration-500",
          showMagnifier ? "scale-105" : "scale-100"
        )}
        referrerPolicy="no-referrer"
      />
      
      {/* Magnifying Glass Effect */}
      {showMagnifier && (
        <div
          className="absolute pointer-events-none border-4 border-white/30 shadow-2xl rounded-full overflow-hidden hidden md:block"
          style={{
            left: `${cursorPosition.x - 100}px`,
            top: `${cursorPosition.y - 100}px`,
            width: '200px',
            height: '200px',
            backgroundImage: `url(${src})`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundSize: '400%',
            zIndex: 10,
          }}
        />
      )}

      {/* Zoom Icon Overlay */}
      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Maximize2 size={20} className="text-primary" />
      </div>
    </div>
  );
};

const VehicleDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToComparison, removeFromComparison, isVehicleSelected } = useComparison();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);
  
  const [similarVehicles, setSimilarVehicles] = useState<Vehicle[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const vehicles = await vehicleService.fetchVehicles({ verificationStatus: 'verified' });
        setAllVehicles(vehicles);

        let v = MOCK_VEHICLES.find(v => v.id === id) as any;
        if (!v) {
          v = vehicles.find(item => item.id === id);
        }
        
        if (v) {
          setVehicle(v);
          if (v.shopId) {
            const s = await shopService.fetchShopById(v.shopId);
            setShop(s);
          }
          setSimilarVehicles(vehicles.filter(item => item.id !== v.id && (item.brand === v.brand || item.vehicleType === v.vehicleType)).slice(0, 4));
        }
      } catch (error) {
        console.error('Error loading vehicle details:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const isSelected = vehicle ? isVehicleSelected(vehicle.id) : false;
  const isSold = vehicle?.status === 'sold';

  const toggleCompare = () => {
    if (!vehicle) return;
    if (isSelected) {
      removeFromComparison(vehicle.id);
    } else {
      addToComparison(vehicle);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      navigate(`/login?reason=favorite_vehicle&redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!vehicle) return;
    try {
      await toggleWishlist(vehicle.id);
    } catch (error) {
      console.error('Failed to update wishlist');
    }
  };

  const handleContactSeller = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate(`/login?reason=contact_seller&redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setShowContactInfo(true);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (vehicle) {
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const updated = [vehicle.id, ...recentlyViewed.filter((vid: string) => vid !== vehicle.id)].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    }
  }, [id, vehicle]);

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Vehicle not found</h2>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  const specs = [
    { icon: Calendar, label: 'Reg. Year', value: vehicle.year },
    { icon: Fuel, label: 'Fuel Type', value: vehicle.fuelType },
    { icon: Gauge, label: 'KM Driven', value: `${vehicle.kilometersDriven.toLocaleString()} km` },
    { icon: Settings, label: 'Transmission', value: vehicle.transmission },
    { icon: Activity, label: 'Engine', value: '1198 cc' },
    { icon: User, label: 'Ownership', value: vehicle.ownership },
    { icon: Calendar, label: 'Make Year', value: vehicle.year },
    { icon: Palette, label: 'Color', value: vehicle.color || 'N/A' },
    { icon: ShieldCheck, label: 'Spare Key', value: 'Yes' },
    { icon: FileText, label: 'Reg. No', value: 'DL8C*****' }
  ];

  const greatThings = [
    { icon: Zap, title: "Steal Deal", desc: "Lower than market price" },
    { icon: ShieldCheck, title: "Trust Verified", desc: "No major repair history" },
    { icon: Wrench, title: "Just Serviced", desc: "Oil & filters newly replaced" },
    { icon: Lock, title: "Safe Purchase", desc: "Verified seller documentation" }
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-12 pb-24">
      <Helmet>
        <title>{`${vehicle.year} ${vehicle.brand} ${vehicle.title} For Sale in ${vehicle.city} | AsOneDealer`}</title>
        <meta name="description" content={`Buy this verified ${vehicle.year} ${vehicle.brand} ${vehicle.title} with ${vehicle.kilometersDriven.toLocaleString()} km in ${vehicle.city}. Verified by AsOneDealer. Price: ₹${vehicle.price.toLocaleString()}.`} />
        <meta name="keywords" content={`${vehicle.brand} ${vehicle.model}, used cars in ${vehicle.city}, buy used ${vehicle.brand}, AsOneDealer verified cars`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${vehicle.year} ${vehicle.brand} ${vehicle.title} | AsOneDealer`} />
        <meta property="og:description" content={`Verified ${vehicle.brand} ${vehicle.model} available at AsOneDealer. ${vehicle.kilometersDriven.toLocaleString()} km driven, ${vehicle.ownership} owner.`} />
        <meta property="og:image" content={vehicle.images[0]} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${vehicle.year} ${vehicle.brand} ${vehicle.title} | AsOneDealer`} />
        <meta name="twitter:description" content={`Check out this verified ${vehicle.brand} at AsOneDealer ${vehicle.city}.`} />
        <meta name="twitter:image" content={vehicle.images[0]} />
      </Helmet>

      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full bg-white shadow-sm border border-slate-100 hover:bg-slate-50"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Back to {vehicle.city} inventory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100"><Share2 size={20} /></Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCompare}
            className={cn("rounded-full transition-colors", isSelected ? "bg-primary/10 text-primary" : "hover:bg-slate-100")}
          >
            <ArrowLeftRight size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleFavorite}
            className={cn("rounded-full transition-colors", isInWishlist(vehicle.id) ? "text-red-500 bg-red-50" : "hover:bg-slate-100")}
          >
            <Heart size={20} className={isInWishlist(vehicle.id) ? "fill-current" : ""} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Gallery Section */}
          <div className="space-y-6">
            <div className="relative aspect-[16/9] rounded-[3rem] overflow-hidden bg-slate-100 shadow-2xl group border-[1.5rem] border-white cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
              <Magnifier 
                src={vehicle.images[activeImageIndex]} 
                alt={`${vehicle.brand} ${vehicle.title}`}
              />

              {isSold && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-md">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/10 border-4 border-white/50 px-12 py-6 rounded-[2.5rem] backdrop-blur-md rotate-[-5deg] shadow-2xl"
                  >
                    <span className="text-white text-6xl font-[1000] tracking-widest uppercase italic">Sold Out</span>
                  </motion.div>
                </div>
              )}

              <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                <Badge className="bg-slate-900/80 backdrop-blur-md text-white font-black text-[10px] px-4 py-2 rounded-full uppercase tracking-widest border-none">
                  {activeImageIndex + 1} / {vehicle.images.length} Photos
                </Badge>
                {isSold && (
                  <Badge className="bg-red-650 text-white border-none py-2 px-4 rounded-full font-black uppercase text-[10px] tracking-widest bg-red-600 shadow-lg">
                    Unavailable
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {vehicle.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "relative flex-shrink-0 w-24 h-24 rounded-3xl overflow-hidden transition-all duration-300 transform",
                    activeImageIndex === i ? "ring-4 ring-primary ring-offset-4 scale-95" : "opacity-60 hover:opacity-100 hover:scale-105"
                  )}
                >
                  <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Great Things */}
          <section className="bg-slate-900 rounded-[3.5rem] p-12 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/30 blur-3xl rounded-full -mr-20 -mt-20" />
            <div className="relative space-y-8">
              <div className="space-y-1">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Great things about</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">this vehicle</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {greatThings.map((thing, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                      <thing.icon size={24} className="text-primary group-hover:text-white transition-colors duration-500" />
                    </div>
                    <div className="space-y-1 pt-1">
                      <h4 className="font-black text-lg uppercase tracking-tight">{thing.title}</h4>
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-tighter leading-tight">{thing.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-slate-800 px-4">Car Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {specs.map((spec, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-primary/20 transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1">
                  <spec.icon size={20} className="text-slate-400 group-hover:text-primary transition-colors mb-4" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{spec.label}</p>
                  <p className="font-black text-slate-800 text-xs uppercase">{spec.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Categorized Detailed Gallery */}
          {vehicle.imageMetadata && Object.values(vehicle.imageMetadata).some(v => !!v) && (
            <section className="space-y-8">
              <div className="flex items-center gap-2 px-4">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-6 uppercase font-black text-[10px] tracking-widest">Gallery</Badge>
                <h2 className="text-xl font-black uppercase tracking-widest">Detailed Views</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { id: 'interior', label: 'Interior' },
                  { id: 'exterior', label: 'Exterior' },
                  { id: 'engine', label: 'Engine Bay' },
                  { id: 'tires', label: 'Tires & Wheels' },
                ].map(({ id, label }) => {
                  const imageUrl = vehicle.imageMetadata?.[id];
                  if (!imageUrl) return null;
                  
                  return (
                    <motion.div 
                      key={id}
                      whileHover={{ y: -5 }}
                      className="group cursor-pointer space-y-3"
                      onClick={() => {
                        const idx = vehicle.images.indexOf(imageUrl);
                        if (idx !== -1) {
                          setActiveImageIndex(idx);
                          setIsLightboxOpen(true);
                        }
                      }}
                    >
                      <div className="aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 border-4 border-white shadow-lg group-hover:shadow-2xl transition-all relative">
                        <img 
                          src={imageUrl} 
                          alt={label} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        <div className="absolute bottom-4 left-4">
                          <span className="bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                            {label}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Inspection Section */}
          <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[3rem] p-10 border border-green-100 relative overflow-hidden group">
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 space-y-6">
                   <div className="flex items-center gap-3">
                      <Badge className="bg-green-600 text-white border-none py-1.5 px-4 font-black uppercase text-[10px] tracking-widest rounded-full">Report Ready</Badge>
                      <div className="flex items-center gap-1 text-green-700 font-black text-sm uppercase tracking-tighter">
                         <ShieldCheck size={18} /> Asonedealer Verified
                      </div>
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase italic">150+ Points Inspection</h3>
                      <p className="text-slate-600 font-medium leading-relaxed max-w-md">Our vehicle experts have thoroughly inspected this car across 150+ touchpoints. Engine, document, and structural check verified.</p>
                   </div>
                   <Button className="bg-slate-900 text-white h-16 rounded-2xl px-10 font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all">
                      View Full Report
                   </Button>
                </div>
                <div className="shrink-0 w-full md:w-64 aspect-square bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-4">
                      <Lock size={48} className="text-slate-200" />
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Locked</p>
                   </div>
                </div>
             </div>
          </section>

          <VehicleAIInsights vehicle={vehicle} />
          <PriceComparisonSection vehicle={vehicle} allVehicles={allVehicles} />

          {/* Expert Description */}
          <section className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-800 px-4">Expert Description</h2>
            <div className="text-slate-600 leading-relaxed bg-white p-8 rounded-[2.5rem] shadow-sm font-medium">
              {vehicle.description}
            </div>
          </section>

          {/* Evidence Video */}
          {(vehicle.engineStartVideo || vehicle.engineSoundVideo || vehicle.walkaroundVideo) && (
            <section className="space-y-6 pt-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-6 uppercase font-black text-[10px] tracking-widest">Proof</Badge>
                <h2 className="text-xl font-black uppercase tracking-widest">Sound & Video</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {vehicle.engineStartVideo && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest"><ShieldCheck size={16} className="text-green-500" /> Engine Cold Start</p>
                    <div className="aspect-video rounded-[2rem] overflow-hidden shadow-xl bg-black border border-slate-100">
                      <video src={vehicle.engineStartVideo} className="w-full h-full object-cover" controls playsInline />
                    </div>
                  </div>
                )}
                {vehicle.engineSoundVideo && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest"><ShieldCheck size={16} className="text-green-500" /> Engine Rev</p>
                    <div className="aspect-video rounded-[2rem] overflow-hidden shadow-xl bg-black border border-slate-100">
                      <video src={vehicle.engineSoundVideo} className="w-full h-full object-cover" controls playsInline />
                    </div>
                  </div>
                )}
                {vehicle.walkaroundVideo && (
                  <div className="space-y-3 sm:col-span-2">
                    <p className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest"><ShieldCheck size={16} className="text-green-500" /> Walkaround</p>
                    <div className="aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl bg-black border border-slate-100">
                      <video src={vehicle.walkaroundVideo} className="w-full h-full object-cover" controls playsInline />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Reviews */}
          <div id="reviews" className="space-y-10 pt-16 border-t border-slate-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight italic uppercase leading-none">Vehicle Reviews</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-yellow-500">
                    {[1, 2, 3, 4].map(star => <Star key={star} size={20} className="fill-current" />)}
                    <Star size={20} className="fill-current/50" />
                  </div>
                  <span className="text-lg font-black text-slate-900">4.0 / 5</span>
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">• Verified</span>
                </div>
              </div>
              <Dialog>
                <DialogTrigger
                  render={
                    <Button className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest transition-all">
                      Write Review
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                  <ReviewForm targetId={vehicle.id} targetType="vehicle" onSuccess={() => setReviewRefreshKey(prev => prev + 1)} />
                </DialogContent>
              </Dialog>
            </div>
            <ReviewList targetId={vehicle.id} targetType="vehicle" refreshKey={reviewRefreshKey} />
          </div>
        </div>

        {/* Right Column: Sticky Pricing & Seller Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-8 space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-1">
                  <Badge className="bg-green-100 text-green-700 border-none px-3 py-1 font-black text-[10px] uppercase tracking-widest">Verified Listing</Badge>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                    {vehicle.year} {vehicle.brand} {vehicle.title}
                  </h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vehicle.kilometersDriven.toLocaleString()} km • {vehicle.ownership} owner • {vehicle.fuelType}</p>
                </div>

                <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase">EMI starts at</p>
                    <button className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Check &gt;</button>
                  </div>
                  <p className="text-2xl font-black text-slate-900">₹{Math.round(vehicle.price * 0.02).toLocaleString()}/mo</p>
                  <Separator className="bg-slate-200" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase pb-1">Price</p>
                    <p className="text-3xl font-black text-primary">₹{vehicle.price.toLocaleString()}</p>
                  </div>
                </div>

                <Button 
                  className={cn(
                    "w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl transition-all",
                    isSold ? "bg-slate-200 text-slate-500 hover:bg-slate-200 cursor-not-allowed shadow-none" : "bg-slate-900 hover:bg-slate-800 hover:scale-[1.02] active:scale-95"
                  )}
                  onClick={isSold ? undefined : handleContactSeller}
                  disabled={isSold}
                >
                  {isSold ? 'Vehicle Sold Out' : showContactInfo ? (shop?.phone || '+91 99999 99999') : 'Contact Seller'}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-8 space-y-6">
                {shop ? (
                  <Link to={`/dealer/${shop.id}`} className="flex items-center gap-4 group">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-bold text-primary">{shop.name[0]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><h3 className="font-bold group-hover:text-primary transition-colors">{shop.name}</h3> <ShieldCheck size={14} className="text-green-500" /></div>
                      <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold"><span>★ {shop.rating || '4.5'}</span></div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-bold">P</div>
                    <div><h3 className="font-bold">Private Seller</h3><p className="text-xs text-slate-400">{vehicle.city}</p></div>
                  </div>
                )}
                <div className="bg-orange-50 p-6 rounded-3xl space-y-2">
                  <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Trust Certified</h4>
                  <p className="text-[10px] font-bold text-orange-800/70 uppercase tracking-tighter">Showroom & Inventory verified.</p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-slate-100/50 p-8 rounded-[2.5rem] border border-slate-200/50 space-y-4">
              <h4 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-slate-800"><Info size={16} /> Safe Deal</h4>
              <div className="space-y-4">
                <div className="flex gap-4"><CheckCircle2 size={16} className="text-green-500 shrink-0" /><p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Verify documents & history before pay.</p></div>
                <div className="flex gap-4"><UserCheck size={16} className="text-blue-500 shrink-0" /><p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Meet at showroom/public only.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Vehicles */}
      {similarVehicles.length > 0 && (
        <section className="space-y-8 pt-12 border-t border-slate-100">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Similar Vehicles</h2>
            <Link to={`/search?q=${vehicle.brand}`} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">View All &gt;</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarVehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </section>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 flex gap-3 md:hidden">
        <Button 
          className={cn(
            "w-full h-14 rounded-2xl text-lg font-black shadow-lg",
            isSold ? "bg-slate-200 text-slate-500 hover:bg-slate-200" : "bg-primary"
          )} 
          onClick={isSold ? undefined : handleContactSeller}
          disabled={isSold}
        >
          {isSold ? 'Sold Out' : showContactInfo ? shop?.phone || '+91 99999 99999' : 'Contact Seller'}
        </Button>
      </div>

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] p-0 bg-black/95 border-none overflow-hidden">
          <div className="relative w-full h-[85vh] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImageIndex}
                src={vehicle.images[activeImageIndex]}
                alt="Fullscreen"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
            <DialogClose className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full"><X size={24} /></DialogClose>
            <button onClick={() => setActiveImageIndex(prev => prev > 0 ? prev - 1 : vehicle.images.length - 1)} className="absolute left-6 top-1/2 p-3 bg-white/10 text-white rounded-full"><ChevronLeft size={32} /></button>
            <button onClick={() => setActiveImageIndex(prev => prev < vehicle.images.length - 1 ? prev + 1 : 0)} className="absolute right-6 top-1/2 p-3 bg-white/10 text-white rounded-full"><ChevronRight size={32} /></button>
          </div>
          <div className="bg-black/80 p-6 flex gap-4 overflow-x-auto justify-center">
            {vehicle.images.map((img, i) => (
              <button key={i} onClick={() => setActiveImageIndex(i)} className={cn("w-20 h-20 rounded-xl overflow-hidden", activeImageIndex === i ? "ring-2 ring-primary" : "opacity-40")}>
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 overflow-hidden outline-none border-none shadow-2xl">
          <ChatWindow 
            sellerId={shop?.ownerId || vehicle.sellerId} 
            sellerName={shop?.name || "Private Seller"} 
            vehicleId={vehicle.id} 
            vehicleTitle={vehicle.title}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleDetail;
