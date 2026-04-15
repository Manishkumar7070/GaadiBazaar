import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Loader2, Store, Car, ExternalLink, Eye, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { shopService } from '@/services/shop.service';
import { vehicleService } from '@/services/vehicle.service';
import { Shop, Vehicle } from '@/types';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/profile');
    }
  }, [user, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allShops, allVehicles] = await Promise.all([
        shopService.fetchShops(),
        vehicleService.fetchVehicles()
      ]);
      setShops(allShops);
      setVehicles(allVehicles);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleShopVerify = async (shopId: string, status: 'verified' | 'rejected') => {
    setActionLoading(shopId);
    try {
      await shopService.updateShopVerification(shopId, status);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, verificationStatus: status } : s));
    } catch (error) {
      alert('Failed to update shop status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVehicleVerify = async (vehicleId: string, status: 'verified' | 'rejected') => {
    setActionLoading(vehicleId);
    try {
      await vehicleService.updateVehicleVerification(vehicleId, status);
      setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, verificationStatus: status } : v));
    } catch (error) {
      alert('Failed to update vehicle status');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const PhotoGallery = ({ images, title }: { images: string[], title: string }) => (
    <Dialog>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="gap-2 rounded-xl">
          <Eye size={16} /> View All {images.length} Photos
        </Button>
      } />
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>Photos for {title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {images.map((img, i) => (
            <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-slate-100">
              <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  const pendingShops = shops.filter(s => s.verificationStatus === 'pending');
  const pendingVehicles = vehicles.filter(v => v.verificationStatus === 'pending');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Verification Panel</h1>
            <p className="text-slate-500 text-sm">Review and verify showroom and vehicle listings</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadData} className="rounded-xl">Refresh Data</Button>
      </div>

      <Tabs defaultValue="shops" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 h-12">
          <TabsTrigger value="shops" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Showrooms ({pendingShops.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Vehicles ({pendingVehicles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shops" className="mt-6 space-y-4">
          {pendingShops.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="py-20 text-center space-y-3">
                <Store className="mx-auto text-slate-300" size={48} />
                <p className="text-slate-500 font-medium">No showrooms pending verification</p>
              </CardContent>
            </Card>
          ) : (
            pendingShops.map(shop => (
              <Card key={shop.id} className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 aspect-video rounded-2xl overflow-hidden bg-slate-100">
                    {shop.images[0] ? (
                      <img src={shop.images[0]} alt={shop.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Store size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{shop.name}</h3>
                        <p className="text-slate-500 text-sm">{shop.address}, {shop.city}</p>
                        <p className="text-slate-400 text-xs mt-1">Owner ID: {shop.ownerId}</p>
                      </div>
                      <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-100">Pending</Badge>
                    </div>
                    <p className="text-slate-600 text-sm line-clamp-2">{shop.description}</p>
                    <div className="flex flex-wrap gap-2 pt-2 items-center">
                      <PhotoGallery images={shop.images} title={shop.name} />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary h-9 gap-1"
                        onClick={() => navigate(`/dealer/${shop.id}`)}
                      >
                        View Showroom <ExternalLink size={14} />
                      </Button>
                      <div className="flex-1" />
                      <Button 
                        onClick={() => handleShopVerify(shop.id, 'verified')}
                        disabled={actionLoading === shop.id}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
                      >
                        {actionLoading === shop.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        Approve
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleShopVerify(shop.id, 'rejected')}
                        disabled={actionLoading === shop.id}
                        className="text-red-600 border-red-100 hover:bg-red-50 rounded-xl gap-2"
                      >
                        <XCircle size={18} />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6 space-y-4">
          {pendingVehicles.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="py-20 text-center space-y-3">
                <Car className="mx-auto text-slate-300" size={48} />
                <p className="text-slate-500 font-medium">No vehicles pending verification</p>
              </CardContent>
            </Card>
          ) : (
            pendingVehicles.map(vehicle => (
              <Card key={vehicle.id} className="rounded-3xl border-none shadow-sm overflow-hidden">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 aspect-video rounded-2xl overflow-hidden bg-slate-100">
                    {vehicle.images[0] ? (
                      <img src={vehicle.images[0]} alt={vehicle.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Car size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{vehicle.title}</h3>
                        <p className="text-slate-500 text-sm">₹{vehicle.price.toLocaleString()} • {vehicle.city}</p>
                        <p className="text-slate-400 text-xs mt-1">Seller ID: {vehicle.sellerId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary" className="bg-orange-50 text-orange-600 border-orange-100">Pending</Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary h-8 gap-1"
                          onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                        >
                          View Details <ExternalLink size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Reg. Number</p>
                        <p className="text-sm font-semibold">{vehicle.registrationNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Mileage</p>
                        <p className="text-sm font-semibold">{vehicle.mileage || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">KM Driven</p>
                        <p className="text-sm font-semibold">{vehicle.kilometersDriven.toLocaleString()} km</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Ownership</p>
                        <p className="text-sm font-semibold">{vehicle.ownership} Owner</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 items-center">
                      <PhotoGallery images={vehicle.images} title={vehicle.title} />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary h-9 gap-1"
                        onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                      >
                        Full Details <ExternalLink size={14} />
                      </Button>
                      <div className="flex-1" />
                      <Button 
                        onClick={() => handleVehicleVerify(vehicle.id, 'verified')}
                        disabled={actionLoading === vehicle.id}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
                      >
                        {actionLoading === vehicle.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        Approve
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleVehicleVerify(vehicle.id, 'rejected')}
                        disabled={actionLoading === vehicle.id}
                        className="text-red-600 border-red-100 hover:bg-red-50 rounded-xl gap-2"
                      >
                        <XCircle size={18} />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
