import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  CreditCard,
  CheckCircle2,
  Lock,
  Zap,
  Car
} from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import { Vehicle } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface BookingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle;
  userId: string;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  vehicle, 
  userId,
  onSuccess
}) => {
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const bookingFee = 5000;

  const handleBooking = async () => {
    setIsProcessing(true);
    // Simulate payment delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      await bookingService.createBooking({
        vehicleId: vehicle.id,
        userId,
        amount: bookingFee,
        appointmentDate: date,
        appointmentTime: time
      });
      setStep('success');
      onSuccess();
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('details');
      setDate('');
      setTime('');
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">Book this Car</DialogTitle>
                <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                  Secure your appointment for ₹{bookingFee.toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="bg-slate-50 rounded-3xl p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Vehicle</span>
                  <span className="text-sm font-black text-slate-900">{vehicle.brand} {vehicle.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Price</span>
                  <span className="text-sm font-black text-slate-900">₹{vehicle.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-900 uppercase">Commitment Fee</span>
                  <span className="text-lg font-black text-primary">₹{bookingFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preferred Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      type="date" 
                      className="pl-10 rounded-xl border-slate-100 focus:ring-primary"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preferred Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      type="time" 
                      className="pl-10 rounded-xl border-slate-100 focus:ring-primary"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4">
                <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                   <Zap size={14} className="text-blue-600" /> What You Get When You Book
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#1E1E1E] p-4 rounded-xl text-white space-y-1">
                    <div className="flex items-center gap-2 opacity-50">
                      <Car size={12} />
                      <span className="text-[8px] font-black uppercase">THE CAR</span>
                    </div>
                    <p className="font-black text-sm">{vehicle.brand} {vehicle.model}</p>
                    <p className="text-[10px] font-bold opacity-40">Everything you need</p>
                  </div>

                  <div className="bg-[#E9F0E9] p-4 rounded-xl border border-[#D5E2D5] space-y-1">
                    <div className="flex items-center gap-2 text-[#2E4D2E]/50">
                      <ShieldCheck size={12} />
                      <span className="text-[8px] font-black uppercase">5-YEAR SERVICE</span>
                    </div>
                    <p className="font-black text-sm text-[#2E4D2E]">Monthly Visits</p>
                    <p className="text-[10px] font-[1000] text-emerald-600 uppercase">₹5L Value</p>
                  </div>
                </div>

                <ul className="space-y-2 pt-2 border-t border-blue-100">
                  <li className="flex items-center gap-2 text-[10px] font-bold text-blue-800 uppercase leading-none">
                    <ShieldCheck size={12} /> Contact Info & Showroom Address Revealed
                  </li>
                  <li className="flex items-center gap-2 text-[10px] font-bold text-blue-800 uppercase leading-none">
                    <ShieldCheck size={12} /> Free Mechanical Inspection Support
                  </li>
                </ul>
              </div>

              <Button 
                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest"
                disabled={!date || !time}
                onClick={() => setStep('payment')}
              >
                Proceed to Payment
              </Button>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="text-primary" size={32} />
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tight">Complete Payment</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Secure Gateway • ₹{bookingFee.toLocaleString()}</p>
              </div>

              <div className="space-y-4">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-primary transition-all">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                       <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                       <p className="font-black text-sm uppercase">UPI / GPay / PhonePe</p>
                       <p className="text-[10px] text-slate-400 uppercase font-black">Instant Booking Confirmation</p>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-primary transition-all">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                       <CreditCard className="text-slate-400" size={24} />
                    </div>
                    <div className="flex-1">
                       <p className="font-black text-sm uppercase">Credit / Debit Card</p>
                       <p className="text-[10px] text-slate-400 uppercase font-black">All major cards supported</p>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest" onClick={() => setStep('details')}>Back</Button>
                <Button 
                  className="flex-[2] h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                  onClick={handleBooking}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Pay ₹${bookingFee.toLocaleString()}`}
                </Button>
              </div>

              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 justify-center">
                <Lock size={12} /> SSL Encrypted Secure Transaction
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center space-y-6"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 size={56} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase italic tracking-tight">Booking Confirmed!</h2>
                <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">Your appointment is locked for {date} at {time}</p>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] space-y-3 shadow-2xl">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Steps</p>
                 <p className="text-sm font-bold leading-relaxed">
                    Dealer details and exact location are now visible on the vehicle page. We have also sent details to your phone.
                 </p>
              </div>

              <Button 
                className="w-full h-16 rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest"
                onClick={resetAndClose}
              >
                View Dealer Details
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
