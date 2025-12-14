/**
 * Home Screen
 * Main feed showing posts from villages
 */

import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../components/PostCard';
import { usePosts, useLikePost } from '../hooks/usePosts';
import { useAuth } from '../hooks/useAuth';
import { spacing, typography, getThemedColors } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

export const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const { posts, loading, refresh, loadMore, hasMore } = usePosts();
  const { likePost } = useLikePost();
  
  const styles = createStyles(colors);

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) return;
    try {
      await likePost(postId, user.id, isLiked);
      refresh();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }, [user, likePost, refresh]);

  const renderPost = ({ item }: any) => (
    <PostCard
      post={item}
      currentUserId={user?.id || ''}
      onLike={() => handleLike(item.id, item.likes.includes(user?.id))}
      onComment={() => navigation.navigate('PostDetail', { postId: item.id })}
      onShare={() => {}}
      onUserPress={() => navigation.navigate('Profile', { userId: item.userId })}
      onPostPress={() => navigation.navigate('PostDetail', { postId: item.id })}
    />
  );

  const renderHeader = () => (
    <View style={styles.shortcuts}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('People')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#9B59B620' }]}>
            <Ionicons name="people-circle" size={24} color="#9B59B6" />
          </View>
          <Text style={styles.shortcutText}>People</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Groups')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: colors.primary.main + '20' }]}>
            <Ionicons name="people" size={24} color={colors.primary.main} />
          </View>
          <Text style={styles.shortcutText}>Groups</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Events')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#FF6B6B20' }]}>
            <Ionicons name="calendar" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.shortcutText}>Events</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Fundraisers')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#4ECDC420' }]}>
            <Ionicons name="heart" size={24} color="#4ECDC4" />
          </View>
          <Text style={styles.shortcutText}>Fundraisers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#FFD93D20' }]}>
            <Ionicons name="notifications" size={24} color="#FFD93D" />
          </View>
          <Text style={styles.shortcutText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#95E1D320' }]}>
            <Ionicons name="settings" size={24} color="#95E1D3" />
          </View>
          <Text style={styles.shortcutText}>Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={64} color={colors.text.disabled} />
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptyText}>
        Start following villages to see posts in your feed
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Explore')}
      >
        <Text style={styles.exploreButtonText}>Explore Villages</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={posts.length === 0 ? styles.emptyList : undefined}
      />

      {/* Create Post FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Ionicons name="add" size={28} color={colors.primary.contrast} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.paper,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  exploreButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: colors.primary.contrast,
    fontSize: typography.body1.fontSize,
    fontWeight: '600',
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
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
  },
  shortcuts: {
    backgroundColor: colors.background.default,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  shortcut: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    width: 70,
  },
  shortcutIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  shortcutText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
