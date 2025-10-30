import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useTripManager } from '../hooks';
import { Text } from './Text';
import { SpeedUnit } from '../types';
import type { ColorScheme } from '../types/theme';
import type { Trip } from '../types';
import { convertSpeed, formatDistance } from '../constants/Units';

interface TripHistoryScreenProps {
  onClose: () => void;
}

export function TripHistoryScreen({ onClose }: TripHistoryScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { tripHistory, deleteTripFromHistory, clearTripHistory } = useTripManager();

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

  const formatDate = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) {
      return `Hôm nay, ${timeStr}`;
    }
    if (isYesterday) {
      return `Hôm qua, ${timeStr}`;
    }

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const renderTripItem = useCallback(
    ({ item }: { item: Trip }) => {
      const distance = formatDistance(item.stats.distance);
      const duration = formatDuration(item.stats.duration);
      const avgSpeed = convertSpeed(item.stats.averageSpeed, SpeedUnit.KMH).toFixed(1);
      const maxSpeed = convertSpeed(item.stats.maxSpeed, SpeedUnit.KMH).toFixed(1);
      const date = formatDate(item.stats.startTime);

      return (
        <View style={styles.tripCard}>
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
        </View>
      );
    },
    [styles, formatDistance, formatDuration, formatDate, handleDeleteTrip]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text variant="h3">←</Text>
        </TouchableOpacity>
        <Text variant="h3" color="primary">
          Lịch sử chuyến đi
        </Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Text variant="bodySmall" color="error">
            Xóa tất cả
          </Text>
        </TouchableOpacity>
      </View>

      {tripHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="displayLarge" style={styles.emptyIcon}>
            📊
          </Text>
          <Text variant="h4" color="secondary" style={styles.emptyTitle}>
            Chưa có chuyến đi nào
          </Text>
          <Text variant="body" color="secondary" style={styles.emptyMessage}>
            Bắt đầu một chuyến đi để xem thống kê tại đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={tripHistory}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    clearButton: {
      padding: 8,
      marginRight: -8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyIcon: {
      fontSize: 80,
      marginBottom: 16,
    },
    emptyTitle: {
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyMessage: {
      textAlign: 'center',
    },
    listContent: {
      padding: 16,
    },
    tripCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tripHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    tripIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    tripInfo: {
      flex: 1,
    },
    deleteButton: {
      padding: 8,
    },
    deleteText: {
      fontSize: 20,
    },
    tripStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
  });
