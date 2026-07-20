import React from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { CurrencyInput } from "./CurrencyInput";

export interface CompleteLoadValues {
  discount: number;
  wages: number;
  commission_loading: number;
  commission_unloading: number;
}

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: CompleteLoadValues) => Promise<void>;
}

/**
 * Shown when marking a load complete. Wages is mandatory per the debt
 * formula; discount and commission are optional. This is the ONLY place
 * wages/commission get entered — not at load creation.
 */
export function CompleteLoadModal({ visible, onCancel, onSubmit }: Props) {
  const [discount, setDiscount] = React.useState(0);
  const [wages, setWages] = React.useState(0);
  const [commissionLoading, setCommissionLoading] = React.useState(0);
  const [commissionUnloading, setCommissionUnloading] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setDiscount(0);
      setWages(0);
      setCommissionLoading(0);
      setCommissionUnloading(0);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!wages) {
      Alert.alert("Wages required", "Enter the wages for this load to mark it complete.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ discount, wages, commission_loading: commissionLoading, commission_unloading: commissionUnloading });
    } catch {
      Alert.alert("Error", "Could not complete the load. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Complete Load</Text>
        <Text style={styles.subtitle}>Enter the final wages, commission, and any discount given.</Text>

        <View>
          <Text style={styles.label}>Wages *</Text>
          <CurrencyInput value={wages} onChangeValue={setWages} />
        </View>
        <View>
          <Text style={styles.label}>Discount</Text>
          <CurrencyInput value={discount} onChangeValue={setDiscount} />
        </View>
        <View>
          <Text style={styles.label}>Commission — Loading</Text>
          <CurrencyInput value={commissionLoading} onChangeValue={setCommissionLoading} />
        </View>
        <View>
          <Text style={styles.label}>Commission — Unloading</Text>
          <CurrencyInput value={commissionUnloading} onChangeValue={setCommissionUnloading} />
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.saveText}>{submitting ? "Saving..." : "Mark Complete"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 12 },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  label: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginBottom: 4 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB" },
  cancelText: { color: "#374151", fontWeight: "600" },
  saveButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#22C55E" },
  saveText: { color: "#fff", fontWeight: "700" },
});