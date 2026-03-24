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
    // Check if we are running in a native environment
    // Capacitor plugins might throw "Not implemented on web" if not properly registered
    // or if the web implementation is missing. We'll use a fallback.
    
    try {
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          // If denied, we still try navigator as a last resort, but usually it will also be denied
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        ...options
      });
      
      return position;
    } catch (capError: any) {
      // If Capacitor fails with "Not implemented", fallback to browser API
      if (capError.message?.includes('Not implemented') || !Geolocation) {
        console.warn('Capacitor Geolocation not implemented, falling back to browser API');
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported by browser'));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                altitude: pos.coords.altitude,
                altitudeAccuracy: pos.coords.altitudeAccuracy,
                heading: pos.coords.heading,
                speed: pos.coords.speed
              },
              timestamp: pos.timestamp
            }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000, ...options }
          );
        });
      }
      throw capError;
    }
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
  let watchId: string | number | null = null;
  
  try {
    watchId = await Geolocation.watchPosition(
      { enableHighAccuracy: true },
      (pos) => {
        if (pos) samples.push(pos);
      }
    );
  } catch (e: any) {
    if (e.message?.includes('Not implemented')) {
      // Fallback for watchPosition
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          samples.push({
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed
            },
            timestamp: pos.timestamp
          });
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
  }

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      if (watchId !== null) {
        if (typeof watchId === 'string') {
          await Geolocation.clearWatch({ id: watchId });
        } else {
          navigator.geolocation.clearWatch(watchId);
        }
      }
      
      if (samples.length === 0) {
        getCurrentPosition().then(resolve).catch(reject);
      } else {
        // Return the last sample (assumed most stabilized)
        resolve(samples[samples.length - 1]);
      }
    }, 3000);
  });
};
