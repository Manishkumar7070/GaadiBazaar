import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Loader2, CheckCircle2, Activity, Eye, PlayCircle, Star, Zap, Crown, Check } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { vehicleService } from '@/services/vehicle.service';
import { storageService } from '@/services/storage.service';
import { VehicleType, FuelType, TransmissionType, OwnershipType, Shop, ListingType } from '@/types';
import { shopService } from '@/services/shop.service';
import { INDIAN_STATES, MAJOR_CITIES_BY_STATE } from '@/constants/locations';
import { cn } from '@/lib/utils';
import { PRICING, BANK_DETAILS, QR_CODE_URL, PRICING_TIERS } from '@/constants/pricing';
import { paymentService } from '@/services/payment.service';
import { motion } from 'motion/react';

const ListVehicle = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form');
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'qr_code' | 'stripe'>('stripe');
  const [transactionRef, setTransactionRef] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shop, setShop] = useState<Shop | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState(() => {
    const defaultData = {
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
      listingType: 'free' as ListingType,
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
        engine: '',
        tires: '',
      } as Record<string, string>,
    };

    const saved = localStorage.getItem('vehicle_form_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultData, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved form draft');
      }
    }
    return defaultData;
  });

  // Handle Stripe Success Callback
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const vehicleId = urlParams.get('vehicle_id');
    
    if (sessionId && vehicleId && user) {
      const verify = async () => {
        setLoading(true);
        try {
          const idToken = await (user as any).getIdToken();
          const success = await paymentService.verifyStripeSession(sessionId, vehicleId, idToken);
          if (success) {
            setSuccess(true);
            setTimeout(() => navigate('/profile'), 3000);
          } else {
            alert('Payment verification failed.');
          }
        } catch (error) {
          console.error('Verification error:', error);
        } finally {
          setLoading(false);
        }
      };
      verify();
    }
  }, [user, navigate]);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!user) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        return await storageService.uploadFile(file, 'vehicles', filePath);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    } catch (error: any) {
      console.error('Error uploading images:', error);
      alert(error.message || 'Failed to upload images. Check your connection or Supabase configuration.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFiles(files);
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

      const publicUrl = await storageService.uploadFile(file, 'vehicles', filePath);
      
      setFormData(prev => ({
        ...prev,
        categorizedImages: {
          ...prev.categorizedImages,
          [category]: publicUrl
        }
      }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (limit to 50MB for example)
    if (file.size > 50 * 1024 * 1024) {
      alert('Video file is too large. Please limit to 50MB.');
      return;
    }

    setUploadingFields(prev => ({ ...prev, [field]: true }));
    setUploadProgress(prev => ({ ...prev, [field]: 0 }));

    // Simulate progress as Supabase standard JS upload doesn't provide it natively
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({
        ...prev,
        [field]: Math.min((prev[field] || 0) + Math.random() * 15, 90)
      }));
    }, 400);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${field}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/videos/${fileName}`;

      const publicUrl = await storageService.uploadFile(file, 'vehicles', filePath);
      
      setUploadProgress(prev => ({ ...prev, [field]: 100 }));
      setFormData(prev => ({ ...prev, [field]: publicUrl }));
    } catch (error: any) {
      console.error('Error uploading video:', error);
      alert(error.message || 'Failed to upload video.');
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setUploadingFields(prev => ({ ...prev, [field]: false }));
      }, 500);
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
        ...Object.values(formData.categorizedImages),
        ...formData.images
      ].filter(Boolean);

      const created = await vehicleService.createVehicle({
        ...formData,
        price: Number(formData.price),
        kilometersDriven: Number(formData.kilometersDriven),
        year: Number(formData.year),
        sellerId: user.id,
        shopId: shop?.id,
        images: allImages,
        imageMetadata: formData.categorizedImages,
        listingType: formData.listingType,
        paymentStatus: formData.listingType === 'free' ? 'none' : 'pending',
        status: formData.listingType === 'free' ? 'active' : 'inactive',
        priorityScore: formData.listingType === 'sponsored' ? 100 : 
                       formData.listingType === 'featured' ? 50 : 
                       formData.listingType === 'premium' ? 25 : 0,
        engineStartVideo: formData.engineStartVideo,
        engineSoundVideo: formData.engineSoundVideo,
        walkaroundVideo: formData.walkaroundVideo,
      });

      clearDraft();

      if (formData.listingType === 'free') {
        setSuccess(true);
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        navigate(`/payment?vehicleId=${created.id}&plan=${formData.listingType}`);
      }
    } catch (error: any) {
      console.error('Error listing vehicle:', error);
      const message = error.message || 'Unknown error';
      alert(`Failed to list vehicle: ${message}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!createdVehicleId || !user) return;
    
    if (paymentMethod === 'stripe') {
      await handleStripePayment();
      return;
    }
    
    setLoading(true);
    try {
      await paymentService.createPayment({
        userId: user.id,
        vehicleId: createdVehicleId,
        amount: PRICING[formData.listingType],
        paymentMethod: paymentMethod,
        transactionRef: transactionRef
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 3000);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to record payment. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    if (!createdVehicleId || !user) return;
    setLoading(true);
    try {
      const idToken = await (user as any).getIdToken();
      const { url } = await paymentService.createStripeSession({
        vehicleId: createdVehicleId,
        amount: PRICING[formData.listingType],
        listingType: formData.listingType,
        successUrl: window.location.origin + window.location.pathname,
        cancelUrl: window.location.href,
        idToken
      });
      window.location.href = url;
    } catch (error) {
      console.error('Stripe error:', error);
      alert('Failed to initialize Stripe payment. Please try another method.');
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

  if (currentStep === 'payment' && createdVehicleId) {
    const selectedPlan = PRICING_TIERS.VEHICLES.find(p => p.type === formData.listingType);
    const amountToPay = PRICING[formData.listingType];

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8 pb-20">
        <Helmet>
          <title>Complete Payment | AsOneDealer</title>
        </Helmet>

        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100">
            <Zap size={16} fill="currentColor" />
            Complete Payment for {selectedPlan?.name}
          </div>
          <h1 className="text-3xl font-black text-slate-900">Make Payment of ₹{amountToPay}</h1>
          <p className="text-slate-500">Your listing is saved as "Inactive". It will go live after payment verification.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setPaymentMethod('stripe')}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
              paymentMethod === 'stripe' ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 bg-white hover:bg-slate-50"
            )}
          >
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", paymentMethod === 'stripe' ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>
              <Crown size={24} />
            </div>
            <span className="font-bold text-sm">Cards / UPI</span>
          </button>

          <button
            onClick={() => setPaymentMethod('qr_code')}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
              paymentMethod === 'qr_code' ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 bg-white hover:bg-slate-50"
            )}
          >
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", paymentMethod === 'qr_code' ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>
              <Zap size={24} />
            </div>
            <span className="font-bold text-sm">Scan QR</span>
          </button>

          <button
            onClick={() => setPaymentMethod('bank_transfer')}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
              paymentMethod === 'bank_transfer' ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 bg-white hover:bg-slate-50"
            )}
          >
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", paymentMethod === 'bank_transfer' ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>
              <Activity size={24} />
            </div>
            <span className="font-bold text-sm">Bank</span>
          </button>
        </div>

        <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white">
          <CardContent className="p-8 space-y-8">
            {paymentMethod === 'stripe' ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <Check size={32} />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-black text-slate-900 text-lg">Secure Card Payment</p>
                  <p className="text-sm text-slate-500">Pay securely using Credit/Debit cards or Net Banking via Stripe.</p>
                </div>
              </div>
            ) : paymentMethod === 'qr_code' ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="p-4 bg-white border-4 border-slate-50 rounded-3xl shadow-inner">
                  <img src={QR_CODE_URL} alt="Payment QR" className="w-48 h-48 rounded-xl" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-black text-slate-900">Scan using any UPI App</p>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">GPay, PhonePe, Paytm, etc.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</p>
                    <p className="font-bold text-slate-900">{BANK_DETAILS.accountName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</p>
                      <p className="font-bold text-slate-900">{BANK_DETAILS.accountNumber}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</p>
                      <p className="font-bold text-slate-900">{BANK_DETAILS.ifscCode}</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank & Branch</p>
                    <p className="font-bold text-slate-900">{BANK_DETAILS.bankName}, {BANK_DETAILS.branch}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-slate-100">
              {paymentMethod !== 'stripe' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Transaction ID / Reference Number</label>
                  <Input 
                    placeholder="Enter the 12-digit transaction ID"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 italic">Enter the reference number after completing the transfer.</p>
                </div>
              )}

              <Button 
                onClick={handlePaymentSubmit}
                disabled={loading || (paymentMethod !== 'stripe' && !transactionRef)}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/91 text-white font-black text-lg shadow-xl shadow-primary/20"
              >
                {loading ? <Loader2 className="animate-spin" /> : 
                  paymentMethod === 'stripe' ? 'Pay Securely with Stripe' : 'Confirm Payment & Submit'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-slate-400 px-8">
          By clicking confirm, you agree that you have made the payment. Manual verification may take up to 24 hours. Your listing will be activated once payment is confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6 pb-20">
      <Helmet>
        <title>Sell Your Car | List Your Vehicle at AsOneDealer</title>
        <meta name="description" content="Sell your used car quickly with AsOneDealer. Reach thousands of verified buyers, upload videos, and get the best value for your vehicle." />
        <meta name="keywords" content="sell car online, list vehicle, sell used car India, car selling marketplace" />
      </Helmet>

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

        <Card className="rounded-3xl border-none shadow-sm overflow-hidden border-2 border-primary/5">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <div className="bg-primary text-white p-1 rounded-lg">
                <PlayCircle size={18} />
              </div>
              Vehicle Videos
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium italic">
              Ads with videos get 4x more leads in Bihar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  id: 'engineStartVideo', 
                  label: 'Engine Cold Start', 
                  desc: 'Record a 5-10s clip of starting the vehicle.', 
                  icon: Zap,
                  tip: 'Do this when engine is cold for best trust score.' 
                },
                { 
                  id: 'engineSoundVideo', 
                  label: 'Resting & Rev Sound', 
                  desc: 'Record the engine idling and slight acceleration.', 
                  icon: Activity,
                  tip: 'Buyers check for abnormal sounds here.' 
                },
                { 
                  id: 'walkaroundVideo', 
                  label: 'Exterior Walkaround', 
                  desc: 'A slow 15-20s video around the vehicle.', 
                  icon: Eye,
                  tip: 'Highlight any scratches for transparency.' 
                },
              ].map((video) => {
                const VideoIcon = video.icon;
                const isUploading = uploadingFields[video.id];
                const progress = uploadProgress[video.id] || 0;
                
                return (
                  <div key={video.id} className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{video.label}</span>
                        {formData[video.id] && <CheckCircle2 className="text-green-500" size={16} />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">{video.desc}</p>
                    </div>
                    
                    <div className={cn(
                      "aspect-[3/4] sm:aspect-video rounded-2xl border-2 border-dashed overflow-hidden relative group transition-all",
                      formData[video.id] ? "border-green-100" : "border-slate-200 hover:border-primary/40 bg-slate-50"
                    )}>
                      {formData[video.id] ? (
                        <div className="w-full h-full relative">
                          <video 
                            src={formData[video.id]} 
                            className="w-full h-full object-cover" 
                            muted 
                            loop 
                            onClick={(e) => (e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause())}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, [video.id]: '' }));
                                setUploadProgress(prev => ({ ...prev, [video.id]: 0 }));
                              }}
                              className="bg-white text-red-600 rounded-full px-5 py-2.5 text-xs font-black shadow-2xl hover:bg-slate-50"
                            >
                              Discard & Re-take
                            </button>
                          </div>
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm">
                            <Activity size={12} className="animate-pulse" /> Live Preview
                          </div>
                        </div>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/50 transition-colors px-6 text-center">
                          <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 mb-3 group-hover:text-primary transition-all group-hover:scale-110">
                            <VideoIcon size={24} />
                          </div>
                          <span className="text-xs font-black text-slate-400 group-hover:text-primary">Click to Upload Video</span>
                          <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">MP4, MOV up to 50MB</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="video/*"
                            onChange={(e) => handleVideoUpload(e, video.id)}
                            disabled={isUploading}
                          />
                        </label>
                      )}

                      {/* Progress Overlay */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4 z-40">
                          <div className="w-full space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary">
                              <span>Uploading Video</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-tight animate-pulse">
                            Please stay on this page...
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                      <p className="text-[10px] font-medium text-slate-600 italic">
                        <span className="font-black text-slate-900 not-italic uppercase mr-1">Pro Tip:</span>
                        {video.tip}
                      </p>
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
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={!formData.state}
                  className={cn(
                    "w-full h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50",
                    errors.city && "border-red-500"
                  )}
                >
                  <option value="">Select City</option>
                  {formData.state && MAJOR_CITIES_BY_STATE[formData.state]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.city}</p>}
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-sm font-semibold text-slate-700">Key Vehicle Photos</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { id: 'front', label: 'Front View' },
                  { id: 'back', label: 'Back View' },
                  { id: 'left', label: 'Left Side' },
                  { id: 'right', label: 'Right Side' },
                  { id: 'interior', label: 'Interior' },
                  { id: 'exterior', label: 'Exterior' },
                  { id: 'engine', label: 'Engine Bay' },
                  { id: 'tires', label: 'Tires/Wheels' },
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
                
                <div 
                  className={cn(
                    "relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group",
                    isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-slate-200 hover:border-primary/40 bg-slate-50",
                    uploading && "opacity-50 cursor-not-allowed"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleImageAdd}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    disabled={uploading}
                  />
                  
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition-transform">
                    {uploading ? <Loader2 size={32} className="animate-spin text-primary" /> : <Upload size={32} />}
                  </div>
                  
                  <div className="text-center space-y-1">
                    <p className="text-base font-bold text-slate-900">
                      {uploading ? 'Uploading your images...' : 'Drag & drop images here'}
                    </p>
                    <p className="text-sm text-slate-500">
                      or click to browse from your device
                    </p>
                  </div>
                  
                  <div className="mt-4 flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>JPEG, PNG</span>
                    <span>•</span>
                    <span>Up to 10MB each</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6">
                  {formData.images.map((img, i) => (
                    <motion.div 
                      key={img}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="aspect-square rounded-2xl overflow-hidden border border-slate-100 relative group shadow-sm bg-white"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
                          }}
                          className="bg-red-500 text-white rounded-full p-2 shadow-xl hover:bg-red-600 transition-colors"
                          title="Remove Image"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {uploading && (
                    <div className="aspect-square rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-primary/40" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-primary" size={20} />
              Choose Selling Plan
            </CardTitle>
            <CardDescription>Boost your listing to sell up to 10x faster</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRICING_TIERS.VEHICLES.map((plan) => {
                const isSelected = formData.listingType === plan.type;
                return (
                  <label 
                    key={plan.type}
                    className={cn(
                      "relative flex flex-col p-5 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md",
                      isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-slate-100 bg-white"
                    )}
                  >
                    <input 
                      type="radio" 
                      name="listingType" 
                      className="hidden" 
                      checked={isSelected}
                      onChange={() => setFormData(prev => ({ ...prev, listingType: plan.type as ListingType }))}
                    />
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <p className={cn("text-xs font-bold uppercase tracking-wider", isSelected ? "text-primary" : "text-slate-400")}>
                          {plan.name}
                        </p>
                        <p className="text-xl font-black text-slate-900">
                           {plan.price === 0 ? 'FREE' : `₹${plan.price}`}
                           <span className="text-xs text-slate-400 font-medium ml-1">/ {plan.duration}</span>
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2 mb-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-[11px] text-slate-600 flex items-center gap-2">
                           <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-primary" : "bg-slate-300")} />
                           {f}
                        </li>
                      ))}
                    </ul>
                    {plan.recommended && (
                      <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                        Recommended
                      </div>
                    )}
                  </label>
                );
              })}
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
