import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import VehicleDetail from './pages/VehicleDetail';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Compare from './pages/Compare';
import DealerDetail from './pages/DealerDetail';
import Header from './components/shared/Header';
import MobileNav from './components/shared/MobileNav';
import ComparisonBar from './components/shared/ComparisonBar';

import { ComparisonProvider } from './context/ComparisonContext';

export default function App() {
  return (
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
            </Routes>
          </main>
          <ComparisonBar />
          <MobileNav />
        </div>
      </Router>
    </ComparisonProvider>
  );
}
