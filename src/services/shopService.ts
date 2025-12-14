import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Shop, Product, Order, ShopReview, Cart, CartItem, OrderStatus, PaymentStatus, ShopCategory } from '../types';

// ============= Shop Operations =============
export const createShop = async (shopData: Omit<Shop, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'totalOrders'>): Promise<string> => {
  const shopRef = await addDoc(collection(db, 'shops'), {
    ...shopData,
    rating: 0,
    reviewCount: 0,
    totalOrders: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return shopRef.id;
};

export const getShop = async (shopId: string): Promise<Shop | null> => {
  const shopDoc = await getDoc(doc(db, 'shops', shopId));
  if (!shopDoc.exists()) return null;
  return { id: shopDoc.id, ...shopDoc.data() } as Shop;
};

export const getShopsByVillage = async (villageId: string): Promise<Shop[]> => {
  const q = query(
    collection(db, 'shops'),
    where('villageId', '==', villageId),
    orderBy('rating', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shop));
};

export const getShopsByCategory = async (villageId: string, category: ShopCategory): Promise<Shop[]> => {
  const q = query(
    collection(db, 'shops'),
    where('villageId', '==', villageId),
    where('category', '==', category),
    orderBy('rating', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shop));
};

export const getMyShops = async (userId: string): Promise<Shop[]> => {
  const q = query(
    collection(db, 'shops'),
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shop));
};

export const updateShop = async (shopId: string, updates: Partial<Shop>): Promise<void> => {
  await updateDoc(doc(db, 'shops', shopId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteShop = async (shopId: string): Promise<void> => {
  await deleteDoc(doc(db, 'shops', shopId));
};

export const uploadShopImage = async (shopId: string, imageUri: string, imageName: string): Promise<string> => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const imageRef = ref(storage, `shops/${shopId}/${imageName}`);
  await uploadBytes(imageRef, blob);
  return await getDownloadURL(imageRef);
};

// ============= Product Operations =============
export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const productRef = await addDoc(collection(db, 'products'), {
    ...productData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return productRef.id;
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  const productDoc = await getDoc(doc(db, 'products', productId));
  if (!productDoc.exists()) return null;
  return { id: productDoc.id, ...productDoc.data() } as Product;
};

export const getShopProducts = async (shopId: string): Promise<Product[]> => {
  const q = query(
    collection(db, 'products'),
    where('shopId', '==', shopId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const getFeaturedProducts = async (villageId: string): Promise<Product[]> => {
  const q = query(
    collection(db, 'products'),
    where('featured', '==', true),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const searchProducts = async (searchTerm: string, villageId: string): Promise<Product[]> => {
  // Note: This is a basic implementation. For production, use Algolia or similar
  const q = query(
    collection(db, 'products'),
    orderBy('name'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  
  return allProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  await updateDoc(doc(db, 'products', productId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const productRef = await addDoc(collection(db, 'products'), {
    ...productData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return productRef.id;
};

export const deleteProduct = async (productId: string): Promise<void> => {
  await deleteDoc(doc(db, 'products', productId));
};

export const uploadProductImage = async (productId: string, imageUri: string, imageName: string): Promise<string> => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const imageRef = ref(storage, `products/${productId}/${imageName}`);
  await uploadBytes(imageRef, blob);
  return await getDownloadURL(imageRef);
};

// ============= Cart Operations =============
export const getCart = async (userId: string, shopId: string): Promise<Cart | null> => {
  const cartId = `${userId}_${shopId}`;
  const cartDoc = await getDoc(doc(db, 'carts', cartId));
  if (!cartDoc.exists()) return null;
  return cartDoc.data() as Cart;
};

export const addToCart = async (
  userId: string, 
  shopId: string, 
  item: CartItem
): Promise<void> => {
  const cartId = `${userId}_${shopId}`;
  const cartDoc = await getDoc(doc(db, 'carts', cartId));
  
  if (!cartDoc.exists()) {
    // Create new cart
    await updateDoc(doc(db, 'carts', cartId), {
      userId,
      shopId,
      items: [item],
      subtotal: item.price * item.quantity,
      updatedAt: Timestamp.now(),
    });
  } else {
    const cart = cartDoc.data() as Cart;
    const existingItemIndex = cart.items.findIndex(i => i.productId === item.productId);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      cart.items.push(item);
    }
    
    const subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    await updateDoc(doc(db, 'carts', cartId), {
      items: cart.items,
      subtotal,
      updatedAt: Timestamp.now(),
    });
  }
};

export const updateCartItem = async (
  userId: string,
  shopId: string,
  productId: string,
  quantity: number
): Promise<void> => {
  const cartId = `${userId}_${shopId}`;
  const cartDoc = await getDoc(doc(db, 'carts', cartId));
  
  if (cartDoc.exists()) {
    const cart = cartDoc.data() as Cart;
    const itemIndex = cart.items.findIndex(i => i.productId === productId);
    
    if (itemIndex >= 0) {
      if (quantity === 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      
      const subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      
      await updateDoc(doc(db, 'carts', cartId), {
        items: cart.items,
        subtotal,
        updatedAt: Timestamp.now(),
      });
    }
  }
};

export const removeFromCart = async (
  userId: string,
  shopId: string,
  productId: string
): Promise<void> => {
  await updateCartItem(userId, shopId, productId, 0);
};

export const clearCart = async (userId: string, shopId: string): Promise<void> => {
  const cartId = `${userId}_${shopId}`;
  await deleteDoc(doc(db, 'carts', cartId));
};

// ============= Order Operations =============
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const batch = writeBatch(db);
  
  // Create order
  const orderRef = doc(collection(db, 'orders'));
  batch.set(orderRef, {
    ...orderData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  // Update shop total orders
  const shopRef = doc(db, 'shops', orderData.shopId);
  batch.update(shopRef, {
    totalOrders: increment(1),
  });
  
  // Decrease product stock
  for (const item of orderData.items) {
    const productRef = doc(db, 'products', item.productId);
    batch.update(productRef, {
      stock: increment(-item.quantity),
    });
  }
  
  await batch.commit();
  
  // Clear cart
  await clearCart(orderData.customerId, orderData.shopId);
  
  return orderRef.id;
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  const orderDoc = await getDoc(doc(db, 'orders', orderId));
  if (!orderDoc.exists()) return null;
  return { id: orderDoc.id, ...orderDoc.data() } as Order;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const getShopOrders = async (shopId: string): Promise<Order[]> => {
  const q = query(
    collection(db, 'orders'),
    where('shopId', '==', shopId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  const updates: any = {
    status,
    updatedAt: Timestamp.now(),
  };
  
  if (status === OrderStatus.DELIVERED) {
    updates.actualDeliveryTime = Timestamp.now();
  }
  
  await updateDoc(doc(db, 'orders', orderId), updates);
};

export const updatePaymentStatus = async (orderId: string, status: PaymentStatus): Promise<void> => {
  await updateDoc(doc(db, 'orders', orderId), {
    paymentStatus: status,
    updatedAt: Timestamp.now(),
  });
};

export const cancelOrder = async (orderId: string, reason: string): Promise<void> => {
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found');
  
  const batch = writeBatch(db);
  
  // Update order status
  const orderRef = doc(db, 'orders', orderId);
  batch.update(orderRef, {
    status: OrderStatus.CANCELLED,
    cancelReason: reason,
    updatedAt: Timestamp.now(),
  });
  
  // Restore product stock
  for (const item of order.items) {
    const productRef = doc(db, 'products', item.productId);
    batch.update(productRef, {
      stock: increment(item.quantity),
    });
  }
  
  await batch.commit();
};

// ============= Review Operations =============
export const addReview = async (
  reviewData: Omit<ShopReview, 'id' | 'createdAt' | 'updatedAt' | 'helpful'>
): Promise<string> => {
  const batch = writeBatch(db);
  
  // Add review
  const reviewRef = doc(collection(db, 'reviews'));
  batch.set(reviewRef, {
    ...reviewData,
    helpful: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  // Update shop rating
  const shopRef = doc(db, 'shops', reviewData.shopId);
  const shopDoc = await getDoc(shopRef);
  const shop = shopDoc.data() as Shop;
  
  const newReviewCount = shop.reviewCount + 1;
  const newRating = ((shop.rating * shop.reviewCount) + reviewData.rating) / newReviewCount;
  
  batch.update(shopRef, {
    rating: newRating,
    reviewCount: newReviewCount,
  });
  
  // Update order with review
  if (reviewData.orderId) {
    const orderRef = doc(db, 'orders', reviewData.orderId);
    batch.update(orderRef, {
      rating: reviewData.rating,
      review: reviewData.review,
    });
  }
  
  await batch.commit();
  return reviewRef.id;
};

export const getShopReviews = async (shopId: string): Promise<ShopReview[]> => {
  const q = query(
    collection(db, 'reviews'),
    where('shopId', '==', shopId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShopReview));
};

export const markReviewHelpful = async (reviewId: string, userId: string): Promise<void> => {
  await updateDoc(doc(db, 'reviews', reviewId), {
    helpful: arrayUnion(userId),
  });
};

export const unmarkReviewHelpful = async (reviewId: string, userId: string): Promise<void> => {
  await updateDoc(doc(db, 'reviews', reviewId), {
    helpful: arrayRemove(userId),
  });
};

export const respondToReview = async (reviewId: string, response: string): Promise<void> => {
  await updateDoc(doc(db, 'reviews', reviewId), {
    response,
    respondedAt: Timestamp.now(),
  });
};

// ============= Statistics =============
export const getShopStats = async (shopId: string) => {
  const orders = await getShopOrders(shopId);
  const products = await getShopProducts(shopId);
  
  const totalRevenue = orders
    .filter(o => o.status === OrderStatus.DELIVERED)
    .reduce((sum, o) => sum + o.total, 0);
  
  const pendingOrders = orders.filter(o => 
    [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(o.status)
  ).length;
  
  const completedOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
  
  return {
    totalOrders: orders.length,
    pendingOrders,
    completedOrders,
    totalRevenue,
    totalProducts: products.length,
    inStockProducts: products.filter(p => p.inStock).length,
  };
};
