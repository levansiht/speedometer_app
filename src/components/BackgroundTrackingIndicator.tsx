import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppState, AppStateStatus } from 'react-native';
import { isBackgroundTrackingActive } from '../services/BackgroundLocationService';

export const BackgroundTrackingIndicator: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [isBackground, setIsBackground] = useState(false);

  useEffect(() => {
    checkTrackingStatus();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    const interval = setInterval(checkTrackingStatus, 3000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  const checkTrackingStatus = async () => {
    const active = await isBackgroundTrackingActive();
    setIsTracking(active);
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    setIsBackground(nextAppState !== 'active');
  };

  if (!isTracking || isBackground) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
      <Text style={styles.text}>Đang theo dõi hành trình (ngầm)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
