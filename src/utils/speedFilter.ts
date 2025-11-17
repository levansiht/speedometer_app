import { KalmanFilter } from './kalmanFilter';
import { EMAFilter } from './emaFilter';

export class SpeedFilter {
  private kalmanFilter: KalmanFilter;
  private emaFilter: EMAFilter;
  
  private readonly MAX_SPEED_JUMP = 10;
  private readonly MAX_DISTANCE_JUMP = 10;
  private readonly MAX_ACCURACY = 50;
  private readonly MIN_SPEED_THRESHOLD = 0.2;
  private readonly MAX_REALISTIC_SPEED = 55.5;

  private lastSpeed: number = 0;
  private lastLocation: { lat: number; lon: number; time: number } | null = null;
  private lastFilteredSpeed: number = 0;

  constructor() {
    this.kalmanFilter = new KalmanFilter();
    this.emaFilter = new EMAFilter(0.4);
  }

  filter(
    rawSpeed: number,
    accuracy: number | null = null,
    currentLocation: { latitude: number; longitude: number } | null = null,
    timestamp: number | null = null
  ): number {
    let speed = Math.max(0, rawSpeed);

    if (accuracy !== null && accuracy > this.MAX_ACCURACY) {
      console.log(`[SpeedFilter] Poor accuracy (${accuracy.toFixed(1)}m), using last filtered speed`);
      return this.lastFilteredSpeed;
    }

    if (this.lastSpeed > 0) {
      const speedDelta = Math.abs(speed - this.lastSpeed);
      if (speedDelta > this.MAX_SPEED_JUMP) {
        console.log(`[SpeedFilter] Speed jump detected (${speedDelta.toFixed(1)} m/s), rejecting`);
        return this.lastFilteredSpeed;
      }
    }

    if (currentLocation && this.lastLocation && timestamp && this.lastLocation.time) {
      const timeDelta = (timestamp - this.lastLocation.time) / 1000;
      if (timeDelta > 0 && timeDelta < 0.1) {
        const distance = this.calculateHaversineDistance(
          this.lastLocation.lat,
          this.lastLocation.lon,
          currentLocation.latitude,
          currentLocation.longitude
        );
        
        if (distance > this.MAX_DISTANCE_JUMP) {
          console.log(`[SpeedFilter] GPS jump detected (${distance.toFixed(1)}m in ${(timeDelta * 1000).toFixed(0)}ms), rejecting`);
          return this.lastFilteredSpeed;
        }
      }
    }

    if (speed > this.MAX_REALISTIC_SPEED) {
      console.log(`[SpeedFilter] Unrealistic speed (${speed.toFixed(1)} m/s), clamping to max`);
      speed = this.MAX_REALISTIC_SPEED;
    }

    const kalmanSpeed = this.kalmanFilter.filter(speed);
    const emaSpeed = this.emaFilter.filter(kalmanSpeed);

    let finalSpeed = emaSpeed;
    if (finalSpeed < this.MIN_SPEED_THRESHOLD) {
      finalSpeed = 0;
    }

    this.lastSpeed = speed;
    this.lastFilteredSpeed = finalSpeed;
    if (currentLocation && timestamp) {
      this.lastLocation = {
        lat: currentLocation.latitude,
        lon: currentLocation.longitude,
        time: timestamp,
      };
    }

    return finalSpeed;
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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
  }

  reset(): void {
    this.kalmanFilter.reset();
    this.emaFilter.reset();
    this.lastSpeed = 0;
    this.lastLocation = null;
    this.lastFilteredSpeed = 0;
  }

  getCurrentSpeed(): number {
    return this.lastFilteredSpeed;
  }
}

export const speedFilter = new SpeedFilter();
