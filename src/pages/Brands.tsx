
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { BRANDS } from '@/constants/brands';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Brands = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredBrands = BRANDS.filter(brand => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cars = filteredBrands.filter(b => b.type === 'car');
  const bikes = filteredBrands.filter(b => b.type === 'bike');

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 pb-20">
      <Helmet>
        <title>All Car & Bike Brands | AS One Dealer</title>
        <meta name="description" content="Explore used vehicles from all major brands including Maruti, Hyundai, Tata, BMW, Mercedes and more." />
      </Helmet>

      {/* Hero Header */}
      <section className="relative py-12 md:py-20 overflow-hidden bg-slate-900 rounded-[2rem] md:rounded-[3rem] text-center mx-2 md:mx-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,99,33,0.15)_0%,transparent_50%)]" />
        <div className="relative z-10 space-y-6 max-w-3xl mx-auto px-6">
          <Badge className="bg-primary/20 text-primary border-none px-4 py-1 rounded-full uppercase text-[8px] sm:text-[10px] tracking-[0.2em] font-black">
            The Complete Directory
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.1]">
            Discover Every <br />
            <span className="text-primary italic">Manufacturer.</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg font-medium max-w-xl mx-auto">
            Find your dream vehicle by exploring our partner brands and verified dealer stock across India.
          </p>
          
          <div className="max-w-md mx-auto relative group mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={20} />
            <Input 
              placeholder="Search for a brand..." 
              className="bg-white/10 border-white/10 text-white placeholder:text-slate-500 h-12 md:h-14 pl-12 rounded-xl md:rounded-2xl focus-visible:ring-primary/30 text-base md:text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Brand Grid - Cars */}
      {cars.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-end justify-between px-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900">Car Manufacturers</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Premium & Popular makers</p>
            </div>
            <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block" />
            <Badge variant="outline" className="text-slate-400 border-slate-200">{cars.length} Brands</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6 px-4">
            {cars.map((brand, i) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/search?q=${brand.name}`)}
                className="group bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 flex flex-col items-center gap-4 md:gap-6 cursor-pointer hover:border-primary/30 hover:shadow-2xl transition-all hover:-translate-y-2"
              >
                <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-3xl overflow-hidden bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner p-2 md:p-4">
                   <img 
                    src={brand.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=random&color=fff`} 
                    alt={brand.name} 
                    className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=f1f5f9&color=64748b&bold=true`;
                    }}
                   />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-xs md:text-sm font-black text-slate-900 block">{brand.name}</span>
                  <p className="hidden md:block text-[9px] text-slate-400 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">View Listings</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Brand Grid - Bikes */}
      {bikes.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-end justify-between px-4">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-slate-900">Bike Manufacturers</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Two-Wheeler Giants</p>
            </div>
            <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block" />
            <Badge variant="outline" className="text-slate-400 border-slate-200">{bikes.length} Brands</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 px-2">
            {bikes.map((brand, i) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/search?q=${brand.name}`)}
                className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center gap-6 cursor-pointer hover:border-primary/30 hover:shadow-2xl transition-all hover:-translate-y-2"
              >
                <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner p-4">
                   <img 
                    src={brand.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=random&color=fff`} 
                    alt={brand.name} 
                    className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(brand.name)}&background=f1f5f9&color=64748b&bold=true`;
                    }}
                   />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-sm font-black text-slate-900 block">{brand.name}</span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">View Listings</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {filteredBrands.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-slate-400 font-bold text-lg italic">"Couldn't find that brand. Try searching for something else."</p>
        </div>
      )}

    </div>
  );
};

export default Brands;
