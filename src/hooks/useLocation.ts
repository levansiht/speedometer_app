import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationData, GPSError, PermissionStatus, GPSErrorType } from '../types';
import { getCurrentLocation, watchLocation, getLastKnownPosition } from '../services/GPSService';
import {
  requestLocationPermission,
  checkLocationPermission,
  isLocationEnabled,
} from '../services/PermissionService';

interface UseLocationConfig {
  enableMockData?: boolean;
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
  const { enableMockData = false, autoStart = false, distanceInterval, timeInterval } = config;

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

  const getCurrentPosition = useCallback(async (): Promise<void> => {
    if (permission !== PermissionStatus.GRANTED && !enableMockData) {
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

  const startTracking = useCallback(async (): Promise<void> => {
    console.log('useLocation.startTracking: Called', { permission, enableMockData, isTracking });

    if (watchSubscription.current) {
      console.log('useLocation.startTracking: Removing existing subscription');
      watchSubscription.current.remove();
    }

    if (permission !== PermissionStatus.GRANTED && !enableMockData) {
      console.error('useLocation.startTracking: Permission denied');
      setError({
        type: GPSErrorType.PERMISSION_DENIED,
        message: 'Location permission not granted',
        timestamp: Date.now(),
      });
      return;
    }

    console.log('useLocation.startTracking: Starting tracking...');
    setIsLoading(true);
    setError(null);

    try {
      console.log('useLocation.startTracking: Getting last known position...');
      const lastPosition = await getLastKnownPosition();
      if (lastPosition) {
        console.log('useLocation.startTracking: Got last position:', lastPosition.coords);
        setLocation(lastPosition);
      }

      console.log('useLocation.startTracking: Setting up watch location...');
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
        console.log('useLocation.startTracking: Watch location started successfully');
        watchSubscription.current = subscription;
        setIsTracking(true);
      } else {
        console.error('useLocation.startTracking: Failed to get subscription');
        setError({
          type: GPSErrorType.LOCATION_UNAVAILABLE,
          message: 'Failed to start location tracking',
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('useLocation.startTracking: Error:', err);
      setError({
        type: GPSErrorType.UNKNOWN,
        message: err instanceof Error ? err.message : 'Unknown error',
        timestamp: Date.now(),
      });
    } finally {
      console.log('useLocation.startTracking: Finished');
      setIsLoading(false);
    }
  }, [permission, enableMockData, distanceInterval, timeInterval]);

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
