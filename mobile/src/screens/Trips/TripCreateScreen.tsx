import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TripsStackParamList } from "@/navigation/RootNavigator";
import { customersApi, driversApi, loadsApi, productsApi, tripsApi, vehiclesApi } from "@/api/entities";
import { SearchableDropdown, type DropdownOption } from "@/components/SearchableDropdown";
import type { Customer, Driver, Load, Product, Vehicle } from "@/types";
import { ScrollView } from "react-native";

type Props = NativeStackScreenProps<TripsStackParamList, "TripCreate">;

export function TripCreateScreen({ navigation }: Props) {
  const [mode, setMode] = React.useState<"trip" | "loads">("trip");
  const [driver, setDriver] = React.useState<DropdownOption | null>(null);
  const [vehicle, setVehicle] = React.useState<DropdownOption | null>(null);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [pooledLoads, setPooledLoads] = React.useState<Load[]>([]);
  const [finalizing, setFinalizing] = React.useState(false);
  const [productMap, setProductMap] = React.useState<Record<string, string>>({});
  const [customerMap, setCustomerMap] = React.useState<Record<string, string>>({});

  const refreshLookups = React.useCallback(() => {
    driversApi.list().then(setDrivers).catch(() => {});
    vehiclesApi.list().then(setVehicles).catch(() => {});
    productsApi.list().then(ps => {
      const m: Record<string, string> = {};
      ps.forEach(p => { m[p.id] = p.name; });
      setProductMap(m);
    }).catch(() => {});
    customersApi.list().then(cs => {
      const m: Record<string, string> = {};
      cs.forEach(c => { m[c.id] = c.name; });
      setCustomerMap(m);
    }).catch(() => {});
  }, []);

  const refreshPool = React.useCallback(() => {
    return loadsApi.list({ unassigned_only: true }).then(setPooledLoads).catch(() => {});
  }, []);

  React.useEffect(() => {
    refreshLookups();
    const unsubscribe = navigation.addListener("focus", () => {
      refreshLookups();
      if (mode === "loads") refreshPool();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, mode]);

  React.useEffect(() => {
    if (mode === "loads") refreshPool();
  }, [mode, refreshPool]);

  const driverOptions: DropdownOption[] = drivers.map((d) => ({
    id: d.id,
    label: d.name,
    sublabel: d.debt > 0 ? `⚠ Owes ₹${d.debt.toLocaleString("en-IN")}` : undefined,
  }));
  const vehicleOptions: DropdownOption[] = vehicles.map((v) => ({ id: v.id, label: v.number, sublabel: v.type }));

  const handleCreateTripFirst = async () => {
    if (!driver || !vehicle) {
      Alert.alert("Missing info", "Select a driver and vehicle first.");
      return;
    }
    try {
      const trip = await tripsApi.create({
        driver_id: driver.id,
        vehicle_id: vehicle.id,
        start_date: new Date().toISOString().slice(0, 10),
        status: "ongoing",
      } as any);
      navigation.replace("TripDetail", { tripId: trip.id });
    } catch {
      Alert.alert("Error", "Could not create trip. Check your connection.");
    }
  };

  const handleDeletePooledLoad = (loadItem: Load) => {
    Alert.alert("Remove load?", "This deletes it from the unassigned pool.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await loadsApi.remove(loadItem.id);
          refreshPool();
        },
      },
    ]);
  };

  const handleFinalizeIntoTrip = async () => {
    if (!driver || !vehicle) {
      Alert.alert("Missing info", "Select a driver and vehicle to create the trip.");
      return;
    }
    if (pooledLoads.length === 0) {
      Alert.alert("No loads", "Add at least one load to the pool first.");
      return;
    }
    setFinalizing(true);
    try {
      // This is the step that was previously missing entirely — "Start with
      // Loads" created loose loads but never a Trip row, so nothing ever
      // showed up in the Trips list. Now it actually creates the trip and
      // attaches every pooled load to it.
      const trip = await tripsApi.create({
        driver_id: driver.id,
        vehicle_id: vehicle.id,
        start_date: new Date().toISOString().slice(0, 10),
        status: "ongoing",
      } as any);
      await Promise.all(pooledLoads.map((l) => loadsApi.attachToTrip(l.id, trip.id)));
      navigation.replace("TripDetail", { tripId: trip.id });
    } catch {
      Alert.alert("Error", "Could not create the trip. Check your connection.");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmented}>
        <Pressable
          style={[styles.segment, mode === "trip" && styles.segmentActive]}
          onPress={() => setMode("trip")}
        >
          <Text style={[styles.segmentText, mode === "trip" && styles.segmentTextActive]}>Start with Trip</Text>
        </Pressable>
        <Pressable
          style={[styles.segment, mode === "loads" && styles.segmentActive]}
          onPress={() => setMode("loads")}
        >
          <Text style={[styles.segmentText, mode === "loads" && styles.segmentTextActive]}>Start with Loads</Text>
        </Pressable>
      </View>

      {mode === "trip" ? (
        <View style={{ gap: 12, padding: 16 }}>
          <SearchableDropdown label="Driver" value={driver} options={driverOptions} onSelect={setDriver} />
          <SearchableDropdown label="Vehicle" value={vehicle} options={vehicleOptions} onSelect={setVehicle} />
          <Pressable style={styles.primaryButton} onPress={handleCreateTripFirst}>
            <Text style={styles.primaryButtonText}>Create Trip</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 12 }}>
            <Text style={styles.helperText}>
              Add loads first — they sit here unassigned. Once you're ready, pick a driver and
              vehicle below to create the trip and attach everything at once.
            </Text>
          </View>
          
          <View>
            {pooledLoads.length > 0 && <Text style={styles.sectionTitle}>Pooled loads ({pooledLoads.length})</Text>}
            <ScrollView horizontal style={{ marginTop: 8 }}>
              <View>
                <View style={styles.tableHeaderRow}>
                  {["Product", "Customer", "Charge", "Edit", "Del"].map((h) => (
                    <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
                  ))}
                </View>
                <View style={styles.tableBody}>
                  <Pressable
                    style={styles.addLoadRow}
                    onPress={() => navigation.navigate("LoadCreate", {})}
                  >
                    <Text style={styles.addLoadText}>+ Add Load to Pool</Text>
                  </Pressable>
                  {pooledLoads.map((item) => (
                      <View key={item.id} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{productMap[item.product_id] ?? item.product_id.slice(0, 6)}</Text>
                        <Text style={styles.tableCell}>{customerMap[item.customer_id] ?? item.customer_id.slice(0, 6)}</Text>
                        <Text style={styles.tableCell}>
                          ₹{item.charge}{item.charge_type === "kg" && item.kg_variant ? ` (${item.kg_variant}kg)` : ""}
                        </Text>
                        <Pressable
                          onPress={() => navigation.navigate("LoadCreate", { loadId: item.id })}
                          style={styles.rowIconButton}
                        >
                          <Text style={styles.rowIconText}>✏️</Text>
                        </Pressable>
                        <Pressable onPress={() => handleDeletePooledLoad(item)} style={styles.rowIconButton}>
                          <Text style={styles.rowIconText}>🗑</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>
              
              <View style={{ gap: 12, marginTop: 24 }}>
                <SearchableDropdown label="Driver" value={driver} options={driverOptions} onSelect={setDriver} />
                <SearchableDropdown label="Vehicle" value={vehicle} options={vehicleOptions} onSelect={setVehicle} />
                <Pressable style={styles.primaryButton} onPress={handleFinalizeIntoTrip} disabled={finalizing}>
                  <Text style={styles.primaryButtonText}>
                    {finalizing ? "Creating..." : `Create Trip & Assign ${pooledLoads.length} Load${pooledLoads.length > 1 ? "s" : ""}`}
                  </Text>
                </Pressable>
              </View>
            </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  segmented: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 10, padding: 4, margin: 16, marginBottom: 0 },
  segment: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: "#fff" },
  segmentText: { color: "#6B7280", fontWeight: "600" },
  segmentTextActive: { color: "#111827" },
  primaryButton: { backgroundColor: "#3B82F6", padding: 14, borderRadius: 10, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  helperText: { color: "#6B7280", fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  poolCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 8,
  },
  poolCardTitle: { fontWeight: "700", color: "#111827" },
  poolCardSub: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  deleteButtonText: { fontSize: 16 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 8 },
  tableHeaderCell: { width: 100, padding: 8, fontSize: 12, fontWeight: "700", color: "#6B7280" },
  tableRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  tableCell: { width: 100, padding: 8, fontSize: 13, color: "#111827" },
  tableBody: {},
  rowIconButton: { width: 40, alignItems: "center", padding: 8 },
  rowIconText: { fontSize: 14 },
  addLoadRow: { padding: 10, alignItems: "flex-start" },
  addLoadText: { color: "#3B82F6", fontWeight: "600" },
});