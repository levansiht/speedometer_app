import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel as string;
        const isFocused = state.index === index;

        const iconElement = options.tabBarIcon
          ? options.tabBarIcon({
              focused: isFocused,
              color: isFocused ? colors.primary : colors.textSecondary,
              size: 24,
            })
          : null;

        const onPress = () => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton
            key={route.key}
            label={label}
            icon={iconElement}
            isFocused={isFocused}
            onPress={onPress}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

interface TabButtonProps {
  label: string;
  icon: React.ReactNode;
  isFocused: boolean;
  onPress: () => void;
  colors: any;
}

function TabButton({ label, icon, isFocused, onPress, colors }: TabButtonProps) {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.6);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.95, {
      damping: 15,
      stiffness: 150,
    });

    iconScale.value = withSpring(isFocused ? 1.1 : 1, {
      damping: 15,
      stiffness: 150,
    });

    labelOpacity.value = withTiming(isFocused ? 1 : 0.6, {
      duration: 200,
    });
  }, [isFocused]);

  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 200 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    });

    iconScale.value = withSpring(0.85, { damping: 10, stiffness: 200 }, () => {
      iconScale.value = withSpring(isFocused ? 1.1 : 1, {
        damping: 15,
        stiffness: 150,
      });
    });

    onPress();
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const styles = createStyles(colors);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={styles.tabButton}>
      <Animated.View style={[styles.tabContent, animatedContainerStyle]}>
        <Animated.View style={[styles.iconContainer, animatedIconStyle]}>{icon}</Animated.View>
        <Animated.Text
          style={[
            styles.label,
            {
              color: isFocused ? colors.primary : colors.textSecondary,
            },
            animatedLabelStyle,
          ]}
        >
          {label}
        </Animated.Text>
        {isFocused && (
          <Animated.View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const createStyles = (_colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      borderTopWidth: 1,
      paddingTop: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 16,
    },
    tabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    tabContent: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    iconContainer: {
      marginBottom: 2,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
    },
    activeIndicator: {
      position: 'absolute',
      top: -8,
      width: 32,
      height: 3,
      borderRadius: 2,
    },
  });
