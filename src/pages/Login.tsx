import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Loader2, 
  X,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ShoppingCart,
  Tag,
  ThumbsUp,
  Mail,
  Phone,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { locationService } from '@/services/location.service';
import { useLocation as useAppLocation } from '@/context/LocationContext';
import { POPULAR_CITIES } from '@/constants/cities';

import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const LoginPage = () => {
  const { user, completeProfile } = useAuth();
  const { setSelectedCity } = useAppLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'login' | 'otp' | 'location' | 'role' | 'reset-password'>('login');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // Phone Login State
  const [phoneNumber, setPhoneNumber] = useState(searchParams.get('phone') || '');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any | null>(null);
  
  // Email Login/Register State
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const recaptchaVerifier = useRef<any | null>(null);

  const [locationData, setLocationData] = useState<{
    latitude?: number;
    longitude?: number;
    cityName?: string;
    address?: string;
  }>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [searchCity, setSearchCity] = useState('');

  const filteredCities = POPULAR_CITIES.filter(city => 
    city.name.toLowerCase().includes(searchCity.toLowerCase())
  );

  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    // Basic initialization check
    const timer = setTimeout(() => setInitializing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user && user.isProfileComplete) {
      navigate(redirect);
    } else if (user && !user.isProfileComplete) {
      if (step === 'login' || step === 'otp') {
        setStep('location');
      }
    }
  }, [user, navigate, redirect, step]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter valid mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP code.');
      }
      
      setConfirmationResult(true);
      if (result.mode === 'fallback') {
        setSuccess(`Local Sandbox: OTP is ${result.devOtp}. Enter below.`);
      } else {
        setSuccess('Verification OTP sent successfully.');
      }
      setStep('otp');
    } catch (error: any) {
      logger.error('Login OTP Error', { data: error });
      setError(error.message || 'Failed to dispatch verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: otp })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Invalid OTP code. Please try again.');
      }

      // Explicitly set session on client side to trigger onAuthStateChange
      if (result.session) {
        const { error: setSessionErr } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token
        });
        if (setSessionErr) throw setSessionErr;
      }
    } catch (error: any) {
      setError(error.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) throw signInError;
    } catch (error: any) {
      setError(error.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || !password || !fullName) {
      setError('Please fill in all fields including name');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      if (signUpError) throw signUpError;
      
      setSuccess('Account registered successfully!');
      
      // Attempt auto login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        setSuccess('Account registered! Please sign in with your password.');
        setEmailMode('login');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setSuccess('Password reset link sent to your email!');
      setTimeout(() => {
        setStep('login');
        setSuccess(null);
      }, 5000);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email.');
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

      if (geo.cityName) setSelectedCity(geo.cityName);
      setTimeout(() => setStep('role'), 800);
    } catch (err: any) {
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
        fullName: user?.fullName || 'User',
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

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
      if (cleaned.length === 10) setError(null);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#f1f3f5] overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-200/50 rounded-full blur-[100px] -mr-96 -mt-96" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-200/30 rounded-full blur-[80px] -ml-48 -mb-48" />
      </div>

      <div id="recaptcha-container"></div>
      
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl relative z-10 bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row min-h-[500px]"
        >
          {/* Left Column - Minimalist Illustration */}
          <div className="hidden md:flex w-[35%] bg-[#F3F4F6] relative items-center justify-center p-0 overflow-hidden">
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[280px]">
                {/* Background Accent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
              
              {/* Minimalist Line Art Character */}
              <svg viewBox="0 0 200 240" className="w-full h-auto relative z-10 text-[#2D3436]" fill="none">
                <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {/* Curly Hair Style */}
                  <path d="M100 45c-5 0-10 2-12 5-2-3-7-5-12-5-8 0-15 7-15 15 0 3 1 6 2 8-3 2-5 6-5 10s2 8 5 10c-1 2-2 5-2 8 0 8 7 15 15 15h24c8 0 15-7 15-15 0-3-1-6-2-8 3-2 5-6 5-10s-2-8-5-10c1-2 2-5 2-8 0-8-7-15-15-15z" fill="white" />
                  {/* Face Outline */}
                  <path d="M115 85c0 15-15 25-15 25s-15-10-15-25c0-15 15-15 15-15s15 0 15 15z" fill="white" />
                  {/* Features */}
                  <circle cx="93" cy="85" r="1" fill="currentColor" stroke="none" />
                  <circle cx="107" cy="85" r="1" fill="currentColor" stroke="none" />
                  <path d="M96 98c2 2 6 2 8 0" />
                  {/* Shirt / Torso */}
                  <path d="M60 210c0-40 15-65 40-65s40 25 40 65" fill="white" />
                  <path d="M100 145v20M85 150l15 10 15-10" />
                  {/* Arm & Mobile Phone */}
                  <path d="M125 155c15 10 20 25 10 45" />
                  <rect x="135" y="180" width="18" height="36" rx="4" fill="#2d3436" stroke="none" />
                  <path d="M135 180c-5 0-5 5-5 5v30s0 5 5 5h18s5 0 5-5v-30s0-5-5-5h-18z" />
                </g>
              </svg>

              {/* Floating Notifications */}
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className="absolute top-[35%] right-2 w-14 h-14 bg-[#FF5A3C] rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-500/20 z-20"
              >
                <ThumbsUp size={28} fill="currentColor" strokeWidth={1} />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-[#FF5A3C] rounded-sm rotate-[15deg]" />
              </motion.div>

              <div className="absolute bottom-[20%] right-2 w-20 h-14 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 flex flex-col gap-2 z-20">
                <div className="w-full h-1.5 bg-slate-100 rounded-full" />
                <div className="w-2/3 h-1.5 bg-slate-100 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Content Area */}
        <div className="flex-1 p-6 md:p-10 lg:p-12 relative bg-white flex flex-col justify-center">
            <button 
              onClick={() => navigate('/')}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-900 transition-colors rounded-full"
            >
              <X size={20} />
            </button>

            <AnimatePresence mode="wait">
              {step === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#2D3436] tracking-tight">Login or Register</h1>
                    <p className="text-[#5F6368] text-sm font-medium leading-relaxed max-w-[280px]">
                      Access your orders, track progress & get regular updates
                    </p>
                  </div>

                  {/* Method Toggle */}
                  <div className="flex p-1 bg-slate-100 rounded-2xl">
                    <button 
                      onClick={() => setAuthMethod('phone')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                        authMethod === 'phone' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <Phone size={14} /> Phone
                    </button>
                    <button 
                      onClick={() => setAuthMethod('email')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                        authMethod === 'email' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <Mail size={14} /> Email
                    </button>
                  </div>

                  {authMethod === 'phone' ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                      <div className="space-y-2">
                        <div className={cn(
                          "relative flex flex-col px-5 py-2.5 bg-white border-2 rounded-3xl transition-all h-16 justify-center group",
                          error ? "border-[#FF5A3C]" : "border-slate-100 focus-within:border-slate-300"
                        )}>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] mb-0.5 leading-none">
                            Mobile Number
                          </label>
                          <div className="flex items-center text-xl font-bold text-[#2D3436] h-7">
                            <div className="flex items-center shrink-0 text-[#CBD5E0] mr-2.5 select-none">
                              <span className="leading-none text-lg">+91</span>
                              <span className="ml-2 font-normal leading-none opacity-30 text-lg">|</span>
                            </div>
                            <input 
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => validatePhone(e.target.value)}
                              placeholder="00000 00000"
                              className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full placeholder:text-slate-200 leading-none h-full text-lg"
                              autoFocus
                            />
                          </div>
                        </div>
                        {error && (
                          <p className="text-[#FF5A3C] text-[11px] font-bold pl-1 tracking-tight">{error}</p>
                        )}
                      </div>

                      <Button 
                        type="submit"
                        disabled={loading || phoneNumber.length < 10}
                        className={cn(
                          "w-full h-16 rounded-3xl font-bold text-lg transition-all shadow-none",
                          phoneNumber.length === 10 ? "bg-[#FF5A3C] hover:bg-[#E64A2E] text-white" : "bg-[#E2E8F0] text-white pointer-events-none"
                        )}
                      >
                        {loading ? <Loader2 className="animate-spin text-white" /> : 'Send OTP'}
                      </Button>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {/* Email Form Toggle */}
                      <div className="flex justify-between items-center px-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEmailMode('register');
                            setError(null);
                            setSuccess(null);
                          }}
                          className={cn(
                            "pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                            emailMode === 'register' ? "border-[#FF5A3C] text-[#FF5A3C]" : "border-transparent text-slate-400 hover:text-slate-600"
                          )}
                        >
                          New User: Register
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailMode('login');
                            setError(null);
                            setSuccess(null);
                          }}
                          className={cn(
                            "pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all",
                            emailMode === 'login' ? "border-[#FF5A3C] text-[#FF5A3C]" : "border-transparent text-slate-400 hover:text-slate-600"
                          )}
                        >
                          Have Account: Login
                        </button>
                      </div>

                      <form onSubmit={emailMode === 'register' ? handleEmailRegister : handleEmailLogin} className="space-y-4">
                        {emailMode === 'register' && (
                          <div className="space-y-2">
                            <div className={cn(
                              "relative flex flex-col px-5 py-2.5 bg-white border-2 rounded-3xl transition-all h-16 justify-center group",
                              error ? "border-[#FF5A3C]" : "border-slate-100 focus-within:border-slate-300"
                            )}>
                              <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A0AEC0] mb-0.5 leading-none">
                                Full Name
                              </label>
                              <input 
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full name"
                                className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full placeholder:text-slate-200 leading-none h-full text-lg font-bold text-[#2D3436]"
                                required
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className={cn(
                            "relative flex flex-col px-5 py-2.5 bg-white border-2 rounded-3xl transition-all h-16 justify-center group",
                            error ? "border-[#FF5A3C]" : "border-slate-100 focus-within:border-slate-300"
                          )}>
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A0AEC0] mb-0.5 leading-none">
                              Email Address
                            </label>
                            <input 
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="name@example.com"
                              className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full placeholder:text-slate-200 leading-none h-full text-lg font-bold text-[#2D3436]"
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className={cn(
                            "relative flex flex-col px-5 py-2.5 bg-white border-2 rounded-3xl transition-all h-16 justify-center group",
                            error ? "border-[#FF5A3C]" : "border-slate-100 focus-within:border-slate-300"
                          )}>
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A0AEC0] mb-0.5 leading-none">
                              Password
                            </label>
                            <input 
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full placeholder:text-slate-200 leading-none h-full text-lg font-bold text-[#2D3436]"
                            />
                          </div>
                          {emailMode === 'login' && (
                            <div className="flex justify-end">
                              <button 
                                type="button"
                                onClick={() => setStep('reset-password')}
                                className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
                              >
                                Forgot Password?
                              </button>
                            </div>
                          )}
                        </div>

                        {error && (
                          <p className="text-[#FF5A3C] text-[11px] font-bold pl-1">{error}</p>
                        )}
                        {success && (
                          <p className="text-emerald-500 text-[11px] font-bold pl-1">{success}</p>
                        )}

                        <Button 
                          type="submit"
                          disabled={loading || !email || !password || (emailMode === 'register' && !fullName)}
                          className={cn(
                            "w-full h-16 rounded-3xl font-bold text-lg transition-all shadow-none mt-2",
                            (email && password && (emailMode === 'login' || fullName)) ? "bg-[#FF5A3C] hover:bg-[#E64A2E] text-white" : "bg-[#E2E8F0] text-white pointer-events-none"
                          )}
                        >
                          {loading ? <Loader2 className="animate-spin text-white" /> : (emailMode === 'register' ? 'Register Account' : 'Login')}
                        </Button>
                      </form>

                      {/* Explicit Guidance Text */}
                      <p className="text-center text-xs text-slate-500 mt-2 font-medium">
                        {emailMode === 'register' ? (
                          <>
                            Already have an account?{' '}
                            <button
                              type="button"
                              onClick={() => setEmailMode('login')}
                              className="text-primary hover:underline font-bold"
                            >
                              Log In Here
                            </button>
                          </>
                        ) : (
                          <>
                            First time here? Please{' '}
                            <button
                              type="button"
                              onClick={() => setEmailMode('register')}
                              className="text-primary hover:underline font-bold"
                            >
                              Register First
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-[#A0AEC0] leading-relaxed font-medium">
                    By proceeding, I confirm that I have received, read, and agree to:{' '}
                    {[
                      'Data Sharing for Loan Eligibility',
                      'Third-Party Sharing with Dealers and OEMs',
                      'Marketing Communication',
                      'Privacy Policy',
                      'Terms & Conditions',
                      'Consent Declaration',
                      'certified CIC'
                    ].map((text, i, arr) => (
                      <span key={text} className="inline-block mr-1">
                        <button type="button" className="text-[#718096] hover:underline inline-block whitespace-nowrap underline-offset-2">{text}</button>
                        {i < arr.length - 1 ? ',' : '.'}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12"
                >
                  <div className="space-y-4">
                    <h2 className="text-[32px] font-bold text-[#202124] tracking-tight">Verify Identity</h2>
                    <p className="text-[#5F6368] text-lg font-medium">
                      Code sent to <span className="text-[#202124] font-bold">+91 {phoneNumber}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-10">
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otp}
                          onChange={(val) => setOtp(val)}
                        >
                          <InputOTPGroup className="gap-2 sm:gap-2.5">
                            <InputOTPSlot index={0} className="w-11 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                            <InputOTPSlot index={1} className="w-11 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                            <InputOTPSlot index={2} className="w-11 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                            <InputOTPSlot index={3} className="w-11 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                            <InputOTPSlot index={4} className="w-11 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                            <InputOTPSlot index={5} className="w-11 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      {error && <p className="text-[#FF5A3C] text-center font-bold tracking-tight">{error}</p>}
                    </div>

                    <Button 
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className="w-full h-18 rounded-[2rem] bg-[#FF5A3C] hover:bg-[#E64A2E] text-white font-bold text-xl shadow-lg shadow-orange-500/20"
                    >
                      {loading ? <Loader2 className="animate-spin text-white" /> : 'Enter Dashboard'}
                    </Button>

                    <div className="flex flex-col gap-6 items-center">
                      <button 
                        type="button" 
                        onClick={() => setStep('login')}
                        className="text-sm font-bold text-[#70757A] hover:text-[#202124] uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <ArrowLeft size={14} /> Back to Login
                      </button>
                      <div className="h-1 w-16 bg-slate-100 rounded-full" />
                      <button type="button" className="text-xs font-bold text-[#FF5A3C] hover:underline uppercase tracking-widest">
                        Resend OTP (available in 59s)
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

            {step === 'reset-password' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Forgot Password?</h2>
                  <p className="text-slate-500 font-medium">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handlePasswordReset} className="space-y-8">
                  <div className="space-y-2">
                    <div className={cn(
                      "relative flex flex-col px-5 py-2.5 bg-white border-2 rounded-3xl transition-all h-20 justify-center group",
                      error ? "border-[#FF5A3C]" : "border-slate-100 focus-within:border-slate-300"
                    )}>
                      <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A0AEC0] mb-0.5 leading-none">
                        Email Address
                      </label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none w-full placeholder:text-slate-200 leading-none h-full text-xl font-bold text-[#2D3436]"
                        autoFocus
                      />
                    </div>
                    {error && (
                      <p className="text-[#FF5A3C] text-[11px] font-bold pl-1">{error}</p>
                    )}
                    {success && (
                      <p className="text-emerald-500 text-[11px] font-bold pl-1">{success}</p>
                    )}
                  </div>

                  <Button 
                    type="submit"
                    disabled={loading || !email}
                    className={cn(
                      "w-full h-18 rounded-[2rem] font-bold text-xl transition-all shadow-none",
                      email ? "bg-[#FF5A3C] hover:bg-[#E64A2E] text-white" : "bg-[#E2E8F0] text-white pointer-events-none"
                    )}
                  >
                    {loading ? <Loader2 className="animate-spin text-white" /> : 'Send Reset Link'}
                  </Button>

                  <button 
                    type="button" 
                    onClick={() => setStep('login')}
                    className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} /> Back to Login
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'location' && (
              <motion.div key="location" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="space-y-4">
                   <h2 className="text-5xl font-[1000] text-slate-900 tracking-tight leading-none uppercase italic">Your Territory</h2>
                   <p className="text-slate-500 text-xl font-semibold">Help us filter verified listings in your city.</p>
                </div>
                
                <div className="space-y-6">
                  {!showManualLocation ? (
                    <Button
                      onClick={handleAutoDetectLocation}
                      disabled={locationLoading}
                      className="w-full h-24 rounded-[2rem] bg-slate-900 text-white font-[1000] text-2xl uppercase tracking-widest hover:bg-slate-800 shadow-2xl transition-all active:scale-95"
                    >
                      {locationLoading ? <Loader2 className="animate-spin" /> : 'Detect Nearby'}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative group">
                         <input 
                           type="text"
                           value={searchCity}
                           onChange={(e) => setSearchCity(e.target.value)}
                           placeholder="Search your city..."
                           className="w-full h-20 bg-slate-50 border-[3px] border-slate-100 rounded-3xl px-8 font-black text-xl focus:outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
                         />
                      </div>
                      <div className="max-h-[350px] overflow-y-auto pr-3 space-y-3 custom-scrollbar">
                        {filteredCities.map(city => (
                          <button
                            key={city.name}
                            onClick={() => handleManualLocationSelect(city.name)}
                            className="w-full p-6 bg-white hover:bg-primary/5 border-2 border-slate-50 rounded-3xl text-left font-[1000] text-slate-700 hover:text-primary transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                          >
                            <span className="text-xl uppercase italic">{city.name}</span>
                            <ChevronRight size={24} className="text-slate-200 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => setShowManualLocation(!showManualLocation)} className="w-full text-center text-sm font-[1000] uppercase tracking-[0.3em] text-slate-300 hover:text-primary transition-colors py-4">
                     {showManualLocation ? 'Use GPS Intelligence' : 'Browse Major Hubs Manually'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'role' && (
              <motion.div key="role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="space-y-4">
                   <h2 className="text-5xl font-[1000] text-slate-900 tracking-tight leading-none uppercase italic">Your Objective</h2>
                   <p className="text-slate-500 text-xl font-semibold">Define your profile to enhance your hub experience.</p>
                </div>

                <div className="grid gap-8">
                  <button onClick={() => handleRoleSelect('buyer')} className="flex items-center gap-10 p-10 bg-white border-[3px] border-slate-100 rounded-[2.5rem] hover:border-primary hover:bg-primary/5 transition-all group text-left shadow-sm hover:shadow-xl hover:-translate-y-1 active:translate-y-0">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary transition-all shadow-2xl">
                       <ShoppingCart size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-[1000] text-slate-900 uppercase italic">Buyer</h3>
                        <p className="text-[11px] font-black text-slate-300 group-hover:text-primary uppercase tracking-[0.3em] mt-2 transition-colors">Acquire Verified Assets</p>
                    </div>
                  </button>

                  <button onClick={() => handleRoleSelect('seller')} className="flex items-center gap-10 p-10 bg-white border-[3px] border-slate-100 rounded-[2.5rem] hover:border-primary hover:bg-primary/5 transition-all group text-left shadow-sm hover:shadow-xl hover:-translate-y-1 active:translate-y-0">
                    <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary transition-all shadow-2xl">
                       <Tag size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-[1000] text-slate-900 uppercase italic">Dealer</h3>
                        <p className="text-[11px] font-black text-slate-300 group-hover:text-primary uppercase tracking-[0.3em] mt-2 transition-colors">Market & Liquidate Stock</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
