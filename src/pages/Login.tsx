import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  ShoppingCart, 
  Tag, 
  MapPin, 
  CheckCircle2, 
  Globe,
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
import { locationService } from '@/services/location.service';
import { useLocation } from '@/context/LocationContext';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import { ConfirmationResult } from 'firebase/auth';

const LoginPage = () => {
  const { user, completeProfile, loginWithGoogle, logout } = useAuth();
  const { setSelectedCity } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<'login' | 'location' | 'role' | 'profile' | 'phone' | 'otp'>('login');
  const [loading, setLoading] = useState(false);
  
  // Phone Auth state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  // Location state
  const [locationData, setLocationData] = useState<{
    latitude?: number;
    longitude?: number;
    cityName?: string;
    address?: string;
  }>({});
  const [locationLoading, setLocationLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/';
  const reason = searchParams.get('reason');

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
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Google Login Error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        setError(`Domain not authorized: "${window.location.hostname}". Please add this domain to your Firebase Console under Auth > Settings > Authorized Domains.`);
      } else if (error.message?.includes('offline')) {
        setError('Connection failed: You appear to be offline or Firestore is being blocked by your network. Please check your connection.');
      } else {
        setError(error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!recaptchaVerifier.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber) return;

    setLoading(true);
    try {
      setupRecaptcha();
      const verifier = recaptchaVerifier.current;
      if (!verifier) throw new Error('Recaptcha not initialized');

      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (error: any) {
      console.error('Phone Auth Error:', error);
      if (error.code === 'auth/billing-not-enabled') {
        setError('Phone authentication requires the Firebase project to be on the Blaze (Pay-as-you-go) plan. Please enable billing in your Firebase console.');
      } else {
        setError(error.message || 'Failed to send OTP. Please check the number and try again.');
      }
      // Reset recaptcha on error
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || !confirmationResult) return;

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // Auth state listener in context will handle the rest
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      setError('Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetectLocation = async () => {
    setLocationLoading(true);
    try {
      const coords = await locationService.getCurrentPosition();
      const geo = await locationService.reverseGeocode(coords.latitude, coords.longitude);
      
      setLocationData({
        latitude: coords.latitude,
        longitude: coords.longitude,
        cityName: geo.cityName,
        address: geo.address
      });

      if (geo.cityName) {
        setSelectedCity(geo.cityName);
      }
      
      setTimeout(() => setStep('role'), 1000);
    } catch (error) {
      console.error('Location detection failed:', error);
      setStep('role');
    } finally {
      setLocationLoading(false);
    }
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
      console.error('Role Selection Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReasonMessage = () => {
    switch (reason) {
      case 'save_search': return 'Log in to save your searches and get price drop alerts.';
      case 'list_vehicle': return 'Log in to list your vehicle and reach thousands of buyers.';
      case 'favorite_vehicle': return 'Log in to sync your favorite vehicles across devices.';
      case 'contact_seller': return 'Log in to securely contact sellers and book test drives.';
      default: return 'Join the most trusted digital dealership community.';
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0A0C10]">
      <div id="recaptcha-container"></div>
      
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-5 bg-white rounded-[2rem] shadow-2xl border border-white/50 transform group-hover:scale-105 transition-transform duration-500">
              <Logo iconSize={48} fontSize="text-2xl" />
            </div>
          </div>
          
          <div className="space-y-2">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black tracking-tight text-white"
            >
              Secure <span className="text-primary italic">Access</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-400 font-bold text-sm tracking-wide uppercase"
            >
              {getReasonMessage()}
            </motion.p>
          </div>
        </motion.div>

        <Card className="rounded-[3.5rem] border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden bg-slate-900/40 backdrop-blur-3xl border border-white/5">
          <CardContent className="p-10">
            <AnimatePresence mode="wait">
              {step === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-4">
                    <p className="text-slate-300 font-medium">Continue with your secure identity</p>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full h-18 rounded-[2rem] bg-white hover:bg-slate-100 text-slate-900 font-black text-lg shadow-xl shadow-white/5 transition-all hover:scale-[1.03] active:scale-[0.98] group flex items-center justify-center gap-4"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={24} />
                      ) : (
                        <>
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span>Continue with Google</span>
                          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>

                    <Button 
                      onClick={() => setStep('phone')}
                      variant="outline"
                      className="w-full h-18 rounded-[2rem] bg-transparent border-white/20 text-white font-black text-lg transition-all hover:bg-white/5 active:scale-[0.98] flex items-center justify-center gap-4"
                    >
                      <Phone size={24} />
                      <span>Phone Number OTP</span>
                    </Button>
                  </div>

                  {error && (
                    <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 p-3 rounded-2xl border border-red-400/20">
                      {error}
                    </p>
                  )}

                  <div className="flex items-center gap-4 py-2">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Identity Assured</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center gap-2 text-center">
                       <CheckCircle2 className="text-primary" size={20} />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">No Passwords</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center gap-2 text-center">
                       <ShieldCheck className="text-indigo-400" size={20} />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Biometric Ready</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'phone' && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-white">Phone Sign-In</h2>
                    <p className="text-sm text-slate-400">Enter your number for a secure OTP</p>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                        <Smartphone size={20} />
                      </div>
                      <input 
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Phone Number (e.g. 9876543210)"
                        className="w-full h-16 pl-14 pr-6 rounded-3xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      disabled={loading || !phoneNumber}
                      className="w-full h-16 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={24} />
                      ) : (
                        <>
                          <span>Send OTP Code</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </Button>
                    
                    <button 
                      type="button"
                      onClick={() => setStep('login')}
                      className="w-full text-xs font-bold text-slate-500 hover:text-white transition-colors"
                    >
                      Back to Login Options
                    </button>
                  </form>

                  {error && (
                    <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 p-3 rounded-2xl border border-red-400/20">
                      {error}
                    </p>
                  )}
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-white">Verify Code</h2>
                    <p className="text-sm text-slate-400">Verifying {phoneNumber}</p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                        <Lock size={20} />
                      </div>
                      <input 
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="6-digit OTP"
                        maxLength={6}
                        className="w-full h-16 pl-14 pr-6 rounded-3xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-bold tracking-[0.5em] text-center"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full h-16 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={24} />
                      ) : (
                        <>
                          <span>Verify & Log In</span>
                          <CheckCircle2 size={20} />
                        </>
                      )}
                    </Button>
                    
                    <div className="flex flex-col gap-2">
                       <button 
                        type="button"
                        onClick={() => {
                          setStep('phone');
                          setOtp('');
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
                      >
                        Change Phone Number
                      </button>
                    </div>
                  </form>

                  {error && (
                    <p className="text-red-400 text-xs font-bold text-center bg-red-400/10 p-3 rounded-2xl border border-red-400/20">
                      {error}
                    </p>
                  )}
                </motion.div>
              )}

              {step === 'location' && (
                <motion.div
                  key="location"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-10 text-center"
                >
                   <div className="relative mx-auto w-32 h-32">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-primary rounded-full"
                      />
                      <div className="absolute inset-4 rounded-full bg-slate-900 flex items-center justify-center border-4 border-primary/20 shadow-2xl">
                         <MapPin size={56} className="text-primary" />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h2 className="text-3xl font-black text-white px-2">Local Experience</h2>
                      <p className="text-slate-400 font-bold text-sm px-6 leading-relaxed">
                        Find deals from certified dealerships in your immediate vicinity.
                      </p>
                   </div>

                   <div className="space-y-6">
                      <Button
                        onClick={handleAutoDetectLocation}
                        disabled={locationLoading}
                        className="w-full h-20 rounded-[2.5rem] bg-primary text-white hover:bg-primary/90 font-black text-xl shadow-[0_24px_48px_-12px_rgba(var(--primary-rgb),0.4)] flex items-center justify-center gap-4 group"
                      >
                        {locationLoading ? (
                           <>
                            <Loader2 className="animate-spin" size={28} />
                            <span>Locating...</span>
                           </>
                        ) : (
                          <>
                            <Navigation size={28} className="group-hover:fill-current group-hover:rotate-12 transition-all" />
                            <span>Auto-Detect City</span>
                          </>
                        )}
                      </Button>
                      
                      <button
                        onClick={() => setStep('role')}
                        className="text-xs font-black text-slate-500 hover:text-white transition-colors py-2 uppercase tracking-[0.3em] group"
                      >
                        Skip Selection <span className="group-hover:pl-1 transition-all">→</span>
                      </button>
                   </div>
                </motion.div>
              )}

              {step === 'role' && (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-3 mb-6 relative">
                    <h2 className="text-3xl font-black text-white">Your Intent</h2>
                    <p className="text-sm font-bold text-slate-400">Choose your persona on the platform</p>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <button
                      onClick={() => handleRoleSelect('buyer')}
                      className="w-full group relative p-8 rounded-[3rem] bg-white/5 hover:bg-white/10 border-2 border-transparent hover:border-primary/30 transition-all text-left flex items-center gap-8 overflow-hidden shadow-inner"
                    >
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-900 group-hover:scale-110 shadow-2xl flex items-center justify-center text-slate-500 group-hover:text-primary transition-all duration-500 border border-white/5">
                        <ShoppingCart size={32} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-2xl text-white group-hover:text-primary transition-colors">Buyer</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Acquire vehicles</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <ChevronRight size={24} className="text-primary" />
                      </div>
                    </button>

                    <button
                      onClick={() => handleRoleSelect('seller')}
                      className="w-full group relative p-8 rounded-[3rem] bg-white/5 hover:bg-white/10 border-2 border-transparent hover:border-indigo-500/30 transition-all text-left flex items-center gap-8 overflow-hidden shadow-inner"
                    >
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-900 group-hover:scale-110 shadow-2xl flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-all duration-500 border border-white/5">
                        <Tag size={32} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-2xl text-white group-hover:text-indigo-400 transition-colors">Dealer</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Liquidate inventory</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                        <ChevronRight size={24} className="text-indigo-400" />
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12 pt-10 border-t border-white/5 text-center space-y-6">
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed px-10 tracking-widest uppercase opacity-60">
                Firebase Identity Protection Active.
              </p>
              
              <div className="inline-flex items-center gap-6 px-10 py-5 rounded-[2rem] bg-white/5 border border-white/10 shadow-inner">
                <div className="flex items-center gap-3">
                   <ShieldCheck size={14} className="text-primary opacity-80" />
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Zero Trust Auth</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

