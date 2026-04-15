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
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Header from './layouts/Header';
import MobileNav from './layouts/MobileNav';
import ComparisonBar from './layouts/ComparisonBar';

import { ComparisonProvider } from './context/ComparisonContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ComparisonProvider>
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
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </main>
            <ComparisonBar />
            <MobileNav />
          </div>
        </Router>
      </ComparisonProvider>
    </AuthProvider>
  </ErrorBoundary>
  );
}
