import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Mail, ShieldCheck, ArrowRight, Loader2, User, ShoppingCart, Tag, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

const LoginPage = () => {
  const { user, login, sendOtp, completeProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'role' | 'profile'>('email');
  const [loading, setLoading] = useState(false);
  
  // Profile fields
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const redirect = searchParams.get('redirect') || '/';
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (user && user.isProfileComplete) {
      navigate(redirect);
    } else if (user && !user.isProfileComplete) {
      setStep('role');
    }
  }, [user, navigate, redirect]);

  const getReasonMessage = () => {
    if (step === 'role') return 'Help us personalize your experience. Are you here to buy or sell?';
    if (step === 'profile') return 'Just a few more details to get you started.';
    
    switch (reason) {
      case 'save_search':
        return 'Please log in to save your search filters and get notified of new listings.';
      case 'list_vehicle':
        return 'You need to be logged in to list your vehicle for sale on AsOneDealer.';
      case 'favorite_vehicle':
        return 'Log in to save this vehicle to your favorites and track price drops.';
      case 'contact_seller':
        return 'Please log in to view the seller\'s contact details and start a conversation.';
      case 'profile':
        return 'Please log in to view your profile and managed your listings.';
      default:
        return 'Log in to access all features of AsOneDealer.';
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      await sendOtp(email);
      setStep('otp');
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setLoading(true);
    try {
      const userData = await login(email, otp);
      if (userData.isProfileComplete) {
        navigate(redirect);
      } else {
        setStep('role');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: 'buyer' | 'seller') => {
    setSelectedRole(role);
    if (role === 'buyer') {
      setStep('profile');
    } else {
      setLoading(true);
      try {
        await completeProfile({ role: 'seller' });
        navigate(redirect);
      } catch (error) {
        alert('Failed to set role. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !fullName || !phone) return;

    setLoading(true);
    try {
      await completeProfile({
        role: selectedRole,
        fullName: fullName,
        phone: phone,
      });
      navigate(redirect);
    } catch (error) {
      alert('Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-primary transition-all"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 flex gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><Mail size={20} /> Send OTP</>}
            </Button>
          </form>
        );
      case 'otp':
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enter 6-digit OTP</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  type="text" 
                  placeholder="000000" 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-primary transition-all tracking-[0.5em] font-mono text-lg"
                />
              </div>
              <p className="text-xs text-slate-400 text-center">We've sent a code to {email}</p>
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 flex gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><LogIn size={20} /> Verify & Login</>}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setStep('email')}
              className="w-full h-12 rounded-xl text-slate-500 hover:text-primary"
            >
              Change Email
            </Button>
          </form>
        );
      case 'role':
        return (
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleRoleSelect('buyer')}
              className="group p-6 rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                <ShoppingCart size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg">I want to Buy</h3>
                <p className="text-sm text-slate-500">Browse and purchase vehicles</p>
              </div>
              <ArrowRight className="ml-auto text-slate-300 group-hover:text-primary transition-colors" size={20} />
            </button>
            <button
              onClick={() => handleRoleSelect('seller')}
              className="group p-6 rounded-3xl border-2 border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                <Tag size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg">I want to Sell</h3>
                <p className="text-sm text-slate-500">List and sell your vehicles</p>
              </div>
              <ArrowRight className="ml-auto text-slate-300 group-hover:text-primary transition-colors" size={20} />
            </button>
          </div>
        );
      case 'profile':
        return (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  type="text" 
                  placeholder="John Doe" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  type="tel" 
                  placeholder="+91 98765 43210" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="pl-12 h-14 rounded-2xl border-slate-100 focus:border-primary transition-all"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Sign Up'}
            </Button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
        <CardHeader className="bg-primary text-white p-8 space-y-4">
          <div className="w-auto h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md px-6">
            <Logo variant="light" fontSize="text-2xl" iconSize={28} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {step === 'role' ? 'Choose Your Path' : step === 'profile' ? 'Complete Profile' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-white/80">
              {getReasonMessage()}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          {renderStep()}

          <div className="pt-4 border-t border-slate-50">
            <div className="flex items-center justify-center py-2">
              <Logo fontSize="text-lg" iconSize={20} />
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">
              By continuing, you agree to our <span className="text-primary font-medium cursor-pointer">Terms of Service</span> and <span className="text-primary font-medium cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
