import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useDrivers, useCreateDriver } from '@/hooks/useApi';
import { EmptyState, LoadingState } from '@/components/StateViews';
import { Driver } from '@/types';

export default function DriversScreen() {
  const { data: drivers, isLoading, refetch } = useDrivers();
  const createDriver = useCreateDriver();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    try {
      await createDriver.mutateAsync({ name: name.trim(), contact: contact.trim() || undefined });
      setName('');
      setContact('');
      setShowAdd(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create driver');
    }
  };

  const displayDrivers = drivers || [];

  const renderDriver = ({ item }: { item: Driver }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/driver/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.driverName}>{item.name}</Text>
        <Text style={styles.driverContact}>{item.contact || 'No contact'}</Text>
      </View>
      <View style={styles.pendingBadge}>
        <Text style={[
          styles.pendingAmount,
          { color: item.total_pending_amount > 0 ? Colors.error : Colors.success },
        ]}>
          ₹{Math.abs(item.total_pending_amount).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.pendingLabel}>
          {item.total_pending_amount > 0 ? 'Debt' : 'Settled'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Add Driver Form */}
      {showAdd && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Driver Name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Contact Number"
            placeholderTextColor={Colors.textMuted}
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />
          <View style={styles.addBtnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Add Driver</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={displayDrivers}
        keyExtractor={item => item.id}
        renderItem={renderDriver}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          isLoading
            ? <LoadingState />
            : <EmptyState icon="people-outline" title="No drivers" subtitle="Add a driver to get started" />
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAdd(!showAdd)}
        activeOpacity={0.8}
      >
        <Ionicons name={showAdd ? 'close' : 'person-add'} size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardContent: {
    flex: 1,
  },
  driverName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  driverContact: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  pendingBadge: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  pendingAmount: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  pendingLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
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
