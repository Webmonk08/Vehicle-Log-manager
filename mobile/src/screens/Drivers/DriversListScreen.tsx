import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { DriversStackParamList } from "@/navigation/RootNavigator";
import { driversApi } from "@/api/entities";
import type { Driver } from "@/types";
import { CreateEntityModal } from "@/components/CreateEntityModal";

type Props = NativeStackScreenProps<DriversStackParamList, "DriversList">;

export function DriversListScreen({ navigation }: Props) {
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // "new" = create modal open; a Driver object = edit modal open for that driver; null = closed
  const [formTarget, setFormTarget] = React.useState<"new" | Driver | null>(null);

  const refresh = React.useCallback(() => {
    return driversApi.list().then(setDrivers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", refresh);
    return unsubscribe;
  }, [navigation, refresh]);

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = {
      name: values.name,
      phone: values.phone || undefined,
      license_number: values.license_number || undefined,
    };
    if (formTarget && formTarget !== "new") {
      await driversApi.update(formTarget.id, payload as any);
    } else {
      await driversApi.create(payload as any);
    }
    setFormTarget(null);
    refresh();
  };

  const handleDelete = (driver: Driver) => {
    Alert.alert("Delete driver?", `"${driver.name}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await driversApi.remove(driver.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={drivers}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No drivers yet. Tap + to add one.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("DriverDetail", { driverId: item.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone ?? "No phone"}</Text>
            </View>
            <View style={[styles.debtBadge, { backgroundColor: item.debt > 0 ? "#FEE2E2" : "#DCFCE7" }]}>
              <Text style={{ color: item.debt > 0 ? "#DC2626" : "#16A34A", fontWeight: "700" }}>
                ₹{item.debt.toLocaleString("en-IN")}
              </Text>
            </View>
            <Pressable onPress={() => setFormTarget(item)} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>✏️</Text>
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>🗑</Text>
            </Pressable>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} onPress={() => setFormTarget("new")}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <CreateEntityModal
        visible={!!formTarget}
        title={formTarget && formTarget !== "new" ? "Edit Driver" : "New Driver"}
        submitLabel={formTarget && formTarget !== "new" ? "Save changes" : "Save"}
        initialValues={formTarget && formTarget !== "new" ? { name: formTarget.name, phone: formTarget.phone, license_number: formTarget.license_number } : undefined}
        fields={[
          { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Ramesh Kumar" },
          { key: "phone", label: "Phone", type: "text", placeholder: "e.g. 9876543210" },
          { key: "license_number", label: "License Number", type: "text" },
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
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff",
    borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5E7EB",
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#DBEAFE", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#1D4ED8", fontWeight: "800" },
  name: { fontWeight: "700", color: "#111827" },
  phone: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  debtBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  iconButton: { padding: 6 },
  iconButtonText: { fontSize: 15 },
  fab: {
    position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center", elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
});