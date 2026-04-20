import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, TextInput, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useVehicle, useVehicleExpenses, useAddVehicleExpense } from '@/hooks/useApi';
import { LoadingState, EmptyState } from '@/components/StateViews';
import { VehicleExpense, ExpenseType } from '@/types';

type ExpenseFilter = 'All' | 'Tax' | 'Other';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vehicle, isLoading, refetch } = useVehicle(id);
  const [filter, setFilter] = useState<ExpenseFilter>('All');
  const expenseType = filter === 'All' ? undefined : filter;
  const { data: expenses, refetch: refetchExpenses } = useVehicleExpenses(id, expenseType);
  const addExpense = useAddVehicleExpense();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    type: 'Other' as ExpenseType,
    amount: '',
    description: '',
  });

  if (isLoading || !vehicle) return <LoadingState message="Loading vehicle..." />;

  const daysUntilTax = vehicle.tax_due_date
    ? Math.ceil((new Date(vehicle.tax_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const totalExpenses = (expenses || []).reduce((s, e) => s + e.amount, 0);
  const taxExpenses = (expenses || []).filter(e => e.type === 'Tax').reduce((s, e) => s + e.amount, 0);

  const handleAdd = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      return Alert.alert('Error', 'Amount is required');
    }
    try {
      await addExpense.mutateAsync({
        vehicle_id: id,
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description || undefined,
      });
      setForm({ type: 'Other', amount: '', description: '' });
      setShowAdd(false);
      refetchExpenses();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add expense');
    }
  };

  const renderExpense = (expense: VehicleExpense) => (
    <View key={expense.id} style={styles.expenseCard}>
      <View style={[styles.expenseIcon, { backgroundColor: expense.type === 'Tax' ? Colors.warningMuted : Colors.primaryMuted }]}>
        <Ionicons
          name={expense.type === 'Tax' ? 'receipt' : 'construct'}
          size={18}
          color={expense.type === 'Tax' ? Colors.warning : Colors.primary}
        />
      </View>
      <View style={styles.expenseContent}>
        <View style={styles.expenseRow}>
          <Text style={styles.expenseType}>{expense.type}</Text>
          <Text style={styles.expenseAmount}>₹{expense.amount.toLocaleString('en-IN')}</Text>
        </View>
        {expense.description && (
          <Text style={styles.expenseDesc}>{expense.description}</Text>
        )}
        <Text style={styles.expenseDate}>
          {new Date(expense.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetch(); refetchExpenses(); }} tintColor={Colors.primary} />}
    >
      {/* Vehicle Header */}
      <View style={styles.headerCard}>
        <View style={styles.plateRow}>
          <Ionicons name="car-sport" size={28} color={Colors.primary} />
          <Text style={styles.plateText}>{vehicle.plate_number}</Text>
        </View>
        {vehicle.model && <Text style={styles.modelText}>{vehicle.model}</Text>}

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Tax Due</Text>
            <Text style={[
              styles.infoValue,
              daysUntilTax !== null && daysUntilTax <= 7 ? { color: Colors.error } : {},
            ]}>
              {vehicle.tax_due_date
                ? new Date(vehicle.tax_due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Not set'}
            </Text>
            {daysUntilTax !== null && (
              <Text style={[styles.daysTag, daysUntilTax <= 7 ? styles.daysTagUrgent : styles.daysTagNormal]}>
                {daysUntilTax >= 0 ? `${daysUntilTax} days left` : 'Overdue!'}
              </Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <Ionicons name="build-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.infoLabel}>Last Service</Text>
            <Text style={styles.infoValue}>
              {vehicle.last_service_date
                ? new Date(vehicle.last_service_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'Not set'}
            </Text>
          </View>
        </View>
      </View>

      {/* Expense Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.primary }]}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryValue}>₹{totalExpenses.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.warning }]}>
          <Text style={styles.summaryLabel}>Tax Paid</Text>
          <Text style={styles.summaryValue}>₹{taxExpenses.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Expense Filter & Add */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Ionicons name={showAdd ? 'close' : 'add'} size={18} color={Colors.primary} />
          <Text style={styles.addBtnText}>{showAdd ? 'Cancel' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['All', 'Tax', 'Other'] as ExpenseFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && { color: '#fff' }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Expense Form */}
      {showAdd && (
        <View style={styles.formCard}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {(['Tax', 'Other'] as ExpenseType[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, form.type === t && styles.chipActive]}
                onPress={() => setForm(f => ({ ...f, type: t }))}
              >
                <Text style={[styles.chipText, form.type === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Amount (₹)" placeholderTextColor={Colors.textMuted} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Description (optional)" placeholderTextColor={Colors.textMuted} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitBtnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Expenses List */}
      {(expenses || []).length === 0 ? (
        <EmptyState icon="receipt-outline" title="No expenses" subtitle="Add an expense to track costs" />
      ) : (
        <View style={{ gap: Spacing.sm }}>
          {(expenses || []).map(renderExpense)}
        </View>
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
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  plateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs },
  plateText: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, letterSpacing: 1 },
  modelText: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  infoGrid: { flexDirection: 'row', gap: Spacing.md },
  infoBox: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  infoValue: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  daysTag: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  daysTagUrgent: { backgroundColor: Colors.errorMuted, color: Colors.error },
  daysTagNormal: { backgroundColor: Colors.accentMuted, color: Colors.accent },
  summaryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 3,
  },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  expenseCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  expenseContent: { flex: 1 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseType: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  expenseAmount: { fontSize: FontSize.md, fontWeight: '700', color: Colors.error },
  expenseDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  expenseDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
});
