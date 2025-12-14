import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { Shop, Product, ShopReview } from '../types';
import { getShop, getShopProducts, getShopReviews, markReviewHelpful, unmarkReviewHelpful } from '../services/shopService';
import { useAuth } from '../hooks/useAuth';
import moment from 'moment';

export default function ShopDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { shopId } = route.params as { shopId: string };
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ShopReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');
  const [productSearch, setProductSearch] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');

  useEffect(() => {
    loadShopData();
  }, [shopId]);

  useEffect(() => {
    filterProducts();
  }, [products, productSearch, priceFilter, stockFilter]);

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (productSearch.trim()) {
      const query = productSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (priceFilter === 'low') return p.price < 100;
        if (priceFilter === 'mid') return p.price >= 100 && p.price <= 500;
        if (priceFilter === 'high') return p.price > 500;
        return true;
      });
    }

    // Stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(p => p.inStock);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(p => !p.inStock);
    }

    setFilteredProducts(filtered);
  };

  const loadShopData = async () => {
    try {
      const [shopData, productsData, reviewsData] = await Promise.all([
        getShop(shopId),
        getShopProducts(shopId),
        getShopReviews(shopId),
      ]);
      setShop(shopData);
      setProducts(productsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading shop:', error);
      Alert.alert('Error', 'Failed to load shop details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!user) return;
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (review?.helpful?.includes(user.id)) {
        await unmarkReviewHelpful(reviewId, user.id);
      } else {
        await markReviewHelpful(reviewId, user.id);
      }
      await loadShopData();
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      // @ts-ignore - Navigation typing issue
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <Image
        source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
        style={styles.productImage}
      />
      
      {!item.inStock && (
        <View style={styles.outOfStockBadge}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
          {item.originalPrice && item.originalPrice > item.price && (
            <>
              <Text style={styles.originalPrice}>₹{item.originalPrice.toFixed(2)}</Text>
              <Text style={styles.discount}>
                {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
              </Text>
            </>
          )}
        </View>

        <Text style={styles.unit}>per {item.unit}</Text>

        <TouchableOpacity
          style={[styles.addToCartButton, !item.inStock && styles.addToCartButtonDisabled]}
          disabled={!item.inStock}
        >
          <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.text.disabled} />
        <Text style={styles.errorText}>Shop not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Shop Header */}
        <Image
          source={{ uri: shop.coverImage || shop.photos[0] || 'https://via.placeholder.com/400x200' }}
          style={styles.coverImage}
        />

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.shopName}>{shop.name}</Text>
              {shop.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#FFB800" />
              <Text style={styles.rating}>{shop.rating.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color={colors.text.secondary} />
              <Text style={styles.metaText}>{shop.address}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: shop.isOpen ? '#4CAF50' : colors.text.disabled }]} />
              <Text style={[styles.statusText, { color: shop.isOpen ? '#4CAF50' : colors.text.disabled }]}>
                {shop.isOpen ? 'Open Now' : 'Closed'}
              </Text>
            </View>

            {shop.deliveryAvailable && (
              <View style={styles.deliveryBadge}>
                <Ionicons name="bicycle" size={16} color={colors.primary.main} />
                <Text style={styles.deliveryText}>Delivery Available</Text>
              </View>
            )}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call" size={20} color={colors.primary.main} />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>

            {shop.whatsappNumber && (
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.actionText}>WhatsApp</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="navigate" size={20} color={colors.primary.main} />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.tabActive]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
              Products ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews ({shop.reviewCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'products' && (
          <View style={styles.tabContent}>
            {/* Product Search and Filters */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search products..."
                  placeholderTextColor={colors.text.secondary}
                  value={productSearch}
                  onChangeText={setProductSearch}
                />
                {productSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setProductSearch('')}>
                    <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
                <TouchableOpacity
                  style={[styles.filterChip, priceFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setPriceFilter('all')}
                >
                  <Text style={[styles.filterText, priceFilter === 'all' && styles.filterTextActive]}>All Prices</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, priceFilter === 'low' && styles.filterChipActive]}
                  onPress={() => setPriceFilter('low')}
                >
                  <Text style={[styles.filterText, priceFilter === 'low' && styles.filterTextActive]}>Under ₹100</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, priceFilter === 'mid' && styles.filterChipActive]}
                  onPress={() => setPriceFilter('mid')}
                >
                  <Text style={[styles.filterText, priceFilter === 'mid' && styles.filterTextActive]}>₹100-500</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, priceFilter === 'high' && styles.filterChipActive]}
                  onPress={() => setPriceFilter('high')}
                >
                  <Text style={[styles.filterText, priceFilter === 'high' && styles.filterTextActive]}>Above ₹500</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, stockFilter === 'in-stock' && styles.filterChipActive]}
                  onPress={() => setStockFilter(stockFilter === 'in-stock' ? 'all' : 'in-stock')}
                >
                  <Text style={[styles.filterText, stockFilter === 'in-stock' && styles.filterTextActive]}>In Stock</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {filteredProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color={colors.text.disabled} />
                <Text style={styles.emptyText}>
                  {products.length === 0 ? 'No products available yet' : 'No products match your filters'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={styles.productsGrid}
                columnWrapperStyle={styles.productRow}
              />
            )}
          </View>
        )}

        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{shop.description}</Text>

            {shop.tags.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {shop.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactItem}>
              <Ionicons name="call" size={20} color={colors.text.secondary} />
              <Text style={styles.contactText}>{shop.phoneNumber}</Text>
            </View>
            
            {shop.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={20} color={colors.text.secondary} />
                <Text style={styles.contactText}>{shop.email}</Text>
              </View>
            )}

            {shop.deliveryAvailable && (
              <>
                <Text style={styles.sectionTitle}>Delivery Information</Text>
                {shop.deliveryFee !== undefined && (
                  <Text style={styles.infoText}>Delivery Fee: ₹{shop.deliveryFee.toFixed(2)}</Text>
                )}
                {shop.minOrderAmount !== undefined && (
                  <Text style={styles.infoText}>Minimum Order: ₹{shop.minOrderAmount.toFixed(2)}</Text>
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            {reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="star-outline" size={48} color={colors.text.disabled} />
                <Text style={styles.emptyText}>No reviews yet</Text>
                <Text style={styles.emptySubtext}>Be the first to review this shop!</Text>
              </View>
            ) : (
              <>
                {/* Review Summary */}
                <View style={styles.reviewSummary}>
                  <View style={styles.ratingLarge}>
                    <Text style={styles.ratingNumber}>{shop.rating.toFixed(1)}</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= Math.round(shop.rating) ? 'star' : 'star-outline'}
                          size={16}
                          color="#FFB800"
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewCount}>{shop.reviewCount} reviews</Text>
                  </View>
                  
                  {/* Rating Breakdown */}
                  <View style={styles.ratingBreakdown}>
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percentage = (count / reviews.length) * 100;
                      return (
                        <View key={rating} style={styles.ratingRow}>
                          <Text style={styles.ratingLabel}>{rating}</Text>
                          <Ionicons name="star" size={12} color="#FFB800" />
                          <View style={styles.ratingBar}>
                            <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                          </View>
                          <Text style={styles.ratingPercent}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Reviews List */}
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <Image
                          source={{ uri: review.userAvatar || 'https://via.placeholder.com/40' }}
                          style={styles.reviewerAvatar}
                        />
                        <View>
                          <Text style={styles.reviewerName}>{review.userName}</Text>
                          <View style={styles.reviewMeta}>
                            <View style={styles.starsSmall}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                  key={star}
                                  name={star <= review.rating ? 'star' : 'star-outline'}
                                  size={12}
                                  color="#FFB800"
                                />
                              ))}
                            </View>
                            <Text style={styles.reviewDate}>
                              {review.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {review.review && (
                      <Text style={styles.reviewComment}>{review.review}</Text>
                    )}

                    {review.photos && review.photos.length > 0 && (
                      <View style={styles.reviewImages}>
                        {review.photos.map((img: string, idx: number) => (
                          <Image key={idx} source={{ uri: img }} style={styles.reviewImage} />
                        ))}
                      </View>
                    )}

                    {review.response && (
                      <View style={styles.shopResponse}>
                        <Text style={styles.responseLabel}>Shop Owner Response:</Text>
                        <Text style={styles.responseText}>{review.response}</Text>
                      </View>
                    )}

                    <View style={styles.reviewFooter}>
                      <TouchableOpacity
                        style={styles.helpfulButton}
                        onPress={() => handleMarkHelpful(review.id)}
                      >
                        <Ionicons
                          name={review.helpful?.includes(user?.id || '') ? 'thumbs-up' : 'thumbs-up-outline'}
                          size={16}
                          color={review.helpful?.includes(user?.id || '') ? colors.primary.main : colors.text.secondary}
                        />
                        <Text style={styles.helpfulText}>
                          Helpful ({review.helpful?.length || 0})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Manage Shop Button (for shop owner) */}
      {user?.id === shop.ownerId && (
        <TouchableOpacity
          style={styles.manageButton}
          // @ts-ignore - Navigation typing issue
          onPress={() => navigation.navigate('ManageProducts', { shopId: shop.id })}
        >
          <Ionicons name="settings" size={20} color="#FFFFFF" />
          <Text style={styles.manageButtonText}>Manage Shop</Text>
        </TouchableOpacity>
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
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background.paper,
  },
  header: {
    backgroundColor: colors.background.paper,
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  deliveryText: {
    fontSize: 12,
    color: colors.primary.main,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  productsGrid: {
    paddingBottom: 16,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background.default,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  productInfo: {
    padding: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    height: 36,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.text.disabled,
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 10,
    color: colors.success.main,
    fontWeight: '600',
  },
  unit: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addToCartButtonDisabled: {
    opacity: 0.5,
  },
  addToCartText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.disabled,
    marginTop: 4,
  },
  errorText: {
    fontSize: 18,
    color: colors.text.secondary,
    marginTop: 12,
  },
  reviewSummary: {
    backgroundColor: colors.background.paper,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  ratingLarge: {
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text.primary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  ratingBreakdown: {
    marginTop: 16,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    width: 12,
  },
  ratingBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.background.default,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFB800',
  },
  ratingPercent: {
    fontSize: 12,
    color: colors.text.secondary,
    width: 30,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: colors.background.paper,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsSmall: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  verifiedPurchase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewImages: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  shopResponse: {
    backgroundColor: colors.background.default,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main,
    marginBottom: 4,
  },
  responseText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  reviewFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.primary,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.divider,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  manageButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  manageButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
