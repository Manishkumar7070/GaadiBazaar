import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/layouts/Header';
import Footer from '@/layouts/Footer';
import MobileNav from '@/layouts/MobileNav';
import ComparisonBar from '@/layouts/ComparisonBar';

import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import SecurityGate from '@/components/SecurityGate';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance and smaller initial bundle size
const Home = lazy(() => import('@/pages/Home'));
const VehicleDetail = lazy(() => import('@/pages/VehicleDetail'));
const Search = lazy(() => import('@/pages/Search'));
const Profile = lazy(() => import('@/pages/Profile'));
const Compare = lazy(() => import('@/pages/Compare'));
const DealerDetail = lazy(() => import('@/pages/DealerDetail'));
const SellerDetail = lazy(() => import('@/pages/SellerDetail'));
const ListVehicle = lazy(() => import('@/pages/ListVehicle'));
const CreateShop = lazy(() => import('@/pages/CreateShop'));
const EditShop = lazy(() => import('@/pages/EditShop'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
import LoginPage from '@/pages/Login';
import FindDealers from '@/pages/FindDealers';
const Brands = lazy(() => import('@/pages/Brands'));
const BlogUsedCarMarket = lazy(() => import('@/pages/BlogUsedCarMarket'));
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const Payment = lazy(() => import('@/pages/Payment'));
const SmartBuyerHub = lazy(() => import('@/pages/SmartBuyerHub'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="animate-spin text-primary" size={40} />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LocationProvider>
          <SecurityGate>
            <Router>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/vehicle/:id" element={<VehicleDetail />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/brands" element={<Brands />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/compare" element={<Compare />} />
                      <Route path="/dealer/:id" element={<DealerDetail />} />
                      <Route path="/seller/:id" element={<SellerDetail />} />
                      <Route path="/list-vehicle" element={<ListVehicle />} />
                      <Route path="/payment" element={<Payment />} />
                      <Route path="/seller-dashboard" element={<SellerDashboard />} />
                      <Route path="/create-shop" element={<CreateShop />} />
                      <Route path="/edit-shop" element={<EditShop />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/find-dealers" element={<FindDealers />} />
                      <Route path="/buyer-hub" element={<SmartBuyerHub />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/blog/used-car-market-india" element={<BlogUsedCarMarket />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <ComparisonBar />
                <MobileNav />
              </div>
            </Router>
          </SecurityGate>
        </LocationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
