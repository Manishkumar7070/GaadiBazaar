import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Info, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  EyeOff,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types';

interface Hotspot {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  title: string;
  description: string;
  category: 'INFOTAINMENT' | 'COMFORT' | 'SAFETY' | 'PERFORMANCE' | 'EXTERIOR' | 'LIGHTING' | 'WHEELS';
}

interface TourView {
  id: string;
  name: string;
  type: 'exterior' | 'interior';
  subtitle: string;
  image: string;
  hotspots: Hotspot[];
}

interface VirtualTourProps {
  vehicle: Vehicle;
}

export const VirtualTour: React.FC<VirtualTourProps> = ({ vehicle }) => {
  const [activeTab, setActiveTab] = useState<'exterior' | 'interior'>('exterior');
  const [activeViewIndex, setActiveViewIndex] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [showHotspots, setShowHotspots] = useState(true);

  // Swipe states for mobile devices
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Fallback high quality premium interior/exterior images if the vehicle doesn't have metadata images
  const ext1 = vehicle.imageMetadata?.exterior || vehicle.images[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200';
  const ext2 = vehicle.imageMetadata?.tires || vehicle.images[2] || vehicle.images[0] || 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200';
  const int1 = vehicle.imageMetadata?.interior || vehicle.images[1] || vehicle.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200';
  const int2 = vehicle.imageMetadata?.engine || vehicle.images[3] || vehicle.images[1] || vehicle.images[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200';

  const tourViews: TourView[] = [
    {
      id: 'ext-front',
      name: 'Exterior Front View',
      type: 'exterior',
      subtitle: 'Premium Aerodynamic Signature',
      image: ext1,
      hotspots: [
        {
          id: 'ext-front-grille',
          x: 50,
          y: 65,
          title: 'Signature Chrome Grille',
          description: `Aerodynamically tuned front intake system designed to optimize cooling parameters for this ${vehicle.brand} ${vehicle.model}'s high performance engine while retaining an elegant stance.`,
          category: 'EXTERIOR'
        },
        {
          id: 'ext-front-lighting',
          x: 22,
          y: 54,
          title: 'Adaptive Smart LED Headlights',
          description: 'High pressure dual-projection headlights featuring signature daytime running lights (DRLs) and automatic leveling beams that adapt dynamically based on oncoming illumination variables.',
          category: 'LIGHTING'
        },
        {
          id: 'ext-front-sensor',
          x: 48,
          y: 84,
          title: 'ADAS Front Radar Sensor',
          description: 'Intelligent millimetric-wave radar array providing autonomous active-braking, adaptive cruise-control adjustments, and collision mitigation metrics.',
          category: 'SAFETY'
        }
      ]
    },
    {
      id: 'ext-rear',
      name: 'Side & Wheel Profiles',
      type: 'exterior',
      subtitle: 'Dynamic Alloy Setup & Aesthetics',
      image: ext2,
      hotspots: [
        {
          id: 'ext-rear-wheel',
          x: 32,
          y: 72,
          title: 'Machined Lightweight Alloys',
          description: 'Custom-designed dual-tone compound wheels configured with anti-vibration balancing weights to ensure low rolling resistance and high speed tranquility.',
          category: 'WHEELS'
        },
        {
          id: 'ext-rear-mirror',
          x: 18,
          y: 44,
          title: 'Heated Electric Side Mirrors',
          description: 'Power-folding aerodynamic mirrors equipped with smart heating element defrost lines, blindspot detection warnings, and integrated directional indicators.',
          category: 'EXTERIOR'
        },
        {
          id: 'ext-rear-suspension',
          x: 82,
          y: 68,
          title: 'Stiff Tuned Rear Suspension',
          description: 'Dual-wishbone independent suspension layout tuned to deliver maximum stability during sharp high-speed cornering transitions.',
          category: 'PERFORMANCE'
        }
      ]
    },
    {
      id: 'int-dashboard',
      name: 'Cabin Driver Cockpit',
      type: 'interior',
      subtitle: 'Ergonomic Driving Command Center',
      image: int1,
      hotspots: [
        {
          id: 'int-dash-steering',
          x: 28,
          y: 56,
          title: 'Premium Wrapped Steering',
          description: 'Orthopedic premium leather multi-spoke wheel with tactile scroll buttons, integrated voice helper triggers, and ergonomic high-grade shifting paddles.',
          category: 'COMFORT'
        },
        {
          id: 'int-dash-infotainment',
          x: 52,
          y: 36,
          title: 'Smart Floating HD Infotainment',
          description: 'Ultra-responsive touch screen loaded with localized offline satellite navigation maps, wireless Android Auto, Apple CarPlay, and comprehensive car audio settings.',
          category: 'INFOTAINMENT'
        },
        {
          id: 'int-dash-charging',
          x: 50,
          y: 68,
          title: 'Wireless Fast Charging Pad',
          description: 'Standard smart qi-protocol wireless charging pad located in the center dock featuring temperature moderation ventilation.',
          category: 'COMFORT'
        }
      ]
    },
    {
      id: 'int-cabin',
      name: 'Premium Passenger Comfort',
      type: 'interior',
      subtitle: 'Luxury Cabin Space & Ventilation',
      image: int2,
      hotspots: [
        {
          id: 'int-cabin-seat',
          x: 32,
          y: 62,
          title: 'Ventilated Orthoid Bucket Seats',
          description: 'Perforated plush seating offering active cool-air ventilation, ergonomic lumbar inflation support, and multi-profile electronic recall memory.',
          category: 'COMFORT'
        },
        {
          id: 'int-cabin-ac',
          x: 52,
          y: 50,
          title: 'Dual-Zone Air Purification System',
          description: 'Dual climate micro-vents equipped with specialized PM2.5 activated carbon filters maintaining clean refreshing interior air quality constantly.',
          category: 'SAFETY'
        },
        {
          id: 'int-cabin-roof',
          x: 48,
          y: 18,
          title: 'Panoramic Glass Sunroof',
          description: 'Large thermal-insulated tint glass sunroof opening with a single fluid touch to create a spacious, sun-lit atmosphere inside.',
          category: 'EXTERIOR'
        }
      ]
    }
  ];

  // Filter tourViews to only the active categories (exterior / interior)
  const filteredViews = tourViews.filter(v => v.type === activeTab);
  const currentView = filteredViews[activeViewIndex] || filteredViews[0];

  const handleTabChange = (tab: 'exterior' | 'interior') => {
    setActiveTab(tab);
    setActiveViewIndex(0);
    setSelectedHotspot(null);
  };

  const handleNextView = () => {
    setSelectedHotspot(null);
    setActiveViewIndex(prev => (prev + 1) % filteredViews.length);
  };

  const handlePrevView = () => {
    setSelectedHotspot(null);
    setActiveViewIndex(prev => (prev - 1 + filteredViews.length) % filteredViews.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextView();
    } else if (isRightSwipe) {
      handlePrevView();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <section id="virtual-tour-section" className="bg-slate-950 rounded-3xl md:rounded-[3rem] p-4 sm:p-6 md:p-10 text-white relative overflow-hidden shadow-2xl border border-slate-900">
      {/* Decorative BG Lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary text-secondary px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} /> 3D VIRTUAL SHOWROOM EXPERIENCE
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black italic tracking-tight uppercase leading-none">
            Interactive <span className="text-primary normal-case not-italic">Virtual Tour</span>
          </h2>
          <p className="text-slate-400 font-medium text-xs uppercase tracking-wider">
            Explore interior design details, engine metrics, and key exterior specifications
          </p>
        </div>

        {/* View togglers */}
        <div className="flex w-full sm:w-auto bg-slate-900/90 p-1 rounded-2xl border border-slate-800 self-start md:self-center">
          <button
            onClick={() => handleTabChange('exterior')}
            className={cn(
              "flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              activeTab === 'exterior' 
                ? "bg-primary text-slate-950 shadow-md transform scale-105" 
                : "text-slate-400 hover:text-white"
            )}
          >
            Exterior Showcase
          </button>
          <button
            onClick={() => handleTabChange('interior')}
            className={cn(
              "flex-1 sm:flex-initial px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
              activeTab === 'interior' 
                ? "bg-primary text-slate-950 shadow-md transform scale-105" 
                : "text-slate-400 hover:text-white"
            )}
          >
            Cabin & Interior
          </button>
        </div>
      </div>

      {/* Core Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
        
        {/* Interactive Viewport (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl md:rounded-[2rem] overflow-hidden bg-slate-900 border-2 md:border-4 border-slate-900 shadow-2xl select-none group"
          >
            
            {/* View Image */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentView.id}
                src={currentView.image}
                alt={currentView.name}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            {/* Dark vignette gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

            {/* Title / Helper Labels inside viewport */}
            <div className="absolute top-5 left-5 pointer-events-none">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{currentView.subtitle}</p>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">{currentView.name}</h3>
            </div>

            {/* Hide/Show hotspots toggle */}
            <div className="absolute top-5 right-5 z-25">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHotspots(!showHotspots)}
                className="bg-black/45 hover:bg-black/75 text-white/90 rounded-xl px-3 py-1.5 h-8 border border-white/10 text-[10px] uppercase font-bold tracking-widest"
              >
                {showHotspots ? (
                  <>
                    <EyeOff size={12} className="mr-1.5 text-primary" /> Hide Spots
                  </>
                ) : (
                  <>
                    <Eye size={12} className="mr-1.5 text-slate-400" /> Show Spots
                  </>
                )}
              </Button>
            </div>

            {/* Hotspots layer */}
            {showHotspots && (
              <AnimatePresence>
                {currentView.hotspots.map((spot) => {
                  const isActive = selectedHotspot?.id === spot.id;
                  return (
                    <div
                      key={spot.id}
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                    >
                      {/* Pulse rings */}
                      <button
                        onClick={() => setSelectedHotspot(isActive ? null : spot)}
                        className="relative group/btn flex items-center justify-center cursor-pointer"
                      >
                        <span className={cn(
                          "absolute inline-flex rounded-full h-8 w-8 animate-ping opacity-60 transition-colors",
                          isActive ? "bg-primary" : "bg-white"
                        )} />
                        
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-2xl transition-all duration-300 transform rounded-full",
                          isActive 
                            ? "bg-primary border-primary scale-125 text-slate-950" 
                            : "bg-slate-950/80 border-white hover:border-primary hover:scale-115 text-white"
                        )}>
                          <Plus size={12} className={cn("transition-transform duration-300", isActive ? "rotate-45" : "")} />
                        </div>
                      </button>

                      {/* Tooltip Popup box */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10, x: -100 }}
                            animate={{ opacity: 1, scale: 1, y: -90, x: -110 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="absolute z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/60 p-4 rounded-2xl w-60 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-left hidden md:block"
                            style={{ bottom: '100%' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] font-black text-primary tracking-widest uppercase">
                                {spot.category}
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedHotspot(null);
                                }}
                                className="text-slate-400 hover:text-white cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <h4 className="font-extrabold text-xs text-white uppercase tracking-tight mb-1">{spot.title}</h4>
                            <p className="text-[10px] text-slate-300 font-medium leading-relaxed">{spot.description}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </AnimatePresence>
            )}

            {/* Left and Right Carousel Control Arrows */}
            {filteredViews.length > 1 && (
              <>
                <button
                  onClick={handlePrevView}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md border border-white/5 transition-all outline-none"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextView}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-md border border-white/5 transition-all outline-none"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Carousel navigation slide dots */}
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex gap-2 items-center">
              {filteredViews.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedHotspot(null);
                    setActiveViewIndex(idx);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all cursor-pointer",
                    activeViewIndex === idx ? "w-6 bg-primary" : "w-1.5 bg-slate-500 hover:bg-white"
                  )}
                />
              ))}
            </div>
            
          </div>
          
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold px-2">
            <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-primary" /> Pulse buttons indicate active hotspots. Tap to investigate.</span>
            <button
              onClick={() => setSelectedHotspot(null)}
              className="text-[10px] tracking-widest font-black uppercase text-slate-400 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} /> Clear Focus
            </button>
          </div>
        </div>

        {/* Info detail and checklist panel (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
          <div className="bg-slate-900/60 border border-slate-900 rounded-[2rem] p-6 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase font-black text-[9px] tracking-widest">
                  Annotation Tour
                </Badge>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  {currentView.hotspots.length} Spot Specifiers
                </span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase text-white tracking-tight">{currentView.name}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Select a feature from the checklist below to focus and inspect the technical installation specifications live on the preview canvas.
                </p>
              </div>

              {/* Hotspots checklist selection list */}
              <div className="space-y-2.5 pt-2 max-h-[220px] overflow-y-auto pr-1">
                {currentView.hotspots.map((spot) => {
                  const isSelected = selectedHotspot?.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      onClick={() => setSelectedHotspot(isSelected ? null : spot)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between group/item cursor-pointer",
                        isSelected 
                          ? "bg-slate-800 border-primary shadow-lg" 
                          : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                      )}
                    >
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black text-slate-500 group-hover/item:text-primary transition-colors uppercase block">
                          {spot.category}
                        </span>
                        <span className={cn(
                          "font-bold uppercase tracking-tight",
                          isSelected ? "text-primary" : "text-white"
                        )}>{spot.title}</span>
                      </div>
                      <ArrowRight size={14} className={cn(
                        "transition-all",
                        isSelected ? "text-primary translate-x-1" : "text-slate-500 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5"
                      )} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom active feedback box */}
            <div className="pt-4 border-t border-slate-800/80">
              <AnimatePresence mode="wait">
                {selectedHotspot ? (
                  <motion.div
                    key={selectedHotspot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2 bg-[#1B301B]/20 p-4 rounded-2xl border border-primary/20"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-primary tracking-widest uppercase">
                        {selectedHotspot.category} INSPECTION
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-white uppercase tracking-tight">{selectedHotspot.title}</h4>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                      {selectedHotspot.description}
                    </p>
                  </motion.div>
                ) : (
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center py-7 text-slate-500">
                    <Info size={18} className="mx-auto mb-2 text-slate-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider block">No Specification Selected</span>
                    <span className="text-[9px] text-slate-600 mt-0.5 block">Click any pulse beacon on the car to inspect specs</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
