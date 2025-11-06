import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationData, GPSError, PermissionStatus, GPSErrorType } from '../types';
import { getCurrentLocation, watchLocation, getLastKnownPosition } from '../services/GPSService';
import {
  requestLocationPermission,
  checkLocationPermission,
  isLocationEnabled,
} from '../services/PermissionService';

interface UseLocationConfig {
  autoStart?: boolean;
  distanceInterval?: number;
  timeInterval?: number;
}

interface UseLocationReturn {
  location: LocationData | null;
  permission: PermissionStatus;
  isTracking: boolean;
  error: GPSError | null;
  isLoading: boolean;

  requestPermission: () => Promise<void>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentPosition: () => Promise<void>;

  isLocationServicesEnabled: boolean;
}

export const useLocation = (config: UseLocationConfig = {}): UseLocationReturn => {
  const { autoStart = false, distanceInterval, timeInterval } = config;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>(PermissionStatus.UNDETERMINED);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [error, setError] = useState<GPSError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocationServicesEnabled, setIsLocationServicesEnabled] = useState<boolean>(true);

  const watchSubscription = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      console.log('useLocation: Checking permissions...');
      const status = await checkLocationPermission();
      setPermission(status);

      const servicesEnabled = await isLocationEnabled();
      setIsLocationServicesEnabled(servicesEnabled);

      console.log('useLocation: Permission status:', { status, servicesEnabled });
    };

    checkPermissions();
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);
  const requestPermission = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const servicesEnabled = await isLocationEnabled();
      setIsLocationServicesEnabled(servicesEnabled);

      if (!servicesEnabled) {
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
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<void> => {
    if (permission !== PermissionStatus.GRANTED) {
      setError({
        type: GPSErrorType.PERMISSION_DENIED,
        message: 'Location permission not granted',
        timestamp: Date.now(),
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await getCurrentLocation();

    if (result.data) {
      setLocation(result.data);
    }

    if (result.error) {
      setError(result.error);
    }

    setIsLoading(false);
  }, [permission]);

  const startTracking = useCallback(async (): Promise<void> => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
    }

    if (permission !== PermissionStatus.GRANTED) {
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
      const lastPosition = await getLastKnownPosition();
      if (lastPosition) {
        setLocation(lastPosition);
      }

      const subscription = await watchLocation(
        (loc) => {
          console.log('📍 GPS Update:', {
            accuracy: loc.coords.accuracy?.toFixed(1) + 'm',
            speed: loc.coords.speed?.toFixed(1) + 'm/s',
            lat: loc.coords.latitude.toFixed(6),
            lon: loc.coords.longitude.toFixed(6),
          });
          setLocation(loc);
          setError(null);
        },
        (err) => {
          setError(err);
        },
        {
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
  }, [permission, distanceInterval, timeInterval]);

  const stopTracking = useCallback((): void => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
      setIsTracking(false);
    }
  }, []);

  // Auto-start tracking when permission is granted and autoStart is enabled
  useEffect(() => {
    if (
      autoStart &&
      permission === PermissionStatus.GRANTED &&
      isLocationServicesEnabled &&
      !isTracking
    ) {
      console.log('useLocation: autoStart enabled, calling startTracking...');
      startTracking();
    }
  }, [autoStart, permission, isLocationServicesEnabled, isTracking, startTracking]);

  return {
    location,
    permission,
    isTracking,
    error,
    isLoading,
    isLocationServicesEnabled,

    requestPermission,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
};
