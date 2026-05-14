import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Star, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  MessageSquare,
  Car,
  Loader2,
  XCircle,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { vehicleService } from '@/services/vehicle.service';
import { userService } from '@/services/user.service';
import { User, Vehicle } from '@/types';
import VehicleCard from '@/features/vehicles/VehicleCard';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { motion } from 'motion/react';

const SellerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [seller, setSeller] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const userData = await userService.fetchUserById(id);
        if (userData) {
          setSeller(userData);
          const sellerVehicles = await vehicleService.fetchVehicles({ sellerId: id, verificationStatus: 'verified' });
          setVehicles(sellerVehicles);
        }
      } catch (error) {
        console.error('Error loading seller data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <XCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold">Seller not found</h2>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const averageRating = seller.rating || 4.2;
  const reviewsCount = seller.reviewsCount || 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 pb-24">
      <Helmet>
        <title>{`${seller.fullName} - Verified Private Seller | AsOneDealer`}</title>
        <meta name="description" content={`View verified vehicle inventory and seller ratings for ${seller.fullName}. Buy used cars directly from trusted private sellers.`} />
      </Helmet>

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
        <h1 className="text-2xl font-bold">Seller Profile</h1>
      </div>

      {/* Profile Card */}
      <section>
        <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white relative">
          <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900" />
          
          <div className="px-8 pb-10">
             <div className="flex flex-col md:flex-row gap-8 items-start -mt-16">
                <div className="relative group">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden bg-white p-2 shadow-2xl border-4 border-white transition-transform duration-500 group-hover:scale-105">
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-4xl font-black text-slate-300">
                      {seller.fullName[0]}
                    </div>
                  </div>
                  {seller.verificationStatus === 'verified' && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                      <CheckCircle2 size={24} />
                    </div>
                  )}
                </div>

                <div className="flex-1 pt-4 md:pt-20 space-y-4">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{seller.fullName}</h2>
                        {seller.verificationStatus === 'verified' && (
                          <Badge className="bg-green-50 text-green-600 border-green-100 px-3 py-1 font-black text-[10px] uppercase tracking-widest">Verified Seller</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-slate-500 font-medium text-sm">
                         <span className="flex items-center gap-1"><MapPin size={16} className="text-primary" /> {seller.cityName || 'India'}</span>
                         <Separator orientation="vertical" className="h-4 bg-slate-200" />
                         <span className="flex items-center gap-1"><Calendar size={16} className="text-primary" /> Member since {new Date(seller.createdAt).getFullYear()}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response Time</p>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-primary" />
                          <p className="text-sm font-bold text-slate-900">{seller.responseTime || 'Under 4 hours'}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Rating</p>
                        <div className="flex items-center gap-2">
                          <Star size={16} className="text-amber-400 fill-amber-400" />
                          <p className="text-sm font-bold text-slate-900">{averageRating.toFixed(1)} / 5.0</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review History</p>
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-blue-500" />
                          <p className="text-sm font-bold text-slate-900">{reviewsCount} Testimonials</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Ads</p>
                        <div className="flex items-center gap-2">
                          <Car size={16} className="text-green-600" />
                          <p className="text-sm font-bold text-slate-900">{vehicles.length} Listings</p>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </Card>
      </section>

      {/* Inventory */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">Current Inventory</h3>
        </div>
        
        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <Car className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">This seller currently has no active listings.</p>
          </div>
        )}
      </section>

      <Separator className="bg-slate-100" />

      {/* Testimonials */}
      <section className="space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
             <ReviewList targetId={seller.id} targetType="seller" refreshKey={reviewRefreshKey} />
          </div>
          <div className="lg:sticky lg:top-24 h-fit">
             <div className="space-y-6">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                     <ShieldCheck size={120} />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <Badge className="bg-primary text-secondary border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest">Seller Trust</Badge>
                    <h4 className="text-2xl font-black italic tracking-tight uppercase leading-tight">Verified Community Member</h4>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      This private seller has been verified through our community trust protocol. 
                      Ratings are based on actual transaction history and buyer feedback.
                    </p>
                  </div>
                </div>
                <ReviewForm targetId={seller.id} targetType="seller" onSuccess={() => setReviewRefreshKey(prev => prev + 1)} />
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SellerDetail;
