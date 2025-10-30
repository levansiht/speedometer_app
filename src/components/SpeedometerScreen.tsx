import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation, useTheme } from '../hooks';
import { SpeedometerGauge } from './SpeedometerGauge';
import { SpeedUnit, PermissionStatus } from '../types';
import type { ColorScheme } from '../types/theme';
import { convertSpeed, formatDistance } from '../constants/Units';

export function SpeedometerScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleToggleTheme = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      toggleTheme();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, toggleTheme]);

  const {
    location,
    permission,
    isTracking,
    error,
    isLoading,
    requestPermission,
    startTracking,
    stopTracking,
  } = useLocation({
    enableMockData: true,
    autoStart: false,
  });

  const hasRequestedPermission = useRef(false);
  const hasStartedTracking = useRef(false);

  useEffect(() => {
    const initializeGPS = async () => {
      if (permission === PermissionStatus.UNDETERMINED && !hasRequestedPermission.current) {
        hasRequestedPermission.current = true;
        await requestPermission();
      }
    };

    initializeGPS();
  }, [permission, requestPermission]);

  useEffect(() => {
    if (permission === PermissionStatus.GRANTED && !isTracking && !hasStartedTracking.current) {
      hasStartedTracking.current = true;
      startTracking();
    }
  }, [permission, isTracking, startTracking]);

  useEffect(() => {
    if (permission === PermissionStatus.DENIED) {
      Alert.alert(
        'Quyền truy cập vị trí',
        'Ứng dụng cần quyền truy cập GPS để đo tốc độ. Vui lòng cấp quyền trong Cài đặt.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Thử lại',
            onPress: requestPermission,
          },
        ]
      );
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi GPS', error.message);
    }
  }, [error]);

  const speedMS = location?.coords.speed ?? 0;
  const speedKMH = useMemo(() => convertSpeed(speedMS, SpeedUnit.KMH), [speedMS]);
  const speedMPH = useMemo(() => convertSpeed(speedMS, SpeedUnit.MPH), [speedMS]);

  const averageSpeed = useMemo(() => speedKMH * 0.7, [speedKMH]);
  const maxSpeed = useMemo(() => speedKMH * 1.3, [speedKMH]);
  const distance = 0;

  const handleRetry = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  const handleToggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, stopTracking, startTracking]);

  if (permission === PermissionStatus.UNDETERMINED || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang khởi tạo GPS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (permission === PermissionStatus.DENIED) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorTitle}>Không có quyền truy cập GPS</Text>
          <Text style={styles.errorMessage}>
            Vui lòng cấp quyền truy cập vị trí để sử dụng ứng dụng
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.title}>🚗 Speedometer</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.themeButton} onPress={handleToggleTheme}>
              <Text style={styles.themeButtonText}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, isTracking && styles.statusDotActive]} />
              <Text style={styles.statusText}>{isTracking ? 'Tracking' : 'Paused'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.gaugeContainer}>
          <SpeedometerGauge speed={speedMS} maxSpeed={200} unit={SpeedUnit.KMH} />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            label="Trung bình"
            value={averageSpeed.toFixed(0)}
            unit="km/h"
            styles={styles}
          />
          <StatCard label="Tối đa" value={maxSpeed.toFixed(0)} unit="km/h" styles={styles} />
          <StatCard label="Quãng đường" value={formatDistance(distance)} unit="" styles={styles} />
        </View>

        <View style={styles.speedInfo}>
          <SpeedRow label="km/h" value={speedKMH.toFixed(1)} highlight styles={styles} />
          <SpeedRow label="mph" value={speedMPH.toFixed(1)} styles={styles} />
          <SpeedRow label="m/s" value={speedMS.toFixed(2)} styles={styles} />
        </View>

        <TouchableOpacity
          style={[styles.controlButton, isTracking && styles.controlButtonStop]}
          onPress={handleToggleTracking}
        >
          <Text style={styles.controlButtonText}>{isTracking ? '⏹️ Dừng' : '▶️ Bắt đầu'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Animated.View>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  styles: ReturnType<typeof createStyles>;
}

function StatCard({ label, value, unit, styles }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
    </View>
  );
}

interface SpeedRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  styles: ReturnType<typeof createStyles>;
}

function SpeedRow({ label, value, highlight, styles }: SpeedRowProps) {
  return (
    <View style={styles.speedRow}>
      <Text style={styles.speedLabel}>{label}</Text>
      <Text style={[styles.speedValue, highlight && styles.speedValueHighlight]}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    themeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeButtonText: {
      fontSize: 20,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textSecondary,
      marginRight: 6,
    },
    statusDotActive: {
      backgroundColor: colors.success,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    gaugeContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statUnit: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    speedInfo: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    speedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    speedLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    speedValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    speedValueHighlight: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: 'bold',
    },
    controlButton: {
      backgroundColor: colors.success,
      marginHorizontal: 20,
      marginTop: 20,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    controlButtonStop: {
      backgroundColor: colors.error,
    },
    controlButtonText: {
      color: colors.textInverse,
      fontSize: 18,
      fontWeight: 'bold',
    },
  });
