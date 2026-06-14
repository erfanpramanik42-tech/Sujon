import { GeoLocation } from '../types';
import { calculateDistance as haversineDistance } from './locationService';

/**
 * Fetches accurate road distance using Google Distance Matrix API via server proxy.
 * Falls back to Haversine formula if API fails.
 */
export const getRoadDistance = async (origin: GeoLocation, destination: GeoLocation): Promise<number> => {
  try {
    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;
    const response = await fetch(`/api/distance-matrix?origins=${encodeURIComponent(originStr)}&destinations=${encodeURIComponent(destStr)}`);
    const data = await response.json();

    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      return data.rows[0].elements[0].distance.value; // Distance in meters
    }
  } catch (error) {
    console.error('Distance Matrix failed, using Haversine:', error);
  }
  return haversineDistance(origin, destination);
};

/**
 * Fetches road distances for multiple destinations in a single call.
 * Limits usually apply (typically 25 destinations per call).
 */
export const getBatchRoadDistances = async (origin: GeoLocation, destinations: GeoLocation[]): Promise<number[]> => {
  if (destinations.length === 0) return [];
  
  try {
    const originStr = `${origin.lat},${origin.lng}`;
    // Limit to first 25 destinations to stay within standard API limits
    const batch = destinations.slice(0, 25);
    const destStr = batch.map(d => `${d.lat},${d.lng}`).join('|');
    const response = await fetch(`/api/distance-matrix?origins=${encodeURIComponent(originStr)}&destinations=${encodeURIComponent(destStr)}`);
    const data = await response.json();

    if (data.status === 'OK' && data.rows[0]?.elements) {
      const distances = data.rows[0].elements.map((el: any, i: number) => 
        el.status === 'OK' ? el.distance.value : haversineDistance(origin, batch[i])
      );
      
      // If we had more than 25, recursively fetch the rest or fill with haversine
      if (destinations.length > 25) {
        const rest = await getBatchRoadDistances(origin, destinations.slice(25));
        return [...distances, ...rest];
      }
      
      return distances;
    }
  } catch (error) {
    console.error('Batch Distance Matrix failed:', error);
  }
  
  return destinations.map(d => haversineDistance(origin, d));
};
