/**
 * Messages Screen
 * Chat and messaging interface
 */

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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatService } from '../services/chatService';
import { Chat, ChatType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

export const MessagesScreen = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  const loadChats = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await ChatService.getUserChats(user.id);
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const getChatTitle = (chat: Chat) => {
    if (chat.type === ChatType.GROUP) {
      return chat.participantDetails[0]?.userName || 'Group Chat';
    }
    // For direct chat, show the other user's name
    const otherUser = chat.participantDetails.find((p) => p.userId !== user?.id);
    return otherUser?.userName || 'Unknown User';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === ChatType.GROUP) {
      return null; // Could show group avatar
    }
    const otherUser = chat.participantDetails.find((p) => p.userId !== user?.id);
    return otherUser?.userAvatar;
  };

  const getUnreadCount = (chat: Chat) => {
    return user ? chat.unreadCount[user.id] || 0 : 0;
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes > 0 ? `${minutes}m ago` : 'Just now';
    }
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const chatTitle = getChatTitle(item);
    const chatAvatar = getChatAvatar(item);
    const unreadCount = getUnreadCount(item);
    const lastMessagePreview = item.lastMessage?.content || 'No messages yet';
    const lastMessageTime = item.lastMessageTime;

    return (
      <TouchableOpacity style={styles.chatItem}>
        <View style={styles.avatarContainer}>
          {chatAvatar ? (
            <Image source={{ uri: chatAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons
                name={item.type === ChatType.GROUP ? 'people' : 'person'}
                size={24}
                color={colors.text.disabled}
              />
            </View>
          )}
          {item.type === ChatType.GROUP && (
            <View style={styles.groupBadge}>
              <Ionicons name="people" size={12} color={colors.primary.contrast} />
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {chatTitle}
            </Text>
            {lastMessageTime && (
              <Text style={styles.chatTime}>{formatTime(lastMessageTime)}</Text>
            )}
          </View>
          <View style={styles.chatPreview}>
            <Text
              style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]}
              numberOfLines={1}
            >
              {lastMessagePreview}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={chats.length === 0 ? styles.emptyList : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation with your village community
            </Text>
          </View>
        }
      />

      {/* FAB for new chat */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="create" size={24} color={colors.primary.contrast} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.paper,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chatTitle: {
    flex: 1,
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
  },
  chatTime: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    lineHeight: typography.body2.lineHeight,
  },
  unreadMessage: {
    color: colors.text.primary,
    fontWeight: typography.h5.fontWeight as any,
  },
  unreadBadge: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.round,
    minWidth: 20,
    height: 20,
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  unreadText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary.contrast,
    fontWeight: typography.h5.fontWeight as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.h4.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.body1.fontSize,
    color: colors.text.disabled,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
