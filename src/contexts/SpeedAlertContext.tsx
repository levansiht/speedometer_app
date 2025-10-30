import React, { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpeedUnit } from '../types';

const SPEED_ALERT_KEY = '@speedometer_speed_alert';

interface SpeedAlertConfig {
  enabled: boolean;
  threshold: number;
  unit: SpeedUnit;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

interface SpeedAlertContextValue {
  config: SpeedAlertConfig;
  isAlertActive: boolean;
  updateConfig: (config: Partial<SpeedAlertConfig>) => Promise<void>;
  checkSpeed: (currentSpeed: number) => void;
}

const defaultConfig: SpeedAlertConfig = {
  enabled: false,
  threshold: 80,
  unit: SpeedUnit.KMH,
  soundEnabled: true,
  hapticEnabled: true,
};

const SpeedAlertContext = createContext<SpeedAlertContextValue | undefined>(undefined);

interface SpeedAlertProviderProps {
  children: React.ReactNode;
}

export function SpeedAlertProvider({ children }: SpeedAlertProviderProps) {
  const [config, setConfig] = useState<SpeedAlertConfig>(defaultConfig);
  const [isAlertActive, setIsAlertActive] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await AsyncStorage.getItem(SPEED_ALERT_KEY);
        if (stored) {
          const loadedConfig = JSON.parse(stored) as SpeedAlertConfig;
          setConfig(loadedConfig);
        }
      } catch (error) {
        console.error('Failed to load speed alert config:', error);
      }
    };

    loadConfig();
  }, []);

  const updateConfig = useCallback(
    async (updates: Partial<SpeedAlertConfig>) => {
      const newConfig = { ...config, ...updates };
      setConfig(newConfig);

      try {
        await AsyncStorage.setItem(SPEED_ALERT_KEY, JSON.stringify(newConfig));
      } catch (error) {
        console.error('Failed to save speed alert config:', error);
      }
    },
    [config]
  );

  const checkSpeed = useCallback(
    (currentSpeed: number) => {
      if (!config.enabled) {
        setIsAlertActive(false);
        return;
      }

      const speedKMH = currentSpeed * 3.6;

      if (speedKMH > config.threshold) {
        setIsAlertActive(true);
      } else {
        setIsAlertActive(false);
      }
    },
    [config.enabled, config.threshold]
  );

  const value: SpeedAlertContextValue = {
    config,
    isAlertActive,
    updateConfig,
    checkSpeed,
  };

  return <SpeedAlertContext.Provider value={value}>{children}</SpeedAlertContext.Provider>;
}

export function useSpeedAlert(): SpeedAlertContextValue {
  const context = React.useContext(SpeedAlertContext);
  if (context === undefined) {
    throw new Error('useSpeedAlert must be used within a SpeedAlertProvider');
  }
  return context;
}
