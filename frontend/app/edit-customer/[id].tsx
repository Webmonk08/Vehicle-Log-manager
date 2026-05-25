import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useCustomer, useUpdateCustomer } from '@/hooks/useApi';
import { LoadingState } from '@/components/StateViews';

export default function EditCustomerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: customer, isLoading } = useCustomer(id);
  const updateCustomer = useUpdateCustomer();

  const [name, setName] = useState('');
  const [defaultRate, setDefaultRate] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setDefaultRate(customer.default_rate_per_kg?.toString() || '');
    }
  }, [customer]);

  if (isLoading || !customer) return <LoadingState message="Loading customer..." />;

  const handleUpdate = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    try {
      await updateCustomer.mutateAsync({ id, data: { name: name.trim(), default_rate_per_kg: defaultRate ? parseFloat(defaultRate) : undefined } });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to update customer');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={styles.label}>Customer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter customer's name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Default Rate per KG</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter default rate (optional)"
            placeholderTextColor={Colors.textMuted}
            value={defaultRate}
            onChangeText={setDefaultRate}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, updateCustomer.isPending && styles.saveBtnDisabled]}
          onPress={handleUpdate}
          disabled={updateCustomer.isPending}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>
            {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.lg,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.primaryMuted,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: FontSize.lg,
  },
});