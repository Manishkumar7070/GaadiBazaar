import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Percent, Calendar, IndianRupee, HelpCircle, Shield, Info, ArrowUpRight, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/hooks/useAuth';
import { Vehicle } from '@/types';

interface EMICalculatorProps {
  vehiclePrice: number;
  vehicle?: Vehicle;
}

export const EMICalculator: React.FC<EMICalculatorProps> = ({ vehiclePrice, vehicle }) => {
  const { user } = useAuth();

  // Default values setting up Down Payment at 20% of Vehicle Price
  const defaultDownPayment = Math.round(vehiclePrice * 0.20);
  const [downPayment, setDownPayment] = useState<number>(defaultDownPayment);
  const [interestRate, setInterestRate] = useState<number>(9.5); // Standard used-car interest rate in India
  const [tenureYears, setTenureYears] = useState<number>(5); // 5 years is the typical loan tenure

  const [loanAmount, setLoanAmount] = useState<number>(vehiclePrice - defaultDownPayment);
  const [monthlyEMI, setMonthlyEMI] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const handleDownloadKit = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Total pages = 2
      const totalPages = 2;

      // Formatting helper for currency
      const formatCurrency = (val: number) => `INR ${val.toLocaleString('en-IN')}`;

      // Date helper
      const currentDateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Page base layout helper
      const drawPageBase = (pageIndex: number) => {
        // Colored Header Banner
        doc.setFillColor(15, 23, 42); // slate-900 (slate deep navy)
        doc.rect(15, 15, 180, 22, 'F');
        
        // Brand logo/text
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('ASONEDEALER FINANCE', 22, 28);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(241, 245, 249); // slate-100
        doc.text('Automated Multi-Bank Financing and Premium Valuations Portal', 22, 32);
        
        // Eligibility Tag Badge
        doc.setFillColor(255, 90, 60); // Orange / Coral
        doc.rect(142, 22.5, 45, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('LOAN ELIGIBILITY KIT', 145, 27);

        // Footer block
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(15, 280, 195, 280);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('Disclaimer: This documents a pre-approved eligibility profile based on standard banking rates. Final funding approval subject to KYC validation.', 15, 284);
        doc.text(`Page ${pageIndex} of ${totalPages}`, 180, 284);
      };

      // PAGE 1 Content
      drawPageBase(1);

      // Section 1: Financial Information Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('1. LOAN STRUCTURE & FINANCIAL ESTIMATE', 15, 46);

      // Financial grid card box background
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(15, 50, 180, 62, 'FD');

      // Financial Details Labels and Values
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500

      const leftLabels = [
        'Vehicle Declared Price',
        'Customer Down Payment',
        'Financing Borrowed Principal',
        'Applicable Annual Rate (IRR)',
        'Selected Tenure Period'
      ];

      const leftValues = [
        formatCurrency(vehiclePrice),
        `${formatCurrency(downPayment)} (${Math.round((downPayment / vehiclePrice) * 100)}%)`,
        formatCurrency(loanAmount),
        `${interestRate}% p.a. (Fixed)`,
        `${tenureYears} Years (${tenureYears * 12} Months)`
      ];

      let currentY = 58;
      for (let i = 0; i < leftLabels.length; i++) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(leftLabels[i], 22, currentY);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(leftValues[i], 75, currentY);
        
        currentY += 9;
      }

      // Vertical line to separate blocks
      doc.setDrawColor(226, 232, 240);
      doc.line(125, 54, 125, 108);

      // Estimated Monthly EMI Box on the right side
      doc.setFillColor(255, 245, 243); // brand soft tint
      doc.rect(130, 54, 60, 52, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 90, 60); // brand color orange
      doc.text('ESTIMATED MONTHLY INSTALLMENT', 133, 61);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 90, 60);
      doc.text(formatCurrency(monthlyEMI), 133, 71);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('(Equal Monthly Installments)', 133, 76);

      // Total Interest details inside box
      doc.setDrawColor(254, 226, 226);
      doc.line(133, 81, 187, 81);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Total Interest Payable:', 133, 87);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(totalInterest), 133, 92);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Comprehensive Cost:', 133, 98);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatCurrency(totalAmount), 133, 103);

      // Section 2: Vehicle details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('2. VEHICLE SPECIFICATIONS', 15, 122);

      // Box wrapper
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 126, 180, 48, 'D');

      const makeModel = vehicle ? `${vehicle.brand} ${vehicle.model}`.toUpperCase() : "SUZUKI SWIFT ZXI (REPRESENTATIVE)";
      const vYear = vehicle ? vehicle.year : 2021;
      const vType = vehicle ? vehicle.vehicleType.toUpperCase() : "CAR";
      const vFuel = vehicle ? vehicle.fuelType.toUpperCase() : "PETROL / CNG";
      const vTrans = vehicle ? vehicle.transmission.toUpperCase() : "MANUAL";
      const vKm = vehicle ? `${vehicle.kilometersDriven.toLocaleString('en-IN')} KM` : "32,450 KM";
      const vState = vehicle ? `${vehicle.city}, ${vehicle.state}` : "Mumbai, Maharashtra";
      const vRegNo = vehicle?.registrationNumber || "MH-02-FE-4310";
      const vVin = vehicle?.vin || "1FTFW1EF5CFC98210";

      // SPEC Grid Layout
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(makeModel, 22, 134);

      // Line separating title
      doc.setDrawColor(241, 245, 249);
      doc.line(22, 138, 188, 138);

      const specsLeftLabels = ['Year of Manufacture', 'Body Category type', 'Fuel Subsystem', 'Transmission Mode'];
      const specsLeftVals = [vYear.toString(), vType, vFuel, vTrans];
      
      const specsRightLabels = ['Odometer Metric', 'Registration State', 'Registration Board No', 'Vehicle Ident (VIN)'];
      const specsRightVals = [vKm, vState, vRegNo, vVin];

      currentY = 145;
      for (let i = 0; i < specsLeftLabels.length; i++) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(specsLeftLabels[i], 22, currentY);
        doc.text(specsRightLabels[i], 110, currentY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(specsLeftVals[i], 65, currentY);
        doc.text(specsRightVals[i], 150, currentY);

        currentY += 6.5;
      }

      // Section 3: Applicant Profile (Pre-filled what we have)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('3. PRIMARY APPLICANT PROFILE SUMMARY', 15, 184);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 188, 180, 40, 'FD');

      const appNameStr = user ? user.fullName.toUpperCase() : "NOT LOGGED IN (HANDWRITTEN FIELD)";
      const appEmailStr = user ? user.email : "__________________________________________";
      const appPhoneStr = user ? (user.phone || "_________________") : "_________________";
      const appAddressStr = user?.address || "____________________________________________________________________";

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);

      const applicantLabels = ['Primary Applicant Name', 'Linked Email Address', 'Linked Mobile Number', 'Primary Residential Residence'];
      const applicantVals = [appNameStr, appEmailStr, appPhoneStr, appAddressStr];

      currentY = 196;
      for (let i = 0; i < applicantLabels.length; i++) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(applicantLabels[i], 22, currentY);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(applicantVals[i], 70, currentY);

        currentY += 8;
      }

      // Section 4: Speed Banking Pre-Approval Partner Network Block
      doc.setFillColor(240, 253, 244); // emerald-50 soft success block
      doc.setDrawColor(187, 247, 208); // emerald-200
      doc.rect(15, 236, 180, 28, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(21, 128, 61); // emerald-700
      doc.text('PRE-QUALIFIED LENDING FACILITATION STATUS: ACTIVE', 22, 242);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52); // emerald-800
      doc.text('Asonedealer integrates directly with 15+ premier banking associates (HDFC, SBI, ICICI, Kotak, Axis, IDFC, etc.).', 22, 247);
      doc.text('This document verifies that based on the selected vehicle and pricing metric, you pre-qualify for direct processing.', 22, 251);
      doc.text(`Pre-Qualification ID: ASD-ELIG-${vehicle?.id?.substring(0,6).toUpperCase() || 'FIN101'}-${Math.floor(1000 + Math.random() * 9000)} | Generated on: ${currentDateStr}`, 22, 255);

      // PAGE 2 Content
      doc.addPage();
      drawPageBase(2);

      // Section 5: Required Document Checklist
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('4. REQUIRED KYC & COLLATERAL DOCUMENTS CHECKLIST', 15, 46);

      // Render 2 parallel column boxes for docs
      // Left box: Salaried
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, 50, 87, 65, 'D');

      doc.setFillColor(241, 245, 249);
      doc.rect(15, 50, 87, 7.5, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('FOR SALARY EMPLOYEES / WORKERS', 20, 55);

      const salariedDocs = [
        '[  ] Latest 3 Months Paid Salary Slips',
        '[  ] Recent 6 Months Bank Salary Account Statement',
        '[  ] Latest Copy of Income Tax Form 16 / ITR',
        '[  ] Standard Identity Proof (Aadhaar / Passport / PAN)',
        '[  ] Standard Address Proof (Utility Bill / Aadhaar)',
        '[  ] Present Active Employer ID Badge Copy'
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      currentY = 64;
      salariedDocs.forEach(docText => {
        doc.text(docText, 19, currentY);
        currentY += 8;
      });

      // Right box: Self Employed
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.rect(108, 50, 87, 65, 'D');

      doc.setFillColor(241, 245, 249);
      doc.rect(108, 50, 87, 7.5, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('FOR SELF-EMPLOYED / PROPRIETORS', 113, 55);

      const selfDocs = [
        '[  ] Latest 2 Years Certified Audited IT Returns filed',
        '[  ] Corporate Bank Statement (Recent 12 Months)',
        '[  ] Certified Trade Balance Sheet & P&L Statement',
        '[  ] Company/Business PAN Card & Establishment Proof',
        '[  ] Principal Identity & Address KYC Proofs',
        '[  ] Valid GST Certificate Copy (where applicable)'
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      currentY = 64;
      selfDocs.forEach(docText => {
        doc.text(docText, 112, currentY);
        currentY += 8;
      });

      // Section 6: Official Application Template Block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('5. MULTI-BANK DIRECT FINANCIAL SUBMISSION TEMPLATE', 15, 125);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(15, 23, 42);
      doc.rect(15, 129, 180, 110, 'D');

      // Header of submission template
      doc.setFillColor(15, 23, 42);
      doc.rect(15, 129, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('LOAN DEMAND AND CO-APPLICANT SUBMISSION DETAILS FORM', 20, 134.5);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8.5);
      
      doc.text(`REQUEST DATE:  ${currentDateStr}`, 20, 144);
      doc.text(`REFERENCE SECURE ID:  ASD-FIN-${Math.floor(100000 + Math.random() * 900000)}`, 110, 144);

      doc.setDrawColor(241, 245, 249);
      doc.line(18, 148, 192, 148);

      // Vehicle & Loan Specs
      doc.setFont('helvetica', 'bold');
      doc.text('PROPOSED ACTION PROPERTY:', 20, 154);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Car/Bike: ${makeModel}`, 20, 160);
      doc.text(`Proposed Loan: ${formatCurrency(loanAmount)}`, 20, 165);
      doc.text(`Fixed Interest: ${interestRate}% p.a.`, 20, 170);

      doc.text(`Registered ID No: ${vRegNo}`, 110, 160);
      doc.text(`Assumed Period: ${tenureYears} Years (${tenureYears * 12} Mos)`, 110, 165);
      doc.text(`Computed EMI: ${formatCurrency(monthlyEMI)} / Month`, 110, 170);

      doc.line(18, 174, 192, 174);

      // Manual fill area fields (Underlines)
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL CO-APPLICANT & HOUSEHOLD STATEMENTS (TO BE COMPLETED BY HAND):', 20, 180.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Household Net Monthly Remuneration (INR): ____________________________________________________', 20, 187);
      doc.text('Preferred Partner Banking Option Selected: HDFC [  ]  ICICI [  ]  SBI [  ]  AXIS [  ]  KOTAK [  ]  IDFC [  ]', 20, 194);
      doc.text('Existing Outstanding Credit Installments (INR/Month): ___________________________________________', 20, 201);
      doc.text('Primary Profession Description / Job Title: ______________________________________________________', 20, 208);
      doc.text('Co-Applicant Full Name (If applicant is married/supported): ________________________________________', 20, 215);
      doc.text('Co-Applicant Linked Monthly Income (INR): ____________________________________________________', 20, 222);
      doc.text('Declaration Statement: I hereby declare that the specs and info detailed in this form are accurate and complete.', 20, 229);

      // Section 7: Signature Area
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 245, 195, 245);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      
      doc.text('PRE-FILLED FOR SYSTEM:', 20, 252);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Asonedealer Automated Assessment engine', 20, 257);
      doc.text('Status: PRE-QUALIFIED PROFILE READY', 20, 261);

      // Signature line right
      doc.line(130, 263, 185, 263);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('APPLICANT ASSIGNED SIGNATURE', 133, 267);

      // Save PDF output
      const vehicleSlug = vehicle ? `${vehicle.brand}_${vehicle.model}`.toLowerCase() : 'vehicle';
      doc.save(`Asonedealer_Loan_Eligibility_Kit_${vehicleSlug}.pdf`);

    } catch (err: any) {
      console.error('[PDF] Generation error', err);
    }
  };

  // Synchronize loan amount when price or down payment changes
  useEffect(() => {
    const loan = Math.max(0, vehiclePrice - downPayment);
    setLoanAmount(loan);
  }, [vehiclePrice, downPayment]);

  // Handle calculation whenever inputs shift
  useEffect(() => {
    const P = loanAmount;
    const annualRate = interestRate;
    const n = tenureYears * 12; // months

    if (P <= 0) {
      setMonthlyEMI(0);
      setTotalInterest(0);
      setTotalAmount(0);
      return;
    }

    if (annualRate === 0) {
      const emi = P / n;
      setMonthlyEMI(emi);
      setTotalInterest(0);
      setTotalAmount(P);
      return;
    }

    // Monthly interest rate
    const r = annualRate / 12 / 100;
    
    // EMI formula: [P x r x (1+r)^n]/[((1+r)^n)-1]
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayable = emi * n;
    const interestPayable = totalPayable - P;

    setMonthlyEMI(Math.round(emi));
    setTotalInterest(Math.round(interestPayable));
    setTotalAmount(Math.round(totalPayable));
  }, [loanAmount, interestRate, tenureYears]);

  // Handler for direct input validation
  const handleDownPaymentChange = (valStr: string) => {
    const val = parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
    if (val > vehiclePrice) {
      setDownPayment(vehiclePrice);
    } else {
      setDownPayment(val);
    }
  };

  const handleInterestChange = (valStr: string) => {
    let val = parseFloat(valStr) || 0;
    if (val > 30) val = 30; // Caps interest rate at 30% max
    if (val < 1) val = 1;   // Floor at 1% min
    setInterestRate(val);
  };

  const principalPercentage = totalAmount > 0 ? Math.round((loanAmount / totalAmount) * 100) : 100;
  const interestPercentage = totalAmount > 0 ? 100 - principalPercentage : 0;

  return (
    <Card id="emi-calculator" className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
      <CardContent className="p-8 md:p-10 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                Interactive Tool
              </span>
              <span className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-1">
                <Shield size={12} className="text-emerald-500" /> Safe Finance Estimate
              </span>
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tight text-slate-900">
              EMI Calculator
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Car Valuation Price</p>
            <p className="text-2xl font-black text-slate-950">₹{vehiclePrice.toLocaleString()}</p>
          </div>
        </div>

        {/* Content Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls section (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Down Payment Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Down Payment (₹)
                  </Label>
                  <p className="text-[10px] font-bold text-slate-400">
                    {Math.round((downPayment / vehiclePrice) * 100)}% of car value
                  </p>
                </div>
                <div className="relative w-44">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">₹</span>
                  <Input
                    type="text"
                    value={downPayment.toLocaleString()}
                    onChange={(e) => handleDownPaymentChange(e.target.value)}
                    className="h-10 pl-8 pr-3 font-black text-slate-900 rounded-xl text-right text-xs bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <input
                  type="range"
                  min={0}
                  max={vehiclePrice}
                  step={Math.round(vehiclePrice / 100)}
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full h-2 rounded-full accent-primary bg-slate-100 cursor-pointer appearance-none"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider pt-2">
                  <span>Minimum (₹0)</span>
                  <span>Maximum (₹{vehiclePrice.toLocaleString()})</span>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Interest Rate Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Annual Interest Rate (%)
                  </Label>
                  <p className="text-[10px] font-bold text-slate-400">
                    Typically ranges from 8% to 15% for pre-owned engines
                  </p>
                </div>
                <div className="relative w-28">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    step={0.1}
                    value={interestRate}
                    onChange={(e) => handleInterestChange(e.target.value)}
                    className="h-10 px-3 font-black text-slate-900 rounded-xl text-center text-xs bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">%</span>
                </div>
              </div>

              <div className="pt-2">
                <input
                  type="range"
                  min={6}
                  max={24}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-2 rounded-full accent-primary bg-slate-100 cursor-pointer appearance-none"
                />
                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider pt-2">
                  <span>Starter (6%)</span>
                  <span>Standard (12%)</span>
                  <span>High (24%)</span>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-100" />

            {/* Loan Tenure Interactive Selector */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Loan Tenure (Years / Months)
                  </Label>
                  <p className="text-[10px] font-bold text-slate-400">
                    Shorter tenure saves interest; longer reduces EMI
                  </p>
                </div>
                <span className="text-xs font-black bg-slate-100 text-slate-800 py-1.5 px-3 rounded-full">
                  {tenureYears} Years ({tenureYears * 12} Mos)
                </span>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 5, 7].map((year) => (
                  <Button
                    key={year}
                    type="button"
                    variant={tenureYears === year ? 'default' : 'outline'}
                    onClick={() => setTenureYears(year)}
                    className={`h-11 rounded-xl text-xs font-black uppercase transition-all ${
                      tenureYears === year
                        ? 'bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {year} Yr
                  </Button>
                ))}
                
                {/* Visual custom entry marker or range select */}
                <div className="flex items-center justify-center p-1 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all border border-dashed border-slate-200">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={tenureYears}
                    onChange={(e) => {
                      const v = Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 5));
                      setTenureYears(v);
                    }}
                    className="w-full bg-transparent border-none text-center font-black text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-0"
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Results Summary panel (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between border border-slate-200/55 gap-6">
            
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Estimated Monthly EMI
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-primary italic uppercase">
                    ₹{monthlyEMI.toLocaleString()}
                  </span>
                  <span className="text-slate-400 font-bold uppercase text-xs">/month</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 pt-1">
                  <Info size={12} className="text-primary/70" /> Estimate is based on representative rates.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-tight">Loan Amount (P)</span>
                  <span className="font-black text-slate-900">₹{loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-tight">Total Interest (I)</span>
                  <span className="font-black text-slate-900">₹{totalInterest.toLocaleString()}</span>
                </div>
                <Separator className="bg-slate-200" />
                <div className="flex justify-between items-center text-sm">
                  <span className="font-black text-slate-500 uppercase tracking-tight">Total Payable (P + I)</span>
                  <span className="font-black text-primary">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Dynamic Stacked Visual Bar Component */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <span>Principal ({principalPercentage}%)</span>
                  <span>Interest ({interestPercentage}%)</span>
                </div>
                <div className="h-6 rounded-full overflow-hidden bg-slate-200 flex border border-white">
                  <div 
                    className="bg-slate-900 transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white" 
                    style={{ width: `${principalPercentage}%` }}
                    title={`Principal: ${principalPercentage}%`}
                  >
                    {principalPercentage > 20 && `${principalPercentage}%`}
                  </div>
                  <div 
                    className="bg-primary/80 transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white" 
                    style={{ width: `${interestPercentage}%` }}
                    title={`Interest: ${interestPercentage}%`}
                  >
                    {interestPercentage > 20 && `${interestPercentage}%`}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-2">
              <h4 className="text-[10px] font-black text-emerald-950 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                <Shield size={14} className="text-emerald-600 shrink-0" /> Fast Pre-Approval
              </h4>
              <p className="text-[10px] font-medium text-emerald-800 leading-relaxed uppercase">
                Asonedealer collaborates directly with over 15+ premier banking associates to secure competitive financing solutions.
              </p>
              <div className="pt-2 space-y-2">
                <Button className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md flex gap-1.5 items-center justify-center">
                  Get Approved Now <ArrowUpRight size={14} />
                </Button>
                <Button
                  type="button"
                  onClick={handleDownloadKit}
                  className="w-full h-10 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-widest flex gap-1.5 items-center justify-center transition-all cursor-pointer"
                >
                  <FileText size={14} className="text-primary" /> Download Loan Eligibility Kit
                </Button>
              </div>
            </div>

          </div>

        </div>

      </CardContent>
    </Card>
  );
};
