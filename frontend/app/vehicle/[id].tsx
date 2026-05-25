import React, { useState } from 'react';
import {
  View, Text, StyleSheet,ScrollView, TouchableOpacity,
  RefreshControl, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { 
  useVehicle, useVehicleExpenses, useAddVehicleExpense, 
  useUpdateVehicle, useUpdateVehicleExpense, useDeleteVehicleExpense, useDeleteVehicle
} from '@/hooks/useApi';
import { LoadingState, EmptyState } from '@/components/StateViews';
import ConfirmDialog from '@/components/ConfirmDialog';
import { VehicleExpense, ExpenseType } from '@/types';

type ExpenseFilter = 'All' | 'Tax' | 'Other';
type DialogType = 'deleteExpense' | 'clearTax' | 'clearService' | 'info' | 'deleteVehicle' | null;

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vehicle, isLoading, refetch } = useVehicle(id);
  const [filter, setFilter] = useState<ExpenseFilter>('All');
  const expenseType = filter === 'All' ? undefined : filter;
  const { data: expenses, refetch: refetchExpenses } = useVehicleExpenses(id, expenseType);
  
  const addExpense = useAddVehicleExpense();
  const updateExpense = useUpdateVehicleExpense();
  const deleteExpense = useDeleteVehicleExpense();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const [showAdd, setShowAdd] = useState(false);
  const [showEditDates, setShowEditDates] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  
  // Modular Dialog State
  const [dialog, setDialog] = useState<{
    visible: boolean;
    type: DialogType;
    id?: string;
    title: string;
    message: string;
    loading: boolean;
  }>({
    visible: false,
    type: null,
    title: '',
    message: '',
    loading: false,
  });

  const [expenseForm, setExpenseForm] = useState({
    type: 'Other' as ExpenseType,
    amount: '',
    description: '',
  });

  const [dateForm, setDateForm] = useState({
    tax_due_date: '',
    last_service_date: '',
    tax_interval_days: '',
    service_interval_days: '',
  });

  if (isLoading || !vehicle) return <LoadingState message="Loading vehicle..." />;

  const daysUntilTax = vehicle.tax_due_date
    ? Math.ceil((new Date(vehicle.tax_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const totalExpenses = (expenses || []).reduce((s, e) => s + e.amount, 0);
  const taxExpenses = (expenses || []).filter(e => e.type === 'Tax').reduce((s, e) => s + e.amount, 0);

  // ── Modular Dialog Helpers ────────────────────────────────────────────────

  const showInfo = (title: string, message: string) => {
    setDialog({ visible: true, type: 'info', title, message, loading: false });
  };

  const showConfirm = (type: DialogType, title: string, message: string, id?: string) => {
    setDialog({ visible: true, type, id, title, message, loading: false });
  };

  const handleDialogConfirm = async () => {
    setDialog(prev => ({ ...prev, loading: true }));
    try {
      if (dialog.type === 'deleteExpense' && dialog.id) {
        await deleteExpense.mutateAsync({ id: dialog.id, vehicle_id: id });
        refetchExpenses();
      } else if (dialog.type === 'clearTax') {
        await updateVehicle.mutateAsync({ id, data: { tax_due_date: undefined } });
      } else if (dialog.type === 'clearService') {
        await updateVehicle.mutateAsync({ id, data: { last_service_date: undefined } });
      } else if (dialog.type === 'deleteVehicle' && dialog.id) {
        await deleteVehicle.mutateAsync(dialog.id);
        router.back();
      }
    } catch (e: any) {
      // Re-trigger dialog with error
      return setDialog({ 
        visible: true, 
        type: 'info', 
        title: 'Error', 
        message: e?.message || 'Action failed', 
        loading: false 
      });
    }
    setDialog(prev => ({ ...prev, visible: false, loading: false }));
  };

  // ── Action Handlers ────────────────────────────────────────────────────────

  const handleSaveExpense = async () => {
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      return showInfo('Validation Error', 'Amount is required');
    }
    try {
      if (editingExpenseId) {
        await updateExpense.mutateAsync({
          id: editingExpenseId,
          data: {
            vehicle_id: id,
            type: expenseForm.type,
            amount: parseFloat(expenseForm.amount),
            description: expenseForm.description || undefined,
          }
        });
        setEditingExpenseId(null);
      } else {
        await addExpense.mutateAsync({
          vehicle_id: id,
          type: expenseForm.type,
          amount: parseFloat(expenseForm.amount),
          description: expenseForm.description || undefined,
        });
      }
      setExpenseForm({ type: 'Other', amount: '', description: '' });
      setShowAdd(false);
      refetchExpenses();
    } catch (e: any) {
      showInfo('Error', e?.message || 'Failed to save expense');
    }
  };

  const handleEditExpense = (expense: VehicleExpense) => {
    setEditingExpenseId(expense.id);
    setExpenseForm({
      type: expense.type,
      amount: expense.amount.toString(),
      description: expense.description || '',
    });
    setShowAdd(true);
  };

  const handleUpdateDates = async (type: 'tax' | 'service', mode: 'manual' | 'monthly' | 'custom', value?: string) => {
    let newDate = new Date();
    
    if (mode === 'manual') {
      if (!value) return showInfo('Error', 'Please enter a valid date');
      newDate = new Date(value);
    } else if (mode === 'monthly') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (mode === 'custom') {
      const days = parseInt(value || '0');
      if (isNaN(days) || days <= 0) return showInfo('Error', 'Please enter valid days');
      newDate.setDate(newDate.getDate() + days);
    }

    try {
      const payload: any = {};
      if (type === 'tax') payload.tax_due_date = newDate.toISOString().split('T')[0];
      if (type === 'service') payload.last_service_date = newDate.toISOString().split('T')[0];

      await updateVehicle.mutateAsync({ id, data: payload });
      setShowEditDates(false);
      showInfo('Success', 'Vehicle schedule updated');
    } catch (e: any) {
      showInfo('Error', e?.message || 'Update failed');
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <Text style={styles.expenseAmount}>₹{expense.amount.toLocaleString('en-IN')}</Text>
            <TouchableOpacity onPress={() => handleEditExpense(expense)}>
              <Ionicons name="pencil" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showConfirm('deleteExpense', 'Delete Expense', 'Remove this expense record?', expense.id)}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => { refetch(); refetchExpenses(); }} tintColor={Colors.primary} />}
        >
          {/* Universal Confirm Dialog */}
          <ConfirmDialog
            visible={dialog.visible}
            title={dialog.title}
            message={dialog.message}
            loading={dialog.loading}
            type={dialog.type === 'info' ? 'info' : (dialog.type?.includes('delete') ? 'danger' : 'primary')}
            onConfirm={dialog.type === 'info' ? () => setDialog(prev => ({ ...prev, visible: false })) : handleDialogConfirm}
            onCancel={() => setDialog(prev => ({ ...prev, visible: false }))}
          />

          {/* Vehicle Header */}
          <View style={styles.headerCard}>
            <View style={styles.plateRow}>
              <Ionicons name="car-sport" size={28} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.plateText}>{vehicle.plate_number}</Text>
                {vehicle.model && <Text style={styles.modelText}>{vehicle.model}</Text>}
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push(`/edit-vehicle/${id}`)}
              >
                <Ionicons name="pencil" size={22} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editBtn} 
                onPress={() => showConfirm('deleteVehicle', 'Delete Vehicle', 'Are you sure you want to delete this vehicle?', id)}
              >
                <Ionicons name="trash-outline" size={22} color={Colors.error} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editBtn} 
                onPress={() => setShowEditDates(!showEditDates)}
              >
                <Ionicons name={showEditDates ? "close-circle" : "calendar-outline"} size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {!showEditDates ? (
              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
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
                  <Text style={styles.infoLabel}>Last Service</Text>
                  <Text style={styles.infoValue}>
                    {vehicle.last_service_date
                      ? new Date(vehicle.last_service_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Not set'}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.editDatesForm}>
                <Text style={styles.formTitle}>Update Schedule</Text>
                
                <View style={styles.dateControlGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.dateLabel}>Tax Due Date</Text>
                    <TouchableOpacity onPress={() => showConfirm('clearTax', 'Clear Date', 'Stop reminders for tax due date?')}>
                      <Text style={{ color: Colors.error, fontSize: FontSize.xs }}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.quickOptions}>
                    <TouchableOpacity style={styles.optionBtn} onPress={() => handleUpdateDates('tax', 'monthly')}>
                      <Text style={styles.optionBtnText}>+1 Month</Text>
                    </TouchableOpacity>
                    <View style={styles.customDaysInput}>
                      <TextInput 
                        style={styles.smallInput} 
                        placeholder="Days" 
                        keyboardType="numeric"
                        value={dateForm.tax_interval_days}
                        onChangeText={v => setDateForm(f => ({ ...f, tax_interval_days: v }))}
                      />
                      <TouchableOpacity 
                        style={styles.goBtn}
                        onPress={() => handleUpdateDates('tax', 'custom', dateForm.tax_interval_days)}
                      >
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.dateControlGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.dateLabel}>Last Service Date</Text>
                    <TouchableOpacity onPress={() => showConfirm('clearService', 'Clear Date', 'Stop reminders for last service date?')}>
                      <Text style={{ color: Colors.error, fontSize: FontSize.xs }}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.quickOptions}>
                    <TouchableOpacity style={styles.optionBtn} onPress={() => handleUpdateDates('service', 'manual', new Date().toISOString().split('T')[0])}>
                      <Text style={styles.optionBtnText}>Today</Text>
                    </TouchableOpacity>
                    <View style={styles.customDaysInput}>
                      <TextInput 
                        style={styles.smallInput} 
                        placeholder="Days ago" 
                        keyboardType="numeric"
                        value={dateForm.service_interval_days}
                        onChangeText={v => setDateForm(f => ({ ...f, service_interval_days: v }))}
                      />
                      <TouchableOpacity 
                        style={styles.goBtn}
                        onPress={() => {
                          const d = new Date();
                          d.setDate(d.getDate() - parseInt(dateForm.service_interval_days || '0'));
                          handleUpdateDates('service', 'manual', d.toISOString().split('T')[0]);
                        }}
                      >
                        <Ionicons name="arrow-back" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
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
            <Text style={styles.sectionTitle}>Expense History</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => {
              if (showAdd) {
                setEditingExpenseId(null);
                setExpenseForm({ type: 'Other', amount: '', description: '' });
              }
              setShowAdd(!showAdd);
            }}>
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

          {/* Add/Edit Expense Form */}
          {showAdd && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {(['Tax', 'Other'] as ExpenseType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, expenseForm.type === t && styles.chipActive]}
                    onPress={() => setExpenseForm(f => ({ ...f, type: t }))}
                  >
                    <Text style={[styles.chipText, expenseForm.type === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Amount (₹)" value={expenseForm.amount} onChangeText={v => setExpenseForm(f => ({ ...f, amount: v }))} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Description (optional)" value={expenseForm.description} onChangeText={v => setExpenseForm(f => ({ ...f, description: v }))} />
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleSaveExpense} 
                disabled={addExpense.isPending || updateExpense.isPending}
              >
                {(addExpense.isPending || updateExpense.isPending) ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{editingExpenseId ? 'Update Expense' : 'Add Expense'}</Text>
                )}
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  plateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  plateText: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, letterSpacing: 1 },
  modelText: { fontSize: FontSize.sm, color: Colors.textMuted },
  editBtn: { padding: Spacing.xs },
  infoGrid: { flexDirection: 'row', gap: Spacing.md },
  infoBox: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
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
  
  editDatesForm: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  formTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs },
  dateControlGroup: { gap: Spacing.sm },
  dateLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  quickOptions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  optionBtn: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  optionBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  customDaysInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingLeft: Spacing.sm,
  },
  smallInput: { flex: 1, paddingVertical: Spacing.xs, fontSize: FontSize.sm, color: Colors.text },
  goBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.sm,
    borderTopRightRadius: Radius.md - 1,
    borderBottomRightRadius: Radius.md - 1,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 2 },

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
    justifyContent: 'center',
    minHeight: 48,
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
