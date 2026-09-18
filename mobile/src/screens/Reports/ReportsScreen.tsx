import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { reportsApi } from "@/api/entities";
import { useDialog } from "@/hooks/useDialog";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function monthAgoISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 10);
}

export function ReportsScreen() {
  const { Dialog, showAlert } = useDialog();
  const [dateFrom, setDateFrom] = React.useState(monthAgoISO());
  const [dateTo, setDateTo] = React.useState(todayISO());
  const [summary, setSummary] = React.useState<{
    revenue: number; expenses: number; outstanding_debt: number; trip_count: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [showPickerFrom, setShowPickerFrom] = React.useState(false);
  const [showPickerTo, setShowPickerTo] = React.useState(false);

  const runReport = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.summary({ date_from: dateFrom, date_to: dateTo });
      setSummary(data);
    } catch (e: any) {
      console.log("Report Error:", e.message || e);
      showAlert("Error", "Could not load report. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runReport();
  }, []);

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.dateRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>From</Text>
          <Pressable style={styles.input} onPress={() => setShowPickerFrom(true)}>
            <Text style={{ color: dateFrom ? "#111827" : "#9CA3AF" }}>
              {dateFrom || "Select date"}
            </Text>
          </Pressable>
          {showPickerFrom && (
            <DateTimePicker
              value={dateFrom ? new Date(dateFrom) : new Date()}
              mode="date"
              display="default"
              onValueChange={(date) => {
                if (Platform.OS !== 'ios') setShowPickerFrom(false);
                if (date) setDateFrom(date.toISOString().slice(0, 10));
              }}
              onDismiss={() => setShowPickerFrom(false)}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>To</Text>
          <Pressable style={styles.input} onPress={() => setShowPickerTo(true)}>
            <Text style={{ color: dateTo ? "#111827" : "#9CA3AF" }}>
              {dateTo || "Select date"}
            </Text>
          </Pressable>
          {showPickerTo && (
            <DateTimePicker
              value={dateTo ? new Date(dateTo) : new Date()}
              mode="date"
              display="default"
              onValueChange={(date) => {
                if (Platform.OS !== 'ios') setShowPickerTo(false);
                if (date) setDateTo(date.toISOString().slice(0, 10));
              }}
              onDismiss={() => setShowPickerTo(false)}
            />
          )}
        </View>
      </View>
      <Pressable style={styles.applyButton} onPress={runReport}>
        <Text style={styles.applyText}>{loading ? "Loading..." : "Apply"}</Text>
      </Pressable>

      {summary && (
        <View style={styles.grid}>
          <SummaryCard label="Revenue" value={`₹${summary.revenue.toLocaleString("en-IN")}`} color="#16A34A" />
          <SummaryCard label="Expenses" value={`₹${summary.expenses.toLocaleString("en-IN")}`} color="#DC2626" />
          <SummaryCard label="Outstanding Debt" value={`₹${summary.outstanding_debt.toLocaleString("en-IN")}`} color="#D97706" />
          <SummaryCard label="Trip Count" value={String(summary.trip_count)} color="#111827" />
        </View>
      )}

      <Text style={styles.note}>
        Filter by Driver / Vehicle / Customer and charts aren't wired into this screen yet — the
        backend endpoint (`GET /reports/summary`) already accepts driver_id / vehicle_id /
        customer_id params, so add SearchableDropdown filters here the same way ChargeRulesListScreen does.
      </Text>
    </ScrollView>
    <Dialog />
    </>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  dateRow: { flexDirection: "row", gap: 10 },
  label: { fontSize: 11, color: "#6B7280", marginBottom: 4, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  applyButton: { backgroundColor: "#3B82F6", padding: 12, borderRadius: 10, alignItems: "center" },
  applyText: { color: "#fff", fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  cardValue: { fontSize: 20, fontWeight: "800" },
  cardLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  note: { color: "#9CA3AF", fontSize: 12, lineHeight: 18 },
});
