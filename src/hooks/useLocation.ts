/**
 * useLocation Hook
 * Custom hook for GPS location tracking with TypeScript
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationData, GPSError, PermissionStatus, GPSErrorType } from '../types';
import { getCurrentLocation, watchLocation, getLastKnownPosition } from '../services/GPSService';
import {
  requestLocationPermission,
  checkLocationPermission,
  isLocationEnabled,
} from '../services/PermissionService';

/**
 * Hook configuration
 */
interface UseLocationConfig {
  enableMockData?: boolean;
  autoStart?: boolean;
  distanceInterval?: number;
  timeInterval?: number;
}

/**
 * Hook return type
 */
interface UseLocationReturn {
  // Current state
  location: LocationData | null;
  permission: PermissionStatus;
  isTracking: boolean;
  error: GPSError | null;
  isLoading: boolean;

  // Actions
  requestPermission: () => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentPosition: () => Promise<void>;

  // Helpers
  isLocationServicesEnabled: boolean;
}

/**
 * Custom hook for location tracking
 * @param config - Optional configuration
 */
export const useLocation = (config: UseLocationConfig = {}): UseLocationReturn => {
  const { enableMockData = false, autoStart = false, distanceInterval, timeInterval } = config;

  // State
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>('undetermined');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<GPSError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocationServicesEnabled, setIsLocationServicesEnabled] = useState<boolean>(true);

  // Refs
  const watchSubscription = useRef<{ remove: () => void } | null>(null);

  /**
   * Check permission status on mount
   */
  useEffect(() => {
    const checkPermissions = async () => {
      const status = await checkLocationPermission();
      setPermission(status);

      const servicesEnabled = await isLocationEnabled();
      setIsLocationServicesEnabled(servicesEnabled);

      // Auto-start if enabled and permission granted
      if (autoStart && status === 'granted' && servicesEnabled) {
        await startTracking();
      }
    };

    checkPermissions();
  }, [autoStart]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  /**
   * Request location permission
   */
  const requestPermission = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if location services are enabled
      const servicesEnabled = await isLocationEnabled();
      setIsLocationServicesEnabled(servicesEnabled);

      if (!servicesEnabled && !enableMockData) {
        setError({
          type: GPSErrorType.LOCATION_UNAVAILABLE,
          message: 'Location services are disabled on this device',
          timestamp: Date.now(),
        });
        setIsLoading(false);
        return;
      }

      const result = await requestLocationPermission();
      setPermission(result.status);

      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError({
        type: GPSErrorType.UNKNOWN,
        message: err instanceof Error ? err.message : 'Unknown error',
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [enableMockData]);

  /**
   * Get current position once
   */
  const getCurrentPosition = useCallback(async (): Promise<void> => {
    if (permission !== 'granted' && !enableMockData) {
      setError({
        type: GPSErrorType.PERMISSION_DENIED,
        message: 'Location permission not granted',
        timestamp: Date.now(),
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await getCurrentLocation({ enableMockData });

    if (result.data) {
      setLocation(result.data);
    }

    if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
  }, [permission, enableMockData]);

  /**
   * Start continuous location tracking
   */
  const startTracking = useCallback(async (): Promise<void> => {
    // Stop existing tracking if any
    if (watchSubscription.current) {
      watchSubscription.current.remove();
    }

    if (permission !== 'granted' && !enableMockData) {
      setError({
        type: GPSErrorType.PERMISSION_DENIED,
        message: 'Location permission not granted',
        timestamp: Date.now(),
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to get last known position first
      const lastPosition = await getLastKnownPosition();
      if (lastPosition) {
        setLocation(lastPosition);
      }

      // Start watching location
      const subscription = await watchLocation(
        (data) => {
          setLocation(data);
          setError(null);
        },
        (err) => {
          setError(err);
        },
        {
          enableMockData,
          distanceInterval,
          timeInterval,
        }
      );

      if (subscription) {
        watchSubscription.current = subscription;
        setIsTracking(true);
      } else {
        setError({
          type: GPSErrorType.LOCATION_UNAVAILABLE,
          message: 'Failed to start location tracking',
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      setError({
        type: GPSErrorType.UNKNOWN,
        message: err instanceof Error ? err.message : 'Unknown error',
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [permission, enableMockData, distanceInterval, timeInterval]);

  /**
   * Stop location tracking
   */
  const stopTracking = useCallback((): void => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
      setIsTracking(false);
    }
  }, []);

  return {
    // State
    location,
    permission,
    isTracking,
    error,
    isLoading,
    isLocationServicesEnabled,

    // Actions
    requestPermission,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
};
