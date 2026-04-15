export type VehicleType = 'car' | 'bike' | 'scooter' | 'commercial';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'cng' | 'hybrid';
export type TransmissionType = 'manual' | 'automatic' | 'semi-automatic';
export type OwnershipType = '1st' | '2nd' | '3rd' | '4th' | '4th+';
export type VehicleStatus = 'active' | 'sold' | 'pending' | 'inactive';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'buyer' | 'seller' | 'dealer' | 'admin';
  isProfileComplete: boolean;
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
  verificationStatus: VerificationStatus;
  rating?: number;
  reviewCount?: number;
  reviews?: Review[];
  createdAt: string;
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
  isFeatured: boolean;
  isVerified: boolean;
  viewsCount: number;
  createdAt: string;
  registrationNumber?: string;
  mileage?: string;
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
