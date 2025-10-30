import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks';
import { Text } from './Text';
import type { ColorScheme } from '../types/theme';
import { VoiceService } from '../services/VoiceService';

interface VoiceSettingsProps {
  onClose?: () => void;
}

export function VoiceSettings({ onClose }: VoiceSettingsProps = {}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [config, setConfig] = useState(VoiceService.getConfig());

  const handleToggleEnabled = useCallback(
    (value: boolean) => {
      const newConfig = { ...config, enabled: value };
      setConfig(newConfig);
      VoiceService.updateConfig(newConfig);
    },
    [config]
  );

  const handleIntervalChange = useCallback(
    (intervalKm: number) => {
      const newConfig = { ...config, intervalKm };
      setConfig(newConfig);
      VoiceService.updateConfig(newConfig);
    },
    [config]
  );

  const handleTestVoice = useCallback(async () => {
    await VoiceService.speak('Xin chào! Đây là giọng đọc tiếng Việt của ứng dụng đo tốc độ.');
  }, []);

  const handleSave = useCallback(() => {
    Alert.alert('Đã lưu', 'Cài đặt giọng đọc đã được lưu thành công');
    if (onClose) onClose();
  }, [onClose]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.closeButton} />
        <Text variant="h3" color="primary">
          Cài đặt giọng đọc
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text variant="subtitle1" color="primary">
            Lưu
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="subtitle1" color="primary">
                Bật giọng đọc
              </Text>
              <Text variant="caption" color="secondary">
                Thông báo bằng giọng nói trong hành trình
              </Text>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={config.enabled ? colors.background : colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text variant="subtitle1" color="primary" style={styles.sectionTitle}>
            Tần suất thông báo
          </Text>
          <Text variant="caption" color="secondary" style={styles.sectionDescription}>
            Thông báo khi đạt mốc quãng đường
          </Text>

          <View style={styles.intervalOptions}>
            {[1, 5, 10].map((interval) => (
              <TouchableOpacity
                key={interval}
                style={[
                  styles.intervalButton,
                  config.intervalKm === interval && styles.intervalButtonActive,
                ]}
                onPress={() => handleIntervalChange(interval)}
              >
                <Text
                  variant="button"
                  color={config.intervalKm === interval ? 'inverse' : 'primary'}
                >
                  {interval} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text variant="subtitle1" color="primary" style={styles.sectionTitle}>
            Nội dung thông báo
          </Text>
          <Text variant="caption" color="secondary" style={styles.sectionDescription}>
            Khi đạt mốc quãng đường, giọng đọc sẽ thông báo:
          </Text>

          <View style={styles.announcementList}>
            <View style={styles.announcementItem}>
              <Text variant="body" color="primary">
                • Quãng đường đã đi
              </Text>
            </View>
            <View style={styles.announcementItem}>
              <Text variant="body" color="primary">
                • Thời gian di chuyển
              </Text>
            </View>
            <View style={styles.announcementItem}>
              <Text variant="body" color="primary">
                • Tốc độ trung bình
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <TouchableOpacity style={styles.testButton} onPress={handleTestVoice}>
            <Text variant="button" color="inverse">
              🔊 Kiểm tra giọng đọc
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text variant="caption" color="secondary" style={styles.note}>
            💡 Tip: Giọng đọc sẽ tự động thông báo khi bắt đầu, tạm dừng, tiếp tục và kết thúc hành
            trình.
          </Text>
        </View>
      </ScrollView>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      width: 40,
    },
    saveButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      marginBottom: 4,
    },
    sectionDescription: {
      marginBottom: 12,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
    intervalOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    intervalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    intervalButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    announcementList: {
      gap: 8,
    },
    announcementItem: {
      paddingVertical: 4,
    },
    testButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
    },
    note: {
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
