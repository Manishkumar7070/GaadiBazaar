
export interface LocationData {
  latitude: number;
  longitude: number;
  cityName?: string;
  address?: string;
}

export const locationService = {
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let message = 'An unknown error occurred while getting your location.';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = 'User denied the request for Geolocation. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              message = 'The request to get user location timed out.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  },

  async reverseGeocode(lat: number, lon: number): Promise<{ cityName?: string; address?: string }> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      
      const cityName = data.address.city || data.address.town || data.address.village || data.address.state_district || 'Unknown City';
      const address = data.display_name;
      
      return { cityName, address };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { cityName: 'Unknown City' };
    }
  }
};
