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
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const hasTriggeredHaptic = useRef(false);
  const isVisible = useRef(false);

  useEffect(() => {
    if (isActive) {
      hasTriggeredHaptic.current = true;
      isVisible.current = true;

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isVisible.current = false;
      });

      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      hasTriggeredHaptic.current = false;
    }
  }, [isActive, pulseAnim, slideAnim, opacityAnim]);

  if (!isActive && !isVisible.current) return null;

  const speedOver = Math.round(currentSpeed - threshold);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.error,
          transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="h3" color="inverse" style={styles.title}>
            ⚠️ VƯỢT TỐC ĐỘ!
          </Text>
        </View>

        <View style={styles.speedComparison}>
          <View style={styles.speedBox}>
            <Text variant="caption" color="inverse" style={styles.speedLabel}>
              Tốc độ hiện tại
            </Text>
            <Text variant="displayLarge" color="inverse" style={styles.speedValue}>
              {Math.round(currentSpeed)}
            </Text>
            <Text variant="bodySmall" color="inverse" style={styles.speedUnit}>
              km/h
            </Text>
          </View>

          <View style={styles.divider}>
            <Text variant="h2" color="inverse" style={styles.dividerText}>
              →
            </Text>
          </View>

          <View style={styles.speedBox}>
            <Text variant="caption" color="inverse" style={styles.speedLabel}>
              Giới hạn
            </Text>
            <Text variant="displayLarge" color="inverse" style={styles.speedValue}>
              {threshold}
            </Text>
            <Text variant="bodySmall" color="inverse" style={styles.speedUnit}>
              km/h
            </Text>
          </View>
        </View>

        <View style={[styles.overSpeedBadge, { backgroundColor: colors.background }]}>
          <Text variant="bodySmall" style={{ color: colors.error, fontWeight: 'bold' }}>
            Vượt {speedOver} km/h
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 1000,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  speedComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  speedBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 90,
  },
  speedLabel: {
    fontSize: 10,
    opacity: 0.9,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  speedValue: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  speedUnit: {
    fontSize: 11,
    opacity: 0.9,
    marginTop: 2,
  },
  divider: {
    paddingHorizontal: 8,
  },
  dividerText: {
    opacity: 0.7,
  },
  overSpeedBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  message: {
    textAlign: 'center',
  },
});
