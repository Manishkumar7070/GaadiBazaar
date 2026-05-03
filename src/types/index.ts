export type VehicleType = 'car' | 'bike' | 'scooter' | 'commercial';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'cng' | 'hybrid';
export type TransmissionType = 'manual' | 'automatic' | 'semi-automatic';
export type OwnershipType = '1st' | '2nd' | '3rd' | '4th' | '4th+';
export type VehicleStatus = 'active' | 'sold' | 'pending' | 'inactive';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type ListingType = 'free' | 'premium' | 'featured' | 'sponsored';
export type MembershipTier = 'none' | 'dealer_basic' | 'dealer_premium';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'buyer' | 'seller' | 'dealer' | 'admin';
  isProfileComplete: boolean;
  walletBalance?: number;
  membershipTier?: MembershipTier;
  membershipExpiresAt?: string;
  latitude?: number;
  longitude?: number;
  cityName?: string;
  address?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  images: string[];
  mapEmbedUrl?: string;
  verificationStatus: VerificationStatus;
  isPremium?: boolean;
  rating?: number;
  reviewsCount?: number;
  reviews?: Review[];
  createdAt: string;
  updatedAt?: string;
}

export interface PricePoint {
  date: string;
  price: number;
}

export interface Vehicle {
  id: string;
  sellerId: string;
  shopId?: string;
  title: string;
  description: string;
  price: number;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  kilometersDriven: number;
  ownership: OwnershipType;
  city: string;
  state: string;
  images: string[];
  status: VehicleStatus;
  verificationStatus: VerificationStatus;
  listingType: ListingType;
  isFeatured: boolean;
  isVerified: boolean;
  viewsCount: number;
  clicksCount: number;
  leadsCount: number;
  priorityScore: number;
  rating?: number;
  reviewsCount?: number;
  createdAt: string;
  listingExpiresAt?: string;
  registrationNumber?: string;
  mileage?: string;
  color?: string;
  assemblyType?: string;
  engineStartVideo?: string;
  engineSoundVideo?: string;
  walkaroundVideo?: string;
  priceHistory?: PricePoint[];
}

export interface SearchFilters {
  vehicleType?: VehicleType;
  brand?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minKm?: number;
  maxKm?: number;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  ownership?: OwnershipType;
  city?: string;
  state?: string;
  isCertified?: boolean;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  vehicleId: string;
  createdAt: string;
  vehicle?: Vehicle;
}
