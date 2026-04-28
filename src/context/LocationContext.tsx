import React, { createContext, useContext, useState, useEffect } from 'react';

interface LocationContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    return localStorage.getItem('selected_city') || 'India';
  });

  useEffect(() => {
    localStorage.setItem('selected_city', selectedCity);
  }, [selectedCity]);

  return (
    <LocationContext.Provider value={{ selectedCity, setSelectedCity }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
