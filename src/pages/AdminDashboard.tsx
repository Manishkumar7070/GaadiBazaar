import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Loader2, Store, Car, ExternalLink, Eye, Square, CheckSquare, ListChecks, MapPin, FileText } from 'lucide-react';
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
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { useAuth } from '@/hooks/useAuth';
import { shopService } from '@/services/shop.service';
import { vehicleService } from '@/services/vehicle.service';
import { generateStartupSpecPDF } from '@/services/pdfService';
import { Shop, Vehicle } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const VehicleDetailsModal = ({ vehicle, isOpen, onClose }: { vehicle: Vehicle | null, isOpen: boolean, onClose: () => void }) => {
  if (!vehicle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto rounded-3xl p-0 border-none">
        <div className="sticky top-0 bg-white z-10 p-6 border-b flex items-center justify-between">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Car className="text-primary" size={24} />
              Vehicle Details
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-video rounded-3xl overflow-hidden shadow-md border border-slate-100">
                <img 
                  src={vehicle.images[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'} 
                  alt={vehicle.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {vehicle.images.slice(1, 5).map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 rounded-lg">
                    {vehicle.brand} {vehicle.model}
                  </Badge>
                  <Badge className={cn(
                    "rounded-lg",
                    vehicle.verificationStatus === 'verified' ? 'bg-green-500' : 
                    vehicle.verificationStatus === 'rejected' ? 'bg-red-500' : 'bg-orange-500'
                  )}>
                    {vehicle.verificationStatus.toUpperCase()}
                  </Badge>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">{vehicle.title}</h2>
                <div className="text-2xl font-black text-primary mt-1">₹{vehicle.price.toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year</p>
                  <p className="font-bold text-slate-700">{vehicle.year}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driven</p>
                  <p className="font-bold text-slate-700">{vehicle.kilometersDriven.toLocaleString()} km</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fuel Type</p>
                  <p className="font-bold text-slate-700">{vehicle.fuelType}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transmission</p>
                  <p className="font-bold text-slate-700">{vehicle.transmission}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 rounded-2xl text-white">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                  <MapPin size={14} />
                  <span className="text-xs font-bold uppercase">Location</span>
                </div>
                <p className="font-semibold">{vehicle.city}, {vehicle.state}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ListChecks className="text-primary" size={20} />
              Detailed Description
            </h3>
            <div className="bg-slate-50 p-6 rounded-3xl text-sm text-slate-600 leading-relaxed max-h-60 overflow-y-auto">
              {vehicle.description || "No description provided for this listing."}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Registration</p>
              <p className="text-sm font-semibold">{vehicle.registrationNumber || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Mileage</p>
              <p className="text-sm font-semibold">{vehicle.mileage || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Color</p>
              <p className="text-sm font-semibold">{vehicle.color || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Body Type</p>
              <p className="text-sm font-semibold">{vehicle.vehicleType}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 text-xs">
            <div className="flex gap-4">
              <div>
                <span className="text-slate-400">Seller ID:</span>
                <span className="ml-1 font-mono font-bold text-slate-600">{vehicle.sellerId}</span>
              </div>
              {vehicle.shopId && (
                <div>
                  <span className="text-slate-400">Shop ID:</span>
                  <span className="ml-1 font-mono font-bold text-slate-600">{vehicle.shopId}</span>
                </div>
              )}
            </div>
            <div className="text-slate-400">
              Listed on: {vehicle.createdAt ? format(new Date(vehicle.createdAt as any), 'PPp') : 'N/A'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [shopFilter, setShopFilter] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [vehicleFilter, setVehicleFilter] = useState<'pending' | 'verified' | 'rejected'>('pending');
  
  // Selection state
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);

  // Pagination state
  const [shopPage, setShopPage] = useState(1);
  const [vehiclePage, setVehiclePage] = useState(1);
  const ITEMS_PER_PAGE = 5;

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

  // Reset page on filter change
  useEffect(() => {
    setShopPage(1);
  }, [shopFilter]);

  useEffect(() => {
    setVehiclePage(1);
  }, [vehicleFilter]);

  const handleShopVerify = async (shopId: string, status: 'verified' | 'rejected') => {
    setActionLoading(shopId);
    try {
      await shopService.updateShopVerification(shopId, status);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, verificationStatus: status } : s));
      setSelectedShops(prev => prev.filter(id => id !== shopId));
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
      setSelectedVehicles(prev => prev.filter(id => id !== vehicleId));
    } catch (error) {
      alert('Failed to update vehicle status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkShopAction = async (status: 'verified' | 'rejected') => {
    if (selectedShops.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedShops.map(id => shopService.updateShopVerification(id, status)));
      setShops(prev => prev.map(s => selectedShops.includes(s.id) ? { ...s, verificationStatus: status } : s));
      setSelectedShops([]);
    } catch (error) {
      alert('Bulk action failed for some items');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkVehiclesAction = async (status: 'verified' | 'rejected') => {
    if (selectedVehicles.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedVehicles.map(id => vehicleService.updateVehicleVerification(id, status)));
      setVehicles(prev => prev.map(v => selectedVehicles.includes(v.id) ? { ...v, verificationStatus: status } : v));
      setSelectedVehicles([]);
    } catch (error) {
      alert('Bulk action failed for some items');
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleShopSelection = (id: string) => {
    setSelectedShops(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleVehicleSelection = (id: string) => {
    setSelectedVehicles(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const pendingShops = shops.filter(s => s.verificationStatus === 'pending');
  const pendingVehicles = vehicles.filter(v => v.verificationStatus === 'pending');

  const filteredShops = shops.filter(s => s.verificationStatus === shopFilter);
  const filteredVehicles = vehicles.filter(v => v.verificationStatus === vehicleFilter);

  // Paginated data
  const shopTotalPages = Math.ceil(filteredShops.length / ITEMS_PER_PAGE);
  const paginatedShops = filteredShops.slice((shopPage - 1) * ITEMS_PER_PAGE, shopPage * ITEMS_PER_PAGE);

  const vehicleTotalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = filteredVehicles.slice((vehiclePage - 1) * ITEMS_PER_PAGE, vehiclePage * ITEMS_PER_PAGE);

  const allFilteredShopsSelected = paginatedShops.length > 0 && paginatedShops.every(s => selectedShops.includes(s.id));
  const allFilteredVehiclesSelected = paginatedVehicles.length > 0 && paginatedVehicles.every(v => selectedVehicles.includes(v.id));

  const toggleSelectAllShops = () => {
    if (allFilteredShopsSelected) {
      setSelectedShops(prev => prev.filter(id => !paginatedShops.find(s => s.id === id)));
    } else {
      const newSelections = paginatedShops.map(s => s.id);
      setSelectedShops(prev => Array.from(new Set([...prev, ...newSelections])));
    }
  };

  const toggleSelectAllVehicles = () => {
    if (allFilteredVehiclesSelected) {
      setSelectedVehicles(prev => prev.filter(id => !paginatedVehicles.find(v => v.id === id)));
    } else {
      const newSelections = paginatedVehicles.map(v => v.id);
      setSelectedVehicles(prev => Array.from(new Set([...prev, ...newSelections])));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <VehicleDetailsModal 
        vehicle={viewingVehicle} 
        isOpen={!!viewingVehicle} 
        onClose={() => setViewingVehicle(null)} 
      />
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
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={generateStartupSpecPDF}
            className="rounded-xl gap-2 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
          >
            <FileText size={18} />
            Export Features PDF
          </Button>
          <Button variant="outline" onClick={loadData} className="rounded-xl">Refresh Data</Button>
        </div>
      </div>

      <Tabs defaultValue="shops" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100 p-1 h-12">
          <TabsTrigger value="shops" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Showrooms ({pendingShops.length} Pending)
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Vehicles ({pendingVehicles.length} Pending)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shops" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex gap-2">
              {(['pending', 'verified', 'rejected'] as const).map((status) => (
                <Button
                  key={status}
                  variant={shopFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setShopFilter(status);
                    // Selection might remain but usually it's cleaner to keep it separate or clear it
                  }}
                  className="rounded-full capitalize"
                >
                  {status} ({shops.filter(s => s.verificationStatus === status).length})
                </Button>
              ))}
            </div>
            {selectedShops.length > 0 && (
              <div className="flex items-center gap-2 bg-primary/5 p-2 px-4 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-right-2">
                <span className="text-sm font-bold text-primary">{selectedShops.length} Selected</span>
                <div className="h-4 w-px bg-primary/20 mx-2" />
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 h-8 rounded-lg"
                  onClick={() => handleBulkShopAction('verified')}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} className="mr-1" />}
                  Approve All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 h-8 rounded-lg"
                  onClick={() => handleBulkShopAction('rejected')}
                  disabled={bulkLoading}
                >
                  <XCircle size={14} className="mr-1" />
                  Reject All
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 rounded-lg text-slate-500"
                  onClick={() => setSelectedShops([])}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto font-bold flex items-center gap-2 text-slate-600 hover:text-primary"
              onClick={toggleSelectAllShops}
            >
              {allFilteredShopsSelected ? <CheckSquare className="text-primary" size={20} /> : <Square size={20} />}
              Select All Shown
            </Button>
            <span className="text-xs text-slate-400">({paginatedShops.length} items shown)</span>
          </div>

          {paginatedShops.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="py-20 text-center space-y-3">
                <Store className="mx-auto text-slate-300" size={48} />
                <p className="text-slate-500 font-medium">No showrooms with status '{shopFilter}'</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedShops.map(shop => (
                <Card key={shop.id} className={cn(
                  "rounded-3xl border-none shadow-sm overflow-hidden transition-all",
                  selectedShops.includes(shop.id) ? "ring-2 ring-primary ring-inset bg-primary/5" : ""
                )}>
                  <CardContent className="p-6 flex flex-col md:flex-row gap-6 relative">
                    <button 
                      onClick={() => toggleShopSelection(shop.id)}
                      className="absolute top-4 left-4 z-10 p-1 bg-white rounded-lg shadow-md hover:bg-slate-50 transition-colors"
                    >
                      {selectedShops.includes(shop.id) ? <CheckSquare className="text-primary" size={24} /> : <Square className="text-slate-300" size={24} />}
                    </button>
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
                        <Badge 
                          variant={shop.verificationStatus === 'verified' ? 'default' : shop.verificationStatus === 'rejected' ? 'destructive' : 'secondary'} 
                          className={shop.verificationStatus === 'verified' ? 'bg-green-500 hover:bg-green-600' : 
                                     shop.verificationStatus === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : ''}
                        >
                          {shop.verificationStatus.charAt(0).toUpperCase() + shop.verificationStatus.slice(1)}
                        </Badge>
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
                        {shop.verificationStatus !== 'verified' && (
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShopVerify(shop.id, 'verified');
                            }}
                            disabled={actionLoading === shop.id}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
                          >
                            {actionLoading === shop.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            Approve
                          </Button>
                        )}
                        {shop.verificationStatus !== 'rejected' && (
                          <Button 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShopVerify(shop.id, 'rejected');
                            }}
                            disabled={actionLoading === shop.id}
                            className="text-red-600 border-red-100 hover:bg-red-50 rounded-xl gap-2"
                          >
                            <XCircle size={18} />
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {shopTotalPages > 1 && (
                <div className="pt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (shopPage > 1) setShopPage(shopPage - 1);
                          }}
                          className={shopPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: shopTotalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            href="#" 
                            isActive={shopPage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setShopPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (shopPage < shopTotalPages) setShopPage(shopPage + 1);
                          }}
                          className={shopPage === shopTotalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex gap-2">
              {(['pending', 'verified', 'rejected'] as const).map((status) => (
                <Button
                  key={status}
                  variant={vehicleFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVehicleFilter(status)}
                  className="rounded-full capitalize"
                >
                  {status} ({vehicles.filter(v => v.verificationStatus === status).length})
                </Button>
              ))}
            </div>
            {selectedVehicles.length > 0 && (
              <div className="flex items-center gap-2 bg-primary/5 p-2 px-4 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-right-2">
                <span className="text-sm font-bold text-primary">{selectedVehicles.length} Selected</span>
                <div className="h-4 w-px bg-primary/20 mx-2" />
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 h-8 rounded-lg"
                  onClick={() => handleBulkVehiclesAction('verified')}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} className="mr-1" />}
                  Approve All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 h-8 rounded-lg"
                  onClick={() => handleBulkVehiclesAction('rejected')}
                  disabled={bulkLoading}
                >
                  <XCircle size={14} className="mr-1" />
                  Reject All
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 rounded-lg text-slate-500"
                  onClick={() => setSelectedVehicles([])}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-0 h-auto font-bold flex items-center gap-2 text-slate-600 hover:text-primary"
              onClick={toggleSelectAllVehicles}
            >
              {allFilteredVehiclesSelected ? <CheckSquare className="text-primary" size={20} /> : <Square size={20} />}
              Select All Shown
            </Button>
            <span className="text-xs text-slate-400">({paginatedVehicles.length} items shown)</span>
          </div>

          {paginatedVehicles.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="py-20 text-center space-y-3">
                <Car className="mx-auto text-slate-300" size={48} />
                <p className="text-slate-500 font-medium">No vehicles with status '{vehicleFilter}'</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedVehicles.map(vehicle => (
                <Card 
                  key={vehicle.id} 
                  className={cn(
                    "rounded-3xl border-none shadow-sm overflow-hidden transition-all cursor-pointer hover:shadow-md group",
                    selectedVehicles.includes(vehicle.id) ? "ring-2 ring-primary ring-inset bg-primary/5" : "hover:bg-slate-50/50"
                  )}
                  onClick={() => setViewingVehicle(vehicle)}
                >
                  <CardContent className="p-6 flex flex-col md:flex-row gap-6 relative">
                    <button 
                      onClick={() => toggleVehicleSelection(vehicle.id)}
                      className="absolute top-4 left-4 z-10 p-1 bg-white rounded-lg shadow-md hover:bg-slate-50 transition-colors"
                    >
                      {selectedVehicles.includes(vehicle.id) ? <CheckSquare className="text-primary" size={24} /> : <Square className="text-slate-300" size={24} />}
                    </button>
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
                          <Badge 
                            variant={vehicle.verificationStatus === 'verified' ? 'default' : vehicle.verificationStatus === 'rejected' ? 'destructive' : 'secondary'} 
                            className={vehicle.verificationStatus === 'verified' ? 'bg-green-500 hover:bg-green-600' : 
                                      vehicle.verificationStatus === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : ''}
                          >
                            {vehicle.verificationStatus.charAt(0).toUpperCase() + vehicle.verificationStatus.slice(1)}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary h-8 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/vehicle/${vehicle.id}`);
                            }}
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
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Color</p>
                          <p className="text-sm font-semibold">{vehicle.color || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Assembly</p>
                          <p className="text-sm font-semibold">{vehicle.assemblyType || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 items-center">
                        <PhotoGallery images={vehicle.images} title={vehicle.title} />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary h-9 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vehicle/${vehicle.id}`);
                          }}
                        >
                          Full Details <ExternalLink size={14} />
                        </Button>
                        <div className="flex-1" />
                        {vehicle.verificationStatus !== 'verified' && (
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVehicleVerify(vehicle.id, 'verified');
                            }}
                            disabled={actionLoading === vehicle.id}
                            className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2"
                          >
                            {actionLoading === vehicle.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            Approve
                          </Button>
                        )}
                        {vehicle.verificationStatus !== 'rejected' && (
                          <Button 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVehicleVerify(vehicle.id, 'rejected');
                            }}
                            disabled={actionLoading === vehicle.id}
                            className="text-red-600 border-red-100 hover:bg-red-50 rounded-xl gap-2"
                          >
                            <XCircle size={18} />
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {vehicleTotalPages > 1 && (
                <div className="pt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (vehiclePage > 1) setVehiclePage(vehiclePage - 1);
                          }}
                          className={vehiclePage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: vehicleTotalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            href="#" 
                            isActive={vehiclePage === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setVehiclePage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (vehiclePage < vehicleTotalPages) setVehiclePage(vehiclePage + 1);
                          }}
                          className={vehiclePage === vehicleTotalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
