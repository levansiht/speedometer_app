/**
 * Core Type Definitions for Speedometer App
 */

// ==================== ENUMS ====================

/**
 * Supported speed units
 */
export enum SpeedUnit {
  KMH = 'kmh',
  MPH = 'mph',
  MS = 'ms',
}

/**
 * Trip status states
 */
export enum TripStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

/**
 * Theme modes
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

/**
 * Alert severity levels
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger',
}

// ==================== LOCATION & GPS ====================

/**
 * GPS Coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null; // m/s
}

/**
 * Location data with timestamp
 */
export interface LocationData {
  coords: Coordinates;
  timestamp: number;
}

/**
 * GPS Permission status
 */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

// ==================== SPEED & STATS ====================

/**
 * Current speed information
 */
export interface SpeedData {
  current: number; // Current speed in selected unit
  average: number; // Average speed
  maximum: number; // Maximum speed
  unit: SpeedUnit;
}

/**
 * Trip statistics
 */
export interface TripStats {
  distance: number; // Total distance in meters
  duration: number; // Duration in seconds
  averageSpeed: number; // Average speed in m/s
  maxSpeed: number; // Maximum speed in m/s
  startTime: number; // Unix timestamp
  endTime: number | null; // Unix timestamp
  calories?: number; // Optional: estimated calories burned
}

/**
 * Route point for tracking
 */
export interface RoutePoint {
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  altitude?: number;
}

/**
 * Complete trip record
 */
export interface Trip {
  id: string;
  status: TripStatus;
  stats: TripStats;
  route: RoutePoint[];
  createdAt: number;
  updatedAt: number;
}

// ==================== SETTINGS ====================

/**
 * Speed alert configuration
 */
export interface SpeedAlertConfig {
  enabled: boolean;
  threshold: number; // Speed limit
  unit: SpeedUnit;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

/**
 * App settings
 */
export interface AppSettings {
  speedUnit: SpeedUnit;
  theme: ThemeMode;
  speedAlert: SpeedAlertConfig;
  keepScreenOn: boolean;
  showCompass: boolean;
  hudMode: boolean;
  mapType: 'standard' | 'satellite' | 'hybrid';
}

// ==================== UI COMPONENTS ====================

/**
 * Props for speed display component
 */
export interface SpeedDisplayProps {
  speed: number;
  unit: SpeedUnit;
  maxSpeed?: number;
}

/**
 * Props for stats card
 */
export interface StatsCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: string;
}

/**
 * Alert data
 */
export interface Alert {
  id: string;
  type: AlertLevel;
  message: string;
  timestamp: number;
  dismissed: boolean;
}

// ==================== ERRORS ====================

/**
 * GPS Error types
 */
export enum GPSErrorType {
  PERMISSION_DENIED = 'permission_denied',
  LOCATION_UNAVAILABLE = 'location_unavailable',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * GPS Error
 */
export interface GPSError {
  type: GPSErrorType;
  message: string;
  timestamp: number;
}

// ==================== EXPORT & IMPORT ====================

/**
 * Export format
 */
export enum ExportFormat {
  GPX = 'gpx',
  JSON = 'json',
  KML = 'kml',
}

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeStats: boolean;
  includeRoute: boolean;
  filename?: string;
}
