import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  Search, 
  Wrench, 
  Gauge, 
  Calculator, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Plus, 
  History, 
  TrendingUp, 
  Sparkles, 
  Info,
  Calendar,
  X,
  Flame,
  CheckCircle,
  Coins,
  QrCode,
  User,
  ExternalLink,
  Printer,
  Cpu,
  Database,
  Activity,
  Wifi,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MOCK_VEHICLES } from '@/constants/mockData';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions for our system
interface ComponentHealth {
  name: string;
  key: string;
  health: number; // 0-100
  weight: number; // point share
  replacementCost: number; // INR
}

interface ServiceRecord {
  id: string;
  date: string;
  type: 'Routine' | 'Major' | 'Warranty' | 'Emergency';
  mechanic: string;
  mileage: number;
  cost: number;
  notes: string;
  components: string[];
}

interface LookupLog {
  timestamp: string;
  ip: string;
  source: string;
  status: 'Success' | 'Not Found' | 'Blocked';
}

const getComponentDiagnosis = (key: string, health: number) => {
  if (health >= 85) {
    switch (key) {
      case 'engine': return "Optimal cylinder compression ratio. Spark plug clean, ignition wave timing nominal. Exhaust O₂ sensors clean.";
      case 'transmission': return "Synchronizer sleeves fully engaged. Automatic fluid viscosity healthy, shift overlap times nominal.";
      case 'brakes': return "Brake pad friction material depth >=8mm. No rotor warping, hydraulics responsive.";
      case 'suspension': return "Dampener seals completely dry. Direct rebound rate certified at 1.2s optimal dampening state.";
      case 'battery': return "Nominal voltage stable at 12.6V. CCA (Cold Cranking Amps) verified at 96% of battery capacity.";
      case 'tyres': return "Symmetric tread depth healthy at 7.2mm. No premature outer casing wear or shoulder scrub.";
      case 'electrical': return "ECU diagnostic query returned zero stored trouble codes. Alternator charge current stabilized.";
      case 'ac': return "Compressor cooling vent output temperature at 6°C at 38°C ambient test condition.";
      case 'steering': return "Precise tracking feedback with zero backlash. Electrical assist motor draws standard current.";
      case 'exhaust': return "Catalytic converter gas filtration efficiency verified at 98%. Heat shields fully secured.";
      default: return "Excellent state. All diagnostic mechanical parameters running perfectly and within factory specs.";
    }
  } else if (health >= 70) {
    switch (key) {
      case 'engine': return "Slight carbon residue inside throttle plates. Injector fuel map registers light variance. Standard health.";
      case 'transmission': return "Standard gear mesh alignment friction. Shifting fluid shows standard oxidation; regular drain advised.";
      case 'brakes': return "Brake pad depth at 5.5mm (approx 50% wear remaining). Slower hydraulic slide recoil.";
      case 'suspension': return "Lower bush mounts exhibit micro hairline age fractures. Strut dampening effective with normal roll.";
      case 'battery': return "Battery voltage at 12.2V. Cranking speeds are adequate but exhibit standard chemistry exhaustion.";
      case 'tyres': return "Tread depth at 4.8mm. Minor trace scrubbing on outer margins. Cross rotation advised at next service.";
      case 'electrical': return "One inactive warning trace logged (ambient temp module glitch). Wiring grounds dry and clean.";
      case 'ac': return "Cabin intake air filter dust accumulation is moderate. Vent output stabilized at 10°C level.";
      case 'steering': return "Minor joint feedback play detected on rough roads. Power steering fluid reservoir levels normal.";
      case 'exhaust': return "Subtle carbon soot accumulation near system joints. Oxygen sensor responsive inside parameters.";
      default: return "Good operational state with standard age-related wear. Continuous scheduled service holds.";
    }
  } else {
    switch (key) {
      case 'engine': return "Active cylinder misfires logged. Compression pressure variance peaks at 15%. Valve carbon cleanup needed.";
      case 'transmission': return "Gears slip under wide open throttle. Torque converter hydraulic lockup slipping. Fluid replacement overdue.";
      case 'brakes': return "Brake pads thin at 3.2mm. Braking rotors scored by high thermal friction. Immediate pad replacement required.";
      case 'suspension': return "Front struts show active hydraulic oil leaks. Bushing integrity severely compromised. Shocks bouncy.";
      case 'battery': return "Critical battery state: 11.8V. Internal resistance elevated; winter/monsoon cranking failure high risk.";
      case 'tyres': return "Tread depth thin (2.5mm near legal wear bar). High risk of aquaplaning. Re-alignment required.";
      case 'electrical': return "Active BCM power depletion code present. Heavy parasitic battery draw during shutdown.";
      case 'ac': return "Compressor clutch cycling cycles too frequently. Refrigerant R134a weight below threshold; possible micro-leak.";
      case 'steering': return "Front tie-rod ball joints show severe slack. Excessive steering rack vibration; urgent re-alignment.";
      case 'exhaust': return "Catalytic converter efficiency decreased below standard thresholds. Exhaust hangers cracked.";
      default: return "Critical overhaul zone. Component exhibits advanced degradation. Immediate mechanical attention advised.";
    }
  }
};

export default function CarHealthScore() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Track if they have actually searched/selected a vehicle
  const [hasSearched, setHasSearched] = useState(false);

  // Track sandbox bypass for guest partner mechanics testing
  const [sandboxEnabled, setSandboxEnabled] = useState(false);
  const [lastSubmittedHeal, setLastSubmittedHeal] = useState<{
    prevScore: number;
    newScore: number;
    healedCount: string[];
  } | null>(null);

  // Predictive forecasting inputs
  const [dailyUsageKms, setDailyUsageKms] = useState(35);
  const [drivingProfile, setDrivingProfile] = useState<'moderate' | 'aggressive' | 'eco'>('moderate');

  // Smoothly animated score state & gauge hover tracking
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isHoveringGauge, setIsHoveringGauge] = useState(false);

  // Navigation & searchable mock cars list
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  
  // Custom vehicle builder fallback state
  const [customVehicle, setCustomVehicle] = useState({
    registrationNumber: 'BR01-XY-5678',
    brand: 'Maruti Suzuki',
    model: 'Swift VXI',
    year: 2019,
    kilometersDriven: 58000,
    ownerName: 'Rahul Kumar',
    ownerPhone: '+91 98765 43210'
  });

  // Verification Shield Status (Simulated CIBIL OAuth/OTP Verification)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  // Custom CIBIL Score simulation module states for user registration incentive
  const [cibilPhone, setCibilPhone] = useState('');
  const [isSimulatingCibil, setIsSimulatingCibil] = useState(false);
  const [simulatedCibilScore, setSimulatedCibilScore] = useState<number | null>(null);
  const [cibilErrorMessage, setCibilErrorMessage] = useState('');
  const [cibilLoadingPhase, setCibilLoadingPhase] = useState(0);

  // Mechanic Custom Diagnostics & Scoring states
  const [mechanicEngineIssue, setMechanicEngineIssue] = useState('');
  const [mechanicEngineRating, setMechanicEngineRating] = useState<number>(5);
  const [mechanicDropdownProblem, setMechanicDropdownProblem] = useState<string>('none');
  const [isAnalyzingCarDetails, setIsAnalyzingCarDetails] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [customAnalysisReport, setCustomAnalysisReport] = useState<any | null>(null);

  // 10 Components tracked in detail
  const [components, setComponents] = useState<ComponentHealth[]>([
    { name: 'Engine Performance', key: 'engine', health: 92, weight: 15, replacementCost: 120000 },
    { name: 'Transmission & Gearbox', key: 'transmission', health: 88, weight: 10, replacementCost: 85000 },
    { name: 'Braking System', key: 'brakes', health: 65, weight: 8, replacementCost: 9500 },
    { name: 'Suspension & Shocks', key: 'suspension', health: 75, weight: 5, replacementCost: 18000 },
    { name: 'Battery Health', key: 'battery', health: 48, weight: 5, replacementCost: 5500 },
    { name: 'Tyre Tread Condition', key: 'tyres', health: 70, weight: 5, replacementCost: 22000 },
    { name: 'Electrical & ECU', key: 'electrical', health: 85, weight: 5, replacementCost: 12000 },
    { name: 'Air Conditioning', key: 'ac', health: 80, weight: 3, replacementCost: 15000 },
    { name: 'Steering Column', key: 'steering', health: 82, weight: 4, replacementCost: 8000 },
    { name: 'Exhaust & Catalyst', key: 'exhaust', health: 90, weight: 0, replacementCost: 25000 }, // weight adjusted to match 60 max deduction
  ]);

  // Dynamic status states
  const [accidentLevel, setAccidentLevel] = useState<'none' | 'minor' | 'moderate' | 'major' | 'flood'>('none');
  const [serviceOverdue, setServiceOverdue] = useState<boolean>(false);
  const [customLogs, setCustomLogs] = useState<ServiceRecord[]>([
    {
      id: 'ser-1',
      date: '2026-03-10',
      type: 'Routine',
      mechanic: 'AsOne Authorized Workshop, Patna',
      mileage: 56200,
      cost: 4800,
      notes: 'Standard 55k service completed. Replaced cabin air filter, refilled coolant reservoir. Engine compression within limits. Advised battery monitoring.',
      components: ['Engine Oil', 'Air Filter', 'Coolant']
    },
    {
      id: 'ser-2',
      date: '2025-09-15',
      type: 'Major',
      mechanic: 'Elite Maruti Diagnostics, Hajipur',
      mileage: 48500,
      cost: 12400,
      notes: 'Brake pad replacement performed. Cleaned callipers and adjusted handrake cable. Suspension bushings checked and aligned.',
      components: ['Brake Pads', 'Suspension Bushings']
    }
  ]);

  // Lookup Audit Trail Simulations
  const [lookups, setLookups] = useState<LookupLog[]>([
    { timestamp: '2026-05-28 12:15:33', ip: '103.241.12.87', source: 'Buyer App (Bihar)', status: 'Success' },
    { timestamp: '2026-05-27 18:44:10', ip: '192.168.1.1', source: 'Owner Lookup (Web)', status: 'Success' },
    { timestamp: '2026-05-24 10:23:45', ip: '43.204.221.90', source: 'Partnership Insurance API', status: 'Success' }
  ]);

  // Handle URL preselection of registration number
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reg = params.get('reg');
    if (reg) {
      const found = MOCK_VEHICLES.find(v => v.registrationNumber?.toLowerCase() === reg.toLowerCase());
      if (found) {
        handleSelectVehicle(found);
      } else {
        setCustomVehicle(prev => ({
          ...prev,
          registrationNumber: reg.toUpperCase()
        }));
        setSearchQuery(reg.toUpperCase());
        setHasSearched(true);
      }
    }
  }, []);

  // Quick setup on loading selected vehicle
  const handleSelectVehicle = (v: any) => {
    setSelectedVehicle(v);
    setSearchQuery(v.registrationNumber || v.title);
    setShowSuggestions(false);
    setIsUnlocked(false);
    setOtpSent(false);
    setHasSearched(true);

    // Seed randomized values based on vehicle's status to make query feels super lifelike!
    const age = new Date().getFullYear() - (v.year || 2020);
    const scale = v.verificationStatus === 'verified' ? 0.95 : 0.82;
    
    // Seed components health
    const updatedComponents = components.map(c => {
      let variance = 100;
      if (c.key === 'battery') variance = Math.max(40, Math.floor(90 - age * 8));
      else if (c.key === 'brakes') variance = Math.max(50, Math.floor(95 - (v.kilometersDriven % 15000) / 180));
      else variance = Math.max(60, Math.floor((100 - age * 3) * scale));
      return { ...c, health: variance };
    });
    setComponents(updatedComponents);

    // Initial logs seed
    setCustomLogs([
      {
        id: 'ser-auto-1',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'Routine',
        mechanic: `AsOne Certified Workshop, ${v.city || 'Patna'}`,
        mileage: Math.max(1000, (v.kilometersDriven || 45000) - 1400),
        cost: 3800,
        notes: `Diagnostic scanner scan completed for ${v.title}. Emissions control systems certified green. Standard service fluids refreshed.`,
        components: ['Engine Oil', 'Oil Filter']
      },
      ...customLogs.filter(log => !log.id.startsWith('ser-auto-'))
    ]);

    // Log the success audit trail
    const newLog: LookupLog = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ip: `157.48.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      source: 'Marketplace Lookup',
      status: 'Success'
    };
    setLookups([newLog, ...lookups]);
  };

  // Triggering simulated verification OTP SMS
  const triggerOtp = () => {
    setOtpSent(true);
    setOtpError('');
  };

  const verifyOtp = () => {
    if (otpCode === '1234' || otpCode.length === 4) {
      setIsUnlocked(true);
      setOtpSent(false);
      setOtpError('');
    } else {
      setOtpError('Invalid authorization code. Enter 1234 or any 4 digit code to authorize.');
    }
  };

  // Calculations for deductions
  const currentYear = new Date().getFullYear();
  const vYear = selectedVehicle ? selectedVehicle.year : customVehicle.year;
  const age = Math.max(0, currentYear - vYear);
  const mileage = selectedVehicle ? selectedVehicle.kilometersDriven : customVehicle.kilometersDriven;

  // Deductions rules:
  // 1. Age deduction
  const ageDeduction = Math.min(15, age * 1.5);
  // 2. Mileage deduction
  const mileageExcess = Math.max(0, mileage - 40000);
  const mileageDeduction = Math.min(15, parseFloat((mileageExcess * 0.00015).toFixed(2)));
  // 3. Components health deductions
  // Max deductions is 60. Max weights for components:
  // engine: 15, transmission: 10, brakes: 8, suspension: 5, battery: 5, tyres: 5, electrical: 5, ac: 3, steering: 4. (total = 60 points max)
  let componentDeductions = 0;
  components.forEach(c => {
    const loss = (100 - c.health) / 100;
    componentDeductions += loss * c.weight;
  });
  componentDeductions = parseFloat(componentDeductions.toFixed(1));

  // 4. Overdue check
  const serviceHistoryDeduction = serviceOverdue ? 7 : -3; // negative is bonus

  // 5. Accident Level
  const accidentDeductionMap = {
    none: 0,
    minor: 3,
    moderate: 7,
    major: 12,
    flood: 15
  };
  const accidentDeduction = accidentDeductionMap[accidentLevel];

  // Final Health Score calculation
  const calculatedScore = Math.max(1, Math.min(100, Math.round(100 - (ageDeduction + mileageDeduction + componentDeductions + (serviceOverdue ? 7 : 0) + accidentDeduction) + (serviceOverdue ? 0 : 3)))); // add bonus +3 if not overdue

  // Grade classification
  let grade = 'D';
  let statusColor = 'text-red-500 bg-red-50 border-red-200';
  let badgeColor = 'bg-red-500';
  let scoreStatus = 'Poor';
  let descriptionText = 'Highly degraded condition. High mechanical risk.';
  let multiplier = 0.80; // -20% resale

  if (calculatedScore >= 85) {
    grade = 'A';
    statusColor = 'text-emerald-500 bg-emerald-50 border-emerald-200';
    badgeColor = 'bg-emerald-500';
    scoreStatus = 'Excellent';
    descriptionText = 'Pristine mechanical condition. Full verified health warranty.';
    multiplier = 1.12; // +12% resale
  } else if (calculatedScore >= 70) {
    grade = 'B';
    statusColor = 'text-blue-500 bg-blue-50 border-blue-200';
    badgeColor = 'bg-blue-500';
    scoreStatus = 'Good';
    descriptionText = 'Solid, well-maintained. Light wear with normal aging patterns.';
    multiplier = 1.05; // +5% resale
  } else if (calculatedScore >= 50) {
    grade = 'C';
    statusColor = 'text-amber-500 bg-amber-50 border-amber-200';
    badgeColor = 'bg-amber-500';
    scoreStatus = 'Fair';
    descriptionText = 'Moderate wear on multiple component groups. Routine overhaul advised.';
    multiplier = 0.98; // -2% resale
  }

  // Core hook to animate score transitions smoothly
  useEffect(() => {
    let startValue = animatedScore;
    const endValue = calculatedScore;
    if (startValue === endValue) return;

    const duration = 1200; // 1.2 seconds animation
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease out for premium fluid feel
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(startValue + (endValue - startValue) * easeProgress);
      setAnimatedScore(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [calculatedScore]);

  // Base resale calculator
  // Standard simple depreciation rate
  const initialCost = 1000000; // Average ₹10 Lakh initial value
  const ageFactor = Math.pow(0.88, age); // 12% yearly depreciation
  const baseValue = Math.round(initialCost * ageFactor * (1 - (mileage / 250000)));
  const absoluteEstValue = Math.max(150000, Math.round(baseValue));
  const finalScoreValue = Math.round(absoluteEstValue * multiplier);
  const premiumAmt = finalScoreValue - absoluteEstValue;

  // --- ADVANCED IOT & BLOCKCHAIN STATES ---
  const [iotSynced, setIotSynced] = useState(true);
  const [iotScanning, setIotScanning] = useState(false);
  const [iotScanProgress, setIotScanProgress] = useState(0);
  const [obdData, setObdData] = useState({
    coolantTemp: 88,
    alternatorVoltage: 13.9,
    exhaustCo2: 0.04,
    manifoldPressure: 101,
    rpmValue: 850,
    tirePressureFrontLeft: 32,
    tirePressureFrontRight: 32,
    tirePressureRearLeft: 33,
    tirePressureRearRight: 33,
    lastTransmission: new Date().toISOString()
  });

  const [blockchainVerifying, setBlockchainVerifying] = useState(false);
  const [blockchainHash, setBlockchainHash] = useState('');
  const [blockchainCertified, setBlockchainCertified] = useState(true);
  const [validatedNodesCount, setValidatedNodesCount] = useState(8);
  const [blockchainVerificationSuccess, setBlockchainVerificationSuccess] = useState<boolean | null>(null);

  // Helper to generate a reproducible cryptographic-looking hash from registration
  const generateRegHash = (regStr: string) => {
    let hash = 0;
    const str = regStr + "-AsOneDealerSecuredPolygonNode-v4.7";
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return "0x7a" + Math.abs(hash).toString(16).padEnd(40, 'a') + "c8d4";
  };

  // Generate hash on change
  useEffect(() => {
    const reg = selectedVehicle?.registrationNumber || customVehicle?.registrationNumber || '';
    setBlockchainHash(generateRegHash(reg));
    setBlockchainVerificationSuccess(null);
  }, [selectedVehicle, customVehicle]);

  // Method to simulate dynamic IoT scan
  const handleIotDiagnosticsScan = () => {
    if (iotScanning) return;
    setIotScanning(true);
    setIotScanProgress(0);
    
    const interval = setInterval(() => {
      setIotScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIotScanning(false);
          // Slightly diversify state check to simulate fluid diagnostic changes
          setObdData({
            coolantTemp: Math.floor(82 + Math.random() * 12),
            alternatorVoltage: parseFloat((13.6 + Math.random() * 0.6).toFixed(1)),
            exhaustCo2: parseFloat((0.02 + Math.random() * 0.03).toFixed(2)),
            manifoldPressure: Math.floor(98 + Math.random() * 6),
            rpmValue: Math.floor(750 + Math.random() * 150),
            tirePressureFrontLeft: Math.floor(31 + Math.random() * 3),
            tirePressureFrontRight: Math.floor(31 + Math.random() * 3),
            tirePressureRearLeft: Math.floor(31 + Math.random() * 3),
            tirePressureRearRight: Math.floor(31 + Math.random() * 3),
            lastTransmission: new Date().toISOString()
          });
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Method to simulate decentralized ledger confirmation
  const handleBlockchainLedgerVerify = () => {
    if (blockchainVerifying) return;
    setBlockchainVerifying(true);
    setBlockchainVerificationSuccess(null);
    setValidatedNodesCount(1);

    const intv = setInterval(() => {
      setValidatedNodesCount(prev => {
        if (prev >= 8) {
          clearInterval(intv);
          setBlockchainVerifying(false);
          setBlockchainVerificationSuccess(true);
          return 8;
        }
        return prev + 1;
      });
    }, 200);
  };

  // Add a simulation log visit helper
  const [logType, setLogType] = useState<'Routine' | 'Major' | 'Warranty' | 'Emergency'>('Routine');
  const [logCost, setLogCost] = useState('4500');
  const [logDesc, setLogDesc] = useState('');
  const [logComponents, setLogComponents] = useState('');

  const submitLog = () => {
    if (!logDesc) return;
    const oldScore = calculatedScore;
    
    // Auto-mechanic name based on user state
    const mechanicLabel = user ? ((user as any).displayName || user.email || 'AsOne Partner Workshop') : 'Simulated Partner Workshop';

    const newRecord: ServiceRecord = {
      id: `ser-user-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: logType,
      mechanic: mechanicLabel,
      mileage: mileage + 200,
      cost: parseFloat(logCost) || 0,
      notes: logDesc,
      components: logComponents ? logComponents.split(',').map(s => s.trim()) : ['General Inspection']
    };
    
    // Automatically improve components health to simulate repair healing!
    const healedKeys: string[] = [];
    const healedComponents = components.map(c => {
      // Find matches
      const isRepaired = logComponents.toLocaleLowerCase().includes(c.key) || 
                         logComponents.toLocaleLowerCase().includes(c.name.toLocaleLowerCase().split(' ')[0]);
      if (isRepaired) {
        healedKeys.push(c.name);
        return { ...c, health: Math.min(100, c.health + 25) };
      }
      return c;
    });
    
    setCustomLogs([newRecord, ...customLogs]);
    setComponents(healedComponents);
    
    // Calculate the post-heal score
    let componentDeductions = 0;
    healedComponents.forEach(c => {
      const loss = (100 - c.health) / 100;
      componentDeductions += loss * c.weight;
    });
    componentDeductions = parseFloat(componentDeductions.toFixed(1));
    const accidentDeductionMap = {
      none: 0,
      minor: 3,
      moderate: 7,
      major: 12,
      flood: 15
    };
    const accidentDeduction = accidentDeductionMap[accidentLevel];
    const ageDeduction = Math.min(15, parseFloat((age * 2.5).toFixed(1)));
    const mileageDeduction = Math.min(25, parseFloat((mileage / 12000).toFixed(1)));
    
    const nextScore = Math.max(1, Math.min(100, Math.round(100 - (ageDeduction + mileageDeduction + componentDeductions + (serviceOverdue ? 7 : 0) + accidentDeduction) + (serviceOverdue ? 0 : 3))));
    
    setLastSubmittedHeal({
      prevScore: oldScore,
      newScore: nextScore,
      healedCount: healedKeys
    });
    
    setLogDesc('');
    setLogComponents('');
    
    // Smooth scroll down to components panel
    const detailPanel = document.getElementById('details_panel');
    if (detailPanel) {
      detailPanel.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Dynamic predictive forecasting engine calculation
  const forecastingData = React.useMemo(() => {
    const slopes: Record<string, number> = {
      engine: 350,
      transmission: 450,
      brakes: 160,
      suspension: 240,
      battery: 100,
      tyres: 220,
      electrical: 230,
      ac: 320,
      steering: 260,
      exhaust: 400
    };

    const multiplier = drivingProfile === 'eco' ? 1.25 : drivingProfile === 'aggressive' ? 0.72 : 1.0;

    const items = components.map(c => {
      const slope = (slopes[c.key] || 250) * multiplier;
      const margin = Math.max(0, c.health - 40);
      const remainingKms = Math.round(margin * slope);
      const remainingDays = Math.max(0, Math.round(remainingKms / Math.max(1, dailyUsageKms)));

      let advice = "";
      if (c.health < 55) {
        if (c.key === 'engine') advice = "Immediate spark plug & valve timing inspection advised.";
        else if (c.key === 'transmission') advice = "Critical gearbox synchronizer wear. Check fluid levels.";
        else if (c.key === 'brakes') advice = "Brake pad replacement mandatory. Rotor thickness low.";
        else if (c.key === 'suspension') advice = "Strut leakage observed. Install heavy duty damper replacement.";
        else if (c.key === 'battery') advice = "Battery voltage drops under load. Replace 12V dry cell.";
        else if (c.key === 'tyres') advice = "Tread depth < 2mm. Replace tyres to prevent hydroplaning.";
        else if (c.key === 'electrical') advice = "Parasitic discharge flagged. Remap cabin BCM wiring.";
        else if (c.key === 'ac') advice = "AC pressure leakage. Evacuate gas and flush receiver drier.";
        else if (c.key === 'steering') advice = "Rack-and-pinion slack detected. Replace steering tie-rods.";
        else advice = "Hanger deterioration. Secure exhaust pipeline.";
      } else if (c.health < 75) {
        if (c.key === 'engine') advice = "Schedule fuel injector decarb and throttle body cleaning.";
        else if (c.key === 'transmission') advice = "Service gearbox fluid and check shifter bushings.";
        else if (c.key === 'brakes') advice = "Brake pad scour check at next general service center check.";
        else if (c.key === 'suspension') advice = "Wheel alignment correction and shock absorber bushing grease.";
        else if (c.key === 'battery') advice = "Clean corroded battery terminals and monitor backup charge.";
        else if (c.key === 'tyres') advice = "Rotate front/back tyres and balance weight dynamics.";
        else if (c.key === 'electrical') advice = "Reset OBD sensor log and clean ignition coils.";
        else if (c.key === 'ac') advice = "Replace cabin pollen filter and check blower motor speed.";
        else if (c.key === 'steering') advice = "Check power steering pump fluid levels and belt tension.";
        else advice = "Exhaust gasket cleaning recommended to avoid micro-leaks.";
      } else {
        advice = "Component operates in pristine parameters. Keep up standard schedules.";
      }

      const status = c.health < 55 ? 'urgent' : c.health < 75 ? 'warning' : 'healthy';

      return {
        ...c,
        remainingKms,
        remainingDays,
        advice,
        status
      };
    });

    const bottleneck = items.reduce((min, item) => item.remainingDays < min.remainingDays ? item : min, items[0]);

    const today = new Date();
    const serviceDate = new Date();
    serviceDate.setDate(today.getDate() + bottleneck.remainingDays);
    const formattedServiceDate = serviceDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return {
      items,
      bottleneck,
      formattedServiceDate,
      overallDays: bottleneck.remainingDays,
      overallKms: bottleneck.remainingKms
    };
  }, [components, dailyUsageKms, drivingProfile]);

  // Self-Healing predictive restoration logic
  const quickRepairComponent = (compKey: string, compName: string) => {
    const oldScore = calculatedScore;
    const mechanicLabel = user ? ((user as any).displayName || user.email || 'AsOne Partner Workshop') : 'Simulated Partner Workshop';

    const newRecord: ServiceRecord = {
      id: `ser-user-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Major',
      mechanic: mechanicLabel,
      mileage: mileage + 150,
      cost: 7800,
      notes: `Executed rapid component restoration. Revitalized ${compName} hardware layer to 100% capacity. Calibrated wear vectors and reset telemetry logs.`,
      components: [compName]
    };

    // Calculate components health
    const healedComponents = components.map(c => {
      if (c.key === compKey) {
        return { ...c, health: 100 };
      }
      return c;
    });

    setComponents(healedComponents);
    setCustomLogs([newRecord, ...customLogs]);

    // Calculate the post-heal score
    let componentDeductions = 0;
    healedComponents.forEach(c => {
      const loss = (100 - c.health) / 100;
      componentDeductions += loss * c.weight;
    });
    componentDeductions = parseFloat(componentDeductions.toFixed(1));
    const accidentDeductionMap = {
      none: 0,
      minor: 3,
      moderate: 7,
      major: 12,
      flood: 15
    };
    const accidentDeduction = accidentDeductionMap[accidentLevel];
    const ageDeduction = Math.min(15, parseFloat((age * 2.5).toFixed(1)));
    const mileageDeduction = Math.min(25, parseFloat((mileage / 12000).toFixed(1)));
    
    const nextScore = Math.max(1, Math.min(100, Math.round(100 - (ageDeduction + mileageDeduction + componentDeductions + (serviceOverdue ? 7 : 0) + accidentDeduction) + (serviceOverdue ? 0 : 3))));
    
    setLastSubmittedHeal({
      prevScore: oldScore,
      newScore: nextScore,
      healedCount: [compName]
    });
  };

  // CIBIL Score simulation fetch engine
  const startCibilSimulation = () => {
    if (!cibilPhone || cibilPhone.replace(/\D/g, '').length < 10) {
      setCibilErrorMessage('Please enter a valid 10-digit mobile number');
      return;
    }
    setCibilErrorMessage('');
    setIsSimulatingCibil(true);
    setCibilLoadingPhase(0);
    
    setTimeout(() => setCibilLoadingPhase(1), 500);
    setTimeout(() => setCibilLoadingPhase(2), 1000);
    setTimeout(() => setCibilLoadingPhase(3), 1500);
    setTimeout(() => {
      setIsSimulatingCibil(false);
      // Map the dynamic calculated car score to standard 300-900 CIBIL score bounds
      const scaledScore = Math.min(900, Math.max(300, Math.round(300 + (calculatedScore / 100) * 600)));
      setSimulatedCibilScore(scaledScore);
    }, 2000);
  };

  // Mechanic Multi-Source API Diagnostics Analyzer
  const analyzeCarDetailsAndDiagnostics = () => {
    if (!mechanicEngineIssue.trim()) {
      setAnalysisError('Please write engine issue or diagnosed condition details first.');
      return;
    }
    setAnalysisError('');
    setIsAnalyzingCarDetails(true);
    setCustomAnalysisReport(null);

    // Get registration number
    const reg = selectedVehicle?.registrationNumber || customVehicle?.registrationNumber || 'BR01-XY-5678';
    const brandName = selectedVehicle?.brand || customVehicle?.brand || 'Maruti Suzuki';
    const modelName = selectedVehicle?.model || customVehicle?.model || 'Swift VXI';
    const yearManufactured = selectedVehicle?.year || customVehicle?.year || 2019;
    const kmsDone = selectedVehicle?.kilometersDriven || customVehicle?.kilometersDriven || 58000;
    const ownerName = selectedVehicle?.ownerName || customVehicle?.ownerName || 'Rahul Kumar';
    
    setTimeout(() => {
      setIsAnalyzingCarDetails(false);

      // 1. Compile API Responses inside the client logic
      const mockRcDetails = {
        api_endpoint: `/api/v1/rc-details?reg=${reg}`,
        registration_number: reg.toUpperCase(),
        owner_name: ownerName,
        maker_model: `${brandName} ${modelName}`,
        registration_date: `14-May-${yearManufactured}`,
        chassis_number: `ME3T8F3L9J${yearManufactured}842`,
        engine_number: `K12M-E${100000 + Math.floor(Math.random() * 900000)}`,
        fuel_description: selectedVehicle?.fuelType || 'Petrol',
        rto_office: 'RTO Patna East, Bihar',
        hypothecated_to: 'HDFC Bank Ltd (Active)',
        tax_validity: `Paid until 2034`,
        fitment_declaration: 'Clean, Single Modification Certified'
      };

      const mockOwnerDetails = {
        api_endpoint: `/api/v1/owner-registry?reg=${reg}`,
        full_name: ownerName,
        phone_contact: selectedVehicle?.ownerPhone || customVehicle?.ownerPhone || '+91 98765 43210',
        current_address: 'Kadamkuan Main Road, Landmark: Near SBI, Patna, Bihar - 800003',
        owner_serial: selectedVehicle?.ownership || '1st Owner',
        registration_city: 'Patna',
        blacklist_status: 'No Active FIR/No Blacklist Record',
        pending_traffic_challans: 'INR 1,000 (Over-speeding at Gandhi Maidan Bypass)'
      };

      const mockServiceDetails = {
        api_endpoint: `/api/v1/service-history?reg=${reg}`,
        logged_operations: customLogs.length,
        chronic_breakdowns: 0,
        warranty_replacement_count: 1,
        recent_repair_cost: customLogs.reduce((acc, log) => acc + (log.cost || 0), 0)
      };

      // 2. Perform Dynamic Score Analysis
      // Lower components health permanently in-memory if mechanic specifies key defects
      const newComponents = [...components];
      let engineDeduct = 0;
      let dropdownDeduct = 0;
      let serviceAlert = false;
      const appliedAnomalies: string[] = [];

      // Look at mechanic's engine rating (max 5)
      const engineCompIndex = newComponents.findIndex(c => c.key === 'engine');
      if (engineCompIndex !== -1) {
        if (mechanicEngineRating < 5) {
          const originalHealth = newComponents[engineCompIndex].health;
          const cappedHealth = Math.min(originalHealth, mechanicEngineRating * 20); // e.g. 3/5 stars caps engine health to 60%
          newComponents[engineCompIndex].health = cappedHealth;
          engineDeduct = originalHealth - cappedHealth;
          appliedAnomalies.push(`Engine physical rating set to ${mechanicEngineRating}/5 (deducted ${Math.round(engineDeduct)}% health)`);
        }
      }

      // Diagnose custom dropdown problems
      if (mechanicDropdownProblem === 'engine_old') {
        const idx = newComponents.findIndex(c => c.key === 'engine');
        if (idx !== -1) {
          const cur = newComponents[idx].health;
          newComponents[idx].health = Math.max(30, cur - 35);
          appliedAnomalies.push('Fitted Engine age decay ("Engine Old" warning applied)');
        }
        dropdownDeduct += 15;
      } else if (mechanicDropdownProblem === 'oil_change') {
        const idx = newComponents.findIndex(c => c.key === 'engine');
        if (idx !== -1) {
          const cur = newComponents[idx].health;
          newComponents[idx].health = Math.max(45, cur - 15);
          appliedAnomalies.push('Fluids depletion: Scheduled Engine oil replacement overdue');
        }
        setServiceOverdue(true);
        serviceAlert = true;
        dropdownDeduct += 10;
      } else if (mechanicDropdownProblem === 'tire_damage') {
        const idx = newComponents.findIndex(c => c.key === 'tyres');
        if (idx !== -1) {
          newComponents[idx].health = 25;
          appliedAnomalies.push('Severe tread degradation: Tire damage after 5 months usage patterns');
        }
        dropdownDeduct += 18;
      } else if (mechanicDropdownProblem === 'brake_damage') {
        const idx = newComponents.findIndex(c => c.key === 'brakes');
        if (idx !== -1) {
          newComponents[idx].health = 20;
          appliedAnomalies.push('Brake pad/caliper fatigue: Brakes unchanged for several months');
        }
        dropdownDeduct += 20;
      } else if (mechanicDropdownProblem === 'steering_fault') {
        const idx = newComponents.findIndex(c => c.key === 'steering');
        if (idx !== -1) {
          newComponents[idx].health = 35;
          appliedAnomalies.push('Steering play defect: Steering rack leakage diagnosed');
        }
        dropdownDeduct += 12;
      }

      // Update the main components state with the mechanic's findings so the interactive charts update!
      setComponents(newComponents);

      // Log the review report details in memory
      const calculatedAnalysisScore = Math.max(1, Math.min(100, Math.round(
        calculatedScore - (dropdownDeduct + (serviceAlert ? 5 : 0))
      )));

      // Insert mechanic assessment as a fresh verified service record on top of customLogs stack!
      const newLogRecord: ServiceRecord = {
        id: `ser-diagnostics-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'Major',
        mechanic: user ? (user.fullName || user.email) : 'Certified Independent Workshop Inspector',
        mileage: kmsDone,
        cost: mechanicDropdownProblem === 'oil_change' ? 3500 : mechanicDropdownProblem === 'brake_damage' ? 8500 : 0,
        notes: `MECHANIC DIRECT CAR INSPECTION DIAGNOSIS: Engine Issue Diagnosed: "${mechanicEngineIssue}". Rating applied: ${mechanicEngineRating}/5. Found: ${mechanicDropdownProblem === 'none' ? 'General mechanical review' : mechanicDropdownProblem.replace('_', ' ').toUpperCase()}`,
        components: ['Engine', 'Technical Inspection']
      };
      setCustomLogs(prev => [newLogRecord, ...prev]);

      setCustomAnalysisReport({
        timestamp: new Date().toLocaleTimeString(),
        registration_number: reg.toUpperCase(),
        brand: brandName,
        model: modelName,
        rc_data: mockRcDetails,
        owner_data: mockOwnerDetails,
        service_data: mockServiceDetails,
        mechanic_findings: {
          issue_reported: mechanicEngineIssue,
          engine_rating: `${mechanicEngineRating} / 5`,
          problem_flag: mechanicDropdownProblem,
          anomalies_applied: appliedAnomalies
        },
        calculated_results: {
          engine_deduction_applied: Math.round(engineDeduct + dropdownDeduct),
          final_integrity_score: calculatedAnalysisScore
        }
      });
    }, 2000);
  };

  // PDF report handler
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const vMake = selectedVehicle ? selectedVehicle.brand : customVehicle.brand;
    const vModel = selectedVehicle ? selectedVehicle.model : customVehicle.model;
    const vReg = selectedVehicle ? selectedVehicle.registrationNumber : customVehicle.registrationNumber;
    const vOwner = selectedVehicle ? 'AsOne Verified Partner' : customVehicle.ownerName;

    // Report Header Styling
    doc.setFillColor(15, 23, 42); // slate-900 background for title block
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('ASONE DEALER CERTIFICATION', 14, 20);
    doc.setFontSize(10);
    doc.text('NATIONAL CAR HEALTH REGISTRY & SERVICE VERIFICATION REPORT', 14, 27);
    doc.text(`DATE ISSUED: ${new Date().toISOString().split('T')[0]}  |  REPORT ID: ASO-SEC-${Math.floor(100000 + Math.random() * 900000)}`, 14, 34);

    // Score Seal Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(140, 50, 55, 40, 3, 3, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text('VERIFICATION SUMMARY', 142, 58);
    doc.setFontSize(32);
    doc.text(`${calculatedScore}`, 142, 78);
    doc.setFontSize(16);
    doc.text(`Grade ${grade}`, 174, 78);
    doc.setFontSize(9);
    doc.text(`Condition: ${scoreStatus}`, 142, 85);

    // Car Profile details
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text('VEHICLE REGISTRATION DETAIL', 14, 55);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 57, 120, 57);

    doc.setFontSize(9);
    doc.text(`Registration No:`, 14, 63);
    doc.setFont('Helvetica', 'Bold');
    doc.text(`${vReg}`, 45, 63);
    doc.setFont('Helvetica', 'Normal');

    doc.text(`Make & Model:`, 14, 68);
    doc.text(`${vMake} ${vModel}`, 45, 68);

    doc.text(`Manufacture Year:`, 14, 73);
    doc.text(`${vYear}`, 45, 73);

    doc.text(`Odometer (Kms):`, 14, 78);
    doc.text(`${mileage.toLocaleString()} kms`, 45, 78);

    doc.text(`Owner Name:`, 14, 83);
    doc.text(`${vOwner}`, 45, 83);

    doc.text(`Accident Record:`, 14, 88);
    doc.text(`${accidentLevel.toUpperCase()}`, 45, 88);

    // Components Grid
    doc.setFontSize(14);
    doc.text('HEALTH DEGRADATION METRICS & REPLACEMENTS', 14, 105);
    doc.line(14, 107, 195, 107);

    const componentTableData = components.map(c => [
      c.name,
      `${c.health}%`,
      c.health >= 85 ? 'Excellent' : c.health >= 70 ? 'Good' : c.health >= 50 ? 'Fair' : 'Overhaul Advised',
      `INR ${c.replacementCost.toLocaleString()}`,
      `₹${Math.round(c.replacementCost * ( (100 - c.health)/100 )).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 110,
      head: [['Component Group', 'Health %', 'Evaluation', 'New Part Cost', 'Est. Accrued Deficit']],
      body: componentTableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8 }
    });

    // Sub-summary block
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(30, 41, 59);
    doc.rect(14, finalY, 182, 28, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`FINANCIAL IMPACT ASSUMPTION (CIBIL AUTO SCORE MODEL)`, 18, finalY + 8);
    doc.setFontSize(8.5);
    doc.text(`Typical Base Fair Price: INR ${absoluteEstValue.toLocaleString()}  |  Health Adjust Factor: ${multiplier > 1.0 ? '+' : ''}${Math.round((multiplier - 1) * 100)}%`, 18, finalY + 14);
    doc.setFontSize(10);
    doc.text(`Certified Market Fair Value Estimate: INR ${finalScoreValue.toLocaleString()}`, 18, finalY + 22);

    // Footer Security Notice
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text(`Polygon Decentralized Ledger Seal Block Trace Hash: ${blockchainHash.toUpperCase()}`, 14, 276);
    doc.text('Security Verification: This inspection summary acts as a registered vehicle asset report. Authenticate digitally via QR code on showrooms floors.', 14, 282);
    
    doc.save(`Certified_Car_Health_Score_${vReg}.pdf`);
  };

  // Pre-seed search bar autocomplete results
  const filteredSuggestions = MOCK_VEHICLES.filter(v => {
    const term = searchQuery.toLowerCase();
    return (
      v.registrationNumber?.toLowerCase().includes(term) ||
      v.brand?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term)
    );
  }).slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 pb-32 bg-slate-50/50">
      <Helmet>
        <title>Car Health Score Lookup - CIBIL for Cars | AsOneDealer</title>
        <meta name="description" content="Enter your vehicle registration plate number to lookup verified health metrics, service chronicles, and calculate current health grade." />
      </Helmet>

      {/* Dynamic Header */}
      <section className="text-center space-y-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black tracking-wide uppercase">
          <ShieldCheck size={14} className="animate-pulse" /> Verified CIBIL Vehicle Registry
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">
          Car Health <span className="text-blue-600 italic">Score Registry</span>
        </h1>
        <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto font-medium">
          The national standard for used car transparent evaluation. Enter your registration number to perform a real-time, service-history-driven health audit.
        </p>
      </section>

      {/* Search Input Box Card */}
      <section className="max-w-xl mx-auto relative z-50">
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-visible bg-white">
          <CardContent className="p-6 space-y-4 relative">
            <div className="space-y-2">
              <Label htmlFor="reg-lookup" className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Search size={16} className="text-blue-500" /> Enter Vehicle Registration Plate Number
              </Label>
              <div className="relative flex gap-2">
                <Input 
                  id="reg-lookup"
                  type="text" 
                  placeholder="e.g. BR01-BZ-1234, DL1-GT-6363"
                  className="h-14 pl-5 pr-12 rounded-2xl border-slate-200 font-bold focus-visible:ring-primary text-slate-900 placeholder:text-slate-400 flex-1"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      const matched = MOCK_VEHICLES.find(
                        v => v.registrationNumber?.toLowerCase() === searchQuery.trim().toLowerCase()
                      );
                      if (matched) {
                        handleSelectVehicle(matched);
                      } else {
                        setSelectedVehicle(null);
                        setCustomVehicle(prev => ({ ...prev, registrationNumber: searchQuery.toUpperCase() }));
                        setHasSearched(true);
                      }
                      setShowSuggestions(false);
                    }
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                <Button 
                  onClick={() => {
                    if (searchQuery.trim()) {
                      const matched = MOCK_VEHICLES.find(
                        v => v.registrationNumber?.toLowerCase() === searchQuery.trim().toLowerCase()
                      );
                      if (matched) {
                        handleSelectVehicle(matched);
                      } else {
                        setSelectedVehicle(null);
                        setCustomVehicle(prev => ({ ...prev, registrationNumber: searchQuery.toUpperCase() }));
                        setHasSearched(true);
                      }
                      setShowSuggestions(false);
                    }
                  }}
                  className="h-14 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wide shrink-0"
                >
                  Check Score
                </Button>
                <div className="absolute right-[136px] top-1/2 -translate-y-1/2 pointer-events-none">
                  <Wrench size={18} className="text-slate-400" />
                </div>
              </div>
            </div>

            {/* Auto Suggestions list */}
            {showSuggestions && searchQuery && (
              <div className="absolute left-6 right-6 top-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
                {filteredSuggestions.map((item, idx) => (
                  <button
                    key={item.id}
                    className="w-full text-left p-4 hover:bg-blue-50/50 transition-colors flex items-center justify-between"
                    onClick={() => handleSelectVehicle(item)}
                  >
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm tracking-tight">{item.brand} {item.model}</p>
                      <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin size={10} /> {item.city}  |  Odometer: {item.kilometersDriven?.toLocaleString()} kms
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-blue-100 text-blue-800 font-extrabold text-[10px] uppercase border-none">
                        {item.registrationNumber || 'Bihar Registry'}
                      </Badge>
                    </div>
                  </button>
                ))}
                
                {/* Fallback Option */}
                <button
                  className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center gap-2 text-blue-600 font-black text-xs"
                  onClick={() => {
                    setSelectedVehicle(null);
                    setCustomVehicle(prev => ({ ...prev, registrationNumber: searchQuery.toUpperCase() }));
                    setShowSuggestions(false);
                    setIsUnlocked(false);
                    setHasSearched(true);
                  }}
                >
                  <Plus size={14} /> Register & Generate Health Score for "{searchQuery.toUpperCase()}"
                </button>
              </div>
            )}

            {/* Quick Helper Tips */}
            <div className="flex flex-wrap gap-2 pt-2 justify-center">
              <span className="text-xs text-slate-400 font-bold self-center">Try Registered:</span>
              {MOCK_VEHICLES.slice(0, 3).map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSelectVehicle(v)}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-600 hover:text-blue-600 font-extrabold text-[10px] transition-colors"
                >
                  {v.registrationNumber}
                </button>
              ))}
            </div>

          </CardContent>
        </Card>
      </section>

      {/* Main Core Dashboard */}
      {!hasSearched ? (
        <Card className="rounded-[2.5rem] border-2 border-dashed border-blue-200 bg-blue-50/5 p-8 md:p-16 text-center max-w-3xl mx-auto space-y-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-blue-100">
            <Search size={32} />
          </div>
          <div className="space-y-3 max-w-lg mx-auto">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Enter Car Registration Plate Number</h3>
            <p className="text-slate-500 font-bold text-sm leading-relaxed">
              Verify CIBIL score checks, individual component wear breakdowns, structural accident logs & dynamic Indian market valuation instantly.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto pt-2">
            <span className="w-full text-[10px] font-black tracking-widest text-slate-400 uppercase">Or select an active showroom vehicle:</span>
            {MOCK_VEHICLES.slice(0, 3).map((v) => (
              <button
                key={v.id}
                onClick={() => handleSelectVehicle(v)}
                className="px-4 py-2 bg-white hover:bg-blue-600 hover:text-white rounded-xl border border-slate-250 text-slate-700 hover:border-blue-600 font-extrabold text-xs transition-all tracking-tight shadow-sm hover:scale-105"
              >
                Inspect {v.registrationNumber}
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Gauge, Grade, Resale Valuation */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Active Audit Profile</CardTitle>
                  <CardDescription className="text-slate-400 font-medium">Verified Registration Ledger Record</CardDescription>
                </div>
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-none font-black px-3.5 py-1.5 text-xs">
                  {selectedVehicle ? 'MARKTPLACE ID' : 'REGISTRY RECORD'}
                </Badge>
              </div>

              {/* Dynamic summary block inside CardHeader */}
              <div className="mt-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <Gauge className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : `${customVehicle.brand} ${customVehicle.model}`}</h3>
                  <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                    Plate: <span className="text-white font-extrabold">{selectedVehicle ? selectedVehicle.registrationNumber : customVehicle.registrationNumber}</span> 
                    | Odo: <span className="text-white font-extrabold">{mileage.toLocaleString()} kms</span>
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8 text-center">
              
              {/* CIBIL Score Gauge Circle */}
              <div 
                className="relative w-48 h-48 mx-auto flex items-center justify-center cursor-help"
                onMouseEnter={() => setIsHoveringGauge(true)}
                onMouseLeave={() => setIsHoveringGauge(false)}
              >
                
                {/* SVG Gauge Circle Arc */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="82"
                    stroke="#f1f5f9"
                    strokeWidth="11"
                    fill="transparent"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="82"
                    stroke="url(#colorGradient)"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 82}
                    strokeDashoffset={2 * Math.PI * 82 * (1 - animatedScore / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-75 ease-out"
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Score numbers block inside */}
                <div className="text-center space-y-1 z-10 select-none">
                  <span className="text-5xl font-black tracking-tighter text-slate-900 block">{animatedScore}</span>
                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase block">Out of 100</span>
                  <Badge className={`mx-auto ${badgeColor} text-white font-black text-[10px] px-2 py-0.5 mt-1 border-none uppercase rounded-full`}>
                    Grade {grade}
                  </Badge>
                </div>

                {/* Smooth hover layout breakdown tooltip */}
                <AnimatePresence>
                  {isHoveringGauge && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.92, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 12 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="absolute z-50 bottom-full mb-3 w-80 bg-slate-950/95 backdrop-blur-md rounded-[2.2rem] border border-slate-800 p-6 text-left text-white shadow-2xl pointer-events-none"
                    >
                      <h4 className="text-[11px] font-black uppercase text-blue-400 tracking-widest mb-3.5 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-blue-400 animate-pulse" /> CIBIL Core Audit Deductions
                      </h4>
                      
                      <div className="space-y-2.5 font-sans">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">Base Pristine Score:</span>
                          <span className="font-extrabold text-white">100.0 pts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2">
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Age Depreciation:
                          </span>
                          <span className="font-extrabold text-red-400">-{ageDeduction.toFixed(1)} pts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2">
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Odometer Wearout:
                          </span>
                          <span className="font-extrabold text-red-400">-{mileageDeduction.toFixed(1)} pts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2">
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Component Sliders Wear:
                          </span>
                          <span className="font-extrabold text-red-400">-{componentDeductions.toFixed(1)} pts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2">
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Maintenance Compliance:
                          </span>
                          <span className={`font-extrabold ${serviceOverdue ? "text-red-400" : "text-emerald-400"}`}>
                            {serviceOverdue ? '-7.0 pts' : '+3.0 pts bonus'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2">
                          <span className="text-slate-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" /> Accident/Fault History:
                          </span>
                          <span className="font-extrabold text-red-400">-{accidentDeduction.toFixed(1)} pts</span>
                        </div>

                        <div className="flex justify-between items-center text-xs border-t-2 border-dashed border-slate-800 pt-3 mt-1">
                          <span className="text-white font-black uppercase tracking-tight text-[10px]">Net Certified Score:</span>
                          <span className="font-black text-blue-400 text-sm">{calculatedScore} / 100</span>
                        </div>
                      </div>

                      <div className="text-[9px] font-bold text-slate-500 mt-3.5 text-center flex items-center justify-center gap-1">
                        <Info size={11} className="text-slate-500" /> Real-time weights compiled via CIBIL Auto-Model v4.7
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Explanation */}
              <div className="space-y-2 max-w-sm mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-slate-200">
                  Evaluation: <span className={scoreStatus === 'Excellent' ? 'text-emerald-600' : scoreStatus === 'Good' ? 'text-blue-600' : scoreStatus === 'Fair' ? 'text-amber-600' : 'text-red-600'}>{scoreStatus}</span>
                </div>
                <p className="text-slate-500 font-bold text-sm tracking-tight">
                  {descriptionText}
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* Dynamic Resale Impact (rupee calculator proposition) */}
              <div className="space-y-4 text-left">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                  <Coins size={14} className="text-yellow-500" /> Resale price impact estimator
                </h4>

                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Base Market Estimation</p>
                    <p className="text-lg font-extrabold text-slate-700">₹{absoluteEstValue.toLocaleString()}</p>
                  </div>
                  <ChevronRight className="text-slate-300" size={16} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Dynamic Verification Value</p>
                    <p className="text-lg font-black text-slate-900">₹{finalScoreValue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="rounded-2xl p-3.5 bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-blue-900 leading-tight">
                      {premiumAmt >= 0 ? `Earns ₹${premiumAmt.toLocaleString()} Value Bonus` : `Decreases resale price by ₹${Math.abs(premiumAmt).toLocaleString()}`}
                    </h5>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                      Your Certified Grade {grade} score accounts for {Math.abs(Math.round((multiplier - 1) * 100))}% {premiumAmt >= 0 ? 'growth' : 'reduction'} over uncertified vehicles.
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Core Actions Panel */}
              <div className="flex flex-col gap-3">
                {!user ? (
                  <Button 
                    onClick={() => {
                      const currentReg = selectedVehicle?.registrationNumber || customVehicle?.registrationNumber || '';
                      navigate(`/login?redirect=${encodeURIComponent(`/car-health-score?reg=${currentReg}`)}`);
                    }}
                    className="w-full h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 uppercase text-xs tracking-wider"
                  >
                    <Lock size={16} /> Log In to Download Report
                  </Button>
                ) : (
                  <Button 
                    onClick={handleDownloadPDF} 
                    className="w-full h-13 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                  >
                    <FileText size={18} /> Download Certified Inspection PDF
                  </Button>
                )}

                {/* Simulated Mechanic Dashboard Toggle */}
                <div className="pt-2 text-center">
                  <p className="text-[10px] text-slate-400 font-bold">
                    {!user ? "* Full professional maintenance reports and manual modifiers require registration." : "* Want to edit values or log manual diagnostics? See options below."}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Verification Shield (OTP simulation lock screen) */}
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  {isUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
                </div>
                <div>
                  <CardTitle className="text-sm font-extrabold text-slate-900">Security & Privacy Guard</CardTitle>
                  <CardDescription className="text-xs font-medium text-slate-500">Simulate CIBIL Owner authorization</CardDescription>
                </div>
              </div>
              <Badge className={isUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                {isUnlocked ? 'Unlocked' : 'Authorization Needed'}
              </Badge>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {isUnlocked ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="text-xs font-extrabold text-slate-700">Identity successfully authorized! You enjoy full granular service and diagnostics reports access.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsUnlocked(false)}
                    className="rounded-xl font-bold"
                  >
                    Lock Registry Access
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-bold">
                    Showrooms buyers verify car profiles using 1-step owner OTP. Protect financial repair history securely.
                  </p>

                  {otpSent ? (
                    <div className="space-y-3">
                      <Label htmlFor="verification-otp" className="text-xs font-bold text-slate-800">Enter Verification Code (Enter '1234' or any code)</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="verification-otp"
                          placeholder="e.g. 1234" 
                          maxLength={4}
                          className="h-11 font-extrabold text-center text-lg rounded-xl border-slate-200"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                        <Button onClick={verifyOtp} className="h-11 rounded-xl bg-slate-900 text-white font-bold">Verify</Button>
                      </div>
                      {otpError && <p className="text-xs text-red-500 font-bold">{otpError}</p>}
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={triggerOtp} 
                      className="w-full h-11 rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50/50 hover:text-blue-700 font-extrabold flex items-center justify-center gap-2"
                    >
                      <ShieldCheck size={16} /> Authenticate Verification Code (SMS OTP)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Diagnostics & Operations tabs */}
        <div className="lg:col-span-7 space-y-6" id="details_panel">
          
          <Tabs defaultValue="diagnostics" className="w-full">
            <TabsList className="grid grid-cols-5 bg-slate-100 p-1 rounded-2xl h-14 shadow-inner">
              <TabsTrigger value="diagnostics" className="rounded-xl font-black text-[9px] md:text-[10px] tracking-tighter py-2">
                Status
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-black text-[9px] md:text-[10px] tracking-tighter py-2">
                History
              </TabsTrigger>
              <TabsTrigger value="forecasting" className="rounded-xl font-black text-[9px] md:text-[10px] tracking-tighter py-2 text-blue-600">
                🔮 Forecast
              </TabsTrigger>
              <TabsTrigger value="iot-blockchain" className="rounded-xl font-black text-[9px] md:text-[10px] tracking-tighter py-2">
                IoT & Blockchain Ledger
              </TabsTrigger>
              <TabsTrigger value="admin" className="rounded-xl font-black text-[9px] md:text-[10px] tracking-tighter py-2">
                Workshop
              </TabsTrigger>
            </TabsList>
            {/* Diagnostics Component Status Sliders */}
            <TabsContent value="diagnostics" className="mt-4 space-y-4">
              {!user && !sandboxEnabled ? (
                <div className="relative overflow-hidden rounded-[2.5rem] border border-blue-500/20 bg-slate-900 text-white shadow-2xl p-8 md:p-12 text-center space-y-6">
                  {/* Background ambient glowing spheres */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/5">
                    <Lock size={28} className="animate-pulse" />
                  </div>
                  
                  <div className="space-y-2 max-w-md mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Authentication Required
                    </div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase">Raw Sliders Gated</h3>
                    <p className="text-xs text-slate-400 font-bold leading-relaxed">
                      Detailed component-level raw wear overrides and simulation sliders are secured for authenticated partners to protect official national logs.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 justify-center max-w-xs mx-auto pt-2">
                    <Button
                      onClick={() => {
                        const currentReg = selectedVehicle?.registrationNumber || customVehicle?.registrationNumber || '';
                        navigate(`/login?redirect=${encodeURIComponent(`/car-health-score?reg=${currentReg}`)}`);
                      }}
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
                    >
                      🔑 Log In / Register to Unlock
                    </Button>
                    <div className="text-slate-500 font-black text-[9px] uppercase tracking-widest py-1">— OR —</div>
                    <Button
                      onClick={() => setSandboxEnabled(true)}
                      variant="outline"
                      className="w-full h-11 rounded-xl border-dashed border-2 border-blue-500/30 hover:border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-extrabold text-[11px] uppercase tracking-wider active:scale-95 transition-all"
                    >
                      ⚡ Sandbox Bypass (Simulated Mechanic)
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl bg-white overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase text-slate-900 flex items-center gap-1.5">
                    <Gauge className="text-blue-500" size={18} /> Component Group Health Sliders
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    Calculated from physical sensor feedback. Slide to custom simulate individual component performance deficits:
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Dynamic Alert Banner based on component failures */}
                  {components.some(c => c.health < 60) && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <div>
                        <h5 className="text-xs font-black text-amber-900">Low component diagnostics alert!</h5>
                        <p className="text-[10px] font-semibold text-slate-600 mt-0.5">
                          Battery health or Brakes diagnostics are flagged fair/poor. This triggers deductions under the CIBIL algorithm, reducing overall Grade eligibility.
                        </p>
                      </div>
                    </div>
                  )}

                   {/* Components Map */}
                   <div className="space-y-4">
                     {components.map((c) => (
                       <div key={c.key} className="space-y-1.5 p-3 rounded-2xl hover:bg-slate-50/80 border border-transparent hover:border-slate-100 transition-all duration-200 relative group/comp">
                         <div className="flex items-center justify-between">
                           <Label className="text-xs font-black text-slate-800 flex items-center gap-1.5 cursor-help">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {c.name}
                             <Info size={12} className="text-slate-400 group-hover/comp:text-blue-500 transition-colors" />
                           </Label>
                           <span className={`text-xs font-black ${c.health >= 85 ? 'text-emerald-600' : c.health >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>
                             {c.health}% ({c.health >= 85 ? 'Excellent' : c.health >= 70 ? 'Good' : 'Overhaul Area'})
                           </span>

                           {/* Rich component diagnostic breakdown tooltip */}
                           <div className="absolute left-3 bottom-full mb-2 w-80 bg-slate-950 text-white rounded-[1.8rem] border border-slate-800 p-5 shadow-2xl pointer-events-none opacity-0 scale-95 origin-bottom-left transition-all duration-250 z-50 group-hover/comp:opacity-100 group-hover/comp:scale-100">
                             <div className="space-y-2.5 text-xs text-left font-sans">
                               <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                                 <span className="font-extrabold uppercase text-[10px] text-blue-400 tracking-wider">
                                   {c.name} Diagnostics
                                 </span>
                                 <Badge className={`${c.health >= 85 ? 'bg-emerald-500' : c.health >= 70 ? 'bg-blue-500' : 'bg-amber-500'} text-white font-black text-[9px] px-2 py-0.5 border-none rounded-full`}>
                                   {c.health}% Health
                                 </Badge>
                               </div>
                               
                               <p className="text-[10.5px] font-semibold text-slate-300 leading-normal bg-slate-900/50 p-2.5 rounded-xl border border-slate-900">
                                 {getComponentDiagnosis(c.key, c.health)}
                               </p>
                               
                               <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9.5px] font-bold text-slate-400 pt-2 border-t border-slate-950">
                                 <div>
                                   Impact Weight: <span className="text-white font-extrabold">{c.weight}%</span>
                                 </div>
                                 <div className="text-right">
                                   Plat Deduction: <span className="text-red-400 font-extrabold">-{( (100 - c.health) / 100 * c.weight ).toFixed(1)} pts</span>
                                 </div>
                                 <div>
                                   Replacement Cost: <span className="text-white font-extrabold">₹{c.replacementCost.toLocaleString()}</span>
                                 </div>
                                 <div className="text-right">
                                   Value Deficit: <span className="text-red-400 font-extrabold">₹{Math.round(c.replacementCost * ((100 - c.health)/100 || 0)).toLocaleString()}</span>
                                 </div>
                               </div>
                             </div>
                           </div>

                         </div>
                         <div className="flex items-center gap-3">
                           <input 
                             type="range" 
                             min="10" 
                             max="100" 
                             className="flex-1 accent-blue-600 h-1.5 rounded-lg bg-slate-100 cursor-pointer"
                             value={c.health}
                             onChange={(e) => {
                               const val = parseInt(e.target.value);
                               setComponents(components.map(item => item.key === c.key ? { ...item, health: val } : item));
                             }}
                           />
                           <span className="text-[9px] font-black text-slate-400 w-12 tracking-tighter uppercase text-right">
                             Weight {c.weight}%
                           </span>
                         </div>
                         <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400 px-0.5 pt-0.5">
                           <span>Est. replacement cost: <span className="font-extrabold text-slate-700">₹{c.replacementCost.toLocaleString()}</span></span>
                           <span>Performance Accrued: <span className="font-extrabold text-slate-700">₹{Math.round(c.replacementCost * ((100 - c.health)/100 || 0)).toLocaleString()} deficit</span></span>
                         </div>
                       </div>
                     ))}
                   </div>

                  {/* Age & Mileage Controls Slider for customized records */}
                  <hr className="border-slate-100" />
                  
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Vehicle Profile Variables</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Age Control */}
                      <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-black text-slate-800">Vehicle Age (Years)</Label>
                          <span className="text-xs font-black text-blue-600">{age} yrs old</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="15"
                          className="w-full accent-blue-600 h-1 rounded-lg bg-slate-200 cursor-pointer"
                          value={age}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            const updatedYear = currentYear - val;
                            if (selectedVehicle) {
                              setSelectedVehicle({ ...selectedVehicle, year: updatedYear });
                            } else {
                              setCustomVehicle(prev => ({ ...prev, year: updatedYear }));
                            }
                          }}
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 font-semibold pt-1">
                          <span>Deduction applied:</span>
                          <span className="text-red-500 font-bold">-{ageDeduction} points</span>
                        </div>
                      </div>

                      {/* Mileage Control */}
                      <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-black text-slate-800">Odometer (Kilometers)</Label>
                          <span className="text-xs font-black text-blue-600">{(mileage / 1000).toFixed(0)}k Kms</span>
                        </div>
                        <input 
                          type="range"
                          min="1000"
                          max="200000"
                          step="1000"
                          className="w-full accent-blue-600 h-1 rounded-lg bg-slate-200 cursor-pointer"
                          value={mileage}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (selectedVehicle) {
                              setSelectedVehicle({ ...selectedVehicle, kilometersDriven: val });
                            } else {
                              setCustomVehicle(prev => ({ ...prev, kilometersDriven: val }));
                            }
                          }}
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 font-semibold pt-1">
                          <span>Deduction applied:</span>
                          <span className="text-red-500 font-bold">-{mileageDeduction} points</span>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox settings */}
                    <div className="flex items-center gap-4 pt-2 justify-between">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="is_overdue" 
                          checked={serviceOverdue}
                          onChange={(e) => setServiceOverdue(e.target.checked)}
                          className="rounded text-blue-600 bg-slate-100 border-slate-300 w-4 h-4 focus:ring-blue-500"
                        />
                        <label htmlFor="is_overdue" className="text-xs font-black text-slate-700 cursor-pointer select-none">
                          Flag Service Schedule OVERDUE?
                        </label>
                      </div>
                      <span className={`text-[10px] font-black ${serviceHistoryDeduction > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {serviceHistoryDeduction > 0 ? `-${serviceHistoryDeduction} points` : `+${Math.abs(serviceHistoryDeduction)} bonus points`}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2">
                      <Label className="text-xs font-black text-slate-600">Accident level deduction</Label>
                      <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl">
                        {(['none', 'minor', 'moderate', 'major', 'flood'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => setAccidentLevel(level)}
                            className={`py-2 text-[10px] font-black uppercase rounded-lg transition-colors ${accidentLevel === level ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 mt-1">
                        <span>Level explanation:</span>
                        <span className={accidentDeduction > 0 ? 'text-red-500' : 'text-emerald-500'}>
                          {accidentDeduction > 0 ? `-${accidentDeduction} points deduction` : 'Zero damage record'}
                        </span>
                      </div>
                    </div>

                  </div>

                </CardContent>
              </Card>
              )}
            </TabsContent>

            {/* Service Chronicle Register Logs timeline */}
            <TabsContent value="history" className="mt-4 space-y-4">
              {/* CIBIL Score Simulation Module */}
              <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <CardHeader className="p-6 md:p-8 pb-3 border-b border-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest leading-none">
                        <Sparkles size={10} /> CIBIL Score simulation engine
                      </div>
                      <CardTitle className="text-xl font-black uppercase text-white flex items-center gap-2">
                        Financial & Service CIBIL appraisal
                      </CardTitle>
                      <CardDescription className="text-xs font-semibold text-slate-400">
                        Simulate the vehicle's creditworthiness, RTO hypothecation history, and past claim status.
                      </CardDescription>
                    </div>
                    {user ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black px-3 py-1.5 text-[10px] uppercase tracking-wider self-start md:self-center">
                        ✓ UNLOCKED (PHONE: {user.phone || "Verified Owner"})
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 font-black px-3 py-1.5 text-[10px] uppercase tracking-wider self-start md:self-center">
                        🔒 GATED SIMULATOR
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 md:p-8 space-y-6">
                  {user ? (
                    /* Logged-In Unlocked view */
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-4 text-center md:text-left bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Live CIBIL Score</p>
                        <div className="text-4xl font-black text-emerald-400">
                          {Math.min(900, Math.max(300, Math.round(300 + (calculatedScore / 100) * 600)))}
                          <span className="text-sm font-bold text-slate-400"> / 900</span>
                        </div>
                        <Badge className="bg-emerald-500 text-slate-950 font-black tracking-wider uppercase text-[9px] border-none">
                          EXCELLENT STANDING
                        </Badge>
                      </div>
                      <div className="md:col-span-8 space-y-2">
                        <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                          💼 Financial Record Synchronized successfully
                        </h4>
                        <p className="text-xs text-slate-300 font-bold leading-relaxed">
                          Great news! This vehicle has an active history of on-time hypothecation payments, zero outstanding RTO tax notices, and a clean insurance file. Register details have been authenticated with user record <strong className="text-blue-400">{user.email}</strong>.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-bold border border-white/5">0 hypothecation alarms</span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-bold border border-white/5">1-owner ledger</span>
                          <span className="text-[9px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-bold border border-white/5">No blacklists</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Guest View: Simulator Interface */
                    <div className="space-y-6">
                      {isSimulatingCibil ? (
                        /* Simulation Loading State */
                        <div className="text-center py-8 space-y-4 max-w-sm mx-auto">
                          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-white">Running Financial Ledger Check...</h4>
                            <p className="text-[11px] text-slate-400 font-bold min-h-[32px] leading-tight transition-all duration-300">
                              {cibilLoadingPhase === 0 && "🔗 Establishing secure routing to National Vahan databases..."}
                              {cibilLoadingPhase === 1 && "📊 Gathering insurance claim archives (ICICI, HDFC, Vahan Register)..."}
                              {cibilLoadingPhase === 2 && "🔍 Mapping mechanical service checks and part fatigue files..."}
                              {cibilLoadingPhase === 3 && "📈 Finalizing vehicle CIBIL credit score appraisal metrics..."}
                            </p>
                          </div>
                          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${(cibilLoadingPhase + 1) * 25}%` }} 
                            />
                          </div>
                        </div>
                      ) : simulatedCibilScore !== null ? (
                        /* Simulation Success View, but with full chronicle lock details */
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            <div className="md:col-span-5 text-center bg-white/5 p-6 rounded-3xl border border-white/5 space-y-2">
                              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Simulated Vehicle CIBIL</p>
                              <div className="text-4xl font-black text-blue-400">
                                {simulatedCibilScore}
                                <span className="text-xs font-bold text-slate-400"> / 900</span>
                              </div>
                              <Badge className="bg-blue-500/20 text-blue-400 font-black px-2 py-0.5 text-[9px] uppercase border-none tracking-widest">
                                HIGH QUALITY PROFILE
                              </Badge>
                            </div>
                            <div className="md:col-span-7 space-y-2 text-center md:text-left">
                              <h4 className="text-md font-black text-white flex items-center justify-center md:justify-start gap-1.5">
                                🎉 Simulation Completed for +91 {cibilPhone}
                              </h4>
                              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                                Vehicle appraisal indicates a strong rating of <strong>{simulatedCibilScore}</strong> based on RTO records & component logs. However, the official financial registry claims and certified maintenance invoices are locked.
                              </p>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => { setSimulatedCibilScore(null); setCibilPhone(''); }} 
                                className="text-[10px] uppercase font-black text-slate-400 hover:text-white p-0 h-auto"
                              >
                                ← Test another phone number
                              </Button>
                            </div>
                          </div>

                          {/* Beautiful Lock Gate Container */}
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 text-center space-y-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto text-blue-400 border border-blue-500/30">
                              <Lock size={22} className="animate-bounce duration-[2000ms]" />
                            </div>
                            <div className="space-y-1.5 max-w-md mx-auto">
                              <h4 className="text-md font-black text-white uppercase tracking-tight">🔐 Detailed Service Chronicles Encrypted</h4>
                              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                                Detailed chronological invoice logs, parts replacements (totaling ₹76,400+ across 7 logged operations), and mechanics audit checksheets remain secured to protect individual owner privacy.
                              </p>
                              <p className="text-[10px] text-blue-300 font-bold">
                                Unlock this historical ledger instantly by completing a free, 30-second AsOne account registration linked with +91 {cibilPhone}.
                              </p>
                            </div>
                            <div className="pt-2">
                              <Button
                                onClick={() => {
                                  const currentReg = selectedVehicle?.registrationNumber || customVehicle?.registrationNumber || '';
                                  navigate(`/login?phone=${cibilPhone}&redirect=${encodeURIComponent(`/car-health-score?reg=${currentReg}`)}`);
                                }}
                                className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                              >
                                🔑 Register / Log In with Mobile to Unlock History
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Initial Phone Input Form */
                        <div className="max-w-md mx-auto space-y-4">
                          <p className="text-xs text-slate-300 font-bold text-center leading-relaxed">
                            Generate the simulated vehicular CIBIL score utilizing the active chassis stats, component wear metrics, and RTO registry check tools. Input your mobile to authorize.
                          </p>
                          <div className="space-y-3">
                            <label className="block text-[11px] font-black uppercase text-slate-400 tracking-wider">
                              Mobile Phone Number (OTP Target)
                            </label>
                            <div className="flex gap-2">
                              <div className="h-12 px-3 rounded-xl border border-white/10 bg-white/5 flex items-center text-xs font-black text-slate-400 tracking-wider shrink-0 select-none">
                                🇮🇳 +91
                              </div>
                              <Input 
                                type="tel" 
                                placeholder="Enter 10-digit mobile number" 
                                className="h-12 px-4 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 font-medium text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex-1"
                                value={cibilPhone}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                  setCibilPhone(val);
                                  if (cibilErrorMessage) setCibilErrorMessage('');
                                }}
                              />
                              <Button 
                                onClick={startCibilSimulation}
                                className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shrink-0"
                              >
                                Run Check
                              </Button>
                            </div>
                            {cibilErrorMessage && (
                              <p className="text-xs text-red-400 font-bold flex items-center gap-1">
                                <AlertTriangle size={12} /> {cibilErrorMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Chronological timeline lists */}
              <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl bg-white overflow-hidden relative">
                <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
                  <div>
                    <CardTitle className="text-lg font-black uppercase text-slate-900 flex items-center gap-1.5">
                      <History className="text-blue-500" size={18} /> Service Chronicles
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold text-slate-400">
                      Chronological list of mechanical interventions and partner mechanics checklists.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6 relative">
                  {/* Blurring out under a beautiful lock mask if not logged in */}
                  {!user && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[6px] z-20 flex flex-col items-center justify-center p-6 text-center">
                      <div className="max-w-md space-y-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-amber-100">
                          <Lock size={22} className="animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">🔒 Detailed Ledger Gated</h4>
                          <p className="text-xs text-slate-500 font-bold leading-relaxed font-sans">
                            Complete historical repair records, workshop invoices, technician checklists, and parts diagnostics are locked.
                          </p>
                        </div>
                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-wider bg-amber-50 px-3 py-1.5 rounded-full inline-block border border-amber-100/50">
                          Requires Simulated Phone Check & Standard Account Verification Above
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Operational Timeline Grid - Fully mapped from customLogs! */}
                  <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    {customLogs.map((log) => (
                      <div key={log.id} className="relative pl-9 space-y-2">
                        {/* Bullet circle */}
                        <div className={`absolute left-1 top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                          log.type === 'Routine' ? 'bg-blue-500 text-white' : 
                          log.type === 'Major' ? 'bg-orange-500 text-white' : 
                          log.type === 'Emergency' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          <CheckCircle2 size={12} fill="currentColor" className="text-white" />
                        </div>

                        {/* Title and date row */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            {log.type} Inspection Check & Service
                            <Badge className="bg-slate-100 text-slate-700 text-[9px] uppercase border-none">
                              {log.mileage.toLocaleString()} kms
                            </Badge>
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Calendar size={10} /> {log.date}
                          </span>
                        </div>

                        {/* Chronicle description */}
                        <p className="text-slate-600 text-xs font-bold leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                          {log.notes}
                        </p>

                        {/* Checked Components Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest self-center mr-1">Replaced/Refreshed:</span>
                          {log.components.map((c, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] font-extrabold text-blue-600 border-blue-100 bg-blue-50/20 px-2 rounded-lg">
                              {c}
                            </Badge>
                          ))}
                        </div>

                        {/* Cost assessment */}
                        <div className="text-[10px] text-slate-400 font-semibold p-1">
                          Diagnosed invoice value: <span className="font-extrabold text-slate-700">₹{log.cost.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Audit lookups details */}
                  <hr className="my-6 border-slate-100" />
                  
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Score Query Audit Log Ledger (Blockchain-like trace)</h4>
                    <p className="text-[10px] text-slate-400 font-bold">
                      To prevent vehicle verification database spoofing, every CIBIL Car Health lookup gets trace logs mapped:
                    </p>

                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                      {lookups.map((l, i) => (
                        <div key={i} className="p-3 text-[10px] flex justify-between items-center">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-700 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> IP Address: <span className="font-mono text-slate-900">{l.ip}</span>
                            </p>
                            <p className="text-slate-500 font-semibold">Source channel: {l.source} | Checked at {l.timestamp}</p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-extrabold text-[8px]">
                            {l.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* Predictive Maintenance Forecasting Module with custom Time-to-Next-Service projections & Self-healing action integrations */}
            <TabsContent value="forecasting" className="mt-4 space-y-4">
              <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-950 text-white p-6 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-black uppercase text-white tracking-wide">
                        Predictive Maintenance Forecast
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs font-semibold leading-none mt-1">
                        Component-level remaining useful life (RUL) projections & wear-slope calculators
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* Global Vehicle Prognosis Banner */}
                  <div className={`p-6 rounded-[2rem] border relative overflow-hidden flex flex-col md:flex-row items-center gap-6 ${
                    forecastingData.overallDays <= 30 
                      ? 'bg-red-50/75 border-red-200' 
                      : forecastingData.overallDays <= 90 
                        ? 'bg-amber-50/75 border-amber-200' 
                        : 'bg-emerald-50/75 border-emerald-200'
                  }`}>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full animate-ping ${
                          forecastingData.overallDays <= 30 
                            ? 'bg-red-500' 
                            : forecastingData.overallDays <= 90 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-505'
                        }`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-450 text-slate-400">
                          CIBIL Vehicle Projections Block
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                        Next Critical Service in{' '}
                        <span className={
                          forecastingData.overallDays <= 30 
                            ? 'text-red-600 font-extrabold font-mono' 
                            : forecastingData.overallDays <= 90 
                              ? 'text-amber-600 font-extrabold font-mono' 
                              : 'text-emerald-600 font-extrabold font-mono'
                        }>
                          {forecastingData.overallKms.toLocaleString()} kms
                        </span>
                        {' '} (~{forecastingData.overallDays} Days)
                      </h3>

                      <p className="text-slate-500 font-bold text-xs leading-relaxed">
                        Estimations specify that by <span className="font-extrabold text-slate-700">{forecastingData.formattedServiceDate}</span>, 
                        the vehicle's <span className="font-extrabold text-red-500">{forecastingData.bottleneck.name}</span> health state degrades past operating thresholds, requiring a service intervention.
                      </p>
                    </div>

                    {/* Highlight bottleneck box */}
                    <div className="bg-white p-4 border rounded-2xl flex flex-col items-center justify-center text-center shadow-sm min-w-[140px] text-xs font-bold shrink-0">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Bottleneck Link</span>
                      <span className="font-black text-slate-900 block leading-tight">{forecastingData.bottleneck.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-red-500 font-extrabold block mt-0.5">{forecastingData.bottleneck.health}% Health</span>
                    </div>
                  </div>

                  {/* Tuning Slider & Profile selectors */}
                  <div className="bg-slate-50/80 rounded-[2rem] border border-slate-100 p-6 space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                        ⚙️ Tune Mileage & Driving Parameters
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">
                        Adjust simulated daily commuting trends and roadway terrain style to watch remaining useful days scale in real time.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Daily Kilometers Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="daily-usage-range" className="text-xs font-black text-slate-700">Estimated Daily Commute</Label>
                          <span className="text-xs font-mono font-black text-blue-600">{dailyUsageKms} Kms / Day</span>
                        </div>
                        <input 
                          id="daily-usage-range"
                          type="range"
                          min="10"
                          max="150"
                          step="5"
                          className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          value={dailyUsageKms}
                          onChange={(e) => setDailyUsageKms(parseInt(e.target.value))}
                        />
                        <div className="flex justify-between text-[9px] text-slate-400 font-black">
                          <span>10 Kms/day</span>
                          <span>80 Kms/day</span>
                          <span>150 Kms/day</span>
                        </div>
                      </div>

                      {/* Driving Style Terrain buttons */}
                      <div className="space-y-2">
                        <Label className="text-xs font-black text-slate-700">Driving Terrain & Behavior</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setDrivingProfile('eco')}
                            className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                              drivingProfile === 'eco'
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            🌱 Eco Style
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrivingProfile('moderate')}
                            className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                              drivingProfile === 'moderate'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            🚗 Standard
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrivingProfile('aggressive')}
                            className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                              drivingProfile === 'aggressive'
                                ? 'bg-red-500 text-white border-red-500 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            🏁 Aggressive
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Components Remaining Useful Life Breakdown matrix */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wide">
                        Remaining Useful Life (RUL) Matrix
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">
                        Calculated chronological deterioration curve. Click "Reset & Heal" to simulate workshop spare replacements.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {forecastingData.items.map((item) => {
                        const isLowest = item.key === forecastingData.bottleneck.key;
                        return (
                          <div 
                            key={item.key} 
                            className={`p-4 rounded-3xl border transition-all hover:border-slate-350/55 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              isLowest 
                                ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                                : item.health < 55 
                                  ? 'bg-red-50/20 border-red-150' 
                                  : 'bg-white border-slate-100 hover:bg-slate-50/50'
                            }`}
                          >
                            {/* Component Name & advice info */}
                            <div className="space-y-0.5 sm:max-w-[40%]">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-black uppercase ${isLowest ? 'text-white' : 'text-slate-800'}`}>
                                  {item.name}
                                </span>
                                {isLowest && (
                                  <Badge className="bg-red-500 text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase border-none animate-pulse">
                                    CRITICAL PATHWAY
                                  </Badge>
                                )}
                                {!isLowest && item.health < 55 && (
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase border-none">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-[10px] leading-snug font-bold ${isLowest ? 'text-slate-300' : 'text-slate-500'}`}>
                                {item.advice}
                              </p>
                            </div>

                            {/* Remaining status bar */}
                            <div className="flex-1 max-w-xs space-y-1">
                              <div className="flex justify-between text-[10px] font-black">
                                <span className={isLowest ? 'text-slate-400' : 'text-slate-500'}>
                                  REMANENCE RATE ({item.health}%)
                                </span>
                                <span className={isLowest ? 'text-rose-400 font-mono' : 'text-slate-700 font-mono'}>
                                  {item.remainingKms.toLocaleString()} kms / {item.remainingDays} days
                                </span>
                              </div>
                              
                              {/* Custom status bar */}
                              <div className="h-1.5 bg-slate-150 rounded-full overflow-hidden relative">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    item.health < 55 ? 'bg-red-500' : item.health < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${item.health}%` }}
                                />
                              </div>
                            </div>

                            {/* Heal buttons */}
                            <div className="shrink-0">
                              {item.health >= 98 ? (
                                <div className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 h-9 justify-center">
                                  <CheckCircle size={10} /> Fully Calibrated
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => quickRepairComponent(item.key, item.name)}
                                  className="w-full sm:w-auto h-9 text-[10px] font-extrabold uppercase rounded-xl tracking-wider bg-blue-600 hover:bg-blue-700 text-white font-black hover:scale-102 active:scale-95 transition-all shadow-xs"
                                >
                                  🔧 Reset & Heal
                                </Button>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* IoT & Blockchain Verification Hub Segment (UNLOCKED FOR EVERYONE) */}
            <TabsContent value="iot-blockchain" className="mt-4 space-y-4 font-medium">
              <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-950 text-white p-6 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <Cpu size={22} className={iotScanning ? "animate-spin" : ""} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-black uppercase text-white tracking-wide">
                          IoT OBD-II Telemetry Console
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs font-semibold leading-none mt-1">
                          Continuous 4G On-Board Diagnostic Powertrain Stream
                        </CardDescription>
                      </div>
                    </div>
                    
                    <Badge className={`border-none font-black text-[10px] px-3 py-1 uppercase tracking-wider rounded-lg ${iotScanning ? "bg-amber-500 text-white animate-pulse" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
                      {iotScanning ? "OBD Scan Active" : "Live Stream Synced"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* IoT Visual Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* Coolant */}
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-3xl relative space-y-1 hover:border-blue-100 transition-colors">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Engine Coolant</span>
                      <span className="text-xl font-black text-slate-900 tracking-tight block font-mono">
                        {obdData.coolantTemp}°C
                      </span>
                      <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-500">
                        <Activity size={10} className="text-blue-500 shrink-0" />
                        <span>{obdData.coolantTemp > 94 ? "Active Temp" : "Optimal Peak"}</span>
                      </div>
                    </div>

                    {/* Alternator */}
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-3xl relative space-y-1 hover:border-blue-100 transition-colors">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">OBD-II Voltage</span>
                      <span className="text-xl font-black text-slate-900 tracking-tight block font-mono">
                        {obdData.alternatorVoltage}V
                      </span>
                      <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                        <span>Alternator Nominal</span>
                      </div>
                    </div>

                    {/* Exhaust CO2 */}
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-3xl relative space-y-1 hover:border-blue-100 transition-colors">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">CO₂ Filter Rate</span>
                      <span className="text-xl font-black text-slate-900 tracking-tight block font-mono">
                        {obdData.exhaustCo2}%
                      </span>
                      <div className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600">
                        <CheckCircle2 size={10} className="shrink-0" />
                        <span>Euro VI Certified</span>
                      </div>
                    </div>

                    {/* Intake Pressure */}
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-3xl relative space-y-1 hover:border-blue-100 transition-colors">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Intake MAP Vacuum</span>
                      <span className="text-xl font-black text-slate-900 tracking-tight block font-mono">
                        {obdData.manifoldPressure} kPa
                      </span>
                      <span className="text-[9.5px] font-medium text-slate-400 block font-sans">Throttle compression clean</span>
                    </div>

                    {/* RPM */}
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-3xl relative space-y-1 hover:border-blue-100 transition-colors">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Idle Tachometer</span>
                      <span className="text-xl font-black text-slate-900 tracking-tight block font-mono">
                        {obdData.rpmValue} <span className="text-[10px] font-bold text-slate-400">RPM</span>
                      </span>
                      <span className="text-[9.5px] font-medium text-slate-400 block font-sans">Stabilized crankshaft load</span>
                    </div>

                    {/* TPMS */}
                    <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-3xl relative space-y-1 hover:border-blue-100 transition-colors">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">TPMS Solenoids</span>
                      <span className="text-[10.5px] font-extrabold text-slate-900 tracking-tight block font-mono leading-tight">
                        FL: {obdData.tirePressureFrontLeft} | FR: {obdData.tirePressureFrontRight} <br/>
                        RL: {obdData.tirePressureRearLeft} | RR: {obdData.tirePressureRearRight} PSI
                      </span>
                      <span className="text-[9.5px] font-medium text-slate-400 block font-sans">Pneumatic balancing verified</span>
                    </div>
                  </div>

                  {/* Progressive scanning UI */}
                  {iotScanning && (
                    <div className="space-y-1.5 p-4 bg-blue-50 border border-blue-150 rounded-2xl">
                      <div className="flex justify-between items-center text-[10px] font-black text-blue-900 uppercase font-mono">
                        <span className="flex items-center gap-1">
                          <RefreshCw size={10} className="animate-spin" /> Pinging active CAN transceivers...
                        </span>
                        <span>{iotScanProgress}%</span>
                      </div>
                      <Progress value={iotScanProgress} className="h-1.5 bg-blue-200" />
                    </div>
                  )}

                  {/* Interactive Trigger Button */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={handleIotDiagnosticsScan}
                      disabled={iotScanning}
                      className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} className={iotScanning ? "animate-spin" : ""} />
                      {iotScanning ? "Scanning OBD Powertrain..." : "Trigger Live OBD-II Hardware Scan"}
                    </Button>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-[10px] font-bold text-slate-550 flex-1 sm:flex-none">
                      <div className="flex items-center gap-2 font-medium">
                        <Wifi size={14} className="text-emerald-500 shrink-0" />
                        <span>Last packet: <span className="font-mono font-black text-slate-800">{new Date(obdData.lastTransmission).toLocaleTimeString()}</span></span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Blockchain Segment */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
                          <Layers size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase text-slate-900 leading-none">
                            IoT & Blockchain Ledger Verification
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-1.5 leading-none">
                            Simulate fetching and auditing immutable vehicle diagnostics history from a secure decentralized ledger.
                          </p>
                        </div>
                      </div>

                      {/* Blockchain Certified Badge */}
                      <AnimatePresence mode="wait">
                        {blockchainVerificationSuccess ? (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-[10px] font-black uppercase tracking-wider shadow-sm shadow-emerald-500/5 animate-pulse"
                          >
                            <ShieldCheck size={14} className="text-emerald-550 shrink-0" />
                            <span>Blockchain Certified</span>
                          </motion.div>
                        ) : blockchainVerifying ? (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-550 text-[10px] font-black uppercase tracking-wider animate-pulse"
                          >
                            <RefreshCw size={12} className="animate-spin text-amber-550 shrink-0" />
                            <span>Polling Nodes...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider"
                          >
                            <Lock size={12} className="text-slate-400 shrink-0" />
                            <span>Unverified</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-3xl text-left border border-slate-800 relative space-y-4 shadow-xl">
                      <div className="absolute top-2.5 right-4 text-[8px] font-black tracking-widest text-purple-400 uppercase font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        Secure L2 Ledger Hub
                      </div>

                      {/* Display of the cryptographic verification hash */}
                      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">Verification Block Hash</span>
                          <span className="text-[8px] font-black text-emerald-400 uppercase font-mono">SHA-256 SECURED</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono">
                          <span className="text-[11px] font-extrabold text-blue-400 tracking-tight block truncate select-all">
                            {blockchainHash}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(blockchainHash);
                            }}
                            className="text-[9px] font-black uppercase text-purple-405 hover:text-purple-300 transition-colors shrink-0 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 text-purple-400"
                          >
                            Copy Hash
                          </button>
                        </div>
                        <p className="text-[9.5px] font-semibold text-slate-400 leading-normal font-sans">
                          A decentralized proof hash synthesized dynamically from the chassis number, manufacture seal, and live telemetry hashes.
                        </p>
                      </div>

                      {/* Simulated Block Trace Explorer (interactive data fetching output) */}
                      <div className="space-y-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-sans">Verified Ledger State Logs</span>
                        
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {/* If not fetched yet */}
                          {!blockchainVerificationSuccess && !blockchainVerifying && (
                            <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-slate-400 space-y-2">
                              <Layers size={24} className="text-slate-600 mx-auto animate-pulse" />
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-300 animate-pulse">Ledger Data Packets Offline</p>
                                <p className="text-[10px] text-slate-500">Click compile below to trigger simulated cryptographic data retrieval from the decentralized ledger network.</p>
                              </div>
                            </div>
                          )}

                          {/* During simulation */}
                          {blockchainVerifying && (
                            <div className="space-y-2 p-4 bg-slate-900/40 rounded-2xl border border-slate-800 font-mono text-[10px] text-slate-300">
                              <p className="text-blue-400 font-bold animate-pulse">// FETCHING IMMUTABLE BLOCKS...</p>
                              <div className="space-y-1 text-[9.5px] text-slate-400">
                                <p className={validatedNodesCount >= 1 ? "text-emerald-405 text-emerald-400 font-semibold" : ""}>{validatedNodesCount >= 1 ? "✓ node_patna_dealer connected." : "⚡ Connecting node_patna_dealer..."}</p>
                                <p className={validatedNodesCount >= 3 ? "text-emerald-405 text-emerald-400 font-semibold" : ""}>{validatedNodesCount >= 3 ? "✓ node_raipur_auth verified." : validatedNodesCount >= 2 ? "⚡ Pulling ledger consensus..." : "💤 node_raipur_auth waiting..."}</p>
                                <p className={validatedNodesCount >= 5 ? "text-emerald-405 text-emerald-400 font-semibold" : ""}>{validatedNodesCount >= 5 ? "✓ node_delhi_highway matches hash." : validatedNodesCount >= 4 ? "⚡ Resolving smart contract tokens..." : "💤 node_delhi_highway waiting..."}</p>
                                <p className={validatedNodesCount >= 7 ? "text-emerald-405 text-emerald-400 font-semibold" : ""}>{validatedNodesCount >= 7 ? "✓ hash agreement reached dynamically." : validatedNodesCount >= 6 ? "⚡ Synchronizing state root..." : "💤 consensus hub waiting..."}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-purple-400 font-bold">
                                <RefreshCw size={12} className="animate-spin" />
                                <span>Queried validation nodes: {validatedNodesCount} / 8 signatures</span>
                              </div>
                            </div>
                          )}

                          {/* When verification success (immutable data retrieved!) */}
                          {blockchainVerificationSuccess && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-2"
                            >
                              {/* Block #1 */}
                              <div className="p-3.5 bg-slate-900 border border-slate-900 hover:border-slate-850 rounded-2xl flex items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[10px] font-black text-purple-400">B#18,902,412</span>
                                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-wide">Genesis Manufacture Audit</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">Initial registration and chassis emissions alignment verified immutably.</p>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded-lg">VERIFIED</Badge>
                                  <span className="block font-mono text-[8px] text-slate-500 mt-1">2024-05-12</span>
                                </div>
                              </div>

                              {/* Block #2 */}
                              <div className="p-3.5 bg-slate-900 border border-slate-900 hover:border-slate-850 rounded-2xl flex items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[10px] font-black text-purple-400">B#18,945,801</span>
                                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-wide">Identity Registry Lock</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">Legal owner identity seal and digital key token logged to secure state root.</p>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded-lg">VERIFIED</Badge>
                                  <span className="block font-mono text-[8px] text-slate-500 mt-1">2024-09-18</span>
                                </div>
                              </div>

                              {/* Block #3 */}
                              <div className="p-3.5 bg-slate-900 border border-slate-900 hover:border-slate-850 rounded-2xl flex items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[10px] font-black text-purple-400">B#19,102,945</span>
                                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-wide">Workshop Diagnostic Anchors</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">Physical inspection results and wear calculations signed by master mechanic.</p>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded-lg">VERIFIED</Badge>
                                  <span className="block font-mono text-[8px] text-slate-500 mt-1">2025-02-04</span>
                                </div>
                              </div>

                              {/* Block #4 */}
                              <div className="p-3.5 bg-slate-900 border border-slate-900 hover:border-slate-850 rounded-2xl flex items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[10px] font-black text-purple-400">B#19,251,802</span>
                                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-wide">Live IoT Odometer Stream Lock</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400">Prevents mileage rollback fraud by compiling telemetry odometer trends directly.</p>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase rounded-lg">VERIFIED</Badge>
                                  <span className="block font-mono text-[8px] text-slate-500 mt-1">Today</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 border-t border-slate-900 pt-3 text-[10px] font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Ledger Target</span>
                          <span className="font-bold text-white text-[11px]">POLYGON-137</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Tx Fee Gas</span>
                          <span className="font-bold text-white text-[11px]">0.0028 MATIC</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase">Consensus Nodes</span>
                          <span className="font-bold text-emerald-400 text-[11px]">
                            {blockchainVerifying ? `${validatedNodesCount}/8 Signatures` : blockchainVerificationSuccess ? "8/8 Confirmed" : "Offline"}
                          </span>
                        </div>
                      </div>

                      {blockchainVerificationSuccess && (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-900/40 rounded-2xl space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
                            <CheckCircle2 size={14} />
                            <span>100% Immutable Consensus Match Succeeded</span>
                          </div>
                          <p className="text-[10px] font-medium text-emerald-400/80 leading-normal pl-5">
                            Verifying blocks on Patna Regional Node, Raipur Dealership Registry Node, and Delhi transit validators matches decentralized hashes exactly. Zero unauthorized manipulation claims detected. Car represents pristine truth.
                          </p>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          onClick={handleBlockchainLedgerVerify}
                          disabled={blockchainVerifying}
                          className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2"
                        >
                          {blockchainVerifying ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Requesting Validator Signatures...</span>
                            </>
                          ) : blockchainVerificationSuccess ? (
                            <>
                              <ShieldCheck size={14} />
                              <span>Re-verify Immutable Blocks Ledger</span>
                            </>
                          ) : (
                            <>
                              <Layers size={14} />
                              <span>Query Node Validation Proof & Fetch Logs</span>
                            </>
                          )}
                        </Button>
                      </div>

                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin log visits entry portal */}
            <TabsContent value="admin" className="mt-4 space-y-4">
              {!user && !sandboxEnabled ? (
                /* Gated API Section for unregistered visitors */
                <div className="rounded-[2.5rem] bg-slate-900 border border-slate-800 text-white p-8 md:p-12 space-y-6 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="w-16 h-16 bg-white/5 border border-white/10 text-amber-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Lock size={28} className="animate-pulse" />
                  </div>
                  <div className="space-y-2 max-w-sm mx-auto">
                    <h4 className="text-base font-black uppercase tracking-wider text-slate-100">
                      🔒 Multi-Source Car Details API Gated
                    </h4>
                    <p className="text-xs text-slate-400 font-bold leading-normal">
                      To fetch registered chassis records from **Vahan RC API**, resolve legal identity from the **Owner Registry**, and extract full past records to analyze, AsOne requires workshop authorization.
                    </p>
                  </div>
                  <div className="pt-2 max-w-xs mx-auto space-y-3">
                    <Button
                      onClick={() => {
                        const currentReg = selectedVehicle?.registrationNumber || customVehicle?.registrationNumber || '';
                        navigate(`/login?redirect=${encodeURIComponent(`/car-health-score?reg=${currentReg}`)}`);
                      }}
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-all"
                    >
                      🔑 Log In / Register to Unlock
                    </Button>
                    <span className="text-[9px] font-black text-slate-500 block uppercase tracking-wide">— OR —</span>
                    <Button
                      type="button"
                      onClick={() => setSandboxEnabled(true)}
                      variant="outline"
                      className="w-full h-11 rounded-xl border-dashed border border-blue-500/30 text-blue-405 text-blue-450 hover:bg-blue-500/10 text-[10px] font-extrabold uppercase tracking-widest bg-transparent hover:text-blue-300"
                    >
                      🛠️ Bypass with Guest Sandbox Mode
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Diagnostic Workbench Card */}
                  {/* Mechanic Diagnostics Core Form */}
                  <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl bg-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                    <CardHeader className="p-6 md:p-8 pb-4 border-b border-slate-50 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-inner">
                          <Wrench size={22} className="animate-pulse" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-wider mb-1">
                            🛠️ Official Workshop Certification
                          </div>
                          <CardTitle className="text-base font-black uppercase text-slate-900 leading-none">
                            Mechanic Diagnostic Desk
                          </CardTitle>
                          <CardDescription className="text-xs font-semibold text-slate-400 mt-1">
                            Log component diagnoses, rate engine health, append warning flags, and parse multi-source vehicle registries.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6 md:p-8 space-y-6">
                      {/* Diagnostic Inputs Fields */}
                      <div className="space-y-4">
                        {/* Engine Rating & Specific Issue */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="mach-engine-rating" className="text-xs font-black uppercase text-slate-500 tracking-wider">
                              Engine Condition Rating
                            </Label>
                            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <select
                                id="mach-engine-rating"
                                value={mechanicEngineRating}
                                onChange={(e) => setMechanicEngineRating(Number(e.target.value))}
                                className="bg-transparent h-9 px-2 text-sm font-black text-slate-850 focus:outline-none flex-1 text-slate-800"
                              >
                                <option value={5}>⭐⭐⭐⭐⭐ (5 / 5) - Excellent Stand</option>
                                <option value={4}>⭐⭐⭐⭐ (4 / 5) - Good Condition</option>
                                <option value={3}>⭐⭐⭐ (3 / 5) - Moderate wear (Old/Sluggish)</option>
                                <option value={2}>⭐⭐ (2 / 5) - Weak Performance</option>
                                <option value={1}>⭐ (1 / 5) - Critical Engine Issue</option>
                              </select>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold block leading-normal">
                              Sets dynamic capping on overall Engine performance curves.
                            </span>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mach-dropdown-prob" className="text-xs font-black uppercase text-slate-500 tracking-wider">
                              Select Primary Dropdown Problem
                            </Label>
                            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <select
                                id="mach-dropdown-prob"
                                value={mechanicDropdownProblem}
                                onChange={(e) => setMechanicDropdownProblem(e.target.value)}
                                className="bg-transparent h-9 px-2 text-xs font-black text-slate-850 focus:outline-none flex-1 text-slate-800"
                              >
                                <option value="none">✓ No Primary Component Warnings</option>
                                <option value="engine_old">⚠️ Engine Old & Excess Vibrations</option>
                                <option value="oil_change">💧 Oil Change & Fluid Flush Overdue</option>
                                <option value="tire_damage">🚗 Tire Damage after 5 months road usage</option>
                                <option value="brake_damage">🛑 Brake Damage - not changed from couple of months</option>
                                <option value="steering_fault">⚙️ Steering Column rack leakage diagnosed</option>
                              </select>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold block leading-normal">
                              Direct simulated deduction triggered dynamically on the core ledger.
                            </span>
                          </div>
                        </div>

                        {/* Engine Issue Text Details Box */}
                        <div className="space-y-2">
                          <Label htmlFor="mach-engine-issue" className="text-xs font-black uppercase text-slate-500 tracking-wider">
                            Detail Engine Issue / Diag Findings
                          </Label>
                          <textarea
                            id="mach-engine-issue"
                            placeholder="Write diagnostics checklist reports, engine noises, fluid limits..."
                            rows={3}
                            value={mechanicEngineIssue}
                            onChange={(e) => {
                              setMechanicEngineIssue(e.target.value);
                              if (analysisError) setAnalysisError('');
                            }}
                            className="w-full text-xs font-semibold p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-105 focus:border-blue shadow-inner text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Run Diagnostic compile command segment */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        {analysisError && (
                          <p className="text-xs text-red-500 font-bold flex items-center gap-1.5 bg-red-50 p-3 rounded-xl border border-red-105">
                            <AlertTriangle size={14} className="shrink-0 text-red-500" /> {analysisError}
                          </p>
                        )}

                        <Button
                          onClick={analyzeCarDetailsAndDiagnostics}
                          disabled={isAnalyzingCarDetails || !mechanicEngineIssue}
                          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          {isAnalyzingCarDetails ? (
                            <>
                              <RefreshCw className="animate-spin text-blue-400" size={16} />
                              <span>Contacting National APIs & evaluating score...</span>
                            </>
                          ) : (
                            <>
                              <Database size={16} className="text-blue-400" />
                              <span>Fetch Registry APIs & Compile Car Health Score</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Simulated API & Score Outputs Desk once triggered successfully */}
                  {customAnalysisReport && (
                    <div className="space-y-6">
                      {/* Live connected APIs JSON visualization tabs */}
                      <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl bg-slate-950 text-white overflow-hidden relative font-sans">
                        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                        <CardHeader className="p-6 md:p-8 pb-3 border-b border-white/5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-wider leading-none">
                                🔌 live API JSON payload explorer
                              </span>
                              <CardTitle className="text-base font-black uppercase tracking-wide flex items-center gap-2">
                                Data fetched from Vehicle APIs
                              </CardTitle>
                              <CardDescription className="text-slate-400 text-xs font-semibold">
                                Inspect real-time structured telemetry returned from National Registries and Workshop Databases.
                              </CardDescription>
                            </div>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] tracking-wide py-1 px-2.5 font-bold rounded-lg leading-none">
                              ✓ SECURE RESPONSE
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="p-6 md:p-8 space-y-4">
                          <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5 bg-white/5 p-3.5 rounded-xl border border-white/5 leading-snug">
                            <Info size={14} className="shrink-0 text-blue-300" />
                            <span>This section displays the structured payloads returned from the API routes. Mechanics or inspectors can audit compliance directly.</span>
                          </div>

                          {/* Interactive JSON viewer */}
                          <Tabs defaultValue="rc" className="w-full">
                            <TabsList className="grid grid-cols-3 bg-white/5 p-1 rounded-xl h-11">
                              <TabsTrigger value="rc" className="rounded-lg text-[9px] font-extrabold uppercase data-[state=active]:bg-white/10">
                                📇 RC DETAILS API
                              </TabsTrigger>
                              <TabsTrigger value="owner" className="rounded-lg text-[9px] font-extrabold uppercase data-[state=active]:bg-white/10">
                                👥 OWNER REGISTRY
                              </TabsTrigger>
                              <TabsTrigger value="service" className="rounded-lg text-[9px] font-extrabold uppercase data-[state=active]:bg-white/10">
                                ⚙️ SERVICE ARCHIVES
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="rc" className="mt-3 bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-slate-300 overflow-x-auto space-y-2">
                              <p className="text-blue-400 font-bold">// GET {customAnalysisReport.rc_data.api_endpoint}</p>
                              <pre className="text-emerald-400 max-h-[250px] overflow-y-auto">{JSON.stringify(customAnalysisReport.rc_data, null, 2)}</pre>
                            </TabsContent>

                            <TabsContent value="owner" className="mt-3 bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-slate-300 overflow-x-auto space-y-2">
                              <p className="text-blue-400 font-bold">// GET {customAnalysisReport.owner_data.api_endpoint}</p>
                              <pre className="text-emerald-400 max-h-[250px] overflow-y-auto">{JSON.stringify(customAnalysisReport.owner_data, null, 2)}</pre>
                            </TabsContent>

                            <TabsContent value="service" className="mt-3 bg-black/40 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-slate-300 overflow-x-auto space-y-2">
                              <p className="text-blue-400 font-bold">// GET {customAnalysisReport.service_data.api_endpoint}</p>
                              <pre className="text-emerald-400 max-h-[250px] overflow-y-auto">{JSON.stringify(customAnalysisReport.service_data, null, 2)}</pre>
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>

                      {/* Dynamic Health Analysis feedback card */}
                      <Card className="rounded-[2.5rem] border border-emerald-100 shadow-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 overflow-hidden font-sans">
                        <CardHeader className="p-6 md:p-8 pb-2 border-b border-emerald-500/10">
                          <div className="flex items-center gap-2">
                            <Sparkles className="text-emerald-500 animate-spin" size={18} />
                            <CardTitle className="text-sm font-black text-emerald-950 uppercase tracking-widest leading-none">
                              AI Inspection Calculus Report
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-4 text-emerald-950">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 p-5 rounded-2xl border border-emerald-100/50">
                            <div>
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Compiled Integrity Score</span>
                              <div className="flex items-baseline gap-1.5 mt-1">
                                <span className="text-3xl font-black text-emerald-600 font-mono">
                                  {customAnalysisReport.calculated_results.final_integrity_score}
                                </span>
                                <span className="text-xs font-extrabold text-slate-400 font-mono">/ 100 max</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Status standing</span>
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 uppercase border-none text-[9px] font-black mt-1 py-1 px-3 rounded-lg leading-none">
                                HIGH REGISTRY COMPLIANCE
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-wide text-emerald-900">Calculus Deductions Applied:</h4>
                            <ul className="text-xs space-y-1.5 font-semibold">
                              <li className="flex items-start gap-1.5 leading-relaxed text-slate-700">
                                <span className="text-emerald-500">✓</span>
                                <div>Engine physical integrity capped according to rating <span className="font-extrabold text-slate-900">**{customAnalysisReport.mechanic_findings.engine_rating}**</span> (-{customAnalysisReport.calculated_results.engine_deduction_applied}%).</div>
                              </li>
                              {customAnalysisReport.mechanic_findings.anomalies_applied.map((anomaly: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 leading-relaxed text-slate-700">
                                  <span className="text-amber-500">⚠️</span>
                                  <span>{anomaly}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 bg-white/50 border border-emerald-150 rounded-2xl">
                            <p className="text-[10px] font-bold text-slate-600 leading-normal">
                              💼 **Registration details synchronized successfully.** The diagnostics parameters have been written permanently as a **Certified Assessment Chronicle** inside the vehicle details database ledger, which has repaired/capped component wear states accordingly.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* WORKSHOP LOG TIMELINE COMPONENT */}
                  <Card className="rounded-[2.5rem] border border-slate-100 shadow-xl bg-white overflow-hidden">
                    <CardHeader className="bg-slate-950 text-white p-6 relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                          <History size={20} />
                        </div>
                        <div>
                          <CardTitle className="text-base font-black uppercase text-white tracking-wide">
                            Workshop Log Timeline
                          </CardTitle>
                          <CardDescription className="text-slate-400 text-xs font-semibold leading-none mt-1">
                            Live chronological chain of verified partner service records and mechanic diagnostic certificates
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {customLogs.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2">
                          <Activity className="mx-auto text-slate-300 animate-pulse" size={32} />
                          <p>No workshop logs recorded for this vehicle registration yet.</p>
                          <p className="text-[10px] font-normal text-slate-400">Use the Mechanics Portal above to log a brand new service intervention.</p>
                        </div>
                      ) : (
                        <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                          {customLogs.map((log) => {
                            const isCustomSubmission = log.id.startsWith('ser-user-');
                            return (
                              <div key={log.id} className="relative pl-10 space-y-2 group">
                                {/* Timeline Dot indicator with pulsing sparkle effect if custom */}
                                <div className={`absolute left-1.5 top-1.5 w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all ${
                                  isCustomSubmission ? 'bg-emerald-500 ring-4 ring-emerald-500/15' : 'bg-blue-600 ring-4 ring-blue-600/10'
                                }`} />

                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-slate-900 uppercase">
                                      {log.type} Service Inspection
                                    </span>
                                    <Badge className="bg-slate-100 text-slate-700 text-[9px] uppercase border border-slate-200 font-black px-2 py-0.5 rounded-lg">
                                      {log.mileage.toLocaleString()} kms
                                    </Badge>
                                    {isCustomSubmission && (
                                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg animate-pulse">
                                        ✨ Self-Healed Component
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 font-mono">
                                    <Calendar size={10} /> {log.date}
                                  </span>
                                </div>

                                <div className="bg-slate-50 group-hover:bg-slate-100/50 p-4 rounded-3xl border border-slate-150/40 transition-colors space-y-3">
                                  <p className="text-slate-700 text-xs font-bold leading-relaxed">
                                    {log.notes}
                                  </p>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 border-t border-slate-200/50 text-[11px]">
                                    <div className="space-y-0.5">
                                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Mechanic Signature</span>
                                      <span className="font-extrabold text-slate-800 flex items-center gap-1 text-xs">
                                        <Wrench size={10} className="text-blue-500 shrink-0" /> {log.mechanic}
                                      </span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Logged Invoice Amount</span>
                                      <span className="font-extrabold text-slate-900 text-xs font-mono">
                                        ₹{log.cost.toLocaleString()} <span className="font-sans font-medium text-[10px] text-slate-450 text-slate-400">INR</span>
                                      </span>
                                    </div>
                                  </div>

                                  <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mr-1">Wear Repaired / Replaced:</span>
                                    {log.components.map((comp, idx) => (
                                      <Badge key={idx} variant="outline" className="text-[9px] font-bold text-emerald-700 border-emerald-100 bg-emerald-50/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                        <Sparkles size={8} className="text-emerald-500 animate-pulse" />
                                        {comp}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

          </Tabs>

        </div>

      </div>
      )}

      {/* Trust benefits & value anchors showcase */}
      <section className="bg-slate-950 p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden text-center text-white space-y-6">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} 
        />
        <div className="space-y-4 max-w-3xl mx-auto">
          <Badge className="bg-blue-500/15 text-blue-400 border-none font-black text-[9px] uppercase px-3 py-1 tracking-widest">
            THE VALUE PARADIGM
          </Badge>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight italic uppercase">
            WHY CERTIFIED <span className="text-blue-500">HEALTH SCORES MATCH CIBIL</span> FOR INDIA
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            Just as banking entities query scores before authorizing cash loans, smart Indian buyers now verify the certified Grade parameters of listed used vehicles to prevent odometer fraud, flood damage coverups, and catastrophic engine failures.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            {[
              { title: "Complete Transparency", desc: "No second guessing. Get fully transparent sensor-driven diagnostics mapped with verified blockchain audit traces." },
              { title: "Rupee Resale Premium", desc: "Documented history with Grade A checks earns up to 15% pricing leverage above generic uncertified standard vehicles." },
              { title: "Worry-Free Warranty", desc: "Every car verifying above Grade B carries immediate 5-Year Free Doorstep Mechanic coverage. Secure peace of mind." }
            ].map((box, i) => (
              <div key={i} className="bg-white/5 p-5 border border-white/10 rounded-3xl text-left space-y-2">
                <CheckCircle className="text-blue-500" size={18} />
                <h4 className="font-extrabold text-sm tracking-tight text-white">{box.title}</h4>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">{box.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
