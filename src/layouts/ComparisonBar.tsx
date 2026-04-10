import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComparison } from '@/hooks/useComparison';
import { motion, AnimatePresence } from 'motion/react';

const ComparisonBar = () => {
  const { selectedVehicles, removeFromComparison, clearComparison } = useComparison();
  const navigate = useNavigate();

  if (selectedVehicles.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl"
      >
        <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 border border-white/10">
          <div className="flex items-center gap-4 flex-1 overflow-hidden">
            <div className="hidden sm:flex items-center gap-2 text-primary">
              <ArrowLeftRight size={20} />
              <span className="font-bold text-sm uppercase tracking-wider">Compare</span>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {selectedVehicles.map((vehicle) => (
                <div key={vehicle.id} className="relative flex-shrink-0">
                  <img 
                    src={vehicle.images[0]} 
                    alt="" 
                    className="w-10 h-10 rounded-lg object-cover border border-white/20"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => removeFromComparison(vehicle.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px]"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {Array.from({ length: 4 - selectedVehicles.length }).map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/20">
                  <Plus size={14} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate('/compare')}
              disabled={selectedVehicles.length < 2}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold px-6"
            >
              Compare {selectedVehicles.length >= 2 && `(${selectedVehicles.length})`}
              <ChevronRight size={18} className="ml-1" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearComparison}
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-full"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default ComparisonBar;
