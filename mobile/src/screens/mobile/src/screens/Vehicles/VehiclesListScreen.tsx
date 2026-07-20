import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { VehiclesStackParamList } from "@/navigation/RootNavigator";
import { vehiclesApi } from "@/api/entities";
import type { Vehicle } from "@/types";
import { CreateEntityModal } from "@/components/CreateEntityModal";

type Props = NativeStackScreenProps<VehiclesStackParamList, "VehiclesList">;

export function VehiclesListScreen({ navigation }: Props) {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  const refresh = React.useCallback(() => {
    return vehiclesApi.list().then(setVehicles).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", refresh);
    return unsubscribe;
  }, [navigation, refresh]);

  const handleCreate = async (values: Record<string, any>) => {
    await vehiclesApi.create({
      number: values.number,
      type: values.type || undefined,
      capacity: values.capacity ? parseFloat(values.capacity) : undefined,
    } as any);
    setModalOpen(false);
    refresh();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No vehicles yet. Tap + to add one.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}
          >
            <Text style={styles.number}>{item.number}</Text>
            <Text style={styles.type}>{item.type ?? "—"}</Text>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <CreateEntityModal
        visible={modalOpen}
        title="New Vehicle"
        fields={[
          { key: "number", label: "Vehicle Number", type: "text", required: true, placeholder: "e.g. TN 09 AB 1234" },
          { key: "type", label: "Type", type: "text", placeholder: "e.g. Truck, Tempo" },
          { key: "capacity", label: "Capacity (tons)", type: "number", placeholder: "e.g. 10" },
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
  number: { fontWeight: "700", color: "#111827", fontSize: 16 },
  type: { color: "#6B7280", marginTop: 2 },
  fab: {
    position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center", elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
});
