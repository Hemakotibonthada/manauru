/**
 * Content Moderation Screen
 * Manage reports, flagged content, and content moderation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { PermissionService } from '../services/permissionService';
import { AdminService } from '../services/adminService';
import { Report } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface ContentModerationScreenProps {
  navigation: any;
}

export const ContentModerationScreen: React.FC<ContentModerationScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Report['status'] | 'ALL'>('ALL');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!user || !PermissionService.canAccessAdmin(user.role)) {
      Alert.alert('Access Denied', 'You do not have permission to access this page.');
      navigation.goBack();
      return;
    }

    if (!PermissionService.hasPermission(user.role, 'moderate_content')) {
      Alert.alert('Access Denied', 'You do not have permission to moderate content.');
      navigation.goBack();
      return;
    }

    loadReports();
  }, [user]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const reportsData = await AdminService.getReports(filter === 'ALL' ? undefined : filter);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (reportId: string, status: Report['status'], action?: string) => {
    try {
      if (!user) return;
      await AdminService.updateReport(reportId, status, action || 'No action taken', user.id);
      await loadReports();
      setModalVisible(false);
      Alert.alert('Success', 'Report updated successfully');
    } catch (error) {
      console.error('Error updating report:', error);
      Alert.alert('Error', 'Failed to update report');
    }
  };

  const showReportDetail = (report: Report) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const getFilteredReports = () => {
    if (filter === 'ALL') return reports;
    return reports.filter((report) => report.status === filter);
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning.main;
      case 'reviewed':
        return colors.info.main;
      case 'resolved':
        return colors.success.main;
      case 'dismissed':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'spam':
        return 'warning-outline';
      case 'harassment':
        return 'alert-circle-outline';
      case 'inappropriate':
        return 'ban-outline';
      case 'misinformation':
        return 'information-circle-outline';
      case 'violence':
        return 'skull-outline';
      case 'hate_speech':
        return 'close-circle-outline';
      default:
        return 'flag-outline';
    }
  };

  const renderFilterButton = (label: string, value: Report['status'] | 'ALL') => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity style={styles.reportCard} onPress={() => showReportDetail(item)}>
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          <Ionicons
            name={getReasonIcon(item.reason) as any}
            size={24}
            color={colors.error.main}
          />
          <View style={styles.reportHeaderInfo}>
            <Text style={styles.reportReason}>{item.reason}</Text>
            <Text style={styles.reportDate}>
              {item.createdAt.toDate().toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.reportContent}>Type: {item.contentType}</Text>

      {item.description && (
        <Text style={styles.reportDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.reportFooter}>
        <Text style={styles.reportedBy}>Reported by User #{item.reportedBy.slice(0, 8)}</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      </View>
    </TouchableOpacity>
  );

  const renderReportModal = () => {
    if (!selectedReport) return null;

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Reason</Text>
                <View style={styles.detailValueRow}>
                  <Ionicons
                    name={getReasonIcon(selectedReport.reason) as any}
                    size={20}
                    color={colors.error.main}
                  />
                  <Text style={styles.detailValue}>{selectedReport.reason}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedReport.status) + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusColor(selectedReport.status) }]}>
                    {selectedReport.status}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{selectedReport.contentType}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Content ID</Text>
                <Text style={styles.detailValue}>{selectedReport.contentId}</Text>
              </View>

              {selectedReport.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedReport.description}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Reported By</Text>
                <Text style={styles.detailValue}>User #{selectedReport.reportedBy}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Reported At</Text>
                <Text style={styles.detailValue}>
                  {selectedReport.createdAt.toDate().toLocaleString()}
                </Text>
              </View>

              {selectedReport.reviewedBy && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Reviewed By</Text>
                    <Text style={styles.detailValue}>User #{selectedReport.reviewedBy}</Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Reviewed At</Text>
                    <Text style={styles.detailValue}>
                      {selectedReport.reviewedAt
                        ? selectedReport.reviewedAt.toDate().toLocaleString()
                        : 'N/A'}
                    </Text>
                  </View>
                </>
              )}

              {selectedReport.resolution && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Action Taken</Text>
                  <Text style={styles.detailValue}>{selectedReport.resolution}</Text>
                </View>
              )}
            </ScrollView>

            {selectedReport.status === 'pending' && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.reviewButton]}
                  onPress={() =>
                    handleUpdateStatus(selectedReport.id, 'reviewed')
                  }
                >
                  <Ionicons name="eye-outline" size={20} color={colors.background.default} />
                  <Text style={styles.actionButtonText}>Review</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.dismissButton]}
                  onPress={() =>
                    handleUpdateStatus(selectedReport.id, 'dismissed', 'No action required')
                  }
                >
                  <Ionicons name="close-outline" size={20} color={colors.background.default} />
                  <Text style={styles.actionButtonText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedReport.status === 'reviewed' && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.resolveButton]}
                  onPress={() => {
                    Alert.prompt(
                      'Resolve Report',
                      'Enter action taken:',
                      (action) => {
                        if (action) {
                          handleUpdateStatus(selectedReport.id, 'resolved', action);
                        }
                      }
                    );
                  }}
                >
                  <Ionicons name="checkmark-outline" size={20} color={colors.background.default} />
                  <Text style={styles.actionButtonText}>Resolve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.dismissButton]}
                  onPress={() =>
                    handleUpdateStatus(selectedReport.id, 'dismissed', 'Invalid report')
                  }
                >
                  <Ionicons name="close-outline" size={20} color={colors.background.default} />
                  <Text style={styles.actionButtonText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  const filteredReports = getFilteredReports();

  return (
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{reports.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning.main }]}>
            {reports.filter((r) => r.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.info.main }]}>
            {reports.filter((r) => r.status === 'reviewed').length}
          </Text>
          <Text style={styles.statLabel}>Reviewing</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success.main }]}>
            {reports.filter((r) => r.status === 'resolved').length}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {renderFilterButton('All', 'ALL')}
        {renderFilterButton('Pending', 'pending')}
        {renderFilterButton('Reviewing', 'reviewed')}
        {renderFilterButton('Resolved', 'resolved')}
        {renderFilterButton('Dismissed', 'dismissed')}
      </ScrollView>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.success.main} />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'ALL'
                ? 'There are no reports at this time'
                : `No ${filter.toLowerCase()} reports`}
            </Text>
          </View>
        }
      />

      {renderReportModal()}
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
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h5,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  filterContainer: {
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  filterButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterButtonText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  filterButtonTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  listContainer: {
    padding: spacing.md,
  },
  reportCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportHeaderInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  reportReason: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  reportDate: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reportContent: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  reportDescription: {
    ...typography.body2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  reportedBy: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.h6,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    ...typography.h6,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  modalBody: {
    padding: spacing.md,
  },
  detailSection: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    ...typography.body1,
    color: colors.text.primary,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  reviewButton: {
    backgroundColor: colors.info.main,
  },
  dismissButton: {
    backgroundColor: colors.text.secondary,
  },
  resolveButton: {
    backgroundColor: colors.success.main,
  },
});

export default ContentModerationScreen;
