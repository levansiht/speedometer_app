import * as Location from 'expo-location';
import { LocationData, GPSError, GPSErrorType, Coordinates } from '../types';
import { GPS_CONFIG } from '../constants';

interface GPSServiceConfig {
  accuracy: Location.LocationAccuracy;
  distanceInterval: number;
  timeInterval: number;
}

const DEFAULT_CONFIG: GPSServiceConfig = {
  accuracy: Location.LocationAccuracy.BestForNavigation,
  distanceInterval: GPS_CONFIG.MIN_DISTANCE,
  timeInterval: GPS_CONFIG.UPDATE_INTERVAL,
};

export const getCurrentLocation = async (
  config: Partial<GPSServiceConfig> = {}
): Promise<{ data?: LocationData; error?: GPSError }> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: finalConfig.accuracy,
    });

    return {
      data: {
        coords: mapCoordinates(location.coords),
        timestamp: location.timestamp,
      },
    };
  } catch (error) {
    return {
      error: {
        type: GPSErrorType.LOCATION_UNAVAILABLE,
        message: error instanceof Error ? error.message : 'Failed to get location',
        timestamp: Date.now(),
      },
    };
  }
};

export const watchLocation = async (
  callback: (data: LocationData) => void,
  errorCallback: (error: GPSError) => void,
  config: Partial<GPSServiceConfig> = {}
): Promise<{ remove: () => void } | null> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: finalConfig.accuracy,
        distanceInterval: finalConfig.distanceInterval,
        timeInterval: finalConfig.timeInterval,
      },
      (location) => {
        callback({
          coords: mapCoordinates(location.coords),
          timestamp: location.timestamp,
        });
      }
    );

    return subscription;
  } catch (error) {
    errorCallback({
      type: GPSErrorType.LOCATION_UNAVAILABLE,
      message: error instanceof Error ? error.message : 'Failed to watch location',
      timestamp: Date.now(),
    });
    return null;
  }
};

export const getLastKnownPosition = async (): Promise<LocationData | null> => {
  try {
    const location = await Location.getLastKnownPositionAsync();
    if (!location) {
      return null;
    }

    return {
      coords: mapCoordinates(location.coords),
      timestamp: location.timestamp,
    };
  } catch (error) {
    return null;
  }
};

export const calculateDistance = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number => {
  const R = 6371e3;
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const calculateBearing = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number => {
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
};

const mapCoordinates = (coords: Location.LocationObjectCoords): Coordinates => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  altitude: coords.altitude,
  accuracy: coords.accuracy,
  altitudeAccuracy: coords.altitudeAccuracy ?? null,
  heading: coords.heading,
  speed: coords.speed,
});
