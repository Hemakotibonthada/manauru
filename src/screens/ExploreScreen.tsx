/**
 * Explore Screen
 * Browse villages, groups, and discover new content
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { VillageService } from '../services/villageService';
import { PostService } from '../services/postService';
import { Village, Post } from '../types';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';
import { spacing, borderRadius, typography, getThemedColors } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

type TabType = 'villages' | 'popular' | 'nearby';

export const ExploreScreen = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const [activeTab, setActiveTab] = useState<TabType>('villages');
  const [villages, setVillages] = useState<Village[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [nearbyVillages, setNearbyVillages] = useState<Village[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  
  const styles = createStyles(colors);

  useEffect(() => {
    loadVillages();
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (activeTab === 'popular') {
      loadPopularPosts();
    } else if (activeTab === 'nearby') {
      loadNearbyVillages();
    }
  }, [activeTab, timeRange]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const loadVillages = async () => {
    try {
      setLoading(true);
      const data = await VillageService.getAllVillages(50);
      setVillages(data);
    } catch (error) {
      console.error('Error loading villages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularPosts = async () => {
    try {
      setLoading(true);
      const posts = await PostService.getPopularPosts(20, timeRange);
      setPopularPosts(posts);
    } catch (error) {
      console.error('Error loading popular posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyVillages = async () => {
    try {
      setLoading(true);
      if (!userLocation) {
        if (!locationPermission) {
          await requestLocationPermission();
        }
        setLoading(false);
        return;
      }
      const villages = await VillageService.getNearbyVillages(
        userLocation.latitude,
        userLocation.longitude,
        50
      );
      setNearbyVillages(villages);
    } catch (error) {
      console.error('Error loading nearby villages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'villages') {
      await loadVillages();
    } else if (activeTab === 'popular') {
      await loadPopularPosts();
    } else if (activeTab === 'nearby') {
      await loadNearbyVillages();
    }
    setRefreshing(false);
  };

  const filteredVillages = villages.filter((village: Village) =>
    village.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    village.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    village.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLikePost = async (postId: string) => {
    try {
      if (!user) return;
      await PostService.likePost(postId, user.id);
      // Refresh posts after like
      await loadPopularPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentPost = (postId: string) => {
    // TODO: Navigate to post detail with comment section
    console.log('Comment on post:', postId);
  };

  const renderVillageCard = ({ item }: { item: Village }) => (
    <TouchableOpacity style={styles.villageCard}>
      <View style={styles.villageImageContainer}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.villageImage} />
        ) : (
          <View style={[styles.villageImage, styles.villagePlaceholder]}>
            <Ionicons name="location" size={32} color={colors.primary.main} />
          </View>
        )}
        {item.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
          </View>
        )}
      </View>
      
      <View style={styles.villageInfo}>
        <Text style={styles.villageName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.villageLocation} numberOfLines={1}>
            {item.district}, {item.state}
          </Text>
        </View>
        <View style={styles.villageStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color={colors.primary.main} /><Text style={styles.statText}>{item.memberCount} members</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.joinButton}>
          <Text style={styles.joinButtonText}>Explore</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      );
    }

    if (activeTab === 'villages') {
      return (
        <FlatList
          key="villages-grid"
          data={filteredVillages}
          renderItem={renderVillageCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No villages found</Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'popular') {
      return (
        <FlatList
          key="popular-list"
          data={popularPosts}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?.id || ''}
              onLike={() => handleLikePost(item.id)}
              onComment={() => handleCommentPost(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.postListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.timeRangeContainer}>
              <TouchableOpacity
                style={[styles.timeRangeButton, timeRange === 'day' && styles.activeTimeRange]}
                onPress={() => setTimeRange('day')}
              >
                <Text style={[styles.timeRangeText, timeRange === 'day' && styles.activeTimeRangeText]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeRangeButton, timeRange === 'week' && styles.activeTimeRange]}
                onPress={() => setTimeRange('week')}
              >
                <Text style={[styles.timeRangeText, timeRange === 'week' && styles.activeTimeRangeText]}>Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeRangeButton, timeRange === 'month' && styles.activeTimeRange]}
                onPress={() => setTimeRange('month')}
              >
                <Text style={[styles.timeRangeText, timeRange === 'month' && styles.activeTimeRangeText]}>Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeRangeButton, timeRange === 'all' && styles.activeTimeRange]}
                onPress={() => setTimeRange('all')}
              >
                <Text style={[styles.timeRangeText, timeRange === 'all' && styles.activeTimeRangeText]}>All Time</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="flame-outline" size={64} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No popular posts yet</Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'nearby') {
      if (!locationPermission) {
        return (
          <View style={styles.centerContainer}>
            <Ionicons name="location-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>Location permission required</Text>
            <TouchableOpacity
              style={styles.enableLocationButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.enableLocationButtonText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <FlatList
          key="nearby-grid"
          data={nearbyVillages}
          renderItem={renderVillageCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={64} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No nearby villages found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your location or check back later</Text>
            </View>
          }
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search villages, groups..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.text.disabled}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'villages' && styles.activeTab]}
          onPress={() => setActiveTab('villages')}
        >
          <Ionicons
            name="location"
            size={20}
            color={activeTab === 'villages' ? colors.primary.main : colors.text.secondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'villages' && styles.activeTabText,
            ]}
          >
            Villages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
          onPress={() => setActiveTab('popular')}
        >
          <Ionicons
            name="flame"
            size={20}
            color={activeTab === 'popular' ? colors.primary.main : colors.text.secondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'popular' && styles.activeTabText,
            ]}
          >
            Popular
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
          onPress={() => setActiveTab('nearby')}
        >
          <Ionicons
            name="compass"
            size={20}
            color={activeTab === 'nearby' ? colors.primary.main : colors.text.secondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'nearby' && styles.activeTabText,
            ]}
          >
            Nearby
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body1.fontSize,
    color: colors.text.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.h5.fontWeight as any,
  },
  activeTabText: {
    color: colors.primary.main,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  villageCard: {
    width: '48%',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  villageImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  villageImage: {
    width: '100%',
    height: '100%',
  },
  villagePlaceholder: {
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.round,
    padding: 2,
  },
  villageInfo: {
    padding: spacing.md,
  },
  villageName: {
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  villageLocation: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    flex: 1,
  },
  villageStats: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  joinButton: {
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  joinButtonText: {
    color: colors.primary.contrast,
    fontSize: typography.body2.fontSize,
    fontWeight: typography.h5.fontWeight as any,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.body1.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  placeholderText: {
    fontSize: typography.h4.fontSize,
    color: colors.text.disabled,
    marginTop: spacing.md,
  },
  postListContent: {
    padding: spacing.md,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  timeRangeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.default,
  },
  activeTimeRange: {
    backgroundColor: colors.primary.main,
  },
  timeRangeText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.h5.fontWeight as any,
  },
  activeTimeRangeText: {
    color: colors.primary.contrast,
  },
  enableLocationButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  enableLocationButtonText: {
    color: colors.primary.contrast,
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
  },
  emptySubtext: {
    fontSize: typography.body2.fontSize,
    color: colors.text.disabled,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
