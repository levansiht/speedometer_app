/**
 * Color Constants for Speedometer App
 * Supports Light and Dark themes
 */

export const Colors = {
  light: {
    // Primary colors
    primary: '#2196F3',
    primaryDark: '#1976D2',
    primaryLight: '#BBDEFB',

    // Accent colors
    accent: '#FF5722',
    accentDark: '#E64A19',
    accentLight: '#FFCCBC',

    // Background
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    backgroundTertiary: '#E0E0E0',

    // Surface
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',

    // Text
    text: '#212121',
    textSecondary: '#757575',
    textTertiary: '#9E9E9E',
    textInverse: '#FFFFFF',

    // Status colors
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    info: '#2196F3',

    // Speed colors (gradient)
    speedLow: '#4CAF50',
    speedMedium: '#FFC107',
    speedHigh: '#FF9800',
    speedDanger: '#F44336',

    // Border & divider
    border: '#E0E0E0',
    divider: '#BDBDBD',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',
  },

  dark: {
    // Primary colors
    primary: '#64B5F6',
    primaryDark: '#42A5F5',
    primaryLight: '#90CAF9',

    // Accent colors
    accent: '#FF7043',
    accentDark: '#FF5722',
    accentLight: '#FFAB91',

    // Background
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    backgroundTertiary: '#2C2C2C',

    // Surface
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',

    // Text
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textTertiary: '#808080',
    textInverse: '#121212',

    // Status colors
    success: '#66BB6A',
    warning: '#FFD54F',
    error: '#EF5350',
    info: '#64B5F6',

    // Speed colors (gradient)
    speedLow: '#66BB6A',
    speedMedium: '#FFD54F',
    speedHigh: '#FFB74D',
    speedDanger: '#EF5350',

    // Border & divider
    border: '#2C2C2C',
    divider: '#404040',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
  },
} as const;

/**
 * Color type helper
 */
export type ColorScheme = typeof Colors.light;
export type ThemeColors = 'light' | 'dark';

/**
 * Get speed color based on value
 * @param speed - Current speed
 * @param maxSpeed - Maximum speed threshold
 * @param theme - Current theme
 */
export const getSpeedColor = (
  speed: number,
  maxSpeed: number,
  theme: ThemeColors = 'light'
): string => {
  const colors = Colors[theme];
  const percentage = (speed / maxSpeed) * 100;

  if (percentage < 25) return colors.speedLow;
  if (percentage < 50) return colors.speedMedium;
  if (percentage < 75) return colors.speedHigh;
  return colors.speedDanger;
};

/**
 * Opacity helper
 */
export const withOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
};
