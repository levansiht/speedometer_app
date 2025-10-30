import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '../hooks';
import { Typography, TypographyVariant } from '../constants/Typography';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

export function Text({ variant = 'body', color, style, children, ...props }: TextProps) {
  const { colors } = useTheme();

  const variantStyle = Typography[variant];

  const colorStyle: TextStyle = {
    color: color
      ? colors[
          color === 'secondary'
            ? 'textSecondary'
            : color === 'tertiary'
            ? 'textTertiary'
            : color === 'inverse'
            ? 'textInverse'
            : color
        ]
      : colors.text,
  };

  return (
    <RNText style={[variantStyle, colorStyle, style]} {...props}>
      {children}
    </RNText>
  );
}
