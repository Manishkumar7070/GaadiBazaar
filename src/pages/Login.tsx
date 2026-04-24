import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, ShieldCheck, ArrowRight, Loader2, User, ShoppingCart, Tag, Phone, MapPin, Camera, Mic, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { motion, AnimatePresence } from 'motion/react';

const LoginPage = () => {
  const { user, loginWithGoogle, completeProfile, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<'login' | 'otp' | 'permissions' | 'role' | 'profile'>('login');
  const [loading, setLoading] = useState(false);
  
  // Login fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const redirect = searchParams.get('redirect') || '/';
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (user && user.isProfileComplete) {
      navigate(redirect);
    } else if (user && !user.isProfileComplete) {
      setStep('role');
    }
  }, [user, navigate, redirect]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setLoading(true);
    try {
      await sendOtp(email);
      setStep('otp');
      setCountdown(60);
    } catch (error: any) {
      console.error('Supabase Email Auth Error:', error);
      alert(`Failed to send code: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    try {
      await verifyOtp(email, otp);
      // Wait a bit for onAuthStateChange to fire and update user state
      // profile completion will be handled by useEffect
    } catch (error: any) {
      console.error('OTP Verify Error:', error);
      alert(`Invalid code: ${error.message || 'Please try again'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Google Login Error:', error);
      alert(`Failed to login with Google: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    
    setLoading(true);
    try {
      await sendOtp(email);
      setCountdown(60);
      alert('Code resent successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: 'buyer' | 'seller') => {
    setLoading(true);
    try {
      await completeProfile({ role, fullName });
      if (role === 'seller') {
        setStep('permissions');
      } else {
        navigate(redirect);
      }
    } catch (error) {
      console.error('Role Selection Error:', error);
      alert('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionsDone = () => {
    navigate(redirect);
  };

  const getReasonMessage = () => {
    switch (reason) {
      case 'save_search': return 'Log in to save your searches.';
      case 'list_vehicle': return 'Log in to sell your vehicle.';
      case 'favorite_vehicle': return 'Log in to save favorites.';
      case 'contact_seller': return 'Log in to contact sellers.';
      default: return 'Join India\'s most trusted vehicle marketplace.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50/50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center space-y-2"
        >
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-2">
            <Logo iconSize={32} fontSize="text-xl" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Welcome to <span className="text-primary">AsOneDealer</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-[280px]">
            {getReasonMessage()}
          </p>
        </motion.div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-primary/5 overflow-hidden bg-white">
          <CardContent className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {step === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <form onSubmit={handleContinue} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                          type="text" 
                          placeholder="Enter your name" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary transition-all text-lg font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                          type="email" 
                          placeholder="Enter your email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary transition-all text-lg font-medium"
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {loading ? <Loader2 className="animate-spin" size={24} /> : 'Continue'}
                    </Button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white px-4 text-slate-400 font-black">Or continue with</span></div>
                  </div>

                  <Button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    variant="outline"
                    className="w-full h-14 rounded-2xl border-2 border-slate-100 hover:bg-slate-50 text-slate-700 font-bold text-lg flex gap-3 transition-all"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Google
                  </Button>
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
                    <h2 className="text-xl font-bold">Verify your email</h2>
                    <p className="text-sm text-slate-500">Enter the 6-digit code sent to {email}</p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">One-Time Password</label>
                      <Input 
                        type="text" 
                        placeholder="000000" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        required
                        className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary transition-all text-3xl font-black text-center tracking-[0.5em]"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={24} /> : 'Verify & Continue'}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={countdown > 0 || loading}
                        className={cn(
                          "text-sm font-bold transition-colors",
                          countdown > 0 ? "text-slate-300 cursor-not-allowed" : "text-primary hover:underline"
                        )}
                      >
                        {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                      </button>
                    </div>

                    <Button 
                      type="button"
                      variant="ghost"
                      onClick={() => setStep('login')}
                      className="w-full text-slate-400 hover:text-primary"
                    >
                      Change Email Address
                    </Button>
                  </form>
                </motion.div>
              )}

              {step === 'role' && (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-xl font-bold text-center mb-6">How would you like to use AsOneDealer?</h2>
                  <button
                    onClick={() => handleRoleSelect('buyer')}
                    className="w-full group p-6 rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <ShoppingCart size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900">I want to Buy</h3>
                      <p className="text-sm text-slate-500">Find your dream vehicle</p>
                    </div>
                    <ArrowRight className="text-slate-300 group-hover:text-primary transition-colors" size={20} />
                  </button>
                  <button
                    onClick={() => handleRoleSelect('seller')}
                    className="w-full group p-6 rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                      <Tag size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-slate-900">I want to Sell</h3>
                      <p className="text-sm text-slate-500">List and sell quickly</p>
                    </div>
                    <ArrowRight className="text-slate-300 group-hover:text-primary transition-colors" size={20} />
                  </button>
                </motion.div>
              )}

              {step === 'permissions' && (
                <motion.div
                  key="permissions"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8 text-center"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Enable Permissions</h2>
                    <p className="text-slate-500">We need these to provide the best experience for buying and selling.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { icon: MapPin, label: 'Location', desc: 'To find vehicles near you' },
                      { icon: Camera, label: 'Camera', desc: 'To take photos of your vehicle' },
                      { icon: Mic, label: 'Microphone', desc: 'For voice search and support' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl text-left">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                          <item.icon size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                        <CheckCircle2 className="ml-auto text-green-500" size={20} />
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handlePermissionsDone}
                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg shadow-xl"
                  >
                    Get Started
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center space-y-4">
              <p className="text-[11px] text-slate-400 leading-relaxed px-4">
                By continuing, you agree to our <span className="text-primary font-bold cursor-pointer hover:underline">Terms of Service</span> and <span className="text-primary font-bold cursor-pointer hover:underline">Privacy Policy</span>.
              </p>
              <div className="flex items-center justify-center gap-2 opacity-30 grayscale">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Secure & Verified</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
