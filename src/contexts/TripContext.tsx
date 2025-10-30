import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, TripStatus, RoutePoint, LocationData } from '../types';

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

  const previousLocationRef = useRef<LocationData | null>(null);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number | null>(null);

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

  const startTrip = useCallback(() => {
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
  }, []);

  const pauseTrip = useCallback(() => {
    if (!currentTrip || currentTrip.status !== 'running') return;

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

  const stopTrip = useCallback(async () => {
    if (!currentTrip) return;

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

    try {
      const history = await AsyncStorage.getItem(TRIP_HISTORY_KEY);
      const historyArray: Trip[] = history ? JSON.parse(history) : [];

      const updatedHistory = [finalTrip, ...historyArray].slice(0, MAX_HISTORY_ITEMS);

      await AsyncStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(updatedHistory));
      setTripHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to save trip to history:', error);
    }

    setCurrentTrip(null);
    setIsTracking(false);
    previousLocationRef.current = null;
    pausedDurationRef.current = 0;
    pauseStartTimeRef.current = null;
  }, [currentTrip]);

  const updateLocation = useCallback(
    (location: LocationData) => {
      const { coords, timestamp } = location;
      const speed = coords.speed ?? 0;

      const routePoint: RoutePoint = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        speed,
        timestamp,
        altitude: coords.altitude ?? undefined,
      };

      setCurrentTrip((prev) => {
        if (!prev || prev.status !== 'running') return prev;

        let newDistance = prev.stats.distance;

        if (previousLocationRef.current) {
          const prevCoords = previousLocationRef.current.coords;
          const distanceDelta = calculateDistance(
            prevCoords.latitude,
            prevCoords.longitude,
            coords.latitude,
            coords.longitude
          );

          if (distanceDelta > 5) {
            newDistance += distanceDelta;
          }
        }

        const totalElapsedTime = timestamp - prev.stats.startTime;
        const activeDuration = Math.max(0, totalElapsedTime - pausedDurationRef.current);
        const durationInSeconds = Math.floor(activeDuration / 1000);

        const averageSpeed = durationInSeconds > 0 ? newDistance / durationInSeconds : 0;

        const maxSpeed = Math.max(prev.stats.maxSpeed, speed);

        const newRoute = [...prev.route, routePoint];

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

  const loadTripHistory = useCallback(async () => {
    try {
      const history = await AsyncStorage.getItem(TRIP_HISTORY_KEY);
      if (history) {
        const historyArray: Trip[] = JSON.parse(history);
        setTripHistory(historyArray);
      }
    } catch (error) {
      console.error('Failed to load trip history:', error);
    }
  }, []);

  const deleteTripFromHistory = useCallback(
    async (tripId: string) => {
      try {
        const updatedHistory = tripHistory.filter((trip) => trip.id !== tripId);
        await AsyncStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(updatedHistory));
        setTripHistory(updatedHistory);
      } catch (error) {
        console.error('Failed to delete trip from history:', error);
      }
    },
    [tripHistory]
  );

  const clearTripHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(TRIP_HISTORY_KEY);
      setTripHistory([]);
    } catch (error) {
      console.error('Failed to clear trip history:', error);
    }
  }, []);

  useEffect(() => {
    loadTripHistory();
  }, [loadTripHistory]);

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
