/**
 * Background Location Service
 * Handles GPS tracking and notifications when app is in background
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GPS_CONFIG } from '../constants';

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
const STORAGE_KEYS = {
  IS_TRACKING: 'background_tracking_active',
  LAST_NOTIFICATION_KM: 'last_notification_km',
  TRIP_START_TIME: 'trip_start_time',
  TOTAL_DISTANCE: 'trip_total_distance',
  LAST_POSITION: 'trip_last_position',
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number => {
  const R = 6371e3; // Earth radius in meters
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
 * Send local notification
 */
const sendNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null, // Send immediately
  });
};

/**
 * Background location task definition
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Background] Location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];

    if (!location) return;

    try {
      // Get stored data
      const lastPosStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_POSITION);
      const totalDistanceStr = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_DISTANCE);
      const lastNotificationKmStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_NOTIFICATION_KM);

      const lastPos = lastPosStr ? JSON.parse(lastPosStr) : null;
      const totalDistance = totalDistanceStr ? parseFloat(totalDistanceStr) : 0;
      const lastNotificationKm = lastNotificationKmStr ? parseFloat(lastNotificationKmStr) : 0;

      // Calculate distance from last position
      let newTotalDistance = totalDistance;
      if (lastPos) {
        const distance = calculateDistance(
          { latitude: lastPos.latitude, longitude: lastPos.longitude },
          { latitude: location.coords.latitude, longitude: location.coords.longitude }
        );
        newTotalDistance = totalDistance + distance;
      }

      // Save new position and distance
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_POSITION,
        JSON.stringify({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      );
      await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_DISTANCE, newTotalDistance.toString());

      // Check if we should send notification (every 1 km)
      const currentKm = Math.floor(newTotalDistance / 1000);
      if (currentKm > lastNotificationKm) {
        const speed = location.coords.speed ? (location.coords.speed * 3.6).toFixed(0) : '0';
        await sendNotification(`🎉 ${currentKm} km hoàn thành!`, `Tốc độ hiện tại: ${speed} km/h`);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_NOTIFICATION_KM, currentKm.toString());
      }
    } catch (err) {
      console.error('[Background] Task processing error:', err);
    }
  }
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

/**
 * Request background location permissions
 */
export const requestBackgroundLocationPermissions = async (): Promise<boolean> => {
  // First check foreground permissions
  const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return false;
    }
  }

  // Then check background permissions
  const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  }

  return true;
};

/**
 * Start background location tracking
 */
export const startBackgroundTracking = async (): Promise<boolean> => {
  try {
    // Request permissions
    const hasNotificationPermission = await requestNotificationPermissions();
    if (!hasNotificationPermission) {
      console.warn('[Background] Notification permission denied');
    }

    const hasBackgroundPermission = await requestBackgroundLocationPermissions();
    if (!hasBackgroundPermission) {
      console.error('[Background] Background location permission denied');
      return false;
    }

    // Check if already running
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      console.log('[Background] Task already registered, skipping');
      return true;
    }

    // Initialize storage
    await AsyncStorage.setItem(STORAGE_KEYS.IS_TRACKING, 'true');
    await AsyncStorage.setItem(STORAGE_KEYS.TRIP_START_TIME, Date.now().toString());
    await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_DISTANCE, '0');
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_NOTIFICATION_KM, '0');
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_POSITION);

    // Start background location updates
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: GPS_CONFIG.UPDATE_INTERVAL,
      distanceInterval: GPS_CONFIG.MIN_DISTANCE,
      foregroundService: {
        notificationTitle: 'Speedometer đang hoạt động',
        notificationBody: 'Đang theo dõi hành trình của bạn',
        notificationColor: '#4CAF50',
      },
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
    });

    console.log('[Background] Tracking started successfully');
    return true;
  } catch (error) {
    console.error('[Background] Failed to start tracking:', error);
    return false;
  }
};

/**
 * Stop background location tracking
 */
export const stopBackgroundTracking = async (): Promise<void> => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    // Clear storage
    await AsyncStorage.setItem(STORAGE_KEYS.IS_TRACKING, 'false');
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_POSITION);

    console.log('[Background] Tracking stopped');
  } catch (error) {
    console.error('[Background] Failed to stop tracking:', error);
  }
};

/**
 * Check if background tracking is active
 */
export const isBackgroundTrackingActive = async (): Promise<boolean> => {
  try {
    const isTracking = await AsyncStorage.getItem(STORAGE_KEYS.IS_TRACKING);
    return isTracking === 'true';
  } catch {
    return false;
  }
};

/**
 * Get background tracking stats
 */
export const getBackgroundTrackingStats = async () => {
  try {
    const totalDistanceStr = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_DISTANCE);
    const startTimeStr = await AsyncStorage.getItem(STORAGE_KEYS.TRIP_START_TIME);

    return {
      totalDistance: totalDistanceStr ? parseFloat(totalDistanceStr) : 0,
      startTime: startTimeStr ? parseInt(startTimeStr, 10) : null,
    };
  } catch {
    return { totalDistance: 0, startTime: null };
  }
};
