import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { SpeedUnit } from '../types';
import { convertSpeed } from '../constants/Units';
import { useTheme } from '../hooks';

interface SpeedometerProps {
  speed: number;
  maxSpeed?: number;
  unit?: SpeedUnit;
  showNeedle?: boolean;
}

const { width } = Dimensions.get('window');
const GAUGE_SIZE = Math.min(width - 40, 350);
const CENTER = GAUGE_SIZE / 2;
const RADIUS = GAUGE_SIZE / 2 - 30;
const NEEDLE_LENGTH = RADIUS - 20;

export function SpeedometerGauge({
  speed,
  maxSpeed = 200,
  unit = SpeedUnit.KMH,
  showNeedle = true,
}: SpeedometerProps) {
  const { colors } = useTheme();
  const [currentSpeed, setCurrentSpeed] = useState(0);

  const speedInUnit = useMemo(() => convertSpeed(speed, unit), [speed, unit]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSpeed((prev) => {
        const diff = speedInUnit - prev;
        if (Math.abs(diff) < 0.5) return speedInUnit;
        return prev + diff * 0.2;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [speedInUnit]);

  const speedPercentage = useMemo(
    () => Math.min(currentSpeed / maxSpeed, 1),
    [currentSpeed, maxSpeed]
  );
  const needleAngle = useMemo(() => -135 + speedPercentage * 270, [speedPercentage]);

  const needleX = useMemo(
    () => CENTER + NEEDLE_LENGTH * Math.cos(((needleAngle - 90) * Math.PI) / 180),
    [needleAngle]
  );
  const needleY = useMemo(
    () => CENTER + NEEDLE_LENGTH * Math.sin(((needleAngle - 90) * Math.PI) / 180),
    [needleAngle]
  );

  const renderTicks = useCallback(() => {
    const ticks = [];
    const majorTicks = 10;
    const minorTicksPerMajor = 5;

    for (let i = 0; i <= majorTicks; i++) {
      const angle = -135 + (i * 270) / majorTicks;
      const isMajor = true;
      const tickLength = isMajor ? 20 : 10;
      const tickWidth = isMajor ? 3 : 1.5;

      const startRadius = RADIUS;
      const endRadius = RADIUS - tickLength;

      const x1 = CENTER + startRadius * Math.cos(((angle - 90) * Math.PI) / 180);
      const y1 = CENTER + startRadius * Math.sin(((angle - 90) * Math.PI) / 180);
      const x2 = CENTER + endRadius * Math.cos(((angle - 90) * Math.PI) / 180);
      const y2 = CENTER + endRadius * Math.sin(((angle - 90) * Math.PI) / 180);

      ticks.push(
        <Line
          key={`major-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.textSecondary}
          strokeWidth={tickWidth}
        />
      );

      if (isMajor) {
        const labelRadius = RADIUS - 40;
        const labelX = CENTER + labelRadius * Math.cos(((angle - 90) * Math.PI) / 180);
        const labelY = CENTER + labelRadius * Math.sin(((angle - 90) * Math.PI) / 180);
        const speedValue = Math.round((i * maxSpeed) / majorTicks);

        ticks.push(
          <SvgText
            key={`label-${i}`}
            x={labelX}
            y={labelY}
            fill={colors.textSecondary}
            fontSize="14"
            fontWeight="600"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {speedValue}
          </SvgText>
        );
      }

      if (i < majorTicks) {
        for (let j = 1; j < minorTicksPerMajor; j++) {
          const minorAngle = angle + (j * 270) / majorTicks / minorTicksPerMajor;
          const minorStartRadius = RADIUS;
          const minorEndRadius = RADIUS - 10;

          const mx1 = CENTER + minorStartRadius * Math.cos(((minorAngle - 90) * Math.PI) / 180);
          const my1 = CENTER + minorStartRadius * Math.sin(((minorAngle - 90) * Math.PI) / 180);
          const mx2 = CENTER + minorEndRadius * Math.cos(((minorAngle - 90) * Math.PI) / 180);
          const my2 = CENTER + minorEndRadius * Math.sin(((minorAngle - 90) * Math.PI) / 180);

          ticks.push(
            <Line
              key={`minor-${i}-${j}`}
              x1={mx1}
              y1={my1}
              x2={mx2}
              y2={my2}
              stroke={colors.divider}
              strokeWidth={1}
            />
          );
        }
      }
    }

    return ticks;
  }, [colors, maxSpeed]);

  const speedColor = useMemo(() => {
    if (speedPercentage < 0.5) return colors.success;
    if (speedPercentage < 0.75) return colors.warning;
    return colors.error;
  }, [speedPercentage, colors]);

  return (
    <View style={styles.container}>
      <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS + 5}
          stroke={colors.border}
          strokeWidth={2}
          fill="none"
        />

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={colors.backgroundSecondary}
          strokeWidth={15}
          fill="none"
        />

        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={speedColor}
          strokeWidth={15}
          fill="none"
          strokeDasharray={`${speedPercentage * RADIUS * Math.PI * 1.5} ${RADIUS * Math.PI * 2}`}
          strokeDashoffset={RADIUS * Math.PI * 0.75}
          strokeLinecap="round"
        />

        <G>{renderTicks()}</G>

        <Circle cx={CENTER} cy={CENTER} r={15} fill={colors.text} />

        {showNeedle && (
          <G>
            <Line
              x1={CENTER}
              y1={CENTER}
              x2={needleX}
              y2={needleY}
              stroke={colors.error}
              strokeWidth={4}
              strokeLinecap="round"
            />
            <Circle cx={CENTER} cy={CENTER} r={8} fill={colors.error} />
          </G>
        )}
      </Svg>

      <View style={styles.speedDisplay}>
        <Text style={[styles.speedValue, { color: colors.primary }]}>
          {Math.round(currentSpeed)}
        </Text>
        <Text style={[styles.speedUnit, { color: colors.textSecondary }]}>
          {unit.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedDisplay: {
    position: 'absolute',
    alignItems: 'center',
    top: GAUGE_SIZE * 0.6,
  },
  speedValue: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  speedUnit: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: -8,
  },
});
