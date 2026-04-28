import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Settings, Package, Heart, Bell, Shield, LogOut, Bookmark, ChevronRight, Trash2, Clock, Loader2, PlusCircle, Store, MapPin, Eye, X, TrendingUp, Wallet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { SavedSearch, Vehicle, WishlistItem, Shop } from '@/types';
import { MOCK_VEHICLES } from '@/constants/mockData';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { shopService } from '@/services/shop.service';
import { vehicleService } from '@/services/vehicle.service';
import { searchService } from '@/services/search.service';
import { supabase } from '@/lib/supabase';
import VehicleCard from '@/features/vehicles/VehicleCard';
import SellerAnalytics from '@/features/seller/SellerAnalytics';

const Profile = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { wishlist, loading: wishlistLoading, toggleWishlist } = useWishlist();
  const [activeTab, setActiveTab] = useState('overview');
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Vehicle[]>([]);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?reason=profile&redirect=/profile');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        // Load Vehicles
        setVehiclesLoading(true);
        try {
          const fetchedVehicles = await vehicleService.fetchVehicles({ sellerId: user.id });
          setMyVehicles(fetchedVehicles);
        } catch (error) {
          console.error('Error loading my vehicles:', error);
        } finally {
          setVehiclesLoading(false);
        }

        // Load Saved Searches
        try {
          const searches = await searchService.fetchSavedSearches(user.id);
          setSavedSearches(searches);
        } catch (error) {
          console.error('Error loading saved searches:', error);
        }

        // Load Shop if applicable
        if (user.role === 'dealer' || user.role === 'admin') {
          setShopLoading(true);
          try {
            const userShop = await shopService.fetchUserShop(user.id);
            setShop(userShop);
          } catch (error) {
            console.error('Error loading shop:', error);
          } finally {
            setShopLoading(false);
          }
        }
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    // Ensure unique IDs for recently viewed
    const uniqueIds = Array.from(new Set(viewedIds)) as string[];
    const viewedVehicles = uniqueIds
      .map((id: string) => MOCK_VEHICLES.find(v => v.id === id))
      .filter(Boolean) as Vehicle[];
    setRecentlyViewed(viewedVehicles);
  }, []);

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      await searchService.deleteSavedSearch(id);
      setSavedSearches(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting saved search:', error);
      alert('Failed to delete search.');
    }
  };

  const handleShopPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user || !shop) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('shops')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('shops')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const updatedImages = [...(shop.images || []), ...uploadedUrls];
      
      await shopService.updateShop(shop.id, { images: updatedImages });
      setShop({ ...shop, images: updatedImages });
    } catch (error) {
      console.error('Error uploading shop photos:', error);
      alert('Failed to upload photos.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeShopPhoto = async (index: number) => {
    if (!shop) return;
    const updatedImages = shop.images.filter((_, i) => i !== index);
    try {
      await shopService.updateShop(shop.id, { images: updatedImages });
      setShop({ ...shop, images: updatedImages });
    } catch (error) {
      console.error('Error removing shop photo:', error);
    }
  };

  const menuItems = [
    { icon: Package, label: 'My Listings', count: myVehicles.length, value: 'listings' },
    { icon: Heart, label: 'Wishlist', count: wishlist.length, value: 'wishlist' },
    { icon: Bookmark, label: 'Saved Searches', count: savedSearches.length, value: 'saved' },
    { icon: TrendingUp, label: 'Performance & ROI', value: 'analytics' },
    { icon: Clock, label: 'Recently Viewed', count: recentlyViewed.length, value: 'recent' },
    { icon: Bell, label: 'Notifications', count: 0 },
    { 
      icon: Shield, 
      label: 'Security & Verification', 
      status: shop ? shop.verificationStatus : 'Individual',
      statusColor: shop?.verificationStatus === 'verified' ? 'text-green-500' : 
                   shop?.verificationStatus === 'rejected' ? 'text-red-500' : 'text-orange-500'
    },
    { icon: Settings, label: 'Account Settings' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
          <AvatarFallback>{user.fullName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.fullName}</h1>
          <p className="text-slate-500">{user.email}</p>
          {user.phone && <p className="text-slate-500">{user.phone}</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" className="rounded-full">Edit Profile</Button>
          {user.role === 'dealer' && !shop && !shopLoading && (
            <Link to="/create-shop">
              <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold flex gap-2">
                <Store size={18} /> Register Showroom
              </Button>
            </Link>
          )}
          <Link to="/list-vehicle">
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold flex gap-2">
              <PlusCircle size={18} /> Sell Vehicle
            </Button>
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin">
              <Button className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold flex gap-2">
                <Shield size={18} /> Admin Panel
              </Button>
            </Link>
          )}
        </div>
        {shop && (
          <div className="mt-4 flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <Store size={16} className="text-primary" />
            <span className="text-sm font-bold">{shop.name}</span>
            <Badge 
              variant={shop.verificationStatus === 'verified' ? 'default' : shop.verificationStatus === 'rejected' ? 'destructive' : 'secondary'} 
              className={`text-[10px] uppercase ${shop.verificationStatus === 'verified' ? 'bg-green-500 hover:bg-green-600' : ''}`}
            >
              {shop.verificationStatus}
            </Badge>
            <Separator orientation="vertical" className="h-4" />
            <Link to="/edit-shop">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg">
                Edit Shop
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <Link to={`/dealer/${shop.id}`}>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex gap-1 items-center">
                <Eye size={12} /> Preview
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <TabsList className={`flex min-w-max rounded-2xl bg-slate-100 p-1 gap-1 h-12 w-full`}>
            {shop && <TabsTrigger value="shop" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-0 text-xs sm:text-sm font-bold transition-all h-full">My Shop</TabsTrigger>}
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-0 text-xs sm:text-sm font-bold transition-all h-full">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-0 text-xs sm:text-sm font-bold transition-all h-full">Performance</TabsTrigger>
            <TabsTrigger value="listings" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-0 text-xs sm:text-sm font-bold transition-all h-full">Listings</TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-0 text-xs sm:text-sm font-bold transition-all h-full">Wishlist</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-0 text-xs sm:text-sm font-bold transition-all h-full">Saved</TabsTrigger>
            <TabsTrigger value="recent" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-0 text-xs sm:text-sm font-bold transition-all h-full">Recent</TabsTrigger>
          </TabsList>
        </div>
        
        {shop && (
          <TabsContent value="shop" className="mt-6 space-y-6">
            <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{shop.name}</h3>
                    <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {shop.city}, {shop.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/dealer/${shop.id}`}>
                      <Button variant="outline" size="sm" className="rounded-xl font-bold flex gap-2 items-center">
                        <Eye size={16} /> View Public Profile
                      </Button>
                    </Link>
                    <Link to="/edit-shop">
                      <Button variant="outline" size="sm" className="rounded-xl font-bold">Edit Details</Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                      <PlusCircle size={18} className="text-primary" />
                      Shop Photos
                    </h4>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleShopPhotoUpload} 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary font-bold hover:bg-primary/5"
                    >
                      {uploading ? <Loader2 className="animate-spin mr-2" size={16} /> : <PlusCircle className="mr-2" size={16} />}
                      {uploading ? 'Uploading...' : 'Add Photos'}
                    </Button>
                  </div>

                  {shop.images && shop.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {shop.images.map((img, i) => (
                        <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-slate-100 relative group">
                          <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button 
                              variant="secondary" 
                              size="icon" 
                              className="rounded-full w-8 h-8"
                              onClick={() => setSelectedImage(img)}
                            >
                              <Eye size={14} />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="rounded-full w-8 h-8"
                              onClick={() => removeShopPhoto(i)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <Store className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-slate-500 text-sm">No photos uploaded yet.</p>
                      <Button 
                        variant="link" 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary font-bold"
                      >
                        Upload your first photo
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="overview" className="mt-6">
          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.label}>
                    <button 
                      className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
                      onClick={() => item.value && setActiveTab(item.value)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                          <Icon size={20} />
                        </div>
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.count !== undefined && item.count > 0 && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                            {item.count}
                          </span>
                        )}
                        {item.status && (
                          <span className={`text-xs font-bold uppercase tracking-wider ${item.statusColor || 'text-orange-500'}`}>
                            {item.status}
                          </span>
                        )}
                        {item.value && <ChevronRight size={16} className="text-slate-300" />}
                      </div>
                    </button>
                    {i < menuItems.length - 1 && <Separator />}
                  </React.Fragment>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <SellerAnalytics vehicles={myVehicles} walletBalance={user.walletBalance || 4500} />
        </TabsContent>

        <TabsContent value="listings" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">My Vehicles</h3>
            <Link to="/list-vehicle">
              <Button size="sm" className="rounded-xl flex gap-2">
                <PlusCircle size={16} /> List New
              </Button>
            </Link>
          </div>

          {vehiclesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : myVehicles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <Package className="mx-auto text-slate-300" size={40} />
              <p className="text-slate-500">You haven't listed any vehicles yet.</p>
              <Link to="/list-vehicle">
                <Button variant="link" className="text-primary font-bold">Start Selling</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myVehicles.map((vehicle) => (
                <div key={vehicle.id} className="relative group">
                  <VehicleCard vehicle={vehicle} />
                  
                  {/* Upsell Trigger Layer */}
                  {vehicle.listingType === 'free' && (
                    <div className="mt-2 bg-primary/5 p-3 rounded-2xl border border-primary/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Zap size={16} className="text-primary animate-pulse" />
                        <p className="text-[11px] font-bold text-slate-700">This free listing is getting 45% less views than premium ads. <span className="text-primary">Boost it now!</span></p>
                      </div>
                      <Button size="sm" className="h-8 bg-primary rounded-lg text-xs font-bold shrink-0">Boost Ad</Button>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                    <Link to={`/edit-vehicle/${vehicle.id}`}>
                      <Button variant="secondary" size="sm" className="rounded-lg h-8 px-2 text-xs font-bold shadow-lg">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6 space-y-4">
          {wishlistLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : wishlist.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <Heart className="mx-auto text-slate-300" size={40} />
              <p className="text-slate-500">Your wishlist is empty.</p>
              <Link to="/search">
                <Button variant="link" className="text-primary font-bold">Browse Vehicles</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {wishlist.map((item) => (
                item.vehicle && <VehicleCard key={item.id} vehicle={item.vehicle} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6 space-y-4">
          {savedSearches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <Bookmark className="mx-auto text-slate-300" size={40} />
              <p className="text-slate-500">You haven't saved any searches yet.</p>
            </div>
          ) : (
            savedSearches.map((search) => (
              <Card key={search.id} className="rounded-2xl border-none shadow-sm overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Bookmark size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{search.name}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {search.filters.brand && (
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                            "{search.filters.brand}"
                          </span>
                        )}
                        {search.filters.vehicleType && (
                          <span className="text-[10px] bg-blue-50 px-1.5 py-0.5 rounded text-blue-600 font-medium capitalize">
                            {search.filters.vehicleType}
                          </span>
                        )}
                        {search.filters.city && (
                          <span className="text-[10px] bg-green-50 px-1.5 py-0.5 rounded text-green-600 font-medium">
                            {search.filters.city}
                          </span>
                        )}
                        {(search.filters.minPrice || search.filters.maxPrice) && (
                          <span className="text-[10px] bg-orange-50 px-1.5 py-0.5 rounded text-orange-600 font-medium">
                            ₹{search.filters.minPrice?.toLocaleString() || '0'} - ₹{search.filters.maxPrice?.toLocaleString() || 'Any'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => handleDeleteSavedSearch(search.id)}>
                      <Trash2 size={18} />
                    </Button>
                    <Link to={`/search?q=${search.filters.brand || ''}&type=${search.filters.vehicleType || ''}&city=${search.filters.city || ''}&min=${search.filters.minPrice || ''}&max=${search.filters.maxPrice || ''}`}>
                      <Button variant="ghost" size="icon" className="text-primary">
                        <ChevronRight size={18} />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Browsing History</h3>
            {recentlyViewed.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-400 hover:text-red-500 flex gap-1 items-center"
                onClick={() => {
                  localStorage.removeItem('recentlyViewed');
                  setRecentlyViewed([]);
                }}
              >
                <Trash2 size={14} /> Clear All
              </Button>
            )}
          </div>
          
          {recentlyViewed.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
              <Clock className="mx-auto text-slate-300" size={40} />
              <p className="text-slate-500">No recently viewed vehicles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {recentlyViewed.map((vehicle) => (
                <Link key={vehicle.id} to={`/vehicle/${vehicle.id}`}>
                  <Card className="rounded-2xl border-none shadow-sm overflow-hidden group">
                    <div className="aspect-square relative overflow-hidden">
                      <img 
                        src={vehicle.images[0]} 
                        alt={vehicle.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                        <p className="text-white text-xs font-bold truncate">{vehicle.title}</p>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-primary font-bold text-sm">₹{vehicle.price.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Button 
        variant="ghost" 
        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-14 rounded-2xl font-bold flex gap-2"
        onClick={() => {
          logout();
          navigate('/');
        }}
      >
        <LogOut size={20} /> Logout
      </Button>

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Shop Photo Preview</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Button 
              variant="secondary" 
              size="icon" 
              className="absolute top-6 right-6 rounded-full z-50 shadow-xl"
              onClick={() => setSelectedImage(null)}
            >
              <X size={20} />
            </Button>
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Shop Preview" 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
