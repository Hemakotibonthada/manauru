/**
 * Notifications Screen
 * View and manage notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { Notification, NotificationType } from '../types';
import { colors, spacing, borderRadius, typography } from '../styles/theme';
import moment from 'moment';
import { NotificationService } from '../services/notificationService';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const data = await NotificationService.getUserNotifications(user.id);
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    // Navigate based on notification type
    if (notification.actionUrl) {
      // Navigate to the appropriate screen
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.POST_LIKE:
        return 'heart';
      case NotificationType.POST_COMMENT:
        return 'chatbubble';
      case NotificationType.POST_SHARE:
        return 'share-social';
      case NotificationType.FOLLOW:
        return 'person-add';
      case NotificationType.MESSAGE:
        return 'mail';
      case NotificationType.FUNDRAISER:
        return 'cash';
      case NotificationType.PROBLEM_UPDATE:
        return 'alert-circle';
      case NotificationType.GROUP_INVITE:
        return 'people';
      case NotificationType.ANNOUNCEMENT:
        return 'megaphone';
      default:
        return 'notifications';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getNotificationIcon(item.type) as any}
          size={24}
          color={colors.primary.main}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {moment(item.createdAt.toDate()).fromNow()}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  unreadNotification: {
    backgroundColor: colors.primary.light + '20',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: typography.caption.fontSize,
    color: colors.text.disabled,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: typography.body1.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
