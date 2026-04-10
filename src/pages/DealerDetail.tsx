import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  MapPin, 
  Star, 
  Phone, 
  MessageSquare, 
  ShieldCheck,
  Info,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_VEHICLES, MOCK_DEALERS } from '@/constants/mockData';
import VehicleCard from '@/features/vehicles/VehicleCard';
import { motion } from 'motion/react';

const DealerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const dealer = MOCK_DEALERS.find(d => d.id === id);
  const dealerVehicles = MOCK_VEHICLES.filter(v => v.dealerId === id);

  if (!dealer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">Dealer not found</h2>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full bg-white shadow-sm"
        >
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-bold">Dealer Profile</h1>
      </div>

      {/* Dealer Info Card */}
      <section>
        <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1 aspect-square md:aspect-auto relative">
              <img 
                src={dealer.shopImages[0]} 
                alt={dealer.shopName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {dealer.isVerified && (
                <div className="absolute top-6 left-6">
                  <Badge className="bg-green-500 text-white border-none px-3 py-1 flex gap-1 items-center shadow-lg">
                    <ShieldCheck size={14} /> Verified Dealer
                  </Badge>
                </div>
              )}
            </div>
            <div className="md:col-span-2 p-8 md:p-12 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-slate-900">{dealer.shopName}</h2>
                  <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                    <Star size={16} fill="currentColor" />
                    {dealer.rating} ({dealer.totalReviews} reviews)
                  </div>
                </div>
                <p className="text-slate-500 flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  {dealer.address}, {dealer.city}, {dealer.state} - {dealer.pincode}
                </p>
              </div>

              <p className="text-slate-600 leading-relaxed">
                {dealer.description}
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold flex gap-2 flex-1 md:flex-none">
                  <Phone size={20} /> Call Dealer
                </Button>
                <Button variant="outline" className="rounded-2xl h-14 px-8 border-primary text-primary font-bold flex gap-2 flex-1 md:flex-none">
                  <MessageSquare size={20} /> Chat
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Location Section */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="text-primary" /> Store Location
        </h3>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden h-64 bg-slate-100 relative">
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-2">
            <MapPin size={48} />
            <p className="font-bold">Map View: {dealer.city}</p>
            <p className="text-sm">({dealer.latitude}, {dealer.longitude})</p>
          </div>
          {/* In a real app, a Google Maps component would go here */}
        </Card>
      </section>

      {/* Inventory Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Car className="text-primary" /> Dealer Inventory
            <span className="text-sm font-normal text-slate-400 ml-2">({dealerVehicles.length} vehicles)</span>
          </h3>
        </div>

        {dealerVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dealerVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
            <Car className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">This dealer currently has no active listings.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DealerDetail;
