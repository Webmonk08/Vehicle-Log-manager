import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { driversApi, loadsApi, tripsApi } from "@/api/entities";

export function HomeScreen() {
  const [ongoingTrips, setOngoingTrips] = React.useState(0);
  const [totalDebt, setTotalDebt] = React.useState(0);
  const [pendingLoads, setPendingLoads] = React.useState(0);

  React.useEffect(() => {
    // .catch here is required, not optional — with no backend running (or a
    // wrong API_BASE_URL) these reject with a network error, and unhandled
    // rejections show up as scary red-screen errors in Expo even though the
    // screen itself renders fine with the defaults.
    tripsApi.list({ status: "ongoing" }).then((t) => setOngoingTrips(t.length)).catch(() => {});
    loadsApi.list({ status: "pending" }).then((l) => setPendingLoads(l.length)).catch(() => {});
    driversApi
      .list()
      .then((drivers) => setTotalDebt(drivers.reduce((s, d) => s + d.debt, 0)))
      .catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.grid}>
        <SummaryCard label="Ongoing Trips" value={String(ongoingTrips)} />
        <SummaryCard label="Total Driver Debt" value={`₹${totalDebt.toLocaleString("en-IN")}`} />
        <SummaryCard label="Month's Expenses" value="—" />
        <SummaryCard label="Pending Loads" value={String(pendingLoads)} />
      </View>
    </ScrollView>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  cardValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
  cardLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
});