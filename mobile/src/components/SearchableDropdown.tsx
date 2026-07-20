import React from "react";
import {
  FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View,
} from "react-native";

export interface DropdownOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface Props {
  label: string;
  value?: DropdownOption | null;
  options: DropdownOption[];
  onSelect: (option: DropdownOption) => void;
  onAddNew?: (query: string) => void;
  placeholder?: string;
}

/**
 * Bottom-sheet style searchable picker used for Driver / Vehicle / Customer /
 * Product / Place selection throughout the app. Kept as a Modal + FlatList
 * (no external dependency) so it's easy to swap for a bottom-sheet lib later.
 */
export function SearchableDropdown({ label, value, options, onSelect, onAddNew, placeholder }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const showAddNew = onAddNew && query.trim().length > 0 && filtered.length === 0;

  return (
    <>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={value ? styles.fieldValue : styles.fieldPlaceholder}>
          {value ? value.label : placeholder ?? "Select..."}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <TextInput
            style={styles.search}
            placeholder="Search..."
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => (
              <Pressable
                style={styles.option}
                onPress={() => {
                  onSelect(item);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <Text style={styles.optionLabel}>{item.label}</Text>
                {item.sublabel ? <Text style={styles.optionSub}>{item.sublabel}</Text> : null}
              </Pressable>
            )}
            ListEmptyComponent={
              !showAddNew ? <Text style={styles.empty}>No matches</Text> : null
            }
          />
          {showAddNew && (
            <Pressable
              style={styles.addNew}
              onPress={() => {
                onAddNew?.(query.trim());
                setQuery("");
                setOpen(false);
              }}
            >
              <Text style={styles.addNewText}>+ Add "{query.trim()}"</Text>
            </Pressable>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff",
  },
  fieldLabel: { fontSize: 11, color: "#6B7280" },
  fieldValue: { fontSize: 15, color: "#111827", marginTop: 2 },
  fieldPlaceholder: { fontSize: 15, color: "#9CA3AF", marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 16, maxHeight: "70%",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  search: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, fontSize: 15,
  },
  option: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  optionLabel: { fontSize: 15, color: "#111827" },
  optionSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  empty: { textAlign: "center", color: "#9CA3AF", paddingVertical: 20 },
  addNew: { paddingVertical: 12, alignItems: "center" },
  addNewText: { color: "#3B82F6", fontWeight: "600" },
});
