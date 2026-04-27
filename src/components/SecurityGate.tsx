import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldAlert, Loader2, Lock, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface SecurityGateProps {
  children: React.ReactNode;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [status, setStatus] = useState<'scanning' | 'challenge' | 'blocked' | 'success'>('scanning');
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [botScore, setBotScore] = useState(0);

  const verifyHuman = useCallback(() => {
    // Basic bot detection heuristics
    let score = 0;
    if (navigator.webdriver) score += 50;
    if (!navigator.languages || navigator.languages.length === 0) score += 30;
    if (window.innerWidth === 0 || window.innerHeight === 0) score += 20;
    
    setBotScore(score);
    
    if (score >= 80) {
      setStatus('blocked');
    } else {
      setTimeout(() => setStatus('challenge'), 1500);
    }
  }, []);

  useEffect(() => {
    verifyHuman();
  }, [verifyHuman]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHolding && status === 'challenge') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus('success');
            setTimeout(() => setIsVerified(true), 800);
            return 100;
          }
          return prev + 2;
        });
      }, 20);
    } else {
      setProgress((prev) => Math.max(0, prev - 5));
    }
    return () => clearInterval(interval);
  }, [isHolding, status]);

  if (isVerified) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center overflow-hidden font-sans">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} 
      />
      
      <AnimatePresence mode="wait">
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

        {status === 'challenge' && (
          <motion.div 
            key="challenge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm w-full px-6 text-center"
          >
            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShieldCheck className="w-10 h-10 text-blue-400 relative z-10" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Verify You Are Human</h2>
            <p className="text-slate-400 text-sm mb-12">Press and hold the button below to confirm your identity and prevent bot activity.</p>
            
            <div className="relative group">
              <button
                onMouseDown={() => setIsHolding(true)}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={() => setIsHolding(true)}
                onTouchEnd={() => setIsHolding(false)}
                className={cn(
                  "w-full py-6 rounded-2xl font-bold text-lg select-none transition-all duration-300 relative overflow-hidden",
                  isHolding ? "bg-blue-600 scale-[0.98]" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-blue-500 transition-all duration-75" 
                  style={{ width: `${progress}%` }} 
                />
                <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                  {isHolding ? (
                    <>Verifying {progress}%</>
                  ) : (
                    <>
                      <MousePointer2 className="w-4 h-4" />
                      Hold to Verify
                    </>
                  )}
                </span>
              </button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <Lock className="w-3 h-3" />
              Secured by AsOne Shield
            </div>
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
