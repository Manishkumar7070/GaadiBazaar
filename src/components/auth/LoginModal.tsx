import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Mail, Key, Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { sendOtp, login } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendOtp(email);
      setStep('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, code);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setEmail('');
    setCode('');
    setStep('email');
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        reset();
      }
    }}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === 'email' ? 'Welcome to GaadiBazaar' : 'Verify your email'}
          </DialogTitle>
          <DialogDescription>
            {step === 'email' 
              ? 'Enter your email to receive a one-time password (OTP).' 
              : `We've sent a 6-digit code to ${email}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={step === 'email' ? handleSendOtp : handleVerifyOtp} className="space-y-4 py-4">
          {step === 'email' ? (
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 rounded-xl h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="pl-10 rounded-xl h-12 tracking-[0.5em] text-center font-bold"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              step === 'email' ? 'Send OTP' : 'Verify & Login'
            )}
          </Button>

          {step === 'code' && (
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-slate-500"
              onClick={() => setStep('email')}
              disabled={loading}
            >
              Change Email
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
