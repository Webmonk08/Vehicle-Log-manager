import React from "react";
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TripsStackParamList } from "@/navigation/RootNavigator";
import { customersApi, loadsApi, productsApi, tripExpensesApi, tripsApi } from "@/api/entities";
import type { Customer, Load, Product, Trip, TripDebtSummary, TripExpense, TripExpenseCategory } from "@/types";
import { DebtSummaryCard } from "@/components/DebtSummaryCard";
import { StatusChip } from "@/components/StatusChip";
import { CurrencyInput } from "@/components/CurrencyInput";
import { CompleteLoadModal, type CompleteLoadValues } from "@/components/CompleteLoadModal";

type Props = NativeStackScreenProps<TripsStackParamList, "TripDetail">;

const EXPENSE_TILES: { category: TripExpenseCategory; label: string; icon: string }[] = [
  { category: "fuel", label: "Fuel", icon: "⛽" },
  { category: "toll", label: "Toll", icon: "🛣️" },
  { category: "driver_wage", label: "Driver Wage", icon: "💵" },
  { category: "other", label: "Other", icon: "➕" },
];

export function TripDetailScreen({ route, navigation }: Props) {
  const { tripId } = route.params;

  const [trip, setTrip] = React.useState<Trip | null>(null);
  const [loads, setLoads] = React.useState<Load[]>([]);
  const [expenses, setExpenses] = React.useState<TripExpense[]>([]);
  const [debt, setDebt] = React.useState<TripDebtSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [completingLoad, setCompletingLoad] = React.useState<Load | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id.slice(0, 6);
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? id.slice(0, 6);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [t, l, e, d, p, c] = await Promise.all([
        tripsApi.get(tripId),
        loadsApi.list({ trip_id: tripId }),
        tripExpensesApi.list(tripId),
        tripsApi.debtSummary(tripId),
        productsApi.list(),
        customersApi.list(),
      ]);
      setTrip(t);
      setLoads(l);
      setExpenses(e);
      setDebt(d);
      setProducts(p);
      setCustomers(c);
    } catch (err: any) {
      if (!err.isOffline) Alert.alert("Error", "Could not load trip. Pull to retry.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  React.useEffect(() => {
    // Refresh on every focus, not just mount — so returning from "Add Load"
    // or "Edit Load" (separate stack screens) shows the latest state.
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation, load]);

  const expenseAmount = (category: TripExpenseCategory) =>
    expenses.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0);

  const handleExpenseChange = async (category: TripExpenseCategory, amount: number) => {
    const existing = expenses.find((e) => e.category === category && !e.custom_label);
    try {
      if (existing) {
        const updated = await tripExpensesApi.update(existing.id, { amount });
        setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await tripExpensesApi.create({
          trip_id: tripId, category, amount, date: new Date().toISOString().slice(0, 10),
        });
        setExpenses((prev) => [...prev, created]);
      }
      const d = await tripsApi.debtSummary(tripId);
      setDebt(d);
    } catch {
      Alert.alert("Offline", "Expense will sync when you're back online.");
    }
  };

  const handleDeleteLoad = (loadItem: Load) => {
    Alert.alert("Delete load?", "This removes it from the trip entirely.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await loadsApi.remove(loadItem.id);
          setLoads((prev) => prev.filter((l) => l.id !== loadItem.id));
          setDebt(await tripsApi.debtSummary(tripId));
        },
      },
    ]);
  };

  const handleCompleteLoad = async (values: CompleteLoadValues) => {
    if (!completingLoad) return;
    const updated = await loadsApi.collect(completingLoad.id, values);
    setLoads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setDebt(await tripsApi.debtSummary(tripId));
    setCompletingLoad(null);
  };

  const handleCompleteTrip = async () => {
    try {
      await tripsApi.complete(tripId);
      Alert.alert("Trip completed");
      load();
    } catch (err: any) {
      Alert.alert("Cannot complete trip", err?.response?.data?.detail ?? "All loads must be Collected first.");
    }
  };

  const allCollected = loads.length > 0 && loads.every((l) => l.status === "collected");

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <Text>Loading trip...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.header}>
        <StatusChip status={trip.status} kind="trip" />
      </View>

      {debt && <DebtSummaryCard summary={debt} />}

      <View>
        <Text style={styles.sectionTitle}>Loads</Text>
        <ScrollView horizontal>
          <View>
            <View style={styles.tableHeaderRow}>
              {["Product", "Customer", "Charge", "Wages", "Net", "Status", "Edit", "Del"].map((h) => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            <View style={styles.tableBody}>
              {loads.map((l) => (
                <View key={l.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{productName(l.product_id)}</Text>
                  <Text style={styles.tableCell}>{customerName(l.customer_id)}</Text>
                  <Text style={styles.tableCell}>
                    ₹{l.charge}{l.charge_type === "kg" && l.kg_variant ? ` (${l.kg_variant}kg)` : ""}
                  </Text>
                  <Text style={styles.tableCell}>{l.status === "collected" ? `₹${l.wages}` : "—"}</Text>
                  <Text style={[styles.tableCell, styles.netCell]}>₹{l.net}</Text>
                  {l.status === "collected" ? (
                    <StatusChip status={l.status} kind="load" />
                  ) : (
                    <Pressable style={styles.completeButtonSmall} onPress={() => setCompletingLoad(l)}>
                      <Text style={styles.completeButtonSmallText}>Complete</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => navigation.navigate("LoadCreate", { tripId, loadId: l.id })}
                    style={styles.rowIconButton}
                  >
                    <Text style={styles.rowIconText}>✏️</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeleteLoad(l)} style={styles.rowIconButton}>
                    <Text style={styles.rowIconText}>🗑</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable
                style={styles.addLoadRow}
                onPress={() => navigation.navigate("LoadCreate", { tripId })}
              >
                <Text style={styles.addLoadText}>+ Add Load</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>

      <View>
        <Text style={styles.sectionTitle}>Expenses</Text>
        <View style={styles.expenseGrid}>
          {EXPENSE_TILES.map((tile) => (
            <View key={tile.category} style={styles.expenseTile}>
              <Text style={styles.expenseTileLabel}>{tile.icon} {tile.label}</Text>
              <CurrencyInput
                value={expenseAmount(tile.category)}
                onChangeValue={(v) => handleExpenseChange(tile.category, v)}
              />
            </View>
          ))}
        </View>
        <Text style={styles.totalExpenses}>
          Total: ₹{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")}
        </Text>
      </View>

      <Pressable
        style={[styles.completeTripButton, !allCollected && styles.completeTripButtonDisabled]}
        disabled={!allCollected}
        onPress={handleCompleteTrip}
      >
        <Text style={styles.completeTripButtonText}>
          {allCollected ? "Mark Trip Complete" : "Complete all loads to finish trip"}
        </Text>
      </Pressable>

      <CompleteLoadModal
        visible={!!completingLoad}
        onCancel={() => setCompletingLoad(null)}
        onSubmit={handleCompleteLoad}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 8 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 8 },
  tableHeaderCell: { width: 100, padding: 8, fontSize: 12, fontWeight: "700", color: "#6B7280" },
  tableRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  tableCell: { width: 100, padding: 8, fontSize: 13, color: "#111827" },
  netCell: { fontWeight: "700" },
  completeButtonSmall: { backgroundColor: "#22C55E", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, width: 100, marginHorizontal: 0 },
  completeButtonSmallText: { color: "#fff", fontWeight: "700", fontSize: 12, textAlign: "center" },
  rowIconButton: { width: 40, alignItems: "center", padding: 8 },
  rowIconText: { fontSize: 14 },
  tableBody: {},
  addLoadRow: { padding: 10, alignItems: "center" },
  addLoadText: { color: "#3B82F6", fontWeight: "600" },
  expenseGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  expenseTile: {
    width: "47%", backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 10, padding: 10, gap: 6,
  },
  expenseTileLabel: { fontSize: 13, color: "#374151", fontWeight: "600" },
  totalExpenses: { marginTop: 8, fontWeight: "700", color: "#111827" },
  completeTripButton: { backgroundColor: "#22C55E", padding: 14, borderRadius: 10, alignItems: "center" },
  completeTripButtonDisabled: { backgroundColor: "#D1D5DB" },
  completeTripButtonText: { color: "#fff", fontWeight: "700" },
});