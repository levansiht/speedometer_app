import { Magnetometer, MagnetometerMeasurement } from 'expo-sensors';

export type CompassDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface CompassData {
  heading: number; // 0-360 degrees (0 = North)
  direction: CompassDirection;
  accuracy?: number;
}

export type CompassCallback = (data: CompassData) => void;

class CompassServiceClass {
  private subscription: any = null;
  private isAvailable: boolean = false;
  private callback: CompassCallback | null = null;

  async initialize(): Promise<boolean> {
    try {
      this.isAvailable = await Magnetometer.isAvailableAsync();
      return this.isAvailable;
    } catch (error) {
      console.error('Compass initialization error:', error);
      return false;
    }
  }

  startWatching(callback: CompassCallback): void {
    if (!this.isAvailable) {
      console.warn('Compass is not available on this device');
      return;
    }

    this.callback = callback;
    Magnetometer.setUpdateInterval(1000); // Update every second

    this.subscription = Magnetometer.addListener((data: MagnetometerMeasurement) => {
      const heading = this.calculateHeading(data);
      const direction = this.getDirection(heading);

      if (this.callback) {
        this.callback({
          heading,
          direction,
        });
      }
    });
  }

  stopWatching(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.callback = null;
  }

  private calculateHeading(data: MagnetometerMeasurement): number {
    // Calculate angle from magnetometer data
    const { x, y } = data;
    let angle = Math.atan2(y, x) * (180 / Math.PI);

    // Convert to 0-360 degrees (0 = North)
    angle = (angle + 360) % 360;

    // Adjust for device orientation (assuming portrait mode)
    // North should be when device points up
    angle = (angle + 90) % 360;

    return Math.round(angle);
  }

  private getDirection(heading: number): CompassDirection {
    // Divide 360 degrees into 8 sectors (45 degrees each)
    const sector = Math.round(heading / 45) % 8;

    const directions: CompassDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[sector];
  }

  getDirectionName(direction: CompassDirection): string {
    const names: Record<CompassDirection, string> = {
      N: 'Bắc',
      NE: 'Đông Bắc',
      E: 'Đông',
      SE: 'Đông Nam',
      S: 'Nam',
      SW: 'Tây Nam',
      W: 'Tây',
      NW: 'Tây Bắc',
    };
    return names[direction];
  }
}

export const CompassService = new CompassServiceClass();
