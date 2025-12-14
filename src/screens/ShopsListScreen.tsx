import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { typography } from '../styles/theme';
import { Shop, ShopCategory } from '../types';
import { getShopsByVillage, getShopsByCategory } from '../services/shopService';
import { useAuth } from '../hooks/useAuth';

const CATEGORY_ICONS: Record<ShopCategory, keyof typeof Ionicons.glyphMap> = {
  [ShopCategory.GROCERY]: 'cart',
  [ShopCategory.RESTAURANT]: 'restaurant',
  [ShopCategory.CLOTHING]: 'shirt',
  [ShopCategory.ELECTRONICS]: 'phone-portrait',
  [ShopCategory.PHARMACY]: 'medkit',
  [ShopCategory.HARDWARE]: 'hammer',
  [ShopCategory.BAKERY]: 'cafe',
  [ShopCategory.VEGETABLES]: 'leaf',
  [ShopCategory.DAIRY]: 'water',
  [ShopCategory.MEAT]: 'fast-food',
  [ShopCategory.STATIONERY]: 'create',
  [ShopCategory.MOBILE_SHOP]: 'phone-portrait',
  [ShopCategory.BEAUTY]: 'sparkles',
  [ShopCategory.JEWELRY]: 'diamond',
  [ShopCategory.FURNITURE]: 'bed',
  [ShopCategory.BOOKS]: 'book',
  [ShopCategory.TOYS]: 'football',
  [ShopCategory.SPORTS]: 'bicycle',
  [ShopCategory.AUTOMOBILE]: 'car',
  [ShopCategory.OTHER]: 'ellipsis-horizontal',
};

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  [ShopCategory.GROCERY]: 'Grocery',
  [ShopCategory.RESTAURANT]: 'Restaurant',
  [ShopCategory.CLOTHING]: 'Clothing',
  [ShopCategory.ELECTRONICS]: 'Electronics',
  [ShopCategory.PHARMACY]: 'Pharmacy',
  [ShopCategory.HARDWARE]: 'Hardware',
  [ShopCategory.BAKERY]: 'Bakery',
  [ShopCategory.VEGETABLES]: 'Vegetables',
  [ShopCategory.DAIRY]: 'Dairy',
  [ShopCategory.MEAT]: 'Meat',
  [ShopCategory.STATIONERY]: 'Stationery',
  [ShopCategory.MOBILE_SHOP]: 'Mobile Shop',
  [ShopCategory.BEAUTY]: 'Beauty',
  [ShopCategory.JEWELRY]: 'Jewelry',
  [ShopCategory.FURNITURE]: 'Furniture',
  [ShopCategory.BOOKS]: 'Books',
  [ShopCategory.TOYS]: 'Toys',
  [ShopCategory.SPORTS]: 'Sports',
  [ShopCategory.AUTOMOBILE]: 'Automobile',
  [ShopCategory.OTHER]: 'Other',
};

export default function ShopsListScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'orders'>('rating');

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    filterShops();
  }, [searchQuery, selectedCategory, shops]);

  const loadShops = async () => {
    try {
      if (!user?.villageId) return;
      const shopsData = await getShopsByVillage(user.villageId);
      setShops(shopsData);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterShops = () => {
    let filtered = [...shops];

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(shop => shop.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(query) ||
        shop.description.toLowerCase().includes(query) ||
        shop.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply rating filter
    if (minRating > 0) {
      filtered = filtered.filter(shop => shop.rating >= minRating);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'orders':
          return b.totalOrders - a.totalOrders;
        default:
          return 0;
      }
    });

    setFilteredShops(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShops();
  };

  const renderCategory = (category: ShopCategory) => {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => setSelectedCategory(isSelected ? null : category)}
      >
        <Ionicons
          name={CATEGORY_ICONS[category]}
          size={20}
          color={isSelected ? '#FFFFFF' : colors.text.secondary}
        />
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
          {CATEGORY_LABELS[category]}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderShop = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => navigation.navigate('ShopDetail', { shopId: item.id })}
    >
      <Image
        source={{ uri: item.coverImage || item.photos[0] || 'https://via.placeholder.com/400x200' }}
        style={styles.shopImage}
      />
      
      {item.verified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      )}

      <View style={styles.shopInfo}>
        <View style={styles.shopHeader}>
          <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount})</Text>
          </View>
        </View>

        <Text style={styles.shopDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.shopMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location" size={14} color={colors.text.secondary} />
            <Text style={styles.metaText} numberOfLines={1}>{item.address}</Text>
          </View>

          {item.deliveryAvailable && (
            <View style={styles.deliveryBadge}>
              <Ionicons name="bicycle" size={14} color={colors.primary.main} />
              <Text style={styles.deliveryText}>Delivery</Text>
            </View>
          )}
        </View>

        <View style={styles.shopFooter}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: item.isOpen ? '#4CAF50' : colors.text.disabled }]} />
            <Text style={[styles.statusText, { color: item.isOpen ? '#4CAF50' : colors.text.disabled }]}>
              {item.isOpen ? 'Open Now' : 'Closed'}
            </Text>
          </View>

          <Text style={styles.categoryLabel}>
            {CATEGORY_LABELS[item.category]}
          </Text>
        </View>
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops..."
          placeholderTextColor={colors.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={20} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Advanced Filters */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort By:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
                onPress={() => setSortBy('rating')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'rating' && styles.sortButtonTextActive]}>
                  Rating
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
                onPress={() => setSortBy('name')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                  Name
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'orders' && styles.sortButtonActive]}
                onPress={() => setSortBy('orders')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'orders' && styles.sortButtonTextActive]}>
                  Popular
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Min Rating:</Text>
            <View style={styles.ratingButtons}>
              {[0, 3, 4, 4.5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[styles.ratingButton, minRating === rating && styles.ratingButtonActive]}
                  onPress={() => setMinRating(rating)}
                >
                  <Ionicons 
                    name="star" 
                    size={16} 
                    color={minRating === rating ? '#fff' : colors.warning.main} 
                  />
                  <Text style={[styles.ratingButtonText, minRating === rating && styles.ratingButtonTextActive]}>
                    {rating === 0 ? 'All' : `${rating}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setMinRating(0);
              setSortBy('rating');
              setSelectedCategory(null);
              setSearchQuery('');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {Object.values(ShopCategory).map(renderCategory)}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RegisterShop')}
        >
          <Ionicons name="add-circle" size={20} color={colors.primary.main} />
          <Text style={styles.actionButtonText}>Register Shop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('MyShops')}
        >
          <Ionicons name="storefront" size={20} color={colors.primary.main} />
          <Text style={styles.actionButtonText}>My Shops</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <Ionicons name="receipt" size={20} color={colors.primary.main} />
          <Text style={styles.actionButtonText}>My Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredShops.length} {filteredShops.length === 1 ? 'shop' : 'shops'} found
        </Text>
        {(selectedCategory || searchQuery) && (
          <TouchableOpacity onPress={() => { setSelectedCategory(null); setSearchQuery(''); }}>
            <Text style={styles.clearFilters}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Shops List */}
      <FlatList
        data={filteredShops}
        renderItem={renderShop}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.main]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No shops found</Text>
            <Text style={styles.emptySubtext}>
              {selectedCategory || searchQuery
                ? 'Try adjusting your filters'
                : 'Be the first to register a shop!'}
            </Text>
          </View>
        }
      />

      {/* Floating Cart Button */}
      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => navigation.navigate('Cart')}
      >
        <Ionicons name="cart" size={24} color="#FFFFFF" />
        {/* Add cart item count badge here if needed */}
      </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text.primary,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: colors.primary.main,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  clearFilters: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  shopCard: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shopImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.background.default,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  shopInfo: {
    padding: 12,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  shopDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.secondary,
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
  shopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
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
    fontSize: 12,
    fontWeight: '600',
  },
  categoryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    backgroundColor: colors.background.default,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  filterButton: {
    marginLeft: 8,
    padding: 4,
  },
  filtersPanel: {
    backgroundColor: colors.background.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  sortButtonText: {
    fontSize: 12,
    color: colors.text.primary,
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  ratingButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  ratingButtonText: {
    fontSize: 12,
    color: colors.text.primary,
  },
  ratingButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  clearFiltersButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
