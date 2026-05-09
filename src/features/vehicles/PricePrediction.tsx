import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Info, Loader2 } from 'lucide-react';
import { aiPredictionService } from '@/services/aiPredictionService';
import { Vehicle } from '@/types';
import { motion, AnimatePresence } from 'motion/react';

interface PricePredictionProps {
  vehicle: Vehicle;
}

const PricePrediction = ({ vehicle }: PricePredictionProps) => {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await aiPredictionService.predictPrice({
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        kilometers_driven: vehicle.kilometersDriven,
        fuel_type: vehicle.fuelType,
        transmission: vehicle.transmission,
      });
      setPrediction(res);
    } catch (error) {
      console.error('Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-indigo-50 to-blue-50 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles size={120} className="text-indigo-600" />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
           <Badge className="bg-indigo-600 text-white border-none py-1 px-3 rounded-full font-black text-[10px] uppercase tracking-widest">AI Power</Badge>
           <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Price Prediction</CardTitle>
        </div>
        <CardDescription className="text-slate-500 font-medium italic">
          Advanced ML model prediction for {vehicle.city} market.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        {!prediction && !loading && (
          <div className="py-2">
            <Button 
              onClick={handlePredict}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-black uppercase tracking-widest shadow-lg shadow-indigo-200"
            >
              Get AI Valuation
            </Button>
            <p className="text-[10px] text-slate-400 text-center mt-3 font-bold uppercase tracking-tight">Takes about 3-5 seconds</p>
          </div>
        )}

        {loading && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-xs font-black uppercase text-indigo-900 animate-pulse tracking-widest">Analyzing Market Trends...</p>
          </div>
        )}

        <AnimatePresence>
          {prediction && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fair Market Price</p>
                    <p className="text-3xl font-black text-indigo-600">₹{prediction.estimatedPrice.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
                    <p className="text-lg font-black text-slate-900">{prediction.confidence}%</p>
                  </div>
                </div>
                
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.confidence}%` }}
                    className="h-full bg-indigo-600"
                  />
                </div>

                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Range: ₹{prediction.rangeMin.toLocaleString()}</span>
                  <span>₹{prediction.rangeMax.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-indigo-100/50 p-4 rounded-2xl">
                <TrendingUp size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-indigo-900 leading-relaxed italic">
                  "{prediction.reasoning}"
                </p>
              </div>

              <p className="text-[9px] text-slate-400 text-center uppercase font-bold tracking-tighter">
                *Prediction is an estimate only. Actual value may vary.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default PricePrediction;
