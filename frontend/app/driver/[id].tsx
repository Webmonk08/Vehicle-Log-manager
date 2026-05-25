
    
    import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import {
  useDriver, useDriverLedger, useDriverUncollected, useSettleLoad, useDeleteDriver,
} from '@/hooks/useApi';
import LoadItem from '@/components/LoadItem';
import LedgerEntryRow from '@/components/LedgerEntryRow';
import { LoadingState, EmptyState } from '@/components/StateViews';
import ConfirmDialog from '@/components/ConfirmDialog';

type Tab = 'uncollected' | 'ledger';

export default function DriverProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: driver, isLoading, refetch } = useDriver(id);
  const { data: ledger, refetch: refetchLedger } = useDriverLedger(id);
  const { data: uncollected, refetch: refetchUncollected } = useDriverUncollected(id);
  const settleLoad = useSettleLoad();
  const deleteDriver = useDeleteDriver();
  const [tab, setTab] = useState<Tab>('uncollected');
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLoading || !driver) return <LoadingState message="Loading driver..." />;

  const totalDebits = (ledger || []).filter(e => e.type === 'Debit').reduce((s, e) => s + e.amount, 0);
  const totalCredits = (ledger || []).filter(e => e.type === 'Credit').reduce((s, e) => s + e.amount, 0);

  const handleSettle = async (load: any) => {
    try {
      const loadNetRent = load.gross_rent - load.loading_chg - load.unloading_chg
        - load.loading_comm - load.unloading_comm - load.broker_comm;
      const remaining = loadNetRent - load.amount_collected;

      await settleLoad.mutateAsync({ 
        id: load.id, 
        data: { 
          amount_received: remaining 
        } 
      });
      refetch();
      refetchLedger();
      refetchUncollected();
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDriver.mutateAsync(id);
      router.back();
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleRefresh = () => {
    refetch();
    refetchLedger();
    refetchUncollected();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={Colors.primary} />}
    >
      <ConfirmDialog
        visible={showConfirm}
        title="Delete Driver"
        message={`Are you sure you want to delete ${driver.name}? This action cannot be undone.`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        confirmText="Delete"
        type="danger"
      />

      {/* Profile Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileCard}
      >
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push(`/edit-driver/${id}`)}>
            <Ionicons name="pencil" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowConfirm(true)}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{driver.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{driver.name}</Text>
        {driver.contact && <Text style={styles.profileContact}>{driver.contact}</Text>}
      </LinearGradient>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="arrow-up-circle" size={20} color={Colors.error} />
          <Text style={styles.statLabel}>Total Debits</Text>
          <Text style={[styles.statValue, { color: Colors.error }]}>₹{totalDebits.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="arrow-down-circle" size={20} color={Colors.success} />
          <Text style={styles.statLabel}>Total Credits</Text>
          <Text style={[styles.statValue, { color: Colors.success }]}>₹{totalCredits.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.statBox, { borderColor: driver.total_pending_amount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)' }]}>
          <Ionicons name="wallet" size={20} color={driver.total_pending_amount > 0 ? Colors.error : Colors.success} />
          <Text style={styles.statLabel}>Debt</Text>
          <Text style={[styles.statValue, { color: driver.total_pending_amount > 0 ? Colors.error : Colors.success }]}>
            ₹{Math.abs(driver.total_pending_amount).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'uncollected' && styles.tabBtnActive]}
          onPress={() => setTab('uncollected')}
        >
          <Text style={[styles.tabText, tab === 'uncollected' && styles.tabTextActive]}>
            Uncollected ({(uncollected || []).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'ledger' && styles.tabBtnActive]}
          onPress={() => setTab('ledger')}
        >
          <Text style={[styles.tabText, tab === 'ledger' && styles.tabTextActive]}>
            Ledger ({(ledger || []).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {tab === 'uncollected' ? (
        (uncollected || []).length === 0 ? (
          <EmptyState icon="checkmark-done-circle" title="All clear!" subtitle="No uncollected loads" />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {(uncollected || []).map(load => (
              <LoadItem
                key={load.id}
                load={load}
                showSettleButton
                onSettle={() => handleSettle(load)}
              />
            ))}
          </View>
        )
      ) : (
        (ledger || []).length === 0 ? (
          <EmptyState icon="receipt-outline" title="No entries" subtitle="Ledger entries appear after trip completion" />
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {(ledger || []).map(entry => (
              <LedgerEntryRow key={entry.id} entry={entry} />
            ))}
          </View>
        )
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  profileCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.elevated,
  },
  headerActions: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  profileName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: '#fff',
  },
  profileContact: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  statValue: { fontSize: FontSize.md, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },
});
