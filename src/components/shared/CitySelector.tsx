import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Search, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { POPULAR_CITIES, POPULAR_STATES } from '@/constants/cities';
import { cn } from '@/lib/utils';
import { useLocation } from '@/context/LocationContext';

interface CitySelectorProps {
  onSelect?: (city: string) => void;
  className?: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({ onSelect, className }) => {
  const { selectedCity, setSelectedCity } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [isDetecting, setIsDetecting] = useState(false);

  const handleSelect = (city: string) => {
    setSelectedCity(city);
    setIsOpen(false);
    if (onSelect) onSelect(city);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const data = await response.json();
          
          // Try to get city name, then locality, then subdivision
          const cityName = data.city || data.locality || data.principalSubdivision;
          
          if (cityName) {
            handleSelect(cityName);
          } else {
            console.error("Could not determine city name from coordinates");
            alert("Could not determine your city. Please select manually.");
          }
        } catch (error) {
          console.error("Error fetching location data:", error);
          alert("Error detecting location. Please try again or select manually.");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access was denied. Please enable it in your browser settings.";
        }
        alert(errorMsg);
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone || 
                               document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
  }, []);

  const filteredCities = POPULAR_CITIES.filter(city => 
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStates = POPULAR_STATES.filter(state =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={
          <Button variant="ghost" className={cn("flex items-center gap-1 px-2 sm:px-4 hover:bg-slate-100 rounded-full h-10 transition-all duration-200", className)}>
            <MapPin size={18} className="text-primary shrink-0" />
            <span className="font-semibold hidden sm:inline truncate max-w-[100px]">{selectedCity}</span>
            <ChevronDown size={16} className="opacity-50 shrink-0" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto rounded-3xl p-0 gap-0 border-none shadow-2xl">
        <DialogHeader className="p-6 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between mb-6">
            <DialogTitle className="text-2xl font-bold text-slate-900">Select your location</DialogTitle>
          </div>
          
          {!isStandalone && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <Input 
                  placeholder="Search for city or state" 
                  className="pl-12 h-14 rounded-2xl bg-slate-50 border-slate-100 focus-visible:ring-primary focus-visible:bg-white transition-all text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleSelect('India')}
                  className="text-slate-600 border-slate-200 hover:bg-slate-50 font-bold h-14 px-6 rounded-2xl transition-all"
                >
                  India
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCurrentLocation}
                  disabled={isDetecting}
                  className="text-primary border-primary/20 hover:bg-primary/5 font-bold flex items-center gap-2 h-14 px-6 rounded-2xl transition-all disabled:opacity-70"
                >
                  {isDetecting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Navigation size={20} />
                  )}
                  {isDetecting ? 'Detecting...' : 'Current City'}
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="p-8 space-y-12">
          {filteredStates.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Popular States</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10">
                {filteredStates.map((state) => (
                  <button
                    key={state.name}
                    onClick={() => handleSelect(state.name)}
                    className="flex flex-col items-center gap-4 group outline-none"
                  >
                    <div className={`relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden border-2 transition-all duration-300 transform group-hover:scale-105 group-active:scale-95 ${selectedCity === state.name ? 'border-primary ring-4 ring-primary/10' : 'border-transparent group-hover:border-slate-200 shadow-sm group-hover:shadow-md'}`}>
                      <img 
                        src={state.image} 
                        alt={state.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=400&h=300'; // Generic city fallback
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">{state.landmark}</span>
                      </div>
                      {selectedCity === state.name && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-white rounded-full p-2 shadow-xl animate-in zoom-in duration-300">
                            <div className="bg-primary text-white rounded-full p-1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-sm font-bold tracking-tight transition-colors duration-200 ${selectedCity === state.name ? 'text-primary' : 'text-slate-600 group-hover:text-slate-900'}`}>
                      {state.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredCities.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Popular cities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-10">
                {filteredCities.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => handleSelect(city.name)}
                    className="flex flex-col items-center gap-4 group outline-none"
                  >
                    <div className={`relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden border-2 transition-all duration-300 transform group-hover:scale-105 group-active:scale-95 ${selectedCity === city.name ? 'border-primary ring-4 ring-primary/10' : 'border-transparent group-hover:border-slate-200 shadow-sm group-hover:shadow-md'}`}>
                      <img 
                        src={city.image} 
                        alt={city.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=400&h=300'; // Generic city fallback
                        }}
                      />
                      {selectedCity === city.name && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                          <div className="bg-white rounded-full p-2 shadow-xl animate-in zoom-in duration-300">
                            <div className="bg-primary text-white rounded-full p-1">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-sm font-bold tracking-tight transition-colors duration-200 ${selectedCity === city.name ? 'text-primary' : 'text-slate-600 group-hover:text-slate-900'}`}>
                      {city.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {filteredCities.length === 0 && filteredStates.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">No locations found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CitySelector;
