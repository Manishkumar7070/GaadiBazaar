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
  FileText,
  Droplets,
  ArrowLeftRight,
  X,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { MOCK_VEHICLES, MOCK_DEALERS } from '@/constants/mockData';
import { motion, AnimatePresence } from 'motion/react';
import VehicleCard from '@/features/vehicles/VehicleCard';
import { useComparison } from '@/hooks/useComparison';
import { cn } from '@/lib/utils';

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
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const vehicle = MOCK_VEHICLES.find(v => v.id === id);
  const isSelected = vehicle ? isVehicleSelected(vehicle.id) : false;
  const dealer = vehicle?.dealerId ? MOCK_DEALERS.find(d => d.id === vehicle.dealerId) : null;

  const toggleCompare = () => {
    if (!vehicle) return;
    if (isSelected) {
      removeFromComparison(vehicle.id);
    } else {
      addToComparison(vehicle);
    }
  };

  const handleFavorite = () => {
    if (!user) {
      navigate(`/login?reason=favorite_vehicle&redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    alert('Added to favorites!');
  };

  const handleContactSeller = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate(`/login?reason=contact_seller&redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
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
    { icon: Calendar, label: 'Year', value: vehicle.year },
    { icon: Gauge, label: 'Kilometers', value: `${vehicle.kilometersDriven.toLocaleString()} km` },
    { icon: Fuel, label: 'Fuel Type', value: vehicle.fuelType },
    { icon: Settings, label: 'Transmission', value: vehicle.transmission },
    { icon: User, label: 'Ownership', value: vehicle.ownership },
    { icon: MapPin, label: 'Location', value: vehicle.city },
    { icon: FileText, label: 'Reg. No', value: vehicle.registrationNumber || 'N/A' },
    { icon: Droplets, label: 'Mileage', value: vehicle.mileage || 'N/A' },
  ];

  const similarVehicles = MOCK_VEHICLES.filter(v => 
    v.id !== vehicle.id && 
    (v.brand === vehicle.brand || v.vehicleType === vehicle.vehicleType)
  ).slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full bg-white shadow-sm"
        >
          <ChevronLeft size={24} />
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCompare}
            className={cn(
              "rounded-full shadow-sm transition-colors",
              isSelected ? "bg-primary text-white hover:bg-primary/90" : "bg-white hover:bg-slate-50"
            )}
          >
            <ArrowLeftRight size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
            <Share2 size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-white shadow-sm"
            onClick={handleFavorite}
          >
            <Heart size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <section className="space-y-4">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-video rounded-[2rem] overflow-hidden bg-slate-200 shadow-xl border border-slate-100"
              >
                <Magnifier 
                  src={vehicle.images[activeImageIndex]} 
                  alt={vehicle.title}
                  onClick={() => setIsLightboxOpen(true)}
                />
              </motion.div>
              
              <div className="grid grid-cols-4 gap-4">
                {vehicle.images.map((img, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveImageIndex(i)}
                    className={cn(
                      "aspect-square rounded-2xl overflow-hidden bg-slate-200 cursor-pointer transition-all duration-300 border-2",
                      activeImageIndex === i ? "border-primary scale-95 shadow-inner" : "border-transparent hover:border-primary/30"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Lightbox Dialog */}
          <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none rounded-3xl overflow-hidden flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    src={vehicle.images[activeImageIndex]}
                    alt={vehicle.title}
                    className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>

                {/* Navigation Controls */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white pointer-events-auto backdrop-blur-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === 0 ? vehicle.images.length - 1 : prev - 1));
                    }}
                  >
                    <ChevronLeft size={32} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white pointer-events-auto backdrop-blur-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === vehicle.images.length - 1 ? 0 : prev + 1));
                    }}
                  >
                    <ChevronRight size={32} />
                  </Button>
                </div>

                {/* Thumbnail Strip in Lightbox */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 p-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
                  {vehicle.images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={cn(
                        "w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all border-2",
                        activeImageIndex === i ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>

                {/* Close Button */}
                <DialogClose className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors">
                  <X size={24} />
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>

          {/* Title & Price */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  {vehicle.isVerified && (
                    <Badge className="bg-green-500 text-white border-none">Verified Listing</Badge>
                  )}
                  <Badge variant="outline" className="border-primary text-primary">{vehicle.brand}</Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">{vehicle.title}</h1>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin size={18} />
                  <span>{vehicle.city}, {vehicle.state}</span>
                </div>
              </div>
              <div className="text-4xl font-black text-primary">
                ₹{vehicle.price.toLocaleString()}
              </div>
            </div>
          </section>

          <Separator />

          {/* Specifications Grid */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {specs.map((spec, i) => {
                const Icon = spec.icon;
                return (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-1">
                    <div className="text-slate-400 flex items-center gap-2">
                      <Icon size={16} />
                      <span className="text-xs font-medium uppercase tracking-wider">{spec.label}</span>
                    </div>
                    <div className="font-bold capitalize">{spec.value}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Description */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Description</h2>
            <p className="text-slate-600 leading-relaxed bg-white p-6 rounded-3xl border border-slate-100">
              {vehicle.description}
            </p>
          </section>
        </div>

        {/* Right Column: Seller Info & Actions */}
        <div className="space-y-6">
          {/* Seller Card */}
          <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden">
            <CardContent className="p-6 space-y-6">
              {dealer ? (
                <Link to={`/dealer/${dealer.id}`} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary group-hover:bg-primary/10 transition-colors">
                    {dealer.shopName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{dealer.shopName}</h3>
                      {dealer.isVerified && (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 flex items-center gap-1 px-2 py-0 h-5">
                          <ShieldCheck size={12} className="fill-green-600 text-white" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Verified Dealer</span>
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                      <span>★ {dealer.rating}</span>
                      <span className="text-slate-400 font-normal">({dealer.totalReviews} reviews)</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary">
                    S
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Private Seller</h3>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                      <span>★ 4.0</span>
                      <span className="text-slate-400 font-normal">(10 reviews)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {dealer ? (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Phone Number</p>
                      <a 
                        href={`tel:${dealer.phone}`} 
                        className="text-lg font-bold text-primary hover:underline flex items-center gap-2"
                      >
                        <Phone size={18} />
                        {dealer.phone}
                      </a>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-slate-200">Dealer</Badge>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase">Phone Number</p>
                      <a 
                        href="tel:+919999999999" 
                        className="text-lg font-bold text-primary hover:underline flex items-center gap-2"
                      >
                        <Phone size={18} />
                        +91 99999 99999
                      </a>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-slate-200">Private</Badge>
                  </div>
                )}

                <a 
                  href={dealer ? `tel:${dealer.phone}` : "tel:+919999999999"} 
                  className="block w-full"
                  onClick={handleContactSeller}
                >
                  <Button className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl text-lg font-bold flex gap-2">
                    <Phone size={20} /> Call Seller
                  </Button>
                </a>
                <Button 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl text-lg font-bold flex gap-2 border-slate-200"
                  onClick={handleContactSeller}
                >
                  <MessageSquare size={20} /> Chat Now
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <span>Responds within 2 hours</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  {dealer ? (
                    <Link to={`/dealer/${dealer.id}`} className="hover:text-primary transition-colors underline underline-offset-4 decoration-slate-200">
                      {dealer.address}, {dealer.city}
                    </Link>
                  ) : (
                    <span>{vehicle.city}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Tips */}
          <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-3">
            <h4 className="font-bold text-blue-900 flex items-center gap-2">
              <ShieldCheck size={18} /> Safety Tips
            </h4>
            <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4">
              <li>Meet the seller at a public place</li>
              <li>Check the vehicle documents thoroughly</li>
              <li>Don't pay in advance without seeing the vehicle</li>
              <li>Take a test drive before finalizing</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Similar Vehicles Section */}
      {similarVehicles.length > 0 && (
        <section className="space-y-8 pt-12 border-t border-slate-100">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Similar Vehicles</h2>
              <p className="text-slate-500">Handpicked alternatives based on your current view.</p>
            </div>
            <Link 
              to={`/search?q=${vehicle.brand}`} 
              className="group flex items-center gap-1 text-primary font-bold hover:text-primary/80 transition-colors"
            >
              View All {vehicle.brand}
              <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarVehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default VehicleDetail;
