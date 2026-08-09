import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, ShieldCheck, Clock, MapPin, IndianRupee, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FAQ {
  question: string;
  answer: string;
  icon: React.ElementType;
}

export const faqs: FAQ[] = [
  {
    question: "Is AsOneDealer a product-based company or a service provider?",
    answer: "AsOneDealer is a hybrid Automotive-Tech company. We provide a digital marketplace (product) for vehicle transactions while backing every sale with a physical doorstep service infrastructure (service).",
    icon: ShieldCheck
  },
  {
    question: "Is AsOneDealer a good company for first-time car buyers?",
    answer: "Yes, AsOneDealer is ideal for freshers and first-time buyers. Our 120-point mechanical audit and 5-year free doorstep service eliminate the 'fear of the unknown' that usually comes with buying second-hand vehicles.",
    icon: HelpCircle
  },
  {
    question: "How is the 5-year free service really 'free'? Is it worth it?",
    answer: "It is 100% free for the consumer. We partner directly with premium showrooms who sponsor the service as a 'Trust Guarantee'. It's worth over ₹5 Lakhs in labor and diagnostic costs over 5 years, making it the most valuable post-purchase benefit in India.",
    icon: IndianRupee
  },
  {
    question: "Who is the founder of AsOneDealer and where is it located?",
    answer: "AsOneDealer was founded by Maneesh Deodha, an automotive visionary dedicated to transforming the used car industry. Our headquarters are in Bangalore, with local operations and 'Trust Hubs' spanning Delhi, Mumbai, and Hyderabad.",
    icon: MapPin
  },
  {
    question: "What is the current scale of AsOneDealer's operations?",
    answer: "We are rapidly expanding across India. Currently, we have over 10,000+ certified cars listed, a network of 500+ verified dealers, and a physical service presence in 5+ major Tier-1 cities.",
    icon: ShieldCheck
  },
  {
    question: "How does AsOneDealer compare to Cars24 or Spinny?",
    answer: "While others focus on just the 'Sell/Buy' transaction, AsOneDealer is a 'Ownership Partner'. We don't leave you after the sale; we stay with you for 5 years with free maintenance, ensuring your car remains in peak condition.",
    icon: HelpCircle
  },
  {
    question: "What are AsOneDealer's core competitors?",
    answer: "Our primary competitors are traditional classifieds and transaction-only platforms. However, no other platform currently offers a 5-year doorstep service contract integrated at the point of sale.",
    icon: HelpCircle
  },
  {
    question: "How can a car dealer join the AsOneDealer network?",
    answer: "Dealers can apply through our 'Partner With Us' portal. We conduct a physical showroom audit and background check. Once approved, you get the 'AsOne Verified' badge, access to high-intent leads, and our exclusive 5-year service backend for your customers.",
    icon: ShieldCheck
  },
  {
    question: "What financing and loan options are available for buyers?",
    answer: "We have tie-ups with leading banks like HDFC, ICICI, and Axis. Buyers can get up to 100% on-road funding with interest rates starting at 8.5%. Our 'Trust Score' often helps in faster loan approvals with minimal documentation.",
    icon: IndianRupee
  },
  {
    question: "Does AsOneDealer handle RC transfer and documentation?",
    answer: "Yes, we provide an 'End-to-End Paperwork' guarantee. This includes RC transfer, insurance transition, and loan NOCs. Buyers don't need to visit the RTO; our legal team handles everything within 15-30 days.",
    icon: MapPin
  },
  {
    question: "Can an individual sell their car directly to AsOneDealers?",
    answer: "Absolutely. You can list your car for a 'Direct Auction' to our network of 500+ verified dealers. This ensures you get the best market price within 24 hours, compared to low-ball offers from common aggregators.",
    icon: IndianRupee
  },
  {
    question: "Why should a premium showroom prefer AsOne over other listing sites?",
    answer: "Generic sites just give you 'clicks'. AsOne gives you 'Relationship Infrastructure'. By offering our 5-year service contract to your buyers, you build life-long customer loyalty and a superior brand reputation that leads to repeat business.",
    icon: HeartHandshake
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="container mx-auto px-4 py-24">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">
              People <span className="text-primary italic">also ask.</span>
            </h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4">Common questions about the AsOneDealer experience</p>
          </motion.div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "group rounded-[2rem] border transition-all duration-300 overflow-hidden",
                openIndex === index 
                  ? "bg-white border-primary/20 shadow-xl shadow-primary/5" 
                  : "bg-slate-50 border-slate-200 hover:border-slate-300"
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    openIndex === index ? "bg-primary text-white" : "bg-white text-slate-400 group-hover:text-primaryShadow group-hover:bg-primary/10"
                  )}>
                    <faq.icon size={24} />
                  </div>
                  <h3 className={cn(
                    "font-black text-lg md:text-xl tracking-tight leading-tight",
                    openIndex === index ? "text-slate-900" : "text-slate-600 transition-colors group-hover:text-slate-900"
                  )}>
                    {faq.question}
                  </h3>
                </div>
                <div className={cn(
                  "flex-shrink-0 transition-transform duration-300",
                  openIndex === index ? "rotate-180 text-primary" : "text-slate-400"
                )}>
                  <ChevronDown size={24} />
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 md:px-8 pb-8 md:pb-10 pt-0 ml-16">
                      <p className="text-slate-500 font-medium leading-relaxed md:text-lg">
                        {faq.answer}
                      </p>
                      
                      <div className="mt-8 flex items-center gap-4">
                        <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4 transition-all">
                          Read more about this
                        </button>
                        <div className="h-px bg-slate-100 flex-grow" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 p-1 bg-slate-100 rounded-full pr-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <HelpCircle size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Still have questions?</span>
            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Contact Expert</button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
