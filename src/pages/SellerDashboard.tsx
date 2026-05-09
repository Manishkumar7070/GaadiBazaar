import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  IndianRupee, 
  Eye, 
  MessageSquare, 
  Plus, 
  Search, 
  Trash2, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Car,
  AlertCircle,
  MapPin,
  Zap,
  Crown,
  Star as StarIcon,
  ShieldCheck
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { vehicleService } from '@/services/vehicle.service';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Vehicle } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const MOCK_STATS_HISTORY = [
  { day: 'Mon', views: 120, leads: 12 },
  { day: 'Tue', views: 150, leads: 15 },
  { day: 'Wed', views: 180, leads: 22 },
  { day: 'Thu', views: 210, leads: 30 },
  { day: 'Fri', views: 190, leads: 25 },
  { day: 'Sat', views: 250, leads: 40 },
  { day: 'Sun', views: 220, leads: 35 },
];

const BOOST_PLANS = [
  {
    id: 'sponsored',
    name: 'Sponsored',
    price: 499,
    duration: '7 Days',
    description: 'Highlighted listing with a special badge and 2x search priority.',
    icon: ShieldCheck,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50'
  },
  {
    id: 'premium',
    name: 'Premium Boost',
    price: 999,
    duration: '7 Days',
    description: 'Appear at the very top of search results and category pages. 5x engagement.',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  {
    id: 'featured',
    name: 'Featured Placement',
    price: 2499,
    duration: '7 Days',
    description: 'Exclusive placement on home page hero carousel and top categories. Max visibility.',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50'
  }
];

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBoostDialogOpen, setIsBoostDialogOpen] = useState(false);
  const [selectedBoost, setSelectedBoost] = useState<string | null>(null);
  const [boostingVehicleId, setBoostingVehicleId] = useState<string | null>(null);
  const [activeBoosts, setActiveBoosts] = useState<Record<string, string>>({});

  const handleBoostClick = (vehicleId: string) => {
    setBoostingVehicleId(vehicleId);
    setIsBoostDialogOpen(true);
  };

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // In a real app, we'd filter by sellerId. For now, mocking seller's cars.
        const allVehicles = await vehicleService.fetchVehicles();
        // Assuming current user owns a subset for demo
        const sellerVehicles = allVehicles.slice(0, 5);
        setVehicles(sellerVehicles);
        
        // Populate active boosts from database
        const boosts: Record<string, string> = {};
        sellerVehicles.forEach(v => {
          if (v.listingType && v.listingType !== 'free') {
            boosts[v.id] = v.listingType;
          }
        });
        setActiveBoosts(boosts);
      } catch (error) {
        console.error('Error fetching seller data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        // Mocking delete
        setVehicles(prev => prev.filter(v => v.id !== id));
      } catch (error) {
        console.error('Delete failed');
      }
    }
  };

  const stats = [
    { 
      label: 'Total Views', 
      value: '14.2k', 
      icon: Eye, 
      trend: '+12%', 
      isPositive: true,
      color: 'blue'
    },
    { 
      label: 'Active Leads', 
      value: '128', 
      icon: MessageSquare, 
      trend: '+18%', 
      isPositive: true,
      color: 'orange'
    },
    { 
      label: 'Estimated Earnings', 
      value: '₹4.2L', 
      icon: IndianRupee, 
      trend: '-2%', 
      isPositive: false,
      color: 'emerald'
    },
    { 
      label: 'Conversion Rate', 
      value: '3.4%', 
      icon: TrendingUp, 
      trend: '+0.5%', 
      isPositive: true,
      color: 'purple'
    }
  ];

  const filteredVehicles = vehicles.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Helmet>
        <title>Seller Dashboard | AsOneDealer</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 md:py-12 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">Seller Central</Badge>
            <h1 className="text-4xl md:text-5xl font-[1000] tracking-tighter italic uppercase leading-none">Dashboard</h1>
            <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Manage your inventory and track performance</p>
          </div>
          <Button 
            onClick={() => navigate('/list-vehicle')}
            className="bg-slate-900 text-white h-14 px-8 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all"
          >
            <Plus size={20} className="mr-2" /> List New Vehicle
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
                <CardContent className="p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors group-hover:scale-110 duration-500",
                      stat.color === 'blue' && "bg-blue-50 text-blue-600",
                      stat.color === 'orange' && "bg-orange-50 text-orange-600",
                      stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
                      stat.color === 'purple' && "bg-purple-50 text-purple-600",
                    )}>
                      <stat.icon size={24} />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-black uppercase tracking-tighter",
                      stat.isPositive ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {stat.trend}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <p className="text-3xl font-[1000] text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 rounded-3xl md:rounded-[3.5rem] border-none shadow-sm bg-white overflow-hidden p-6 md:p-10">
            <CardHeader className="px-0 pt-0 pb-6 md:pb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl md:text-2xl font-black uppercase italic tracking-tight">Lead Activity</CardTitle>
                <CardDescription className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Past 7 days performance</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="rounded-full px-4 h-8 border-slate-100 text-slate-400 font-bold text-[10px] uppercase">Weekly</Badge>
              </div>
            </CardHeader>
            <div className="h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_STATS_HISTORY}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6321" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ff6321" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900, textTransform: 'uppercase', fontSize: 10 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#ff6321" 
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="rounded-3xl md:rounded-[3.5rem] border-none shadow-sm bg-slate-900 text-white p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full -mr-32 -mt-32 opacity-50" />
            <div className="relative space-y-6 md:space-y-8 h-full flex flex-col">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tight">Quick Actions</h3>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest text-[10px]">Efficiency Tools</p>
              </div>
              
              <div className="space-y-3 md:space-y-4 flex-1">
                <Dialog open={isBoostDialogOpen} onOpenChange={setIsBoostDialogOpen}>
                  <DialogTrigger
                    render={
                      <button className="w-full group flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center text-white"><ArrowUpRight size={20} /></div>
                          <div className="text-left">
                            <p className="font-black uppercase tracking-tight text-sm md:text-base">Boost Listings</p>
                            <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">Increase visibility</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
                      </button>
                    }
                  />
                  <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 border-none overflow-hidden bg-white shadow-2xl">
                    <div className="p-8 md:p-12 space-y-8">
                      <div className="space-y-2 text-center">
                        <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full mb-2">Accelerator Program</Badge>
                        <DialogTitle className="text-3xl md:text-4xl font-[1000] italic uppercase tracking-tighter text-slate-900">Boost Your Visibility</DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold uppercase tracking-widest text-xs">Choose a plan to get 10x more leads instantly</DialogDescription>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {BOOST_PLANS.map((plan) => (
                          <div 
                            key={plan.id}
                            onClick={() => setSelectedBoost(plan.id)}
                            className={cn(
                              "relative p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col gap-4 group",
                              selectedBoost === plan.id 
                                ? "border-primary bg-primary/5 shadow-xl scale-[1.02]" 
                                : "border-slate-100 hover:border-slate-200 bg-white"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", plan.bgColor, plan.color)}>
                              <plan.icon size={20} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-black uppercase tracking-tight text-slate-900">{plan.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{plan.duration}</p>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed flex-1">
                              {plan.description}
                            </p>
                            <div className="pt-4 border-t border-slate-50 mt-auto">
                              <p className="text-xl font-black text-slate-900 italic">₹{plan.price}</p>
                            </div>

                            {selectedBoost === plan.id && (
                              <div className="absolute top-4 right-4 text-primary">
                                <Zap size={16} fill="currentColor" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                         <div className="flex-1 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full">
                            <ShieldCheck size={20} className="text-emerald-500" />
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">Safe Transaction</p>
                              <p className="text-[9px] font-bold uppercase text-slate-400">Secure Payment Gateway</p>
                            </div>
                         </div>
                         <Button 
                          className="w-full sm:w-auto h-14 px-12 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl"
                          disabled={!selectedBoost}
                          onClick={async () => {
                            if (boostingVehicleId && selectedBoost) {
                              try {
                                await vehicleService.updateListingType(boostingVehicleId, selectedBoost as any);
                                setActiveBoosts(prev => ({
                                  ...prev,
                                  [boostingVehicleId]: selectedBoost
                                }));
                                alert('Boost activated for vehicle!');
                              } catch (error) {
                                console.error('Failed to boost vehicle:', error);
                                alert('Failed to boost vehicle. please check your database connection.');
                              }
                            }
                            setIsBoostDialogOpen(false);
                            setBoostingVehicleId(null);
                          }}
                         >
                           Boost Now
                         </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <button className="w-full group flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-500 flex items-center justify-center text-white"><Users size={20} /></div>
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm md:text-base">Contact Support</p>
                      <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">Dealer assistance</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
                </button>
              </div>

              <div className="bg-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-primary" />
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary">Verification Needed</p>
                </div>
                <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed">2 listings need engine start video evidence to get the "Verified" badge.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Listings Table */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4">
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Active Listings</h2>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search listings..." 
                className="pl-12 h-12 rounded-2xl border-none shadow-sm bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredVehicles.map((vehicle, idx) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
              >
                <Card className="group rounded-3xl border-none shadow-sm hover:shadow-xl transition-all overflow-hidden bg-white">
                  <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row items-center gap-6">
                    {/* Image */}
                    <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                      <img 
                        src={vehicle.images[0]} 
                        alt={vehicle.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 space-y-2 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-2">{vehicle.verificationStatus}</Badge>
                        {activeBoosts[vehicle.id] && (
                          <Badge className={cn(
                            "border-none font-black text-[9px] uppercase tracking-widest px-2 flex items-center gap-1",
                            activeBoosts[vehicle.id] === 'premium' && "bg-primary/10 text-primary",
                            activeBoosts[vehicle.id] === 'featured' && "bg-amber-50 text-amber-600",
                            activeBoosts[vehicle.id] === 'sponsored' && "bg-indigo-50 text-indigo-600"
                          )}>
                            <Zap size={10} fill="currentColor" /> {activeBoosts[vehicle.id]}
                          </Badge>
                        )}
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{vehicle.id}</span>
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/vehicle/${vehicle.id}`)}>
                        {vehicle.year} {vehicle.brand} {vehicle.title}
                      </h3>
                      <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date().toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> {vehicle.city}</span>
                        <span className="flex items-center gap-1"><Car size={12} /> {vehicle.transmission}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-8 px-8 border-x border-slate-50 hidden lg:flex">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Views</p>
                        <p className="font-black text-xl text-slate-900">{Math.floor(Math.random() * 2000) + 500}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Leads</p>
                        <p className="font-black text-xl text-slate-900">{Math.floor(Math.random() * 50) + 10}</p>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="shrink-0 flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Price</p>
                        <p className="text-2xl font-black text-primary italic">₹{vehicle.price.toLocaleString()}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={cn(
                            "h-12 w-12 rounded-2xl transition-all",
                            activeBoosts[vehicle.id] 
                              ? "bg-primary/10 text-primary hover:bg-primary/20" 
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                          )}
                          onClick={() => handleBoostClick(vehicle.id)}
                        >
                            <Zap size={20} fill={activeBoosts[vehicle.id] ? "currentColor" : "none"} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-slate-100" onClick={() => navigate(`/vehicle/${vehicle.id}`)}>
                            <Eye size={20} className="text-slate-600" />
                        </Button>
                        <div className="relative">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-slate-100"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <Trash2 size={20} className="text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default SellerDashboard;
