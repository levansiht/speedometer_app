type Coordinate = {
  latitude: number;
  longitude: number;
};

type TimedCoordinate = Coordinate & {
  timestamp: number;
};

let previousLocation: TimedCoordinate | null = null;

export function calculateSpeedFromDelta(
  currentLocation: Coordinate,
  currentTimestamp: number
): number {
  if (!previousLocation) {
    previousLocation = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: currentTimestamp,
    };
    return 0;
  }

  const timeDelta = (currentTimestamp - previousLocation.timestamp) / 1000;
  if (timeDelta <= 0) {
    return 0;
  }

  const distance = calculateDistance(previousLocation, currentLocation);
  const speed = distance / timeDelta;

  previousLocation = {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    timestamp: currentTimestamp,
  };

  return speed;
}

export function calculateDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const R = 6371e3;
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function resetSpeedCalculationState(): void {
  previousLocation = null;
}

