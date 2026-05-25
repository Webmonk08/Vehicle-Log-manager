import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useDriver, useUpdateDriver } from '@/hooks/useApi';
import { LoadingState } from '@/components/StateViews';

export default function EditDriverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: driver, isLoading } = useDriver(id);
  const updateDriver = useUpdateDriver();

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');

  useEffect(() => {
    if (driver) {
      setName(driver.name);
      setContact(driver.contact || '');
    }
  }, [driver]);

  if (isLoading || !driver) return <LoadingState message="Loading driver..." />;

  const handleUpdate = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required');
    try {
      await updateDriver.mutateAsync({ id, data: { name: name.trim(), contact: contact.trim() || undefined } });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to update driver');
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
          <Text style={styles.label}>Driver Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter driver's name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter contact number (optional)"
            placeholderTextColor={Colors.textMuted}
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, updateDriver.isPending && styles.saveBtnDisabled]}
          onPress={handleUpdate}
          disabled={updateDriver.isPending}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>
            {updateDriver.isPending ? 'Saving...' : 'Save Changes'}
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
