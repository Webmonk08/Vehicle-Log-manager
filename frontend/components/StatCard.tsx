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
  const content = (
    <>
      <View style={styles.header}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    minWidth: 150,
    ...Shadow.card,
  },
  solidCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
  },
});
