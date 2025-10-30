import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useTripManager } from '../hooks';
import { Text } from './Text';
import { TripDetailScreen } from './TripDetailScreen';
import { SpeedUnit } from '../types';
import type { ColorScheme } from '../types/theme';
import type { Trip } from '../types';
import { convertSpeed, formatDistance } from '../constants/Units';

interface TripHistoryScreenProps {
  onClose?: () => void;
}

type SortOption = 'date' | 'distance' | 'duration';

export function TripHistoryScreen(_props: TripHistoryScreenProps = {}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useMemo(
    () => createStyles(colors, width, insets.bottom),
    [colors, width, insets.bottom]
  );
  const { tripHistory, deleteTripFromHistory, clearTripHistory, loadTripHistory } =
    useTripManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Load trips on mount
  useEffect(() => {
    const loadTrips = async () => {
      setIsLoading(true);
      await loadTripHistory();
      setIsLoading(false);
    };
    loadTrips();
  }, [loadTripHistory]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadTripHistory();
    setIsRefreshing(false);
  }, [loadTripHistory]);

  const formatDate = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Hôm nay, ${date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    if (isYesterday) {
      return `Hôm qua, ${date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const filteredTrips = useMemo(() => {
    let filtered = tripHistory;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((trip) => {
        const dateStr = formatDate(trip.stats.startTime).toLowerCase();
        const distanceStr = (trip.stats.distance / 1000).toFixed(2);
        return dateStr.includes(query) || distanceStr.includes(query);
      });
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.stats.startTime - a.stats.startTime;
        case 'distance':
          return b.stats.distance - a.stats.distance;
        case 'duration':
          return b.stats.duration - a.stats.duration;
        default:
          return 0;
      }
    });

    return filtered;
  }, [tripHistory, searchQuery, sortBy, formatDate]);
  const handleDeleteTrip = useCallback(
    (tripId: string) => {
      Alert.alert('Xóa chuyến đi', 'Bạn có chắc muốn xóa chuyến đi này?', [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteTripFromHistory(tripId),
        },
      ]);
    },
    [deleteTripFromHistory]
  );

  const handleClearAll = useCallback(() => {
    if (tripHistory.length === 0) return;

    Alert.alert('Xóa tất cả', 'Bạn có chắc muốn xóa toàn bộ lịch sử chuyến đi?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa tất cả',
        style: 'destructive',
        onPress: clearTripHistory,
      },
    ]);
  }, [tripHistory.length, clearTripHistory]);

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }, []);

  const renderTripItem = useCallback(
    ({ item }: { item: Trip }) => {
      const distance = formatDistance(item.stats.distance);
      const duration = formatDuration(item.stats.duration);
      const avgSpeed = convertSpeed(item.stats.averageSpeed, SpeedUnit.KMH).toFixed(1);
      const maxSpeed = convertSpeed(item.stats.maxSpeed, SpeedUnit.KMH).toFixed(1);
      const date = formatDate(item.stats.startTime);

      return (
        <TouchableOpacity
          style={styles.tripCard}
          onPress={() => setSelectedTrip(item)}
          activeOpacity={0.7}
        >
          <View style={styles.tripHeader}>
            <View style={styles.tripIcon}>
              <Text variant="h4">🚗</Text>
            </View>
            <View style={styles.tripInfo}>
              <Text variant="subtitle1" color="primary">
                {distance}
              </Text>
              <Text variant="caption" color="secondary">
                {date}
              </Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTrip(item.id)}>
              <Text variant="body" style={styles.deleteText}>
                🗑️
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tripStats}>
            <View style={styles.statItem}>
              <Text variant="caption" color="secondary">
                Thời gian
              </Text>
              <Text variant="bodySmall" color="primary">
                {duration}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text variant="caption" color="secondary">
                TB
              </Text>
              <Text variant="bodySmall" color="primary">
                {avgSpeed} km/h
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text variant="caption" color="secondary">
                Tối đa
              </Text>
              <Text variant="bodySmall" color="primary">
                {maxSpeed} km/h
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text variant="caption" color="secondary">
                Điểm
              </Text>
              <Text variant="bodySmall" color="primary">
                {item.route.length}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [styles, formatDistance, formatDuration, formatDate, handleDeleteTrip, setSelectedTrip]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="body" color="secondary" style={styles.loadingText}>
            Đang tải lịch sử...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="h2" color="primary">
          📊 Lịch sử
        </Text>
        <View style={styles.headerButtons}>
          {tripHistory.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Text variant="bodySmall" color="error">
                🗑️ Xóa tất cả
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {tripHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="displayLarge" style={styles.emptyIcon}>
            📊
          </Text>
          <Text variant="h3" color="secondary" style={styles.emptyTitle}>
            Chưa có chuyến đi nào
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyMessage}>
            Bắt đầu một chuyến đi để xem thống kê tại đây
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm chuyến đi..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
              onPress={() => setSortBy('date')}
            >
              <Text
                variant="caption"
                color={sortBy === 'date' ? 'inverse' : 'secondary'}
                style={styles.sortButtonText}
              >
                📅 Ngày
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive]}
              onPress={() => setSortBy('distance')}
            >
              <Text
                variant="caption"
                color={sortBy === 'distance' ? 'inverse' : 'secondary'}
                style={styles.sortButtonText}
              >
                📏 Khoảng cách
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'duration' && styles.sortButtonActive]}
              onPress={() => setSortBy('duration')}
            >
              <Text
                variant="caption"
                color={sortBy === 'duration' ? 'inverse' : 'secondary'}
                style={styles.sortButtonText}
              >
                ⏱️ Thời gian
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredTrips}
            renderItem={renderTripItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text variant="h4" color="secondary">
                  🔍 Không tìm thấy kết quả
                </Text>
                <Text variant="body" color="secondary" style={styles.emptyMessage}>
                  Thử tìm kiếm với từ khóa khác
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Trip Detail Modal */}
      <Modal
        visible={selectedTrip !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedTrip(null)}
      >
        {selectedTrip && (
          <TripDetailScreen trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme, screenWidth: number, bottomInset: number = 0) => {
  const isSmallScreen = screenWidth < 375; // iPhone SE
  const isMediumScreen = screenWidth >= 375 && screenWidth < 428; // iPhone 11 Pro

  const cardPadding = isSmallScreen ? 12 : isMediumScreen ? 16 : 18;
  const fontSize = isSmallScreen ? 0.9 : 1;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingVertical: isSmallScreen ? 12 : 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: colors.surface,
    },
    searchContainer: {
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    searchInput: {
      height: isSmallScreen ? 44 : 48,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16 * fontSize,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sortContainer: {
      flexDirection: 'row',
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingBottom: 12,
      gap: isSmallScreen ? 8 : 10,
    },
    sortButton: {
      flex: 1,
      paddingVertical: isSmallScreen ? 8 : 10,
      paddingHorizontal: isSmallScreen ? 8 : 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    sortButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sortButtonText: {
      fontSize: 12 * fontSize,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: isSmallScreen ? 24 : 40,
      paddingVertical: 40,
    },
    emptyIcon: {
      fontSize: isSmallScreen ? 64 : 80,
      marginBottom: isSmallScreen ? 12 : 16,
    },
    emptyTitle: {
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyMessage: {
      textAlign: 'center',
      marginTop: 4,
    },
    listContent: {
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingBottom: Math.max(bottomInset, 20),
    },
    tripCard: {
      backgroundColor: colors.surface,
      borderRadius: isSmallScreen ? 10 : 12,
      padding: cardPadding,
      marginBottom: isSmallScreen ? 10 : 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    tripHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: isSmallScreen ? 10 : 12,
    },
    tripIcon: {
      width: isSmallScreen ? 44 : 48,
      height: isSmallScreen ? 44 : 48,
      borderRadius: isSmallScreen ? 22 : 24,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isSmallScreen ? 10 : 12,
    },
    tripInfo: {
      flex: 1,
    },
    deleteButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.backgroundSecondary,
    },
    deleteText: {
      fontSize: 18,
    },
    tripStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: isSmallScreen ? 10 : 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: isSmallScreen ? 8 : 12,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
  });
};
