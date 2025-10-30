import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocation } from '../hooks';
import { Colors } from '../constants';
import { convertSpeed, formatSpeed } from '../constants/Units';
import { SpeedUnit, PermissionStatus } from '../types';

export const GPSDebugComponent: React.FC = () => {
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

  const handleRequestPermission = async () => {
    await requestPermission();
    if (permission === PermissionStatus.GRANTED) {
      Alert.alert('Success', 'Location permission granted!');
    }
  };

  const handleStartTracking = async () => {
    await startTracking();
    Alert.alert('Tracking Started', 'GPS tracking is now active');
  };

  const handleStopTracking = () => {
    stopTracking();
    Alert.alert('Tracking Stopped', 'GPS tracking has been stopped');
  };

  const speedMS = location?.coords.speed ?? 0;
  const speedKMH = convertSpeed(speedMS, SpeedUnit.KMH);
  const speedMPH = convertSpeed(speedMS, SpeedUnit.MPH);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎯 PHASE 2: GPS Core Testing</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Status</Text>
        <StatusRow label="Permission" value={permission} color={getStatusColor(permission)} />
        <StatusRow label="Tracking" value={isTracking ? 'Active' : 'Inactive'} />
        <StatusRow label="Loading" value={isLoading ? 'Yes' : 'No'} />
        <StatusRow
          label="Location Services"
          value={isLocationServicesEnabled ? 'Enabled' : 'Disabled'}
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
          <DataRow label="Latitude" value={location.coords.latitude.toFixed(6)} />
          <DataRow label="Longitude" value={location.coords.longitude.toFixed(6)} />
          <DataRow
            label="Altitude"
            value={location.coords.altitude?.toFixed(2) ?? 'N/A'}
            unit="m"
          />
          <DataRow
            label="Accuracy"
            value={location.coords.accuracy?.toFixed(2) ?? 'N/A'}
            unit="m"
          />
          <DataRow label="Heading" value={location.coords.heading?.toFixed(0) ?? 'N/A'} unit="°" />
        </View>
      )}

      {location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Speed Data</Text>
          <DataRow label="Speed (m/s)" value={speedMS.toFixed(2)} />
          <DataRow label="Speed (km/h)" value={speedKMH.toFixed(2)} highlight />
          <DataRow label="Speed (mph)" value={speedMPH.toFixed(2)} />
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
};

const StatusRow: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color,
}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={[styles.value, color && { color }]}>{value}</Text>
  </View>
);

const DataRow: React.FC<{ label: string; value: string; unit?: string; highlight?: boolean }> = ({
  label,
  value,
  unit,
  highlight,
}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={[styles.value, highlight && styles.highlightValue]}>
      {value} {unit}
    </Text>
  </View>
);

const getStatusColor = (status: PermissionStatus): string => {
  switch (status) {
    case PermissionStatus.GRANTED:
      return Colors.light.success;
    case PermissionStatus.DENIED:
      return Colors.light.error;
    default:
      return Colors.light.warning;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  label: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  highlightValue: {
    fontSize: 16,
    color: Colors.light.primary,
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
    backgroundColor: Colors.light.primary,
  },
  successButton: {
    backgroundColor: Colors.light.success,
  },
  warningButton: {
    backgroundColor: Colors.light.warning,
  },
  infoButton: {
    backgroundColor: Colors.light.info,
  },
  buttonText: {
    color: Colors.light.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  speedFormatted: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    textAlign: 'center',
    marginTop: 10,
  },
  errorSection: {
    backgroundColor: Colors.light.error + '10',
    borderColor: Colors.light.error,
  },
  errorType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.error,
    textTransform: 'uppercase',
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 8,
  },
  errorTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
});
