import React from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DriversStackParamList } from "@/navigation/RootNavigator";
import { driversApi } from "@/api/entities";
import { tripsApi } from "@/api/entities";
import type { Driver, DriverLedgerEntry,Trip} from "@/types";
import { DebtSummaryCard } from "@/components/DebtSummaryCard";
import { AmountPromptModal } from "@/components/AmountPromptModal";

type Props = NativeStackScreenProps<DriversStackParamList, "DriverDetail">;

export function DriverDetailScreen({ route, navigation }: Props) {
  const { driverId } = route.params;
  const [driver, setDriver] = React.useState<Driver | null>(null);
  const [tab, setTab] = React.useState<"history" | "ledger">("ledger");
  const [ledger, setLedger] = React.useState<DriverLedgerEntry[]>([]);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [settleOpen, setSettleOpen] = React.useState(false);

  const load = React.useCallback(() => {
    driversApi.get(driverId).then(setDriver).catch(() => {});
    driversApi.ledger(driverId).then(setLedger).catch(() => {});
    tripsApi.list({ driver_id: driverId }).then(setTrips).catch(() => {});
  }, [driverId]);

  React.useEffect(load, [load]);

  const handleSettle = async ({ amount, note }: { amount: number; note?: string }) => {
    await driversApi.recordSettlement(driverId, {
      driver_id: driverId, amount, date: new Date().toISOString().slice(0, 10), note,
    });
    setSettleOpen(false);
    load();
  };

  if (!driver) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.profileCard}>
        <Text style={styles.name}>{driver.name}</Text>
        <Text style={styles.meta}>{driver.phone ?? "—"}</Text>
        <Text style={styles.meta}>License: {driver.license_number ?? "—"}</Text>
      </View>

      <DebtSummaryCard
        summary={{
          collected: 0, pending: 0, expenses: 0, settlements: 0, net_debt: driver.debt,
        }}
      />

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === "history" && styles.tabActive]} onPress={() => setTab("history")}>
          <Text style={tab === "history" ? styles.tabTextActive : styles.tabText}>Trip History</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === "ledger" && styles.tabActive]} onPress={() => setTab("ledger")}>
          <Text style={tab === "ledger" ? styles.tabTextActive : styles.tabText}>Ledger</Text>
        </Pressable>
      </View>

      {tab === "history" && (
        <View style={{ gap: 8 }}>
          {trips.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#6B7280", padding: 20 }}>No trips found.</Text>
          ) : (
            trips.map((trip) => (
              <Pressable
                key={trip.id}
                style={styles.ledgerRow}
                onPress={() => navigation.navigate("TripDetail", { tripId: trip.id })}
              >
                <View>
                  <Text style={styles.ledgerLabel}>Trip started {new Date(trip.start_date).toLocaleDateString()}</Text>
                  <Text style={styles.ledgerDate}>Status: {trip.status}</Text>
                </View>
                <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
                  <Text style={{ color: "#3B82F6", fontWeight: "600" }}>View →</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}

      {tab === "ledger" && (
        <View style={{ gap: 8 }}>
          {ledger.map((entry, i) => (
            <View key={i} style={styles.ledgerRow}>
              <View>
                <Text style={styles.ledgerLabel}>{entry.label}</Text>
                <Text style={styles.ledgerDate}>{entry.date}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: entry.amount >= 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>
                  {entry.amount >= 0 ? "+" : ""}₹{entry.amount.toLocaleString("en-IN")}
                </Text>
                <Text style={styles.ledgerBalance}>Bal: ₹{entry.running_balance.toLocaleString("en-IN")}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.settleButton} onPress={() => setSettleOpen(true)}>
        <Text style={styles.settleButtonText}>Settle / Record Payment</Text>
      </Pressable>

      <AmountPromptModal
        visible={settleOpen}
        title="Settle Payment"
        amountLabel="Amount received from driver (₹)"
        onCancel={() => setSettleOpen(false)}
        onSubmit={handleSettle}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  profileCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  name: { fontSize: 18, fontWeight: "800", color: "#111827" },
  meta: { color: "#6B7280", marginTop: 4 },
  tabs: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#fff" },
  tabText: { color: "#6B7280", fontWeight: "600" },
  tabTextActive: { color: "#111827" },
  ledgerRow: {
    flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff",
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#E5E7EB",
  },
  ledgerLabel: { fontWeight: "600", color: "#111827" },
  ledgerDate: { color: "#9CA3AF", fontSize: 12, marginTop: 2 },
  ledgerBalance: { color: "#9CA3AF", fontSize: 11, marginTop: 2 },
  settleButton: { backgroundColor: "#111827", padding: 14, borderRadius: 10, alignItems: "center" },
  settleButtonText: { color: "#fff", fontWeight: "700" },
});