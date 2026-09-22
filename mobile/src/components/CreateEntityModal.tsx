import React from "react";
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export type FieldType = "text" | "number" | "select";

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { label: string; value: string }[]; // for type === "select"
  placeholder?: string;
}

interface Props {
  visible: boolean;
  title: string;
  fields: FieldConfig[];
  initialValues?: Record<string, any>;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: Record<string, any>) => Promise<void>;
}

/**
 * Generic "+ New X" / "Edit X" form used by Drivers, Vehicles, Customers,
 * Products, Places. Pass initialValues to reuse this in edit mode — the
 * caller decides whether onSubmit creates or updates.
 */
export function CreateEntityModal({ visible, title, fields, initialValues, submitLabel, onCancel, onSubmit }: Props) {
  const [values, setValues] = React.useState<Record<string, any>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) setValues(initialValues ?? {});
  }, [visible, initialValues]);

  const setField = (key: string, value: any) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const missing = fields.find((f) => f.required && !values[f.key]);
    if (missing) {
      Alert.alert("Missing field", `${missing.label} is required.`);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch {
      Alert.alert("Error", "Could not save. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 12 }}>
            {fields.map((field) => (
              <View key={field.key}>
                <Text style={styles.label}>
                  {field.label}{field.required ? " *" : ""}
                </Text>
                {field.type === "select" ? (
                  <View style={styles.selectRow}>
                    {field.options?.map((opt) => (
                      <Pressable
                        key={opt.value}
                        style={[styles.selectOption, values[field.key] === opt.value && styles.selectOptionActive]}
                        onPress={() => setField(field.key, opt.value)}
                      >
                        <Text style={[styles.selectOptionText, values[field.key] === opt.value && styles.selectOptionTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={values[field.key] !== undefined ? String(values[field.key]) : ""}
                    onChangeText={(t) => setField(field.key, field.type === "number" ? t.replace(/[^0-9.]/g, "") : t)}
                    keyboardType={field.type === "number" ? "decimal-pad" : "default"}
                    placeholder={field.placeholder}
                    placeholderTextColor="#9CA3AF"
                  />
                )}
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.saveText}>{submitting ? "Saving..." : submitLabel ?? "Save"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 14 },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: "600" },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#111827",
  },
  selectRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectOption: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: "#D1D5DB",
  },
  selectOptionActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  selectOptionText: { color: "#374151", fontWeight: "600" },
  selectOptionTextActive: { color: "#fff" },
  actions: { flexDirection: "row", gap: 10 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB" },
  cancelText: { color: "#374151", fontWeight: "600" },
  saveButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#3B82F6" },
  saveText: { color: "#fff", fontWeight: "700" },
});