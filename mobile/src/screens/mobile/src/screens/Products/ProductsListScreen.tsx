import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { productsApi } from "@/api/entities";
import type { Product } from "@/types";
import { CreateEntityModal } from "@/components/CreateEntityModal";

const CHARGE_TYPE_OPTIONS = [
  { label: "Quantity", value: "quantity" },
  { label: "KG", value: "kg" },
  { label: "Bulk", value: "bulk" },
  { label: "Custom", value: "custom" },
];

export function ProductsListScreen() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  const refresh = React.useCallback(() => {
    return productsApi.list().then(setProducts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (values: Record<string, any>) => {
    await productsApi.create({
      name: values.name,
      default_charge_type: values.default_charge_type || "custom",
      default_rate: values.default_rate ? parseFloat(values.default_rate) : 0,
    } as any);
    setModalOpen(false);
    refresh();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No products yet. Tap + to add one.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>
              {item.default_charge_type} · ₹{item.default_rate}
            </Text>
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <CreateEntityModal
        visible={modalOpen}
        title="New Product"
        fields={[
          { key: "name", label: "Name", type: "text", required: true },
          { key: "default_charge_type", label: "Default Charge Type", type: "select", options: CHARGE_TYPE_OPTIONS },
          { key: "default_rate", label: "Default Rate (₹)", type: "number" },
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
