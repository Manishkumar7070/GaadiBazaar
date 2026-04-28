import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shop } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Phone, ExternalLink, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet marker icon issue in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface DealerMapProps {
  shops: Shop[];
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
}

// Component to handle map center changes
const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const DealerMap: React.FC<DealerMapProps> = ({ 
  shops, 
  className = "h-[500px]", 
  initialCenter = [22.9734, 78.6569], // Central India
  initialZoom = 5
}) => {
  const [activeShop, setActiveShop] = useState<Shop | null>(null);
  const navigate = useNavigate();

  // Custom icon for premium dealers
  const premiumIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner ${className}`}>
      <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {shops.map((shop) => (
          shop.latitude && shop.longitude && (
            <Marker 
              key={shop.id} 
              position={[shop.latitude, shop.longitude]}
              icon={shop.isPremium ? premiumIcon : new L.Icon.Default()}
              eventHandlers={{
                click: () => setActiveShop(shop),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-sm text-slate-900">{shop.name}</h3>
                    {shop.isPremium && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] py-0 px-1.5 h-auto">
                        Premium
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-2">
                    <MapPin size={10} className="text-secondary" />
                    <span className="line-clamp-1">{shop.address}, {shop.city}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-0.5 text-yellow-500">
                      <Star size={10} fill="currentColor" />
                      <span className="text-[10px] font-bold">{shop.rating || 'N/A'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">({shop.reviewCount || 0} reviews)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      className="h-7 text-[10px] font-bold rounded-lg"
                      onClick={() => navigate(`/dealer/${shop.id}`)}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] font-bold rounded-lg flex gap-1"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`, '_blank')}
                    >
                      <Navigation size={10} /> Directions
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* Floating Shop Quick View Overlay (Desktop) */}
      {activeShop && (
        <div className="absolute bottom-6 left-6 right-6 z-[1000] md:left-6 md:right-auto md:w-80">
          <Card className="shadow-2xl border-none rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CardContent className="p-0">
              <div className="relative h-32 overflow-hidden">
                <img 
                  src={activeShop.images[0]} 
                  alt={activeShop.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setActiveShop(null)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70 transition-colors"
                >
                  &times;
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 line-clamp-1">{activeShop.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={10} /> {activeShop.city}, {activeShop.state}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-bold text-yellow-500">
                    <Star size={14} fill="currentColor" /> {activeShop.rating}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 text-xs font-bold text-primary p-0 hover:bg-transparent"
                    onClick={() => navigate(`/dealer/${activeShop.id}`)}
                  >
                    View Dealer Profile <ExternalLink size={12} className="ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DealerMap;
