/**
 * Vehicle Log Manager — Design System
 * Dark theme with navy / electric-blue / emerald accent palette
 */

export const Colors = {
  // Core backgrounds
  background: '#0A1628',
  surface: '#111D33',
  surfaceElevated: '#162240',
  card: '#1A2744',
  cardHover: '#1E2F52',

  // Primary palette
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryMuted: 'rgba(37, 99, 235, 0.15)',

  // Accent
  accent: '#10B981',
  accentLight: '#34D399',
  accentDark: '#059669',
  accentMuted: 'rgba(16, 185, 129, 0.15)',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',

  // Text
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Borders
  border: '#1E3A5F',
  borderLight: 'rgba(255,255,255,0.08)',

  // Overlays
  overlay: 'rgba(0,0,0,0.6)',
  shimmer: 'rgba(255,255,255,0.05)',

  // Gradients
  gradientStart: '#2563EB',
  gradientEnd: '#10B981',
  gradientIncome: '#10B981',
  gradientExpense: '#EF4444',

  // Chart
  chartIncome: '#10B981',
  chartExpense: '#EF4444',
  chartBar: '#3B82F6',
  chartGrid: 'rgba(255,255,255,0.06)',
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
