import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradientColors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}

export default function StatCard({
  title, value, subtitle, icon, gradientColors, style,
}: StatCardProps) {
  const isGradient = !!gradientColors;
  
  const content = (
    <>
      <View style={styles.header}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <Text style={[styles.title, isGradient && styles.textWhiteMuted]}>{title}</Text>
      </View>
      <Text style={[styles.value, isGradient && styles.textWhite]}>{value}</Text>
      {subtitle && <Text style={[styles.subtitle, isGradient && styles.textWhiteMuted]}>{subtitle}</Text>}
    </>
  );

  if (gradientColors) {
    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, style]}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={[styles.card, styles.solidCard, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    minHeight: 100,
    justifyContent: 'center',
    ...Shadow.card,
  },
  solidCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  iconWrap: {
    marginRight: 6,
  },
  title: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textWhiteMuted: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
