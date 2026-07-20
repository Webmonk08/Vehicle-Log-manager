import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TripsStackParamList } from "@/navigation/RootNavigator";
import { customersApi, loadsApi, placesApi, productsApi } from "@/api/entities";
import type { ChargeOptionResult, ChargeType, Customer, Place, Product } from "@/types";
import { SearchableDropdown, type DropdownOption } from "@/components/SearchableDropdown";
import { CurrencyInput } from "@/components/CurrencyInput";

type Props = NativeStackScreenProps<TripsStackParamList, "LoadCreate">;

function optionLabel(o: ChargeOptionResult) {
  const sourceLabel = o.source === "customer" ? "Customer rate" : o.source === "route" ? "Route rate" : "Default";
  const typeLabel = o.charge_type === "kg" ? `${o.kg_variant}kg bracket` : o.charge_type;
  return `${sourceLabel} · ${typeLabel} · ₹${o.rate}`;
}

export function LoadCreateScreen({ route, navigation }: Props) {
  const tripId = route.params?.tripId;
  const loadId = route.params?.loadId;
  const isEditing = !!loadId;

  const [products, setProducts] = React.useState<Product[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [places, setPlaces] = React.useState<Place[]>([]);
  const [listsLoaded, setListsLoaded] = React.useState(false);
  const [prefilled, setPrefilled] = React.useState(!isEditing); // true once edit-mode prefill has run

  const [product, setProduct] = React.useState<DropdownOption | null>(null);
  const [customer, setCustomer] = React.useState<DropdownOption | null>(null);
  const [origin, setOrigin] = React.useState<DropdownOption | null>(null);
  const [destination, setDestination] = React.useState<DropdownOption | null>(null);

  const [options, setOptions] = React.useState<ChargeOptionResult[]>([]);
  const [selectedOption, setSelectedOption] = React.useState<ChargeOptionResult | null>(null);
  const [useCustom, setUseCustom] = React.useState(false);
  const [customRate, setCustomRate] = React.useState(0);
  const [customType, setCustomType] = React.useState<ChargeType>("custom");
  const [quantity, setQuantity] = React.useState(1);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      productsApi.list().then(setProducts).catch(() => []),
      customersApi.list().then(setCustomers).catch(() => []),
      placesApi.list().then(setPlaces).catch(() => []),
    ]).then(() => setListsLoaded(true));
  }, []);

  // Edit mode: once the dropdown lists are loaded, fetch the existing load
  // and prefill every field (including which charge option it originally used).
  React.useEffect(() => {
    if (!isEditing || !listsLoaded || prefilled) return;
    loadsApi.get(loadId!).then(async (l) => {
      const p = products.find((x) => x.id === l.product_id);
      const c = customers.find((x) => x.id === l.customer_id);
      const o = places.find((x) => x.id === l.origin_place_id);
      const d = places.find((x) => x.id === l.destination_place_id);
      if (p) setProduct({ id: p.id, label: p.name });
      if (c) setCustomer({ id: c.id, label: c.name });
      if (o) setOrigin({ id: o.id, label: o.name });
      if (d) setDestination({ id: d.id, label: d.name });
      setQuantity(l.quantity ?? 1);

      const opts = await loadsApi.chargeOptions({
        product_id: l.product_id, customer_id: l.customer_id,
        origin_place_id: l.origin_place_id, destination_place_id: l.destination_place_id,
      }).catch(() => []);
      setOptions(opts);
      const match = opts.find(
        (o) => o.source === l.charge_rule_used && o.charge_type === l.charge_type && o.kg_variant === l.kg_variant
      );
      if (match) {
        setSelectedOption(match);
        setUseCustom(false);
      } else {
        setUseCustom(true);
        setCustomType(l.charge_type);
        setCustomRate(l.charge_type === "bulk" ? l.charge : l.charge / (l.quantity || 1));
      }
      setPrefilled(true);
    }).catch(() => setPrefilled(true));
  }, [isEditing, listsLoaded, prefilled, loadId, products, customers, places]);

  const productOptions: DropdownOption[] = products.map((p) => ({ id: p.id, label: p.name }));
  const customerOptions: DropdownOption[] = customers.map((c) => ({ id: c.id, label: c.name }));
  const placeOptions: DropdownOption[] = places.map((p) => ({ id: p.id, label: p.name, sublabel: p.region }));

  // Fetch every matching charge option whenever product/customer/route selection changes —
  // this is what shows all applicable options (customer / route / product default) at once.
  // Skipped while an edit-mode prefill is still running (it fetches its own copy above).
  React.useEffect(() => {
    if (!prefilled) return;
    if (!product) {
      setOptions([]);
      setSelectedOption(null);
      return;
    }
    loadsApi
      .chargeOptions({
        product_id: product.id,
        customer_id: customer?.id,
        origin_place_id: origin?.id,
        destination_place_id: destination?.id,
      })
      .then((opts) => {
        setOptions(opts);
        const preferred =
          opts.find((o) => o.source === "customer") ??
          opts.find((o) => o.source === "route") ??
          opts.find((o) => o.source === "product_default") ??
          null;
        setSelectedOption(preferred);
        setUseCustom(opts.length === 0);
      })
      .catch(() => setOptions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, customer, origin, destination]);

  const activeType: ChargeType | null = useCustom ? customType : selectedOption?.charge_type ?? null;
  const activeRate = useCustom ? customRate : selectedOption?.rate ?? 0;
  const computedCharge = activeType === "bulk" ? activeRate : activeRate * quantity;

  const handleSave = async () => {
    if (!product || !customer) {
      Alert.alert("Missing info", "Select a product and customer.");
      return;
    }
    if (!activeType) {
      Alert.alert("Missing charge", "Pick a charge option or enter a custom rate.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        trip_id: tripId ?? null,
        product_id: product.id,
        customer_id: customer.id,
        origin_place_id: origin?.id,
        destination_place_id: destination?.id,
        quantity: activeType !== "bulk" ? quantity : undefined,
        charge_type: activeType,
        kg_variant: useCustom ? undefined : selectedOption?.kg_variant,
        charge: computedCharge,
        charge_rule_used: useCustom ? "custom" : selectedOption?.source,
      };

      if (isEditing) {
        await loadsApi.update(loadId!, payload as any);
        navigation.goBack();
        return;
      }

      await loadsApi.create({ ...payload, status: "pending" } as any);
      if (tripId) {
        navigation.goBack();
      } else {
        Alert.alert("Load added", "Saved to the unassigned pool — batch it into a trip when ready.", [
          { text: "Add another", onPress: () => resetForm() },
          { text: "Done", onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert("Error", "Could not save the load. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setProduct(null);
    setCustomer(null);
    setOrigin(null);
    setDestination(null);
    setOptions([]);
    setSelectedOption(null);
    setUseCustom(false);
    setCustomRate(0);
    setQuantity(1);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {!tripId && !isEditing && (
        <Text style={styles.helperText}>
          This load isn't attached to a trip yet — it'll sit in the unassigned pool until you
          batch it into one.
        </Text>
      )}
      {isEditing && (
        <Text style={styles.helperText}>
          Wages, commission, and discount aren't edited here — mark the load complete from the
          trip screen to set those.
        </Text>
      )}

      <SearchableDropdown label="Product" value={product} options={productOptions} onSelect={setProduct} />
      <SearchableDropdown label="Customer" value={customer} options={customerOptions} onSelect={setCustomer} />
      <SearchableDropdown label="Origin (optional)" value={origin} options={placeOptions} onSelect={setOrigin} />
      <SearchableDropdown label="Destination (optional)" value={destination} options={placeOptions} onSelect={setDestination} />

      {product && (
        <View style={{ gap: 8 }}>
          <Text style={styles.sectionTitle}>Charge — pick one</Text>
          {options.map((o) => {
            const isSelected = !useCustom && selectedOption?.id === o.id;
            return (
              <Pressable
                key={o.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => { setSelectedOption(o); setUseCustom(false); }}
              >
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{optionLabel(o)}</Text>
              </Pressable>
            );
          })}
          <Pressable
            style={[styles.optionCard, useCustom && styles.optionCardSelected]}
            onPress={() => setUseCustom(true)}
          >
            <Text style={[styles.optionLabel, useCustom && styles.optionLabelSelected]}>Custom amount</Text>
          </Pressable>

          {useCustom && (
            <View style={{ gap: 8 }}>
              <View style={styles.segmented}>
                {(["quantity", "kg", "bulk", "custom"] as ChargeType[]).map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.segment, customType === t && styles.segmentActive]}
                    onPress={() => setCustomType(t)}
                  >
                    <Text style={[styles.segmentText, customType === t && styles.segmentTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              <CurrencyInput value={customRate} onChangeValue={setCustomRate} placeholder="Custom rate" />
            </View>
          )}
        </View>
      )}

      {activeType && activeType !== "bulk" && (
        <View>
          <Text style={styles.label}>{activeType === "kg" ? "Number of bags" : "Quantity"}</Text>
          <CurrencyInput value={quantity} onChangeValue={setQuantity} />
        </View>
      )}

      {activeType && (
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Charge total</Text>
          <Text style={styles.previewValue}>₹{computedCharge.toLocaleString("en-IN")}</Text>
        </View>
      )}

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? "Saving..." : isEditing ? "Save Changes" : "Add Load"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  helperText: { color: "#6B7280", fontSize: 12, lineHeight: 18, backgroundColor: "#FEF3C7", padding: 10, borderRadius: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  label: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginBottom: 4 },
  optionCard: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10, padding: 12, backgroundColor: "#fff" },
  optionCardSelected: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  optionLabel: { color: "#374151", fontWeight: "600" },
  optionLabelSelected: { color: "#1D4ED8" },
  segmented: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  segment: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#D1D5DB" },
  segmentActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  segmentText: { color: "#374151", fontWeight: "600" },
  segmentTextActive: { color: "#fff" },
  previewCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#111827", borderRadius: 10, padding: 14,
  },
  previewLabel: { color: "#D1D5DB", fontWeight: "600" },
  previewValue: { color: "#fff", fontWeight: "800", fontSize: 18 },
  saveButton: { backgroundColor: "#22C55E", padding: 14, borderRadius: 10, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "700" },
});