

// GPS Settings
export const GPS_CONFIG = {
  // Update interval in milliseconds
  UPDATE_INTERVAL: 1000,

  // Minimum distance between updates (meters)
  MIN_DISTANCE: 5,

  // GPS accuracy levels
  ACCURACY: {
    LOW: 100, // meters
    MEDIUM: 50,
    HIGH: 10,
    BEST: 5,
  },

  // Timeout for GPS requests (milliseconds)
  TIMEOUT: 10000,
} as const;

// App Limits
export const APP_LIMITS = {
  // Maximum speed (km/h) for display
  MAX_DISPLAY_SPEED: 300,

  // Maximum trip duration (hours)
  MAX_TRIP_DURATION: 24,

  // Maximum route points to store
  MAX_ROUTE_POINTS: 10000,

  // Maximum trips to keep in history
  MAX_HISTORY_TRIPS: 100,
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  SPEED_UNIT: 'kmh',
  THEME: 'auto',
  SPEED_LIMIT: 80, // km/h
  KEEP_SCREEN_ON: true,
  SHOW_COMPASS: true,
  HUD_MODE: false,
  MAP_TYPE: 'standard',
  SOUND_ENABLED: true,
  HAPTIC_ENABLED: true,
} as const;

// Animation Durations (milliseconds)
export const ANIMATION = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 500,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SETTINGS: '@speedometer:settings',
  CURRENT_TRIP: '@speedometer:current_trip',
  TRIP_HISTORY: '@speedometer:trip_history',
  USER_PREFERENCES: '@speedometer:preferences',
} as const;
