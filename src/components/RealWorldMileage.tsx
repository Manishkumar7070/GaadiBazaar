import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Fuel, 
  TrendingDown, 
  MapPin, 
  Gauge, 
  Sliders, 
  Plus, 
  Flame, 
  Zap, 
  AlertTriangle,
  FileText,
  UserCheck,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Vehicle } from '@/types';

interface MileageReport {
  id: string;
  userName: string;
  city: string;
  mileage: number; // km/l or km/kg or km/kWh
  trafficCondition: 'heavy' | 'moderate' | 'highway';
  drivingStyle: 'eco' | 'normal' | 'sporty';
  acOn: boolean;
  date: string;
}

interface RealWorldMileageProps {
  vehicle: Vehicle;
}

export const RealWorldMileage: React.FC<RealWorldMileageProps> = ({ vehicle }) => {
  // 1. Initial baseline parse helper
  const parseOemMileage = (): { value: number; unit: string } => {
    if (!vehicle.mileage) {
      // Return realistic defaults based on properties
      if (vehicle.fuelType === 'electric') return { value: 140, unit: 'Wh/km' };
      if (vehicle.fuelType === 'cng') return { value: 24.5, unit: 'km/kg' };
      if (vehicle.fuelType === 'hybrid') return { value: 22.1, unit: 'km/l' };
      if (vehicle.fuelType === 'diesel') return { value: 15.6, unit: 'km/l' };
      return { value: 14.2, unit: 'km/l' }; // Default petrol
    }
    
    const match = vehicle.mileage.match(/([\d.]+)/);
    if (match) {
      const val = parseFloat(match[1]);
      const isElectric = vehicle.mileage.toLowerCase().includes('wh') || vehicle.mileage.toLowerCase().includes('kwh') || vehicle.fuelType === 'electric';
      const isCng = vehicle.mileage.toLowerCase().includes('kg') || vehicle.fuelType === 'cng';
      return {
        value: val,
        unit: isElectric ? 'Wh/km' : (isCng ? 'km/kg' : 'km/l')
      };
    }
    return { value: 15.0, unit: 'km/l' };
  };

  const oem = parseOemMileage();

  // 2. Initial Preloaded Community Submissions
  const [reports, setReports] = useState<MileageReport[]>([
    {
      id: 'rep-1',
      userName: 'Arjun G.',
      city: 'Mumbai',
      mileage: parseFloat((oem.value * 0.72).toFixed(1)),
      trafficCondition: 'heavy',
      drivingStyle: 'normal',
      acOn: true,
      date: 'May 24, 2026'
    },
    {
      id: 'rep-2',
      userName: 'Nisha K.',
      city: 'Delhi NCR',
      mileage: parseFloat((oem.value * 0.95).toFixed(1)),
      trafficCondition: 'moderate',
      drivingStyle: 'eco',
      acOn: true,
      date: 'May 20, 2026'
    },
    {
      id: 'rep-3',
      userName: 'Rahul M.',
      city: 'Bangalore Outskirts',
      mileage: parseFloat((oem.value * 1.08).toFixed(1)),
      trafficCondition: 'highway',
      drivingStyle: 'eco',
      acOn: false,
      date: 'May 18, 2026'
    },
    {
      id: 'rep-4',
      userName: 'Sumit P.',
      city: 'Pune',
      mileage: parseFloat((oem.value * 0.81).toFixed(1)),
      trafficCondition: 'moderate',
      drivingStyle: 'sporty',
      acOn: true,
      date: 'May 12, 2026'
    }
  ]);

  // Combined calculations state
  const [traffic, setTraffic] = useState<'heavy' | 'moderate' | 'highway'>('moderate');
  const [drivingStyle, setDrivingStyle] = useState<'eco' | 'normal' | 'sporty'>('normal');
  const [acOn, setAcOn] = useState<boolean>(true);
  
  // Custom interactive cost calculator states
  const [fuelPrice, setFuelPrice] = useState<number>(
    vehicle.fuelType === 'electric' ? 9.0 : (vehicle.fuelType === 'diesel' ? 89.6 : 96.8)
  );
  const [monthlyRunning, setMonthlyRunning] = useState<number>(850); // average India user km range
  
  // Custom Submission Form State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newTripDistance, setNewTripDistance] = useState<string>('');
  const [newFuelConsumed, setNewFuelConsumed] = useState<string>('');
  const [newCity, setNewCity] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newTraffic, setNewTraffic] = useState<'heavy' | 'moderate' | 'highway'>('moderate');
  const [newStyle, setNewStyle] = useState<'eco' | 'normal' | 'sporty'>('normal');
  const [newAc, setNewAc] = useState<boolean>(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load from dry persist
  useEffect(() => {
    const saved = localStorage.getItem(`mileage_reports_${vehicle.id}`);
    if (saved) {
      try {
        setReports(JSON.parse(saved));
      } catch (e) {
        // Safe bypass
      }
    }
  }, [vehicle.id]);

  // Interactive Live Calculation
  const getSimulatedMileage = (): number => {
    let multiplier = 1.0;
    
    // Traffic impacts
    if (traffic === 'heavy') multiplier *= 0.65; // drops 35%
    if (traffic === 'moderate') multiplier *= 0.82; // drops 18%
    if (traffic === 'highway') multiplier *= 1.08; // gains 8%

    // Driving style impacts
    if (drivingStyle === 'eco') multiplier *= 1.05;
    if (drivingStyle === 'sporty') multiplier *= 0.84;

    // Air conditioner impacts
    if (acOn) {
      multiplier *= 0.92; // drops 8%
    } else {
      multiplier *= 1.02; // slight gain
    }

    // Apply multiplier to oem baseline
    const calculated = oem.value * multiplier;
    return parseFloat(calculated.toFixed(1));
  };

  const simulatedMileage = getSimulatedMileage();

  // Aggregated Community Average Mileage
  const communityAverage = parseFloat(
    (reports.reduce((acc, curr) => acc + curr.mileage, 0) / reports.length).toFixed(1)
  );

  const totalLogSubmissions = reports.length;

  const handleMileageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const dist = parseFloat(newTripDistance);
    const fuel = parseFloat(newFuelConsumed);

    if (isNaN(dist) || dist <= 0) {
      setSubmitError('Please enter a valid trip distance in kilometers.');
      return;
    }
    if (isNaN(fuel) || fuel <= 0) {
      setSubmitError(vehicle.fuelType === 'electric' ? 'Please enter valid energy (kWh) consumed.' : 'Please enter valid fuel consumed in Liters/Kgs.');
      return;
    }

    const calculatedResult = parseFloat((dist / fuel).toFixed(1));
    
    // Boundary validations to keep data sane
    if (calculatedResult < 3 || calculatedResult > 80) {
      setSubmitError(`The calculated mileage (${calculatedResult} ${oem.unit}) seems unreal. Make sure values are correct.`);
      return;
    }

    const newLogItem: MileageReport = {
      id: `custom-${Date.now()}`,
      userName: newName.trim() || 'Verified Driver',
      city: newCity.trim() || 'Local City',
      mileage: calculatedResult,
      trafficCondition: newTraffic,
      drivingStyle: newStyle,
      acOn: newAc,
      date: 'Today'
    };

    const updatedReports = [newLogItem, ...reports];
    setReports(updatedReports);
    localStorage.setItem(`mileage_reports_${vehicle.id}`, JSON.stringify(updatedReports));

    setSubmitSuccess(true);
    setTimeout(() => {
      setShowSubmitModal(false);
      setSubmitSuccess(false);
      setNewTripDistance('');
      setNewFuelConsumed('');
      setNewCity('');
      setNewName('');
    }, 1800);
  };

  // Fuel Bill Calculations
  const calculateMonthlyExpense = (): string => {
    if (simulatedMileage <= 0) return '0';
    
    if (vehicle.fuelType === 'electric') {
      // Simulated EV energy expense: Wh/km * km * currency
      // simulatedMileage is e.g. 130 Wh/km
      const kwhPerKm = simulatedMileage / 1000;
      const totalKwh = kwhPerKm * monthlyRunning;
      return (totalKwh * fuelPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 });
    }
    
    // Internal combustion: (monthly distance / real-world mileage) * fuel rate
    const fuelNeeded = monthlyRunning / simulatedMileage;
    const finalBill = fuelNeeded * fuelPrice;
    return finalBill.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  return (
    <section id="real-mileage-section" className="bg-white rounded-[3rem] p-6 md:p-10 text-slate-900 border border-slate-100 shadow-xl overflow-hidden relative">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
            <Gauge size={12} className="text-primary animate-pulse" /> Live Real-World Metrics
          </div>
          <h2 className="text-2xl md:text-3xl font-black uppercase text-slate-900 tracking-tight leading-none">
            Mileage <span className="text-primary font-black italic">Reality Check</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Compare OEM estimates with true city traffic commutes & verified user readings
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => setShowSubmitModal(true)}
          className="bg-slate-950 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-wider h-11 px-5 shadow-lg flex gap-1.5 items-center justify-center self-start md:self-center transition-all cursor-pointer"
        >
          <Plus size={14} className="text-primary" /> Report Trip Mileage
        </Button>
      </div>

      {/* Main Grid Organizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Interactive Configuration Block (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50 border border-slate-100 p-6 md:p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-primary" /> COMMUTE CONFIGURATOR
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Adjust sliders to dynamically calibrate real output
              </span>
            </div>

            {/* Selector A: Traffic Densities */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                Traffic Commute Scenario
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTraffic('heavy')}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    traffic === 'heavy'
                      ? "bg-red-50 border-red-300 text-red-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  )}
                >
                  <Flame size={14} className={traffic === 'heavy' ? "text-red-500 animate-bounce" : "text-slate-400"} />
                  <span className="text-[10px] sm:text-xs">Peak Block</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTraffic('moderate')}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    traffic === 'moderate'
                      ? "bg-primary/10 border-primary/40 text-slate-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  )}
                >
                  <TrendingDown size={14} className={traffic === 'moderate' ? "text-primary" : "text-slate-400"} />
                  <span className="text-[10px] sm:text-xs">Standard City</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTraffic('highway')}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all text-center flex flex-col items-center gap-1 cursor-pointer",
                    traffic === 'highway'
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  )}
                >
                  <Zap size={14} className={traffic === 'highway' ? "text-emerald-500 animate-pulse" : "text-slate-400"} />
                  <span className="text-[10px] sm:text-xs">Cruise Highway</span>
                </button>
              </div>
            </div>

            {/* Selector B: Riding / Driving Styles */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Driving Style Influence
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'eco', label: 'Eco-Minded', desc: 'Gentle starts' },
                  { id: 'normal', label: 'Balanced', desc: 'Daily commute' },
                  { id: 'sporty', label: 'Aggressive', desc: 'Spirited revs' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDrivingStyle(s.id as any)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      drivingStyle === s.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-md"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span className="text-[10px] uppercase font-black block tracking-wider">{s.label}</span>
                    <span className={cn("text-[8px] font-medium uppercase tracking-tight block", drivingStyle === s.id ? "text-primary" : "text-slate-400")}>
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector C: Air Conditioning Usage & Fuel Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* AC Input Toggle */}
              <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase text-slate-900 block tracking-tight">Air Conditioning (AC)</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reduces engine efficiency by ~8%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAcOn(!acOn)}
                  className={cn(
                    "w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center",
                    acOn ? "bg-primary justify-end" : "bg-slate-200 justify-start"
                  )}
                >
                  <motion.div 
                    layout 
                    className="w-5 h-5 rounded-full bg-white shadow-md" 
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Fuel Price Input */}
              <div className="bg-white p-4 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase text-slate-900 block tracking-tight">
                    {vehicle.fuelType === 'electric' ? 'Electricity Rate (₹/kWh)' : 'Fuel Rate (₹ / Litre)'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">To calculate accurate spend</span>
                </div>
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-16 h-8 text-right font-black text-xs text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:border-slate-400 p-1"
                />
              </div>

            </div>

            {/* Section D: Operational Cost Estimator Panel */}
            <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="space-y-1 select-none">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Fuel Bill Estimator</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-slate-900">₹{calculateMonthlyExpense()}</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase">/ Month</span>
                </div>
              </div>

              {/* Slider Input Row */}
              <div className="flex-1 max-w-sm space-y-1">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                  <span>Monthly usage distance</span>
                  <span className="text-slate-800">{monthlyRunning} KM</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="50"
                  value={monthlyRunning}
                  onChange={(e) => setMonthlyRunning(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Right Output Display Comparison & Community Feed (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Comparison Cards Visual */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* OEM Baseline Card */}
            <div className="bg-slate-50 border border-slate-100 rounded-2.5xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-1 relative z-10">
                <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase block">OEM SPECIFICATION</span>
                <p className="text-xs font-bold text-slate-800 uppercase block leading-tight">{vehicle.brand} Claimed</p>
              </div>
              <div className="pt-6 relative z-10">
                <span className="text-3xl font-black text-slate-900">{oem.value}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase ml-1 block">{oem.unit}</span>
              </div>
              <div className="absolute top-2 right-2 bg-slate-200/50 p-1.5 rounded-lg text-slate-500">
                <FileText size={14} />
              </div>
            </div>

            {/* Simulated Reality Metric Card */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-2.5xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-1 relative z-10">
                <span className="text-[9px] font-black tracking-wider text-primary uppercase block">CALCULATED REALITY</span>
                <p className="text-xs font-bold text-slate-800 uppercase block leading-tight">COMMUTE EXPECTATION</p>
              </div>
              <div className="pt-6 relative z-10">
                <span className="text-3xl font-black text-slate-950">{simulatedMileage}</span>
                <span className="text-[10px] font-black text-slate-900 uppercase ml-1 block">{oem.unit}</span>
              </div>

              {/* Dynamic comparison badge */}
              {simulatedMileage < oem.value ? (
                <div className="absolute top-2 right-2 bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                  -{(((oem.value - simulatedMileage) / oem.value) * 100).toFixed(0)}%
                </div>
              ) : (
                <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1">
                  +{(((simulatedMileage - oem.value) / oem.value) * 100).toFixed(0)}%
                </div>
              )}
            </div>

          </div>

          {/* Verification / Alert Banner */}
          <div className="bg-[#1B301B]/5 border border-primary/25 rounded-2xl p-4 flex gap-3.5 items-start">
            <Info className="text-primary w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase text-slate-800">Commute Warning Notice</p>
              <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                Actual city mileage is up to <span className="text-primary font-bold">25-35% lower</span> than standard laboratory lab baseline measurements. Rapid acceleration, cold engine operating states, and heavy Mumbai/Bangalore traffic loops will actively lower your expected run range.
              </p>
            </div>
          </div>

          {/* Community Reported Logs (Crowdsourced) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1">
                <UserCheck size={14} className="text-primary" /> Verified Owner Logs ({totalLogSubmissions})
              </span>
              <span className="text-[10px] font-extrabold text-slate-900 bg-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Community Avg: {communityAverage} {oem.unit}
              </span>
            </div>

            {/* List entries */}
            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {reports.map((rep) => (
                <div key={rep.id} className="bg-slate-50 hover:bg-slate-100/80 border border-slate-100/90 rounded-xl p-3 flex justify-between items-center transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-800 uppercase block">{rep.userName}</span>
                      <span className="text-[8px] font-extrabold text-slate-400 block tracking-tight uppercase">({rep.city})</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className={cn(
                        "text-[8px] font-black uppercase px-1.5 py-0.5 rounded",
                        rep.trafficCondition === 'heavy' ? "bg-red-100 text-red-800" : (rep.trafficCondition === 'moderate' ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800")
                      )}>
                        {rep.trafficCondition} Traffic
                      </span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase">
                        Style: {rep.drivingStyle}
                      </span>
                      {rep.acOn && (
                        <span className="text-[8px] text-blue-500 font-semibold uppercase">
                          AC
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">{rep.mileage} {oem.unit}</span>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-tight">{rep.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* TRIP REPORT / SUBMIT MODAL DIALOG */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 md:p-8 max-w-md w-full relative overflow-hidden"
            >
              {/* Modal close icon */}
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <Plus size={24} className="rotate-45" />
              </button>

              <div className="space-y-1.5 mb-6">
                <span className="text-[9px] font-black text-primary tracking-widest uppercase block">
                  COMMUNITY OWNERSHIP VERIFIED LOG
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  Report Real Mileage
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Settle the debate! Help future buyers of this {vehicle.brand} {vehicle.model} by submitting your calculated trip efficiency.
                </p>
              </div>

              {submitSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 text-emerald-950 p-6 rounded-2xl border border-emerald-300 text-center space-y-2 py-10"
                >
                  <CheckCircle2 size={36} className="text-emerald-500 mx-auto animate-bounce" />
                  <h4 className="font-black text-sm uppercase">Log Submitted Perfectly!</h4>
                  <p className="text-xs text-emerald-700">Your trip experience was verified and blended into the community average index.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleMileageSubmit} className="space-y-4">
                  
                  {/* Grid fields for trip metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Distance Traveled (KM)</label>
                      <input
                        type="number"
                        placeholder="e.g. 120"
                        step="0.1"
                        required
                        value={newTripDistance}
                        onChange={(e) => setNewTripDistance(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">
                        {vehicle.fuelType === 'electric' ? 'Energy Consumed (kWh)' : 'Fuel Filled (Liters / KG)'}
                      </label>
                      <input
                        type="number"
                        placeholder={vehicle.fuelType === 'electric' ? 'e.g. 15.5' : 'e.g. 8.2'}
                        step="0.01"
                        required
                        value={newFuelConsumed}
                        onChange={(e) => setNewFuelConsumed(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>

                  {/* Inputs B: Basic Names */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Name / Pseudonym</label>
                      <input
                        type="text"
                        placeholder="e.g. Anand S."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">City Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Bangalore"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </div>

                  {/* Conditions checkboxes & toggles */}
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Trip Parameters</p>
                    
                    {/* Traffic selector */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Traffic:</span>
                      <div className="flex gap-1.5">
                        {['heavy', 'moderate', 'highway'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setNewTraffic(item as any)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer border transition-all",
                              newTraffic === item 
                                ? "bg-slate-900 border-slate-900 text-white" 
                                : "bg-white border-slate-200 text-slate-400 hover:text-slate-700"
                            )}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Riding style */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Driving Style:</span>
                      <div className="flex gap-1.5">
                        {['eco', 'normal', 'sporty'].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setNewStyle(item as any)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer border transition-all",
                              newStyle === item
                                ? "bg-slate-900 border-slate-900 text-white hidden sm:inline-block" 
                                : "bg-white border-slate-200 text-slate-450 hover:text-slate-700 hidden sm:inline-block"
                            )}
                          >
                            {item}
                          </button>
                        ))}
                        {/* Compact display fallback for minor mobile sizing limitations */}
                        <select 
                          value={newStyle}
                          onChange={(e) => setNewStyle(e.target.value as any)}
                          className="sm:hidden text-[9px] font-black bg-white border border-slate-200 rounded p-1 outline-none uppercase"
                        >
                          <option value="eco">Eco</option>
                          <option value="normal">Normal</option>
                          <option value="sporty">Sporty</option>
                        </select>
                      </div>
                    </div>

                    {/* AC Checkbox */}
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">Air Conditioner Used?</span>
                      <button
                        type="button"
                        onClick={() => setNewAc(!newAc)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer border transition-colors",
                          newAc ? "bg-blue-100 border-blue-200 text-blue-800" : "bg-white border-slate-200 text-slate-400"
                        )}
                      >
                        {newAc ? 'YES (AC ON)' : 'NO (AC OFF)'}
                      </button>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-[10px] font-bold uppercase rounded-xl flex items-center gap-1.5">
                      <AlertTriangle size={12} className="shrink-0" /> {submitError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-xl uppercase text-xs tracking-widest font-black h-11 transition-all cursor-pointer"
                  >
                    Calculate & Publish Log Entry
                  </Button>

                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};
