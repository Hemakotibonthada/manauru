/**
 * Checkout Screen
 * Payment flow with address input and order confirmation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { 
  Cart, 
  Order, 
  OrderStatus, 
  PaymentMethod, 
  PaymentStatus, 
  DeliveryType,
  OrderItem 
} from '../types';
import { Timestamp } from 'firebase/firestore';
import * as shopService from '../services/shopService';
import { useAuth } from '../hooks/useAuth';

type RouteParams = {
  Checkout: {
    cart: Cart;
  };
};

type NavigationProp = StackNavigationProp<any>;

type PaymentMethodType = 'cod' | 'online' | 'upi';

export default function CheckoutScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'Checkout'>>();
  const { cart } = route.params;
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Delivery Address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [notes, setNotes] = useState('');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);

  const deliveryFee = cart.subtotal > 500 ? 0 : 40;
  const total = cart.subtotal - discount + deliveryFee;

  useEffect(() => {
    // Pre-fill user address if available
    if (user?.address) {
      setAddressLine1(user.address.street || '');
      setAddressLine2(user.address.city || '');
      setPincode(user.address.postalCode || '');
    }
  }, [user]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      // Mock coupon validation - replace with actual API call
      const mockCoupons: { [key: string]: { discount: number; type: 'percentage' | 'fixed' } } = {
        'FIRST10': { discount: 10, type: 'percentage' },
        'SAVE50': { discount: 50, type: 'fixed' },
        'WELCOME': { discount: 15, type: 'percentage' },
      };

      const coupon = mockCoupons[couponCode.toUpperCase()];
      if (coupon) {
        const discountAmount = coupon.type === 'percentage'
          ? (cart.subtotal * coupon.discount) / 100
          : coupon.discount;
        
        setDiscount(discountAmount);
        setAppliedCoupon(coupon);
        Alert.alert('Success', `Coupon applied! You saved ₹${discountAmount.toFixed(2)}`);
      } else {
        Alert.alert('Invalid Coupon', 'This coupon code is not valid');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to apply coupon');
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const validateAddress = () => {
    if (!addressLine1.trim() || !addressLine2.trim() || !pincode.trim() || !phone.trim()) {
      Alert.alert('Incomplete Address', 'Please fill in all delivery address fields');
      return false;
    }
    if (!/^\d{6}$/.test(pincode)) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode');
      return false;
    }
    if (!/^\d{10}$/.test(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;
    if (!user) return;

    try {
      setLoading(true);

      const deliveryAddress = {
        line1: addressLine1.trim(),
        line2: addressLine2.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim(),
        phone: phone.trim(),
      };

      // Convert CartItem to OrderItem
      const orderItems: OrderItem[] = cart.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        variant: item.variant,
        subtotal: item.price * item.quantity,
      }));

      const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
        orderNumber: `ORD${Date.now()}`,
        customerId: user.id,
        customerName: user.displayName,
        customerPhone: phone,
        shopId: cart.shopId,
        shopName: cart.shopName,
        items: orderItems,
        subtotal: cart.subtotal,
        deliveryFee,
        discount,
        total,
        deliveryAddress: `${deliveryAddress.line1}, ${deliveryAddress.line2}, ${deliveryAddress.landmark}, ${deliveryAddress.pincode}`,
        paymentMethod: paymentMethod === 'cod' ? PaymentMethod.CASH_ON_DELIVERY : 
                       paymentMethod === 'upi' ? PaymentMethod.UPI : PaymentMethod.CARD,
        paymentStatus: paymentMethod === 'cod' ? PaymentStatus.PENDING : PaymentStatus.PAID,
        status: OrderStatus.PENDING,
        deliveryType: DeliveryType.HOME_DELIVERY,
        notes: notes.trim(),
        estimatedDeliveryTime: Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
      };

      const orderId = await shopService.createOrder(orderData);

      // Clear cart after successful order
      await shopService.clearCart(user.id, cart.shopId);

      // Show success modal
      setShowSuccessModal(true);

      // Navigate to order details after delay
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.replace('OrderDetail' as never, { orderId } as never);
      }, 2000);

    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary.main }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color={colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Delivery Address
            </Text>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background.default, color: colors.text.primary }]}
            value={addressLine1}
            onChangeText={setAddressLine1}
            placeholder="House No, Building Name"
            placeholderTextColor={colors.text.disabled}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.default, color: colors.text.primary }]}
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Road Name, Area, Colony"
            placeholderTextColor={colors.text.disabled}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.default, color: colors.text.primary }]}
            value={landmark}
            onChangeText={setLandmark}
            placeholder="Landmark (Optional)"
            placeholderTextColor={colors.text.disabled}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput, { backgroundColor: colors.background.default, color: colors.text.primary }]}
              value={pincode}
              onChangeText={setPincode}
              placeholder="Pincode"
              placeholderTextColor={colors.text.disabled}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TextInput
              style={[styles.input, styles.halfInput, { backgroundColor: colors.background.default, color: colors.text.primary }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              placeholderTextColor={colors.text.disabled}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Order Summary */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cart" size={24} color={colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Order Summary ({cart.items.length} items)
            </Text>
          </View>

          {cart.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={[styles.itemName, { color: colors.text.primary }]}>
                {item.quantity}x {item.productName}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.text.secondary }]}>
                ₹{item.price * item.quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* Coupon Code */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag" size={24} color={colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Apply Coupon
            </Text>
          </View>

          {appliedCoupon ? (
            <View style={[styles.appliedCoupon, { backgroundColor: colors.success.main + '20' }]}>
              <View style={styles.couponInfo}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
                <Text style={[styles.couponText, { color: colors.success.main }]}>
                  {couponCode} applied! Saved ₹{discount.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Ionicons name="close-circle" size={20} color={colors.error.main} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInput}>
              <TextInput
                style={[styles.input, styles.couponField, { backgroundColor: colors.background.default, color: colors.text.primary }]}
                value={couponCode}
                onChangeText={setCouponCode}
                placeholder="Enter coupon code"
                placeholderTextColor={colors.text.disabled}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary.main }]}
                onPress={applyCoupon}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={24} color={colors.primary.main} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Payment Method
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cod' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('cod')}
          >
            <Ionicons name="cash" size={24} color={colors.text.primary} />
            <Text style={[styles.paymentText, { color: colors.text.primary }]}>
              Cash on Delivery
            </Text>
            {paymentMethod === 'cod' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'online' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('online')}
          >
            <Ionicons name="card" size={24} color={colors.text.primary} />
            <Text style={[styles.paymentText, { color: colors.text.primary }]}>
              Credit/Debit Card
            </Text>
            {paymentMethod === 'online' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'upi' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('upi')}
          >
            <Ionicons name="phone-portrait" size={24} color={colors.text.primary} />
            <Text style={[styles.paymentText, { color: colors.text.primary }]}>
              UPI Payment
            </Text>
            {paymentMethod === 'upi' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
            )}
          </TouchableOpacity>
        </View>

        {/* Delivery Notes */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Delivery Notes (Optional)
          </Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background.default, color: colors.text.primary }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special instructions for delivery..."
            placeholderTextColor={colors.text.disabled}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Price Breakdown */}
        <View style={[styles.section, { backgroundColor: colors.background.card }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.text.secondary }]}>
              Subtotal
            </Text>
            <Text style={[styles.priceValue, { color: colors.text.primary }]}>
              ₹{cart.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.text.secondary }]}>
              Delivery Fee
            </Text>
            <Text style={[styles.priceValue, { color: colors.text.primary }]}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: colors.success.main }]}>
                Discount
              </Text>
              <Text style={[styles.priceValue, { color: colors.success.main }]}>
                -₹{discount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.totalLabel, { color: colors.text.primary }]}>
              Total Amount
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary.main }]}>
              ₹{total.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.footer, { backgroundColor: colors.background.card }]}>
        <View>
          <Text style={[styles.footerLabel, { color: colors.text.secondary }]}>
            Total Amount
          </Text>
          <Text style={[styles.footerTotal, { color: colors.primary.main }]}>
            ₹{total.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, { backgroundColor: colors.primary.main }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, { backgroundColor: colors.background.card }]}>
            <View style={[styles.successIcon, { backgroundColor: colors.success.main }]}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </View>
            <Text style={[styles.successTitle, { color: colors.text.primary }]}>
              Order Placed Successfully!
            </Text>
            <Text style={[styles.successMessage, { color: colors.text.secondary }]}>
              Your order has been confirmed and will be delivered soon.
            </Text>
          </View>
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
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  couponInput: {
    flexDirection: 'row',
    gap: 8,
  },
  couponField: {
    flex: 1,
    marginBottom: 0,
  },
  applyButton: {
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  couponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  selectedPayment: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerLabel: {
    fontSize: 12,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeOrderButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    width: '80%',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
});
