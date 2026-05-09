
import { ShopSchema } from './schemas';
import { z } from 'zod';

export const validatePincode = (pincode: string) => {
  return /^[1-9][0-9]{5}$/.test(pincode);
};

export const validatePhone = (phone: string) => {
  // Simple check for +91 or 10 digits
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  return /^[6789]\d{9}$/.test(cleanPhone.slice(-10));
};

export type ShopErrors = Partial<Record<keyof z.infer<typeof ShopSchema>, string>>;

export const validateShop = (data: any): ShopErrors => {
  try {
    ShopSchema.parse(data);
    return {};
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ShopErrors = {};
      error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as keyof z.infer<typeof ShopSchema>] = err.message;
        }
      });
      return errors;
    }
    return { name: 'Unknown error' };
  }
};
