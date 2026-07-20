import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
  value: number;
  onChangeValue: (value: number) => void;
  editable?: boolean;
  placeholder?: string;
}

export function CurrencyInput({ value, onChangeValue, editable = true, placeholder }: Props) {
  const [text, setText] = React.useState(value ? String(value) : "");

  React.useEffect(() => {
    setText(value ? String(value) : "");
  }, [value]);

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    setText(cleaned);
    const parsed = parseFloat(cleaned);
    onChangeValue(Number.isNaN(parsed) ? 0 : parsed);
  };

  return (
    <View style={[styles.wrapper, !editable && styles.disabled]}>
      <Text style={styles.prefix}>₹</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChange}
        keyboardType="decimal-pad"
        editable={editable}
        placeholder={placeholder ?? "0"}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: "#fff",
  },
  disabled: { backgroundColor: "#F3F4F6" },
  prefix: { color: "#6B7280", marginRight: 4, fontWeight: "600" },
  input: { flex: 1, fontSize: 15, color: "#111827" },
});
