/**
 * Village Detail Screen
 * View village information, posts, and members
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
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VillageService } from '../services/villageService';
import { PostService } from '../services/postService';
import { useAuth } from '../hooks/useAuth';
import { PostCard } from '../components/PostCard';
import { Village, Post } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface VillageDetailScreenProps {
  route: any;
  navigation: any;
}

export const VillageDetailScreen: React.FC<VillageDetailScreenProps> = ({ route, navigation }) => {
  const { villageId } = route.params;
  const { user } = useAuth();
  const [village, setVillage] = useState<Village | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'members'>('posts');

  useEffect(() => {
    loadVillage();
    loadPosts();
  }, [villageId]);

  const loadVillage = async () => {
    try {
      const data = await VillageService.getVillage(villageId);
      setVillage(data);
      setIsFollowing(user?.villageId === villageId);
    } catch (error) {
      console.error('Error loading village:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const { posts: data } = await PostService.getPosts(20, undefined, villageId);
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !village) return;
    try {
      if (isFollowing) {
        await VillageService.unfollowVillage(user.id, village.id);
        setIsFollowing(false);
      } else {
        await VillageService.followVillage(user.id, village.id);
        setIsFollowing(true);
      }
      await loadVillage();
    } catch (error) {
      console.error('Error following village:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadVillage(), loadPosts()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!village) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error.main} />
        <Text style={styles.errorText}>Village not found</Text>
      </View>
    );
  }

  const renderPosts = () => (
    <FlatList
      data={posts}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          currentUserId={user?.id || ''}
          onLike={async () => {
            if (!user) return;
            await PostService.likePost(item.id, user.id);
            await loadPosts();
          }}
          onComment={() => navigation.navigate('PostDetail', { postId: item.id })}
          onUserPress={() => navigation.navigate('Profile', { userId: item.userId })}
          onPostPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        />
      )}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      }
    />
  );

  const renderAbout = () => (
    <ScrollView style={styles.aboutContainer}>
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color={colors.primary.main} />
          <Text style={styles.infoText}>
            {village.district}, {village.state} - {village.pincode}
          </Text>
        </View>
        {village.population && (
          <View style={styles.infoRow}>
            <Ionicons name="people" size={20} color={colors.primary.main} />
            <Text style={styles.infoText}>Population: {village.population.toLocaleString()}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="language" size={20} color={colors.primary.main} />
          <Text style={styles.infoText}>Language: {village.language}</Text>
        </View>
      </View>

      <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.descriptionText}>{village.description}</Text>
      </View>

      {village.categories && village.categories.length > 0 && (
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.tagsContainer}>
            {village.categories.map((category, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{category}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderMembers = () => (
    <View style={styles.membersContainer}>
      <Text style={styles.comingSoonText}>Members list coming soon</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {village.coverImage ? (
          <Image source={{ uri: village.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}
        
        <View style={styles.headerContent}>
          <View style={styles.profileImageContainer}>
            {village.profileImage ? (
              <Image source={{ uri: village.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profilePlaceholder]}>
                <Ionicons name="location" size={48} color={colors.primary.main} />
              </View>
            )}
            {village.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
              </View>
            )}
          </View>

          <View style={styles.villageInfo}>
            <Text style={styles.villageName}>{village.name}</Text>
            <Text style={styles.villageLocation}>
              {village.district}, {village.state}
            </Text>
            <Text style={styles.memberCount}>{village.memberCount} members</Text>
          </View>

          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollow}
          >
            <Ionicons
              name={isFollowing ? 'checkmark-circle' : 'add-circle'}
              size={20}
              color={isFollowing ? colors.success.main : colors.primary.contrast}
            />
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'about' && styles.activeTab]}
          onPress={() => setActiveTab('about')}
        >
          <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
            About
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'posts' && renderPosts()}
      {activeTab === 'about' && renderAbout()}
      {activeTab === 'members' && renderMembers()}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.h4.fontSize,
    color: colors.error.main,
    marginTop: spacing.md,
  },
  header: {
    backgroundColor: colors.background.paper,
    ...shadows.md,
  },
  coverImage: {
    width: '100%',
    height: 150,
  },
  coverPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: colors.background.default,
  },
  headerContent: {
    padding: spacing.md,
  },
  profileImageContainer: {
    position: 'absolute',
    top: -50,
    left: spacing.md,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.background.paper,
  },
  profilePlaceholder: {
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.background.paper,
    borderRadius: 12,
  },
  villageInfo: {
    marginTop: 60,
    marginBottom: spacing.md,
  },
  villageName: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  villageLocation: {
    fontSize: typography.body1.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  memberCount: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  followingButton: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.success.main,
  },
  followButtonText: {
    color: colors.primary.contrast,
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
  },
  followingButtonText: {
    color: colors.success.main,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    fontSize: typography.body1.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.h5.fontWeight as any,
  },
  activeTabText: {
    color: colors.primary.main,
  },
  aboutContainer: {
    flex: 1,
    padding: spacing.md,
  },
  infoSection: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.primary,
  },
  descriptionSection: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  categoriesSection: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary.main,
    fontWeight: typography.h5.fontWeight as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.body1.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  membersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: typography.body1.fontSize,
    color: colors.text.disabled,
  },
});
