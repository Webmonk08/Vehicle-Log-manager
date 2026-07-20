import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CurrencyInput } from "./CurrencyInput";
import type { ChargeType } from "@/types";

export interface ChargeOptionRow {
  key: string; // local-only id for list rendering
  charge_type: ChargeType;
  kg_variant?: number;
  rate: number;
}

const CHARGE_TYPES: { label: string; value: ChargeType }[] = [
  { label: "Quantity", value: "quantity" },
  { label: "KG", value: "kg" },
  { label: "Bulk", value: "bulk" },
  { label: "Custom", value: "custom" },
];

const KG_PRESETS = [25, 50, 100];

let rowCounter = 0;
function newRow(): ChargeOptionRow {
  rowCounter += 1;
  return { key: `row-${rowCounter}`, charge_type: "bulk", rate: 0 };
}

interface Props {
  rows: ChargeOptionRow[];
  onChange: (rows: ChargeOptionRow[]) => void;
}

/**
 * Lets the user add several charge types in one form submission — e.g.
 * Quantity + 25kg + 50kg + 100kg + Bulk + Custom for the same product/rule —
 * instead of re-opening "Add" once per charge type.
 */
export function ChargeOptionsEditor({ rows, onChange }: Props) {
  const updateRow = (key: string, patch: Partial<ChargeOptionRow>) => {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key: string) => {
    onChange(rows.filter((r) => r.key !== key));
  };

  const addRow = () => {
    onChange([...rows, newRow()]);
  };

  return (
    <View style={{ gap: 12 }}>
      {rows.map((row) => (
        <View key={row.key} style={styles.rowCard}>
          <View style={styles.rowHeader}>
            <View style={styles.typeRow}>
              {CHARGE_TYPES.map((ct) => (
                <Pressable
                  key={ct.value}
                  style={[styles.typeChip, row.charge_type === ct.value && styles.typeChipActive]}
                  onPress={() => updateRow(row.key, { charge_type: ct.value, kg_variant: ct.value === "kg" ? row.kg_variant : undefined })}
                >
                  <Text style={[styles.typeChipText, row.charge_type === ct.value && styles.typeChipTextActive]}>
                    {ct.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => removeRow(row.key)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>✕</Text>
            </Pressable>
          </View>

          {row.charge_type === "kg" && (
            <View style={styles.kgRow}>
              <Text style={styles.kgLabel}>Bracket:</Text>
              {KG_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  style={[styles.kgChip, row.kg_variant === preset && styles.kgChipActive]}
                  onPress={() => updateRow(row.key, { kg_variant: preset })}
                >
                  <Text style={[styles.kgChipText, row.kg_variant === preset && styles.kgChipTextActive]}>
                    {preset}kg
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <CurrencyInput
            value={row.rate}
            onChangeValue={(rate) => updateRow(row.key, { rate })}
            placeholder={row.charge_type === "kg" ? "Rate per bracket" : "Rate"}
          />
        </View>
      ))}

      <Pressable style={styles.addButton} onPress={addRow}>
        <Text style={styles.addButtonText}>+ Add another charge type</Text>
      </Pressable>
    </View>
  );
}

export function makeEmptyChargeOptionRow(): ChargeOptionRow {
  return newRow();
}

const styles = StyleSheet.create({
  rowCard: {
    backgroundColor: "#F9FAFB", borderRadius: 10, padding: 10, gap: 10,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#D1D5DB" },
  typeChipActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  typeChipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  typeChipTextActive: { color: "#fff" },
  removeButton: { paddingHorizontal: 8, paddingVertical: 4 },
  removeButtonText: { color: "#EF4444", fontWeight: "700" },
  kgRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  kgLabel: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  kgChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: "#D1D5DB" },
  kgChipActive: { backgroundColor: "#111827", borderColor: "#111827" },
  kgChipText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  kgChipTextActive: { color: "#fff" },
  addButton: { paddingVertical: 10, alignItems: "center" },
  addButtonText: { color: "#3B82F6", fontWeight: "600" },
});