import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  ShieldCheck,
  Car,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    brands: [
      { name: 'Maruti Suzuki', path: '/search?brand=Maruti' },
      { name: 'Hyundai', path: '/search?brand=Hyundai' },
      { name: 'Tata Motors', path: '/search?brand=Tata' },
      { name: 'Mahindra', path: '/search?brand=Mahindra' },
      { name: 'Toyota', path: '/search?brand=Toyota' },
      { name: 'BMW & Luxury', path: '/search?category=Luxury' },
    ],
    cities: [
      { name: 'Used Cars in Delhi', path: '/search?city=Delhi' },
      { name: 'Used Cars in Mumbai', path: '/search?city=Mumbai' },
      { name: 'Used Cars in Bangalore', path: '/search?city=Bangalore' },
      { name: 'Used Cars in Hyderabad', path: '/search?city=Hyderabad' },
      { name: 'Used Cars in Pune', path: '/search?city=Pune' },
      { name: 'View All Cities', path: '/search' },
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Partner with Us', path: '/create-shop' },
      { name: 'Find Dealers', path: '/find-dealers' },
      { name: 'Market Trends', path: '/blog/used-car-market-india' },
      { name: 'Sitemap', path: '/sitemap' },
    ],
    support: [
      { name: 'Help Center', path: '/help' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
      { name: 'RC Transfer Guide', path: '/guide/rc-transfer' },
      { name: 'Sell My Car', path: '/list-vehicle' },
    ]
  };

  return (
    <footer className="bg-slate-950 text-slate-400 pt-20 pb-10 border-t border-slate-900 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 -z-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <Car size={24} strokeWidth={3} />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">
                ASONE<span className="text-primary italic">DEALER</span>
              </span>
            </Link>
            
            <p className="text-slate-500 max-w-sm leading-relaxed font-medium">
              India's most trusted network for premium used cars. We bridge the gap between India's finest showrooms and car enthusiasts. Verified listings, expert advice, and absolute transparency.
            </p>

            <div className="flex gap-4">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Youtube, label: 'Youtube' }
              ].map((social, i) => (
                <a 
                  key={i}
                  href="#" 
                  className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:border-primary hover:bg-primary/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
            
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center gap-4 max-w-xs">
              <div className="min-w-[48px] h-[48px] rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <ShieldCheck size={28} />
              </div>
              <div>
                <p className="text-white text-sm font-black italic">100% Verified Dealers</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Zero Scam Policy</p>
              </div>
            </div>
          </div>

          {/* Links Sets */}
          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">Top Brands</h4>
            <ul className="space-y-4">
              {footerLinks.brands.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm font-medium hover:text-primary flex items-center gap-2 group">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">Major Cities</h4>
            <ul className="space-y-4">
              {footerLinks.cities.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm font-medium hover:text-primary flex items-center gap-2 group">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">Support & Help</h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="text-sm font-medium hover:text-primary flex items-center gap-2 group">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-primary" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* SEO Keywords Text Block */}
        <div className="py-10 border-t border-slate-900">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 opacity-40 hover:opacity-100 transition-opacity">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Popular Searches:</p>
            {['Second hand cars', 'Certified used cars', 'Used luxury cars', 'Best mileage automatic cars', 'Diesel cars for sale', 'Top SUV in India', 'Buy used Scorpio', 'Hyundai Creta Second Hand'].map((kw, i) => (
              <Link key={i} to="/search" className="text-[10px] font-bold text-slate-600 hover:text-primary">
                {kw}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8 text-xs font-bold text-slate-600">
            <p>© {currentYear} AsoneDealer. All Rights Reserved.</p>
            <div className="flex items-center gap-1">
              <Mail size={12} className="text-primary" />
              <span>sales@asonedealer.com</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <p className="text-xs font-bold text-slate-500">Secure Payments via:</p>
            <div className="flex items-center gap-4 grayscale opacity-50">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" referrerPolicy="no-referrer" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" referrerPolicy="no-referrer" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
