/**
 * Fundraisers Screen
 * Browse and manage village fundraisers
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
import { useAuth } from '../hooks/useAuth';
import { Fundraiser, FundraiserCategory, FundraiserStatus } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import moment from 'moment';

interface FundraisersScreenProps {
  navigation: any;
}

export const FundraisersScreen: React.FC<FundraisersScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    loadFundraisers();
  }, [filter]);

  const loadFundraisers = async () => {
    try {
      setLoading(true);
      // TODO: Implement fundraiser service
      // Mock data for now
      const mockFundraisers: Fundraiser[]= [
        {
          id: '1',
          userId: user?.id || '',
          userName: user?.displayName || '',
          title: 'School Building Renovation',
          description: 'Help us renovate the village school building',
          goalAmount: 500000,
          raisedAmount: 325000,
          currency: 'INR',
          category: FundraiserCategory.EDUCATION,
          media: [],
          contributors: [],
          status: FundraiserStatus.ACTIVE,
          startDate: { toDate: () => new Date(Date.now() - 86400000 * 30) } as any,
          endDate: { toDate: () => new Date(Date.now() + 86400000 * 30) } as any,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
          verified: true,
        },
        {
          id: '2',
          userId: user?.id || '',
          userName: user?.displayName || '',
          title: 'Water Tank Installation',
          description: 'Installing a new water tank for the village',
          goalAmount: 200000,
          raisedAmount: 180000,
          currency: 'INR',
          category: FundraiserCategory.INFRASTRUCTURE,
          media: [],
          contributors: [],
          status: FundraiserStatus.ACTIVE,
          startDate: { toDate: () => new Date(Date.now() - 86400000 * 15) } as any,
          endDate: { toDate: () => new Date(Date.now() + 86400000 * 15) } as any,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
          verified: true,
        },
      ];
      setFundraisers(mockFundraisers);
    } catch (error) {
      console.error('Error loading fundraisers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFundraisers();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: FundraiserCategory) => {
    switch (category) {
      case FundraiserCategory.EDUCATION:
        return 'school';
      case FundraiserCategory.HEALTHCARE:
        return 'medical';
      case FundraiserCategory.INFRASTRUCTURE:
        return 'construct';
      case FundraiserCategory.EMERGENCY:
        return 'alert-circle';
      case FundraiserCategory.CULTURAL:
        return 'musical-notes';
      case FundraiserCategory.ENVIRONMENT:
        return 'leaf';
      default:
        return 'cash';
    }
  };

  const getCategoryColor = (category: FundraiserCategory) => {
    switch (category) {
      case FundraiserCategory.EDUCATION:
        return colors.info.main;
      case FundraiserCategory.HEALTHCARE:
        return colors.error.main;
      case FundraiserCategory.EMERGENCY:
        return colors.warning.main;
      case FundraiserCategory.ENVIRONMENT:
        return colors.success.main;
      default:
        return colors.primary.main;
    }
  };

  const renderFundraiser = ({ item }: { item: Fundraiser }) => {
    const progress = (item.raisedAmount / item.goalAmount) * 100;
    const categoryColor = getCategoryColor(item.category);
    const daysLeft = moment(item.endDate.toDate()).diff(moment(), 'days');

    return (
      <TouchableOpacity
        style={styles.fundraiserCard}
        onPress={() => navigation.navigate('FundraiserDetail', { fundraiserId: item.id })}
      >
        {item.media && item.media.length > 0 ? (
          <Image source={{ uri: item.media[0].url }} style={styles.fundraiserImage} />
        ) : (
          <View style={[styles.fundraiserImagePlaceholder, { backgroundColor: categoryColor + '20' }]}>
            <Ionicons name={getCategoryIcon(item.category) as any} size={48} color={categoryColor} />
          </View>
        )}

        <View style={styles.fundraiserContent}>
          <View style={styles.fundraiserHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
              <Ionicons name={getCategoryIcon(item.category) as any} size={16} color={categoryColor} />
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {item.category}
              </Text>
            </View>
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={16} color={colors.success.main} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.fundraiserTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.fundraiserDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress, 100)}%`, backgroundColor: categoryColor },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>

          {/* Amount Info */}
          <View style={styles.amountContainer}>
            <View>
              <Text style={styles.raisedAmount}>
                ₹{item.raisedAmount.toLocaleString()}
              </Text>
              <Text style={styles.amountLabel}>raised</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.goalAmount}>
                ₹{item.goalAmount.toLocaleString()}
              </Text>
              <Text style={styles.amountLabel}>goal</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.daysLeft}>
                {daysLeft > 0 ? `${daysLeft}` : '0'}
              </Text>
              <Text style={styles.amountLabel}>days left</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.fundraiserFooter}>
            <View style={styles.contributorInfo}>
              <Ionicons name="people" size={16} color={colors.text.secondary} />
              <Text style={styles.contributorCount}>
                {item.contributors.length} contributors
              </Text>
            </View>
            <TouchableOpacity style={styles.donateButton}>
              <Text style={styles.donateButtonText}>Donate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.activeFilterTab]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.activeFilterTab]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fundraisers List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={fundraisers}
          renderItem={renderFundraiser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={64} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No fundraisers found</Text>
            </View>
          }
        />
      )}

      {/* Create Fundraiser FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateFundraiser')}
      >
        <Ionicons name="add" size={28} color={colors.primary.contrast} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.default,
  },
  activeFilterTab: {
    backgroundColor: colors.primary.main,
  },
  filterText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.h5.fontWeight as any,
  },
  activeFilterText: {
    color: colors.primary.contrast,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  fundraiserCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  fundraiserImage: {
    width: '100%',
    height: 150,
  },
  fundraiserImagePlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fundraiserContent: {
    padding: spacing.md,
  },
  fundraiserHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  categoryText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    textTransform: 'capitalize',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: typography.caption.fontSize,
    color: colors.success.main,
    fontWeight: typography.h5.fontWeight as any,
  },
  fundraiserTitle: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  fundraiserDescription: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.default,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.h5.fontWeight as any,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.sm,
  },
  raisedAmount: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.success.main,
  },
  goalAmount: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
  },
  daysLeft: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.warning.main,
  },
  amountLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.divider,
  },
  fundraiserFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contributorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contributorCount: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  donateButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  donateButtonText: {
    color: colors.primary.contrast,
    fontSize: typography.body2.fontSize,
    fontWeight: typography.h5.fontWeight as any,
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
    ...shadows.lg,
  },
});
