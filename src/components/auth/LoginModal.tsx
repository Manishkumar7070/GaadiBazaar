import { useState, FormEvent, useEffect, useRef } from 'react';
import { 
  X, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  Mail,
  Phone,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  sendPasswordResetEmail, 
  signInWithEmailAndPassword 
} from '@/lib/firebase';
import { ConfirmationResult } from 'firebase/auth';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  trigger?: React.ReactElement;
  redirectPath?: string;
}

const LoginModal = ({ isOpen, onClose, trigger, redirectPath = '/' }: LoginModalProps) => {
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'login' | 'otp' | 'reset-password'>('login');
  
  // Phone Login State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Email Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter valid mobile number');
      return;
    }

    setLoading(true);
    try {
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container-modal', {
          'size': 'invisible'
        });
      }
      const verifier = recaptchaVerifier.current;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      setStep('otp');
    } catch (error: any) {
      logger.error('Modal OTP Error', { data: error });
      setError(error.message || 'Failed to send OTP. Please check the number.');
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
      if (onClose) onClose();
      navigate(redirectPath);
    } catch (error: any) {
      setError('Invalid OTP code. Please try again.');
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
      await signInWithEmailAndPassword(auth, email, password);
      if (onClose) onClose();
      navigate(redirectPath);
    } catch (error: any) {
      setError('Invalid email or password. Please try again.');
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
      await sendPasswordResetEmail(auth, email);
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

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setPhoneNumber(cleaned);
      if (cleaned.length === 10) setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl">
        <div id="recaptcha-container-modal"></div>
        <div className="flex flex-col md:flex-row min-h-[460px]">
          {/* Left Column - Minimalist Illustration */}
          <div className="hidden md:flex w-[32%] bg-[#F3F4F6] relative items-center justify-center p-0 overflow-hidden">
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[280px]">
                {/* Background Accent */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-white shadow-sm opacity-60" />
                
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

          {/* Right Column - Form Area */}
          <div className="flex-1 p-6 md:p-8 lg:p-10 relative bg-white flex flex-col justify-center">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-slate-900 transition-colors rounded-full"
            >
              <X size={20} />
            </button>

            <div className="max-w-[340px] mx-auto w-full space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-[#2D3436] tracking-tight">
                  {step === 'reset-password' ? 'Reset Password' : 'Login or Register'}
                </h2>
                <p className="text-[#5F6368] text-sm font-medium leading-relaxed">
                  {step === 'reset-password' 
                    ? 'Enter your email to receive a password reset link' 
                    : 'Access your orders, track progress & updates'}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {step === 'login' ? (
                  <motion.div 
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Method Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                      <button 
                        onClick={() => setAuthMethod('phone')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                          authMethod === 'phone' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        <Phone size={14} /> Phone
                      </button>
                      <button 
                        onClick={() => setAuthMethod('email')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
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
                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[#A0AEC0] mb-0.5 leading-none">
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
                            <p className="text-[#FF5A3C] text-[11px] font-bold pl-1">{error}</p>
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
                      <form onSubmit={handleEmailLogin} className="space-y-4">
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
                          <div className="flex justify-end">
                            <button 
                              type="button"
                              onClick={() => setStep('reset-password')}
                              className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
                            >
                              Forgot Password?
                            </button>
                          </div>
                        </div>

                        {error && (
                          <p className="text-[#FF5A3C] text-[11px] font-bold pl-1">{error}</p>
                        )}

                        <Button 
                          type="submit"
                          disabled={loading || !email || !password}
                          className={cn(
                            "w-full h-16 rounded-3xl font-bold text-lg transition-all shadow-none mt-2",
                            (email && password) ? "bg-[#FF5A3C] hover:bg-[#E64A2E] text-white" : "bg-[#E2E8F0] text-white pointer-events-none"
                          )}
                        >
                          {loading ? <Loader2 className="animate-spin text-white" /> : 'Login'}
                        </Button>
                      </form>
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
                ) : step === 'otp' ? (
                  <motion.form 
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                       <p className="text-sm font-bold text-slate-500">
                         Verify OTP sent to <span className="text-slate-900">+91 {phoneNumber}</span>
                       </p>
                       <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otp}
                          onChange={(val) => setOtp(val)}
                        >
                          <InputOTPGroup className="gap-2 sm:gap-2">
                             <InputOTPSlot index={0} className="w-10 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                             <InputOTPSlot index={1} className="w-10 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                             <InputOTPSlot index={2} className="w-10 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                             <InputOTPSlot index={3} className="w-10 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                             <InputOTPSlot index={4} className="w-10 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                             <InputOTPSlot index={5} className="w-10 h-14 sm:w-12 sm:h-16 text-xl sm:text-2xl font-bold rounded-2xl border-2 bg-slate-50 border-slate-100 data-[active=true]:border-[#FF5A3C] data-[active=true]:ring-0 transition-all" />
                          </InputOTPGroup>
                        </InputOTP>
                       </div>
                       {error && <p className="text-[#FF5A3C] text-[13px] font-semibold text-center">{error}</p>}
                    </div>

                    <Button 
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className="w-full h-16 rounded-[2rem] bg-primary text-secondary font-black text-lg shadow-xl shadow-primary/20"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'Verify Identity'}
                    </Button>

                    <button 
                      type="button" 
                      onClick={() => setStep('login')}
                      className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={16} /> Back to Login
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="space-y-6"
                  >
                    <form onSubmit={handlePasswordReset} className="space-y-6">
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
                          "w-full h-16 rounded-3xl font-bold text-lg transition-all shadow-none",
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
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
