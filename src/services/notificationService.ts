/**
 * Notification Service
 * Handles notification-related operations
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification, NotificationType } from '../types';

export class NotificationService {
  /**
   * Create a new notification
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any,
    actionUrl?: string
  ): Promise<string> {
    try {
      const notificationRef = doc(collection(db, 'notifications'));
      const notificationData: Omit<Notification, 'id'> = {
        userId,
        type,
        title,
        body,
        data,
        read: false,
        actionUrl,
        createdAt: serverTimestamp() as any,
      };

      await setDoc(notificationRef, notificationData);
      console.log('✅ Notification created successfully');
      return notificationRef.id;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    pageSize: number = 50
  ): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Notification)
      );
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, { read: true })
      );
      await Promise.all(promises);
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }
}

export default NotificationService;
