import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { VehiclesStackParamList } from "@/navigation/RootNavigator";
import { vehicleExpensesApi, vehiclesApi } from "@/api/entities";
import type { Vehicle, VehicleExpense } from "@/types";

type Props = NativeStackScreenProps<VehiclesStackParamList, "VehicleDetail">;

export function VehicleDetailScreen({ route }: Props) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = React.useState<Vehicle | null>(null);
  const [expenses, setExpenses] = React.useState<VehicleExpense[]>([]);

  React.useEffect(() => {
    vehiclesApi.get(vehicleId).then(setVehicle).catch(() => {});
    vehicleExpensesApi.list({ vehicle_id: vehicleId }).then(setExpenses).catch(() => {});
  }, [vehicleId]);

  if (!vehicle) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.infoCard}>
        <Text style={styles.number}>{vehicle.number}</Text>
        <Text style={styles.meta}>{vehicle.type ?? "—"} · Capacity: {vehicle.capacity ?? "—"}</Text>
        <Text style={styles.meta}>Insurance expiry: {vehicle.insurance_expiry ?? "—"}</Text>
      </View>

      <Text style={styles.sectionTitle}>Expenses</Text>
      {expenses.map((e) => (
        <View key={e.id} style={styles.expenseRow}>
          <Text style={styles.expenseCategory}>{e.category}</Text>
          <Text style={styles.expenseAmount}>₹{e.amount.toLocaleString("en-IN")}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  infoCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  number: { fontSize: 18, fontWeight: "800", color: "#111827" },
  meta: { color: "#6B7280", marginTop: 4 },
  sectionTitle: { fontWeight: "700", color: "#111827" },
  expenseRow: {
    flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff",
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB",
  },
  expenseCategory: { color: "#111827", fontWeight: "600" },
  expenseAmount: { color: "#111827" },
});
