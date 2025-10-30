import React, { useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from './Text';
import type { ColorScheme } from '../types/theme';
import type { CompassDirection } from '../services/CompassService';

interface CompassIndicatorProps {
  heading: number;
  direction: CompassDirection;
  directionName: string;
  colors: ColorScheme;
}

export function CompassIndicator({
  heading,
  direction,
  directionName,
  colors,
}: CompassIndicatorProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Rotate arrow opposite to heading (so it points to North)
  const rotation = new Animated.Value(-heading);

  return (
    <View style={styles.container}>
      <View style={styles.compassRose}>
        {/* North indicator */}
        <View style={[styles.directionMarker, styles.northMarker]}>
          <Text variant="caption" color="error">
            N
          </Text>
        </View>

        {/* East indicator */}
        <View style={[styles.directionMarker, styles.eastMarker]}>
          <Text variant="caption" color="secondary">
            E
          </Text>
        </View>

        {/* South indicator */}
        <View style={[styles.directionMarker, styles.southMarker]}>
          <Text variant="caption" color="secondary">
            S
          </Text>
        </View>

        {/* West indicator */}
        <View style={[styles.directionMarker, styles.westMarker]}>
          <Text variant="caption" color="secondary">
            W
          </Text>
        </View>

        {/* Center arrow */}
        <Animated.View
          style={[
            styles.arrow,
            {
              transform: [
                {
                  rotate: rotation.interpolate({
                    inputRange: [-360, 0, 360],
                    outputRange: ['-360deg', '0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.arrowHead, { backgroundColor: colors.error }]} />
          <View style={[styles.arrowTail, { backgroundColor: colors.textSecondary }]} />
        </Animated.View>

        {/* Center dot */}
        <View style={[styles.centerDot, { backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.infoContainer}>
        <Text variant="h2" color="primary" style={styles.heading}>
          {heading}°
        </Text>
        <Text variant="body" color="secondary">
          {direction} - {directionName}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    compassRose: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    directionMarker: {
      position: 'absolute',
    },
    northMarker: {
      top: 8,
    },
    eastMarker: {
      right: 8,
    },
    southMarker: {
      bottom: 8,
    },
    westMarker: {
      left: 8,
    },
    arrow: {
      position: 'absolute',
      width: 4,
      height: 80,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    arrowHead: {
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderBottomWidth: 16,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
    arrowTail: {
      width: 4,
      height: 30,
    },
    centerDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      position: 'absolute',
    },
    infoContainer: {
      marginTop: 12,
      alignItems: 'center',
    },
    heading: {
      fontSize: 28,
      fontWeight: 'bold',
    },
  });
