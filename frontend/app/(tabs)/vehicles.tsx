import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useVehicles, useTaxReminders, useCreateVehicle } from '@/hooks/useApi';
import { EmptyState, LoadingState } from '@/components/StateViews';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Vehicle } from '@/types';

export default function VehiclesScreen() {
  const { data: vehicles, isLoading, refetch } = useVehicles();
  const { data: taxReminders } = useTaxReminders();
  const createVehicle = useCreateVehicle();
  
  const [showAdd, setShowAdd] = useState(false);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');

  // Dialog state
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'primary' | 'danger' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const taxReminderIds = new Set((taxReminders || []).map(v => v.id));

  const showInfo = (title: string, message: string) => {
    setDialog({ visible: true, title, message, type: 'info' });
  };

  const handleAdd = async () => {
    if (!plate.trim()) {
      return showInfo('Validation Error', 'Plate number is required');
    }
    try {
      await createVehicle.mutateAsync({
        plate_number: plate.trim(),
        model: model.trim() || undefined,
      });
      setPlate('');
      setModel('');
      setShowAdd(false);
    } catch (e: any) {
      showInfo('Error', e?.message || 'Failed to add vehicle');
    }
  };

  const displayVehicles = vehicles || [];

  const renderVehicle = ({ item }: { item: Vehicle }) => {
    const hasTaxWarning = taxReminderIds.has(item.id);
    const daysUntilTax = item.tax_due_date
      ? Math.ceil((new Date(item.tax_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <TouchableOpacity
        style={[styles.card, hasTaxWarning && styles.cardWarning]}
        onPress={() => router.push(`/vehicle/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.plateWrap}>
            <Ionicons name="car-sport" size={20} color={Colors.primary} />
            <Text style={styles.plate}>{item.plate_number}</Text>
          </View>
          {hasTaxWarning && (
            <View style={styles.taxBadge}>
              <Ionicons name="warning" size={12} color={Colors.error} />
              <Text style={styles.taxBadgeText}>
                {daysUntilTax !== null && daysUntilTax >= 0
                  ? `Tax in ${daysUntilTax}d`
                  : 'Tax Overdue'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardDetails}>
          {item.model && (
            <View style={styles.detailChip}>
              <Ionicons name="speedometer-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.detailText}>{item.model}</Text>
            </View>
          )}
          {item.last_service_date && (
            <View style={styles.detailChip}>
              <Ionicons name="build-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.detailText}>
                Service: {new Date(item.last_service_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={Colors.textMuted}
          style={{ position: 'absolute', right: 16, top: '50%', marginTop: -9 }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {/* Custom Info Dialog */}
            <ConfirmDialog
              visible={dialog.visible}
              title={dialog.title}
              message={dialog.message}
              type={dialog.type}
              onConfirm={() => setDialog(prev => ({ ...prev, visible: false }))}
            />

            {/* Tax Reminders Banner */}
            {(taxReminders?.length ?? 0) > 0 && (
              <View style={styles.banner}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.bannerText}>
                  {taxReminders!.length} vehicle{taxReminders!.length > 1 ? 's' : ''} with tax due soon!
                </Text>
              </View>
            )}

            {/* Add Vehicle Form */}
            {showAdd && (
              <View style={styles.addForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Plate Number (e.g. TN-38-AB-1234)"
                  placeholderTextColor={Colors.textMuted}
                  value={plate}
                  onChangeText={setPlate}
                  autoCapitalize="characters"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Model (optional)"
                  placeholderTextColor={Colors.textMuted}
                  value={model}
                  onChangeText={setModel}
                />
                <View style={styles.addBtnRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                    <Text style={styles.saveBtnText}>Add Vehicle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <FlatList
              data={displayVehicles}
              keyExtractor={item => item.id}
              renderItem={renderVehicle}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              ListEmptyComponent={
                isLoading
                  ? <LoadingState />
                  : <EmptyState icon="car-outline" title="No vehicles" subtitle="Add a vehicle to track expenses" />
              }
              refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
              }
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAdd(!showAdd)}
        activeOpacity={0.8}
      >
        <Ionicons name={showAdd ? 'close' : 'add'} size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  bannerText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: '600',
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  cardWarning: {
    borderColor: 'rgba(239,68,68,0.4)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  plateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  plate: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  taxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.errorMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  taxBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  addForm: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    margin: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  addBtnRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.elevated,
  },
});
