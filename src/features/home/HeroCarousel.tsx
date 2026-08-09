import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Gauge, 
  IndianRupee, 
  ShieldCheck, 
  Wrench, 
  TrendingUp, 
  FileText, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Calendar, 
  Phone, 
  Clock, 
  HelpCircle, 
  Calculator, 
  Building,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BannerSlide {
  id: string;
  tag: string;
  title: string;
  description: string;
  buttonText: string;
  actionUrl: string;
  themeClass: string;
  accentColor: string;
  icon: React.ComponentType<any>;
  interactiveType: 'none' | 'mechanic-booking' | 'emi-calculator' | 'dealer-search' | 'cibil-preview';
}

const SLIDES: BannerSlide[] = [
  {
    id: 'cibil-score',
    tag: 'DYNAMIC SAFETY REPORT',
    title: 'Check Your Car CIBIL Score',
    description: 'Instantly search your vehicle registration code to evaluate live engine compression, structural safety, accident logs, and direct RTO registry blacklists with zero guesswork.',
    buttonText: 'Launch Free Health Scan',
    actionUrl: '/car-health-score',
    themeClass: 'from-[#0B0F19] via-[#0E172B] to-[#12224A] border-blue-500/20 text-white',
    accentColor: '#3b82f6',
    icon: Gauge,
    interactiveType: 'cibil-preview'
  },
  {
    id: 'budget-cars',
    tag: 'CERTIFIED DIRECT VALUE',
    title: 'Find Premium Cars Under ₹5 Lakhs',
    description: 'Explore Maneesh Deodha\'s handpicked, certified economy cars, hatchbacks, and sedans. Pay lower taxes, enjoy lower depreciation, and get complete structural backing.',
    buttonText: 'Explore Under 5L Cars',
    actionUrl: '/search?maxPrice=500000',
    themeClass: 'from-[#0B0F19] via-[#1C1811] to-[#2B1B0E] border-amber-500/20 text-white',
    accentColor: '#f59e0b',
    icon: IndianRupee,
    interactiveType: 'none'
  },
  {
    id: 'free-service-5yr',
    tag: 'INDUSTRY FIRST GUARANTEE',
    title: 'Cars with 5 Years Free Services',
    description: 'Buy certified used cars backed by professional monthly doorstep mechanic checkups, complete fluid refits, and scanner updates at absolute zero cost.',
    buttonText: 'Verify Repair Protection',
    actionUrl: '/buyer-hub',
    themeClass: 'from-[#0B0F19] via-[#0D1D13] to-[#0A2615] border-emerald-500/20 text-white',
    accentColor: '#10b981',
    icon: ShieldCheck,
    interactiveType: 'none'
  },
  {
    id: 'free-mechanic-diagnosis',
    tag: 'FREE PHYSICAL DOORSTEP VISIT',
    title: 'Free Doorstep Mechanic Diagnosis',
    description: 'Troubled by a weird suspension rattle, dashboard warning engine icon, or soft clutch? Type your phone number to dispatch an expert diagnostic mechanic directly to your flat.',
    buttonText: 'Book Doorstep Diagnosis Now',
    actionUrl: '',
    themeClass: 'from-[#0B0F19] via-[#0E1D24] to-[#092B3A] border-cyan-500/20 text-white',
    accentColor: '#06b6d4',
    icon: Wrench,
    interactiveType: 'mechanic-booking'
  },
  {
    id: 'finance-loan',
    tag: 'LIGHTNING-FAST EMI DIGITIZATION',
    title: 'Car Finance & Interactive EMI Calculator',
    description: 'Calculate instant monthly EMIs! Tie-ups with 12+ leading banking partners for lightning-fast, zero-hassle digital loan sanctions on your chosen auto.',
    buttonText: 'Check Eligibility Rates',
    actionUrl: '/buyer-hub',
    themeClass: 'from-[#0B0F19] via-[#161026] to-[#24133B] border-purple-500/20 text-white',
    accentColor: '#8b5cf6',
    icon: TrendingUp,
    interactiveType: 'emi-calculator'
  },
  {
    id: 'rc-transfer-rto',
    tag: 'LEGAL REGISTRY EXCHANGE',
    title: 'Hassle-Free RTO RC Transfer',
    description: 'Skip long regional RTO queues and tedious title verification. We securely process full ownership transfers, hypothecation removals, and registration filings legally.',
    buttonText: 'Learn Stewardship Details',
    actionUrl: '/buyer-hub',
    themeClass: 'from-[#0B0F19] via-[#0F1E1B] to-[#0D2E29] border-teal-500/20 text-white',
    accentColor: '#14b8a6',
    icon: FileText,
    interactiveType: 'none'
  },
  {
    id: 'verified-dealers',
    tag: 'PHYSICAL SHOWROOM LOCATIONS',
    title: 'Visit Nearest Trusted Showrooms',
    description: 'Walk physically into premium, highly rated dealerships vetted directly by our audit staff. Search your local ZIP code to find verified showrooms nearby.',
    buttonText: 'Search Nearby Dealerships',
    actionUrl: '/find-dealers',
    themeClass: 'from-[#0B0F19] via-[#1D101C] to-[#2E0F26] border-pink-500/20 text-white',
    accentColor: '#ec4899',
    icon: MapPin,
    interactiveType: 'dealer-search'
  }
];

const HeroCarousel = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Doorstep booking states
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:30 AM');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // EMI calculator states
  const [loanAmount, setLoanAmount] = useState(350000);
  const [loanDuration, setLoanDuration] = useState(60); // 5 Years

  // Dealer search states
  const [dealerPincode, setDealerPincode] = useState('');
  const [dealerSearchResult, setDealerSearchResult] = useState<string | null>(null);

  // Handler for carousel shift
  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Autoplay handler
  useEffect(() => {
    if (isHovered || bookingPhone.length > 0 || dealerPincode.length > 0) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [handleNext, isHovered, bookingPhone, dealerPincode]);

  // Dynamic EMI Calculation
  const calculatedEmi = useMemo(() => {
    const rateOfInterest = 9.5; // Average private badged rates
    const r = rateOfInterest / 12 / 100;
    const n = loanDuration;
    const emi = Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    return emi || 0;
  }, [loanAmount, loanDuration]);

  // Custom diagnostic mechanic checkout demo handler
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingPhone || bookingPhone.length < 10) return;
    setBookingConfirmed(true);
    setTimeout(() => {
      // Keep it visible for beauty
    }, 5000);
  };

  // Dealer check handler
  const handleDealerPincodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (dealerPincode.length < 6) return;
    const codes = ['560001', '400001', '110001', '600001', '500001', '700001'];
    const hasMatch = dealerPincode.startsWith('56') || dealerPincode.startsWith('40') || dealerPincode.startsWith('11') || dealerPincode.startsWith('60') || dealerPincode.startsWith('50') || dealerPincode.startsWith('70');
    
    if (hasMatch) {
      setDealerSearchResult('✅ Matches physical hubs! Maneesh network has 4 verified partner dealerships inside your range limits.');
    } else {
      setDealerSearchResult('🚙 Our certified courier covers you! Spot-scouts listed closer within your state territory.');
    }
  };

  // Navigational clicks
  const handleSlideClick = (slide: BannerSlide) => {
    // If the click falls outside forms
    if (slide.actionUrl) {
      navigate(slide.actionUrl);
    }
  };

  const currentSlide = SLIDES[currentIndex];
  const SlideIcon = currentSlide.icon;

  return (
    <div 
      className="relative w-full h-[520px] md:h-[540px] rounded-[2.5rem] border overflow-hidden bg-slate-950 shadow-2xl transition-all duration-300"
      style={{ borderColor: currentSlide.accentColor + '2b' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id="home-auto-carousel"
    >
      {/* Background glow ambiance element */}
      <div 
        className="absolute inset-0 opacity-15 blur-[80px] pointer-events-none transition-all duration-[1.5s] ease-in-out"
        style={{
          background: `radial-gradient(circle at 70% 30%, ${currentSlide.accentColor} 0%, transparent 70%)`
        }}
      />
      
      {/* Grid Pattern mask overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

      {/* Main slides wrapper using AnimatePresence */}
      <div className="absolute inset-0 px-6 py-8 md:p-10 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 50 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex-1 flex flex-col justify-between"
          >
            {/* Slide Header area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center p-2 rounded-xl" style={{ backgroundColor: currentSlide.accentColor + '1a', color: currentSlide.accentColor }}>
                    <SlideIcon size={18} />
                  </span>
                  <Badge 
                    variant="outline" 
                    className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-white/10"
                    style={{ borderColor: currentSlide.accentColor + '25', color: currentSlide.accentColor }}
                  >
                    {currentSlide.tag}
                  </Badge>
                </div>
                
                {/* Numeric index display */}
                <div className="text-[10px] font-black font-mono text-white/30 tracking-widest uppercase">
                  BATCH {currentIndex + 1} / {SLIDES.length}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl md:text-3xl font-[1000] text-white tracking-tight leading-tight uppercase font-sans">
                  {currentSlide.title}
                </h2>
                <p className="text-xs md:text-sm text-slate-400 font-semibold leading-relaxed max-w-xl">
                  {currentSlide.description}
                </p>
              </div>
            </div>

            {/* Dynamic Interactive widget section inside Carousel */}
            <div className="my-4 py-3 border-t border-b border-white/5 flex-1 flex items-center justify-center min-h-[160px]">
              
              {/* INTERACTIVE TYPE: CIBIL PREVIEW */}
              {currentSlide.interactiveType === 'cibil-preview' && (
                <div className="w-full max-w-sm bg-black/40 border border-white/5 rounded-3xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">LIVE MOCK RADAR FEED</div>
                    <div className="text-xs font-black text-white">Dynamic RTO Registry check</div>
                    <div className="text-[10px] text-slate-400 font-bold">Instantly scans blacklists and loan mortgages</div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <span className="text-[7.5px] font-black uppercase tracking-widest text-[#93c5fd]">Score Grade</span>
                    <span className="text-xl font-black font-mono mt-0.5">A+</span>
                    <span className="text-[7px] text-emerald-400 font-bold uppercase mt-0.5">Verified</span>
                  </div>
                </div>
              )}

              {/* INTERACTIVE TYPE: FREE DOORSTEP SERVICE / DIAGNOSIS BOOKINGS */}
              {currentSlide.interactiveType === 'mechanic-booking' && (
                <div className="w-full max-w-sm bg-black/40 border border-white/5 rounded-3xl p-4 md:p-5 space-y-3 relative overflow-hidden">
                  {bookingConfirmed ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-4 space-y-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <Check size={20} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wide text-white">Doorstep Diagnostic Scheduled</h4>
                      <p className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-widest leading-none">
                        Our mechanics will contact you within 30 minutes!
                      </p>
                      <p className="text-[9px] text-slate-400">
                        Date Assigned: {bookingDate || 'Tomorrow'} at {bookingTime}
                      </p>
                      <button 
                        type="button"
                        onClick={() => { setBookingConfirmed(false); setBookingPhone(''); }}
                        className="text-[9px] font-black underline text-slate-400 hover:text-white uppercase tracking-widest"
                      >
                        Book another appointment
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleBookingSubmit} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-white font-bold">
                        <div>
                          <label className="text-[9px] font-bold block uppercase tracking-widest text-slate-400 mb-1">Mobile Target</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-500">+91</span>
                            <input
                              type="tel"
                              required
                              placeholder="98765 43210"
                              value={bookingPhone}
                              onChange={(e) => setBookingPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              className="w-full bg-black/50 border border-slate-800 rounded-xl py-2 pl-9 pr-2 text-[10.5px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold block uppercase tracking-widest text-slate-400 mb-1">Pick Date</label>
                          <input
                            type="date"
                            required
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full bg-black/50 border border-slate-800 rounded-xl py-2 px-2.5 text-[10.5px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-center"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[9px] font-bold block uppercase tracking-widest text-slate-400 mb-1">Diagnosis Slot</label>
                          <select
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full bg-black/50 border border-slate-800 rounded-xl py-2 px-2 text-[10.5px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            <option value="09:30 AM">Morning (09:30 AM)</option>
                            <option value="01:30 PM">Noon Hour (01:30 PM)</option>
                            <option value="04:30 PM">Evening Slot (04:30 PM)</option>
                          </select>
                        </div>
                        <div className="shrink-0 pt-4">
                          <Button 
                            type="submit"
                            size="sm"
                            disabled={bookingPhone.length < 10 || !bookingDate}
                            className="bg-cyan-500 hover:bg-cyan-600 font-black uppercase text-[9px] h-[34px] rounded-xl px-3 active:scale-95 transition-transform"
                          >
                            Confirm Visit
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* INTERACTIVE TYPE: EMI CALCULATOR */}
              {currentSlide.interactiveType === 'emi-calculator' && (
                <div className="w-full max-w-sm bg-black/40 border border-white/5 rounded-3xl p-4 md:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">EMULATED MONTHLY EMI OUTFLOW</span>
                      <span className="text-xl md:text-2xl font-black text-white font-mono flex items-baseline gap-1 mt-0.5">
                        ₹{calculatedEmi.toLocaleString()}
                        <span className="text-[10px] font-normal text-slate-400 font-sans uppercase"> / Month</span>
                      </span>
                    </div>
                    <Badge className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[8px] font-black uppercase py-0.5 px-2">
                      @ 9.5% ROI
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {/* Loan Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-[#c084fc] font-black uppercase">
                        <span>Vehicular Financed Principal</span>
                        <span>₹{(loanAmount / 100000).toFixed(2)} Lakhs</span>
                      </div>
                      <input 
                        type="range"
                        min="100000"
                        max="800000"
                        step="25000"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                        className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Tenure Buttons */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] text-slate-400 font-black uppercase">Loan Period</span>
                      <div className="flex gap-1.5">
                        {[36, 48, 60].map((months) => (
                          <button
                            key={months}
                            type="button"
                            onClick={() => setLoanDuration(months)}
                            className={cn(
                              "text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase transition-all",
                              loanDuration === months 
                                ? "bg-purple-600 text-white border-purple-600" 
                                : "bg-transparent text-slate-400 border-white/5 hover:bg-white/5"
                            )}
                          >
                            {months / 12} Yrs
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* INTERACTIVE TYPE: DEALER SEARCH */}
              {currentSlide.interactiveType === 'dealer-search' && (
                <div className="w-full max-w-sm bg-black/40 border border-white/5 rounded-3xl p-4 space-y-3 text-xs">
                  <div className="text-[9.5px] font-black text-pink-400 uppercase tracking-widest">LOCAL SHOWROOM DISCOVERY NETWORK</div>
                  
                  <form onSubmit={handleDealerPincodeSearch} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit Pincode"
                      value={dealerPincode}
                      onChange={(e) => setDealerPincode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 bg-black/50 border border-slate-800 rounded-xl py-2 px-3 text-[10.5px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-pink-500 text-center uppercase tracking-widest placeholder:text-slate-600"
                    />
                    <Button
                      type="submit"
                      disabled={dealerPincode.length < 6}
                      className="bg-pink-500 hover:bg-pink-600 text-white font-black uppercase text-[9px] h-9 rounded-xl px-4"
                    >
                      Search Area
                    </Button>
                  </form>

                  {dealerSearchResult && (
                    <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 text-pink-300 font-bold text-[9.5px] leading-relaxed rounded-xl text-center">
                      {dealerSearchResult}
                    </div>
                  )}
                </div>
              )}

              {/* INTERACTIVE TYPE: NONE */}
              {currentSlide.interactiveType === 'none' && (
                <div className="w-full max-w-sm py-2 flex flex-col items-center text-center justify-center space-y-2">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white border border-white/10 relative">
                    <SlideIcon size={24} style={{ color: currentSlide.accentColor }} />
                    <Sparkles size={12} className="absolute top-0 right-0 animate-pulse text-yellow-400" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#cbd5e1]">Direct Partner Service</div>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                      Maneesh Deodha\'s system operates fully digital RTO compliance verification
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Slide Action Buttons & Indicators */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between pt-2">
              <div>
                {currentSlide.actionUrl ? (
                  <Button
                    onClick={() => handleSlideClick(currentSlide)}
                    className="w-full sm:w-auto h-11 px-6 text-[10.5px] font-black uppercase tracking-wider rounded-2xl active:scale-95 transition-transform flex items-center gap-1.5"
                    style={{ backgroundColor: currentSlide.accentColor, color: '#FFFFFF' }}
                  >
                    🚀 {currentSlide.buttonText}
                    <ArrowRight size={13} className="animate-pulse" />
                  </Button>
                ) : (
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
                    Fill out the live booking form above to try
                  </span>
                )}
              </div>

              {/* Progress and indicators */}
              <div className="flex gap-2">
                {SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => {
                      setDirection(idx > currentIndex ? 1 : -1);
                      setCurrentIndex(idx);
                    }}
                    className="w-2.5 h-2.5 rounded-full transition-all duration-300 border border-white/10"
                    style={{ 
                      backgroundColor: currentIndex === idx ? currentSlide.accentColor : 'rgba(255, 255, 255, 0.1)',
                      borderColor: currentIndex === idx ? currentSlide.accentColor : 'rgba(255, 255, 255, 0.05)'
                    }}
                    title={slide.title}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Side Arrow Navigation triggers */}
      <button
        onClick={handlePrev}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 group-hover:opacity-60 w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs text-white flex items-center justify-center border border-white/10 transition-opacity"
        style={{ hover: { color: currentSlide.accentColor } } as any}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 group-hover:opacity-60 w-8 h-8 rounded-full bg-black/40 backdrop-blur-xs text-white flex items-center justify-center border border-white/10 transition-opacity"
        style={{ hover: { color: currentSlide.accentColor } } as any}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default HeroCarousel;
