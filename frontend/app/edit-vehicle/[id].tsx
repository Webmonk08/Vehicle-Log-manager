import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useVehicle, useUpdateVehicle } from '@/hooks/useApi';
import { LoadingState } from '@/components/StateViews';

export default function EditVehicleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vehicle, isLoading } = useVehicle(id);
  const updateVehicle = useUpdateVehicle();

  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');

  useEffect(() => {
    if (vehicle) {
      setPlateNumber(vehicle.plate_number);
      setModel(vehicle.model || '');
    }
  }, [vehicle]);

  if (isLoading || !vehicle) return <LoadingState message="Loading vehicle..." />;

  const handleUpdate = async () => {
    if (!plateNumber.trim()) return Alert.alert('Error', 'Plate number is required');
    try {
      await updateVehicle.mutateAsync({ id, data: { plate_number: plateNumber.trim(), model: model.trim() || undefined } });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to update vehicle');
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
          <Text style={styles.label}>Plate Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter plate number"
            placeholderTextColor={Colors.textMuted}
            value={plateNumber}
            onChangeText={setPlateNumber}
          />

          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter model (optional)"
            placeholderTextColor={Colors.textMuted}
            value={model}
            onChangeText={setModel}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, updateVehicle.isPending && styles.saveBtnDisabled]}
          onPress={handleUpdate}
          disabled={updateVehicle.isPending}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>
            {updateVehicle.isPending ? 'Saving...' : 'Save Changes'}
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