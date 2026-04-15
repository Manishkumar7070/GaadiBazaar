import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Store, Upload, Loader2, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { shopService } from '@/services/shop.service';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CreateShop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('shop_form_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved shop draft');
      }
    }
    return {
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      images: [] as string[],
    };
  });

  // Save draft to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem('shop_form_draft', JSON.stringify(formData));
  }, [formData]);

  const clearDraft = () => {
    localStorage.removeItem('shop_form_draft');
  };

  useEffect(() => {
    if (user && user.role !== 'dealer' && user.role !== 'admin') {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        const filename = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `shops/${user.id}/${filename}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await shopService.createShop({
        ...formData,
        ownerId: user.id,
      });
      clearDraft();
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 2000);
    } catch (error) {
      console.error('Error creating shop:', error);
      alert('Failed to create shop. Please try again.');
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
        <h1 className="text-2xl font-bold">Shop Listed Successfully!</h1>
        <p className="text-slate-500">Your showroom is now pending verification. Redirecting to your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ChevronLeft size={24} />
        </Button>
        <h1 className="text-2xl font-bold">Register Your Showroom</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Store className="text-primary" size={20} />
              Shop Details
            </CardTitle>
            <CardDescription>Enter your showroom information</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Showroom Name</label>
              <Input 
                name="name" 
                placeholder="e.g. Bhopal Motors" 
                required 
                value={formData.name}
                onChange={handleChange}
                className="rounded-xl"
              />
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
                className="w-full flex min-h-[80px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
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
                  className="rounded-xl pl-10"
                />
              </div>
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
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">City</label>
                <Input 
                  name="city" 
                  placeholder="e.g. Bhopal" 
                  required 
                  value={formData.city}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">State</label>
                <Input 
                  name="state" 
                  placeholder="e.g. Madhya Pradesh" 
                  required 
                  value={formData.state}
                  onChange={handleChange}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Pincode</label>
                <Input 
                  name="pincode" 
                  placeholder="e.g. 462011" 
                  required 
                  value={formData.pincode}
                  onChange={handleChange}
                  className="rounded-xl"
                />
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
                Registering Showroom...
              </>
            ) : (
              'Register Showroom'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateShop;
