import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { PricePoint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PriceHistoryChartProps {
  data: PricePoint[];
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          {format(new Date(label), 'MMM dd, yyyy')}
        </p>
        <p className="text-lg font-black text-primary">
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data, className }) => {
  if (!data || data.length === 0) return null;

  // Calculate price change
  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const priceDiff = lastPrice - firstPrice;
  const percentChange = ((priceDiff / firstPrice) * 100).toFixed(1);
  const isDown = priceDiff < 0;

  return (
    <Card className={cn("rounded-[2rem] border-none shadow-sm bg-white overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <TrendingUp size={24} className="text-primary" />
            Market Price History
          </CardTitle>
          <div className={cn(
            "flex items-center gap-1 font-black px-3 py-1 rounded-full text-xs",
            isDown ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {isDown ? "▼" : "▲"} {Math.abs(Number(percentChange))}% {isDown ? "Market Drop" : "Increase"}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                hide 
                domain={['dataMin - 10000', 'dataMax + 10000']}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0F172A', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="var(--color-primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                <Info size={16} />
            </div>
            <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">Price Trend Insight</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                    {isDown 
                      ? "The price for this model has decreased over the last few months. This is a great time to buy based on current market trends."
                      : "Market demand for this brand is increasing. Buying now could preserve your resale value better than typical market depreciation."}
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceHistoryChart;
