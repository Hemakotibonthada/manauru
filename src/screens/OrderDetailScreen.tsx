/**
 * Order Detail Screen
 * Detailed order tracking with timeline and delivery status
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { Order, OrderStatus, PaymentStatus } from '../types';
import * as shopService from '../services/shopService';
import { useAuth } from '../hooks/useAuth';

type RouteParams = {
  OrderDetail: {
    orderId: string;
  };
};

type NavigationProp = StackNavigationProp<any>;

interface OrderTimeline {
  status: string;
  label: string;
  timestamp?: string;
  completed: boolean;
  icon: string;
}

export default function OrderDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'OrderDetail'>>();
  const { orderId } = route.params;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<OrderTimeline[]>([]);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const orderData = await shopService.getOrder(orderId);
      setOrder(orderData);
      if (orderData) {
        buildTimeline(orderData);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (order: Order) => {
    const timelineSteps: OrderTimeline[] = [
      {
        status: OrderStatus.PENDING,
        label: 'Order Placed',
        timestamp: order.createdAt?.toDate().toLocaleString(),
        completed: true,
        icon: 'checkmark-circle',
      },
      {
        status: OrderStatus.CONFIRMED,
        label: 'Order Confirmed',
        timestamp: order.status === OrderStatus.CONFIRMED || 
                   order.status === OrderStatus.PREPARING ||
                   order.status === OrderStatus.READY ||
                   order.status === OrderStatus.PICKED_UP ||
                   order.status === OrderStatus.DELIVERED 
                   ? new Date().toLocaleString() : undefined,
        completed: order.status !== OrderStatus.PENDING,
        icon: 'clipboard',
      },
      {
        status: OrderStatus.PREPARING,
        label: 'Preparing Order',
        timestamp: order.status === OrderStatus.PREPARING ||
                   order.status === OrderStatus.READY ||
                   order.status === OrderStatus.PICKED_UP ||
                   order.status === OrderStatus.DELIVERED
                   ? new Date().toLocaleString() : undefined,
        completed: order.status === OrderStatus.PREPARING ||
                   order.status === OrderStatus.READY ||
                   order.status === OrderStatus.PICKED_UP ||
                   order.status === OrderStatus.DELIVERED,
        icon: 'basket',
      },
      {
        status: OrderStatus.READY,
        label: 'Ready for Pickup',
        timestamp: order.status === OrderStatus.READY ||
                   order.status === OrderStatus.PICKED_UP ||
                   order.status === OrderStatus.DELIVERED
                   ? new Date().toLocaleString() : undefined,
        completed: order.status === OrderStatus.READY ||
                   order.status === OrderStatus.PICKED_UP ||
                   order.status === OrderStatus.DELIVERED,
        icon: 'checkmark-done',
      },
      {
        status: OrderStatus.PICKED_UP,
        label: 'Out for Delivery',
        timestamp: order.status === OrderStatus.PICKED_UP ||
                   order.status === OrderStatus.DELIVERED
                   ? new Date().toLocaleString() : undefined,
        completed: order.status === OrderStatus.PICKED_UP ||
                   order.status === OrderStatus.DELIVERED,
        icon: 'bicycle',
      },
      {
        status: OrderStatus.DELIVERED,
        label: 'Delivered',
        timestamp: order.status === OrderStatus.DELIVERED
                   ? new Date().toLocaleString() : undefined,
        completed: order.status === OrderStatus.DELIVERED,
        icon: 'home',
      },
    ];

    setTimeline(timelineSteps);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return colors.warning.main;
      case OrderStatus.CONFIRMED:
      case OrderStatus.PREPARING:
        return colors.info.main;
      case OrderStatus.READY:
      case OrderStatus.PICKED_UP:
        return colors.primary.main;
      case OrderStatus.DELIVERED:
        return colors.success.main;
      case OrderStatus.CANCELLED:
        return colors.error.main;
      default:
        return colors.text.secondary;
    }
  };

  const handleCallShop = () => {
    if (order?.shopId) {
      // In real app, fetch shop phone number
      const phoneNumber = '1234567890';
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await shopService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
              Alert.alert('Success', 'Order cancelled successfully');
              loadOrder();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  const handleTrackDelivery = () => {
    // Open maps with delivery tracking
    // In real app, integrate with delivery partner API
    Alert.alert('Track Delivery', 'Delivery tracking will open in maps');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.default }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.default }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error.main} />
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>
            Order not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary.main }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity onPress={handleCallShop} style={styles.callButton}>
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.background.card }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {order.status.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.orderId, { color: colors.text.secondary }]}>
              Order #{orderId.slice(-8)}
            </Text>
          </View>

          {order.status === OrderStatus.PICKED_UP && (
            <TouchableOpacity
              style={[styles.trackButton, { backgroundColor: colors.primary.main }]}
              onPress={handleTrackDelivery}
            >
              <Ionicons name="location" size={20} color="#fff" />
              <Text style={styles.trackButtonText}>Track Delivery</Text>
            </TouchableOpacity>
          )}

          <View style={styles.estimatedDelivery}>
            <Ionicons name="time" size={20} color={colors.text.secondary} />
            <Text style={[styles.estimatedText, { color: colors.text.secondary }]}>
              Estimated delivery: {order.estimatedDeliveryTime 
                ? new Date(order.estimatedDeliveryTime.toDate()).toLocaleDateString()
                : 'TBD'}
            </Text>
          </View>
        </View>

        {/* Order Timeline */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Order Timeline
          </Text>
          
          {timeline.map((step, index) => (
            <View key={step.status} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineIcon,
                  {
                    backgroundColor: step.completed
                      ? colors.primary.main
                      : colors.background.default,
                    borderColor: step.completed ? colors.primary.main : colors.border,
                  }
                ]}>
                  <Ionicons
                    name={step.icon as any}
                    size={16}
                    color={step.completed ? '#fff' : colors.text.disabled}
                  />
                </View>
                {index < timeline.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    {
                      backgroundColor: step.completed
                        ? colors.primary.main
                        : colors.border,
                    }
                  ]} />
                )}
              </View>

              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineLabel,
                  {
                    color: step.completed ? colors.text.primary : colors.text.disabled,
                    fontWeight: step.completed ? '600' : 'normal',
                  }
                ]}>
                  {step.label}
                </Text>
                {step.timestamp && (
                  <Text style={[styles.timelineTimestamp, { color: colors.text.secondary }]}>
                    {step.timestamp}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Delivery Address
          </Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color={colors.primary.main} />
            <Text style={[styles.addressText, { color: colors.text.primary }]}>
              {order.deliveryAddress}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="call" size={20} color={colors.primary.main} />
            <Text style={[styles.addressText, { color: colors.text.primary }]}>
              {order.customerPhone}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Order Items ({order.items.length})
          </Text>
          
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemLeft}>
                <Image
                  source={{ uri: item.productImage || 'https://via.placeholder.com/60' }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: colors.text.primary }]}>
                    {item.productName}
                  </Text>
                  <Text style={[styles.itemQuantity, { color: colors.text.secondary }]}>
                    Qty: {item.quantity} × ₹{item.price}
                  </Text>
                </View>
              </View>
              <Text style={[styles.itemTotal, { color: colors.primary.main }]}>
                ₹{item.quantity * item.price}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Payment Summary
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.text.secondary }]}>
              Subtotal
            </Text>
            <Text style={[styles.priceValue, { color: colors.text.primary }]}>
              ₹{order.subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.text.secondary }]}>
              Delivery Fee
            </Text>
            <Text style={[styles.priceValue, { color: colors.text.primary }]}>
              {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toFixed(2)}`}
            </Text>
          </View>

          {order.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.success.main }]}>
                Discount
              </Text>
              <Text style={[styles.priceValue, { color: colors.success.main }]}>
                -₹{order.discount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.priceRow}>
            <Text style={[styles.totalLabel, { color: colors.text.primary }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary.main }]}>
              ₹{order.total.toFixed(2)}
            </Text>
          </View>

          <View style={styles.paymentMethodRow}>
            <Ionicons name="card" size={20} color={colors.text.secondary} />
            <Text style={[styles.paymentMethodText, { color: colors.text.secondary }]}>
              Payment Method: {order.paymentMethod.toUpperCase()}
            </Text>
          </View>

          <View style={[
            styles.paymentStatusBadge,
            {
              backgroundColor: order.paymentStatus === PaymentStatus.PAID
                ? colors.success.main + '20'
                : colors.warning.main + '20'
            }
          ]}>
            <Text style={[
              styles.paymentStatusText,
              {
                color: order.paymentStatus === PaymentStatus.PAID
                  ? colors.success.main
                  : colors.warning.main
              }
            ]}>
              Payment {order.paymentStatus}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={[styles.section, { backgroundColor: colors.background.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Delivery Notes
            </Text>
            <Text style={[styles.notesText, { color: colors.text.secondary }]}>
              {order.notes}
            </Text>
          </View>
        )}

        {/* Cancel Order Button */}
        {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.error.main }]}
            onPress={handleCancelOrder}
          >
            <Ionicons name="close-circle" size={20} color={colors.error.main} />
            <Text style={[styles.cancelButtonText, { color: colors.error.main }]}>
              Cancel Order
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  callButton: {
    padding: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderId: {
    fontSize: 12,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  estimatedDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  estimatedText: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  timelineTimestamp: {
    fontSize: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  paymentMethodText: {
    fontSize: 14,
  },
  paymentStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
