export type ThemeName = 'light' | 'dark' | 'auto';

export interface ColorScheme {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  accentDark: string;
  accentLight: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  speedLow: string;
  speedMedium: string;
  speedHigh: string;
  speedDanger: string;
  border: string;
  divider: string;
  overlay: string;
  overlayLight: string;
}

export interface ThemeContextValue {
  theme: ThemeName;
  colors: ColorScheme;
  isDark: boolean;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}
