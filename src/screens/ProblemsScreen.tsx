/**
 * Problems Screen
 * Report and view community problems
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProblemService } from '../services/problemService';
import { Problem, ProblemCategory, ProblemSeverity, ProblemStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { spacing, borderRadius, typography, getThemedColors } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

type FilterType = 'all' | ProblemStatus;

export const ProblemsScreen = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  
  const styles = createStyles(colors);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const data = await ProblemService.getAllProblems(50);
      setProblems(data);
    } catch (error) {
      console.error('Error loading problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProblems();
    setRefreshing(false);
  };

  const handleUpvote = async (problemId: string) => {
    if (!user) return;
    try {
      await ProblemService.upvoteProblem(problemId, user.id);
      // Update local state
      setProblems((prev: Problem[]) =>
        prev.map((p: Problem) =>
          p.id === problemId
            ? {
                ...p,
                upvotes: p.upvotes.includes(user.id)
                  ? p.upvotes.filter((id: string) => id !== user.id)
                  : [...p.upvotes, user.id],
                upvoteCount: p.upvotes.includes(user.id)
                  ? p.upvoteCount - 1
                  : p.upvoteCount + 1,
              }
            : p
        )
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upvote problem');
    }
  };

  const getSeverityColor = (severity: ProblemSeverity) => {
    switch (severity) {
      case ProblemSeverity.CRITICAL:
        return colors.error.main;
      case ProblemSeverity.HIGH:
        return colors.warning.main;
      case ProblemSeverity.MEDIUM:
        return colors.info.main;
      case ProblemSeverity.LOW:
        return colors.success.main;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusColor = (status: ProblemStatus) => {
    switch (status) {
      case ProblemStatus.RESOLVED:
        return colors.success.main;
      case ProblemStatus.IN_PROGRESS:
        return colors.info.main;
      case ProblemStatus.ACKNOWLEDGED:
        return colors.warning.main;
      default:
        return colors.text.secondary;
    }
  };

  const getCategoryIcon = (category: ProblemCategory) => {
    switch (category) {
      case ProblemCategory.WATER:
        return 'water';
      case ProblemCategory.ELECTRICITY:
        return 'flash';
      case ProblemCategory.ROAD:
        return 'car';
      case ProblemCategory.SANITATION:
        return 'trash';
      case ProblemCategory.HEALTH:
        return 'medical';
      case ProblemCategory.EDUCATION:
        return 'school';
      case ProblemCategory.SAFETY:
        return 'shield';
      default:
        return 'alert-circle';
    }
  };

  const filteredProblems = filter === 'all'
    ? problems
    : problems.filter((p: Problem) => p.status === filter);

  const renderProblemCard = ({ item }: { item: Problem }) => {
    const isUpvoted = user ? item.upvotes.includes(user.id) : false;

    return (
      <TouchableOpacity style={styles.problemCard}>
        <View style={styles.problemHeader}>
          <View style={styles.userInfo}>
            {item.userAvatar ? (
              <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color={colors.text.disabled} />
              </View>
            )}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.villageName}>{item.villageName}</Text>
            </View>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
            <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.problemContent}>
          <View style={styles.titleRow}>
            <Ionicons
              name={getCategoryIcon(item.category) as any}
              size={20}
              color={colors.primary.main}
            />
            <Text style={styles.problemTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.problemDescription} numberOfLines={3}>
            {item.description}
          </Text>

          {item.media.length > 0 && (
            <Image
              source={{ uri: item.media[0].url }}
              style={styles.problemImage}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={styles.problemFooter}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleUpvote(item.id)}
            >
              <Ionicons
                name={isUpvoted ? 'arrow-up' : 'arrow-up-outline'}
                size={20}
                color={isUpvoted ? colors.primary.main : colors.text.secondary}
              /><Text
                style={[
                  styles.actionText,
                  isUpvoted && { color: colors.primary.main },
                ]}
              >
                {item.upvoteCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbox-outline" size={20} color={colors.text.secondary} /><Text style={styles.actionText}>{item.commentCount}</Text>
            </TouchableOpacity>
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
      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === ProblemStatus.REPORTED && styles.activeFilter]}
          onPress={() => setFilter(ProblemStatus.REPORTED)}
        >
          <Text
            style={[
              styles.filterText,
              filter === ProblemStatus.REPORTED && styles.activeFilterText,
            ]}
          >
            Reported
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === ProblemStatus.IN_PROGRESS && styles.activeFilter]}
          onPress={() => setFilter(ProblemStatus.IN_PROGRESS)}
        >
          <Text
            style={[
              styles.filterText,
              filter === ProblemStatus.IN_PROGRESS && styles.activeFilterText,
            ]}
          >
            In Progress
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === ProblemStatus.RESOLVED && styles.activeFilter]}
          onPress={() => setFilter(ProblemStatus.RESOLVED)}
        >
          <Text
            style={[
              styles.filterText,
              filter === ProblemStatus.RESOLVED && styles.activeFilterText,
            ]}
          >
            Resolved
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Problems List */}
      <FlatList
        data={filteredProblems}
        renderItem={renderProblemCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkbox-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No problems found</Text>
            <Text style={styles.emptySubtext}>Your village is doing great!</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={colors.primary.contrast} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  activeFilter: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.primary,
    fontWeight: typography.h5.fontWeight as any,
  },
  activeFilterText: {
    color: colors.primary.contrast,
  },
  listContent: {
    padding: spacing.md,
  },
  problemCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
  },
  villageName: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  severityText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary.contrast,
    fontWeight: typography.h5.fontWeight as any,
  },
  problemContent: {
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  problemTitle: {
    flex: 1,
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
  },
  problemDescription: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    lineHeight: typography.body2.lineHeight,
    marginBottom: spacing.sm,
  },
  problemImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  problemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.h4.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.body1.fontSize,
    color: colors.text.disabled,
    marginTop: spacing.xs,
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
    boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.3)',
    elevation: 8,
  },
});
