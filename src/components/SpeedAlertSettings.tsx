import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Switch, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useSpeedAlert } from '../hooks';
import { Text } from './Text';
import type { ColorScheme } from '../types/theme';

interface SpeedAlertSettingsProps {
  onClose?: () => void;
}

export function SpeedAlertSettings({ onClose }: SpeedAlertSettingsProps = {}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { config, updateConfig } = useSpeedAlert();

  const [threshold, setThreshold] = useState(config.threshold.toString());

  const handleSave = useCallback(async () => {
    const newThreshold = parseInt(threshold, 10);
    if (!isNaN(newThreshold) && newThreshold > 0 && newThreshold <= 300) {
      await updateConfig({ threshold: newThreshold });
      Alert.alert('Đã lưu', 'Cài đặt cảnh báo đã được lưu thành công');
      if (onClose) onClose();
    }
  }, [threshold, updateConfig, onClose]);

  const handleToggleEnabled = useCallback(
    async (value: boolean) => {
      await updateConfig({ enabled: value });
    },
    [updateConfig]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.closeButton} />
        <Text variant="h3" color="primary">
          Cài đặt cảnh báo
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text variant="subtitle1" color="primary">
            Lưu
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text variant="subtitle1" color="primary">
                Bật cảnh báo
              </Text>
              <Text variant="caption" color="secondary">
                Cảnh báo khi vượt tốc độ giới hạn
              </Text>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="subtitle1" color="primary" style={styles.sectionTitle}>
            Tốc độ giới hạn
          </Text>
          <View style={styles.thresholdContainer}>
            <TextInput
              style={styles.input}
              value={threshold}
              onChangeText={setThreshold}
              keyboardType="numeric"
              placeholder="80"
              placeholderTextColor={colors.textSecondary}
            />
            <Text variant="h4" color="secondary">
              km/h
            </Text>
          </View>
          <Text variant="caption" color="secondary" style={styles.hint}>
            Cảnh báo sẽ hiển thị khi bạn chạy vượt tốc độ này
          </Text>
        </View>

        <View style={styles.presets}>
          <Text variant="caption" color="secondary" style={styles.presetsTitle}>
            Tốc độ thường dùng:
          </Text>
          <View style={styles.presetButtons}>
            {[40, 60, 80, 100, 120].map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.presetButton,
                  parseInt(threshold, 10) === speed && styles.presetButtonActive,
                ]}
                onPress={() => setThreshold(speed.toString())}
              >
                <Text
                  variant="bodySmall"
                  color={parseInt(threshold, 10) === speed ? 'inverse' : 'secondary'}
                >
                  {speed}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
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
    closeButton: {
      padding: 8,
      marginLeft: -8,
    },
    saveButton: {
      padding: 8,
      marginRight: -8,
    },
    content: {
      flex: 1,
      padding: 20,
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
      marginBottom: 12,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    thresholdContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    input: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    hint: {
      marginTop: 8,
    },
    presets: {
      marginTop: 8,
    },
    presetsTitle: {
      marginBottom: 8,
    },
    presetButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    presetButton: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
  });
