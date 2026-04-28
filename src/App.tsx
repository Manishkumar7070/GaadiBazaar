import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import VehicleDetail from './pages/VehicleDetail';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Compare from './pages/Compare';
import DealerDetail from './pages/DealerDetail';
import ListVehicle from './pages/ListVehicle';
import CreateShop from './pages/CreateShop';
import EditShop from './pages/EditShop';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import FindDealers from './pages/FindDealers';
import BlogUsedCarMarket from './pages/BlogUsedCarMarket';
import Header from './layouts/Header';
import MobileNav from './layouts/MobileNav';
import ComparisonBar from './layouts/ComparisonBar';

import { HelmetProvider } from 'react-helmet-async';
import { ComparisonProvider } from './context/ComparisonContext';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { SecurityGate } from './components/SecurityGate';

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthProvider>
          <LocationProvider>
            <ComparisonProvider>
              <SecurityGate>
              <Router>
              <div className="min-h-screen flex flex-col pb-20 md:pb-0">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-6">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/vehicle/:id" element={<VehicleDetail />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/dealer/:id" element={<DealerDetail />} />
                    <Route path="/list-vehicle" element={<ListVehicle />} />
                    <Route path="/create-shop" element={<CreateShop />} />
                    <Route path="/edit-shop" element={<EditShop />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/find-dealers" element={<FindDealers />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/blog/used-car-market-india" element={<BlogUsedCarMarket />} />
                  </Routes>
                </main>
                <ComparisonBar />
                <MobileNav />
              </div>
            </Router>
            </SecurityGate>
          </ComparisonProvider>
        </LocationProvider>
      </AuthProvider>
    </ErrorBoundary>
    </HelmetProvider>
  );
}
