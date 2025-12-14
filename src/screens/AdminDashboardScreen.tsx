/**
 * Admin Dashboard Screen
 * Main admin panel with statistics and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { useAuth } from '../hooks/useAuth';
import { AdminService } from '../services/adminService';
import { PermissionService } from '../services/permissionService';
import { AdminStats, AuditLog } from '../types';
import moment from 'moment';

type NavigationProp = StackNavigationProp<any>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (!user || !PermissionService.canAccessAdmin(user.role)) {
      Alert.alert('Access Denied', 'You do not have permission to access this page');
      navigation.goBack();
      return;
    }
    loadStats();
  }, []);
  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getAdminStats();
      setStats(data);
      
      // Load recent activity
      const logs = await AdminService.getAuditLogs(10);
      setRecentActivity(logs);
    } catch (error) {
      console.error('Error loading stats:', error);
      Alert.alert('Error', 'Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const adminActions = [
    {
      title: 'User Management',
      icon: 'people',
      color: colors.primary.main,
      route: 'UserManagement',
      permission: PermissionService.PERMISSIONS.VIEW_USERS,
    },
    {
      title: 'Role Management',
      icon: 'shield-checkmark',
      color: '#9B59B6',
      route: 'RoleManagement',
      permission: PermissionService.PERMISSIONS.ASSIGN_ROLES,
    },
    {
      title: 'Content Moderation',
      icon: 'warning',
      color: '#E74C3C',
      route: 'ContentModeration',
      permission: PermissionService.PERMISSIONS.VIEW_REPORTS,
    },
    {
      title: 'Smart Things',
      icon: 'bulb',
      color: '#F39C12',
      route: 'SmartThings',
      permission: PermissionService.PERMISSIONS.VIEW_DEVICES,
    },
    {
      title: 'Village Management',
      icon: 'location',
      color: '#27AE60',
      route: 'VillageManagement',
      permission: PermissionService.PERMISSIONS.EDIT_VILLAGE,
    },
    {
      title: 'Analytics',
      icon: 'stats-chart',
      color: '#3498DB',
      route: 'Analytics',
      permission: PermissionService.PERMISSIONS.VIEW_ANALYTICS,
    },
    {
      title: 'Audit Logs',
      icon: 'document-text',
      color: '#95A5A6',
      route: 'AuditLogs',
      permission: PermissionService.PERMISSIONS.VIEW_AUDIT_LOGS,
    },
    {
      title: 'Settings',
      icon: 'settings',
      color: '#34495E',
      route: 'AdminSettings',
      permission: PermissionService.PERMISSIONS.MANAGE_SETTINGS,
    },
  ];

  const availableActions = adminActions.filter((action) =>
    PermissionService.hasPermission(user?.role!, action.permission)
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.displayName}</Text>
          <Text style={styles.subtitle}>Admin Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle" size={40} color={colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon="people"
              color={colors.primary.main}
              subtext={`${stats.newUsersToday} new today`}
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon="pulse"
              color="#27AE60"
              subtext="Last 7 days"
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title="Villages"
              value={stats.totalVillages}
              icon="location"
              color="#3498DB"
            />
            <StatCard
              title="Posts"
              value={stats.totalPosts}
              icon="newspaper"
              color="#9B59B6"
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title="Groups"
              value={stats.totalGroups}
              icon="people-circle"
              color="#F39C12"
            />
            <StatCard
              title="Reports"
              value={stats.reportedContent}
              icon="warning"
              color="#E74C3C"
              alert={stats.reportedContent > 0}
            />
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {availableActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.route)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AuditLogs')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentActivity.length === 0 ? (
          <View style={styles.activityCard}>
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        ) : (
          recentActivity.map((log) => (
            <View key={log.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons 
                  name={getActivityIcon(log.action)} 
                  size={20} 
                  color={colors.primary.main} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityUser}>{log.userName}</Text>
                <Text style={styles.activityAction}>{formatAction(log.action, log.targetType)}</Text>
                <Text style={styles.activityTime}>
                  {moment(log.timestamp.toDate()).fromNow()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const getActivityIcon = (action: string): any => {
  const iconMap: Record<string, any> = {
    'CREATE': 'add-circle',
    'UPDATE': 'create',
    'DELETE': 'trash',
    'DELETE_CONTENT': 'trash-bin',
    'ASSIGN_ROLE': 'shield-checkmark',
    'REMOVE_ROLE': 'shield-outline',
    'BAN_USER': 'ban',
    'UNBAN_USER': 'checkmark-circle',
    'UPDATE_SETTINGS': 'settings',
    'APPROVE': 'checkmark-done',
    'REJECT': 'close-circle',
  };
  return iconMap[action] || 'information-circle';
};

const formatAction = (action: string, targetType: string): string => {
  const actionText = action.toLowerCase().replace(/_/g, ' ');
  return `${actionText} ${targetType.toLowerCase()}`;
};

const StatCard = ({
  title,
  value,
  icon,
  color,
  subtext,
  alert,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  subtext?: string;
  alert?: boolean;
}) => (
  <View style={[styles.statCard, alert && styles.statCardAlert]}>
    <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
    </View>
  </View>
);

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.paper,
  },
  greeting: {
    ...typography.h2,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  profileButton: {
    padding: spacing.xs,
  },
  statsContainer: {
    padding: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardAlert: {
    borderWidth: 2,
    borderColor: colors.error.main,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    ...typography.h3,
    color: colors.text.primary,
  },
  statTitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    marginTop: spacing.xs / 2,
  },
  section: {
    padding: spacing.lg,
    paddingTop: 0,
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
  viewAllText: {
    ...typography.body2,
    color: colors.primary.main,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    ...typography.body2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.text.primary,
  },
  activityAction: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  activityTime: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
