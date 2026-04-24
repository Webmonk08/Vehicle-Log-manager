import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { 
  useTrip, useCompleteTrip, useCreateLoad, useSettleLoad, 
  useCustomers, useUpdateTrip, useDrivers, useVehicles 
} from '@/hooks/useApi';
import LoadItem from '@/components/LoadItem';
import { LoadingState, EmptyState } from '@/components/StateViews';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading, refetch } = useTrip(id);
  const { data: customers } = useCustomers();
  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();
  
  const completeTrip = useCompleteTrip();
  const createLoad = useCreateLoad();
  const settleLoad = useSettleLoad();
  const updateTrip = useUpdateTrip();

  const [showAddLoad, setShowAddLoad] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

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
    loading_comm: '0',
    unloading_comm: '0',
    broker_comm: '0',
  });

  // Complete trip form state
  const [completeForm, setCompleteForm] = useState({
    fuel_cost: '0',
    other_expenses: '0',
    driver_charge: '0',
    loading_comm: '0',
    unloading_comm: '0',
    loading_chg: '0',
    unloading_chg: '0',
  });

  // Edit trip form state
  const [editForm, setEditForm] = useState({
    driver_id: '',
    vehicle_id: '',
    fuel_cost: '0',
    other_expenses: '0',
    driver_charge: '0',
    loading_comm: '0',
    unloading_comm: '0',
    loading_chg: '0',
    unloading_chg: '0',
  });

  useEffect(() => {
    if (trip) {
      setEditForm({
        driver_id: trip.driver_id,
        vehicle_id: trip.vehicle_id,
        fuel_cost: trip.fuel_cost.toString(),
        other_expenses: trip.other_expenses.toString(),
        driver_charge: trip.driver_charge.toString(),
        loading_comm: trip.loading_comm.toString(),
        unloading_comm: trip.unloading_comm.toString(),
        loading_chg: trip.loading_chg.toString(),
        unloading_chg: trip.unloading_chg.toString(),
      });
      setCompleteForm({
        fuel_cost: trip.fuel_cost.toString(),
        other_expenses: trip.other_expenses.toString(),
        driver_charge: trip.driver_charge.toString(),
        loading_comm: trip.loading_comm.toString(),
        unloading_comm: trip.unloading_comm.toString(),
        loading_chg: trip.loading_chg.toString(),
        unloading_chg: trip.unloading_chg.toString(),
      });
    }
  }, [trip]);

  if (isLoading || !trip) return <LoadingState message="Loading trip..." />;

  const isActive = trip.status === 'active';
  const isCompleted = trip.status === 'completed';
  const tripLoads = trip.loads || [];
  const totalRent = tripLoads.reduce((s, l) => s + l.gross_rent, 0);
  const collectedCount = tripLoads.filter(l => l.collected_status).length;

  // Load-level expenses (charges & commissions on each load)
  const loadExpenses = tripLoads.reduce((s, l) => 
    s + l.loading_chg + l.unloading_chg + l.loading_comm + l.unloading_comm + l.broker_comm, 0);

  // Trip-level expenses
  const tripExpenses = trip.fuel_cost + trip.other_expenses + trip.driver_charge
    + trip.loading_comm + trip.unloading_comm + trip.loading_chg + trip.unloading_chg;

  const totalExpenses = tripExpenses + loadExpenses;
  const netAmount = totalRent - totalExpenses;

  const handleAddLoad = async () => {
    if (!loadForm.customer_id || !loadForm.product_name || !loadForm.quantity) {
      return Alert.alert('Error', 'Please fill all required fields');
    }
    try {
      await createLoad.mutateAsync({
        trip_id: trip.id,
        customer_id: loadForm.customer_id,
        product_name: loadForm.product_name,
        quantity: parseFloat(loadForm.quantity) || 0,
        rent_type: loadForm.rent_type,
        gross_rent: loadForm.gross_rent ? parseFloat(loadForm.gross_rent) : undefined,
        collected_status: loadForm.collected,
        loading_chg: parseFloat(loadForm.loading_chg) || 0,
        unloading_chg: parseFloat(loadForm.unloading_chg) || 0,
        loading_comm: parseFloat(loadForm.loading_comm) || 0,
        unloading_comm: parseFloat(loadForm.unloading_comm) || 0,
        broker_comm: parseFloat(loadForm.broker_comm) || 0,
      });
      setShowAddLoad(false);
      setLoadForm({ customer_id: '', product_name: '', quantity: '', rent_type: 'KG', gross_rent: '', collected: false, loading_chg: '0', unloading_chg: '0', loading_comm: '0', unloading_comm: '0', broker_comm: '0' });
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to add load');
    }
  };

  const doCompleteTrip = async () => {
    try {
      const payload = {
        fuel_cost: parseFloat(completeForm.fuel_cost) || 0,
        other_expenses: parseFloat(completeForm.other_expenses) || 0,
        driver_charge: parseFloat(completeForm.driver_charge) || 0,
        loading_comm: parseFloat(completeForm.loading_comm) || 0,
        unloading_comm: parseFloat(completeForm.unloading_comm) || 0,
        loading_chg: parseFloat(completeForm.loading_chg) || 0,
        unloading_chg: parseFloat(completeForm.unloading_chg) || 0,
      };
      await completeTrip.mutateAsync({ id: trip.id, data: payload });
      setShowComplete(false);
      refetch();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.detail || e?.message || 'Failed to complete trip';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleUpdateTrip = async () => {
    try {
      const payload: any = {
        driver_id: editForm.driver_id,
        vehicle_id: editForm.vehicle_id,
      };

      if (isCompleted) {
        payload.fuel_cost = parseFloat(editForm.fuel_cost) || 0;
        payload.other_expenses = parseFloat(editForm.other_expenses) || 0;
        payload.driver_charge = parseFloat(editForm.driver_charge) || 0;
        payload.loading_comm = parseFloat(editForm.loading_comm) || 0;
        payload.unloading_comm = parseFloat(editForm.unloading_comm) || 0;
        payload.loading_chg = parseFloat(editForm.loading_chg) || 0;
        payload.unloading_chg = parseFloat(editForm.unloading_chg) || 0;
      }

      await updateTrip.mutateAsync({ id: trip.id, data: payload });
      setShowEdit(false);
      refetch();
    } catch (e: any) {
      const errorMsg = e?.response?.data?.detail || e?.message || 'Failed to update trip';
      Alert.alert('Error', errorMsg);
    }
  };

  const handleSettle = async (loadId: string) => {
    try {
      await settleLoad.mutateAsync({ id: loadId, data: {} });
      refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || e?.message || 'Failed to settle load');
    }
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
          <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setShowEdit(!showEdit)}>
              <Ionicons name={showEdit ? "close-circle" : "create-outline"} size={22} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.dateText}>
              {new Date(trip.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>
        
        {!showEdit ? (
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
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formLabel}>Driver</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {(drivers || []).map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.chip, editForm.driver_id === d.id && styles.chipActive]}
                    onPress={() => setEditForm(f => ({ ...f, driver_id: d.id }))}
                  >
                    <Text style={[styles.chipText, editForm.driver_id === d.id && { color: '#fff' }]}>{d.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.formLabel}>Vehicle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {(vehicles || []).map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.chip, editForm.vehicle_id === v.id && styles.chipActive]}
                    onPress={() => setEditForm(f => ({ ...f, vehicle_id: v.id }))}
                  >
                    <Text style={[styles.chipText, editForm.vehicle_id === v.id && { color: '#fff' }]}>{v.plate_number}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {isCompleted && (
              <>
                <Text style={styles.sectionTitle}>Edit Trip Expenses</Text>
                <Text style={styles.formLabel}>Fuel Cost</Text>
                <TextInput style={styles.input} value={editForm.fuel_cost} onChangeText={v => setEditForm(f => ({ ...f, fuel_cost: v }))} keyboardType="numeric" />
                
                <Text style={styles.formLabel}>Driver Expense</Text>
                <TextInput style={styles.input} value={editForm.other_expenses} onChangeText={v => setEditForm(f => ({ ...f, other_expenses: v }))} keyboardType="numeric" />
                
                <Text style={styles.formLabel}>Driver Charge</Text>
                <TextInput style={styles.input} value={editForm.driver_charge} onChangeText={v => setEditForm(f => ({ ...f, driver_charge: v }))} keyboardType="numeric" />

                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Loading Comm.</Text>
                    <TextInput style={styles.input} value={editForm.loading_comm} onChangeText={v => setEditForm(f => ({ ...f, loading_comm: v }))} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Unloading Comm.</Text>
                    <TextInput style={styles.input} value={editForm.unloading_comm} onChangeText={v => setEditForm(f => ({ ...f, unloading_comm: v }))} keyboardType="numeric" />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Loading Charge</Text>
                    <TextInput style={styles.input} value={editForm.loading_chg} onChangeText={v => setEditForm(f => ({ ...f, loading_chg: v }))} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Unloading Charge</Text>
                    <TextInput style={styles.input} value={editForm.unloading_chg} onChangeText={v => setEditForm(f => ({ ...f, unloading_chg: v }))} keyboardType="numeric" />
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleUpdateTrip} disabled={updateTrip.isPending}>
              {updateTrip.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Rent</Text>
          <Text style={[styles.statValue, { color: Colors.accent }]}>₹{totalRent.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Collected</Text>
          <Text style={styles.statValue}>{collectedCount}/{tripLoads.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={[styles.statValue, { color: Colors.error }]}>₹{totalExpenses.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Net Amount */}
      <View style={styles.netAmountCard}>
        <Text style={styles.netLabel}>Net Amount (Rent − Expenses)</Text>
        <Text style={[styles.netValue, { color: netAmount >= 0 ? Colors.accent : Colors.error }]}>
          ₹{netAmount.toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Loads Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Loads ({tripLoads.length})</Text>
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

          <Text style={styles.formLabel}>Product Name</Text>
          <TextInput style={styles.input} placeholder="Product Name" placeholderTextColor={Colors.textMuted} value={loadForm.product_name} onChangeText={v => setLoadForm(f => ({ ...f, product_name: v }))} />
          
          <Text style={styles.formLabel}>Quantity</Text>
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
            <>
              <Text style={[styles.formLabel, { marginTop: Spacing.sm }]}>Gross Rent (₹)</Text>
              <TextInput style={styles.input} placeholder="Gross Rent (₹)" placeholderTextColor={Colors.textMuted} value={loadForm.gross_rent} onChangeText={v => setLoadForm(f => ({ ...f, gross_rent: v }))} keyboardType="numeric" />
            </>
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

          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Upload Cost</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={loadForm.loading_chg} onChangeText={v => setLoadForm(f => ({ ...f, loading_chg: v }))} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Download Cost</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={loadForm.unloading_chg} onChangeText={v => setLoadForm(f => ({ ...f, unloading_chg: v }))} keyboardType="numeric" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Loading Comm.</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={loadForm.loading_comm} onChangeText={v => setLoadForm(f => ({ ...f, loading_comm: v }))} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Unloading Comm.</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={loadForm.unloading_comm} onChangeText={v => setLoadForm(f => ({ ...f, unloading_comm: v }))} keyboardType="numeric" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>Broker Comm.</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={loadForm.broker_comm} onChangeText={v => setLoadForm(f => ({ ...f, broker_comm: v }))} keyboardType="numeric" />
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddLoad}>
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.submitBtnText}>Add Load</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loads List */}
      {(!tripLoads || tripLoads.length === 0) ? (
        <EmptyState icon="cube-outline" title="No loads" subtitle="Add loads to this trip" />
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {tripLoads.map(load => (
            <LoadItem
              key={load.id}
              load={load}
              showSettleButton={!load.collected_status}
              onSettle={() => handleSettle(load.id)}
            />
          ))}
        </View>
      )}

      {/* Completed Trip - Expense Breakdown */}
      {isCompleted && !showEdit && (
        <>
          <View style={styles.divider} />
          <View style={styles.formCard}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Expense Breakdown</Text>
              <TouchableOpacity onPress={() => setShowEdit(true)}>
                <Ionicons name="create-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            {trip.fuel_cost > 0 && (
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Fuel Cost</Text>
                <Text style={styles.expenseValue}>₹{trip.fuel_cost.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {trip.other_expenses > 0 && (
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Other Expenses</Text>
                <Text style={styles.expenseValue}>₹{trip.other_expenses.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {trip.driver_charge > 0 && (
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Driver Charge</Text>
                <Text style={styles.expenseValue}>₹{trip.driver_charge.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {trip.loading_comm > 0 && (
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Loading Commission</Text>
                <Text style={styles.expenseValue}>₹{trip.loading_comm.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {trip.unloading_comm > 0 && (
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Unloading Commission</Text>
                <Text style={styles.expenseValue}>₹{trip.unloading_comm.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {trip.loading_chg > 0 && (
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Loading Charge</Text>
                <Text style={styles.expenseValue}>₹{trip.loading_chg.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {trip.unloading_chg > 0 && (
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Unloading Charge</Text>
                <Text style={styles.expenseValue}>₹{trip.unloading_chg.toLocaleString('en-IN')}</Text>
              </View>
            )}
            {loadExpenses > 0 && (
              <View style={styles.expenseRow}>
                <Text style={styles.expenseLabel}>Load-level Charges</Text>
                <Text style={styles.expenseValue}>₹{loadExpenses.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={[styles.expenseRow, { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.sm, marginTop: Spacing.xs }]}>
              <Text style={[styles.expenseLabel, { fontWeight: '700', color: Colors.text }]}>Net Amount</Text>
              <Text style={[styles.expenseValue, { fontWeight: '700', color: netAmount >= 0 ? Colors.accent : Colors.error }]}>₹{netAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </>
      )}

      {/* Expenses & Complete Section */}
      {isActive && !showEdit && (
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
              
              <Text style={styles.formLabel}>Fuel Cost</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={completeForm.fuel_cost} onChangeText={v => setCompleteForm(f => ({ ...f, fuel_cost: v }))} keyboardType="numeric" />
              
              <Text style={styles.formLabel}>Driver Expense</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={completeForm.other_expenses} onChangeText={v => setCompleteForm(f => ({ ...f, other_expenses: v }))} keyboardType="numeric" />
              
              <Text style={styles.formLabel}>Driver Charge</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={completeForm.driver_charge} onChangeText={v => setCompleteForm(f => ({ ...f, driver_charge: v }))} keyboardType="numeric" />

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Loading Comm.</Text>
                  <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={completeForm.loading_comm} onChangeText={v => setCompleteForm(f => ({ ...f, loading_comm: v }))} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Unloading Comm.</Text>
                  <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={completeForm.unloading_comm} onChangeText={v => setCompleteForm(f => ({ ...f, unloading_comm: v }))} keyboardType="numeric" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Loading Charge</Text>
                  <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={completeForm.loading_chg} onChangeText={v => setCompleteForm(f => ({ ...f, loading_chg: v }))} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Unloading Charge</Text>
                  <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted} value={completeForm.unloading_chg} onChangeText={v => setCompleteForm(f => ({ ...f, unloading_chg: v }))} keyboardType="numeric" />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setShowComplete(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.completeBtn, { flex: 2 }, completeTrip.isPending && { opacity: 0.7 }]} 
                  onPress={doCompleteTrip}
                  disabled={completeTrip.isPending}
                >
                  {completeTrip.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
                      <Text style={styles.completeBtnText}>Confirm & Settle</Text>
                    </>
                  )}
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
  netAmountCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
  },
  netLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: 4 },
  netValue: { fontSize: FontSize.xl, fontWeight: '800' },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  expenseLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  expenseValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.error },
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
