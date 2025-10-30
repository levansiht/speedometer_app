export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
  '7xl': 56,
  '8xl': 64,
} as const;

export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

export const LETTER_SPACING = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
} as const;

export const Typography = {
  h1: {
    fontSize: FONT_SIZE['4xl'],
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: FONT_SIZE['4xl'] * LINE_HEIGHT.tight,
    letterSpacing: LETTER_SPACING.tight,
  },
  h2: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: FONT_SIZE['3xl'] * LINE_HEIGHT.tight,
    letterSpacing: LETTER_SPACING.tight,
  },
  h3: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: FONT_SIZE['2xl'] * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  h4: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: FONT_SIZE.xl * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  h5: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: FONT_SIZE.lg * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  h6: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: FONT_SIZE.md * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  body: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: FONT_SIZE.base * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  bodyLarge: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: FONT_SIZE.md * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  bodySmall: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: FONT_SIZE.sm * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  caption: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: FONT_SIZE.xs * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.wide,
  },
  button: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: FONT_SIZE.md * LINE_HEIGHT.tight,
    letterSpacing: LETTER_SPACING.wide,
  },
  buttonSmall: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: FONT_SIZE.sm * LINE_HEIGHT.tight,
    letterSpacing: LETTER_SPACING.wide,
  },
  buttonLarge: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: FONT_SIZE.lg * LINE_HEIGHT.tight,
    letterSpacing: LETTER_SPACING.wide,
  },
  overline: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    lineHeight: FONT_SIZE.xs * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.wider,
    textTransform: 'uppercase' as const,
  },
  subtitle1: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: FONT_SIZE.md * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  subtitle2: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: FONT_SIZE.sm * LINE_HEIGHT.normal,
    letterSpacing: LETTER_SPACING.normal,
  },
  display: {
    fontSize: FONT_SIZE['6xl'],
    fontWeight: FONT_WEIGHT.extrabold,
    lineHeight: FONT_SIZE['6xl'] * LINE_HEIGHT.tight,
    letterSpacing: LETTER_SPACING.tighter,
  },
  displayLarge: {
    fontSize: FONT_SIZE['8xl'],
    fontWeight: FONT_WEIGHT.extrabold,
    lineHeight: FONT_SIZE['8xl'] * LINE_HEIGHT.tight,
    letterSpacing: LETTER_SPACING.tighter,
  },
} as const;

export type TypographyVariant = keyof typeof Typography;
