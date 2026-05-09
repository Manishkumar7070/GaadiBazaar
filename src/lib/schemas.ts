import { z } from 'zod';

export const VehicleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.number().positive('Price must be greater than 0'),
  vehicle_type: z.enum(['car', 'bike', 'truck', 'other']),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg']),
  transmission: z.enum(['manual', 'automatic']),
  kilometers_driven: z.number().nonnegative(),
  ownership: z.enum(['1st', '2nd', '3rd', '4th', '4th+']),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  registration_number: z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i, 'Invalid registration number format'),
  mileage: z.string().optional(),
  color: z.string().optional(),
  vin: z.string().length(17, 'VIN must be 17 characters').optional().or(z.literal('')),
  images: z.array(z.string()).min(1, 'At least one image is required'),
});

export const ShopSchema = z.object({
  name: z.string().min(3, 'Showroom name must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  address: z.string().min(10, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Invalid Pincode (6 digits)'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid Phone Number (10 digits)'),
  email: z.string().email('Invalid email address'),
});

export type VehicleInput = z.infer<typeof VehicleSchema>;
export type ShopInput = z.infer<typeof ShopSchema>;
