/**
 * Groups Screen
 * Browse and discover community groups
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Group, GroupCategory, GroupType } from '../types';
import groupService from '../services/groupService';
import { useAuth } from '../hooks/useAuth';

type NavigationProp = StackNavigationProp<any>;

export default function GroupsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'discover'>('all');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GroupCategory | 'all'>('all');

  useEffect(() => {
    loadGroups();
  }, [activeTab, selectedCategory]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      let fetchedGroups: Group[] = [];

      if (activeTab === 'all') {
        if (selectedCategory === 'all') {
          fetchedGroups = await groupService.getAllGroups();
        } else {
          fetchedGroups = await groupService.getGroupsByCategory(selectedCategory);
        }
      } else if (activeTab === 'my' && user) {
        fetchedGroups = await groupService.getUserGroups(user.id);
      } else if (activeTab === 'discover') {
        fetchedGroups = await groupService.getAllGroups(20);
      }

      setGroups(fetchedGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadGroups();
      return;
    }

    try {
      setLoading(true);
      const results = await groupService.searchGroups(searchQuery);
      setGroups(results);
    } catch (error) {
      console.error('Error searching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { value: 'all', label: 'All', icon: 'grid-outline' },
    { value: GroupCategory.CULTURAL, label: 'Cultural', icon: 'color-palette-outline' },
    { value: GroupCategory.SPORTS, label: 'Sports', icon: 'football-outline' },
    { value: GroupCategory.EDUCATION, label: 'Education', icon: 'school-outline' },
    { value: GroupCategory.HEALTH, label: 'Health', icon: 'medical-outline' },
    { value: GroupCategory.AGRICULTURE, label: 'Agriculture', icon: 'leaf-outline' },
    { value: GroupCategory.BUSINESS, label: 'Business', icon: 'briefcase-outline' },
    { value: GroupCategory.YOUTH, label: 'Youth', icon: 'people-outline' },
    { value: GroupCategory.WOMEN, label: 'Women', icon: 'woman-outline' },
    { value: GroupCategory.SENIORS, label: 'Seniors', icon: 'accessibility-outline' },
  ];

  const renderGroupCard = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
    >
      {item.coverImage ? (
        <Image source={{ uri: item.coverImage }} style={styles.groupImage} />
      ) : (
        <View style={[styles.groupImage, styles.placeholderImage]}>
          <Ionicons name="people" size={40} color={colors.text.secondary} />
        </View>
      )}

      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.type === GroupType.PRIVATE && (
            <Ionicons name="lock-closed" size={16} color={colors.text.secondary} />
          )}
          {item.type === GroupType.SECRET && (
            <Ionicons name="eye-off" size={16} color={colors.text.secondary} />
          )}
        </View>

        <Text style={styles.groupDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.groupStats}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.memberCount} members</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubbles-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.statText}>{item.postCount || 0} posts</Text>
          </View>
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyTitle}>No groups found</Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'my'
          ? "You haven't joined any groups yet"
          : 'Try adjusting your search or filters'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateGroup')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.activeTab]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
            My Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      {activeTab === 'all' && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.value && styles.selectedCategoryChip,
              ]}
              onPress={() => setSelectedCategory(item.value as GroupCategory | 'all')}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={
                  selectedCategory === item.value
                    ? '#FFFFFF'
                    : colors.text.secondary
                }
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.value && styles.selectedCategoryChipText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />
      )}

      {/* Groups List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupCard}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body1,
    color: colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary.main,
  },
  tabText: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  categoryList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background.paper,
    marginRight: spacing.sm,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary.main,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  groupCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  groupImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.background.card,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    padding: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  groupName: {
    ...typography.h3,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.xs,
  },
  groupDescription: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  groupStats: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  statText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.primary + '20',
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.primary.main,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
