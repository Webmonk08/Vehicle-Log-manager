import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { placesApi } from "@/api/entities";
import type { Place } from "@/types";
import { CreateEntityModal } from "@/components/CreateEntityModal";

export function PlacesListScreen() {
  const [places, setPlaces] = React.useState<Place[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  const refresh = React.useCallback(() => {
    return placesApi.list().then(setPlaces).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (values: Record<string, any>) => {
    await placesApi.create({ name: values.name, region: values.region || undefined } as any);
    setModalOpen(false);
    refresh();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={places}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No places yet. Tap + to add one.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            {item.region ? <Text style={styles.sub}>{item.region}</Text> : null}
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <CreateEntityModal
        visible={modalOpen}
        title="New Place"
        fields={[
          { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Coimbatore" },
          { key: "region", label: "Region", type: "text", placeholder: "e.g. Tamil Nadu" },
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
