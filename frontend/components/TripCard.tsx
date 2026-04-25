import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { Trip } from '@/types';

interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  style?: ViewStyle;
}

export default function TripCard({ trip, onPress, style }: TripCardProps) {
  const isActive = trip.status === 'active';
  const loadCount = trip.loads?.length || 0;
  const totalNetRent = trip.loads?.reduce((s, l) => 
s + (l.gross_rent - l.loading_chg - l.unloading_chg - l.loading_comm - l.unloading_comm - l.broker_comm), 0
  ) || 0;

  const tripExpenses = trip.fuel_cost + trip.other_expenses + trip.driver_charge 
    + trip.loading_comm + trip.unloading_comm + trip.loading_chg + trip.unloading_chg;
  
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.completedBadge]}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? Colors.warning : Colors.success }]} />
          <Text style={[styles.statusText, { color: isActive ? Colors.warning : Colors.success }]}>
            {isActive ? 'Active' : 'Completed'}
          </Text>
        </View>
        <Text style={styles.date}>
          {new Date(trip.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.infoText}>{trip.driver_name || 'Driver'}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="car-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.infoText}>{trip.vehicle_plate || 'Vehicle'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View>
          <Text style={styles.metaLabel}>{loadCount} Load{loadCount !== 1 ? 's' : ''}</Text>
          <Text style={styles.metaValue}>₹{totalNetRent.toLocaleString('en-IN')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.metaLabel}>Expenses</Text>
          <Text style={[styles.metaValue, { color: Colors.error }]}>
            ₹{tripExpenses.toLocaleString('en-IN')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  activeBadge: { backgroundColor: Colors.warningMuted },
  completedBadge: { backgroundColor: Colors.accentMuted },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.accent,
  },
});
