import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { customersApi } from "@/api/entities";
import type { Customer } from "@/types";
import { CreateEntityModal } from "@/components/CreateEntityModal";

export function CustomersListScreen() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formTarget, setFormTarget] = React.useState<"new" | Customer | null>(null);

  const refresh = React.useCallback(() => {
    return customersApi.list().then(setCustomers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = { name: values.name, phone: values.phone || undefined };
    if (formTarget && formTarget !== "new") {
      await customersApi.update(formTarget.id, payload as any);
    } else {
      await customersApi.create(payload as any);
    }
    setFormTarget(null);
    refresh();
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert("Delete customer?", `"${customer.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await customersApi.remove(customer.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No customers yet. Tap + to add one.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.phone ?? "No phone"}</Text>
            </View>
            <Pressable onPress={() => setFormTarget(item)} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>✏️</Text>
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>🗑</Text>
            </Pressable>
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={() => setFormTarget("new")}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <CreateEntityModal
        visible={!!formTarget}
        title={formTarget && formTarget !== "new" ? "Edit Customer" : "New Customer"}
        submitLabel={formTarget && formTarget !== "new" ? "Save changes" : "Save"}
        initialValues={formTarget && formTarget !== "new" ? { name: formTarget.name, phone: formTarget.phone } : undefined}
        fields={[
          { key: "name", label: "Name", type: "text", required: true },
          { key: "phone", label: "Phone", type: "text" },
        ]}
        onCancel={() => setFormTarget(null)}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E7EB",
  },
  name: { fontWeight: "700", color: "#111827" },
  sub: { color: "#6B7280", fontSize: 13, marginTop: 2 },
  iconButton: { padding: 6 },
  iconButtonText: { fontSize: 15 },
  fab: {
    position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center", elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
});