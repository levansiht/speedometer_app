import { SpeedUnit } from '../types';
export const SPEED_CONVERSION = {
  [SpeedUnit.MS]: 1, 
  [SpeedUnit.KMH]: 3.6, 
  [SpeedUnit.MPH]: 2.23694,
} as const;
export const DISTANCE_CONVERSION = {
  METER: 1,
  KILOMETER: 0.001,
  MILE: 0.000621371,
  FOOT: 3.28084,
} as const;

export const TIME_CONVERSION = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
} as const;

export const SPEED_UNIT_LABELS = {
  [SpeedUnit.KMH]: 'km/h',
  [SpeedUnit.MPH]: 'mph',
  [SpeedUnit.MS]: 'm/s',
} as const;

export const DISTANCE_UNIT_LABELS = {
  METRIC: 'km',
  IMPERIAL: 'mi',
  SHORT: 'm',
} as const;

export const convertSpeed = (speedMS: number, targetUnit: SpeedUnit = SpeedUnit.KMH): number => {
  return speedMS * SPEED_CONVERSION[targetUnit];
};

export const convertSpeedToMS = (speed: number, fromUnit: SpeedUnit = SpeedUnit.KMH): number => {
  return speed / SPEED_CONVERSION[fromUnit];
};

export const convertDistance = (
  meters: number,
  useImperial: boolean = false
): { value: number; unit: string } => {
  if (useImperial) {
    const miles = meters * DISTANCE_CONVERSION.MILE;
    return {
      value: parseFloat(miles.toFixed(2)),
      unit: DISTANCE_UNIT_LABELS.IMPERIAL,
    };
  }

  const kilometers = meters * DISTANCE_CONVERSION.KILOMETER;
  return {
    value: parseFloat(kilometers.toFixed(2)),
    unit: DISTANCE_UNIT_LABELS.METRIC,
  };
};


export const formatDistance = (meters: number, useImperial: boolean = false): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} ${DISTANCE_UNIT_LABELS.SHORT}`;
  }

  const { value, unit } = convertDistance(meters, useImperial);
  return `${value} ${unit}`;
};

export const convertDuration = (
  seconds: number
): { hours: number; minutes: number; seconds: number } => {
  const hours = Math.floor(seconds / TIME_CONVERSION.HOUR);
  const minutes = Math.floor((seconds % TIME_CONVERSION.HOUR) / TIME_CONVERSION.MINUTE);
  const secs = Math.floor(seconds % TIME_CONVERSION.MINUTE);

  return { hours, minutes, seconds: secs };
};

export const formatDuration = (seconds: number): string => {
  const { hours, minutes, seconds: secs } = convertDuration(seconds);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

export const formatSpeed = (
  speed: number,
  unit: SpeedUnit = SpeedUnit.KMH,
  decimals: number = 0
): string => {
  const value = speed.toFixed(decimals);
  const label = SPEED_UNIT_LABELS[unit];
  return `${value} ${label}`;
};

export const calculatePace = (speedMS: number, useImperial: boolean = false): number => {
  if (speedMS === 0) return 0;

  const speedKMH = convertSpeed(speedMS, SpeedUnit.KMH);
  const pace = TIME_CONVERSION.MINUTE / speedKMH;

  if (useImperial) {
    return pace * 1.60934; 
  }

  return pace;
};

export const formatPace = (speedMS: number, useImperial: boolean = false): string => {
  const pace = calculatePace(speedMS, useImperial);
  const minutes = Math.floor(pace);
  const seconds = Math.floor((pace - minutes) * 60);

  const unit = useImperial ? 'mi' : 'km';
  return `${minutes}:${seconds.toString().padStart(2, '0')} /${unit}`;
};
