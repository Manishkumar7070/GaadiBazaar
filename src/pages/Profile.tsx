import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Settings, Package, Heart, Bell, Shield, LogOut, Bookmark, ChevronRight, Trash2, Clock, Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SavedSearch, Vehicle } from '@/types';
import { MOCK_VEHICLES } from '@/constants/mockData';
import { useAuth } from '@/hooks/useAuth';

const Profile = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?reason=profile&redirect=/profile');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    // Ensure unique IDs for saved searches
    const uniqueSaved = Array.from(new Map(saved.map((s: any) => [s.id, s])).values()) as SavedSearch[];
    setSavedSearches(uniqueSaved);

    const viewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    // Ensure unique IDs for recently viewed
    const uniqueIds = Array.from(new Set(viewedIds)) as string[];
    const viewedVehicles = uniqueIds
      .map((id: string) => MOCK_VEHICLES.find(v => v.id === id))
      .filter(Boolean) as Vehicle[];
    setRecentlyViewed(viewedVehicles);
  }, []);

  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const menuItems = [
    { icon: Package, label: 'My Listings', count: 0 },
    { icon: Heart, label: 'Favorites', count: 2 },
    { icon: Bell, label: 'Notifications', count: 5 },
    { icon: Shield, label: 'Verification Status', status: 'Pending' },
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
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full">Edit Profile</Button>
          <Link to="/list-vehicle">
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-white font-bold flex gap-2">
              <PlusCircle size={18} /> Sell Vehicle
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="menu" className="w-full flex flex-col gap-6">
        <TabsList className="grid grid-cols-3 w-full rounded-2xl bg-slate-100 p-1 gap-1 h-12">
          <TabsTrigger value="menu" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-0 text-xs sm:text-sm md:text-base transition-all h-full">Menu</TabsTrigger>
          <TabsTrigger value="saved" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-0 text-xs sm:text-sm md:text-base transition-all h-full">Saved</TabsTrigger>
          <TabsTrigger value="recent" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm py-0 text-xs sm:text-sm md:text-base transition-all h-full">Recent</TabsTrigger>
        </TabsList>
        
        <TabsContent value="menu" className="mt-6">
          <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <React.Fragment key={item.label}>
                    <button className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                          <Icon size={20} />
                        </div>
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.count !== undefined && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                            {item.count}
                          </span>
                        )}
                        {item.status && (
                          <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">
                            {item.status}
                          </span>
                        )}
                      </div>
                    </button>
                    {i < menuItems.length - 1 && <Separator />}
                  </React.Fragment>
                );
              })}
            </CardContent>
          </Card>
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
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500" onClick={() => deleteSavedSearch(search.id)}>
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
    </div>
  );
};

export default Profile;
