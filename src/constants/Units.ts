/**
 * Unit Conversion Constants and Utilities
 */

import { SpeedUnit } from '../types';

// ==================== CONVERSION FACTORS ====================

/**
 * Speed conversion factors
 * Base unit: meters per second (m/s)
 */
export const SPEED_CONVERSION = {
  [SpeedUnit.MS]: 1, // m/s (base)
  [SpeedUnit.KMH]: 3.6, // km/h = m/s * 3.6
  [SpeedUnit.MPH]: 2.23694, // mph = m/s * 2.23694
} as const;

/**
 * Distance conversion factors
 * Base unit: meters (m)
 */
export const DISTANCE_CONVERSION = {
  METER: 1,
  KILOMETER: 0.001,
  MILE: 0.000621371,
  FOOT: 3.28084,
} as const;

/**
 * Time conversion factors
 * Base unit: seconds (s)
 */
export const TIME_CONVERSION = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
} as const;

// ==================== UNIT LABELS ====================

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

// ==================== CONVERSION FUNCTIONS ====================

/**
 * Convert speed from m/s to target unit
 * @param speedMS - Speed in meters per second
 * @param targetUnit - Target speed unit
 * @returns Speed in target unit
 */
export const convertSpeed = (speedMS: number, targetUnit: SpeedUnit = SpeedUnit.KMH): number => {
  return speedMS * SPEED_CONVERSION[targetUnit];
};

/**
 * Convert speed from any unit to m/s
 * @param speed - Speed value
 * @param fromUnit - Source unit
 * @returns Speed in m/s
 */
export const convertSpeedToMS = (speed: number, fromUnit: SpeedUnit = SpeedUnit.KMH): number => {
  return speed / SPEED_CONVERSION[fromUnit];
};

/**
 * Convert distance from meters to kilometers or miles
 * @param meters - Distance in meters
 * @param useImperial - Use miles instead of kilometers
 * @returns Formatted distance with unit
 */
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

/**
 * Format distance with appropriate unit (m or km/mi)
 * @param meters - Distance in meters
 * @param useImperial - Use imperial units
 * @returns Formatted string with unit
 */
export const formatDistance = (meters: number, useImperial: boolean = false): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} ${DISTANCE_UNIT_LABELS.SHORT}`;
  }

  const { value, unit } = convertDistance(meters, useImperial);
  return `${value} ${unit}`;
};

/**
 * Convert duration from seconds to readable format
 * @param seconds - Duration in seconds
 * @returns Object with hours, minutes, seconds
 */
export const convertDuration = (
  seconds: number
): { hours: number; minutes: number; seconds: number } => {
  const hours = Math.floor(seconds / TIME_CONVERSION.HOUR);
  const minutes = Math.floor((seconds % TIME_CONVERSION.HOUR) / TIME_CONVERSION.MINUTE);
  const secs = Math.floor(seconds % TIME_CONVERSION.MINUTE);

  return { hours, minutes, seconds: secs };
};

/**
 * Format duration to readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "1h 23m 45s")
 */
export const formatDuration = (seconds: number): string => {
  const { hours, minutes, seconds: secs } = convertDuration(seconds);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Format speed with unit label
 * @param speed - Speed value
 * @param unit - Speed unit
 * @param decimals - Number of decimal places
 * @returns Formatted string with unit
 */
export const formatSpeed = (
  speed: number,
  unit: SpeedUnit = SpeedUnit.KMH,
  decimals: number = 0
): string => {
  const value = speed.toFixed(decimals);
  const label = SPEED_UNIT_LABELS[unit];
  return `${value} ${label}`;
};

/**
 * Calculate pace (min/km or min/mi) from speed
 * @param speedMS - Speed in m/s
 * @param useImperial - Use miles instead of kilometers
 * @returns Pace in minutes per distance unit
 */
export const calculatePace = (speedMS: number, useImperial: boolean = false): number => {
  if (speedMS === 0) return 0;

  const speedKMH = convertSpeed(speedMS, SpeedUnit.KMH);
  const pace = TIME_CONVERSION.MINUTE / speedKMH; // minutes per km

  if (useImperial) {
    return pace * 1.60934; // minutes per mile
  }

  return pace;
};

/**
 * Format pace to readable string
 * @param speedMS - Speed in m/s
 * @param useImperial - Use imperial units
 * @returns Formatted pace string (e.g., "5:30 /km")
 */
export const formatPace = (speedMS: number, useImperial: boolean = false): string => {
  const pace = calculatePace(speedMS, useImperial);
  const minutes = Math.floor(pace);
  const seconds = Math.floor((pace - minutes) * 60);

  const unit = useImperial ? 'mi' : 'km';
  return `${minutes}:${seconds.toString().padStart(2, '0')} /${unit}`;
};
