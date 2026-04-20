import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/Theme';
import { LedgerEntry } from '@/types';

interface LedgerEntryRowProps {
  entry: LedgerEntry;
}

export default function LedgerEntryRow({ entry }: LedgerEntryRowProps) {
  const isDebit = entry.type === 'Debit';

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: isDebit ? Colors.errorMuted : Colors.accentMuted }]}>
        <Ionicons
          name={isDebit ? 'arrow-up' : 'arrow-down'}
          size={16}
          color={isDebit ? Colors.error : Colors.success}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {entry.description || (isDebit ? 'Debit' : 'Credit')}
        </Text>
        <Text style={styles.date}>
          {new Date(entry.created_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </Text>
      </View>
      <Text style={[styles.amount, { color: isDebit ? Colors.error : Colors.success }]}>
        {isDebit ? '-' : '+'}₹{entry.amount.toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: { flex: 1 },
  description: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
