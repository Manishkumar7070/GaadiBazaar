import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  FileText,
  Search,
  Users,
  Star,
  MapPin
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';

const SmartBuyerHub = () => {
  const categories = [
    {
      title: "Dealer Verification",
      icon: <Users className="text-blue-500" />,
      items: [
        "How to verify a dealer's physical presence",
        "Understanding AsOneDealer Trust Scores",
        "Red flags when talking to local sellers",
        "Why 'Reputation' matters more than 'Price'"
      ]
    },
    {
      title: "Vehicle Inspection",
      icon: <Search className="text-green-500" />,
      items: [
        "The 15-minute DIY engine check",
        "Spotting flood-damaged or accidental cars",
        "Interpreting service history records",
        "What to look for in tires and suspension"
      ]
    },
    {
      title: "Scam Alerts",
      icon: <AlertTriangle className="text-red-500" />,
      items: [
        "Escrow payment scams in Tier-2 cities",
        "Fake RC transfer documentation",
        "Odometer tampering: How to detect it",
        "Typical 'Urgent Sale' trap stories"
      ]
    },
    {
      title: "Fair Pricing",
      icon: <Star className="text-amber-500" />,
      items: [
        "Market value vs. Asking price",
        "How much to negotiate with local dealers",
        "Hidden costs: Registration & Insurance",
        "Valuation tools for Indian market"
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-12 pb-32">
      <Helmet>
        <title>Smart Buyer Hub - Master the Used Car Market | AsOneDealer</title>
        <meta name="description" content="Learn how to buy used cars like a pro. Checklists, scam alerts, dealer verification tips, and fair pricing guides for the Indian market." />
      </Helmet>

      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-full uppercase text-[10px] tracking-widest font-black">
            Academic Center
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Stop Guessing. <span className="text-blue-600 italic">Start Verifying.</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium">
            The Indian used-car market is complex. We've built this hub to give you the checklists, alerts, and wisdom needed to buy with zero regrets.
          </p>
        </motion.div>
      </section>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white hover:translate-y-[-4px] transition-all duration-300">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                    {cat.icon}
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">{cat.title}</h2>
                </div>
                <div className="space-y-3">
                  {cat.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 group cursor-pointer hover:bg-slate-50 p-3 rounded-xl transition-colors">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mt-0.5 group-hover:bg-primary/10">
                        <ChevronRight size={12} className="text-slate-400 group-hover:text-primary" />
                      </div>
                      <span className="text-slate-600 font-bold text-sm tracking-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Inspection Checklist CTA */}
      <section>
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden text-center space-y-8">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} 
          />
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
              The Ultimate 100-Point <span className="text-blue-500">Inspection Checklist</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
              Download our physical inspection guide. Take it with you when visiting any dealer. Don't miss a single detail.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-900/20">
                <FileText className="mr-2" /> Download PDF Guide
              </Button>
              <Button variant="outline" className="h-14 px-10 rounded-2xl border-white/10 text-white hover:bg-white/5 font-black text-lg">
                View Mobile Checklist
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Invariants */}
      <section className="space-y-8">
        <h3 className="text-xl font-bold uppercase tracking-widest text-slate-400 text-center">AsOneDealer Trust Invariants</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { 
              title: "No Ghost Listings", 
              desc: "Every car you see is physically active in the showroom as of the last 48 hours." 
            },
            { 
              title: "Verified Identity", 
              desc: "We visit the dealer, check their GST/Identity, and confirm their business history." 
            },
            { 
              title: "Zero Odometer Tampering", 
              desc: "We maintain history-first records and penalize any dealer attempting milage scams." 
            }
          ].map((fact, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
              <CheckCircle2 className="text-primary" size={24} />
              <h4 className="font-black text-slate-900 tracking-tight">{fact.title}</h4>
              <p className="text-slate-500 text-xs font-bold leading-relaxed">{fact.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Local Community Experience */}
      <section className="bg-blue-50/50 rounded-[3rem] p-8 md:p-12 border border-blue-100">
         <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Need a local expert opnion?</h2>
              <p className="text-slate-600 text-lg font-medium">Join our localized Bihar & UP buyer communities. Real people sharing real dealer experiences.</p>
              <div className="flex -space-x-4 mb-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="" />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-white bg-primary flex items-center justify-center text-white text-xs font-black">+400</div>
              </div>
              <a 
                href="https://chat.whatsapp.com/Bxko0Ug1mBg3Snhiuv57Pn" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="rounded-2xl h-14 px-8 bg-slate-900 font-black hover:bg-slate-800 transition-all flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Users size={12} className="text-white" />
                  </span>
                  Join Community Discussion
                </Button>
              </a>
            </div>
            <div className="flex-1">
              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-6 rotate-2 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div>
                    <p className="font-black text-sm">Rahul S. <span className="text-slate-400 font-normal">from Patna</span></p>
                    <div className="flex text-yellow-500"><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /><Star size={10} fill="currentColor" /></div>
                  </div>
                </div>
                <p className="text-slate-600 font-bold italic">"I was confused between two dealers in Boring Road. The Smart Buyer checklist helped me spot a repaint job on the front bumper that the dealer didn't mention. Saved me ₹50,000!"</p>
              </Card>
            </div>
         </div>
      </section>
    </div>
  );
};

export default SmartBuyerHub;
