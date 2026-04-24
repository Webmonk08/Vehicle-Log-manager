import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, Pressable,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: 'primary' | 'danger' | 'info';
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  type = 'primary',
}: ConfirmDialogProps) {
  const isInfo = type === 'info';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <Pressable 
        style={styles.modalOverlay} 
        onPress={() => !loading && (onCancel ? onCancel() : onConfirm())}
      >
        <View style={styles.dialogContainer}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>
          
          <View style={styles.dialogActions}>
            {!isInfo && onCancel && (
              <TouchableOpacity 
                style={[styles.dialogBtn, styles.cancelBtn]} 
                onPress={onCancel}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.dialogBtn, 
                type === 'danger' ? styles.deleteBtn : styles.confirmBtn,
                isInfo && { flex: 1 }
              ]} 
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>{isInfo ? 'OK' : confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialogContainer: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadow.card,
  },
  dialogTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  dialogMessage: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dialogBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  confirmBtn: { backgroundColor: Colors.primary },
  deleteBtn: { backgroundColor: Colors.error },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});
