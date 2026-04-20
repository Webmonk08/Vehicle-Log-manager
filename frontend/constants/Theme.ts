/**
 * Vehicle Log Manager — Design System
 * Minimal white and black theme (inverted)
 */

export const Colors = {
  // Core backgrounds
  background: '#ffffff',
  surface: '#f5f5f5',
  surfaceElevated: '#ebebeb',
  card: '#ffffff',
  cardHover: '#f0f0f0',

  // Primary palette
  primary: '#000000',
  primaryLight: '#333333',
  primaryDark: '#000000',
  primaryMuted: 'rgba(0, 0, 0, 0.1)',

  // Accent
  accent: '#666666',
  accentLight: '#888888',
  accentDark: '#444444',
  accentMuted: 'rgba(102, 102, 102, 0.15)',

  // Semantic - significant colors for alerts and graphs
  success: '#22c55e',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  error: '#ef4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  info: '#3b82f6',

  // Text
  text: '#000000',
  textSecondary: '#525252',
  textMuted: '#737373',
  textInverse: '#ffffff',

  // Borders
  border: '#e5e5e5',
  borderLight: 'rgba(0,0,0,0.08)',

  // Overlays
  overlay: 'rgba(0,0,0,0.4)',
  shimmer: 'rgba(0,0,0,0.03)',

  // Gradients
  gradientStart: '#f5f5f5',
  gradientEnd: '#ebebeb',
  gradientIncome: '#22c55e',
  gradientExpense: '#ef4444',

  // Chart - significant colors
  chartIncome: '#22c55e',
  chartExpense: '#ef4444',
  chartBar: '#3b82f6',
  chartGrid: 'rgba(0,0,0,0.08)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  hero: 32,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;
