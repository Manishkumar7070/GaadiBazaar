
export interface Brand {
  id: string;
  name: string;
  logo: string;
  type: 'car' | 'bike' | 'both';
}

export const BRANDS: Brand[] = [
  // Popular Cars
  { id: 'maruti-suzuki', name: 'Maruti Suzuki', logo: 'https://logo.clearbit.com/marutisuzuki.com', type: 'car' },
  { id: 'hyundai', name: 'Hyundai', logo: 'https://logo.clearbit.com/hyundai.com', type: 'car' },
  { id: 'tata-motors', name: 'Tata Motors', logo: 'https://logo.clearbit.com/tatamotors.com', type: 'car' },
  { id: 'mahindra', name: 'Mahindra', logo: 'https://logo.clearbit.com/mahindra.com', type: 'car' },
  { id: 'toyota', name: 'Toyota', logo: 'https://logo.clearbit.com/toyota.com', type: 'car' },
  { id: 'honda', name: 'Honda', logo: 'https://logo.clearbit.com/honda.com', type: 'car' },
  { id: 'kia', name: 'Kia', logo: 'https://logo.clearbit.com/kia.com', type: 'car' },
  { id: 'mg', name: 'MG', logo: 'https://logo.clearbit.com/mgmotor.co.in', type: 'car' },
  { id: 'volkswagen', name: 'Volkswagen', logo: 'https://logo.clearbit.com/volkswagen.com', type: 'car' },
  { id: 'skoda', name: 'Skoda', logo: 'https://logo.clearbit.com/skoda-auto.com', type: 'car' },
  
  // Luxury Cars
  { id: 'bmw', name: 'BMW', logo: 'https://logo.clearbit.com/bmw.com', type: 'car' },
  { id: 'mercedes-benz', name: 'Mercedes-Benz', logo: 'https://logo.clearbit.com/mercedes-benz.com', type: 'car' },
  { id: 'audi', name: 'Audi', logo: 'https://logo.clearbit.com/audi.com', type: 'car' },
  { id: 'jaguar', name: 'Jaguar', logo: 'https://logo.clearbit.com/jaguar.com', type: 'car' },
  { id: 'land-rover', name: 'Land Rover', logo: 'https://logo.clearbit.com/landrover.com', type: 'car' },
  { id: 'volvo', name: 'Volvo', logo: 'https://logo.clearbit.com/volvocars.com', type: 'car' },
  
  // Popular Bikes
  { id: 'hero', name: 'Hero', logo: 'https://logo.clearbit.com/heromotocorp.com', type: 'bike' },
  { id: 'royal-enfield', name: 'Royal Enfield', logo: 'https://logo.clearbit.com/royalenfield.com', type: 'bike' },
  { id: 'bajaj', name: 'Bajaj', logo: 'https://logo.clearbit.com/bajajauto.com', type: 'bike' },
  { id: 'tvs', name: 'TVS', logo: 'https://logo.clearbit.com/tvsmotor.com', type: 'bike' },
  { id: 'yamaha', name: 'Yamaha', logo: 'https://logo.clearbit.com/yamaha-motor-india.com', type: 'bike' },
  { id: 'ktm', name: 'KTM', logo: 'https://logo.clearbit.com/ktm.com', type: 'bike' },
];
