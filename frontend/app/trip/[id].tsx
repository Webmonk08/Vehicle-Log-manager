import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Modal, Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import {
  useTrip, useCompleteTrip, useCreateLoad, useSettleLoad,
  useCustomers, useUpdateTrip, useDrivers, useVehicles,
  useDeleteTrip, useDeleteLoad, useUpdateLoad, useProducts
} from '@/hooks/useApi';
import ConfirmDialog from '@/components/ConfirmDialog';
import { LoadingState } from '@/components/StateViews';
import { router } from 'expo-router';

type ConfirmDialogType = 'deleteTrip' | 'deleteLoad' | 'completeTrip' | null;

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading, refetch } = useTrip(id);
  const { data: customers } = useCustomers();
  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { data: products } = useProducts(selectedCustomerId || undefined);

  const completeTrip = useCompleteTrip();
  const createLoad = useCreateLoad();
  const settleLoad = useSettleLoad();
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();
  const deleteLoad = useDeleteLoad();
  const updateLoad = useUpdateLoad();

  const [showComplete, setShowComplete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingLoadId, setEditingLoadId] = useState<string | null>(null);

  // Table Modal States
  const [modalContext, setModalContext] = useState<'new' | string | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Fixed widths for table columns
  const COL_WIDTHS = {
    customer: 140,
    product: 120,
    productName: 140,
    qty: 80,
    rentType: 100,
    grossRent: 100,
    upload: 90,
    download: 90,
    lComm: 90,
    uComm: 90,
    broker: 90,
    collected: 80,
    actions: 120,
  };

  // Settlement Modal State
  const [settleModal, setSettleModal] = useState<{
    visible: boolean;
    loadId: string | null;
    netRent: number;
    amount: string;
    confirmingShort: boolean;
  }>({
    visible: false,
    loadId: null,
    netRent: 0,
    amount: '',
    confirmingShort: false,
  });

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    type: ConfirmDialogType;
    visible: boolean;
    id?: string;
    title: string;
    message: string;
    loading: boolean;
  }>({
    type: null,
    visible: false,
    title: '',
    message: '',
    loading: false,
  });

  // Add/Edit load form state
  const [loadForm, setLoadForm] = useState({
    customer_id: '',
    product_id: '',
    product_name: '',
    quantity: '',
    unit_price: '',
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
  const totalGrossRent = tripLoads.reduce((s, l) => s + l.gross_rent, 0);
  const collectedCount = tripLoads.filter(l => l.collected_status).length;

  const loadExpenses = tripLoads.reduce((s, l) =>
    s + l.loading_chg + l.unloading_chg + l.loading_comm + l.unloading_comm + l.broker_comm, 0);

  const totalNetRent = totalGrossRent - loadExpenses;

  const tripExpenses = trip.fuel_cost + trip.other_expenses + trip.driver_charge
    + trip.loading_comm + trip.unloading_comm + trip.loading_chg + trip.unloading_chg;

  const netAmount = totalNetRent - tripExpenses;

  const handleAddLoad = async () => {
    if (!loadForm.customer_id || !loadForm.product_name || !loadForm.quantity) {
      Alert.alert("Error", "Please fill required fields (Customer, Product, Quantity)");
      return;
    }
    try {
      if (editingLoadId) {
        await updateLoad.mutateAsync({
          id: editingLoadId,
          data: {
            product_id: loadForm.product_id || undefined,
            product_name: loadForm.product_name,
            quantity: parseFloat(loadForm.quantity) || 0,
            gross_rent: loadForm.gross_rent ? parseFloat(loadForm.gross_rent) : undefined,
            collected_status: loadForm.collected,
            loading_chg: parseFloat(loadForm.loading_chg) || 0,
            unloading_chg: parseFloat(loadForm.unloading_chg) || 0,
            loading_comm: parseFloat(loadForm.loading_comm) || 0,
            unloading_comm: parseFloat(loadForm.unloading_comm) || 0,
            broker_comm: parseFloat(loadForm.broker_comm) || 0,
          }
        });
        setEditingLoadId(null);
      } else {
        await createLoad.mutateAsync({
          trip_id: trip.id,
          customer_id: loadForm.customer_id,
          product_id: loadForm.product_id || undefined,
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
      }
      resetLoadForm();
      refetch();
    } catch (e: any) {
      console.error(e);
    }
  };

  const resetLoadForm = () => {
    setLoadForm({
      customer_id: '',
      product_id: '',
      product_name: '',
      quantity: '',
      unit_price: '',
      rent_type: 'KG',
      gross_rent: '',
      collected: false,
      loading_chg: '0',
      unloading_chg: '0',
      loading_comm: '0',
      unloading_comm: '0',
      broker_comm: '0'
    });
    setSelectedCustomerId(null);
  };

  const handleEditLoad = (load: any) => {
    setEditingLoadId(load.id);
    setLoadForm({
      customer_id: load.customer_id,
      product_id: load.product_id || '',
      product_name: load.product_name,
      quantity: load.quantity.toString(),
      unit_price: load.unit_price?.toString() || '',
      rent_type: load.rent_type,
      gross_rent: load.gross_rent.toString(),
      collected: load.collected_status,
      loading_chg: load.loading_chg.toString(),
      unloading_chg: load.unloading_chg.toString(),
      loading_comm: load.loading_comm.toString(),
      unloading_comm: load.unloading_comm.toString(),
      broker_comm: load.broker_comm.toString(),
    });
    setSelectedCustomerId(load.customer_id);
  };

  const showConfirm = (type: ConfirmDialogType, id?: string) => {
    let title = '';
    let message = '';

    switch (type) {
      case 'deleteTrip':
        title = 'Delete Trip';
        message = 'Are you sure you want to delete this entire trip? This action cannot be undone.';
        break;
      case 'deleteLoad':
        title = 'Delete Load';
        message = 'Are you sure you want to delete this load?';
        break;
      case 'completeTrip':
        title = 'Complete Trip';
        message = 'Are you sure you want to finalize this trip and settle all costs?';
        break;
    }

    setConfirmDialog({
      type,
      visible: true,
      id,
      title,
      message,
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    setConfirmDialog(prev => ({ ...prev, loading: true }));
    try {
      switch (confirmDialog.type) {
        case 'deleteTrip':
          await deleteTrip.mutateAsync(trip.id);
          setConfirmDialog(prev => ({ ...prev, visible: false }));
          router.back();
          break;
        case 'deleteLoad':
          if (confirmDialog.id) {
            await deleteLoad.mutateAsync(confirmDialog.id);
            refetch();
          }
          break;
        case 'completeTrip':
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
          break;
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setConfirmDialog(prev => ({ ...prev, visible: false, loading: false }));
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
      console.error(e);
    }
  };

  const handleSettleSubmit = async () => {
    if (!settleModal.loadId) return;
    const amountVal = parseFloat(settleModal.amount) || 0;

    if (settleModal.confirmingShort) {
      await executeSettle(amountVal);
      return;
    }

    if (amountVal < settleModal.netRent) {
      setSettleModal(prev => ({ ...prev, confirmingShort: true }));
    } else {
      await executeSettle(amountVal);
    }
  };

  const executeSettle = async (amount: number) => {
    if (!settleModal.loadId) return;
    try {
      await settleLoad.mutateAsync({
        id: settleModal.loadId,
        data: {
          amount_received: amount
        }
      });
      setSettleModal(prev => ({ ...prev, visible: false }));
      refetch();
    } catch (e: any) {
      console.error(e);
    }
  };

  const currentSettleRemaining = settleModal.visible
    ? settleModal.netRent - (parseFloat(settleModal.amount) || 0)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
    >
      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        loading={confirmDialog.loading}
        type={confirmDialog.type?.includes('delete') ? 'danger' : 'primary'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, visible: false }))}
        confirmText={confirmDialog.type?.includes('delete') ? 'Delete' : 'Confirm'}
      />

      {/* Settle Modal */}
      <Modal visible={settleModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.settleContainer}>
            <Text style={styles.modalTitle}>
              {settleModal.confirmingShort ? 'Short Settlement' : 'Settle Load'}
            </Text>

            {!settleModal.confirmingShort ? (
              <>
                <Text style={styles.settleInfo}>Net Rent to collect: ₹{settleModal.netRent.toLocaleString()}</Text>

                <Text style={styles.formLabel}>Amount Received (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={settleModal.amount}
                  onChangeText={v => setSettleModal(prev => ({ ...prev, amount: v }))}
                  autoFocus
                />

                {parseFloat(settleModal.amount) > 0 && currentSettleRemaining > 0 && (
                  <View style={styles.remainingBox}>
                    <Text style={styles.remainingLabel}>Remaining Balance</Text>
                    <Text style={styles.remainingValue}>₹{currentSettleRemaining.toLocaleString()}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={{ marginVertical: Spacing.md }}>
                <Text style={[styles.settleInfo, { color: Colors.text, marginBottom: Spacing.sm }]}>
                  The amount <Text style={{ fontWeight: '700' }}>₹{(parseFloat(settleModal.amount) || 0).toLocaleString()}</Text> is less than the net rent <Text style={{ fontWeight: '700' }}>₹{settleModal.netRent.toLocaleString()}</Text>.
                </Text>
                <Text style={[styles.settleInfo, { color: Colors.error, fontWeight: '600' }]}>
                  Remaining Balance: ₹{currentSettleRemaining.toLocaleString()}
                </Text>
                <Text style={[styles.settleInfo, { marginTop: Spacing.md }]}>
                  Are you sure you want to proceed anyway?
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => {
                  if (settleModal.confirmingShort) {
                    setSettleModal(prev => ({ ...prev, confirmingShort: false }));
                  } else {
                    setSettleModal(prev => ({ ...prev, visible: false }));
                  }
                }}
              >
                <Text style={styles.cancelBtnText}>
                  {settleModal.confirmingShort ? 'Go Back' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, settleModal.confirmingShort ? styles.deleteBtn : styles.submitBtn]}
                onPress={handleSettleSubmit}
                disabled={settleLoad.isPending}
              >
                {settleLoad.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {settleModal.confirmingShort ? 'Proceed Anyway' : 'Confirm'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            <TouchableOpacity onPress={() => showConfirm('deleteTrip')}>
              <Ionicons name="trash-outline" size={22} color={Colors.error} />
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
          <Text style={[styles.statValue, { color: Colors.accent }]}>₹{totalNetRent.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Collected</Text>
          <Text style={styles.statValue}>{collectedCount}/{tripLoads.length}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={[styles.statValue, { color: Colors.error }]}>₹{tripExpenses.toLocaleString('en-IN')}</Text>
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
      </View>

      {/* Loads Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollView}>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.customer }]}>Customer</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.product }]}>Rate Card</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.productName }]}>Product Name</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.qty }]}>Qty</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.rentType }]}>Type</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.grossRent }]}>Gross Rent</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.upload }]}>Upload</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.download }]}>Download</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.lComm }]}>L. Comm</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.uComm }]}>U. Comm</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.broker }]}>Broker</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.collected }]}>Coll.</Text>
            <Text style={[styles.headerCell, { width: COL_WIDTHS.actions, textAlign: 'center' }]}>Actions</Text>
          </View>

          {/* Data Rows */}
          {tripLoads.map(load => {
            const isEditing = editingLoadId === load.id;
            return (
              <View key={load.id} style={[styles.row, isEditing && styles.editingRow]}>
                <View style={[styles.cell, { width: COL_WIDTHS.customer }]}>
                  {isEditing ? (
                    <TouchableOpacity
                      style={styles.cellSelector}
                      onPress={() => {
                        setModalContext(load.id);
                        setShowCustomerModal(true);
                      }}
                    >
                      <Text numberOfLines={1} style={styles.cellSelectorText}>
                        {(customers || []).find(c => c.id === loadForm.customer_id)?.name || 'Select'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text numberOfLines={1} style={styles.cellText}>{load.customer_name || 'N/A'}</Text>
                  )}
                </View>

                <View style={[styles.cell, { width: COL_WIDTHS.product }]}>
                  {isEditing ? (
                    <TouchableOpacity
                      style={styles.cellSelector}
                      onPress={() => {
                        setModalContext(load.id);
                        setSelectedCustomerId(loadForm.customer_id);
                        setShowProductModal(true);
                      }}
                      disabled={!loadForm.customer_id}
                    >
                      <Text numberOfLines={1} style={[styles.cellSelectorText, !loadForm.customer_id && { color: Colors.textMuted }]}>
                        {(products || []).find(p => p.id === loadForm.product_id)?.name || 'Select'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text numberOfLines={1} style={styles.cellText}>{load.product?.name || '-'}</Text>
                  )}
                </View>

                <View style={[styles.cell, { width: COL_WIDTHS.productName }]}>
                  {isEditing ? (
                    <TextInput
                      style={styles.cellInput}
                      value={loadForm.product_name}
                      onChangeText={v => setLoadForm(f => ({ ...f, product_name: v, product_id: '' }))}
                    />
                  ) : (
                    <Text numberOfLines={1} style={styles.cellText}>{load.product_name}</Text>
                  )}
                </View>

                <View style={[styles.cell, { width: COL_WIDTHS.qty }]}>
                  {isEditing ? (
                    <TextInput
                      style={styles.cellInput}
                      value={loadForm.quantity}
                      keyboardType="numeric"
                      onChangeText={v => {
                        const qty = parseFloat(v) || 0;
                        setLoadForm(f => {
                          let newGross = f.gross_rent;
                          if (f.product_id) {
                            const prod = (products || []).find(p => p.id === f.product_id);
                            if (prod) newGross = (prod.default_rate * qty).toString();
                          }
                          return { ...f, quantity: v, gross_rent: newGross };
                        });
                      }}
                    />
                  ) : (
                    <Text style={styles.cellText}>{load.quantity}</Text>
                  )}
                </View>

                <View style={[styles.cell, { width: COL_WIDTHS.rentType }]}>
                  {isEditing ? (
                    <View style={styles.miniChipGroup}>
                      {(['KG', 'Unit', 'Bulk'] as const).map(rt => (
                        <TouchableOpacity
                          key={rt}
                          style={[styles.miniChip, loadForm.rent_type === rt && styles.miniChipActive]}
                          onPress={() => setLoadForm(f => ({ ...f, rent_type: rt }))}
                        >
                          <Text style={[styles.miniChipText, loadForm.rent_type === rt && { color: '#fff' }]}>{rt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.cellText}>{load.rent_type}</Text>
                  )}
                </View>

                <View style={[styles.cell, { width: COL_WIDTHS.grossRent }]}>
                  {isEditing ? (
                    <TextInput
                      style={styles.cellInput}
                      value={loadForm.gross_rent}
                      keyboardType="numeric"
                      onChangeText={v => setLoadForm(f => ({ ...f, gross_rent: v }))}
                    />
                  ) : (
                    <Text style={styles.cellText}>₹{load.gross_rent}</Text>
                  )}
                </View>

                <View style={[styles.cell, { width: COL_WIDTHS.upload }]}>
                  {isEditing ? (
                    <TextInput style={styles.cellInput} value={loadForm.loading_chg} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, loading_chg: v }))} />
                  ) : (
                    <Text style={styles.cellText}>{load.loading_chg}</Text>
                  )}
                </View>
                <View style={[styles.cell, { width: COL_WIDTHS.download }]}>
                  {isEditing ? (
                    <TextInput style={styles.cellInput} value={loadForm.unloading_chg} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, unloading_chg: v }))} />
                  ) : (
                    <Text style={styles.cellText}>{load.unloading_chg}</Text>
                  )}
                </View>
                <View style={[styles.cell, { width: COL_WIDTHS.lComm }]}>
                  {isEditing ? (
                    <TextInput style={styles.cellInput} value={loadForm.loading_comm} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, loading_comm: v }))} />
                  ) : (
                    <Text style={styles.cellText}>{load.loading_comm}</Text>
                  )}
                </View>
                <View style={[styles.cell, { width: COL_WIDTHS.uComm }]}>
                  {isEditing ? (
                    <TextInput style={styles.cellInput} value={loadForm.unloading_comm} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, unloading_comm: v }))} />
                  ) : (
                    <Text style={styles.cellText}>{load.unloading_comm}</Text>
                  )}
                </View>
                <View style={[styles.cell, { width: COL_WIDTHS.broker }]}>
                  {isEditing ? (
                    <TextInput style={styles.cellInput} value={loadForm.broker_comm} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, broker_comm: v }))} />
                  ) : (
                    <Text style={styles.cellText}>{load.broker_comm}</Text>
                  )}
                </View>

                <View style={[styles.cell, { width: COL_WIDTHS.collected, alignItems: 'center' }]}>
                  {isEditing ? (
                    <TouchableOpacity onPress={() => setLoadForm(f => ({ ...f, collected: !f.collected }))}>
                      <Ionicons
                        name={loadForm.collected ? "checkbox" : "square-outline"}
                        size={20}
                        color={loadForm.collected ? Colors.accent : Colors.textMuted}
                      />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons
                      name={load.collected_status ? "checkmark-circle" : "time-outline"}
                      size={18}
                      color={load.collected_status ? Colors.success : Colors.warning}
                    />
                  )}
                </View>

                <View style={[styles.cell, { width: COL_WIDTHS.actions, flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' }]}>
                  {isEditing ? (
                    <>
                      <TouchableOpacity onPress={handleAddLoad}>
                        <Ionicons name="save" size={22} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setEditingLoadId(null); resetLoadForm(); }}>
                        <Ionicons name="close-circle" size={22} color={Colors.error} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity onPress={() => handleEditLoad(load)}>
                        <Ionicons name="pencil" size={20} color={Colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => showConfirm('deleteLoad', load.id)}>
                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                      </TouchableOpacity>
                      {!load.collected_status && (
                        <TouchableOpacity onPress={() => {
                          const loadNetRent = load.gross_rent - load.loading_chg - load.unloading_chg
                            - load.loading_comm - load.unloading_comm - load.broker_comm;
                          const remaining = loadNetRent - load.amount_collected;
                          setSettleModal({
                            visible: true,
                            loadId: load.id,
                            netRent: loadNetRent,
                            amount: remaining.toString(),
                            confirmingShort: false
                          });
                        }}>
                          <Ionicons name="cash-outline" size={20} color={Colors.accent} />
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
            );
          })}

          {isActive && (
            <View style={[styles.row, styles.newRow]}>
              <View style={[styles.cell, { width: COL_WIDTHS.customer }]}>
                <TouchableOpacity
                  style={styles.cellSelector}
                  onPress={() => {
                    setModalContext('new');
                    setShowCustomerModal(true);
                  }}
                >
                  <Text numberOfLines={1} style={[styles.cellSelectorText, !loadForm.customer_id && { color: Colors.textMuted }]}>
                    {(customers || []).find(c => c.id === loadForm.customer_id)?.name || 'Customer'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.cell, { width: COL_WIDTHS.product }]}>
                <TouchableOpacity
                  style={styles.cellSelector}
                  onPress={() => {
                    setModalContext('new');
                    setSelectedCustomerId(loadForm.customer_id);
                    setShowProductModal(true);
                  }}
                  disabled={!loadForm.customer_id}
                >
                  <Text numberOfLines={1} style={[styles.cellSelectorText, !loadForm.product_id && { color: Colors.textMuted }]}>
                    {(products || []).find(p => p.id === loadForm.product_id)?.name || 'Rate Card'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.cell, { width: COL_WIDTHS.productName }]}>
                <TextInput style={styles.cellInput} placeholder="Product" value={loadForm.product_name} onChangeText={v => setLoadForm(f => ({ ...f, product_name: v, product_id: '' }))} />
              </View>

              <View style={[styles.cell, { width: COL_WIDTHS.qty }]}>
                <TextInput
                  style={styles.cellInput}
                  placeholder="0"
                  value={loadForm.quantity}
                  keyboardType="numeric"
                  onChangeText={v => {
                    const qty = parseFloat(v) || 0;
                    setLoadForm(f => {
                      let newGross = f.gross_rent;
                      if (f.product_id) {
                        const prod = (products || []).find(p => p.id === f.product_id);
                        if (prod) newGross = (prod.default_rate * qty).toString();
                      }
                      return { ...f, quantity: v, gross_rent: newGross };
                    });
                  }}
                />
              </View>

              <View style={[styles.cell, { width: COL_WIDTHS.rentType }]}>
                <View style={styles.miniChipGroup}>
                  {(['KG', 'Unit', 'Bulk'] as const).map(rt => (
                    <TouchableOpacity
                      key={rt}
                      style={[styles.miniChip, loadForm.rent_type === rt && styles.miniChipActive]}
                      onPress={() => setLoadForm(f => ({ ...f, rent_type: rt }))}
                    >
                      <Text style={[styles.miniChipText, loadForm.rent_type === rt && { color: '#fff' }]}>{rt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.cell, { width: COL_WIDTHS.grossRent }]}>
                <TextInput style={styles.cellInput} placeholder="0" value={loadForm.gross_rent} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, gross_rent: v }))} />
              </View>

              <View style={[styles.cell, { width: COL_WIDTHS.upload }]}>
                <TextInput style={styles.cellInput} placeholder="0" value={loadForm.loading_chg} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, loading_chg: v }))} />
              </View>
              <View style={[styles.cell, { width: COL_WIDTHS.download }]}>
                <TextInput style={styles.cellInput} placeholder="0" value={loadForm.unloading_chg} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, unloading_chg: v }))} />
              </View>
              <View style={[styles.cell, { width: COL_WIDTHS.lComm }]}>
                <TextInput style={styles.cellInput} placeholder="0" value={loadForm.loading_comm} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, loading_comm: v }))} />
              </View>
              <View style={[styles.cell, { width: COL_WIDTHS.uComm }]}>
                <TextInput style={styles.cellInput} placeholder="0" value={loadForm.unloading_comm} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, unloading_comm: v }))} />
              </View>
              <View style={[styles.cell, { width: COL_WIDTHS.broker }]}>
                <TextInput style={styles.cellInput} placeholder="0" value={loadForm.broker_comm} keyboardType="numeric" onChangeText={v => setLoadForm(f => ({ ...f, broker_comm: v }))} />
              </View>

              <View style={[styles.cell, { width: COL_WIDTHS.collected, alignItems: 'center' }]}>
                <TouchableOpacity onPress={() => setLoadForm(f => ({ ...f, collected: !f.collected }))}>
                  <Ionicons name={loadForm.collected ? "checkbox" : "square-outline"} size={20} color={loadForm.collected ? Colors.accent : Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={[styles.cell, { width: COL_WIDTHS.actions, alignItems: 'center' }]}>
                <TouchableOpacity onPress={handleAddLoad} disabled={createLoad.isPending}>
                  {createLoad.isPending ? <ActivityIndicator size="small" color={Colors.primary} /> : <Ionicons name="add-circle" size={28} color={Colors.primary} />}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Selection Modals */}
      <Modal visible={showCustomerModal} transparent animationType="slide">
        <View style={styles.selectionModalOverlay}>
          <View style={styles.selectionModalContent}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => { setShowCustomerModal(false); setCustomerSearchQuery(''); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search customer..."
              value={customerSearchQuery}
              onChangeText={setCustomerSearchQuery}
              autoFocus
            />
            <ScrollView style={{ maxHeight: 400 }}>
              {(customers || [])
                .filter(c => c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()))
                .map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.selectionItem}
                    onPress={() => {
                      setLoadForm(f => ({ ...f, customer_id: c.id, product_id: '', product_name: '', gross_rent: '' }));
                      setSelectedCustomerId(c.id);
                      setShowCustomerModal(false);
                      setCustomerSearchQuery('');
                    }}
                  >
                    <Text style={styles.selectionItemText}>{c.name}</Text>
                    {loadForm.customer_id === c.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.selectionModalOverlay}>
          <View style={styles.selectionModalContent}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>Select Rate Card</Text>
              <TouchableOpacity onPress={() => { setShowProductModal(false); setProductSearchQuery(''); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search product..."
              value={productSearchQuery}
              onChangeText={setProductSearchQuery}
              autoFocus
            />
            <ScrollView style={{ maxHeight: 400 }}>
              {(products || [])
                .filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                .map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.selectionItem}
                    onPress={() => {
                      const qty = parseFloat(loadForm.quantity) || 0;
                      setLoadForm(f => ({
                        ...f,
                        product_id: p.id,
                        product_name: p.name,
                        rent_type: p.unit_type,
                        gross_rent: (p.default_rate * qty).toString()
                      }));
                      setShowProductModal(false);
                      setProductSearchQuery('');
                    }}
                  >
                    <View>
                      <Text style={styles.selectionItemText}>{p.name}</Text>
                      <Text style={styles.selectionItemSub}>₹{p.default_rate} / {p.unit_type}</Text>
                    </View>
                    {loadForm.product_id === p.id && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
              <TouchableOpacity
                style={styles.selectionItem}
                onPress={() => {
                  setLoadForm(f => ({ ...f, product_id: '', product_name: '' }));
                  setShowProductModal(false);
                  setProductSearchQuery('');
                }}
              >
                <Text style={styles.selectionItemText}>Custom Product</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {isCompleted && !showEdit && (
        <>
          <View style={styles.divider} />
          <View style={styles.formCard}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Expense Breakdown</Text>
              <TouchableOpacity onPress={() => setShowEdit(true)}><Ionicons name="create-outline" size={20} color={Colors.primary} /></TouchableOpacity>
            </View>
            <View style={styles.expenseRow}>
              <Text style={styles.expenseLabel}>Fuel Cost</Text>
              <Text style={styles.expenseValue}>₹{trip.fuel_cost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.expenseRow, { borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.sm, marginTop: Spacing.xs }]}>
              <Text style={[styles.expenseLabel, { fontWeight: '700', color: Colors.text }]}>Net Amount</Text>
              <Text style={[styles.expenseValue, { fontWeight: '700', color: netAmount >= 0 ? Colors.accent : Colors.error }]}>₹{netAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </>
      )}

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
              <TextInput style={styles.input} placeholder="0" value={completeForm.fuel_cost} onChangeText={v => setCompleteForm(f => ({ ...f, fuel_cost: v }))} keyboardType="numeric" />
              <Text style={styles.formLabel}>Driver Expense</Text>
              <TextInput style={styles.input} placeholder="0" value={completeForm.other_expenses} onChangeText={v => setCompleteForm(f => ({ ...f, other_expenses: v }))} keyboardType="numeric" />
              <Text style={styles.formLabel}>Driver Charge</Text>
              <TextInput style={styles.input} placeholder="0" value={completeForm.driver_charge} onChangeText={v => setCompleteForm(f => ({ ...f, driver_charge: v }))} keyboardType="numeric" />
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setShowComplete(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.completeBtn, { flex: 2 }]} onPress={() => showConfirm('completeTrip')}><Ionicons name="checkmark-done-circle" size={18} color="#fff" /><Text style={styles.completeBtnText}>Confirm & Settle</Text></TouchableOpacity>
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
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
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
  toggleDotActive: { backgroundColor: Colors.accent, alignSelf: 'flex-end' },
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
  deleteBtn: { backgroundColor: Colors.error },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  settleContainer: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadow.card,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  settleInfo: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  remainingBox: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  remainingLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  remainingValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.error,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  btn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableScrollView: {
    marginHorizontal: -Spacing.lg,
    marginBottom: Spacing.xl,
  },
  table: { paddingHorizontal: Spacing.lg },
  headerCell: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  editingRow: { backgroundColor: Colors.surfaceElevated },
  newRow: {
    backgroundColor: Colors.surface,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  cell: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    justifyContent: 'center',
  },
  cellText: { fontSize: FontSize.sm, color: Colors.text },
  cellInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  cellSelector: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  cellSelectorText: { fontSize: FontSize.xs, color: Colors.text },
  miniChipGroup: { flexDirection: 'row', gap: 4 },
  miniChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.borderLight,
  },
  miniChipActive: { backgroundColor: Colors.primary },
  miniChipText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  selectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  selectionModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectionModalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  selectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  selectionItemText: { fontSize: FontSize.md, color: Colors.text },
  selectionItemSub: { fontSize: FontSize.xs, color: Colors.textMuted },
  searchInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.md,
  },



});
