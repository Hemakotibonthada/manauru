/**
 * Group Detail Screen
 * Display group information, members, and posts
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { Group, GroupMember, GroupPost, GroupRole, MemberStatus } from '../types';
import groupService from '../services/groupService';
import { useAuth } from '../hooks/useAuth';
import { PostCard } from '../components/PostCard';

type RouteParams = {
  GroupDetail: {
    groupId: string;
  };
};

type NavigationProp = StackNavigationProp<any>;

export default function GroupDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'GroupDetail'>>();
  const { groupId } = route.params;
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'about'>('posts');
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState<GroupRole | null>(null);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const [groupData, membersData] = await Promise.all([
        groupService.getGroup(groupId),
        groupService.getGroupMembers(groupId),
      ]);

      setGroup(groupData);
      setMembers(membersData);

      // Check if user is a member
      if (user) {
        const userMember = membersData.find((m: GroupMember) => m.userId === user.id);
        setIsMember(!!userMember && userMember.status === MemberStatus.ACTIVE);
        setUserRole(userMember?.role || null);
      }

      // Load posts if member
      if (groupData && (isMember || groupData.type === 'public')) {
        const postsData = await groupService.getGroupPosts(groupId);
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error loading group:', error);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !group) return;

    try {
      await groupService.joinGroup(groupId, user.id, user.displayName || 'User', user.photoURL);
      Alert.alert('Success', 'You have joined the group!');
      loadGroupData();
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const handleLeaveGroup = async () => {
    if (!user) return;

    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupService.leaveGroup(groupId, user.id);
            Alert.alert('Success', 'You have left the group');
            navigation.goBack();
          } catch (error) {
            console.error('Error leaving group:', error);
            Alert.alert('Error', 'Failed to leave group');
          }
        },
      },
    ]);
  };

  const handleInviteMembers = () => {
    navigation.navigate('InviteMembers', { groupId });
  };

  const handleCreatePost = () => {
    navigation.navigate('CreateGroupPost', { groupId });
  };

  const renderPostsTab = () => (
    <View style={styles.tabContent}>
      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyDescription}>Be the first to post in this group</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.postWrapper}>
              <View style={styles.postHeader}>
                {item.userAvatar ? (
                  <Image
                    source={{ uri: item.userAvatar }}
                    style={styles.postAvatar}
                  />
                ) : (
                  <View style={[styles.postAvatar, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="person" size={20} color="#94a3b8" />
                  </View>
                )}
                <View style={styles.postInfo}>
                  <Text style={styles.postUserName}>{item.userName}</Text>
                  <Text style={styles.postTime}>
                    {item.createdAt.toDate().toLocaleDateString()}
                  </Text>
                </View>
                {item.isPinned && (
                  <Ionicons name="pin" size={16} color={colors.primary.main} />
                )}
              </View>
              <Text style={styles.postContent}>{item.content}</Text>
              {item.media.length > 0 && (
                <Image source={{ uri: item.media[0].url }} style={styles.postImage} />
              )}
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="heart-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.actionText}>{item.likeCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.actionText}>{item.commentCount}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderMembersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Members ({members.length})</Text>
        {(userRole === GroupRole.ADMIN || userRole === GroupRole.MODERATOR) && (
          <TouchableOpacity onPress={handleInviteMembers}>
            <Ionicons name="person-add" size={24} color={colors.primary.main} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            {item.userAvatar ? (
              <Image
                source={{ uri: item.userAvatar }}
                style={styles.memberAvatar}
              />
            ) : (
              <View style={[styles.memberAvatar, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={24} color="#94a3b8" />
              </View>
            )}
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.userName}</Text>
              <View style={styles.memberRole}>
                <Ionicons
                  name={
                    item.role === GroupRole.ADMIN
                      ? 'shield-checkmark'
                      : item.role === GroupRole.MODERATOR
                      ? 'star'
                      : 'person'
                  }
                  size={14}
                  color={colors.text.secondary}
                />
                <Text style={styles.memberRoleText}>{item.role}</Text>
              </View>
            </View>
            {item.status === MemberStatus.PENDING && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            )}
          </View>
        )}
        scrollEnabled={false}
      />
    </View>
  );

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>{group?.description}</Text>
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={20} color={colors.text.secondary} />
          <Text style={styles.detailText}>{group?.memberCount} members</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={20} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            Created {group?.createdAt.toDate().toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name={group?.type === 'public' ? 'globe' : 'lock-closed'}
            size={20}
            color={colors.text.secondary}
          />
          <Text style={styles.detailText}>{group?.type} group</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag" size={20} color={colors.text.secondary} />
          <Text style={styles.detailText}>{group?.category}</Text>
        </View>
      </View>

      {group?.rules && group.rules.length > 0 && (
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>Group Rules</Text>
          {group.rules.map((rule, index) => (
            <View key={index} style={styles.ruleItem}>
              <Text style={styles.ruleNumber}>{index + 1}.</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error.main} />
        <Text style={styles.errorText}>Group not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {group.coverImage ? (
          <Image source={{ uri: group.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, styles.placeholderCover]}>
            <Ionicons name="people" size={64} color={colors.text.secondary} />
          </View>
        )}

        {/* Group Info */}
        <View style={styles.groupInfo}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.groupType}>
              <Ionicons
                name={group.type === 'public' ? 'globe' : 'lock-closed'}
                size={16}
                color={colors.text.secondary}
              />
              <Text style={styles.groupTypeText}>{group.type}</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{group.memberCount}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{group.postCount || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {!isMember ? (
              <TouchableOpacity style={styles.joinButton} onPress={handleJoinGroup}>
                <Text style={styles.joinButtonText}>Join Group</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.postButton} onPress={handleCreatePost}>
                  <Ionicons name="add" size={20} color={colors.text.inverse} />
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
                  <Text style={styles.leaveButtonText}>Leave</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts
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
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
              About
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' && renderPostsTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'about' && renderAboutTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  errorText: {
    ...typography.h3,
    color: colors.error.main,
    marginTop: spacing.md,
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.background.card,
  } as const,
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    padding: spacing.lg,
    backgroundColor: colors.background.default,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  groupName: {
    ...typography.h2,
    color: colors.text.primary,
    flex: 1,
  },
  groupType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  groupTypeText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    textTransform: 'capitalize',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  statValue: {
    ...typography.h2,
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  joinButton: {
    flex: 1,
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  joinButtonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
  postButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonText: {
    ...typography.button,
    color: colors.text.inverse,
    marginLeft: spacing.xs,
  },
  leaveButton: {
    flex: 1,
    backgroundColor: colors.background.card,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  leaveButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background.default,
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
    ...typography.body1,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  tabContent: {
    padding: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptyDescription: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  postWrapper: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  } as const,
  postInfo: {
    flex: 1,
  },
  postUserName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
  },
  postTime: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  postContent: {
    ...typography.body1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  } as const,
  postActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  } as const,
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  memberRole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberRoleText: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  pendingBadge: {
    backgroundColor: colors.warning.main + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  pendingText: {
    ...typography.caption,
    color: colors.warning.main,
  },
  aboutSection: {
    marginBottom: spacing.lg,
  },
  aboutText: {
    ...typography.body1,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  detailText: {
    ...typography.body1,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  ruleNumber: {
    ...typography.body1,
    color: colors.primary.main,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  ruleText: {
    ...typography.body1,
    color: colors.text.secondary,
    flex: 1,
  },
});
