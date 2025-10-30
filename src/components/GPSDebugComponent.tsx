import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useCallback, useMemo } from 'react';
import { useLocation, useTheme } from '../hooks';
import { convertSpeed, formatSpeed } from '../constants/Units';
import { SpeedUnit, PermissionStatus } from '../types';
import type { ColorScheme } from '../types/theme';

export function GPSDebugComponent() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    location,
    permission,
    isTracking,
    error,
    isLoading,
    isLocationServicesEnabled,
    requestPermission,
    startTracking,
    stopTracking,
    getCurrentPosition,
  } = useLocation({
    enableMockData: true,
    autoStart: false,
  });

  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
    if (permission === PermissionStatus.GRANTED) {
      Alert.alert('Success', 'Location permission granted!');
    }
  }, [requestPermission, permission]);

  const handleStartTracking = useCallback(async () => {
    await startTracking();
    Alert.alert('Tracking Started', 'GPS tracking is now active');
  }, [startTracking]);

  const handleStopTracking = useCallback(() => {
    stopTracking();
    Alert.alert('Tracking Stopped', 'GPS tracking has been stopped');
  }, [stopTracking]);

  const speedMS = useMemo(() => location?.coords.speed ?? 0, [location]);
  const speedKMH = useMemo(() => convertSpeed(speedMS, SpeedUnit.KMH), [speedMS]);
  const speedMPH = useMemo(() => convertSpeed(speedMS, SpeedUnit.MPH), [speedMS]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎯 PHASE 2: GPS Core Testing</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Status</Text>
        <StatusRow
          label="Permission"
          value={permission}
          color={getStatusColor(permission, colors)}
          styles={styles}
        />
        <StatusRow label="Tracking" value={isTracking ? 'Active' : 'Inactive'} styles={styles} />
        <StatusRow label="Loading" value={isLoading ? 'Yes' : 'No'} styles={styles} />
        <StatusRow
          label="Location Services"
          value={isLocationServicesEnabled ? 'Enabled' : 'Disabled'}
          styles={styles}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎮 Controls</Text>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleRequestPermission}
          disabled={permission === PermissionStatus.GRANTED}
        >
          <Text style={styles.buttonText}>
            {permission === PermissionStatus.GRANTED
              ? '✅ Permission Granted'
              : '🔓 Request Permission'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={handleStartTracking}
          disabled={isTracking || permission !== PermissionStatus.GRANTED}
        >
          <Text style={styles.buttonText}>▶️ Start Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handleStopTracking}
          disabled={!isTracking}
        >
          <Text style={styles.buttonText}>⏹️ Stop Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={getCurrentPosition}
          disabled={permission !== PermissionStatus.GRANTED}
        >
          <Text style={styles.buttonText}>📍 Get Current Position</Text>
        </TouchableOpacity>
      </View>

      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location Data</Text>
          <DataRow label="Latitude" value={location.coords.latitude.toFixed(6)} styles={styles} />
          <DataRow label="Longitude" value={location.coords.longitude.toFixed(6)} styles={styles} />
          <DataRow
            label="Altitude"
            value={location.coords.altitude?.toFixed(2) ?? 'N/A'}
            unit="m"
            styles={styles}
          />
          <DataRow
            label="Accuracy"
            value={location.coords.accuracy?.toFixed(2) ?? 'N/A'}
            unit="m"
            styles={styles}
          />
          <DataRow
            label="Heading"
            value={location.coords.heading?.toFixed(0) ?? 'N/A'}
            unit="°"
            styles={styles}
          />
        </View>
      )}

      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Speed Data</Text>
          <DataRow label="Speed (m/s)" value={speedMS.toFixed(2)} styles={styles} />
          <DataRow label="Speed (km/h)" value={speedKMH.toFixed(2)} highlight styles={styles} />
          <DataRow label="Speed (mph)" value={speedMPH.toFixed(2)} styles={styles} />
          <Text style={styles.speedFormatted}>{formatSpeed(speedMS, SpeedUnit.KMH, 1)}</Text>
        </View>
      )}

      {error && (
        <View style={[styles.section, styles.errorSection]}>
          <Text style={styles.sectionTitle}>⚠️ Error</Text>
          <Text style={styles.errorType}>{error.type}</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Text style={styles.errorTime}>{new Date(error.timestamp).toLocaleTimeString()}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Info</Text>
        <Text style={styles.infoText}>
          🧪 Mock Data: Enabled {'\n'}
          📱 Using simulated GPS data for testing {'\n'}✅ Perfect for iOS Simulator & Android
          Emulator
        </Text>
      </View>
    </ScrollView>
  );
}

interface StatusRowProps {
  label: string;
  value: string;
  color?: string;
  styles: ReturnType<typeof createStyles>;
}

function StatusRow({ label, value, color, styles }: StatusRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={[styles.value, color && { color }]}>{value}</Text>
    </View>
  );
}

interface DataRowProps {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  styles: ReturnType<typeof createStyles>;
}

function DataRow({ label, value, unit, highlight, styles }: DataRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={[styles.value, highlight && styles.highlightValue]}>
        {value} {unit}
      </Text>
    </View>
  );
}

const getStatusColor = (status: PermissionStatus, colors: ColorScheme): string => {
  switch (status) {
    case PermissionStatus.GRANTED:
      return colors.success;
    case PermissionStatus.DENIED:
      return colors.error;
    default:
      return colors.warning;
  }
};

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 20,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    value: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    highlightValue: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: 'bold',
    },
    button: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginBottom: 10,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    successButton: {
      backgroundColor: colors.success,
    },
    warningButton: {
      backgroundColor: colors.warning,
    },
    infoButton: {
      backgroundColor: colors.info,
    },
    buttonText: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    speedFormatted: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginTop: 10,
    },
    errorSection: {
      backgroundColor: colors.error + '10',
      borderColor: colors.error,
    },
    errorType: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.error,
      textTransform: 'uppercase',
    },
    errorMessage: {
      fontSize: 14,
      color: colors.text,
      marginTop: 8,
    },
    errorTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
    },
  });
