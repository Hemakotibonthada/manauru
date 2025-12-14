import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { Product, CartItem } from '../types';
import { getProduct, addToCart } from '../services/shopService';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute();
  const { productId } = route.params as { productId: string };
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const productData = await getProduct(productId);
      setProduct(productData);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !user?.id) return;

    setAddingToCart(true);
    try {
      const cartItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.images[0],
        quantity,
        unit: product.unit,
        price: product.price,
        maxStock: product.stock,
      };

      await addToCart(user.id, product.shopId, cartItem);
      
      Alert.alert(
        'Added to Cart',
        `${quantity} ${product.unit} of ${product.name} added to cart`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          {
            text: 'View Cart',
            onPress: () => navigation.navigate('Cart'),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigation.navigate('Cart');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.text.disabled} />
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true} bounces={true}>
        {/* Product Images */}
        <View style={styles.imagesContainer}>
          <Image
            source={{ uri: product.images[selectedImageIndex] || 'https://via.placeholder.com/400' }}
            style={styles.mainImage}
          />
          
          {!product.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}

          {product.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailScroll}
            >
              {product.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && styles.thumbnailSelected,
                  ]}
                >
                  <Image source={{ uri: image }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <TouchableOpacity
            style={styles.shopLink}
            onPress={() => navigation.navigate('ShopDetail', { shopId: product.shopId })}
          >
            <Ionicons name="storefront" size={16} color={colors.primary.main} />
            <Text style={styles.shopName}>{product.shopName}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary.main} />
          </TouchableOpacity>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{product.price.toFixed(2)}</Text>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <Text style={styles.originalPrice}>₹{product.originalPrice.toFixed(2)}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </Text>
                  </View>
                </>
              )}
            </View>
            <Text style={styles.unit}>per {product.unit}</Text>
          </View>

          {product.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.featuredText}>Featured Product</Text>
            </View>
          )}

          <View style={styles.stockInfo}>
            <Ionicons
              name={product.inStock ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={product.inStock ? '#4CAF50' : '#F44336'}
            />
            <Text style={[styles.stockText, { color: product.inStock ? '#4CAF50' : '#F44336' }]}>
              {product.inStock ? `In Stock (${product.stock} ${product.unit} available)` : 'Out of Stock'}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {product.tags.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {product.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Specifications</Text>
              {Object.entries(product.specifications).map(([key, value]) => (
                <View key={key} style={styles.specRow}>
                  <Text style={styles.specKey}>{key}:</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {product.inStock && (
        <View style={styles.bottomActions}>
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={quantity <= 1 ? colors.text.disabled : colors.primary.main}
                />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity
                style={[styles.quantityButton, quantity >= product.stock && styles.quantityButtonDisabled]}
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={quantity >= product.stock ? colors.text.disabled : colors.primary.main}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.addToCartButton, addingToCart && styles.buttonDisabled]}
              onPress={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Add to Cart</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buyNowButton, addingToCart && styles.buttonDisabled]}
              onPress={handleBuyNow}
              disabled={addingToCart}
            >
              <Ionicons name="flash" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  errorText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginTop: 12,
  },
  imagesContainer: {
    backgroundColor: colors.background.paper,
  },
  mainImage: {
    width: width,
    height: width,
    backgroundColor: colors.background.default,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  thumbnailScroll: {
    padding: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: colors.primary.main,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: colors.background.paper,
    marginTop: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  shopLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  shopName: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
  },
  priceRow: {
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
  },
  originalPrice: {
    fontSize: 18,
    color: colors.text.disabled,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: colors.success.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 14,
    color: colors.success.main,
    fontWeight: '600',
  },
  unit: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginBottom: 12,
  },
  featuredText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.background.default,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  specKey: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  bottomActions: {
    backgroundColor: colors.background.paper,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buyNowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success.main,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
