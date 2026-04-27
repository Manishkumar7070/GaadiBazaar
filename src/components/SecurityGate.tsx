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
  const [botScore, setBotScore] = useState(0);

  const completeVerification = useCallback(() => {
    setStatus('success');
    localStorage.setItem('security_verified', 'true');
    setTimeout(() => setIsVerified(true), 600); // Shorter duration
  }, []);

  const verifyHuman = useCallback(() => {
    // Basic bot detection
    const isBot = navigator.webdriver || !navigator.languages?.length;
    
    if (isBot) {
      setStatus('blocked');
    } else {
      // Automate the "success" after a very brief scanning period
      setTimeout(() => completeVerification(), 800);
    }
  }, [completeVerification]);

  useEffect(() => {
    // Check for previous verification
    const previouslyVerified = localStorage.getItem('security_verified');
    if (previouslyVerified === 'true') {
      setIsVerified(true);
      return;
    }

    // Show splash screen for 1 second then start scanning
    const timer = setTimeout(() => {
      setStatus('scanning');
      verifyHuman();
    }, 1000);
    return () => clearTimeout(timer);
  }, [verifyHuman]);

  if (isVerified) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center overflow-hidden font-sans">
      {/* Background Grid Pattern */}
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
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-8 relative"
            >
              <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/30 transform rotate-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-50" />
                <span className="text-5xl font-black text-blue-600 tracking-tighter relative z-10">O</span>
                <div className="absolute top-0 right-0 p-2 opacity-10">
                   <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-6 border border-blue-500/10 rounded-full"
              />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-10 border border-blue-500/5 rounded-full border-dashed"
              />
            </motion.div>
            <div className="text-center">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-black text-white tracking-tighter flex items-center justify-center"
              >
                One<span className="text-blue-500">Dealer</span>
              </motion.h1>
              <div className="mt-6 w-32 h-1 bg-slate-900 rounded-full mx-auto overflow-hidden relative">
                <motion.div 
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-full h-full"
                />
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[8px] text-blue-500/50 font-bold uppercase tracking-[0.2em] mt-3"
              >
                Syncing Engine...
              </motion.p>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-6"
            >
              Automotive Intelligence
            </motion.p>
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
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
              >
                <ShieldCheck className="w-12 h-12 text-green-500" />
              </motion.div>
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
