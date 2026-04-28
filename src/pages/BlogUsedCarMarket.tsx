import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  User, 
  Car, 
  CheckCircle2, 
  TrendingUp, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

const BlogUsedCarMarket = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    // Estimating reading time based on ~200 words per minute
    const text = document.getElementById('blog-content')?.innerText || '';
    const words = text.split(/\s+/).length;
    setReadingTime(Math.ceil(words / 200));
  }, []);

  const blogTitle = "Ultimate Guide to Buy Used Cars in India: Trends, Tips & Top Models (2026)";
  const blogDescription = "Looking to buy used cars in India? Discover market trends for the second hand car market, tips for finding certified pre owned vehicles, and popular models in Bihar, Delhi & Bangalore.";
  const keywords = "buy used cars India, second hand car market, certified pre owned vehicles, used car price India, best second hand cars, used car buying guide 2026, One Dealer car market";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": blogTitle,
    "description": blogDescription,
    "image": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2000",
    "author": {
      "@type": "Person",
      "name": "Manish Kumar"
    },
    "publisher": {
      "@type": "Organization",
      "name": "One Dealer",
      "logo": {
        "@type": "ImageObject",
        "url": "https://onedealer.in/logo.png"
      }
    },
    "datePublished": "2026-04-28",
    "dateModified": "2026-04-28"
  };

  return (
    <div className="bg-white min-h-screen">
      <SEO 
        title={blogTitle}
        description={blogDescription}
        keywords={keywords}
        ogImage="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2000"
        schemaData={articleSchema}
        canonical="https://onedealer.in/blog/used-car-market-india"
      />
      {/* Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=2000" 
            alt="Extensive range of used cars for sale in India - Top certified pre-owned vehicles" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Market Insights</span>
              <span className="text-slate-400 text-sm font-medium">• April 2026</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              The Comprehensive Guide to the <span className="text-primary italic">Second Hand Car Market</span> in India
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-slate-300 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-primary">
                  <User size={14} />
                </div>
                <span className="font-bold">Manish Kumar</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <span>{readingTime || 8} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <span>Updated April 28, 2026</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Main Article */}
          <article id="blog-content" className="flex-1 max-w-4xl mx-auto lg:mx-0">
            <div className="prose prose-lg max-w-none prose-slate">
              <p className="text-xl text-slate-600 leading-relaxed font-medium italic border-l-4 border-primary pl-6 mb-12">
                As the Indian automotive landscape undergoes a radical transformation, more buyers than ever are looking to <span className="font-bold text-slate-900">buy used cars India</span>. With inflation affecting new car prices and the rapid entry of organized players, the pre-owned segment is no longer a compromise—it's a calculated financial strategy.
              </p>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8 flex items-center gap-3">
                <TrendingUp className="text-primary" size={32} />
                The Explosion of the Indian Second Hand Car Market
              </h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                The Indian auto industry is currently witnessing a fascinating paradigm shift. Historically, buying a used car was often associated with a lack of resources or a high-risk gamble with one's hard-earned savings. However, in 2024 and 2025, we saw the ratio of used car sales to new car sales tilt significantly. Today, for every new car sold in India, nearly 1.5 used cars find a new home. This trend is expected to grow even further as we move into 2026.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Why is this happening? The primary driver is the sheer value proposition. A new car loses nearly 20-30% of its value the moment it is driven out of the showroom. In a market where fuel prices and road taxes fluctuate, Indian consumers are becoming increasingly pragmatic. They realize that by choosing a 2-3 year old vehicle, they can often upgrade their lifestyle—moving from a budget hatchback to a mid-range SUV for the same price point.
              </p>

              <div className="bg-slate-50 border-2 border-primary/10 rounded-3xl p-8 my-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Car size={120} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Info className="text-primary" size={20} />
                  Did You Know?
                </h3>
                <p className="text-slate-600 font-medium relative z-10 leading-relaxed">
                  The Indian <span className="font-black text-primary">second hand car market</span> is projected to reach a valuation of over $50 billion by 2027, driven largely by digital transparency and the rise of certified pre-owned networks that offer dealer-backed warranties.
                </p>
              </div>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8 flex items-center gap-3">
                <MapPin className="text-primary" size={32} />
                Regional Trends: From Metros to the Heartland
              </h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                The trends aren't uniform across the subcontinent. In major hubs like <span className="font-bold">Delhi-NCR</span>, the strict NGT regulations regarding the longevity of diesel (10 years) and petrol (15 years) vehicles have created a unique high-supply environment. High-quality luxury cars are often available at deep discounts in Delhi because owners prefer to sell early before the registration hits the deadline. This has turned Delhi into a national sourcing hub for buyers from states like Himachal Pradesh and Punjab.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                In <span className="font-bold">Mumbai</span> and <span className="font-bold">Pune</span>, the focus remains on compact SUVs and hatchbacks due to parking constraints and heavy monsoon conditions. Buyers here prioritize durability and high ground clearance. Meanwhile, in <span className="font-bold">Bangalore</span> and <span className="font-bold">Hyderabad</span>, the tech-savvy demographic is driving the demand for automatic transmissions and electric vehicle (EV) resales. The resale value of EVs in Bangalore is currently among the highest in the country due to the robust charging infrastructure and a conscious shift toward sustainable commuting.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Interestingly, the fastest growth is currently being observed in Tier-2 and Tier-3 cities in states like <span className="font-bold">Bihar</span>, <span className="font-bold">West Bengal</span>, and <span className="font-bold">Uttar Pradesh</span>. In Bihar, for instance, we are seeing a massive surge in demand for reliable family cars that can handle both city roads and rural terrain. The aspiration for vehicle ownership is peaking in the heartland, and the entry of platforms like One Dealer is finally bringing transparency to markets that were previously dominated by unorganized brokers and lack of documentation.
              </p>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8">The Financial Engine: Loans and Insurance</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                Another major factor fueling the <span className="font-bold">second hand car market</span> is the availability of easy financing. Just five years ago, getting a loan for a used car was a cumbersome process with exorbitant interest rates. Today, most major banks and NBFCs (Non-Banking Financial Companies) offer specialized "Used Car Loans" with interest rates that are only marginally higher than those for new cars. 
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Moreover, the insurance landscape has evolved. When you <span className="font-bold text-slate-900">buy used cars India</span>, you can often save thousands on annual premiums. Since the Insured Declared Value (IDV) of a used car is lower than its new counterpart, the premium is naturally lower. However, experts recommend sticking to "Comprehensive Insurance" for vehicles that are less than 7 years old to ensure you are covered for accidental damage and third-party liabilities effectively.
              </p>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8 flex items-center gap-3">
                <ShieldCheck className="text-primary" size={32} />
                The Era of Certified Pre Owned Vehicles
              </h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                The biggest hurdle for the used car industry has always been trust. How do you know the odometer hasn't been tampered with? How do you know the engine isn't hiding a major defect? Enter the era of <span className="font-bold text-primary italic underline underline-offset-4">certified pre owned vehicles</span>.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Modern platforms now offer 200-point inspection checklists, covering everything from the thickness of the brake pads to the paint consistency on the doors. A "Certified" tag usually means the car has no history of major accidents, no structural damage, and a verified service history. 
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
                <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-primary/40 transition-colors">
                  <CheckCircle2 className="text-primary mb-4" size={24} />
                  <h4 className="font-bold text-slate-900 mb-2">Verified Documentation</h4>
                  <p className="text-sm text-slate-500">Checking RC, Insurance, and NOC availability is now standard for certified cars.</p>
                </div>
                <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm hover:border-primary/40 transition-colors">
                  <ShieldCheck className="text-primary mb-4" size={24} />
                  <h4 className="font-bold text-slate-900 mb-2">Extended Warranties</h4>
                  <p className="text-sm text-slate-500">Many certified cars come with 6-12 months of engine and gearbox warranty.</p>
                </div>
              </div>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8">Popular Models: The Kings of Resale</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                If you are looking to <span className="font-bold text-slate-900">buy used cars India</span>, you will inevitably encounter the "Maruti and Hyundai" dominance. The Maruti Suzuki Swift and Baleno remain the liquidity kings—you can buy one today and sell it tomorrow without losing much value. They are easy to maintain, and parts are available in every corner of the country.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                In the SUV segment, the Hyundai Creta and Kia Seltos have become the most sought-after pre-owned vehicles. For those looking for ruggedness, the Mahindra Scorpio and Bolero have a cult following, especially in rural and semi-urban India. Luxury seekers often look towards the entry-level BMW 3 Series or Audi A4, which can be found for the price of a top-end new Toyota Fortuner.
              </p>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8">Selling: How to Get the Best Price</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                On the flip side, if you are planning to sell your car in the <span className="font-bold">second hand car market</span>, presentation is everything. While mechanical health is paramount, psychological trust starts with a clean car. Professional detailing, fixing minor dents, and ensuring all electrical components work can add up to 10% to your final selling price.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                One of the most effective ways to command a premium is to provide a comprehensive "Maintenance Log". Even if it's just a folder full of service invoices from a local garage, it shows the potential buyer that the vehicle was never neglected. Additionally, transferring your "No Claim Bonus" (NCB) when you sell and buy a new vehicle is a smart financial move that many sellers overlook during the paperwork phase.
              </p>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8">Vehicle History: The Paper Trail of Trust</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                When navigating the <span className="font-bold">second hand car market</span>, the physical inspection is only half the battle. The digital and paper trail tells a story that the metal often hides. In India, the 'Parivahan' portal has become a goldmine for savvy buyers. By simply entering the registration number, you can verify the number of previous owners—a critical factor in determining resale value. A 'First Owner' car is always more desirable than a 'Third Owner' vehicle, even if the latter has fewer kilometers on the clock.
              </p>
              <p className="text-slate-700 leading-relaxed mb-6">
                Furthermore, check for active hypothecation. Many cars in India are bought on finance, and if the owner hasn't cleared the bank's loan, the registration cannot be transferred. Always ask for the 'No Objection Certificate' (NOC) from the bank. At One Dealer, we prioritize <span className="font-bold text-slate-900 italic">certified pre owned vehicles</span> where these document checks are pre-cleared, saving you weeks of bureaucratic headache.
              </p>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8">Budgeting for Your Used Car: Beyond the Purchase Price</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                One common mistake when you <span className="font-bold text-slate-900 uppercase">buy used cars India</span> is spending 100% of your budget on the car itself. Always keep a 'Contingency Fund' of approximately 5-10% of the purchase price. Why? Because even the best second-hand car will likely need immediate minor attention—perhaps a fresh set of tires, a new battery, or a comprehensive fluid change to reset the service clock.
              </p>
              <p className="text-slate-700 leading-relaxed mb-10">
                Additionally, factor in the 'Insurance Transfer' and 'Transfer of Ownership' fees at the RTO. While these aren't massive, they do add up. By budgeting effectively, you ensure that your first month of car ownership is one of joy, not unexpected financial stress.
              </p>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8">Expert Tips for Smart Buyers</h2>
              <p className="text-slate-700 leading-relaxed mb-10">
                Success in the used car market is 90% preparation and 10% negotiation. Here is a master checklist to keep in your pocket:
              </p>

              <div className="space-y-8 mb-16">
                {[
                  {
                    title: "The Cold Start Test",
                    desc: "Always visit the car in the morning or when the engine is cold. A car that starts smoothly without smoke on a cold engine is a healthy car."
                  },
                  {
                    title: "Check Under the Hood",
                    desc: "Look for oil leaks, worn-out belts, and the condition of the coolant. Fresh oil on an old engine might be a sign someone is trying to hide a leak."
                  },
                  {
                    title: "The Service History",
                    desc: "A car with a complete service record at an authorized dealer is worth paying a 5-10% premium for. It proves the owner cared for the machine."
                  },
                  {
                    title: "Transfer of Documentation",
                    desc: "Ensure the RC transfer happens through Vahan 4.0. Never rely on just delivery notes. Check for pending traffic challans using the vehicle number."
                  }
                ].map((tip, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    <div className="pt-2">
                      <h4 className="text-xl font-bold text-slate-900 mb-2">{tip.title}</h4>
                      <p className="text-slate-600 leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="text-3xl font-black text-slate-900 mt-16 mb-8">Conclusion: The Future is Transparent</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                The Indian used car market is no longer a "buyer beware" zone. With platforms like <span className="font-bold text-primary">One Dealer</span> providing verified listings and full-scale transparency, you can now enjoy the benefits of a premium vehicle at a fraction of the cost. Whether you are a first-time buyer or looking for a secondary vehicle for the family, the pre-owned market offers possibilities that were unimaginable a decade ago.
              </p>
              <p className="text-slate-700 leading-relaxed mb-12">
                Remember, a car is an asset that enables freedom. By choosing wisely from the <span className="font-bold italic">second hand car market</span>, you aren't just saving money—you are making a smart investment in your quality of life.
              </p>
            </div>

            {/* Newsletter / CTA */}
            <div className="bg-gradient-to-br from-primary to-orange-600 rounded-[3rem] p-8 md:p-16 text-white text-center shadow-2xl relative overflow-hidden mt-20">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-4 border-white" />
                 <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border-4 border-white" />
               </div>
               <h3 className="text-3xl md:text-4xl font-black mb-6">Ready to find your dream car?</h3>
               <p className="text-white/80 max-w-xl mx-auto mb-10 text-lg">
                 Join thousands of smart buyers who use One Dealer to browse verified, certified, and trusted vehicles daily.
               </p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Link to="/search">
                   <Button className="bg-white text-primary hover:bg-slate-100 font-black h-14 px-8 rounded-2xl text-lg shadow-xl uppercase tracking-widest">
                     Browse Listings
                   </Button>
                 </Link>
                 <Link to="/list-vehicle">
                   <Button variant="outline" className="border-white text-white hover:bg-white/10 font-black h-14 px-8 rounded-2xl text-lg uppercase tracking-widest bg-transparent">
                     Sell Your Car
                   </Button>
                 </Link>
               </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block w-80 space-y-10 sticky top-24 self-start">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm mb-6">Popular Categories</h4>
              <div className="space-y-3">
                {['Hatchbacks', 'Luxury SUVs', 'Family Sedans', 'Off-roaders', 'Electric Cars'].map((cat) => (
                  <Link 
                    key={cat} 
                    to={`/search?q=${cat}`}
                    className="flex items-center justify-between group p-3 hover:bg-white rounded-xl transition-all hover:shadow-sm"
                  >
                    <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{cat}</span>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
              <h4 className="font-black text-primary uppercase tracking-widest text-sm mb-4">Why Trust Us?</h4>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-slate-600">Verified Dealers Only</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-slate-600">Transparent Pricing</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                  <span className="text-xs font-bold text-slate-600">Bihar's Leading Platform</span>
                </li>
              </ul>
            </div>

            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] group">
              <img 
                src="https://images.unsplash.com/photo-1542362567-b052ed5d2b73?auto=format&fit=crop&q=80&w=800" 
                alt="Get the best market price for your second hand car in India" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
              />
              <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-6 text-white">
                <h5 className="font-black text-xl mb-2">Sell your car in 10 minutes</h5>
                <p className="text-xs text-white/70 mb-4 font-medium italic">Reach 50,000+ buyers in Bihar instantly.</p>
                <Link to="/list-vehicle">
                  <Button className="w-full bg-primary font-black uppercase tracking-widest text-[10px] h-10 rounded-xl">
                    Get Started <ArrowRight size={12} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      {/* Footer Meta */}
      <div className="border-t border-slate-100 py-12 bg-slate-50 mt-20">
        <div className="container mx-auto px-4 text-center">
           <p className="text-slate-400 text-sm font-medium">
             &copy; 2026 One Dealer India. All rights reserved. <br className="md:hidden" />
             Empowering the <span className="font-bold underline underline-offset-2">certified pre owned vehicles</span> ecosystem.
           </p>
        </div>
      </div>
    </div>
  );
};

export default BlogUsedCarMarket;
