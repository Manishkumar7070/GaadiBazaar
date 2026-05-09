import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  ShoppingCart, 
  Tag, 
  MapPin, 
  CheckCircle2, 
  Navigation,
  ChevronRight,
  Phone,
  Lock,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { locationService, LocationError } from '@/services/location.service';
import { useLocation as useAppLocation } from '@/context/LocationContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber, googleProvider, handleRedirectResult, isPopupClosedError } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { ConfirmationResult, signInWithPopup } from 'firebase/auth';
import { POPULAR_CITIES } from '@/constants/cities';

const LoginPage = () => {
  const { user, completeProfile } = useAuth();
  const { setSelectedCity } = useAppLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<'login' | 'location' | 'role' | 'phone' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const [locationData, setLocationData] = useState<{
    latitude?: number;
    longitude?: number;
    cityName?: string;
    address?: string;
  }>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [searchCity, setSearchCity] = useState('');

  const filteredCities = POPULAR_CITIES.filter(city => 
    city.name.toLowerCase().includes(searchCity.toLowerCase())
  );

  const redirect = searchParams.get('redirect') || '/';
  const reason = searchParams.get('reason');

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await handleRedirectResult();
        if (result?.user) {
          logger.info('Google Redirect Login captured');
        }
      } catch (err: any) {
        if (err.code !== 'auth/no-recent-redirect-handled') {
          logger.error('Redirect Logic Error', { data: err });
          setError(err.message || 'Failed to complete redirect sign-in');
        }
      } finally {
        setInitializing(false);
      }
    };
    checkRedirect();
  }, []);

  useEffect(() => {
    if (user && user.isProfileComplete) {
      navigate(redirect);
    } else if (user && !user.isProfileComplete) {
      if (step === 'login' || step === 'phone' || step === 'otp') {
        setStep('location');
      }
    }
  }, [user, navigate, redirect, step]);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (!isPopupClosedError(error)) {
        logger.error('Google Login Error', { data: error });
        setError(error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber) return;

    setLoading(true);
    try {
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible'
        });
      }
      const verifier = recaptchaVerifier.current;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP.');
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || !confirmationResult) return;

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
    } catch (error: any) {
      setError('Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetectLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const coords = await locationService.getCurrentPosition();
      const geo = await locationService.reverseGeocode(coords.latitude, coords.longitude);
      
      setLocationData({
        latitude: coords.latitude,
        longitude: coords.longitude,
        cityName: geo.cityName,
        address: geo.address
      });

      if (geo.cityName) setSelectedCity(geo.cityName);
      setTimeout(() => setStep('role'), 1000);
    } catch (err: any) {
      let userMessage = 'We couldn\'t detect your location автоматически.';
      if (err instanceof LocationError) userMessage = err.message;
      setLocationError(userMessage);
      setShowManualLocation(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleManualLocationSelect = (cityName: string) => {
    setLocationData({ ...locationData, cityName, address: `Selected: ${cityName}` });
    setSelectedCity(cityName);
    setStep('role');
  };

  const handleRoleSelect = async (role: 'buyer' | 'seller') => {
    setLoading(true);
    try {
      await completeProfile({ 
        role, 
        fullName: user?.fullName,
        phone: user?.phone || phoneNumber,
        ...locationData
      });
      navigate(redirect);
    } catch (error) {
      logger.error('Role Selection Error', { data: error });
    } finally {
      setLoading(false);
    }
  };

  const getReasonMessage = () => {
    switch (reason) {
      case 'save_search': return 'Log in to save searches and alerts.';
      case 'list_vehicle': return 'Log in to list your vehicle.';
      case 'favorite_vehicle': return 'Log in to favorite vehicles.';
      case 'contact_seller': return 'Log in to contact sellers.';
      default: return 'Join our digital dealership community.';
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0A0C10]">
      <div id="recaptcha-container"></div>
      
      <div className="w-full max-w-md relative z-10 space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <Logo iconSize={48} fontSize="text-2xl" />
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">
              Secure <span className="text-primary italic">Access</span>
            </h1>
            <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">
              {getReasonMessage()}
            </p>
          </div>
        </motion.div>

        <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {initializing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="animate-spin text-primary" size={40} />
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Identifying Session...</p>
                </div>
              ) : step === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-16 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-lg group flex items-center justify-center gap-4"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <span>Continue with Google</span>}
                    {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                  </Button>

                  <Button 
                    onClick={() => setStep('phone')}
                    variant="outline"
                    className="w-full h-16 rounded-2xl bg-transparent border-white/20 text-white font-black text-lg hover:bg-white/5 flex items-center justify-center gap-4"
                  >
                    <Smartphone size={24} />
                    <span>Phone OTP</span>
                  </Button>

                  {error && (
                    <p className="text-red-400 text-[10px] font-bold text-center bg-red-400/10 p-3 rounded-xl">
                      {error}
                    </p>
                  )}
                </motion.div>
              )}

              {step === 'location' && (
                <motion.div
                  key="location"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6 text-center"
                >
                   <MapPin size={40} className="text-primary mx-auto" />
                   <h2 className="text-2xl font-black text-white italic lowercase">your city</h2>
                   
                   {!showManualLocation ? (
                     <Button
                       onClick={handleAutoDetectLocation}
                       disabled={locationLoading}
                       className="w-full h-16 bg-primary text-white rounded-2xl font-black"
                     >
                       {locationLoading ? 'Detecting...' : 'Auto-Detect Location'}
                     </Button>
                   ) : (
                     <div className="space-y-3">
                       <input 
                         type="text"
                         value={searchCity}
                         onChange={(e) => setSearchCity(e.target.value)}
                         placeholder="Find your city..."
                         className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-bold"
                       />
                       <div className="max-h-40 overflow-y-auto space-y-1">
                         {filteredCities.map(city => (
                           <button
                             key={city.name}
                             onClick={() => handleManualLocationSelect(city.name)}
                             className="w-full p-3 bg-white/5 hover:bg-white/10 text-white text-left font-bold"
                           >
                             {city.name}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}
                   <button onClick={() => setShowManualLocation(!showManualLocation)} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white">
                      {showManualLocation ? 'Try Auto' : 'Manual Select'}
                   </button>
                </motion.div>
              )}

              {step === 'role' && (
                <motion.div
                  key="role"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <h2 className="text-2xl font-black text-white text-center italic mb-4">i am a...</h2>
                  <button onClick={() => handleRoleSelect('buyer')} className="w-full p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-left flex items-center justify-between group">
                    <div>
                        <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors uppercase italic">Buyer</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Search & Acquire</p>
                    </div>
                    <ShoppingCart className="text-white/20 group-hover:text-primary transition-colors" size={32} />
                  </button>
                  <button onClick={() => handleRoleSelect('seller')} className="w-full p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-left flex items-center justify-between group">
                    <div>
                        <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors uppercase italic">Dealer</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">List & Liquidate</p>
                    </div>
                    <Tag className="text-white/20 group-hover:text-primary transition-colors" size={32} />
                  </button>
                </motion.div>
              )}

              {step === 'phone' && (
                <motion.div key="phone" className="space-y-4">
                    <input 
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Phone Number"
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-bold"
                    />
                    <Button onClick={handleSendOtp} className="w-full h-14 rounded-xl font-black">Send OTP</Button>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div key="otp" className="space-y-4">
                    <input 
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-digit code"
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-white font-bold text-center tracking-[0.5em]"
                    />
                    <Button onClick={handleVerifyOtp} className="w-full h-14 rounded-xl font-black">Verify Identity</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

