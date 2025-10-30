import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../hooks';

interface SpeedAlertBannerProps {
  isActive: boolean;
  currentSpeed: number;
  threshold: number;
}

export function SpeedAlertBanner({ isActive, currentSpeed, threshold }: SpeedAlertBannerProps) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasTriggeredHaptic = useRef(false);

  useEffect(() => {
    if (isActive) {
      hasTriggeredHaptic.current = true;

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      hasTriggeredHaptic.current = false;
    }
  }, [isActive, pulseAnim]);

  if (!isActive) return null;

  const speedOver = Math.round(currentSpeed - threshold);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.error, transform: [{ scale: pulseAnim }] },
      ]}
    >
      <View style={styles.content}>
        <Text variant="h3" color="inverse" style={styles.title}>
          ⚠️ VƯỢT TỐC ĐỘ!
        </Text>
        <Text variant="body" color="inverse" style={styles.message}>
          Bạn đang chạy vượt {speedOver} km/h so với giới hạn {threshold} km/h
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
});
