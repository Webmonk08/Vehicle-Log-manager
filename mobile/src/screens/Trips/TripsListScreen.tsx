import React from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, Platform } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TripsStackParamList } from "@/navigation/RootNavigator";
import { driversApi, tripsApi, vehiclesApi } from "@/api/entities";
import type { Driver, Trip, Vehicle } from "@/types";
import { StatusChip } from "@/components/StatusChip";
import { SearchableDropdown, type DropdownOption } from "@/components/SearchableDropdown";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = NativeStackScreenProps<TripsStackParamList, "TripsList">;

export function TripsListScreen({ navigation }: Props) {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);

  const [editingTrip, setEditingTrip] = React.useState<Trip | null>(null);
  const [editDriver, setEditDriver] = React.useState<DropdownOption | null>(null);
  const [editVehicle, setEditVehicle] = React.useState<DropdownOption | null>(null);

  const [showFilters, setShowFilters] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState<DropdownOption | null>(null);
  const [filterDriver, setFilterDriver] = React.useState<DropdownOption | null>(null);
  const [filterVehicle, setFilterVehicle] = React.useState<DropdownOption | null>(null);
  const [filterDateFrom, setFilterDateFrom] = React.useState<string>("");
  const [filterDateTo, setFilterDateTo] = React.useState<string>("");

  const [showPickerFrom, setShowPickerFrom] = React.useState(false);
  const [showPickerTo, setShowPickerTo] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => setShowFilters(true)}>
          <Text style={{ color: "#3B82F6", fontSize: 16, fontWeight: "600", marginRight: 10 }}>Filter</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const refresh = React.useCallback(() => {
    setLoading(true);
    const params: any = {};
    if (filterStatus) params.status = filterStatus.id;
    if (filterDriver) params.driver_id = filterDriver.id;
    if (filterVehicle) params.vehicle_id = filterVehicle.id;
    if (filterDateFrom) params.date_from = filterDateFrom;
    if (filterDateTo) params.date_to = filterDateTo;

    return tripsApi.list(params).then(setTrips).catch(() => {}).finally(() => setLoading(false));
  }, [filterStatus, filterDriver, filterVehicle, filterDateFrom, filterDateTo]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      refresh();
      driversApi.list().then(setDrivers).catch(() => {});
      vehiclesApi.list().then(setVehicles).catch(() => {});
    });
    return unsubscribe;
  }, [navigation, refresh]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const driverOptions: DropdownOption[] = drivers.map((d) => ({ id: d.id, label: d.name }));
  const vehicleOptions: DropdownOption[] = vehicles.map((v) => ({ id: v.id, label: v.number, sublabel: v.type }));
  const statusOptions: DropdownOption[] = [
    { id: "ongoing", label: "ongoing" },
    { id: "completed", label: "Completed" },
  ];

  const clearFilters = () => {
    setFilterStatus(null);
    setFilterDriver(null);
    setFilterVehicle(null);
    setFilterDateFrom("");
    setFilterDateTo("");
    setShowFilters(false);
  };

  const openEdit = (trip: Trip) => {
    setEditingTrip(trip);
    const d = drivers.find((x) => x.id === trip.driver_id);
    const v = vehicles.find((x) => x.id === trip.vehicle_id);
    setEditDriver(d ? { id: d.id, label: d.name } : null);
    setEditVehicle(v ? { id: v.id, label: v.number } : null);
  };

  const handleSaveEdit = async () => {
    if (!editingTrip || !editDriver || !editVehicle) return;
    await tripsApi.update(editingTrip.id, { driver_id: editDriver.id, vehicle_id: editVehicle.id } as any);
    setEditingTrip(null);
    refresh();
  };

  const handleDelete = (trip: Trip) => {
    Alert.alert("Delete trip?", "This also removes all its loads and expenses.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await tripsApi.remove(trip.id);
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No trips yet. Tap + to create one.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("TripDetail", { tripId: item.id })}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>Trip • {item.start_date}</Text>
              <StatusChip status={item.status} kind="trip" />
            </View>
            <Text style={styles.cardSub}>Driver {item.driver_id.slice(0, 6)} · Vehicle {item.vehicle_id.slice(0, 6)}</Text>
            <View style={styles.cardActions}>
              <Pressable onPress={() => openEdit(item)} style={styles.iconButton}>
                <Text style={styles.iconButtonText}>✏️ Edit</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} style={styles.iconButton}>
                <Text style={styles.iconButtonText}>🗑 Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} onPress={() => navigation.navigate("TripCreate")}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal visible={showFilters} animationType="fade" transparent onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowFilters(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Filter Trips</Text>
          <SearchableDropdown label="Status" value={filterStatus} options={statusOptions} onSelect={setFilterStatus} />
          <SearchableDropdown label="Driver" value={filterDriver} options={driverOptions} onSelect={setFilterDriver} />
          <SearchableDropdown label="Vehicle" value={filterVehicle} options={vehicleOptions} onSelect={setFilterVehicle} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 4 }}>From</Text>
              <Pressable style={styles.textInput} onPress={() => setShowPickerFrom(true)}>
                <Text style={{ color: filterDateFrom ? "#111827" : "#9CA3AF" }}>
                  {filterDateFrom || "Select date"}
                </Text>
              </Pressable>
              {showPickerFrom && (
                <DateTimePicker
                  value={filterDateFrom ? new Date(filterDateFrom) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowPickerFrom(Platform.OS === 'ios');
                    if (date && event.type !== 'dismissed') {
                      setFilterDateFrom(date.toISOString().slice(0, 10));
                    }
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 4 }}>To</Text>
              <Pressable style={styles.textInput} onPress={() => setShowPickerTo(true)}>
                <Text style={{ color: filterDateTo ? "#111827" : "#9CA3AF" }}>
                  {filterDateTo || "Select date"}
                </Text>
              </Pressable>
              {showPickerTo && (
                <DateTimePicker
                  value={filterDateTo ? new Date(filterDateTo) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowPickerTo(Platform.OS === 'ios');
                    if (date && event.type !== 'dismissed') {
                      setFilterDateTo(date.toISOString().slice(0, 10));
                    }
                  }}
                />
              )}
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={clearFilters}>
              <Text style={styles.cancelText}>Clear All</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={() => setShowFilters(false)}>
              <Text style={styles.saveText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={!!editingTrip} animationType="slide" transparent onRequestClose={() => setEditingTrip(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEditingTrip(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Edit Trip</Text>
          <SearchableDropdown label="Driver" value={editDriver} options={driverOptions} onSelect={setEditDriver} />
          <SearchableDropdown label="Vehicle" value={editVehicle} options={vehicleOptions} onSelect={setEditVehicle} />
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={() => setEditingTrip(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSaveEdit}>
              <Text style={styles.saveText}>Save changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", gap: 6 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontWeight: "700", color: "#111827" },
  cardSub: { color: "#6B7280", fontSize: 13 },
  cardActions: { flexDirection: "row", gap: 16, marginTop: 4 },
  iconButton: { paddingVertical: 4 },
  iconButtonText: { fontSize: 12, color: "#3B82F6", fontWeight: "600" },
  fab: {
    position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center", elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 12 },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB" },
  cancelText: { color: "#374151", fontWeight: "600" },
  saveButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#3B82F6" },
  saveText: { color: "#fff", fontWeight: "700" },
  textInput: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
});