import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useTheme } from '../hooks';
import { Text } from './Text';
import { SpeedUnit, type Trip } from '../types';
import type { ColorScheme } from '../types/theme';
import { convertSpeed, formatDistance } from '../constants/Units';
import { exportService } from '../services/ExportService';

interface TripDetailScreenProps {
  trip: Trip;
  onClose: () => void;
}

export function TripDetailScreen({ trip, onClose }: TripDetailScreenProps) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<'map' | 'stats' | 'chart'>('map');
  const [isExporting, setIsExporting] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const styles = useMemo(
    () => createStyles(colors, width, height, insets.bottom),
    [colors, width, height, insets.bottom]
  );

  const mapRegion = useMemo(() => {
    if (trip.route.length === 0) {
      return {
        latitude: 21.028511,
        longitude: 105.804817,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const lats = trip.route.map((p) => p.latitude);
    const lngs = trip.route.map((p) => p.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = (maxLat - minLat) * 1.5 || 0.01;
    const lngDelta = (maxLng - minLng) * 1.5 || 0.01;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [trip.route]);

  const routeCoordinates = useMemo(
    () =>
      trip.route.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
    [trip.route]
  );

  const startPoint = trip.route[0];
  const endPoint = trip.route[trip.route.length - 1];

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleExportGPX = async () => {
    try {
      setIsExporting(true);
      await exportService.exportAndShareGPX(trip);
    } catch (error) {
      Alert.alert(
        'Lỗi xuất file',
        error instanceof Error ? error.message : 'Không thể xuất file GPX',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      await exportService.exportAndShareJSON(trip);
    } catch (error) {
      Alert.alert(
        'Lỗi xuất file',
        error instanceof Error ? error.message : 'Không thể xuất file JSON',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviewGPX = () => {
    const gpxContent = exportService.generateGPX(trip);
    setPreviewTitle('📄 Preview: GPX File');
    setPreviewContent(gpxContent);
  };

  const handlePreviewJSON = () => {
    const jsonContent = exportService.generateJSON(trip);
    setPreviewTitle('📄 Preview: JSON File');
    setPreviewContent(jsonContent);
  };

  const handlePreviewText = () => {
    const textContent = exportService.generateTextSummary(trip);
    setPreviewTitle('📄 Preview: Text Summary');
    setPreviewContent(textContent);
  };

  const handleShare = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            'Hủy',
            'Xem trước GPX',
            'Xem trước JSON',
            'Xem trước Text',
            'Chia sẻ GPX',
            'Chia sẻ JSON',
          ],
          cancelButtonIndex: 0,
          title: 'Chọn hành động',
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            handlePreviewGPX();
          } else if (buttonIndex === 2) {
            handlePreviewJSON();
          } else if (buttonIndex === 3) {
            handlePreviewText();
          } else if (buttonIndex === 4) {
            await handleExportGPX();
          } else if (buttonIndex === 5) {
            await handleExportJSON();
          }
        }
      );
    } else {
      Alert.alert(
        'Chia sẻ hoặc xem trước',
        'Chọn hành động:',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xem GPX', onPress: handlePreviewGPX },
          { text: 'Xem JSON', onPress: handlePreviewJSON },
          { text: 'Xem Text', onPress: handlePreviewText },
          { text: 'Chia sẻ GPX', onPress: handleExportGPX },
          { text: 'Chia sẻ JSON', onPress: handleExportJSON },
        ],
        { cancelable: true }
      );
    }
  };

  const handleShareText = async () => {
    try {
      setIsExporting(true);
      await exportService.shareTextSummary(trip);
    } catch (error) {
      Alert.alert(
        'Lỗi chia sẻ',
        error instanceof Error ? error.message : 'Không thể chia sẻ văn bản',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const speedStats = useMemo(() => {
    const speeds = trip.route.map((p) => p.speed);
    const nonZeroSpeeds = speeds.filter((s) => s > 0);

    return {
      avgSpeed: trip.stats.averageSpeed,
      maxSpeed: trip.stats.maxSpeed,
      minSpeed: nonZeroSpeeds.length > 0 ? Math.min(...nonZeroSpeeds) : 0,
      medianSpeed:
        nonZeroSpeeds.length > 0
          ? nonZeroSpeeds.sort((a, b) => a - b)[Math.floor(nonZeroSpeeds.length / 2)]
          : 0,
    };
  }, [trip.route, trip.stats]);

  const renderMap = () => (
    <View style={styles.mapContainer}>
      <MapView style={styles.map} initialRegion={mapRegion} showsUserLocation>
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {startPoint && (
          <Marker
            coordinate={{
              latitude: startPoint.latitude,
              longitude: startPoint.longitude,
            }}
            title="Điểm bắt đầu"
            pinColor="green"
          />
        )}

        {endPoint && (
          <Marker
            coordinate={{
              latitude: endPoint.latitude,
              longitude: endPoint.longitude,
            }}
            title="Điểm kết thúc"
            pinColor="red"
          />
        )}
      </MapView>
    </View>
  );

  const renderStats = () => (
    <ScrollView style={styles.statsContainer} showsVerticalScrollIndicator={false}>
      {/* Time Info */}
      <View style={styles.section}>
        <Text variant="h3" color="primary" style={styles.sectionTitle}>
          ⏱️ Thời gian
        </Text>
        <View style={styles.statRow}>
          <Text variant="body" color="secondary">
            Bắt đầu:
          </Text>
          <Text variant="body" color="primary">
            {formatDateTime(trip.stats.startTime)}
          </Text>
        </View>
        {trip.stats.endTime && (
          <View style={styles.statRow}>
            <Text variant="body" color="secondary">
              Kết thúc:
            </Text>
            <Text variant="body" color="primary">
              {formatDateTime(trip.stats.endTime)}
            </Text>
          </View>
        )}
        <View style={styles.statRow}>
          <Text variant="body" color="secondary">
            Tổng thời gian:
          </Text>
          <Text variant="body" color="primary">
            {formatDuration(trip.stats.duration)}
          </Text>
        </View>
      </View>

      {/* Distance Info */}
      <View style={styles.section}>
        <Text variant="h3" color="primary" style={styles.sectionTitle}>
          📏 Khoảng cách
        </Text>
        <View style={styles.statRow}>
          <Text variant="body" color="secondary">
            Tổng quãng đường:
          </Text>
          <Text variant="h3" color="primary">
            {formatDistance(trip.stats.distance)}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="body" color="secondary">
            Số điểm GPS:
          </Text>
          <Text variant="body" color="primary">
            {trip.route.length}
          </Text>
        </View>
      </View>

      {/* Speed Info */}
      <View style={styles.section}>
        <Text variant="h3" color="primary" style={styles.sectionTitle}>
          🚀 Tốc độ
        </Text>
        <View style={styles.speedGrid}>
          <View style={styles.speedCard}>
            <Text variant="bodySmall" color="secondary">
              TB
            </Text>
            <Text variant="h2" color="primary">
              {convertSpeed(speedStats.avgSpeed, SpeedUnit.KMH).toFixed(1)}
            </Text>
            <Text variant="bodySmall" color="secondary">
              km/h
            </Text>
          </View>

          <View style={styles.speedCard}>
            <Text variant="bodySmall" color="secondary">
              Max
            </Text>
            <Text variant="h2" color="error">
              {convertSpeed(speedStats.maxSpeed, SpeedUnit.KMH).toFixed(1)}
            </Text>
            <Text variant="bodySmall" color="secondary">
              km/h
            </Text>
          </View>

          <View style={styles.speedCard}>
            <Text variant="bodySmall" color="secondary">
              Min
            </Text>
            <Text variant="h2" color="primary">
              {convertSpeed(speedStats.minSpeed, SpeedUnit.KMH).toFixed(1)}
            </Text>
            <Text variant="bodySmall" color="secondary">
              km/h
            </Text>
          </View>

          <View style={styles.speedCard}>
            <Text variant="bodySmall" color="secondary">
              Trung vị
            </Text>
            <Text variant="h2" color="primary">
              {convertSpeed(speedStats.medianSpeed, SpeedUnit.KMH).toFixed(1)}
            </Text>
            <Text variant="bodySmall" color="secondary">
              km/h
            </Text>
          </View>
        </View>
      </View>

      {trip.route.some((p) => p.altitude !== undefined) && (
        <View style={styles.section}>
          <Text variant="h3" color="primary" style={styles.sectionTitle}>
            ⛰️ Độ cao
          </Text>
          <View style={styles.statRow}>
            <Text variant="body" color="secondary">
              Cao nhất:
            </Text>
            <Text variant="body" color="primary">
              {Math.max(...trip.route.map((p) => p.altitude || 0)).toFixed(1)} m
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text variant="body" color="secondary">
              Thấp nhất:
            </Text>
            <Text variant="body" color="primary">
              {Math.min(
                ...trip.route.filter((p) => p.altitude !== undefined).map((p) => p.altitude!)
              ).toFixed(1)}{' '}
              m
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderChart = () => (
    <View style={styles.chartContainer}>
      <Text variant="h3" color="primary" style={styles.chartTitle}>
        📈 Biểu đồ
      </Text>
      <Text variant="body" color="secondary" style={styles.chartPlaceholder}>
        Chart feature coming soon...
      </Text>
      <Text variant="bodySmall" color="secondary" style={styles.chartDescription}>
        Sẽ hiển thị biểu đồ tốc độ theo thời gian và độ cao
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text variant="h2">←</Text>
        </TouchableOpacity>
        <Text variant="h3" color="primary">
          Chi tiết chuyến đi
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'map' && styles.tabActive]}
          onPress={() => setSelectedTab('map')}
        >
          <Text
            variant="body"
            color={selectedTab === 'map' ? 'primary' : 'secondary'}
            style={styles.tabText}
          >
            🗺️ Bản đồ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'stats' && styles.tabActive]}
          onPress={() => setSelectedTab('stats')}
        >
          <Text
            variant="body"
            color={selectedTab === 'stats' ? 'primary' : 'secondary'}
            style={styles.tabText}
          >
            📊 Thống kê
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'chart' && styles.tabActive]}
          onPress={() => setSelectedTab('chart')}
        >
          <Text
            variant="body"
            color={selectedTab === 'chart' ? 'primary' : 'secondary'}
            style={styles.tabText}
          >
            📈 Biểu đồ
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {selectedTab === 'map' && renderMap()}
        {selectedTab === 'stats' && renderStats()}
        {selectedTab === 'chart' && renderChart()}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, isExporting && styles.actionButtonDisabled]}
          onPress={handleShare}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text variant="body" color="primary">
              🔗 Chia sẻ
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, isExporting && styles.actionButtonDisabled]}
          onPress={handleExportGPX}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text variant="body" color="primary">
              📤 Xuất GPX
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Preview Modal */}
      <Modal
        visible={previewContent !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPreviewContent(null)}
      >
        <SafeAreaView style={styles.previewContainer} edges={['top', 'left', 'right']}>
          <View style={styles.previewHeader}>
            <TouchableOpacity
              style={styles.previewCloseButton}
              onPress={() => setPreviewContent(null)}
            >
              <Text variant="h2">←</Text>
            </TouchableOpacity>
            <Text variant="h3" color="primary">
              {previewTitle}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.previewScrollView}
            contentContainerStyle={styles.previewContent}
          >
            <Text variant="bodySmall" style={styles.previewText} selectable>
              {previewContent}
            </Text>
          </ScrollView>

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewActionButton}
              onPress={() => {
                setPreviewContent(null);
                if (previewTitle.includes('GPX')) {
                  handleExportGPX();
                } else if (previewTitle.includes('JSON')) {
                  handleExportJSON();
                } else {
                  handleShareText();
                }
              }}
            >
              <Text variant="body" color="primary">
                📤 Chia sẻ file này
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ColorScheme,
  screenWidth: number,
  _screenHeight: number,
  bottomInset: number = 0
) => {
  const isSmallScreen = screenWidth < 375;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isSmallScreen ? 12 : 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
    },
    headerSpacer: {
      width: 40,
    },
    tabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      textAlign: 'center',
    },
    content: {
      flex: 1,
    },
    mapContainer: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    statsContainer: {
      flex: 1,
      padding: isSmallScreen ? 12 : 16,
    },
    section: {
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      marginBottom: 16,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    speedGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
    },
    speedCard: {
      flex: 1,
      minWidth: isSmallScreen ? 140 : 160,
      padding: 16,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    chartTitle: {
      marginBottom: 16,
    },
    chartPlaceholder: {
      fontSize: 48,
      marginBottom: 16,
    },
    chartDescription: {
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      padding: isSmallScreen ? 12 : 16,
      paddingBottom: Math.max(bottomInset, 16),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    actionButtonDisabled: {
      opacity: 0.5,
      borderColor: colors.border,
    },
    previewContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isSmallScreen ? 12 : 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    previewCloseButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
    },
    previewScrollView: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    previewContent: {
      padding: isSmallScreen ? 12 : 16,
    },
    previewText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: isSmallScreen ? 11 : 12,
      lineHeight: isSmallScreen ? 16 : 18,
      color: colors.text,
    },
    previewActions: {
      padding: isSmallScreen ? 12 : 16,
      paddingBottom: Math.max(bottomInset, 16),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    previewActionButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
    },
  });
};
