import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, TripStatus, RoutePoint, LocationData } from '../types';
import { db } from '../services/DatabaseService';
import {
  startBackgroundTracking,
  stopBackgroundTracking,
} from '../services/BackgroundLocationService';

const TRIP_HISTORY_KEY = '@speedometer_trip_history';
const MAX_HISTORY_ITEMS = 50;

interface TripContextValue {
  currentTrip: Trip | null;
  isTracking: boolean;

  startTrip: () => void;
  pauseTrip: () => void;
  resumeTrip: () => void;
  stopTrip: () => Promise<void>;

  updateLocation: (location: LocationData) => void;

  tripHistory: Trip[];
  loadTripHistory: () => Promise<void>;
  deleteTripFromHistory: (tripId: string) => Promise<void>;
  clearTripHistory: () => Promise<void>;
}

const TripContext = createContext<TripContextValue | undefined>(undefined);

interface TripProviderProps {
  children: React.ReactNode;
}

export function TripProvider({ children }: TripProviderProps) {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [tripHistory, setTripHistory] = useState<Trip[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  const previousLocationRef = useRef<LocationData | null>(null);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number | null>(null);
  const stopInProgressRef = useRef(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        await db.initialize();
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsDbReady(true);
      }
    };

    initDB();
  }, []);
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    },
    []
  );

  const startTrip = useCallback(async () => {
    if (currentTrip && currentTrip.status === 'running') {
      console.warn('[TripContext] startTrip ignored - trip already running');
      return;
    }

    const now = Date.now();
    const newTrip: Trip = {
      id: `trip_${now}`,
      status: 'running' as TripStatus,
      stats: {
        distance: 0,
        duration: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        startTime: now,
        endTime: null,
      },
      route: [],
      createdAt: now,
      updatedAt: now,
    };

    setCurrentTrip(newTrip);
    setIsTracking(true);
    previousLocationRef.current = null;
    pausedDurationRef.current = 0;
    pauseStartTimeRef.current = null;

    console.log('[TripContext] startTrip', newTrip.id);
    // Start background tracking
    const started = await startBackgroundTracking();
    if (!started) {
      console.warn('[TripContext] Failed to start background tracking');
    }
  }, [currentTrip]);

  const pauseTrip = useCallback(() => {
    if (!currentTrip || currentTrip.status !== 'running') return;

    console.log('[TripContext] pauseTrip', currentTrip.id);
    setCurrentTrip((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'paused' as TripStatus,
        updatedAt: Date.now(),
      };
    });
    setIsTracking(false);
    pauseStartTimeRef.current = Date.now();
  }, [currentTrip]);

  const resumeTrip = useCallback(() => {
    if (!currentTrip || currentTrip.status !== 'paused') return;

    console.log('[TripContext] resumeTrip', currentTrip.id);
    if (pauseStartTimeRef.current) {
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      pausedDurationRef.current += pauseDuration;
      pauseStartTimeRef.current = null;
    }

    setCurrentTrip((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'running' as TripStatus,
        updatedAt: Date.now(),
      };
    });
    setIsTracking(true);
  }, [currentTrip]);

  const loadTripHistory = useCallback(async () => {
    try {
      const trips = await db.getAllTrips();
      setTripHistory(trips);
    console.log(`Loaded ${trips.length} trips from database`);
    } catch (error) {
      console.error('Failed to load trip history from database:', error);

      try {
        const history = await AsyncStorage.getItem(TRIP_HISTORY_KEY);
        if (history) {
          const historyArray: Trip[] = JSON.parse(history);
          setTripHistory(historyArray);
        }
      } catch (storageError) {
        console.error('Failed to load from AsyncStorage:', storageError);
      }
    }
  }, []);

  const stopTrip = useCallback(async () => {
    if (!currentTrip) {
      console.warn('[TripContext] stopTrip ignored - no current trip');
      return;
    }
    if (stopInProgressRef.current) {
      console.warn('[TripContext] stopTrip ignored - already in progress');
      return;
    }
    stopInProgressRef.current = true;

    const now = Date.now();

    const finalTrip: Trip = {
      ...currentTrip,
      status: 'stopped' as TripStatus,
      stats: {
        ...currentTrip.stats,
        endTime: now,
      },
      updatedAt: now,
    };

    const stopStart = Date.now();
    console.log('[TripContext] stopTrip start', {
      tripId: finalTrip.id,
      distance: finalTrip.stats.distance,
      duration: finalTrip.stats.duration,
      routePoints: finalTrip.route.length,
    });
    try {
      try {
        const dbStart = Date.now();
        await db.saveTrip(finalTrip);
        console.log('[TripContext] Trip saved to database', {
          tripId: finalTrip.id,
          elapsedMs: Date.now() - dbStart,
        });
        loadTripHistory().catch((err) =>
          console.error('[TripContext] Failed to refresh history:', err)
        );
      } catch (error) {
        console.error('[TripContext] Failed to save trip to database:', error);

        try {
          const history = await AsyncStorage.getItem(TRIP_HISTORY_KEY);
          const historyArray: Trip[] = history ? JSON.parse(history) : [];
          const updatedHistory = [finalTrip, ...historyArray].slice(0, MAX_HISTORY_ITEMS);
          const storageStart = Date.now();
          await AsyncStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(updatedHistory));
          setTripHistory(updatedHistory);
          console.log('[TripContext] Trip saved to AsyncStorage', {
            tripId: finalTrip.id,
            elapsedMs: Date.now() - storageStart,
            historySize: updatedHistory.length,
          });
        } catch (storageError) {
          console.error('[TripContext] Failed to save to AsyncStorage:', storageError);
        }
      }

      setCurrentTrip(null);
      setIsTracking(false);
      previousLocationRef.current = null;
      pausedDurationRef.current = 0;
      pauseStartTimeRef.current = null;

      // Stop background tracking
      await stopBackgroundTracking();
    } finally {
      console.log('[TripContext] stopTrip finished', {
        tripId: finalTrip.id,
        totalMs: Date.now() - stopStart,
      });
      stopInProgressRef.current = false;
    }
  }, [currentTrip, loadTripHistory]);

  const updateLocation = useCallback(
    (location: LocationData) => {
      const { coords, timestamp } = location;
      const speed = coords.speed ?? 0;

      setCurrentTrip((prev) => {
        if (!prev || prev.status !== 'running') return prev;

        let newDistance = prev.stats.distance;
        let shouldAddPoint = false;

        if (previousLocationRef.current) {
          const prevCoords = previousLocationRef.current.coords;
          const distanceDelta = calculateDistance(
            prevCoords.latitude,
            prevCoords.longitude,
            coords.latitude,
            coords.longitude
          );

          // Chỉ thêm point khi di chuyển >1m (giảm từ 5m → 1m)
          if (distanceDelta > 1) {
            newDistance += distanceDelta;
            shouldAddPoint = true;
          }
        } else {
          // Điểm đầu tiên luôn thêm
          shouldAddPoint = true;
        }

        const totalElapsedTime = timestamp - prev.stats.startTime;
        const activeDuration = Math.max(0, totalElapsedTime - pausedDurationRef.current);
        const durationInSeconds = Math.floor(activeDuration / 1000);

        const averageSpeed = durationInSeconds > 0 ? newDistance / durationInSeconds : 0;

        const maxSpeed = Math.max(prev.stats.maxSpeed, speed);

        // Chỉ thêm point khi có di chuyển thực sự
        let newRoute = prev.route;
        if (shouldAddPoint) {
          // If the delta is large, interpolate intermediate points to avoid straight-line joins
          const prevLoc = previousLocationRef.current;
          const interpolated: RoutePoint[] = [];

          if (prevLoc) {
            const prevCoords = prevLoc.coords;
            const distanceDelta = calculateDistance(
              prevCoords.latitude,
              prevCoords.longitude,
              coords.latitude,
              coords.longitude
            );

            // create roughly one point every 2 meters for smoother curves, cap segments to avoid huge arrays
            const segmentLength = 2; // meters
            const maxSegments = 50;
            const segments = Math.min(Math.floor(distanceDelta / segmentLength), maxSegments);

            for (let i = 1; i <= segments; i++) {
              const frac = i / (segments + 1);
              const lat = prevCoords.latitude + (coords.latitude - prevCoords.latitude) * frac;
              const lon = prevCoords.longitude + (coords.longitude - prevCoords.longitude) * frac;
              const ts = Math.floor(prevLoc.timestamp + (timestamp - prevLoc.timestamp) * frac);

              interpolated.push({
                latitude: lat,
                longitude: lon,
                speed,
                timestamp: ts,
              });
            }
          }

          newRoute = [
            ...prev.route,
            ...interpolated,
            {
              latitude: coords.latitude,
              longitude: coords.longitude,
              speed,
              timestamp,
              altitude: coords.altitude ?? undefined,
            },
          ];
        }

        return {
          ...prev,
          stats: {
            ...prev.stats,
            distance: newDistance,
            duration: durationInSeconds,
            averageSpeed,
            maxSpeed,
          },
          route: newRoute,
          updatedAt: timestamp,
        };
      });

      previousLocationRef.current = location;
    },
    [calculateDistance]
  );

  const deleteTripFromHistory = useCallback(
    async (tripId: string) => {
      try {
        await db.deleteTrip(tripId);
        console.log(`Deleted trip ${tripId} from database`);

        const updatedHistory = tripHistory.filter((trip) => trip.id !== tripId);
        setTripHistory(updatedHistory);
      } catch (error) {
        console.error('Failed to delete trip from database:', error);

        try {
          const updatedHistory = tripHistory.filter((trip) => trip.id !== tripId);
          await AsyncStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(updatedHistory));
          setTripHistory(updatedHistory);
        } catch (storageError) {
          console.error('Failed to delete from AsyncStorage:', storageError);
        }
      }
    },
    [tripHistory]
  );

  const clearTripHistory = useCallback(async () => {
    try {
      await db.deleteAllTrips();
      console.log('Cleared all trips from database');

      setTripHistory([]);
    } catch (error) {
      console.error('Failed to clear database:', error);

      try {
        await AsyncStorage.removeItem(TRIP_HISTORY_KEY);
        setTripHistory([]);
      } catch (storageError) {
        console.error('Failed to clear AsyncStorage:', storageError);
      }
    }
  }, []);

  // Load trip history after database is ready
  useEffect(() => {
    if (isDbReady) {
      loadTripHistory();
    }
  }, [isDbReady, loadTripHistory]);

  const value: TripContextValue = {
    currentTrip,
    isTracking,
    startTrip,
    pauseTrip,
    resumeTrip,
    stopTrip,
    updateLocation,
    tripHistory,
    loadTripHistory,
    deleteTripFromHistory,
    clearTripHistory,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTripManager(): TripContextValue {
  const context = React.useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTripManager must be used within a TripProvider');
  }
  return context;
}
