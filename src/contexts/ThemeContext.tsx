import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants';
import { ThemeContextValue, ThemeName } from '../types/theme';

const THEME_STORAGE_KEY = '@speedometer:theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeName>(ThemeName.AUTO);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && Object.values(ThemeName).includes(savedTheme as ThemeName)) {
        setThemeState(savedTheme as ThemeName);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const saveTheme = async (newTheme: ThemeName) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((current) => {
      if (current === ThemeName.LIGHT) return ThemeName.DARK;
      if (current === ThemeName.DARK) return ThemeName.LIGHT;
      return ThemeName.LIGHT;
    });
  };

  const getActiveTheme = (): 'light' | 'dark' => {
    if (theme === ThemeName.AUTO) {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return theme === ThemeName.LIGHT ? 'light' : 'dark';
  };

  const activeTheme = getActiveTheme();
  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  const value: ThemeContextValue = {
    theme,
    colors,
    isDark,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
