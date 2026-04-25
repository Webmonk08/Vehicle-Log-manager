/**
 * Vehicle Log Manager — Design System
 * Vibrant Modern Dashboard Theme
 */

export const Colors = {
  // Core backgrounds
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  cardHover: '#F8FAFC',

  // Primary palette (Indigo)
  primary: '#4F46E5', // Indigo 600
  primaryLight: '#818CF8', // Indigo 400
  primaryDark: '#3730A3', // Indigo 800
  primaryMuted: 'rgba(79, 70, 229, 0.1)',

  // Accent (Emerald/Teal)
  accent: '#10B981', // Emerald 500
  accentLight: '#34D399', // Emerald 400
  accentDark: '#059669', // Emerald 600
  accentMuted: 'rgba(16, 185, 129, 0.1)',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B', // Amber 500
  warningMuted: 'rgba(245, 158, 11, 0.1)',
  error: '#EF4444', // Rose 500
  errorMuted: 'rgba(239, 68, 68, 0.1)',
  info: '#3B82F6', // Blue 500

  // Text (Slate)
  text: '#1E293B', // Slate 800
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverse: '#FFFFFF',

  // Borders
  border: '#E2E8F0', // Slate 200
  borderLight: '#F1F5F9', // Slate 100

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  shimmer: 'rgba(255, 255, 255, 0.2)',

  // Gradients
  gradientStart: '#4F46E5',
  gradientEnd: '#3730A3',
  gradientIncome: '#10B981',
  gradientExpense: '#EF4444',

  // Chart - significant colors
  chartIncome: '#10B981',
  chartExpense: '#EF4444',
  chartBar: '#4F46E5',
  chartGrid: '#E2E8F0',
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
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;
