import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import * as Location from 'expo-location';
import { PermissionStatus, GPSError, GPSErrorType } from '../types';

export const requestLocationPermission = async (): Promise<{
  status: PermissionStatus;
  error?: GPSError;
}> => {
  try {
    if (Platform.OS === 'android') {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      
      if (alreadyGranted) {
        return { status: PermissionStatus.GRANTED };
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Quyền truy cập vị trí',
          message: 'Speedometer cần truy cập vị trí để hiển thị tốc độ và ghi lại hành trình.',
          buttonNeutral: 'Hỏi sau',
          buttonNegative: 'Từ chối',
          buttonPositive: 'Đồng ý',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return { status: PermissionStatus.GRANTED };
      }

      if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return {
          status: PermissionStatus.DENIED,
          error: {
            type: GPSErrorType.PERMISSION_DENIED,
            message: 'Location permission denied permanently. Please enable it in Settings.',
            timestamp: Date.now(),
          },
        };
      }

      return {
        status: PermissionStatus.DENIED,
        error: {
          type: GPSErrorType.PERMISSION_DENIED,
          message: 'Location permission denied by user',
          timestamp: Date.now(),
        },
      };
    } else {
      return new Promise((resolve) => {
        Geolocation.getCurrentPosition(
          () => {
            resolve({ status: PermissionStatus.GRANTED });
          },
          (error) => {
            if (error.code === 1) {
              resolve({
                status: PermissionStatus.DENIED,
                error: {
                  type: GPSErrorType.PERMISSION_DENIED,
                  message: 'Location permission denied by user',
                  timestamp: Date.now(),
                },
              });
            } else {
              resolve({
                status: PermissionStatus.DENIED,
                error: {
                  type: GPSErrorType.LOCATION_UNAVAILABLE,
                  message: error.message,
                  timestamp: Date.now(),
                },
              });
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      });
    }
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
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      console.log('[PermissionService] Check location permission:', granted ? 'GRANTED' : 'DENIED');
      return granted ? PermissionStatus.GRANTED : PermissionStatus.DENIED;
    } else {
      // iOS: Check by attempting to get location
      return new Promise((resolve) => {
        Geolocation.getCurrentPosition(
          () => resolve(PermissionStatus.GRANTED),
          (error) => {
            if (error.code === 1) {
              resolve(PermissionStatus.DENIED);
            } else {
              resolve(PermissionStatus.UNDETERMINED);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 1000,
            maximumAge: 0,
          }
        );
      });
    }
  } catch (error) {
    console.error('[PermissionService] Error checking location permission:', error);
    return PermissionStatus.UNDETERMINED;
  }
};

// Helper function to open app settings
export const openAppSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === 'android') {
      await Linking.openSettings();
    } else {
      await Linking.openURL('app-settings:');
    }
  } catch (error) {
    console.error('[PermissionService] Error opening settings:', error);
    Alert.alert(
      'Lỗi',
      'Không thể mở cài đặt. Vui lòng mở thủ công trong Settings > Apps > Speedometer > Permissions'
    );
  }
};

export const isLocationEnabled = async (): Promise<boolean> => {
  try {
    // react-native-geolocation-service doesn't have a direct method to check if location services are enabled
    // We'll try to get a position with a short timeout to check
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          // Error code 2 = POSITION_UNAVAILABLE (location services disabled)
          resolve(error.code !== 2);
        },
        {
          enableHighAccuracy: false,
          timeout: 2000,
          maximumAge: 0,
        }
      );
    });
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

// Giữ nguyên expo-location cho background permission (cần cho BackgroundLocationService)
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
