import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { customersApi } from "@/api/entities";
import type { Customer } from "@/types";
import { CreateEntityModal } from "@/components/CreateEntityModal";

export function CustomersListScreen() {
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  const refresh = React.useCallback(() => {
    return customersApi.list().then(setCustomers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (values: Record<string, any>) => {
    await customersApi.create({ name: values.name, phone: values.phone || undefined } as any);
    setModalOpen(false);
    refresh();
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
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>{item.phone ?? "No phone"}</Text>
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <CreateEntityModal
        visible={modalOpen}
        title="New Customer"
        fields={[
          { key: "name", label: "Name", type: "text", required: true },
          { key: "phone", label: "Phone", type: "text" },
        ]}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E7EB" },
  name: { fontWeight: "700", color: "#111827" },
  sub: { color: "#6B7280", fontSize: 13, marginTop: 2 },
  fab: {
    position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center", elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
});
