export const GPS_CONFIG = {
  UPDATE_INTERVAL: 1000,
  MIN_DISTANCE: 2, 
  ACCURACY: {
    LOW: 100,
    MEDIUM: 50,
    HIGH: 10,
    BEST: 5,
  },
  TIMEOUT: 10000,
} as const;

export const APP_LIMITS = {
  MAX_DISPLAY_SPEED: 300,

  MAX_TRIP_DURATION: 24,

  MAX_ROUTE_POINTS: 10000,

  MAX_HISTORY_TRIPS: 100,
} as const;

export const DEFAULT_SETTINGS = {
  SPEED_UNIT: 'kmh',
  THEME: 'auto',
  SPEED_LIMIT: 80,
  KEEP_SCREEN_ON: true,
  SHOW_COMPASS: true,
  HUD_MODE: false,
  MAP_TYPE: 'standard',
  SOUND_ENABLED: true,
  HAPTIC_ENABLED: true,
} as const;

export const ANIMATION = {
  SHORT: 200,
  MEDIUM: 300,
  LONG: 500,
} as const;

export const STORAGE_KEYS = {
  SETTINGS: '@speedometer:settings',
  CURRENT_TRIP: '@speedometer:current_trip',
  TRIP_HISTORY: '@speedometer:trip_history',
  USER_PREFERENCES: '@speedometer:preferences',
} as const;
