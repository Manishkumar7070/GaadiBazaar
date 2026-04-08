import React, { useEffect } from 'react';
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
  Rotate3d
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MOCK_VEHICLES, MOCK_DEALERS } from '@/lib/mock-data';
import { motion } from 'motion/react';
import VehicleCard from '@/components/vehicles/VehicleCard';
import ThreeSixtyViewer from '@/components/vehicles/ThreeSixtyViewer';
import { useComparison } from '@/context/ComparisonContext';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToComparison, removeFromComparison, isVehicleSelected } = useComparison();
  
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
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
            <Heart size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Images & Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery & 360 View */}
          <section className="space-y-4">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-slate-100 p-1 rounded-xl h-auto">
                  <TabsTrigger value="all" className="rounded-lg py-1.5 px-4 text-xs font-bold">All</TabsTrigger>
                  {(vehicle.exteriorImages && vehicle.exteriorImages.length > 0) && <TabsTrigger value="exterior" className="rounded-lg py-1.5 px-4 text-xs font-bold">Exterior</TabsTrigger>}
                  {(vehicle.interiorImages && vehicle.interiorImages.length > 0) && <TabsTrigger value="interior" className="rounded-lg py-1.5 px-4 text-xs font-bold">Interior</TabsTrigger>}
                  {(vehicle.threeSixtyImages && vehicle.threeSixtyImages.length > 0) && (
                    <TabsTrigger value="360" className="rounded-lg py-1.5 px-4 text-xs font-bold flex gap-1 items-center">
                      <Rotate3d size={14} /> 360°
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0 space-y-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-video rounded-[2rem] overflow-hidden bg-slate-200"
                >
                  <img 
                    src={vehicle.images[0]} 
                    alt={vehicle.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
                <div className="grid grid-cols-4 gap-4">
                  {vehicle.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-200 cursor-pointer hover:opacity-80 transition-opacity">
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              </TabsContent>

              {vehicle.exteriorImages && vehicle.exteriorImages.length > 0 && (
                <TabsContent value="exterior" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {vehicle.exteriorImages.map((img, i) => (
                      <div key={i} className="aspect-video rounded-3xl overflow-hidden bg-slate-200">
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              {vehicle.interiorImages && vehicle.interiorImages.length > 0 && (
                <TabsContent value="interior" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {vehicle.interiorImages.map((img, i) => (
                      <div key={i} className="aspect-video rounded-3xl overflow-hidden bg-slate-200">
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              {vehicle.threeSixtyImages && vehicle.threeSixtyImages.length > 0 && (
                <TabsContent value="360" className="mt-0">
                  <ThreeSixtyViewer images={vehicle.threeSixtyImages} />
                </TabsContent>
              )}
            </Tabs>
          </section>

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
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{dealer.shopName}</h3>
                    <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                      <span>★ {dealer.rating}</span>
                      <span className="text-slate-400 font-normal">({dealer.totalReviews} reviews)</span>
                    </div>
                  </div>
                  <ShieldCheck className="text-green-500" size={24} />
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
                <Button className="w-full bg-primary hover:bg-primary/90 h-14 rounded-2xl text-lg font-bold flex gap-2">
                  <Phone size={20} /> Contact Seller
                </Button>
                <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold flex gap-2 border-slate-200">
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
