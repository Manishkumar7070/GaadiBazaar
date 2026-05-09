
export interface LocationData {
  latitude: number;
  longitude: number;
  cityName?: string;
  address?: string;
}

export enum LocationErrorType {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export class LocationError extends Error {
  type: LocationErrorType;
  constructor(message: string, type: LocationErrorType) {
    super(message);
    this.name = 'LocationError';
    this.type = type;
  }
}

export const locationService = {
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new LocationError('Geolocation is not supported by your browser', LocationErrorType.NOT_SUPPORTED));
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
          let type = LocationErrorType.UNKNOWN;

          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access was denied. Please allow location access in your browser or device settings.';
              type = LocationErrorType.PERMISSION_DENIED;
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable at the moment.';
              type = LocationErrorType.POSITION_UNAVAILABLE;
              break;
            case error.TIMEOUT:
              message = 'The request to get your location timed out.';
              type = LocationErrorType.TIMEOUT;
              break;
          }
          reject(new LocationError(message, type));
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
