import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  Database, 
  MessageSquare, 
  ShieldCheck, 
  Globe, 
  Activity, 
  Search, 
  Bell, 
  Settings,
  Menu,
  X,
  ChevronRight,
  Cpu,
  Network,
  Lock,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import SearchPage from './pages/Search';

// Mock data for charts
const performanceData = [
  { time: '00:00', cpu: 45, mem: 62, req: 1200 },
  { time: '04:00', cpu: 32, mem: 58, req: 800 },
  { time: '08:00', cpu: 68, mem: 75, req: 2400 },
  { time: '12:00', cpu: 85, mem: 82, req: 3800 },
  { time: '16:00', cpu: 72, mem: 78, req: 3100 },
  { time: '20:00', cpu: 55, mem: 68, req: 1900 },
  { time: '23:59', cpu: 48, mem: 64, req: 1400 },
];

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <div className="bg-card border border-border p-5 rounded-lg hover:border-primary/50 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-secondary rounded-md group-hover:bg-primary/10 transition-colors">
        <Icon size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        {change}
      </span>
    </div>
    <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold tracking-tight">{value}</p>
  </div>
);

const ServiceRow = ({ name, status, region, latency }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-border last:border-0 hover:bg-secondary/30 px-2 -mx-2 rounded-md transition-colors">
    <div className="flex items-center gap-3">
      <div className="status-pulse">
        <span className={`status-pulse-inner ${status === 'Healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'Healthy' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
      </div>
      <div>
        <h4 className="text-sm font-semibold">{name}</h4>
        <p className="text-xs text-muted-foreground">{region}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-mono">{latency}ms</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{status}</p>
    </div>
  </div>
);

const SidebarLink = ({ id, icon: Icon, label, to, activeTab, setActiveTab, isSidebarOpen }: any) => (
  <Link
    to={to}
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center gap-3 p-3 rounded-md transition-all ${
      activeTab === id 
        ? 'bg-primary text-white glow-primary' 
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`}
  >
    <Icon size={20} />
    {isSidebarOpen && <span className="text-sm font-medium">{label}</span>}
  </Link>
);

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/') setActiveTab('dashboard');
    else if (path === '/search') setActiveTab('search');
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground flex tech-grid">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="border-right border-border bg-card/50 backdrop-blur-xl sticky top-0 h-screen flex flex-col z-50"
      >
        <div className="p-6 flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center glow-primary">
            <Zap size={20} className="text-white" />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight"
            >
              CloudConsole
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            to="/"
            className={`w-full flex items-center gap-3 p-3 rounded-md transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-primary text-white glow-primary' 
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <LayoutDashboard size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Dashboard</span>}
          </Link>
          
          <Link
            to="/search"
            className={`w-full flex items-center gap-3 p-3 rounded-md transition-all ${
              activeTab === 'search' 
                ? 'bg-primary text-white glow-primary' 
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <Search size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Search Resources</span>}
          </Link>

          {[
            { id: 'compute', icon: Server, label: 'EKS Clusters' },
            { id: 'database', icon: Database, label: 'RDS Instances' },
            { id: 'events', icon: MessageSquare, label: 'Kafka Topics' },
            { id: 'security', icon: ShieldCheck, label: 'Istio Mesh' },
            { id: 'global', icon: Globe, label: 'CloudFront' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-md transition-all ${
                activeTab === item.id 
                  ? 'bg-primary text-white glow-primary' 
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard() {
  return (
    <>
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-1">Infrastructure Overview</h1>
          <p className="text-muted-foreground">Real-time monitoring for enterprise-app stack</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search resources..." 
              className="bg-secondary border border-border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-64"
            />
          </div>
          <button className="p-2 bg-secondary border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-secondary"></span>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-bold text-white">
            JD
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="EKS Nodes" value="12 Active" change="+2" icon={Cpu} trend="up" />
        <StatCard title="RDS Connections" value="1,240" change="+12%" icon={Database} trend="up" />
        <StatCard title="Kafka Throughput" value="45.2 MB/s" change="-3%" icon={Activity} trend="down" />
        <StatCard title="Mesh Health" value="99.98%" change="+0.01%" icon={ShieldCheck} trend="up" />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity size={20} className="text-primary" />
              Cluster Performance
            </h2>
            <select className="bg-secondary border border-border rounded px-2 py-1 text-xs focus:outline-none">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111113', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Network size={20} className="text-primary" />
            Service Mesh
          </h2>
          <div className="space-y-1">
            <ServiceRow name="auth-service" status="Healthy" region="us-east-1" latency="12" />
            <ServiceRow name="user-service" status="Healthy" region="us-east-1" latency="24" />
            <ServiceRow name="notification-service" status="Healthy" region="us-east-1" latency="18" />
            <ServiceRow name="payment-gateway" status="Warning" region="eu-west-1" latency="145" />
            <ServiceRow name="inventory-api" status="Healthy" region="us-east-1" latency="32" />
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center justify-center gap-2">
            View All Services <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recent Events */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            Kafka Event Stream
          </h2>
          <div className="space-y-4">
            {[
              { time: '2 mins ago', event: 'USER_CREATED', service: 'user-service', payload: '{"id": "usr_921", "email": "..."}' },
              { time: '5 mins ago', event: 'AUTH_SUCCESS', service: 'auth-service', payload: '{"user": "admin", "ip": "10.0.1.4"}' },
              { time: '12 mins ago', event: 'ORDER_PLACED', service: 'order-service', payload: '{"total": 129.99, "items": 3}' },
            ].map((log, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="text-xs font-mono text-muted-foreground w-20 pt-1">{log.time}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-1.5 py-0.5 bg-secondary rounded text-primary">{log.event}</span>
                    <span className="text-xs text-muted-foreground">from {log.service}</span>
                  </div>
                  <code className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded block font-mono">
                    {log.payload}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Status */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Lock size={20} className="text-primary" />
            Security & Compliance
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">mTLS Status</p>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-500" />
                <span className="font-bold">Enforced (Strict)</span>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">WAF Protection</p>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-green-500" />
                <span className="font-bold">Active</span>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Secrets Rotation</p>
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-primary" />
                <span className="font-bold">Next in 12d</span>
              </div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Global CDN</p>
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-primary" />
                <span className="font-bold">Healthy (24 Nodes)</span>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <ShieldCheck size={20} className="text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold">SOC2 Compliance Check</h4>
                <p className="text-xs text-muted-foreground">Last audit passed 3 days ago. All systems nominal.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
