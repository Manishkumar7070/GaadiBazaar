import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Shield, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Zap,
  Crown,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { vehicleService } from '@/services/vehicle.service';
import { paymentService } from '@/services/payment.service';
import { PRICING, PRICING_TIERS } from '@/constants/pricing';
import { ListingType } from '@/types';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLAN_ICONS = {
  free: <CheckCircle2 className="text-green-500" />,
  premium: <TrendingUp className="text-blue-500" />,
  featured: <Zap className="text-amber-500" />,
  sponsored: <Crown className="text-primary" />,
};

const Payment: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vehicleId = searchParams.get('vehicleId');
  const plan = (searchParams.get('plan') || 'free') as ListingType;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: Method, 2: Done

  const planInfo = PRICING_TIERS.VEHICLES.find(p => p.type === plan);
  const price = PRICING[plan];

  useEffect(() => {
    if (!vehicleId) {
      navigate('/list-vehicle');
    }

    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [vehicleId, navigate]);

  const handlePayment = async () => {
    if (!user || !vehicleId || !planInfo) return;
    
    setIsProcessing(true);
    
    try {
      const idToken = await (user as any).getIdToken();
      
      // 1. Create Order on Backend
      const order = await paymentService.createRazorpayOrder({
        vehicleId,
        amount: price,
        listingType: plan,
        idToken
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "AsOneDealer",
        description: `${plan.toUpperCase()} Listing for Vehicle`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            setIsProcessing(true);
            logger.info('Razorpay payment successful, verifying...', { data: response });
            
            // 3. Verify Payment on Backend
            const success = await paymentService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              vehicleId,
              amount: price,
              idToken
            });

            if (success) {
              setIsSuccess(true);
              setStep(2);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            logger.error('Error during payment verification', { data: err });
            alert('An error occurred during verification.');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.fullName,
          email: user.email,
        },
        theme: {
          color: "#ea580c", // matches primary orange-600
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      logger.error('Razorpay initialization failed', { data: error });
      alert(error.message || 'Payment initialization failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!planInfo) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <Helmet>
        <title>Secure Payment | A-One Dealer</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-[1000] uppercase tracking-tighter italic text-slate-900 leading-none">
                Secure <span className="text-primary italic">Checkout</span>
              </h1>
              <p className="text-slate-500 mt-2 font-medium">Activate your listing and get maximum reach.</p>
            </motion.div>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="payment-methods"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black uppercase tracking-widest text-slate-400">Payment Method</span>
                        <div className="flex gap-2">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-6 border-2 border-primary bg-primary/5 rounded-3xl flex items-center gap-4 group cursor-pointer relative overflow-hidden transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <CreditCard size={24} />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-slate-900">Card / UPI / NetBanking</p>
                            <p className="text-xs text-slate-500 font-medium">Fast & Secure via Razorpay</p>
                          </div>
                          <CheckCircle2 className="text-primary" size={24} />
                        </div>

                        <div className="p-6 border border-slate-100 bg-slate-50 opacity-60 rounded-3xl flex items-center gap-4 grayscale">
                          <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500">
                            <CreditCard size={24} />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-slate-600">Other Wallets</p>
                            <p className="text-xs text-slate-400 font-medium">Coming soon</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button 
                          className="w-full h-16 bg-slate-900 hover:bg-slate-800 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 group"
                          onClick={handlePayment}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="animate-spin mr-2" />
                          ) : (
                            <>
                              Pay ₹{price.toLocaleString()}
                              <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-center gap-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 pt-2">
                        <div className="flex items-center gap-1">
                          <Shield size={14} className="text-green-500" />
                          SSL Secure
                        </div>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <div className="flex items-center gap-1">
                          <ShieldCheck size={14} className="text-green-500" />
                          Fraud Protection
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center"
                >
                  <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white p-12">
                    <CardContent className="space-y-6">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce-slow">
                        <CheckCircle2 size={48} />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">
                          Payment <span className="text-green-600">Successful!</span>
                        </h2>
                        <p className="text-slate-500 font-medium">Your vehicle is now live and getting views.</p>
                      </div>

                      <div className="flex flex-col gap-3 pt-6">
                        <Button 
                          className="w-full h-14 bg-slate-900 rounded-2xl font-black uppercase tracking-widest"
                          onClick={() => navigate('/seller-dashboard')}
                        >
                          Go to Dashboard
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full h-14 font-black uppercase tracking-widest text-slate-500"
                          onClick={() => navigate('/')}
                        >
                          Continue Browsing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Area: Order Summary */}
          <div className="w-full md:w-[320px] shrink-0 space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
              <CardContent className="p-8 space-y-6">
                <div>
                  <Badge className="bg-primary/20 text-primary border-none h-6 uppercase font-black text-[10px] tracking-widest mb-4">
                    Order Summary
                  </Badge>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                      {PLAN_ICONS[plan]}
                    </div>
                    <div>
                      <p className="font-black text-lg leading-tight uppercase italic">{planInfo.name}</p>
                      <p className="text-xs text-white/50 font-medium">Listed for {planInfo.duration}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  {planInfo.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      <span className="text-xs text-white/70 font-bold uppercase tracking-wider">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white/50 uppercase tracking-widest">
                    <span>Base Price</span>
                    <span>₹{price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-white/50 uppercase tracking-widest">
                    <span>GST (18%)</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-primary">Total Payable</span>
                    <span className="text-2xl font-[1000] italic">₹{price.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-[2.5rem] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Time Sensitive</p>
                  <p className="text-sm text-slate-800 font-bold mt-1">Payment links expire in 15 minutes for your security.</p>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Payment;
