import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useComparison } from '@/context/ComparisonContext';
import { motion } from 'motion/react';

const Compare = () => {
  const navigate = useNavigate();
  const { selectedVehicles, removeFromComparison, clearComparison } = useComparison();

  if (selectedVehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
          <ChevronLeft size={48} className="rotate-180" />
        </div>
        <h2 className="text-2xl font-bold">No vehicles selected for comparison</h2>
        <p className="text-slate-500">Add up to 4 vehicles to compare their specs.</p>
        <Button onClick={() => navigate('/')} className="rounded-full px-8">Browse Vehicles</Button>
      </div>
    );
  }

  const specs = [
    { key: 'price', label: 'Price', format: (val: number) => `₹${val.toLocaleString()}` },
    { key: 'year', label: 'Year' },
    { key: 'kilometersDriven', label: 'Kilometers', format: (val: number) => `${val.toLocaleString()} km` },
    { key: 'fuelType', label: 'Fuel Type' },
    { key: 'transmission', label: 'Transmission' },
    { key: 'ownership', label: 'Ownership' },
    { key: 'mileage', label: 'Mileage' },
    { key: 'registrationNumber', label: 'Reg. No' },
    { key: 'vehicleType', label: 'Type' },
    { key: 'brand', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'city', label: 'Location' },
  ];

  const isDifferent = (key: string) => {
    if (selectedVehicles.length < 2) return false;
    const firstVal = (selectedVehicles[0] as any)[key];
    return selectedVehicles.some((v) => (v as any)[key] !== firstVal);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full bg-white shadow-sm"
          >
            <ChevronLeft size={24} />
          </Button>
          <h1 className="text-3xl font-bold">Compare Vehicles</h1>
        </div>
        <Button variant="ghost" onClick={clearComparison} className="text-red-500 hover:text-red-600 hover:bg-red-50">
          Clear All
        </Button>
      </div>

      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="min-w-[800px] space-y-1">
          {/* Vehicle Headers */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            <div className="flex items-end pb-4">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Specifications</span>
            </div>
            {selectedVehicles.map((vehicle) => (
              <motion.div 
                key={vehicle.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                  <div className="aspect-[4/3] relative">
                    <img 
                      src={vehicle.images[0]} 
                      alt={vehicle.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => removeFromComparison(vehicle.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-sm line-clamp-1">{vehicle.title}</h3>
                    <p className="text-primary font-bold">₹{vehicle.price.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {/* Add more placeholder if less than 4 */}
            {Array.from({ length: 4 - selectedVehicles.length }).map((_, i) => (
              <div key={i} className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 text-slate-400 gap-2 cursor-pointer hover:border-primary/50 hover:text-primary transition-colors" onClick={() => navigate('/')}>
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                  <ChevronLeft size={24} className="rotate-180" />
                </div>
                <span className="text-xs font-bold uppercase">Add Vehicle</span>
              </div>
            ))}
          </div>

          {/* Specs Rows */}
          {specs.map((spec) => {
            const different = isDifferent(spec.key);
            return (
              <div 
                key={spec.key} 
                className={`grid grid-cols-5 gap-4 p-4 rounded-2xl transition-colors ${different ? 'bg-orange-50/50' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center">
                  <span className={`text-sm font-semibold ${different ? 'text-orange-700' : 'text-slate-500'}`}>
                    {spec.label}
                  </span>
                </div>
                {selectedVehicles.map((vehicle) => {
                  const val = (vehicle as any)[spec.key];
                  return (
                    <div key={vehicle.id} className="flex items-center">
                      <span className="text-sm font-bold text-slate-900">
                        {spec.format ? spec.format(val) : val}
                      </span>
                    </div>
                  );
                })}
                {/* Empty cells for placeholders */}
                {Array.from({ length: 4 - selectedVehicles.length }).map((_, i) => (
                  <div key={i} className="flex items-center justify-center">
                    <Minus size={16} className="text-slate-200" />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary / Decision Aid */}
      <section className="bg-white p-8 rounded-[2rem] border border-slate-100 space-y-6">
        <h2 className="text-2xl font-bold">Comparison Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Check className="text-green-500" /> Key Similarities
            </h3>
            <ul className="space-y-2">
              {specs.filter(s => !isDifferent(s.key)).map(s => (
                <li key={s.key} className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  All selected vehicles have the same <span className="font-bold">{s.label.toLowerCase()}</span>.
                </li>
              ))}
              {specs.filter(s => !isDifferent(s.key)).length === 0 && (
                <li className="text-sm text-slate-400 italic">No major similarities found.</li>
              )}
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <X className="text-orange-500" /> Key Differences
            </h3>
            <ul className="space-y-2">
              {specs.filter(s => isDifferent(s.key)).slice(0, 5).map(s => (
                <li key={s.key} className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-300" />
                  Significant variation in <span className="font-bold text-orange-700">{s.label.toLowerCase()}</span> across options.
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Compare;
