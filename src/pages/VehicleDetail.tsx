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
  Activity,
  Store,
  QrCode,
  Printer,
  ExternalLink,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { jsPDF } from 'jspdf';
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
import PricePrediction from '@/features/vehicles/PricePrediction';
import { EMICalculator } from '@/components/EMICalculator';
import { VirtualTour } from '@/components/VirtualTour';
import { RealWorldMileage } from '@/components/RealWorldMileage';
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
  const [zoomLevel, setZoomLevel] = useState<number>(3.5);
  const [activeAnalysis, setActiveAnalysis] = useState<'paint' | 'interior' | 'none'>('paint');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
    setCursorPosition({ x: e.clientX - left, y: e.clientY - top });
  };

  const isInterior = src.toLowerCase().includes('interior') || alt.toLowerCase().includes('interior');
  const isEngine = src.toLowerCase().includes('engine') || alt.toLowerCase().includes('engine');

  const hotspots = isInterior 
    ? [
        { x: 38, y: 48, label: "Seat Leather Stitch Check", detail: "Verified premium double-stitched seams. No micro-tears detected." },
        { x: 68, y: 38, label: "Grip & Control Texture Check", detail: "Premium non-slip matte texture intact. Minimal wear signature." }
      ]
    : (isEngine 
      ? [
          { x: 52, y: 42, label: "Tappet Gasket Integrity", detail: "Dry head gasket seals verified. Zero oil seepage detected." },
          { x: 32, y: 58, label: "Fluid Reservoir Clarity", detail: "Brake and steering hydraulic fluid transparent and fully within operating lines." }
        ]
      : [
          { x: 26, y: 54, label: "Paint Coat Diagnostics", detail: "Uniform OEM factory coat thickness. Calibrated: 112µm (No repainting detected)." },
          { x: 58, y: 46, label: "Panel Edge Clear-Coat", detail: "Bevel gloss index: 96 GU. Original clear lacquer layer fully preserved." }
        ]);

  return (
    <div className="flex flex-col h-full w-full select-none justify-between relative bg-slate-900 group/suite">
      
      {/* Upper floating instruction label */}
      <div className="absolute top-5 left-5 z-20 hidden md:flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-full border border-primary/20 text-[10px] text-white">
        <span className="w-2 h-2 bg-primary rounded-full animate-ping shrink-0" />
        <span className="font-extrabold uppercase tracking-widest text-[#F25C1D]">🔬 Zoom Scan Suite Active: Hover to inspect paint & interior condition</span>
      </div>

      {/* Main Image Viewing Area with magnifying glass implementation */}
      <div
        className="relative flex-1 w-full min-h-0 overflow-hidden cursor-zoom-in group/canvas"
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
            showMagnifier ? "scale-[1.03]" : "scale-100"
          )}
          referrerPolicy="no-referrer"
        />

        {/* Laser level scanning wire-line indicator */}
        {showMagnifier && activeAnalysis !== 'none' && (
          <div 
            className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#F25C1D] to-transparent shadow-[0_0_8px_rgba(242,92,29,0.5)] pointer-events-none transition-all duration-75" 
            style={{ top: `${position.y}%` }}
          />
        )}

        {/* Hotspots overlay points */}
        {!showMagnifier && hotspots.map((spot, i) => (
          <div
            key={i}
            className="absolute z-20 group/spot pointer-events-auto hidden md:block"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          >
            <div className="relative -m-3 p-3 cursor-help">
              <span className="absolute inline-flex h-7 w-7 rounded-full bg-[#F25C1D]/30 animate-ping opacity-75" />
              <span className="relative flex rounded-full h-5 w-5 bg-[#F25C1D] border-2 border-white shadow-xl items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-950" />
              </span>
              
              {/* Dynamic hotspot detail card shown on hovering the dot */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-8 w-56 bg-slate-950/95 backdrop-blur-md text-white border border-slate-800 rounded-2xl p-3.5 shadow-2xl opacity-0 scale-95 group-hover/spot:opacity-100 group-hover/spot:scale-100 transition-all pointer-events-none duration-300">
                <p className="text-[10px] font-black uppercase text-[#F25C1D] tracking-wider">{spot.label}</p>
                <p className="text-[9px] text-slate-300 mt-1.5 uppercase font-bold leading-normal">{spot.detail}</p>
              </div>
            </div>
          </div>
        ))}
        
        {/* The high-precision Magnifying Glass Circle */}
        {showMagnifier && (
          <div
            className="absolute pointer-events-none border-4 border-slate-950/90 shadow-2xl rounded-full overflow-hidden hidden md:block"
            style={{
              left: `${cursorPosition.x - 110}px`,
              top: `${cursorPosition.y - 110}px`,
              width: '220px',
              height: '220px',
              backgroundImage: `url(${src})`,
              backgroundPosition: `${position.x}% ${position.y}%`,
              backgroundSize: `${zoomLevel * 100}%`,
              zIndex: 30,
            }}
          >
            {/* Target Reticle overlay */}
            <div className="absolute inset-0 border border-white/10 flex items-center justify-center">
              <div className="w-12 h-12 border-r border-l border-white/20 rounded-full" />
              <div className="w-12 h-12 border-t border-b border-white/20 rounded-full absolute" />
              <div className="w-1.5 h-1.5 bg-[#F25C1D] rounded-full absolute shadow-[0_0_6px_#F25C1D]" />
            </div>

            {/* Dynamic diagnostic overlay inside magnifying scope */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md text-white border border-slate-800 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1">
              <span>{zoomLevel.toFixed(1)}X SPECULAR LENS</span>
              {activeAnalysis === 'paint' && <span className="text-primary">• COAT-OK</span>}
              {activeAnalysis === 'interior' && <span className="text-secondary">• CAB-OK</span>}
            </div>
          </div>
        )}

        {/* Hover Zoom Icon overlay */}
        <div className="absolute bottom-5 right-5 bg-slate-950/90 text-white backdrop-blur-sm p-3.5 rounded-2xl shadow-xl opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-300 flex items-center gap-2 z-10">
          <Maximize2 size={16} className="text-[#F25C1D] animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest leading-none">Inspect Paint / Stitching</span>
        </div>
      </div>

      {/* Calibration Controls bar */}
      <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none relative z-20">
        
        {/* Toggle A: Zoom Factor */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calibration Power:</span>
          <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            {[2.0, 3.5, 5.0, 6.5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(level);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  zoomLevel === level
                    ? "bg-[#F25C1D] text-white font-[1000] shadow-md shadow-orange-600/30"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {level.toFixed(1)}x
              </button>
            ))}
          </div>
        </div>

        {/* Toggle B: HUD scan modes */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Scanner HUD:</span>
          <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            {[
              { id: 'paint', label: 'Paint (µm) Scan' },
              { id: 'interior', label: 'Upholstery Audit' },
              { id: 'none', label: 'No Overlays' }
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAnalysis(mode.id as any);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeAnalysis === mode.id
                    ? "bg-white text-slate-950 font-[1000] shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

import { bookingService } from '@/services/booking.service';
import { BookingModal } from '@/components/BookingModal';

const VehicleDetail = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToComparison, removeFromComparison, isVehicleSelected } = useComparison();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  // --- Main Page Carousel Touch Swipe States & Handlers ---
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

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
      setActiveImageIndex((prev) => (prev < (vehicle?.images?.length || 1) - 1 ? prev + 1 : 0));
    } else if (isRightSwipe) {
      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : (vehicle?.images?.length || 1) - 1));
    }
    
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // --- Lightbox Interactive Zoom & Pan States & Handlers ---
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState<number | null>(null);

  // Reset zoom scale and pan offset whenever image changes or lightbox opens/closes
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [activeImageIndex, isLightboxOpen]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.5);
    }
  };

  // Drag / Pan mechanics for Lightbox zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || scale <= 1) return;
    const newX = e.clientX - panStart.x;
    const newY = e.clientY - panStart.y;
    
    // Bounds check to avoid infinite panning out of screen view
    const maxPanX = (scale - 1) * 350;
    const maxPanY = (scale - 1) * 200;
    setOffset({
      x: Math.max(Math.min(newX, maxPanX), -maxPanX),
      y: Math.max(Math.min(newY, maxPanY), -maxPanY)
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  // Touch controls for Pinch-to-Zoom and Pan on mobile screens
  const handleLightboxTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialDistance(dist);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleLightboxTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / initialDistance;
      setScale((prev) => {
        const next = Math.max(1, Math.min(prev * factor, 4));
        if (next === 1) {
          setOffset({ x: 0, y: 0 });
        }
        return next;
      });
      setInitialDistance(dist);
    } else if (e.touches.length === 1 && isPanning && scale > 1) {
      const newX = e.touches[0].clientX - panStart.x;
      const newY = e.touches[0].clientY - panStart.y;
      
      const maxPanX = (scale - 1) * 350;
      const maxPanY = (scale - 1) * 200;
      setOffset({
        x: Math.max(Math.min(newX, maxPanX), -maxPanX),
        y: Math.max(Math.min(newY, maxPanY), -maxPanY)
      });
    }
  };

  const handleLightboxTouchEnd = () => {
    setIsPanning(false);
    setInitialDistance(null);
  };
  
  const [similarVehicles, setSimilarVehicles] = useState<Vehicle[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  
  const checkBookingStatus = async () => {
    if (user && id) {
      const booked = await bookingService.isVehicleBookedByUser(id, user.id);
      setIsBooked(booked);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        await checkBookingStatus();
        
        // Fetch specific vehicle first
        const v = await vehicleService.fetchVehicleById(id);
        
        if (v) {
          setVehicle(v);
          
          // Fetch similar vehicles in parallel
          const [verifiedVehicles, s] = await Promise.all([
            vehicleService.fetchVehicles({ verificationStatus: 'verified' }),
            v.shopId ? shopService.fetchShopById(v.shopId) : Promise.resolve(null)
          ]);
          
          setAllVehicles(verifiedVehicles);
          setShop(s);
          setSimilarVehicles(verifiedVehicles.filter(item => item.id !== v.id && (item.brand === v.brand || item.vehicleType === v.vehicleType)).slice(0, 4));
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
    
    if (isBooked) {
      // Already booked, show contact
    } else {
      setIsBookingModalOpen(true);
    }
  };

  const handlePrintDealerFlyer = async () => {
    if (!vehicle) return;
    const regNum = vehicle.registrationNumber || 'BR-01-AZ-9999';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/car-health-score?reg=${regNum}`)}&color=0f172a`;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Add branding header background (deep dark blue/slate)
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 50, 'F');
        
        // Header Text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(26);
        doc.setFont('Helvetica', 'Bold');
        doc.text('ASONE TRUST VERIFIED', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'Normal');
        doc.text('OFFICIAL DEALERSHIP SHOWROOM WINDSHIELD FLYER', 105, 28, { align: 'center' });
        doc.setTextColor(242, 92, 29); // primary color accent
        doc.setFont('Helvetica', 'Bold');
        doc.text('SCAN TO REVEAL VERIFIED VEHICLE HEALTH REGISTRY & CIBIL SCORE', 105, 36, { align: 'center' });
        
        // Main Car display box
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, 60, 180, 50, 4, 4, 'FD');
        
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(18);
        doc.text(`${vehicle.year} ${vehicle.brand}`, 25, 73);
        doc.setFontSize(22);
        doc.text(`${vehicle.title}`, 25, 84);
        
        // Quick features row
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont('Helvetica', 'Normal');
        doc.text(`Fuel Type: ${vehicle.fuelType}  |  Ownership: ${vehicle.ownership} Owner  |  City: ${vehicle.city}`, 25, 93);
        doc.text(`Current Odometer Reading: ${vehicle.kilometersDriven.toLocaleString()} kms`, 25, 99);
        
        // Big Registration Number Accent Badge
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(125, 70, 60, 24, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'Bold');
        doc.text('REGISTRATION NO.', 155, 76, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`${regNum}`, 155, 86, { align: 'center' });
        
        // QR Code Box
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(55, 125, 100, 100, 4, 4, 'D');
        doc.addImage(base64data, 'PNG', 60, 130, 90, 90);
        
        // Instructional footer text
        doc.setFont('Helvetica', 'Bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text('SCAN ME WITH YOUR PHONE CAMERA', 105, 242, { align: 'center' });
        
        doc.setFont('Helvetica', 'Normal');
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Instantly view transparent database entries of engine performance indices,', 105, 250, { align: 'center' });
        doc.text('active mechanical maintenance logs, and financial resale multiplier evaluations.', 105, 255, { align: 'center' });
        
        // Bottom badge rule
        doc.setFillColor(242, 92, 29);
        doc.rect(15, 270, 180, 2, 'F');
        
        doc.save(`Windshield_Flyer_QR_${regNum}.pdf`);
      };
      
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error(err);
      alert('Error building high-definition flyer. Please verify connectivity.');
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
    { icon: Calendar, label: 'Reg. Year', value: vehicle.year },
    { icon: Fuel, label: 'Fuel Type', value: vehicle.fuelType },
    { icon: Gauge, label: 'KM Driven', value: `${vehicle.kilometersDriven.toLocaleString()} km` },
    { icon: Settings, label: 'Transmission', value: vehicle.transmission },
    { icon: Activity, label: 'Engine', value: '1198 cc' },
    { icon: User, label: 'Ownership', value: vehicle.ownership },
    { icon: Calendar, label: 'Make Year', value: vehicle.year },
    { icon: Palette, label: 'Color', value: vehicle.color || 'N/A' },
    { icon: ShieldCheck, label: 'Assembly', value: vehicle.assemblyType || 'Local' },
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

      {/* Service Advantage Banner */}
      <div className="bg-[#1B301B] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
          <Wrench size={200} className="text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary text-secondary px-4 py-1.5 rounded-full text-[10px] font-[1000] uppercase tracking-[0.2em]">
              EXCLUSIVE DEALER PACKAGE
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Get 5 Years of <br />
              <span className="text-primary italic">Peace of Mind.</span>
            </h3>
            <p className="text-white/70 text-base md:text-lg font-medium leading-relaxed max-w-xl">
              Professional mechanic visits to your doorstep every month. Zero cost to you. <br />
              <span className="text-white font-bold">Estimated value: ₹5,00,000</span>
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-w-[240px]">
             <span className="text-5xl font-black text-primary tracking-tighter">FREE</span>
             <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] mt-2">5-Year Service</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Gallery Section */}
          <div className="space-y-6">
            <div 
              className="relative aspect-[16/9] rounded-2xl md:rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl group border-2 md:border-[1.5rem] border-white cursor-pointer select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-full h-full relative" onClick={() => setIsLightboxOpen(true)}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <Magnifier 
                      src={vehicle.images[activeImageIndex]} 
                      alt={`${vehicle.brand} ${vehicle.title}`}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Touch-friendly left/right slide arrows */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(prev => prev > 0 ? prev - 1 : vehicle.images.length - 1);
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-slate-950/70 hover:bg-primary hover:text-white text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center z-10 shadow-lg border border-white/10"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(prev => prev < vehicle.images.length - 1 ? prev + 1 : 0);
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-slate-950/70 hover:bg-primary hover:text-white text-white rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center z-10 shadow-lg border border-white/10"
              >
                <ChevronRight size={24} />
              </button>

              {isSold && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-none">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/10 border-4 border-white/50 px-12 py-6 rounded-[2.5rem] backdrop-blur-md rotate-[-5deg] shadow-2xl"
                  >
                    <span className="text-white text-6xl font-[1000] tracking-widest uppercase italic">Sold Out</span>
                  </motion.div>
                </div>
              )}

              <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-20 pointer-events-none">
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

            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {vehicle.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={cn(
                    "relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-300 transform",
                    activeImageIndex === i ? "ring-2 md:ring-4 ring-primary ring-offset-2 md:ring-offset-4 scale-95" : "opacity-60 hover:opacity-100 hover:scale-105"
                  )}
                >
                  <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Virtual Tour Mode */}
          <VirtualTour vehicle={vehicle} />

          {/* Great Things */}
          <section className="bg-slate-900 rounded-3xl md:rounded-[3.5rem] p-6 md:p-12 text-white overflow-hidden relative">
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
                <div key={i} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 hover:border-primary/20 transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
                      <div className="aspect-[4/3] rounded-2xl md:rounded-[2rem] overflow-hidden bg-slate-100 border-2 md:border-4 border-white shadow-lg group-hover:shadow-2xl transition-all relative">
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

          {/* Vehicle History Integration */}
          <section className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200/50 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 h-6 uppercase font-black text-[10px] tracking-widest">History</Badge>
                  <h2 className="text-xl font-black uppercase tracking-widest">Ownership & Service</h2>
                </div>
                <p className="text-slate-500 text-sm font-medium">Verify insurance, accidental history, and service records.</p>
              </div>
              <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-100 flex gap-2">
                <FileText size={16} /> Request RC/RTO Details
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="font-bold text-sm uppercase">Insurance</h4>
                <p className="text-[10px] font-black text-green-600 uppercase">Valid Status</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Exp: Dec 2024</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                  <Activity size={20} />
                </div>
                <h4 className="font-bold text-sm uppercase">Accidents</h4>
                <p className="text-[10px] font-black text-green-600 uppercase">Clean Record</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">No major claims</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                  <Wrench size={20} />
                </div>
                <h4 className="font-bold text-sm uppercase">Service</h4>
                <p className="text-[10px] font-black text-slate-900 uppercase">Authorized</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Maintained at Honda</p>
              </div>
            </div>
          </section>

          <VehicleAIInsights vehicle={vehicle} />
          <PriceComparisonSection vehicle={vehicle} allVehicles={allVehicles} />

          <RealWorldMileage vehicle={vehicle} />

          <EMICalculator vehiclePrice={vehicle.price} vehicle={vehicle} />

          {/* Seller Showroom Details - Revealed after booking */}
          {isBooked && shop && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Store size={150} />
              </div>
              
              <div className="relative z-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <Badge className="bg-primary text-secondary border-none px-4 py-1 rounded-full uppercase text-[10px] font-black tracking-widest">
                      Showroom Access Unlocked
                    </Badge>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Visit {shop.name}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                      <MapPin size={14} className="text-primary" /> {shop.address}, {shop.city}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <a href={`tel:${shop.phone}`}>
                      <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-14 px-8 font-black flex gap-2">
                        <Phone size={20} /> Call Showroom
                      </Button>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary">About the Showroom</h4>
                      <p className="text-slate-300 leading-relaxed font-medium">
                        {shop.description}
                      </p>
                      <div className="flex items-center gap-6 pt-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Business Hours</span>
                           <span className="text-sm font-bold">{shop.businessHours || '10:00 AM - 08:00 PM'}</span>
                        </div>
                        <Separator orientation="vertical" className="h-8 bg-white/10" />
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Established</span>
                           <span className="text-sm font-bold">{shop.yearsInBusiness || '5+'} Years</span>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Showroom Gallery</h4>
                      <div className="grid grid-cols-3 gap-2">
                         {shop.images?.slice(0, 6).map((img, i) => (
                           <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                              <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                {shop.mapEmbedUrl && (
                  <div className="space-y-4 pt-4">
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary">Exact Location</h4>
                    <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-white/10">
                      <iframe 
                        src={shop.mapEmbedUrl}
                        className="w-full h-full border-none"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Shop Location"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}

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
            <PricePrediction vehicle={vehicle} />
            
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  {vehicle.verificationStatus === 'verified' && (
                    <VerifiedBadge status={vehicle.verificationStatus} type="vehicle" />
                  )}
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
                    isSold ? "bg-slate-200 text-slate-500 hover:bg-slate-200 cursor-not-allowed shadow-none" : "bg-slate-900 hover:bg-slate-800 hover:scale-[1.02] active:scale-95",
                    isBooked && "bg-green-600 hover:bg-green-700"
                  )}
                  onClick={isSold ? undefined : handleContactSeller}
                  disabled={isSold}
                >
                  {isSold ? 'Vehicle Sold Out' : isBooked ? (shop?.phone || '+91 99999 99999') : 'Book for ₹5,000'}
                </Button>
                
                {!isBooked && !isSold && (
                  <div className="flex items-center gap-2 justify-center pt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dealer details revealed after booking</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dealer QR Scan Score Windshield Flyer Builder */}
            <Card className="rounded-[2.5rem] border-2 border-dashed border-blue-200 bg-blue-50/15 shadow-xl shadow-blue-500/5 overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-[9.5px] font-black uppercase tracking-widest">
                    <QrCode size={12} className="animate-pulse" strokeWidth={2.5} /> Dealer Dashboard Portal
                  </div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Showroom QR Flyer Generator</h3>
                  <p className="text-xs text-slate-500 font-bold leading-tight">
                    Generate and print a physical windshield flyer with a custom QR code matching this vehicle's certified Car Health Score.
                  </p>
                </div>

                {/* Showroom QR Display Panel */}
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border border-slate-200/60 shadow-inner group/qr relative overflow-hidden">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/car-health-score?reg=${vehicle.registrationNumber || 'Bihar Registry'}`)}&color=0f172a`}
                    alt="Dealer Car Health Score QR Code"
                    className="w-36 h-36 object-cover rounded-2xl border border-slate-100 p-2.5 transform group-hover/qr:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <p className="font-mono text-[9px] font-black text-slate-400 mt-3.5 tracking-widest bg-slate-50 px-3 py-1 rounded-full uppercase border border-slate-100">
                    {vehicle.registrationNumber || 'Bihar Registry'}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handlePrintDealerFlyer}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
                  >
                    <Printer size={14} /> Print Windshield Flyer PDF
                  </Button>
                  <a 
                    href={`/car-health-score?reg=${vehicle.registrationNumber || ''}`}
                    className="text-[10px] font-black text-blue-600 text-center uppercase tracking-wide hover:underline flex items-center justify-center gap-1 mt-1"
                  >
                    View Direct Health Link <ExternalLink size={10} />
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-8 space-y-6">
                {shop ? (
                  <Link to={`/dealer/${shop.id}`} className="flex items-center gap-4 group">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-bold text-primary">{shop.name[0]}</div>
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold group-hover:text-primary transition-colors">{shop.name}</h3> 
                        {shop.verificationStatus === 'verified' && (
                          <VerifiedBadge status={shop.verificationStatus} type="dealer" showLabel={false} size="sm" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold"><span>★ {shop.rating || '4.5'}</span></div>
                        <Separator orientation="vertical" className="h-2 bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{isBooked ? shop.city : `${vehicle.city} Area`}</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link to={`/seller/${vehicle.sellerId}`} className="flex items-center gap-4 group">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center font-bold group-hover:text-primary transition-colors">
                      {vehicle.sellerId[0]}
                    </div>
                    <div>
                      <h3 className="font-bold group-hover:text-primary transition-colors">Private Seller</h3>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1 text-yellow-500 text-[10px] font-bold"><span>★ 4.2</span></div>
                        <Separator orientation="vertical" className="h-2 bg-slate-200" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{vehicle.city}</p>
                      </div>
                    </div>
                  </Link>
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 flex flex-col gap-2 md:hidden">
        {!isBooked && !isSold && (
          <p className="text-[9px] font-black uppercase text-center text-slate-400 tracking-tighter">Pay ₹5,000 commitment to unlock seller contact</p>
        )}
        <Button 
          className={cn(
            "w-full h-14 rounded-2xl text-lg font-black shadow-lg",
            isSold ? "bg-slate-200 text-slate-500 hover:bg-slate-200" : isBooked ? "bg-green-600" : "bg-primary"
          )} 
          onClick={isSold ? undefined : handleContactSeller}
          disabled={isSold}
        >
          {isSold ? 'Sold Out' : isBooked ? (shop?.phone || '+91 99999 99999') : 'Book Now ₹5,000'}
        </Button>
      </div>

      {vehicle && user && (
        <BookingModal 
          isOpen={isBookingModalOpen}
          onOpenChange={setIsBookingModalOpen}
          vehicle={vehicle}
          userId={user.id}
          onSuccess={() => setIsBooked(true)}
        />
      )}

      {/* Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] p-0 bg-black/95 border-none overflow-hidden flex flex-col justify-between">
          
          {/* Top HUD with Instruction */}
          <div className="absolute top-6 left-6 z-30 flex items-center gap-3 pointer-events-none">
            <Badge className="bg-slate-900/90 backdrop-blur-md text-white font-black text-[10px] px-4 py-2 rounded-full uppercase tracking-widest border-slate-800">
              🔬 {scale > 1 ? `ZOOM LEVEL: ${scale.toFixed(1)}x` : "FULL SCREEN"}
            </Badge>
            <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {scale > 1 ? "Drag to pan the image" : "Pinch, Scroll, or Double-click to zoom"}
            </span>
          </div>

          <div 
            className={cn(
              "relative w-full h-[75vh] md:h-[80vh] flex items-center justify-center overflow-hidden select-none",
              scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
            onDoubleClick={handleDoubleClick}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImageIndex}
                src={vehicle.images[activeImageIndex]}
                alt="Fullscreen vehicle zoom"
                style={{
                  scale,
                  x: offset.x,
                  y: offset.y,
                }}
                transition={{ type: "spring", stiffness: 350, damping: 40 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-full max-h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>

            <DialogClose className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-primary hover:text-white transition-all z-30"><X size={24} /></DialogClose>
            
            {/* Nav Arrows */}
            {scale === 1 && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(prev => prev > 0 ? prev - 1 : vehicle.images.length - 1);
                  }} 
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-primary text-white rounded-full transition-all z-20"
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(prev => prev < vehicle.images.length - 1 ? prev + 1 : 0);
                  }} 
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-primary text-white rounded-full transition-all z-20"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Floating Zoom Controls HUD */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-full z-30 shadow-2xl">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                disabled={scale <= 1}
                className="p-1.5 hover:bg-white/10 text-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-[10px] font-mono font-black text-slate-300 min-w-[45px] text-center">
                {scale.toFixed(1)}x
              </span>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                disabled={scale >= 4}
                className="p-1.5 hover:bg-white/10 text-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <div className="w-[1px] h-4 bg-slate-800 mx-1" />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
                disabled={scale === 1}
                className="text-[9px] font-black uppercase tracking-widest text-[#F25C1D] px-3 py-1 hover:bg-[#F25C1D]/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Thumbnails Strip */}
          <div className="bg-black/80 p-6 flex gap-4 overflow-x-auto justify-center z-10">
            {vehicle.images.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setActiveImageIndex(i)} 
                className={cn(
                  "w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 transition-all duration-300", 
                  activeImageIndex === i ? "ring-2 ring-primary scale-95" : "opacity-40 hover:opacity-100"
                )}
              >
                <img src={img} className="w-full h-full object-cover pointer-events-none" />
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
