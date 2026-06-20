import { GeoLocation } from '../types';

/**
 * Snaps a batch of GPS points to the nearest road network using the server-side proxy.
 */
export const snapPointsToRoads = async (points: GeoLocation[]): Promise<GeoLocation[]> => {
  if (points.length < 2) return points;

  // Paths must be within a certain distance of each other to be considered a single path segment for snapping
  const pathString = points.map(p => `${p.lat},${p.lng}`).join('|');
  const url = `/api/snap-to-roads?path=${encodeURIComponent(pathString)}&interpolate=true`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.snappedPoints && data.snappedPoints.length > 0) {
      return data.snappedPoints.map((sp: any) => ({
        lat: sp.location.latitude,
        lng: sp.location.longitude,
        // Approximate timestamp by interpolating or just using the last point's index
        timestamp: Date.now() 
      }));
    }
  } catch (error) {
    console.warn('Road snapping failed:', error);
  }

  return points;
};

/**
 * Simplifies a polyline using the Ramer-Douglas-Peucker algorithm.
 * Helps remove tiny jitters while preserving the overall shape.
 */
export const simplifyPath = (points: GeoLocation[], tolerance: number = 0.00005): GeoLocation[] => {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance * tolerance;

  const getSqDist = (p1: GeoLocation, p2: GeoLocation) => {
    return (p1.lat - p2.lat) ** 2 + (p1.lng - p2.lng) ** 2;
  };

  const getSqSegDist = (p: GeoLocation, p1: GeoLocation, p2: GeoLocation) => {
    let x = p1.lat, y = p1.lng, dx = p2.lat - x, dy = p2.lng - y;
    if (dx !== 0 || dy !== 0) {
      let t = ((p.lat - x) * dx + (p.lng - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = p2.lat; y = p2.lng; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    dx = p.lat - x;
    dy = p.lng - y;
    return dx * dx + dy * dy;
  };

  const simplifyDPStep = (points: GeoLocation[], first: number, last: number, sqTolerance: number, simplified: GeoLocation[]) => {
    let maxSqDist = sqTolerance, index = -1;
    for (let i = first + 1; i < last; i++) {
      let sqDist = getSqSegDist(points[i], points[first], points[last]);
      if (sqDist > maxSqDist) { index = i; maxSqDist = sqDist; }
    }
    if (index > -1) {
      simplifyDPStep(points, first, index, sqTolerance, simplified);
      simplified.push(points[index]);
      simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  };

  const simplified = [points[0]];
  simplifyDPStep(points, 0, points.length - 1, sqTolerance, simplified);
  simplified.push(points[points.length - 1]);
  return simplified;
};
