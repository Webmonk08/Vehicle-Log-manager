import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { dashboardApi } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";

export function HomeScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard_summary"],
    queryFn: dashboardApi.summary,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.grid}>
        <SummaryCard label="Ongoing Trips" value={isLoading ? "..." : String(data?.ongoing_trips || 0)} />
        <SummaryCard label="Total Driver Debt" value={isLoading ? "..." : `₹${(data?.total_debt || 0).toLocaleString("en-IN")}`} />
        <SummaryCard label="Month's Expenses" value="—" />
        <SummaryCard label="Pending Loads" value={isLoading ? "..." : String(data?.pending_loads || 0)} />
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