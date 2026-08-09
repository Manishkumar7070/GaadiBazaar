import React from 'react';
import { motion } from 'motion/react';
import { Check, X, Shield, Clock, IndianRupee, HeartHandshake } from 'lucide-react';

const ComparisonGrid = () => {
  const features = [
    { name: 'Vehicle Inspection', asOne: '120-Point Mechanical Audit', others: 'Surface Level Check', icon: Shield },
    { name: 'Post-Purchase Support', asOne: '5 Years Free Maintenance', others: 'Transaction Only', icon: HeartHandshake },
    { name: 'Doorstep Service', asOne: 'Monthly Home Visits Included', others: 'Paid Workshop Visits', icon: Clock },
    { name: 'Value Proposition', asOne: '₹5 Lakhs Worth of Free Service', others: 'Standard Warranty Only', icon: IndianRupee },
  ];

  return (
    <div className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-16 my-24 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primaryShadow/20 blur-[120px] rounded-full -ml-48 -mb-48" />
      
      <div className="relative z-10 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
            Is AsOneDealer <span className="text-primary italic">Really Worth It?</span>
          </h2>
          <p className="text-slate-400 font-medium md:text-xl">See how we redefine the ownership experience compared to standard marketplaces.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <feature.icon size={28} />
                </div>
                <div className="space-y-4 flex-grow">
                  <h3 className="text-xl font-bold tracking-tight">{feature.name}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-primary">
                      <Check size={18} className="shrink-0" />
                      <span className="font-bold text-sm md:text-base">AsOne: {feature.asOne}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500">
                      <X size={18} className="shrink-0" />
                      <span className="font-medium text-sm md:text-base opacity-60">Others: {feature.others}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center pt-8">
          <div className="inline-block p-1 bg-white/5 border border-white/10 rounded-full pr-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-black italic">!</div>
              <p className="text-sm font-bold tracking-tight text-slate-300">
                Join 50,000+ happy owners who saved an average of ₹1.2 Lakhs in maintenance costs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonGrid;
