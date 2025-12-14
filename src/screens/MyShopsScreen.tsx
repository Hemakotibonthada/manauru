import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { Shop } from '../types';
import { getMyShops, getShopStats } from '../services/shopService';
import { useAuth } from '../hooks/useAuth';

export default function MyShopsScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      if (!user?.id) return;
      const myShops = await getMyShops(user.id);
      setShops(myShops);
    } catch (error) {
      console.error('Error loading shops:', error);
      Alert.alert('Error', 'Failed to load your shops');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadShops();
  };

  const renderShop = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={styles.shopCard}
      // @ts-ignore - Navigation typing issue
      onPress={() => navigation.navigate('ShopDetail', { shopId: item.id })}
    >
      <Image
        source={{ uri: item.coverImage || item.photos[0] || 'https://via.placeholder.com/400x200' }}
        style={styles.shopImage}
      />

      <View style={styles.statusBadges}>
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: item.isOpen ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.badgeText}>{item.isOpen ? 'Open' : 'Closed'}</Text>
        </View>
      </View>

      <View style={styles.shopInfo}>
        <Text style={styles.shopName}>{item.name}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#FFB800" />
            <Text style={styles.statText}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>({item.reviewCount})</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="receipt-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.totalOrders}</Text>
            <Text style={styles.statLabel}>orders</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            // @ts-ignore - Navigation typing issue
            onPress={() => navigation.navigate('ManageProducts', { shopId: item.id })}
          >
            <Ionicons name="cube-outline" size={18} color={colors.primary.main} />
            <Text style={styles.actionButtonText}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            // @ts-ignore - Navigation typing issue
            onPress={() => navigation.navigate('ShopOrders', { shopId: item.id })}
          >
            <Ionicons name="receipt-outline" size={18} color={colors.primary.main} />
            <Text style={styles.actionButtonText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            // @ts-ignore - Navigation typing issue
            onPress={() => navigation.navigate('EditShop', { shopId: item.id })}
          >
            <Ionicons name="settings-outline" size={18} color={colors.primary.main} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
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
      <FlatList
        data={shops}
        renderItem={renderShop}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.main]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={80} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No shops yet</Text>
            <Text style={styles.emptySubtext}>Register your first shop to start selling</Text>
            <TouchableOpacity
              style={styles.registerButton}
              // @ts-ignore - Navigation typing issue
              onPress={() => navigation.navigate('RegisterShop')}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.registerButtonText}>Register Shop</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {shops.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          // @ts-ignore - Navigation typing issue
          onPress={() => navigation.navigate('RegisterShop')}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
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
  listContent: {
    padding: 16,
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
    height: 150,
    backgroundColor: colors.background.default,
  },
  statusBadges: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shopInfo: {
    padding: 16,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary.light,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fab: {
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
});
