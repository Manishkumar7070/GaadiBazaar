import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Loader2, CheckCircle2, Activity, Eye, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { vehicleService } from '@/services/vehicle.service';
import { supabase } from '@/lib/supabase';
import { VehicleType, FuelType, TransmissionType, OwnershipType, Shop } from '@/types';
import { shopService } from '@/services/shop.service';
import { INDIAN_STATES, MAJOR_CITIES_BY_STATE } from '@/constants/locations';
import { cn } from '@/lib/utils';

const ListVehicle = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shop, setShop] = useState<Shop | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('vehicle_form_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved form draft');
      }
    }
    return {
      title: '',
      description: '',
      price: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      vehicleType: 'car' as VehicleType,
      fuelType: 'petrol' as FuelType,
      transmission: 'manual' as TransmissionType,
      kilometersDriven: '',
      ownership: '1st' as OwnershipType,
      city: '',
      state: '',
      registrationNumber: '',
      mileage: '',
      color: '',
      assemblyType: 'Local',
      images: [] as string[],
      engineStartVideo: '',
      engineSoundVideo: '',
      walkaroundVideo: '',
      categorizedImages: {
        front: '',
        back: '',
        left: '',
        right: '',
        interior: '',
        exterior: '',
      } as Record<string, string>,
    };
  });

  // Save draft to localStorage whenever formData changes
  React.useEffect(() => {
    localStorage.setItem('vehicle_form_draft', JSON.stringify(formData));
  }, [formData]);

  const clearDraft = () => {
    localStorage.removeItem('vehicle_form_draft');
  };

  React.useEffect(() => {
    if (!user) {
      navigate('/login?reason=list_vehicle&redirect=/list-vehicle');
      return;
    }

    const loadShop = async () => {
      if (user.role === 'dealer' || user.role === 'admin') {
        const userShop = await shopService.fetchUserShop(user.id);
        setShop(userShop);
        if (userShop) {
          setFormData(prev => ({
            ...prev,
            city: userShop.city,
            state: userShop.state
          }));
        }
      }
    };
    loadShop();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Reset city if state changes
    if (name === 'state') {
      setFormData(prev => ({ ...prev, city: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    
    const requiredPhotos = ['front', 'back', 'left', 'right', 'interior', 'exterior'];
    const missingPhotos = requiredPhotos.filter(cat => !formData.categorizedImages[cat]);
    if (missingPhotos.length > 0) {
      newErrors.images = `Missing photos: ${missingPhotos.join(', ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageAdd = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicles')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vehicles')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please make sure you are logged in and try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCategorizedFileChange = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${category}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({
        ...prev,
        categorizedImages: {
          ...prev.categorizedImages,
          [category]: publicUrl
        }
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingFields(prev => ({ ...prev, [field]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${field}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, [field]: publicUrl }));
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video.');
    } finally {
      setUploadingFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      alert(`Please fix form errors: ${errors[firstErrorField] || 'Required fields missing'}`);
      return;
    }

    setLoading(true);
    try {
      const allImages = [
        formData.categorizedImages.front,
        formData.categorizedImages.back,
        formData.categorizedImages.left,
        formData.categorizedImages.right,
        formData.categorizedImages.interior,
        formData.categorizedImages.exterior,
        ...formData.images
      ].filter(Boolean);

      await vehicleService.createVehicle({
        ...formData,
        price: Number(formData.price),
        kilometersDriven: Number(formData.kilometersDriven),
        year: Number(formData.year),
        sellerId: user.id,
        shopId: shop?.id,
        images: allImages,
        engineStartVideo: formData.engineStartVideo,
        engineSoundVideo: formData.engineSoundVideo,
        walkaroundVideo: formData.walkaroundVideo,
      });
      clearDraft();
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (error) {
      console.error('Error listing vehicle:', error);
      alert('Failed to list vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center p-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-2xl font-bold">Vehicle Listed Successfully!</h1>
        <p className="text-slate-500">Your vehicle is now live on AsOneDealer. Redirecting to your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-bold">List Your Vehicle</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Tell us about your vehicle</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Vehicle Title</label>
              <Input 
                name="title" 
                placeholder="e.g. 2020 Honda City VX" 
                required 
                value={formData.title}
                onChange={handleChange}
                className={cn("rounded-xl", errors.title && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.title && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea 
                name="description" 
                placeholder="Describe your vehicle's condition, features, etc." 
                required 
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full flex min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Price (₹)</label>
                <Input 
                  name="price" 
                  type="number" 
                  min="0"
                  placeholder="e.g. 850000" 
                  required 
                  value={formData.price}
                  onChange={handleChange}
                  className={cn("rounded-xl", errors.price && "border-red-500")}
                />
                {errors.price && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Vehicle Type</label>
                <select 
                  name="vehicleType" 
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="scooter">Scooter</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Detailed technical details</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Brand</label>
                <Input 
                  name="brand" 
                  placeholder="e.g. Honda" 
                  required 
                  value={formData.brand}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Model</label>
                <Input 
                  name="model" 
                  placeholder="e.g. City" 
                  required 
                  value={formData.model}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Year</label>
                <Input 
                  name="year" 
                  type="number" 
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  placeholder="e.g. 2020" 
                  required 
                  value={formData.year}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Fuel Type</label>
                <select 
                  name="fuelType" 
                  value={formData.fuelType}
                  onChange={handleChange}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="cng">CNG</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Transmission</label>
                <select 
                  name="transmission" 
                  value={formData.transmission}
                  onChange={handleChange}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                  <option value="semi-automatic">Semi-Automatic</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Kilometers Driven</label>
                <Input 
                  name="kilometersDriven" 
                  type="number" 
                  min="0"
                  placeholder="e.g. 45000" 
                  required 
                  value={formData.kilometersDriven}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Ownership</label>
                <select 
                  name="ownership" 
                  value={formData.ownership}
                  onChange={handleChange}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="1st">1st Owner</option>
                  <option value="2nd">2nd Owner</option>
                  <option value="3rd">3rd Owner</option>
                  <option value="4th">4th Owner</option>
                  <option value="4th+">4th+ Owner</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Registration Number (Optional)</label>
                <Input 
                  name="registrationNumber" 
                  placeholder="e.g. MP04 AB 1234" 
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Mileage (kmpl/range)</label>
                <Input 
                  name="mileage" 
                  placeholder="e.g. 18 kmpl" 
                  value={formData.mileage}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Color</label>
                <Input 
                  name="color" 
                  placeholder="e.g. White, Black, Red" 
                  value={formData.color}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Assembly Type</label>
                <select 
                  name="assemblyType" 
                  value={formData.assemblyType}
                  onChange={handleChange}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Local">Local</option>
                  <option value="Imported">Imported</option>
                  <option value="CKD">CKD (Completely Knocked Down)</option>
                  <option value="CBU">CBU (Completely Built Unit)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Upload className="text-primary" size={20} />
              Video & Engine Sounds
            </CardTitle>
            <CardDescription>Upload short videos to give buyers more confidence</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { id: 'engineStartVideo', label: 'Engine Cold Start', desc: 'Buyers love to hear the ignition', icon: PlayCircle },
                { id: 'engineSoundVideo', label: 'Engine Sound', desc: 'Rev the engine slightly', icon: Activity },
                { id: 'walkaroundVideo', label: 'Walkaround', desc: 'A quick 360° video tour', icon: Eye },
              ].map((video) => {
                const VideoIcon = video.icon;
                return (
                  <div key={video.id} className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700">{video.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{video.desc}</span>
                    </div>
                    
                    <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden relative group bg-slate-50 transition-all hover:border-primary/50">
                      {formData[video.id] ? (
                        <div className="w-full h-full relative">
                          <video 
                            src={formData[video.id]} 
                            className="w-full h-full object-cover" 
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, [video.id]: '' }))}
                              className="bg-white text-slate-900 rounded-full px-4 py-2 text-xs font-bold hover:bg-slate-100 transition-colors shadow-lg"
                            >
                              Change Video
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 mb-2 group-hover:text-primary transition-colors">
                            <VideoIcon size={20} />
                          </div>
                          <span className="text-xs font-bold text-slate-400">Upload Video</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="video/*"
                            onChange={(e) => handleVideoUpload(e, video.id as any)}
                          />
                        </label>
                      )}
                      {uploadingFields[video.id] && !formData[video.id] && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-primary animate-[upload_1.5s_infinite_linear]" />
                          </div>
                          <span className="text-[10px] font-bold text-primary animate-pulse uppercase tracking-widest">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle>Location & Images</CardTitle>
            <CardDescription>Where is the vehicle located?</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">State</label>
                <select 
                  name="state" 
                  value={formData.state}
                  onChange={handleChange}
                  required
                  className={cn(
                    "w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary",
                    errors.state && "border-red-500"
                  )}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.state}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">City</label>
                {formData.state && MAJOR_CITIES_BY_STATE[formData.state] ? (
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className={cn(
                      "w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary",
                      errors.city && "border-red-500"
                    )}
                  >
                    <option value="">Select City</option>
                    {MAJOR_CITIES_BY_STATE[formData.state].map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <Input 
                    name="city" 
                    placeholder={formData.state ? "e.g. Mumbai" : "Select state first"} 
                    required 
                    disabled={!formData.state}
                    value={formData.city}
                    onChange={handleChange}
                    className={cn("rounded-xl", errors.city && "border-red-500")}
                  />
                )}
                {errors.city && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.city}</p>}
                {formData.city === 'Other' && (
                  <Input 
                    name="otherCity"
                    placeholder="Enter city name"
                    required
                    className="mt-2 rounded-xl"
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-sm font-semibold text-slate-700">Required Photos</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { id: 'front', label: 'Front View' },
                  { id: 'back', label: 'Back View' },
                  { id: 'left', label: 'Left Side' },
                  { id: 'right', label: 'Right Side' },
                  { id: 'interior', label: 'Interior' },
                  { id: 'exterior', label: 'Exterior' },
                ].map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">{cat.label}</p>
                    <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden relative group">
                      {formData.categorizedImages[cat.id] ? (
                        <>
                          <img 
                            src={formData.categorizedImages[cat.id]} 
                            alt={cat.label} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              categorizedImages: { ...prev.categorizedImages, [cat.id]: '' }
                            }))}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Upload className="rotate-45" size={12} />
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                          <Upload size={20} className="text-slate-400" />
                          <span className="text-[10px] mt-1 text-slate-400">Upload</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleCategorizedFileChange(e, cat.id)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700">Additional Images (Optional)</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="grid grid-cols-3 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 relative group">
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Upload className="rotate-45" size={12} />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={handleImageAdd}
                    disabled={uploading}
                    className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <Upload size={24} />
                    )}
                    <span className="text-xs mt-2">{uploading ? 'Uploading...' : 'Add More'}</span>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={20} />
                Listing Vehicle...
              </>
            ) : (
              'List Vehicle Now'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ListVehicle;
