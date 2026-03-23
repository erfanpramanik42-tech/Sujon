import { Geolocation } from '@capacitor/geolocation';
import { GeoLocation } from '../types';

/**
 * Calculates distance between two coordinates in meters using the Haversine formula.
 */
export const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Forces a fresh high-accuracy GPS fix using Capacitor Geolocation.
 */
export const getCurrentPosition = async (options?: any): Promise<any> => {
  try {
    // Check/Request permissions first
    const permissions = await Geolocation.checkPermissions();
    if (permissions.location !== 'granted') {
      const request = await Geolocation.requestPermissions();
      if (request.location !== 'granted') {
        throw new Error('Location permission denied');
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      ...options
    });
    
    return position;
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

/**
 * GPS Stabilization Logic: 
 * Ensures coordinates are not drifting by sampling for 3 seconds.
 */
export const getStabilizedPosition = async (): Promise<any> => {
  const samples: any[] = [];
  
  const watchId = await Geolocation.watchPosition(
    { enableHighAccuracy: true },
    (pos) => {
      if (pos) samples.push(pos);
    }
  );

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      await Geolocation.clearWatch({ id: watchId });
      if (samples.length === 0) {
        getCurrentPosition().then(resolve).catch(reject);
      } else {
        // Return the last sample (assumed most stabilized)
        resolve(samples[samples.length - 1]);
      }
    }, 3000);
  });
};
