import React from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CurrencyInput } from "./CurrencyInput";

interface Props {
  visible: boolean;
  title: string;
  amountLabel?: string;
  onCancel: () => void;
  onSubmit: (values: { amount: number; note?: string }) => Promise<void>;
}

/** Replaces Alert.prompt, which only exists on iOS and silently no-ops on Android. */
export function AmountPromptModal({ visible, title, amountLabel = "Amount", onCancel, onSubmit }: Props) {
  const [amount, setAmount] = React.useState(0);
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setAmount(0);
      setNote("");
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!amount) {
      Alert.alert("Amount required", `Enter an ${amountLabel.toLowerCase()}.`);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ amount, note: note.trim() || undefined });
    } catch {
      Alert.alert("Error", "Could not save. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{title}</Text>
        <View>
          <Text style={styles.label}>{amountLabel}</Text>
          <CurrencyInput value={amount} onChangeValue={setAmount} />
        </View>
        <View>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="e.g. Cash handover at yard" />
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.saveText}>{submitting ? "Saving..." : "Save"}</Text>
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
  label: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB" },
  cancelText: { color: "#374151", fontWeight: "600" },
  saveButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#111827" },
  saveText: { color: "#fff", fontWeight: "700" },
});