import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Gauge, User, ShieldCheck, Heart, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/types';
import { useComparison } from '@/context/ComparisonContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VehicleCardProps {
  vehicle: Vehicle;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  const { addToComparison, removeFromComparison, isVehicleSelected } = useComparison();
  const isSelected = isVehicleSelected(vehicle.id);

  const toggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelected) {
      removeFromComparison(vehicle.id);
    } else {
      addToComparison(vehicle);
    }
  };

  return (
    <Link to={`/vehicle/${vehicle.id}`}>
      <Card className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-3xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={vehicle.images[0]} 
            alt={vehicle.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            {vehicle.isFeatured && (
              <Badge className="bg-primary text-white border-none">Featured</Badge>
            )}
            {vehicle.isVerified && (
              <Badge className="bg-green-500 text-white border-none flex gap-1 items-center">
                <ShieldCheck size={12} /> Verified
              </Badge>
            )}
          </div>
          
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors">
              <Heart size={20} />
            </button>
            <button 
              onClick={toggleCompare}
              className={cn(
                "w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors",
                isSelected ? "bg-primary text-white" : "bg-white/80 text-slate-600 hover:text-primary"
              )}
            >
              <ArrowLeftRight size={20} />
            </button>
          </div>

          <div className="absolute bottom-4 left-4">
            <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
              {vehicle.city}, {vehicle.state}
            </div>
          </div>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {vehicle.title}
            </h3>
            <div className="flex items-center gap-4 text-slate-500 text-sm">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{vehicle.year}</span>
              </div>
              <div className="flex items-center gap-1">
                <Gauge size={14} />
                <span>{vehicle.kilometersDriven.toLocaleString()} km</span>
              </div>
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>{vehicle.ownership}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-2xl font-bold text-slate-900">
              ₹{vehicle.price.toLocaleString()}
            </div>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 capitalize">
              {vehicle.fuelType}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default VehicleCard;
