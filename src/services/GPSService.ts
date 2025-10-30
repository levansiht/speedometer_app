/**
 * GPS Service
 * Core GPS functionality with error handling and mock data support
 */

import * as Location from 'expo-location';
import { LocationData, GPSError, GPSErrorType, Coordinates } from '../types';
import { GPS_CONFIG } from '../constants';

/**
 * GPS Service Configuration
 */
interface GPSServiceConfig {
  accuracy: Location.LocationAccuracy;
  distanceInterval: number;
  timeInterval: number;
  enableMockData?: boolean;
}

/**
 * Default GPS configuration
 */
const DEFAULT_CONFIG: GPSServiceConfig = {
  accuracy: Location.LocationAccuracy.BestForNavigation,
  distanceInterval: GPS_CONFIG.MIN_DISTANCE,
  timeInterval: GPS_CONFIG.UPDATE_INTERVAL,
  enableMockData: false,
};

/**
 * Get current location once
 * @param config - Optional configuration
 * @returns Location data or error
 */
export const getCurrentLocation = async (
  config: Partial<GPSServiceConfig> = {}
): Promise<{ data?: LocationData; error?: GPSError }> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Check if mock data is enabled
    if (finalConfig.enableMockData) {
      return { data: generateMockLocation() };
    }

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

/**
 * Watch location changes
 * @param callback - Function to call on location update
 * @param config - Optional configuration
 * @returns Subscription object to remove listener
 */
export const watchLocation = async (
  callback: (data: LocationData) => void,
  errorCallback: (error: GPSError) => void,
  config: Partial<GPSServiceConfig> = {}
): Promise<{ remove: () => void } | null> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // If mock data is enabled, simulate location updates
    if (finalConfig.enableMockData) {
      return startMockLocationUpdates(callback, finalConfig.timeInterval);
    }

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

/**
 * Get last known position
 * @returns Last known location or null
 */
export const getLastKnownPosition = async (): Promise<LocationData | null> => {
  try {
    const location = await Location.getLastKnownPositionAsync();
    if (!location) return null;

    return {
      coords: mapCoordinates(location.coords),
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting last known position:', error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in meters
 */
export const calculateDistance = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number => {
  const R = 6371e3; // Earth's radius in meters
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

/**
 * Calculate bearing between two coordinates
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Bearing in degrees (0-360)
 */
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

// ==================== HELPER FUNCTIONS ====================

/**
 * Map Location.LocationObjectCoords to our Coordinates type
 */
const mapCoordinates = (coords: Location.LocationObjectCoords): Coordinates => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  altitude: coords.altitude,
  accuracy: coords.accuracy,
  altitudeAccuracy: coords.altitudeAccuracy ?? null,
  heading: coords.heading,
  speed: coords.speed,
});

// ==================== MOCK DATA FOR TESTING ====================

let mockLocationInterval: NodeJS.Timeout | null = null;
let mockSpeed = 0;
let mockLatitude = 10.762622; // Default: Ho Chi Minh City
let mockLongitude = 106.660172;

/**
 * Generate mock location data for simulator testing
 */
const generateMockLocation = (): LocationData => {
  // Simulate movement
  mockSpeed += (Math.random() - 0.5) * 2; // Random speed change
  mockSpeed = Math.max(0, Math.min(30, mockSpeed)); // Keep between 0-30 m/s

  // Update coordinates based on speed (approximate)
  mockLatitude += (Math.random() - 0.5) * 0.0001;
  mockLongitude += (Math.random() - 0.5) * 0.0001;

  return {
    coords: {
      latitude: mockLatitude,
      longitude: mockLongitude,
      altitude: 10 + Math.random() * 5,
      accuracy: 5 + Math.random() * 5,
      altitudeAccuracy: 3,
      heading: Math.random() * 360,
      speed: mockSpeed,
    },
    timestamp: Date.now(),
  };
};

/**
 * Start mock location updates
 */
const startMockLocationUpdates = (
  callback: (data: LocationData) => void,
  interval: number
): { remove: () => void } => {
  mockLocationInterval = setInterval(() => {
    callback(generateMockLocation());
  }, interval);

  return {
    remove: () => {
      if (mockLocationInterval) {
        clearInterval(mockLocationInterval);
        mockLocationInterval = null;
      }
    },
  };
};

/**
 * Set mock location parameters
 */
export const setMockLocation = (latitude: number, longitude: number, speed: number = 0): void => {
  mockLatitude = latitude;
  mockLongitude = longitude;
  mockSpeed = speed;
};
