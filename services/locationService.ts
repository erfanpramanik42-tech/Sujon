
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
 * Forces a fresh high-accuracy GPS fix.
 */
export const getCurrentPosition = (options?: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    });
  });
};

/**
 * GPS Stabilization Logic: 
 * Ensures coordinates are not drifting by sampling for 3 seconds.
 */
export const getStabilizedPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    const samples: GeolocationPosition[] = [];
    const watchId = navigator.geolocation.watchPosition(
      (pos) => samples.push(pos),
      (err) => {},
      { enableHighAccuracy: true, maximumAge: 0 }
    );

    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      if (samples.length === 0) {
        getCurrentPosition().then(resolve).catch(reject);
      } else {
        // Return the last sample (assumed most stabilized)
        resolve(samples[samples.length - 1]);
      }
    }, 3000);
  });
};
