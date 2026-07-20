import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DebtSummary } from "@/types";

function formatRupees(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function DebtSummaryCard({ summary }: { summary: DebtSummary }) {
  const debtColor = summary.net_debt >= 0 ? "#22C55E" : "#EF4444";

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Metric label="Collected" value={formatRupees(summary.collected)} />
        <Metric label="Pending" value={formatRupees(summary.pending)} />
      </View>
      <View style={styles.row}>
        <Metric label="Expenses" value={formatRupees(summary.expenses)} />
        <Metric label="Settlements" value={formatRupees(summary.settlements)} />
      </View>
      <View style={styles.divider} />
      <View style={styles.netRow}>
        <Text style={styles.netLabel}>Net Debt</Text>
        <Text style={[styles.netValue, { color: debtColor }]}>{formatRupees(summary.net_debt)}</Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  metric: { flex: 1 },
  metricLabel: { fontSize: 12, color: "#6B7280" },
  metricValue: { fontSize: 16, fontWeight: "600", color: "#111827", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 4 },
  netRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  netLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  netValue: { fontSize: 22, fontWeight: "800" },
});
