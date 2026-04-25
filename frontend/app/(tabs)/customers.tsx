import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useCustomers, useCreateCustomer } from '@/hooks/useApi';
import { LoadingState, EmptyState } from '@/components/StateViews';

export default function CustomersScreen() {
  const { data: customers, isLoading, refetch } = useCustomers();
  const createCustomer = useCreateCustomer();
  const [modalVisible, setModalVisible] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', default_rate: '' });

  const handleCreate = async () => {
    if (!newCustomer.name) return;
    try {
      await createCustomer.mutateAsync({
        name: newCustomer.name,
        default_rate_per_kg: newCustomer.default_rate ? parseFloat(newCustomer.default_rate) : undefined,
      });
      setModalVisible(false);
      setNewCustomer({ name: '', default_rate: '' });
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) return <LoadingState message="Loading customers..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push(`/customer/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="business" size={24} color={Colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.default_rate_per_kg && (
                  <Text style={styles.rate}>Standard Rate: ₹{item.default_rate_per_kg}/kg</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState 
            icon="business-outline" 
            title="No customers found" 
            subtitle="Add your first customer to manage their rate card" 
          />
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Customer</Text>
            
            <Text style={styles.label}>Customer Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ABC Industries"
              value={newCustomer.name}
              onChangeText={(v) => setNewCustomer(prev => ({ ...prev, name: v }))}
            />

            <Text style={styles.label}>Default Rate per KG (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={newCustomer.default_rate}
              onChangeText={(v) => setNewCustomer(prev => ({ ...prev, default_rate: v }))}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.btn, styles.cancelBtn]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.submitBtn]} 
                onPress={handleCreate}
                disabled={createCustomer.isPending}
              >
                {createCustomer.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Customer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  info: { flex: 1 },
  name: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  rate: { fontSize: FontSize.sm, color: Colors.textSecondary },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: -8 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  btn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.borderLight },
  submitBtn: { backgroundColor: Colors.primary },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  submitBtnText: { color: '#fff', fontWeight: '700' },
});
