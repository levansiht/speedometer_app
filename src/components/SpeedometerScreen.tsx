import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation, useTheme, useTripManager, useSpeedAlert } from '../hooks';
import { SpeedometerGauge } from './SpeedometerGauge';
import { SpeedAlertBanner } from './SpeedAlertBanner';
import { Text } from './Text';
import { SpeedUnit, PermissionStatus, TripStatus } from '../types';
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
    error,
    isLoading,
    requestPermission,
    startTracking: startGPSTracking,
  } = useLocation({
    enableMockData: true,
    autoStart: false,
  });

  const { currentTrip, startTrip, pauseTrip, resumeTrip, stopTrip, updateLocation } =
    useTripManager();

  const { config: alertConfig, isAlertActive, checkSpeed } = useSpeedAlert();

  const hasRequestedPermission = useRef(false);
  const hasStartedGPS = useRef(false);

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
    if (permission === PermissionStatus.GRANTED && !hasStartedGPS.current) {
      hasStartedGPS.current = true;
      startGPSTracking();
    }
  }, [permission, startGPSTracking]);

  useEffect(() => {
    if (location && currentTrip?.status === TripStatus.RUNNING) {
      updateLocation(location);
    }
  }, [location, currentTrip?.status, updateLocation]);

  useEffect(() => {
    if (location && alertConfig.enabled) {
      const speedMS = location.coords.speed ?? 0;
      checkSpeed(speedMS);
    }
  }, [location, alertConfig.enabled, checkSpeed]);

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

  const tripStats = useMemo(() => {
    if (!currentTrip) {
      return {
        distance: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        duration: 0,
      };
    }

    return {
      distance: currentTrip.stats.distance,
      averageSpeed: convertSpeed(currentTrip.stats.averageSpeed, SpeedUnit.KMH),
      maxSpeed: convertSpeed(currentTrip.stats.maxSpeed, SpeedUnit.KMH),
      duration: currentTrip.stats.duration,
    };
  }, [currentTrip]);

  const tripStatus = currentTrip?.status ?? TripStatus.IDLE;
  const isRunning = tripStatus === TripStatus.RUNNING;

  const handleRetry = useCallback(() => {
    requestPermission();
  }, [requestPermission]);

  const handleStartTrip = useCallback(() => {
    startTrip();
  }, [startTrip]);

  const handlePauseTrip = useCallback(() => {
    pauseTrip();
  }, [pauseTrip]);

  const handleResumeTrip = useCallback(() => {
    resumeTrip();
  }, [resumeTrip]);

  const handleStopTrip = useCallback(async () => {
    Alert.alert('Kết thúc chuyến đi', 'Bạn có chắc muốn kết thúc chuyến đi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Kết thúc',
        style: 'destructive',
        onPress: async () => {
          await stopTrip();
          Alert.alert('Thành công', 'Chuyến đi đã được lưu vào lịch sử');
        },
      },
    ]);
  }, [stopTrip]);

  if (permission === PermissionStatus.UNDETERMINED || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Đang khởi tạo GPS...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (permission === PermissionStatus.DENIED) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text variant="h3" color="primary" style={styles.errorTitle}>
            Không có quyền truy cập GPS
          </Text>
          <Text variant="body" color="secondary" style={styles.errorMessage}>
            Vui lòng cấp quyền truy cập vị trí để sử dụng ứng dụng
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text variant="button" color="inverse">
              Thử lại
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <Text variant="h2" color="primary">
            🚗 Speedometer
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.themeButton} onPress={handleToggleTheme}>
              <Text style={styles.themeButtonText}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, isRunning && styles.statusDotActive]} />
              <Text variant="caption" color="secondary" style={styles.statusText}>
                {tripStatus === TripStatus.RUNNING
                  ? 'Recording'
                  : tripStatus === TripStatus.PAUSED
                  ? 'Paused'
                  : 'Ready'}
              </Text>
            </View>
          </View>
        </View>

        {/* Alert Banner - Absolute positioned, won't affect layout */}
        <SpeedAlertBanner
          isActive={isAlertActive}
          currentSpeed={speedKMH}
          threshold={alertConfig.threshold}
        />

        <View style={styles.gaugeContainer}>
          <SpeedometerGauge speed={speedMS} maxSpeed={200} unit={SpeedUnit.KMH} />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            label="Trung bình"
            value={tripStats.averageSpeed.toFixed(0)}
            unit="km/h"
            styles={styles}
          />
          <StatCard
            label="Tối đa"
            value={tripStats.maxSpeed.toFixed(0)}
            unit="km/h"
            styles={styles}
          />
          <StatCard
            label="Quãng đường"
            value={formatDistance(tripStats.distance)}
            unit=""
            styles={styles}
          />
        </View>

        <View style={styles.speedInfo}>
          <SpeedRow label="km/h" value={speedKMH.toFixed(1)} highlight styles={styles} />
          <SpeedRow label="mph" value={speedMPH.toFixed(1)} styles={styles} />
          <SpeedRow label="m/s" value={speedMS.toFixed(2)} styles={styles} />
        </View>

        <View style={styles.tripControls}>
          {tripStatus === TripStatus.IDLE && (
            <TouchableOpacity style={styles.controlButton} onPress={handleStartTrip}>
              <Text variant="buttonLarge" color="inverse">
                ▶️ Bắt đầu chuyến đi
              </Text>
            </TouchableOpacity>
          )}

          {tripStatus === TripStatus.RUNNING && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.controlButton, styles.controlButtonPause, styles.buttonInRow]}
                onPress={handlePauseTrip}
              >
                <Text variant="button" color="inverse">
                  ⏸️ Tạm dừng
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.controlButtonStop, styles.buttonInRow]}
                onPress={handleStopTrip}
              >
                <Text variant="button" color="inverse">
                  ⏹️ Kết thúc
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {tripStatus === TripStatus.PAUSED && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.controlButton, styles.controlButtonResume, styles.buttonInRow]}
                onPress={handleResumeTrip}
              >
                <Text variant="button" color="inverse">
                  ▶️ Tiếp tục
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.controlButtonStop, styles.buttonInRow]}
                onPress={handleStopTrip}
              >
                <Text variant="button" color="inverse">
                  ⏹️ Kết thúc
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <Text variant="h4" color="primary" style={styles.statValue}>
        {value}
      </Text>
      {unit ? (
        <Text variant="caption" color="secondary">
          {unit}
        </Text>
      ) : null}
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
      <Text variant="bodySmall" color="secondary" style={styles.speedLabel}>
        {label}
      </Text>
      <Text
        variant={highlight ? 'subtitle1' : 'bodySmall'}
        color={highlight ? 'primary' : undefined}
        style={styles.speedValue}
      >
        {value}
      </Text>
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
      marginBottom: 8,
      textAlign: 'center',
    },
    errorMessage: {
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
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
      fontWeight: '600',
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
    statValue: {
      marginVertical: 4,
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
      fontWeight: '600',
    },
    speedValue: {
      fontWeight: '600',
    },
    tripControls: {
      marginHorizontal: 20,
      marginTop: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    controlButton: {
      backgroundColor: colors.success,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      minHeight: 56,
    },
    buttonInRow: {
      flex: 1,
    },
    controlButtonPause: {
      backgroundColor: colors.warning,
    },
    controlButtonResume: {
      backgroundColor: colors.success,
    },
    controlButtonStop: {
      backgroundColor: colors.error,
    },
  });
