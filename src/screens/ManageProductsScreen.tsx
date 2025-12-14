/**
 * Manage Products Screen
 * Shop owners can add, edit, and manage their products
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { Product } from '../types';
import * as shopService from '../services/shopService';
import { useAuth } from '../hooks/useAuth';

type RouteParams = {
  ManageProducts: {
    shopId: string;
  };
};

type NavigationProp = StackNavigationProp<any>;

export default function ManageProductsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ManageProducts'>>();
  const { shopId } = route.params;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('piece');
  const [images, setImages] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [featured, setFeatured] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [shopId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await shopService.getShopProducts(shopId);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const handleSaveProduct = async () => {
    if (!name.trim() || !price || !stock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) return;

    try {
      setLoading(true);

      const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        shopId,
        shopName: '', // Will be populated by service
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        stock: parseInt(stock),
        category: category.trim() || 'Other',
        unit,
        images,
        inStock,
        featured,
        tags: [],
      };

      if (editingProduct) {
        await shopService.updateProduct(editingProduct.id, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await shopService.addProduct(productData);
        Alert.alert('Success', 'Product added successfully');
      }

      resetForm();
      setShowAddModal(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setOriginalPrice(product.originalPrice?.toString() || '');
    setStock(product.stock.toString());
    setCategory(product.category);
    setUnit(product.unit);
    setImages(product.images);
    setInStock(product.inStock);
    setFeatured(product.featured || false);
    setShowAddModal(true);
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await shopService.deleteProduct(productId);
              Alert.alert('Success', 'Product deleted');
              loadProducts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setStock('');
    setCategory('');
    setUnit('piece');
    setImages([]);
    setInStock(true);
    setFeatured(false);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={[styles.productCard, { backgroundColor: colors.background.card }]}>
      <Image
        source={{ uri: item.images[0] || 'https://via.placeholder.com/100' }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text.primary }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.productPrice, { color: colors.primary.main }]}>
          ₹{item.price}/{item.unit}
        </Text>
        <View style={styles.stockRow}>
          <Text style={[styles.stockText, { color: colors.text.secondary }]}>
            Stock: {item.stock} {item.unit}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.inStock ? colors.success.main + '20' : colors.error.main + '20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.inStock ? colors.success.main : colors.error.main }
            ]}>
              {item.inStock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary.main }]}
          onPress={() => handleEditProduct(item)}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error.main }]}
          onPress={() => handleDeleteProduct(item.id)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary.main }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Products</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color={colors.text.disabled} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No products yet
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.text.secondary }]}>
                Tap + to add your first product
              </Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Product Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background.default }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.primary.main }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            <TouchableOpacity onPress={handleSaveProduct} disabled={loading}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Product Images */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>
                Product Images (Max 5)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreview}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImages(images.filter((_, i) => i !== index))}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error.main} />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 5 && (
                  <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                    <Ionicons name="camera" size={32} color={colors.text.secondary} />
                    <Text style={[styles.addImageText, { color: colors.text.secondary }]}>
                      Add Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {/* Product Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Product Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter product name"
                placeholderTextColor={colors.text.disabled}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background.card, color: colors.text.primary }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your product"
                placeholderTextColor={colors.text.disabled}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Price */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Price (₹) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.disabled}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Original Price (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.disabled}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Stock and Unit */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Stock *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="0"
                  placeholderTextColor={colors.text.disabled}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text.primary }]}>Unit</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="piece, kg, liter"
                  placeholderTextColor={colors.text.disabled}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Category</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g., Vegetables, Fruits, Dairy"
                placeholderTextColor={colors.text.disabled}
              />
            </View>

            {/* Switches */}
            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: colors.text.primary }]}>In Stock</Text>
              <Switch
                value={inStock}
                onValueChange={setInStock}
                trackColor={{ false: colors.text.disabled, true: colors.primary.main }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Featured Product</Text>
              <Switch
                value={featured}
                onValueChange={setFeatured}
                trackColor={{ false: colors.text.disabled, true: colors.primary.main }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockText: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  productActions: {
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  imagePreview: {
    marginRight: 12,
    position: 'relative',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 12,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
});
