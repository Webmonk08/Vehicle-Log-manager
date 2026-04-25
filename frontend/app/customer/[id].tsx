import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/constants/Theme';
import { useCustomer, useProducts, useCreateProduct, useDeleteProduct, useUpdateProduct } from '@/hooks/useApi';
import { LoadingState } from '@/components/StateViews';
import { RentType } from '@/types';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: customer, isLoading: customerLoading } = useCustomer(id);
  const { data: products, isLoading: productsLoading } = useProducts(id);
  
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    default_rate: '',
    unit_type: 'KG' as RentType,
  });

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.default_rate) return;
    
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          data: {
            name: productForm.name,
            default_rate: parseFloat(productForm.default_rate),
            unit_type: productForm.unit_type,
          }
        });
      } else {
        await createProduct.mutateAsync({
          customer_id: id,
          name: productForm.name,
          default_rate: parseFloat(productForm.default_rate),
          unit_type: productForm.unit_type,
        });
      }
      setModalVisible(false);
      resetForm();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save product');
    }
  };

  const resetForm = () => {
    setProductForm({ name: '', default_rate: '', unit_type: 'KG' });
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      default_rate: product.default_rate.toString(),
      unit_type: product.unit_type,
    });
    setModalVisible(true);
  };

  const handleDelete = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to remove this product from the rate card?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteProduct.mutate(productId)
        },
      ]
    );
  };

  if (customerLoading) return <LoadingState message="Loading customer..." />;
  if (!customer) return <View style={styles.container}><Text>Customer not found</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Customer Header */}
      <View style={styles.headerCard}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerMeta}>Standard KG Rate: ₹{customer.default_rate_per_kg || 'N/A'}</Text>
        </View>
      </View>

      {/* Rate Card Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Rate Card (Products)</Text>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => { resetForm(); setModalVisible(true); }}
        >
          <Ionicons name="add-circle" size={20} color={Colors.primary} />
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {productsLoading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
      ) : (products || []).length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="pricetags-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No products in rate card</Text>
          <Text style={styles.emptySubtext}>Add products to automate pricing during trip creation</Text>
        </View>
      ) : (
        <View style={styles.productList}>
          {(products || []).map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productRate}>
                  ₹{product.default_rate.toLocaleString('en-IN')} / {product.unit_type}
                </Text>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity onPress={() => handleEdit(product)} style={styles.actionBtn}>
                  <Ionicons name="create-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(product.id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Product Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
            
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Iron Rods"
              value={productForm.name}
              onChangeText={(v) => setProductForm(p => ({ ...p, name: v }))}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Default Rate (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={productForm.default_rate}
                  onChangeText={(v) => setProductForm(prev => ({ ...prev, default_rate: v }))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Unit Type</Text>
                <View style={styles.unitToggleRow}>
                  {(['KG', 'Unit', 'Bulk'] as RentType[]).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.unitChip, productForm.unit_type === type && styles.unitChipActive]}
                      onPress={() => setProductForm(prev => ({ ...prev, unit_type: type }))}
                    >
                      <Text style={[styles.unitChipText, productForm.unit_type === type && styles.unitChipTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.btn, styles.cancelBtn]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.submitBtn]} 
                onPress={handleSaveProduct}
                disabled={createProduct.isPending || updateProduct.isPending}
              >
                {(createProduct.isPending || updateProduct.isPending) ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{editingProduct ? 'Update' : 'Add to Rate Card'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  headerCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.card,
  },
  backBtn: { marginRight: Spacing.md },
  headerInfo: { flex: 1 },
  customerName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  customerMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  emptyCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    marginTop: Spacing.lg,
  },
  emptyText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  productList: { gap: Spacing.md },
  productCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  productRate: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '600', marginTop: 2 },
  productActions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { padding: Spacing.xs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: -8 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  unitToggleRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm },
  unitChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  unitChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  unitChipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  unitChipTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  btn: { flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.borderLight },
  submitBtn: { backgroundColor: Colors.primary },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  submitBtnText: { color: '#fff', fontWeight: '700' },
});
