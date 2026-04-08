export type VehicleType = 'car' | 'bike' | 'scooter' | 'commercial';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'cng' | 'hybrid';
export type TransmissionType = 'manual' | 'automatic' | 'semi-automatic';
export type OwnershipType = '1st' | '2nd' | '3rd' | '4th' | '4th+';
export type VehicleStatus = 'active' | 'sold' | 'pending' | 'inactive';

export interface User {
  id: string;
  phone: string;
  fullName: string;
  role: 'buyer' | 'seller' | 'dealer' | 'admin';
  isVerified: boolean;
  profileImage?: string;
  languagePreference: string;
}

export interface Dealer {
  id: string;
  userId: string;
  shopName: string;
  description: string;
  shopImages: string[];
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
}

export interface Vehicle {
  id: string;
  sellerId: string;
  dealerId?: string;
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
  interiorImages?: string[];
  exteriorImages?: string[];
  threeSixtyImages?: string[];
  status: VehicleStatus;
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
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  year?: number;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}
