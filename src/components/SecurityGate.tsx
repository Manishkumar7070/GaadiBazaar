import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface SecurityGateProps {
  children: React.ReactNode;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [status, setStatus] = useState<'splash' | 'scanning' | 'blocked' | 'success'>('splash');

  const completeVerification = useCallback(() => {
    setStatus('success');
    localStorage.setItem('security_verified', 'true');
    setTimeout(() => setIsVerified(true), 600); 
  }, []);

  const verifyHuman = useCallback(() => {
    const isBot = navigator.webdriver || !navigator.languages?.length;
    
    if (isBot) {
      setStatus('blocked');
    } else {
      setTimeout(() => completeVerification(), 800);
    }
  }, [completeVerification]);

  useEffect(() => {
    const previouslyVerified = localStorage.getItem('security_verified');
    if (previouslyVerified === 'true') {
      setIsVerified(true);
      return;
    }

    const timer = setTimeout(() => {
      setStatus('scanning');
      verifyHuman();
    }, 1000);
    return () => clearTimeout(timer);
  }, [verifyHuman]);

  if (isVerified) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} 
      />
      
      <AnimatePresence mode="wait">
        {status === 'splash' && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <div className="mb-8 relative">
              <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/30 transform rotate-3 relative overflow-hidden group">
                <span className="text-5xl font-black text-blue-600 tracking-tighter relative z-10">O</span>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-black text-white tracking-tighter flex items-center justify-center">
                One<span className="text-blue-500">Dealer</span>
              </h1>
              <div className="mt-6 w-32 h-1 bg-slate-900 rounded-full mx-auto overflow-hidden relative">
                <motion.div 
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-full h-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        {status === 'scanning' && (
          <motion.div 
            key="scanning"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center"
          >
            <div className="relative mb-6">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative z-10 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Security Check</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest">Validating session integrity...</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Verified</h2>
            <p className="text-slate-400 text-sm mt-2">Accessing secure environment...</p>
          </motion.div>
        )}

        {status === 'blocked' && (
          <motion.div 
            key="blocked"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm px-6"
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Access Blocked</h2>
            <p className="text-slate-400 text-sm mb-8">
              Automated behavior detected. For security purposes, this session has been terminated.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="text-red-400 font-bold text-xs uppercase tracking-widest border-b border-red-400/30 pb-1"
            >
              Retry Connection
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SecurityGate;
