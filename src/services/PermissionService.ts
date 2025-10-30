import * as Location from 'expo-location';
import { PermissionStatus, GPSError, GPSErrorType } from '../types';

export const requestLocationPermission = async (): Promise<{
  status: PermissionStatus;
  error?: GPSError;
}> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
      return { status: PermissionStatus.GRANTED };
    }

    return {
      status: PermissionStatus.DENIED,
      error: {
        type: GPSErrorType.PERMISSION_DENIED,
        message: 'Location permission denied by user',
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      status: PermissionStatus.DENIED,
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
        return PermissionStatus.GRANTED;
      case 'denied':
        return PermissionStatus.DENIED;
      default:
        return PermissionStatus.UNDETERMINED;
    }
  } catch (error) {
    console.error('Error checking location permission:', error);
    return PermissionStatus.UNDETERMINED;
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
    if (foregroundStatus !== PermissionStatus.GRANTED) {
      return {
        status: PermissionStatus.DENIED,
        error: {
          type: GPSErrorType.PERMISSION_DENIED,
          message: 'Foreground location permission required first',
          timestamp: Date.now(),
        },
      };
    }

    const { status } = await Location.requestBackgroundPermissionsAsync();

    if (status === 'granted') {
      return { status: PermissionStatus.GRANTED };
    }

    return {
      status: PermissionStatus.DENIED,
      error: {
        type: GPSErrorType.PERMISSION_DENIED,
        message: 'Background location permission denied by user',
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    return {
      status: PermissionStatus.DENIED,
      error: {
        type: GPSErrorType.UNKNOWN,
        message: error instanceof Error ? error.message : 'Unknown permission error',
        timestamp: Date.now(),
      },
    };
  }
};
