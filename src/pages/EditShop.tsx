import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Store, Upload, Loader2, CheckCircle2, MapPin, Phone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { shopService } from '@/services/shop.service';
import { supabase } from '@/lib/supabase';
import { Shop } from '@/types';
import { validateShop, ShopErrors } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { INDIAN_STATES, MAJOR_CITIES_BY_STATE } from '@/constants/locations';

const EditShop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<ShopErrors>({});
  const [shop, setShop] = useState<Shop | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    images: [] as string[],
    mapEmbedUrl: '',
  });

  useEffect(() => {
    const loadShop = async () => {
      if (!user) return;
      try {
        const userShop = await shopService.fetchUserShop(user.id);
        if (userShop) {
          setShop(userShop);
          setFormData({
            name: userShop.name,
            description: userShop.description,
            address: userShop.address,
            city: userShop.city,
            state: userShop.state,
            pincode: userShop.pincode || '',
            phone: userShop.phone,
            images: userShop.images || [],
            mapEmbedUrl: userShop.mapEmbedUrl || '',
          });
        } else {
          navigate('/profile');
        }
      } catch (error) {
        console.error('Error loading shop:', error);
        navigate('/profile');
      } finally {
        setInitialLoading(false);
      }
    };
    loadShop();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ShopErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Reset city if state changes
    if (name === 'state') {
      setFormData(prev => ({ ...prev, city: '' }));
    }
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
          .from('shops')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('shops')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !shop) return;

    const validationErrors = validateShop(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.keys(validationErrors)[0];
      const element = document.getElementsByName(firstError)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      await shopService.updateShop(shop.id, formData);
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (error) {
      console.error('Error updating shop:', error);
      alert('Failed to update shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center p-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-2xl font-bold">Shop Updated Successfully!</h1>
        <p className="text-slate-500">Your showroom details have been updated. Redirecting to your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-bold">Edit Your Showroom</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Store className="text-primary" size={20} />
              Shop Details
            </CardTitle>
            <CardDescription>Update your showroom information</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Showroom Name</label>
              <Input 
                name="name" 
                placeholder="e.g. AsOne Motors" 
                required 
                value={formData.name}
                onChange={handleChange}
                className={cn("rounded-xl", errors.name && "border-red-500")}
              />
              {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea 
                name="description" 
                placeholder="Tell customers about your showroom..." 
                required 
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className={cn(
                  "w-full flex min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.description && "border-red-500"
                )}
              />
              {errors.description && <p className="text-xs text-red-500 font-medium">{errors.description}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Contact Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input 
                  name="phone" 
                  placeholder="e.g. +91 9876543210" 
                  required 
                  value={formData.phone}
                  onChange={handleChange}
                  className={cn("rounded-xl pl-10", errors.phone && "border-red-500")}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 font-medium">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">3D Map Embed Link (Google Maps)</label>
              <Input 
                name="mapEmbedUrl" 
                placeholder="e.g. https://www.google.com/maps/embed?pb=..." 
                value={formData.mapEmbedUrl}
                onChange={handleChange}
                className="rounded-xl"
              />
              <p className="text-[10px] text-slate-500">Go to Google Maps → Share → Embed a map → Copy HTML src URL</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="text-primary" size={20} />
              Location
            </CardTitle>
            <CardDescription>Where is your showroom located?</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Address</label>
              <Input 
                name="address" 
                placeholder="Street, Area, Landmark" 
                required 
                value={formData.address}
                onChange={handleChange}
                className={cn("rounded-xl", errors.address && "border-red-500")}
              />
              {errors.address && <p className="text-xs text-red-500 font-medium">{errors.address}</p>}
            </div>
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
                {errors.state && <p className="text-xs text-red-500 font-medium">{errors.state}</p>}
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
                {errors.city && <p className="text-xs text-red-500 font-medium">{errors.city}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Pincode</label>
                <Input 
                  name="pincode" 
                  placeholder="e.g. 462011" 
                  required 
                  value={formData.pincode}
                  onChange={handleChange}
                  className={cn("rounded-xl", errors.pincode && "border-red-500")}
                />
                {errors.pincode && <p className="text-xs text-red-500 font-medium">{errors.pincode}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Upload className="text-primary" size={20} />
              Showroom Photos
            </CardTitle>
            <CardDescription>Upload high-quality photos of your shop</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
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
                <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-slate-100 relative group">
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={handleImageAdd}
                disabled={uploading}
                className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <Upload size={24} />
                )}
                <span className="text-xs mt-2">{uploading ? 'Uploading...' : 'Add Photo'}</span>
              </button>
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
                Updating Showroom...
              </>
            ) : (
              'Update Showroom'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditShop;
