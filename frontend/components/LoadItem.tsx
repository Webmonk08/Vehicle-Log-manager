import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/Theme';
import { Load } from '@/types';

interface LoadItemProps {
  load: Load;
  onSettle?: () => void;
  showSettleButton?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function LoadItem({ load, onSettle, showSettleButton = false, onEdit, onDelete }: LoadItemProps) {
  const netAmount = load.gross_rent - load.loading_chg - load.unloading_chg
    - load.loading_comm - load.unloading_comm - load.broker_comm;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.product}>
            {load.product_name}
            {load.product?.name && load.product.name !== load.product_name && ` (${load.product.name})`}
          </Text>
          <Text style={styles.customer}>{load.customer_name || 'Customer'}</Text>
        </View>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
              <Ionicons name="pencil" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
        <View style={[
          styles.badge,
          load.collected_status ? styles.collectedBadge : styles.uncollectedBadge,
        ]}>
          <Ionicons
            name={load.collected_status ? 'checkmark-circle' : 'time-outline'}
            size={12}
            color={load.collected_status ? Colors.success : Colors.warning}
          />
          <Text style={[
            styles.badgeText,
            { color: load.collected_status ? Colors.success : Colors.warning },
          ]}>
            {load.collected_status ? 'Collected' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Qty</Text>
          <Text style={styles.detailValue}>{load.quantity} {load.rent_type}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Gross</Text>
          <Text style={styles.detailValue}>₹{load.gross_rent.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Net</Text>
          <Text style={[styles.detailValue, { color: Colors.accent }]}>
            ₹{netAmount.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {(load.loading_chg > 0 || load.unloading_chg > 0 || load.broker_comm > 0) && (
        <View style={styles.chargesRow}>
          {load.loading_chg > 0 && (
            <Text style={styles.chargeTag}>Load: ₹{load.loading_chg}</Text>
          )}
          {load.unloading_chg > 0 && (
            <Text style={styles.chargeTag}>Unload: ₹{load.unloading_chg}</Text>
          )}
          {load.broker_comm > 0 && (
            <Text style={styles.chargeTag}>Broker: ₹{load.broker_comm}</Text>
          )}
        </View>
      )}

      {showSettleButton && !load.collected_status && onSettle && (
        <TouchableOpacity style={styles.settleBtn} onPress={onSettle} activeOpacity={0.7}>
          <Ionicons name="checkmark-done" size={16} color="#fff" />
          <Text style={styles.settleBtnText}>Settle</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: { flex: 1 },
  product: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  customer: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  actionBtn: {
    padding: Spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  collectedBadge: { backgroundColor: Colors.accentMuted },
  uncollectedBadge: { backgroundColor: Colors.warningMuted },
  badgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  detail: {},
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  chargesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  chargeTag: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.md,
  },
  settleBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
});
