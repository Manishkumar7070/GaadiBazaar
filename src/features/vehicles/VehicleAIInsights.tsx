import React from 'react';
import { Vehicle } from '@/types';
import { vehicleAiService, VehicleAIInsight, VehicleAnalysis } from '@/services/vehicleAi.service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, ShieldCheck, AlertCircle, TrendingDown, Wrench, BarChart3, Camera, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface VehicleAIInsightsProps {
  vehicle: Vehicle;
}

const VehicleAIInsights: React.FC<VehicleAIInsightsProps> = ({ vehicle }) => {
  const [analysis, setAnalysis] = React.useState<VehicleAnalysis | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const data = await vehicleAiService.getVehicleInsights(vehicle);
        setAnalysis(data);
      } catch (error) {
        console.error('Error loading AI insights:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [vehicle.id]);

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm font-bold uppercase tracking-widest">Generating AI Insights...</p>
      </div>
    );
  }

  if (!analysis) return null;

  const IconMap = {
    condition: ShieldCheck,
    price: TrendingDown,
    value: Sparkles,
    maintenance: Wrench,
    visual: Camera
  };

  const ColorMap = {
    success: 'bg-green-50 text-green-700 border-green-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-red-50 text-red-700 border-red-100'
  };

  const { insights, estimation, visualAnalysis } = analysis;

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          <Sparkles size={24} className="animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">AI Expert Analysis</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Vision-powered vehicle audit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Estimation Section */}
        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BarChart3 size={120} strokeWidth={1} />
          </div>
          <CardContent className="p-6 relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="text-primary" size={20} />
                <h3 className="font-black uppercase tracking-tight text-sm">Market Value Estimate</h3>
              </div>
              <Badge className="bg-primary/20 text-primary border-none text-[10px] uppercase font-black">
                {estimation.confidence}% Confidence
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black tracking-tighter">
                ₹{estimation.minPrice.toLocaleString()} - ₹{estimation.maxPrice.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 font-medium">Estimated fair market value</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex gap-3">
                <Info size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-slate-300 italic font-medium">
                  {estimation.reasoning}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Inspection Section */}
        {visualAnalysis && (
          <Card className="border-none shadow-sm bg-white border border-slate-100 overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="text-slate-900" size={20} />
                  <h3 className="font-black uppercase tracking-tight text-sm text-slate-900">Visual Condition Audit</h3>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-green-500 rounded-full" 
                       style={{ width: `${visualAnalysis.conditionScore}%` }}
                     />
                   </div>
                   <span className="text-xs font-black text-slate-900">{visualAnalysis.conditionScore}/100</span>
                </div>
              </div>

              <div className="space-y-3">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identified Visual Notes:</p>
                 {visualAnalysis.identifiedIssues.length > 0 ? (
                   <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {visualAnalysis.identifiedIssues.map((issue, i) => (
                       <li key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                         {issue}
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="text-sm text-green-600 font-bold italic">No major visual defects detected from images.</p>
                 )}
              </div>
              
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={10} /> Image analysis processed by Gemini Vision
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, idx) => {
          const Icon = IconMap[insight.type as keyof typeof IconMap] || AlertCircle;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={cn("border-none shadow-sm h-full group transition-all hover:shadow-md", ColorMap[insight.severity])}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/50 rounded-lg group-hover:scale-110 transition-transform">
                      <Icon size={18} />
                    </div>
                    <h3 className="font-black text-xs uppercase tracking-tight">{insight.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90 font-medium italic">
                    {insight.message}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default VehicleAIInsights;
