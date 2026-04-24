
export const validatePincode = (pincode: string) => {
  return /^[1-9][0-9]{5}$/.test(pincode);
};

export const validatePhone = (phone: string) => {
  // Simple check for +91 or 10 digits
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  return /^[6789]\d{9}$/.test(cleanPhone.slice(-10));
};

export interface ShopErrors {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}

export const validateShop = (data: any): ShopErrors => {
  const errors: ShopErrors = {};

  if (data.name.length < 3) errors.name = 'Showroom name must be at least 3 characters';
  if (data.description.length < 20) errors.description = 'Description must be at least 20 characters';
  if (data.address.length < 10) errors.address = 'Full address must be at least 10 characters';
  if (!/^[a-zA-Z\s]+$/.test(data.city)) errors.city = 'City should only contain letters';
  if (data.state.length < 2) errors.state = 'State is required';
  if (!validatePincode(data.pincode)) errors.pincode = 'Pincode must be exactly 6 digits';
  if (!validatePhone(data.phone)) errors.phone = 'Enter a valid 10-digit mobile number';

  return errors;
};
