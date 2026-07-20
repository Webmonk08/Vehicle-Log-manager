import React from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { productsApi } from "@/api/entities";
import type { Product, ProductChargeOption } from "@/types";
import { ChargeOptionsEditor, makeEmptyChargeOptionRow, type ChargeOptionRow } from "@/components/ChargeOptionEditor";
import { CurrencyInput } from "@/components/CurrencyInput";

function formatOption(o: ProductChargeOption | ChargeOptionRow) {
  const typeLabel = o.charge_type === "kg" ? `${o.kg_variant ?? "?"}kg` : o.charge_type;
  return `${typeLabel} · ₹${o.rate}`;
}

export function ProductsListScreen() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Create-product modal state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [rows, setRows] = React.useState<ChargeOptionRow[]>([makeEmptyChargeOptionRow()]);

  // Manage-charges modal state
  const [managingProduct, setManagingProduct] = React.useState<Product | null>(null);
  const [managingName, setManagingName] = React.useState("");
  const [existingOptions, setExistingOptions] = React.useState<ProductChargeOption[]>([]);
  const [newRows, setNewRows] = React.useState<ChargeOptionRow[]>([]);

  const refresh = React.useCallback(() => {
    return productsApi.list().then(setProducts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Enter a product name.");
      return;
    }
    const validRows = rows.filter((r) => r.rate > 0);
    if (rows.some((r) => r.charge_type === "kg" && !r.kg_variant)) {
      Alert.alert("Missing KG bracket", "Pick a bracket (25/50/100kg) for each KG row, or remove it.");
      return;
    }
    try {
      const product = await productsApi.create({ name: name.trim() } as any);
      if (validRows.length > 0) {
        await productsApi.chargeOptions.batchCreate(
          product.id,
          validRows.map((r) => ({ charge_type: r.charge_type, kg_variant: r.kg_variant, rate: r.rate }))
        );
      }
      setCreateOpen(false);
      setName("");
      setRows([makeEmptyChargeOptionRow()]);
      refresh();
    } catch {
      Alert.alert("Error", "Could not save the product. Check your connection.");
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert("Delete product?", `"${product.name}" and all its charge options will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await productsApi.remove(product.id);
          refresh();
        },
      },
    ]);
  };

  const openManageCharges = async (product: Product) => {
    setManagingProduct(product);
    setManagingName(product.name);
    setNewRows([]);
    const options = await productsApi.chargeOptions.list(product.id).catch(() => []);
    setExistingOptions(options);
  };

  const handleRenameProduct = async () => {
    if (!managingProduct || !managingName.trim()) return;
    const updated = await productsApi.update(managingProduct.id, { name: managingName.trim() } as any);
    setManagingProduct(updated);
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleUpdateExistingOption = async (option: ProductChargeOption, rate: number) => {
    const updated = await productsApi.chargeOptions.update(option.id, {
      charge_type: option.charge_type, kg_variant: option.kg_variant, rate,
    });
    setExistingOptions((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleDeleteExistingOption = async (option: ProductChargeOption) => {
    await productsApi.chargeOptions.remove(option.id);
    setExistingOptions((prev) => prev.filter((o) => o.id !== option.id));
  };

  const handleAddMoreOptions = async () => {
    if (!managingProduct) return;
    const validRows = newRows.filter((r) => r.rate > 0);
    if (validRows.length === 0) return;
    const created = await productsApi.chargeOptions.batchCreate(
      managingProduct.id,
      validRows.map((r) => ({ charge_type: r.charge_type, kg_variant: r.kg_variant, rate: r.rate }))
    );
    setExistingOptions((prev) => [...prev, ...created]);
    setNewRows([]);
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
            <Pressable style={{ flex: 1 }} onPress={() => openManageCharges(item)}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.manageHint}>Tap to manage charges</Text>
            </Pressable>
            <Pressable onPress={() => handleDeleteProduct(item)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>🗑</Text>
            </Pressable>
          </View>
        )}
      />
      <Pressable style={styles.fab} onPress={() => setCreateOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Create product + initial charge types */}
      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCreateOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>New Product</Text>
          <ScrollView contentContainerStyle={{ gap: 14 }} style={{ maxHeight: 480 }}>
            <View>
              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Cement" />
            </View>
            <Text style={styles.label}>Charge types (add as many as apply)</Text>
            <ChargeOptionsEditor rows={rows} onChange={setRows} />
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={() => setCreateOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleCreate}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Manage charges for an existing product */}
      <Modal visible={!!managingProduct} animationType="slide" transparent onRequestClose={() => setManagingProduct(null)}>
        <Pressable style={styles.backdrop} onPress={() => setManagingProduct(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Edit Product</Text>
          <View style={styles.renameRow}>
            <TextInput style={[styles.input, { flex: 1 }]} value={managingName} onChangeText={setManagingName} />
            <Pressable style={styles.renameButton} onPress={handleRenameProduct}>
              <Text style={styles.renameButtonText}>Save</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ gap: 10 }} style={{ maxHeight: 380 }}>
            {existingOptions.map((option) => (
              <View key={option.id} style={styles.existingRow}>
                <Text style={styles.existingLabel}>{formatOption(option)}</Text>
                <View style={{ width: 110 }}>
                  <CurrencyInput
                    value={option.rate}
                    onChangeValue={(rate) => handleUpdateExistingOption(option, rate)}
                  />
                </View>
                <Pressable onPress={() => handleDeleteExistingOption(option)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>✕</Text>
                </Pressable>
              </View>
            ))}
            {existingOptions.length === 0 && <Text style={styles.empty}>No charge types yet.</Text>}

            <Text style={styles.label}>Add more</Text>
            <ChargeOptionsEditor rows={newRows} onChange={setNewRows} />
            {newRows.length > 0 && (
              <Pressable style={styles.saveButton} onPress={handleAddMoreOptions}>
                <Text style={styles.saveText}>Add to product</Text>
              </Pressable>
            )}
          </ScrollView>
          <Pressable style={styles.cancelButton} onPress={() => setManagingProduct(null)}>
            <Text style={styles.cancelText}>Done</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40 },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: "#E5E7EB",
  },
  name: { fontWeight: "700", color: "#111827" },
  manageHint: { color: "#9CA3AF", fontSize: 11, marginTop: 2 },
  deleteButton: { padding: 8 },
  deleteButtonText: { fontSize: 16 },
  fab: {
    position: "absolute", right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center", elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 30 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 14 },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },
  label: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  renameRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  renameButton: { backgroundColor: "#3B82F6", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  renameButtonText: { color: "#fff", fontWeight: "700" },
  actions: { flexDirection: "row", gap: 10 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB" },
  cancelText: { color: "#374151", fontWeight: "600" },
  saveButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#3B82F6" },
  saveText: { color: "#fff", fontWeight: "700" },
  existingRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F9FAFB", borderRadius: 8, padding: 8 },
  existingLabel: { flex: 1, color: "#111827", fontWeight: "600", fontSize: 13 },
});