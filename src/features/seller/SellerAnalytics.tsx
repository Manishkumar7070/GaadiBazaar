import React from 'react';
import { TrendingUp, Users, MousePointer2, PhoneCall, ArrowUpRight, Zap, Star, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Vehicle } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface SellerAnalyticsProps {
  vehicles: Vehicle[];
  walletBalance?: number;
}

const SellerAnalytics: React.FC<SellerAnalyticsProps> = ({ vehicles, walletBalance = 0 }) => {
  const stats = vehicles.reduce((acc, v) => ({
    views: acc.views + (v.viewsCount || 0),
    clicks: acc.clicks + (v.clicksCount || 0),
    leads: acc.leads + (v.leadsCount || 0),
    premiumCount: acc.premiumCount + (v.listingType !== 'free' ? 1 : 0),
  }), { views: 0, clicks: 0, leads: 0, premiumCount: 0 });

  const totalPossibleViews = vehicles.length * 5000; // Mock target
  const viewsProgress = (stats.views / totalPossibleViews) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wallet & Quick Stats */}
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap size={120} strokeWidth={1} />
          </div>
          <CardContent className="p-8 space-y-6 relative z-10">
            <div className="space-y-1">
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Wallet Balance</p>
              <h2 className="text-4xl font-black">₹{walletBalance.toLocaleString()}</h2>
            </div>
            <div className="flex gap-3">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6">Add Funds</Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl font-bold">Transaction History</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" /> Reach Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500 font-medium">Monthly View Target</span>
                <span className="text-slate-900 font-bold">{stats.views.toLocaleString()} / {totalPossibleViews.toLocaleString()}</span>
              </div>
              <Progress value={viewsProgress} className="h-2 bg-slate-100" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Clicks</p>
                <p className="text-lg font-black text-slate-900">{stats.clicks}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Leads</p>
                <p className="text-lg font-black text-slate-900">{stats.leads}</p>
              </div>
              <div className="bg-primary/5 p-3 rounded-2xl text-center">
                <p className="text-[10px] text-primary font-bold uppercase">CTR</p>
                <p className="text-lg font-black text-primary">
                  {stats.views > 0 ? ((stats.clicks / stats.views) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI & Recommendations */}
      <h3 className="font-bold text-lg px-2">Growth Recommendations</h3>
      <div className="grid grid-cols-1 gap-4">
        {vehicles.filter(v => v.listingType === 'free').slice(0, 2).map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl border border-primary/20 overflow-hidden shrink-0 shadow-sm">
                    <img src={v.images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{v.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <TrendingUp size={12} /> Getting low views ({v.viewsCount})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-primary uppercase">Estimated boost</p>
                        <p className="text-xs font-black text-slate-900">Up to 10x ROI</p>
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-lg px-4 font-bold h-9 w-full sm:w-auto">
                        Boost Listing
                    </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                <ShieldCheck size={32} />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
                <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">Become a Premium Dealer</h4>
                <p className="text-slate-600 text-sm">Join Bihar's fastest-growing car network. Get unlimited listings, premium badges, and trust that drives sales.</p>
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-8 h-12 transition-transform active:scale-95 shadow-lg shadow-amber-500/20">
                Upgrade Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Split */}
      <h3 className="font-bold text-lg px-2">Listing ROI Comparison</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-none shadow-sm border border-slate-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
                    <Star size={16} className="text-amber-500" /> Premium Performance
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <p className="text-3xl font-black text-slate-900">12.4%</p>
                        <p className="text-xs font-bold text-green-500 flex items-center gap-0.5">
                            <TrendingUp size={12} /> +45% avg
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Conversion Rate (Leads/Views)</p>
                </div>
            </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm border border-slate-100">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
                    <Users size={16} /> Free Listings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <p className="text-3xl font-black text-slate-900">2.1%</p>
                        <p className="text-xs font-bold text-slate-400">Standard</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Conversion Rate (Leads/Views)</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerAnalytics;
