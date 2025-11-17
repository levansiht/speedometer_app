import Geolocation from 'react-native-geolocation-service';
import { LocationData, GPSError, GPSErrorType, Coordinates } from '../types';
import { speedFilter } from '../utils/speedFilter';
import {
  calculateSpeedFromDelta,
  resetSpeedCalculationState,
} from '../utils/speedMath';

type GeoPosition = {
  coords: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number;
    altitudeAccuracy?: number | null;
    heading?: number | null;
  };
  timestamp: number;
};

type GeoError = {
  code: number;
  message: string;
};

interface GPSServiceConfig {
  enableHighAccuracy: boolean;
  distanceFilter: number;
  interval: number;
  fastestInterval: number;
}

const DEFAULT_CONFIG: GPSServiceConfig = {
  enableHighAccuracy: true,
  distanceFilter: 0,
  interval: 50,
  fastestInterval: 10,
};

export const getCurrentLocation = async (
  config: Partial<GPSServiceConfig> = {}
): Promise<{ data?: LocationData; error?: GPSError }> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position: GeoPosition) => {
        const calculatedSpeed = 0;
        resolve({
          data: {
            coords: mapCoordinates(position.coords, calculatedSpeed, position.timestamp),
            timestamp: position.timestamp,
          },
        });
      },
      (error: GeoError) => {
        resolve({
          error: {
            type: GPSErrorType.LOCATION_UNAVAILABLE,
            message: error.message,
            timestamp: Date.now(),
          },
        });
      },
      {
        enableHighAccuracy: finalConfig.enableHighAccuracy,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

export const watchLocation = (
  callback: (data: LocationData) => void,
  errorCallback: (error: GPSError) => void,
  config: Partial<GPSServiceConfig> = {}
): { remove: () => void } | null => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let watchId: number | null = null;
  try {
    watchId = Geolocation.watchPosition(
      (position: GeoPosition) => {
        const calculatedSpeed = calculateSpeedFromDelta(
          { latitude: position.coords.latitude, longitude: position.coords.longitude },
          position.timestamp
        );

        callback({
          coords: mapCoordinates(
            position.coords,
            calculatedSpeed,
            position.timestamp
          ),
          timestamp: position.timestamp,
        });
      },
      (error: GeoError) => {
        errorCallback({
          type: GPSErrorType.LOCATION_UNAVAILABLE,
          message: error.message,
          timestamp: Date.now(),
        });
      },
      {
        enableHighAccuracy: finalConfig.enableHighAccuracy,
        distanceFilter: finalConfig.distanceFilter,
        interval: finalConfig.interval,
        fastestInterval: finalConfig.fastestInterval,
        showLocationDialog: true,
        forceRequestLocation: true,
      }
    );
    return {
      remove: () => {
        if (watchId !== null) Geolocation.clearWatch(watchId);
        resetSpeedCalculationState();
        speedFilter.reset();
      },
    };
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
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      (position: GeoPosition) => {
        const calculatedSpeed = 0;
        resolve({
          coords: mapCoordinates(position.coords, calculatedSpeed, position.timestamp),
          timestamp: position.timestamp,
        });
      },
      (_error: GeoError) => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000,
      }
    );
  });
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

const mapCoordinates = (
  coords: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number;
    altitudeAccuracy?: number | null;
    heading?: number | null;
  },
  calculatedSpeed: number,
  timestamp: number
): Coordinates => {
  const filteredSpeed = speedFilter.filter(
    calculatedSpeed,
    coords.accuracy ?? null,
    { latitude: coords.latitude, longitude: coords.longitude },
    timestamp
  );

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    altitude: coords.altitude ?? null,
    accuracy: coords.accuracy ?? null,
    altitudeAccuracy: coords.altitudeAccuracy ?? null,
    heading: coords.heading ?? null,
    speed: filteredSpeed,
  };
};
