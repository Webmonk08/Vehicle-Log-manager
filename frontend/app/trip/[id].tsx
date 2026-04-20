import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useTrip, useCompleteTrip, useCreateLoad, useSettleLoad, useCustomers } from '@/hooks/useApi';
import LoadItem from '@/components/LoadItem';
import { LoadingState, EmptyState } from '@/components/StateViews';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading, refetch } = useTrip(id);
  const { data: customers } = useCustomers();
  const completeTrip = useCompleteTrip();
  const createLoad = useCreateLoad();
  const settleLoad = useSettleLoad();

  const [showAddLoad, setShowAddLoad] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  // Add load form state
  const [loadForm, setLoadForm] = useState({
    customer_id: '',
    product_name: '',
    quantity: '',
    rent_type: 'KG' as 'KG' | 'Unit' | 'Bulk',
    gross_rent: '',
    collected: false,
    loading_chg: '0',
    unloading_chg: '0',
    broker_comm: '0',
  });

  // Complete trip form state
  const [completeForm, setCompleteForm] = useState({
    fuel_cost: '0',
    other_expenses: '0',
    driver_charge: '0',
  });

  if (isLoading || !trip) return <LoadingState message="Loading trip..." />;

  const isActive = trip.status === 'active';
  const totalRent = trip.loads.reduce((s, l) => s + l.gross_rent, 0);
  const collectedCount = trip.loads.filter(l => l.collected_status).length;
  const totalExpenses = trip.fuel_cost + trip.other_expenses + trip.driver_charge;

  const handleAddLoad = async () => {
    if (!loadForm.customer_id || !loadForm.product_name || !loadForm.quantity) {
      return Alert.alert('Error', 'Please fill all required fields');
    }
    try {
      await createLoad.mutateAsync({
        trip_id: id,
        customer_id: loadForm.customer_id,
        product_name: loadForm.product_name,
        quantity: parseFloat(loadForm.quantity) || 0,
        rent_type: loadForm.rent_type,
        gross_rent: loadForm.gross_rent ? parseFloat(loadForm.gross_rent) : undefined,
        collected_status: loadForm.collected,
        loading_chg: parseFloat(loadForm.loading_chg) || 0,
        unloading_chg: parseFloat(loadForm.unloading_chg) || 0,
        broker_comm: parseFloat(loadForm.broker_comm) || 0,
      });
      setShowAddLoad(false);
      setLoadForm({ customer_id: '', product_name: '', quantity: '', rent_type: 'KG', gross_rent: '', collected: false, loading_chg: '0', unloading_chg: '0', broker_comm: '0' });
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to add load');
    }
  };

  const handleComplete = async () => {
    Alert.alert('Complete Trip', 'This will settle all loads and update the driver ledger. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        style: 'destructive',
        onPress: async () => {
          try {
            await completeTrip.mutateAsync({
              id,
              data: {
                fuel_cost: parseFloat(completeForm.fuel_cost) || 0,
                other_expenses: parseFloat(completeForm.other_expenses) || 0,
                driver_charge: parseFloat(completeForm.driver_charge) || 0,
              },
            });
            setShowComplete(false);
            refetch();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.detail || 'Failed to complete trip');
          }
        },
      },
    ]);
  };

  const handleSettle = (loadId: string) => {
    Alert.alert('Settle Load', 'Mark this load as collected?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Settle',
        onPress: async () => {
          try {
            await settleLoad.mutateAsync({ id: loadId, data: {} });
            refetch();
          } catch (e: any) {
            Alert.alert('Error', e?.response?.data?.detail || 'Failed to settle load');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
    >
      {/* Trip Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.completedBadge]}>
            <Text style={[styles.statusText, { color: isActive ? Colors.warning : Colors.success }]}>
              {isActive ? '● Active' : '✓ Completed'}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(trip.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.infoValue}>{trip.driver_name || 'Driver'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="car-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.infoValue}>{trip.vehicle_plate || 'Vehicle'}</Text>
          </View>
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Rent</Text>
          <Text style={[styles.statValue, { color: Colors.accent }]}>₹{totalRent.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Collected</Text>
          <Text style={styles.statValue}>{collectedCount}/{trip.loads.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={[styles.statValue, { color: Colors.error }]}>₹{totalExpenses.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Loads Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Loads ({trip.loads.length})</Text>
        {isActive && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddLoad(!showAddLoad)}>
            <Ionicons name={showAddLoad ? 'close' : 'add'} size={18} color={Colors.primary} />
            <Text style={styles.addBtnText}>{showAddLoad ? 'Cancel' : 'Add Load'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Load Form */}
      {showAddLoad && (
        <View style={styles.formCard}>
          {/* Customer Picker */}
          <Text style={styles.formLabel}>Customer</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {(customers || []).map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, loadForm.customer_id === c.id && styles.chipActive]}
                  onPress={() => setLoadForm(f => ({ ...f, customer_id: c.id }))}
                >
                  <Text style={[styles.chipText, loadForm.customer_id === c.id && { color: '#fff' }]}>
                    {c.name}{c.default_rate_per_kg ? ` (₹${c.default_rate_per_kg}/kg)` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TextInput style={styles.input} placeholder="Product Name" placeholderTextColor={Colors.textMuted} value={loadForm.product_name} onChangeText={v => setLoadForm(f => ({ ...f, product_name: v }))} />
          <TextInput style={styles.input} placeholder="Quantity" placeholderTextColor={Colors.textMuted} value={loadForm.quantity} onChangeText={v => setLoadForm(f => ({ ...f, quantity: v }))} keyboardType="numeric" />

          {/* Rent Type */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
            {(['KG', 'Unit', 'Bulk'] as const).map(rt => (
              <TouchableOpacity
                key={rt}
                style={[styles.chip, loadForm.rent_type === rt && styles.chipActive]}
                onPress={() => setLoadForm(f => ({ ...f, rent_type: rt }))}
              >
                <Text style={[styles.chipText, loadForm.rent_type === rt && { color: '#fff' }]}>{rt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {(loadForm.rent_type === 'Bulk' || loadForm.rent_type === 'Unit') && (
            <TextInput style={[styles.input, { marginTop: Spacing.md }]} placeholder="Gross Rent (₹)" placeholderTextColor={Colors.textMuted} value={loadForm.gross_rent} onChangeText={v => setLoadForm(f => ({ ...f, gross_rent: v }))} keyboardType="numeric" />
          )}

          {/* Collection Toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setLoadForm(f => ({ ...f, collected: !f.collected }))}
          >
            <Text style={styles.formLabel}>Collected</Text>
            <View style={[styles.toggle, loadForm.collected && styles.toggleActive]}>
              <View style={[styles.toggleDot, loadForm.collected && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Load Chg" placeholderTextColor={Colors.textMuted} value={loadForm.loading_chg} onChangeText={v => setLoadForm(f => ({ ...f, loading_chg: v }))} keyboardType="numeric" />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Unload Chg" placeholderTextColor={Colors.textMuted} value={loadForm.unloading_chg} onChangeText={v => setLoadForm(f => ({ ...f, unloading_chg: v }))} keyboardType="numeric" />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Broker" placeholderTextColor={Colors.textMuted} value={loadForm.broker_comm} onChangeText={v => setLoadForm(f => ({ ...f, broker_comm: v }))} keyboardType="numeric" />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddLoad}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.submitBtnText}>Add Load</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loads List */}
      {trip.loads.length === 0 ? (
        <EmptyState icon="cube-outline" title="No loads" subtitle="Add loads to this trip" />
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {trip.loads.map(load => (
            <LoadItem
              key={load.id}
              load={load}
              showSettleButton={!load.collected_status}
              onSettle={() => handleSettle(load.id)}
            />
          ))}
        </View>
      )}

      {/* Expenses & Complete Section */}
      {isActive && (
        <>
          <View style={styles.divider} />
          {!showComplete ? (
            <TouchableOpacity style={styles.completeBtn} onPress={() => setShowComplete(true)}>
              <Ionicons name="checkmark-done-circle" size={22} color="#fff" />
              <Text style={styles.completeBtnText}>Complete Trip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Trip Expenses</Text>
              <TextInput style={styles.input} placeholder="Fuel Cost (₹)" placeholderTextColor={Colors.textMuted} value={completeForm.fuel_cost} onChangeText={v => setCompleteForm(f => ({ ...f, fuel_cost: v }))} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Other Expenses (₹)" placeholderTextColor={Colors.textMuted} value={completeForm.other_expenses} onChangeText={v => setCompleteForm(f => ({ ...f, other_expenses: v }))} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Driver Charge (₹)" placeholderTextColor={Colors.textMuted} value={completeForm.driver_charge} onChangeText={v => setCompleteForm(f => ({ ...f, driver_charge: v }))} keyboardType="numeric" />

              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setShowComplete(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.completeBtn, { flex: 2 }]} onPress={handleComplete}>
                  <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
                  <Text style={styles.completeBtnText}>Confirm & Settle</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  activeBadge: { backgroundColor: Colors.warningMuted },
  completedBadge: { backgroundColor: Colors.accentMuted },
  statusText: { fontSize: FontSize.sm, fontWeight: '700' },
  dateText: { fontSize: FontSize.sm, color: Colors.textMuted },
  headerInfo: { flexDirection: 'row', gap: Spacing.xxl },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  infoValue: { fontSize: FontSize.md, color: Colors.text, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  formLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.card,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleActive: { backgroundColor: Colors.accentMuted, borderColor: Colors.accent },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.textMuted,
  },
  toggleDotActive: {
    backgroundColor: Colors.accent,
    alignSelf: 'flex-end',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.xl },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
  },
  completeBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  cancelBtn: {
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
});
