import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { Order, OrderStatus } from '../types';
import { getUserOrders } from '../services/shopService';
import { useAuth } from '../hooks/useAuth';

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '#FF9800',
  [OrderStatus.CONFIRMED]: '#2196F3',
  [OrderStatus.PREPARING]: '#9C27B0',
  [OrderStatus.READY]: '#4CAF50',
  [OrderStatus.OUT_FOR_DELIVERY]: '#00BCD4',
  [OrderStatus.PICKED_UP]: '#00BCD4',
  [OrderStatus.DELIVERED]: '#4CAF50',
  [OrderStatus.CANCELLED]: '#F44336',
  [OrderStatus.REJECTED]: '#F44336',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.PREPARING]: 'Preparing',
  [OrderStatus.READY]: 'Ready',
  [OrderStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [OrderStatus.PICKED_UP]: 'Picked Up',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.REJECTED]: 'Rejected',
};

const STATUS_ICONS: Record<OrderStatus, keyof typeof Ionicons.glyphMap> = {
  [OrderStatus.PENDING]: 'time-outline',
  [OrderStatus.CONFIRMED]: 'checkmark-circle-outline',
  [OrderStatus.PREPARING]: 'restaurant-outline',
  [OrderStatus.READY]: 'gift-outline',
  [OrderStatus.OUT_FOR_DELIVERY]: 'bicycle-outline',
  [OrderStatus.PICKED_UP]: 'checkmark-done-outline',
  [OrderStatus.DELIVERED]: 'checkmark-done-circle',
  [OrderStatus.CANCELLED]: 'close-circle-outline',
  [OrderStatus.REJECTED]: 'close-circle-outline',
};

export default function OrdersScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [filter, orders]);

  const loadOrders = async () => {
    try {
      if (!user?.id) return;
      const ordersData = await getUserOrders(user.id);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (filter === 'active') {
      filtered = filtered.filter(order =>
        [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY].includes(order.status)
      );
    } else if (filter === 'completed') {
      filtered = filtered.filter(order =>
        [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED].includes(order.status)
      );
    }

    setFilteredOrders(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      // @ts-ignore - Navigation typing issue
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <Text style={styles.shopName}>{item.shopName}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <Ionicons
            name={STATUS_ICONS[item.status]}
            size={14}
            color={STATUS_COLORS[item.status]}
          />
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.orderDetailRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.orderDetailText}>{formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.orderDetailRow}>
          <Ionicons name="cube-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.orderDetailText}>
            {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={styles.orderDetailRow}>
          <Ionicons name={item.deliveryType === 'home_delivery' ? 'bicycle-outline' : 'walk-outline'} size={14} color={colors.text.secondary} />
          <Text style={styles.orderDetailText}>
            {item.deliveryType === 'home_delivery' ? 'Home Delivery' : 'Pickup'}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.orderTotal}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>₹{item.total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary.main} />
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterTabText, filter === 'completed' && styles.filterTabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.main]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'active'
                ? 'You have no active orders'
                : filter === 'completed'
                ? 'You have no completed orders'
                : 'Start shopping to place your first order'}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('ShopsList' as never)}
              >
                <Text style={styles.browseButtonText}>Browse Shops</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    padding: 4,
    margin: 16,
    borderRadius: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: colors.primary.main,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  orderCard: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  shopName: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderDetailText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  orderTotal: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary.light,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
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
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  browseButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
