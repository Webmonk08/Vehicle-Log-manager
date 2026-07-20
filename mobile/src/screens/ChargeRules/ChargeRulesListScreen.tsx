import React from "react";
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { chargeRulesApi, customersApi, placesApi, productsApi } from "@/api/entities";
import type { ChargeRule, Customer, Place, Product } from "@/types";
import { SearchableDropdown, type DropdownOption } from "@/components/SearchableDropdown";
import { ChargeOptionsEditor, makeEmptyChargeOptionRow, type ChargeOptionRow } from "@/components/ChargeOptionEditor";
import { CurrencyInput } from "@/components/CurrencyInput";

const SCOPES: { label: string; value: ChargeRule["scope"] }[] = [
  { label: "Customer", value: "customer" },
  { label: "Route", value: "route" },
];

function formatType(r: ChargeRule) {
  return r.charge_type === "kg" ? `${r.kg_variant ?? "?"}kg` : r.charge_type;
}

export function ChargeRulesListScreen() {
  const [rules, setRules] = React.useState<ChargeRule[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [places, setPlaces] = React.useState<Place[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);

  const [scope, setScope] = React.useState<ChargeRule["scope"]>("customer");
  const [product, setProduct] = React.useState<DropdownOption | null>(null);
  const [customer, setCustomer] = React.useState<DropdownOption | null>(null);
  const [origin, setOrigin] = React.useState<DropdownOption | null>(null);
  const [destination, setDestination] = React.useState<DropdownOption | null>(null);
  const [rows, setRows] = React.useState<ChargeOptionRow[]>([makeEmptyChargeOptionRow()]);

  const refresh = React.useCallback(() => {
    setLoading(true);
    return Promise.all([
      chargeRulesApi.list().then(setRules),
      productsApi.list().then(setProducts),
      customersApi.list().then(setCustomers),
      placesApi.list().then(setPlaces),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const productOptions: DropdownOption[] = products.map((p) => ({ id: p.id, label: p.name }));
  const customerOptions: DropdownOption[] = customers.map((c) => ({ id: c.id, label: c.name }));
  const placeOptions: DropdownOption[] = places.map((p) => ({ id: p.id, label: p.name, sublabel: p.region }));

  const nameFor = (id: string | undefined, list: DropdownOption[]) =>
    list.find((o) => o.id === id)?.label ?? id?.slice(0, 6) ?? "—";

  const resetForm = () => {
    setScope("customer");
    setProduct(null);
    setCustomer(null);
    setOrigin(null);
    setDestination(null);
    setRows([makeEmptyChargeOptionRow()]);
  };

  const handleCreate = async () => {
    if (!product) {
      Alert.alert("Missing product", "Select which product this rule applies to.");
      return;
    }
    if (scope === "customer" && !customer) {
      Alert.alert("Missing customer", "Select a customer.");
      return;
    }
    if (scope === "route" && (!origin || !destination)) {
      Alert.alert("Missing route", "Select an origin and destination place.");
      return;
    }
    const validRows = rows.filter((r) => r.rate > 0);
    if (validRows.length === 0) {
      Alert.alert("Missing rate", "Add at least one charge type with a rate.");
      return;
    }
    if (rows.some((r) => r.charge_type === "kg" && !r.kg_variant)) {
      Alert.alert("Missing KG bracket", "Pick a bracket (25/50/100kg) for each KG row, or remove it.");
      return;
    }
    try {
      const created = await chargeRulesApi.batchCreate({
        scope,
        product_id: product.id,
        customer_id: scope === "customer" ? customer?.id : undefined,
        origin_place_id: scope === "route" ? origin?.id : undefined,
        destination_place_id: scope === "route" ? destination?.id : undefined,
        options: validRows.map((r) => ({ charge_type: r.charge_type, kg_variant: r.kg_variant, rate: r.rate })),
      });
      setRules((prev) => [...created, ...prev]);
      setFormOpen(false);
      resetForm();
    } catch {
      Alert.alert("Error", "Could not save the rule(s). Check your connection.");
    }
  };

  const handleUpdateRate = async (rule: ChargeRule, rate: number) => {
    const updated = await chargeRulesApi.update(rule.id, { rate });
    setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleDelete = (rule: ChargeRule) => {
    Alert.alert("Delete rule?", `${formatType(rule)} · ₹${rule.rate} will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await chargeRulesApi.remove(rule.id);
          setRules((prev) => prev.filter((r) => r.id !== rule.id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.infoTooltip}>
        Priority order when a load's charge is resolved: Customer rule → Route rule → Product default.
        Every rule is tied to a specific product, and can vary by KG bracket.
      </Text>
      <FlatList
        data={rules}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshing={loading}
        onRefresh={refresh}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No charge rules yet. Tap + to add one.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleScope}>
                {item.scope === "customer" ? "Customer rule" : "Route rule"} · {nameFor(item.product_id, productOptions)}
              </Text>
              {item.scope === "customer" ? (
                <Text style={styles.ruleDetail}>{nameFor(item.customer_id, customerOptions)}</Text>
              ) : (
                <Text style={styles.ruleDetail}>
                  {nameFor(item.origin_place_id, placeOptions)} → {nameFor(item.destination_place_id, placeOptions)}
                </Text>
              )}
              <Text style={styles.rate}>{formatType(item)}</Text>
            </View>
            <View style={{ width: 100 }}>
              <CurrencyInput value={item.rate} onChangeValue={(rate) => handleUpdateRate(item, rate)} />
            </View>
            <Pressable onPress={() => handleDelete(item)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>🗑</Text>
            </Pressable>
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={() => setFormOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {formOpen && (
        <View style={styles.formOverlay}>
          <View style={styles.formSheet}>
            <Text style={styles.formTitle}>New Charge Rule</Text>
            <ScrollView contentContainerStyle={{ gap: 12 }} style={{ maxHeight: 460 }}>
              <View style={styles.segmented}>
                {SCOPES.map((s) => (
                  <Pressable
                    key={s.value}
                    style={[styles.segment, scope === s.value && styles.segmentActive]}
                    onPress={() => setScope(s.value)}
                  >
                    <Text style={[styles.segmentText, scope === s.value && styles.segmentTextActive]}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>

              <SearchableDropdown label="Product" value={product} options={productOptions} onSelect={setProduct} />

              {scope === "customer" ? (
                <SearchableDropdown label="Customer" value={customer} options={customerOptions} onSelect={setCustomer} />
              ) : (
                <>
                  <SearchableDropdown label="Origin" value={origin} options={placeOptions} onSelect={setOrigin} />
                  <SearchableDropdown label="Destination" value={destination} options={placeOptions} onSelect={setDestination} />
                </>
              )}

              <Text style={styles.label}>Charge types (add as many as apply)</Text>
              <ChargeOptionsEditor rows={rows} onChange={setRows} />
            </ScrollView>

            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={() => { setFormOpen(false); resetForm(); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleCreate}>
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  infoTooltip: { fontSize: 12, color: "#6B7280", padding: 16, paddingBottom: 0 },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff",
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E7EB",
  },
  ruleScope: { fontSize: 11, fontWeight: "700", color: "#3B82F6", textTransform: "uppercase" },
  ruleDetail: { fontWeight: "600", color: "#111827", marginTop: 2 },
  rate: { color: "#6B7280", fontSize: 13, marginTop: 2 },
  deleteButton: { padding: 6 },
  deleteButtonText: { fontSize: 16 },
  fab: {
    position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center", elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
  formOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end",
  },
  formSheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 12, maxHeight: "88%" },
  formTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  label: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  segmented: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  segment: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#D1D5DB" },
  segmentActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  segmentText: { color: "#374151", fontWeight: "600" },
  segmentTextActive: { color: "#fff" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB" },
  cancelText: { color: "#374151", fontWeight: "600" },
  saveButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#3B82F6" },
  saveText: { color: "#fff", fontWeight: "700" },
});