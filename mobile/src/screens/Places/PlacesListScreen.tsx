import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { placesApi } from "@/api/entities";
import type { Place } from "@/types";
import { CreateEntityModal } from "@/components/CreateEntityModal";

export function PlacesListScreen() {
  const [places, setPlaces] = React.useState<Place[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formTarget, setFormTarget] = React.useState<"new" | Place | null>(null);

  const refresh = React.useCallback(() => {
    return placesApi.list().then(setPlaces).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = { name: values.name, region: values.region || undefined };
    if (formTarget && formTarget !== "new") {
      await placesApi.update(formTarget.id, payload as any);
    } else {
      await placesApi.create(payload as any);
    }
    setFormTarget(null);
    refresh();
  };

  const handleDelete = (place: Place) => {
    Alert.alert("Delete place?", `"${place.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await placesApi.remove(place.id);
          refresh();
        },
      },
    ]);
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
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              {item.region ? <Text style={styles.sub}>{item.region}</Text> : null}
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
        title={formTarget && formTarget !== "new" ? "Edit Place" : "New Place"}
        submitLabel={formTarget && formTarget !== "new" ? "Save changes" : "Save"}
        initialValues={formTarget && formTarget !== "new" ? { name: formTarget.name, region: formTarget.region } : undefined}
        fields={[
          { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Coimbatore" },
          { key: "region", label: "Region", type: "text", placeholder: "e.g. Tamil Nadu" },
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