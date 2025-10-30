import * as Location from 'expo-location';
import { PermissionStatus, GPSError, GPSErrorType } from '../types';

export const requestLocationPermission = async (): Promise<{
  status: PermissionStatus;
  error?: GPSError;
}> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      return { status: 'granted' };
    }

    return {
      status: 'denied',
      error: {
        type: GPSErrorType.PERMISSION_DENIED,
        message: 'Location permission denied by user',
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      status: 'denied',
      error: {
        type: GPSErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : 'Unknown permission error',
        timestamp: Date.now(),
      },
    };
  }
};

export const checkLocationPermission = async (): Promise<PermissionStatus> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();

    switch (status) {
      case 'granted':
        return 'granted';
      case 'denied':
        return 'denied';
      default:
        return 'undetermined';
    }
  } catch (error) {
    console.error('Error checking location permission:', error);
    return 'undetermined';
  }
};

export const isLocationEnabled = async (): Promise<boolean> => {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

export const requestBackgroundLocationPermission = async (): Promise<{
  status: PermissionStatus;
  error?: GPSError;
}> => {
  try {
    const foregroundStatus = await checkLocationPermission();
    if (foregroundStatus !== 'granted') {
      return {
        status: 'denied',
        error: {
          type: GPSErrorType.PERMISSION_DENIED,
          message: 'Foreground location permission required first',
          timestamp: Date.now(),
        },
      };
    }

    const { status } = await Location.requestBackgroundPermissionsAsync();

    if (status === 'granted') {
      return { status: 'granted' };
    }

    return {
      status: 'denied',
      error: {
        type: GPSErrorType.PERMISSION_DENIED,
        message: 'Background location permission denied by user',
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      status: 'denied',
      error: {
        type: GPSErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : 'Unknown permission error',
        timestamp: Date.now(),
      },
    };
  }
};
