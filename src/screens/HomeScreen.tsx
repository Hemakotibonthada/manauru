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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCard } from '../components/PostCard';
import { usePosts, useLikePost } from '../hooks/usePosts';
import { useAuth } from '../hooks/useAuth';
import { colors, spacing, typography } from '../styles/theme';

export const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { posts, loading, refresh, loadMore, hasMore } = usePosts();
  const { likePost } = useLikePost();

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

const styles = StyleSheet.create({
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
