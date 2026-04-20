import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useDrivers, useVehicles, useCreateTrip } from '@/hooks/useApi';
import { LoadingState } from '@/components/StateViews';

export default function CreateTripScreen() {
  const { data: drivers, isLoading: driversLoading } = useDrivers();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const createTrip = useCreateTrip();

  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  if (driversLoading || vehiclesLoading) return <LoadingState message="Loading..." />;

  const handleCreate = async () => {
    if (!selectedDriver) return Alert.alert('Error', 'Please select a driver');
    if (!selectedVehicle) return Alert.alert('Error', 'Please select a vehicle');

    try {
      const trip = await createTrip.mutateAsync({
        driver_id: selectedDriver,
        vehicle_id: selectedVehicle,
      });
      router.replace(`/trip/${trip.id}`);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create trip');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Step 1: Select Driver */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={styles.stepTitle}>Select Driver</Text>
        </View>
        <View style={styles.optionGrid}>
          {(drivers || []).map(driver => (
            <TouchableOpacity
              key={driver.id}
              style={[styles.optionCard, selectedDriver === driver.id && styles.optionCardActive]}
              onPress={() => setSelectedDriver(driver.id)}
            >
              <View style={[styles.optionAvatar, selectedDriver === driver.id && { backgroundColor: Colors.primaryMuted }]}>
                <Text style={[styles.optionAvatarText, selectedDriver === driver.id && { color: Colors.primary }]}>
                  {driver.name.charAt(0)}
                </Text>
              </View>
              <Text style={[styles.optionName, selectedDriver === driver.id && { color: Colors.primary }]}>
                {driver.name}
              </Text>
              {selectedDriver === driver.id && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} style={{ marginLeft: 'auto' }} />
              )}
            </TouchableOpacity>
          ))}
          {(!drivers || drivers.length === 0) && (
            <Text style={styles.emptyText}>No drivers available. Add one first.</Text>
          )}
        </View>
      </View>

      {/* Step 2: Select Vehicle */}
      <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text style={styles.stepTitle}>Select Vehicle</Text>
        </View>
        <View style={styles.optionGrid}>
          {(vehicles || []).map(vehicle => (
            <TouchableOpacity
              key={vehicle.id}
              style={[styles.optionCard, selectedVehicle === vehicle.id && styles.optionCardActive]}
              onPress={() => setSelectedVehicle(vehicle.id)}
            >
              <Ionicons
                name="car-sport"
                size={20}
                color={selectedVehicle === vehicle.id ? Colors.primary : Colors.textMuted}
              />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={[styles.optionName, selectedVehicle === vehicle.id && { color: Colors.primary }]}>
                  {vehicle.plate_number}
                </Text>
                {vehicle.model && (
                  <Text style={styles.optionSub}>{vehicle.model}</Text>
                )}
              </View>
              {selectedVehicle === vehicle.id && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
          {(!vehicles || vehicles.length === 0) && (
            <Text style={styles.emptyText}>No vehicles available. Add one first.</Text>
          )}
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={18} color={Colors.info} />
        <Text style={styles.infoText}>
          You can add loads and expenses after creating the trip.
        </Text>
      </View>

      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createBtn, (!selectedDriver || !selectedVehicle) && styles.createBtnDisabled]}
        onPress={handleCreate}
        disabled={!selectedDriver || !selectedVehicle || createTrip.isPending}
        activeOpacity={0.8}
      >
        <Ionicons name="navigate" size={20} color="#fff" />
        <Text style={styles.createBtnText}>
          {createTrip.isPending ? 'Creating...' : 'Start Trip'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  stepCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary },
  stepTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  optionGrid: { gap: Spacing.sm },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
  optionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textMuted },
  optionName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  optionSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(59,130,246,0.08)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xl,
  },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.lg },
});
