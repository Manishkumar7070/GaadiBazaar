export const PRICING_TIERS = {
  VEHICLES: [
    {
      type: 'free',
      name: 'Free Listing',
      price: 0,
      duration: 'Unlimited',
      features: ['Basic visibility', 'Standard placement', 'Standard image size'],
      recommended: false
    },
    {
      type: 'premium',
      name: 'Premium Listing',
      price: 199,
      duration: '7 Days',
      features: ['Highlighted card', 'Verified badge', 'Better ranking', 'Priority support'],
      recommended: true
    },
    {
      type: 'featured',
      name: 'Featured Listing',
      price: 499,
      duration: '7 Days',
      features: ['Featured badge', 'Purple glow border', 'Top section placement', 'Video preview link'],
      recommended: false
    },
    {
      type: 'sponsored',
      name: 'Sponsored Listing',
      price: 999,
      duration: '7 Days',
      features: ['Homepage priority', 'Gold border & Shimmer', 'Highest search priority', 'WhatsApp lead integration'],
      recommended: false
    }
  ],
  DEALERS: [
    {
      tier: 'none',
      name: 'Standard',
      price: 0,
      features: ['Basic profile', 'Standard listings'],
      recommended: false
    },
    {
      tier: 'dealer_basic',
      name: 'Professional Dealer',
      price: 999,
      duration: 'Monthly',
      features: ['Unlimited Listings', 'Premium Dealer Badge', 'Verification Tick', 'Basic Analytics'],
      recommended: true
    },
    {
      tier: 'dealer_premium',
      name: 'Enterprise Dealer',
      price: 2499,
      duration: 'Monthly',
      features: ['Homepage placement rotation', 'Lead management CRM', 'Dedicated account manager', 'Advance ROI tracking'],
      recommended: false
    }
  ]
};
