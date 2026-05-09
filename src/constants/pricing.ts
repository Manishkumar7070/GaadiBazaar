export const PRICING = {
  free: 0,
  premium: 499,
  featured: 999,
  sponsored: 1999
};

export const BANK_DETAILS = {
  accountName: 'AsOneDealer Solutions Pvt Ltd',
  accountNumber: '123456789012',
  bankName: 'HDFC Bank',
  ifscCode: 'HDFC0001234',
  branch: 'Cyber City, Gurgaon'
};

export const QR_CODE_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=asonedealer@hdfcbank&pn=AsOneDealer&mc=0000&mode=02&purpose=00';

export const PRICING_TIERS = {
  VEHICLES: [
    {
      type: 'free',
      name: 'Standard Listing',
      price: 0,
      duration: '30 Days',
      features: ['Basic Details', '6 Photos', 'No Video Support', 'Standard Search Result'],
      recommended: false
    },
    {
      type: 'premium',
      name: 'Premium Listing',
      price: PRICING.premium,
      duration: '60 Days',
      features: ['Featured Badge', '10 Photos', '1 Video Support', '2x Response Rate'],
      recommended: true
    },
    {
      type: 'featured',
      name: 'Featured Ad',
      price: PRICING.featured,
      duration: '90 Days',
      features: ['Top of Search', 'Unlimited Photos', '3 Video Support', '5x Response Rate'],
      recommended: false
    },
    {
      type: 'sponsored',
      name: 'Sponsored Ad',
      price: PRICING.sponsored,
      duration: 'Until Sold',
      features: ['Main Banner Placement', 'Priority Support', 'Full Video Portfolio', '10x Response Rate'],
      recommended: false
    }
  ]
};
