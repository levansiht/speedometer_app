/**
 * Main Speedometer Screen
 * Shows speedometer gauge with auto GPS permission request
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocation } from '../hooks';
import { SpeedometerGauge } from './SpeedometerGauge';
import { Colors } from '../constants';
import { SpeedUnit } from '../types';
import { convertSpeed, formatDistance } from '../constants/Units';

export const SpeedometerScreen: React.FC = () => {
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
    enableMockData: true, // Enable for testing
    autoStart: false,
  });

  // Auto request permission on mount (only once)
  useEffect(() => {
    const initializeGPS = async () => {
      if (permission === 'undetermined') {
        await requestPermission();
      }
    };

    initializeGPS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Auto start tracking after permission granted (only once)
  useEffect(() => {
    if (permission === 'granted' && !isTracking) {
      startTracking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission]); // Only when permission changes

  // Handle permission denied
  useEffect(() => {
    if (permission === 'denied') {
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
  }, [permission]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi GPS', error.message);
    }
  }, [error]);

  const speedMS = location?.coords.speed ?? 0;
  const speedKMH = convertSpeed(speedMS, SpeedUnit.KMH);
  const speedMPH = convertSpeed(speedMS, SpeedUnit.MPH);

  // Calculate some stats (mock for now)
  const averageSpeed = speedKMH * 0.7;
  const maxSpeed = speedKMH * 1.3;
  const distance = 0; // Will be implemented in Phase 4

  // Show loading screen
  if (permission === 'undetermined' || isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Đang khởi tạo GPS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show permission denied screen
  if (permission === 'denied') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorTitle}>Không có quyền truy cập GPS</Text>
          <Text style={styles.errorMessage}>
            Vui lòng cấp quyền truy cập vị trí để sử dụng ứng dụng
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚗 Speedometer</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, isTracking && styles.statusDotActive]} />
          <Text style={styles.statusText}>{isTracking ? 'Tracking' : 'Paused'}</Text>
        </View>
      </View>

      {/* Main Speedometer */}
      <View style={styles.gaugeContainer}>
        <SpeedometerGauge speed={speedMS} maxSpeed={200} unit={SpeedUnit.KMH} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard label="Trung bình" value={averageSpeed.toFixed(0)} unit="km/h" />
        <StatCard label="Tối đa" value={maxSpeed.toFixed(0)} unit="km/h" />
        <StatCard label="Quãng đường" value={formatDistance(distance)} unit="" />
      </View>

      {/* Additional Speed Info */}
      <View style={styles.speedInfo}>
        <SpeedRow label="km/h" value={speedKMH.toFixed(1)} highlight />
        <SpeedRow label="mph" value={speedMPH.toFixed(1)} />
        <SpeedRow label="m/s" value={speedMS.toFixed(2)} />
      </View>

      {/* Control Button */}
      <TouchableOpacity
        style={[styles.controlButton, isTracking && styles.controlButtonStop]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Text style={styles.controlButtonText}>{isTracking ? '⏹️ Dừng' : '▶️ Bắt đầu'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Helper Components
const StatCard: React.FC<{ label: string; value: string; unit: string }> = ({
  label,
  value,
  unit,
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
    {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
  </View>
);

const SpeedRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <View style={styles.speedRow}>
    <Text style={styles.speedLabel}>{label}</Text>
    <Text style={[styles.speedValue, highlight && styles.speedValueHighlight]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
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
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.light.textInverse,
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
    color: Colors.light.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.textSecondary,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: Colors.light.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  statUnit: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  speedInfo: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  speedLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  speedValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  speedValueHighlight: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: 'bold',
  },
  controlButton: {
    backgroundColor: Colors.light.success,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  controlButtonStop: {
    backgroundColor: Colors.light.error,
  },
  controlButtonText: {
    color: Colors.light.textInverse,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
