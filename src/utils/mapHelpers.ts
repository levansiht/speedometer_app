import type { LatLng, Region } from 'react-native-maps';
import type { LocationData, RoutePoint } from '../types';

export function simplifyPolyline(points: LatLng[], tolerance: number = 0.0001): LatLng[] {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[end]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPolyline(points.slice(0, index + 1), tolerance);
    const right = simplifyPolyline(points.slice(index), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[end]];
}

function perpendicularDistance(point: LatLng, lineStart: LatLng, lineEnd: LatLng): number {
  const x = point.latitude;
  const y = point.longitude;
  const x1 = lineStart.latitude;
  const y1 = lineStart.longitude;
  const x2 = lineEnd.latitude;
  const y2 = lineEnd.longitude;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;

  return Math.sqrt(dx * dx + dy * dy);
}

export function isInViewport(coord: LatLng, region: Region): boolean {
  const latDelta = region.latitudeDelta;
  const lngDelta = region.longitudeDelta;

  return (
    coord.latitude >= region.latitude - latDelta / 2 &&
    coord.latitude <= region.latitude + latDelta / 2 &&
    coord.longitude >= region.longitude - lngDelta / 2 &&
    coord.longitude <= region.longitude + lngDelta / 2
  );
}

export function fitCoordinates(coordinates: LatLng[], padding: number = 0.1): Region {
  if (coordinates.length === 0) {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;

  coordinates.forEach((coord) => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDelta = (maxLat - minLat) * (1 + padding);
  const lngDelta = (maxLng - minLng) * (1 + padding);

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(latDelta, 0.01),
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
}

export function locationToLatLng(location: LocationData): LatLng {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export function routePointToLatLng(point: RoutePoint): LatLng {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

export function getColorBySpeed(speedKmh: number, maxSpeed: number = 120): string {
  const ratio = Math.min(speedKmh / maxSpeed, 1);

  if (ratio < 0.3) {
    // Green: 0-36 km/h
    return '#10B981';
  } else if (ratio < 0.6) {
    // Yellow: 36-72 km/h
    return '#F59E0B';
  } else if (ratio < 0.8) {
    // Orange: 72-96 km/h
    return '#F97316';
  } else {
    // Red: 96+ km/h
    return '#EF4444';
  }
}

export interface RouteSegment {
  coordinates: LatLng[];
  avgSpeed: number;
  startTime: number;
  endTime: number;
}

export function createRouteSegments(
  locations: LocationData[],
  segmentSize: number = 10
): RouteSegment[] {
  if (locations.length === 0) return [];

  const segments: RouteSegment[] = [];
  let currentSegment: LocationData[] = [];

  locations.forEach((location, index) => {
    currentSegment.push(location);

    if (currentSegment.length >= segmentSize || index === locations.length - 1) {
      const coordinates = currentSegment.map(locationToLatLng);
      const speeds = currentSegment.map((l) => l.coords.speed ?? 0);
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

      segments.push({
        coordinates,
        avgSpeed: avgSpeed * 3.6,
        startTime: currentSegment[0].timestamp,
        endTime: currentSegment[currentSegment.length - 1].timestamp,
      });

      currentSegment = [];
    }
  });

  return segments;
}

export function createRouteSegmentsFromPoints(
  points: RoutePoint[],
  segmentSize: number = 10
): RouteSegment[] {
  if (points.length === 0) return [];

  const segments: RouteSegment[] = [];
  let currentSegment: RoutePoint[] = [];

  points.forEach((point, index) => {
    currentSegment.push(point);

    if (currentSegment.length >= segmentSize || index === points.length - 1) {
      const coordinates = currentSegment.map(routePointToLatLng);
      const speeds = currentSegment.map((p) => p.speed);
      const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

      segments.push({
        coordinates,
        avgSpeed: avgSpeed * 3.6,
        startTime: currentSegment[0].timestamp,
        endTime: currentSegment[currentSegment.length - 1].timestamp,
      });

      currentSegment = [];
    }
  });

  return segments;
}

export function getZoomLevel(latitudeDelta: number): number {
  return Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
}

export function optimizeRouteForZoom(route: LatLng[], zoomLevel: number): LatLng[] {
  if (route.length < 100) return route;

  let tolerance = 0.0001;

  if (zoomLevel < 10) {
    tolerance = 0.001;
  } else if (zoomLevel < 13) {
    tolerance = 0.0005;
  } else if (zoomLevel < 15) {
    tolerance = 0.0002;
  }

  return simplifyPolyline(route, tolerance);
}
