/**
 * Role Management Screen
 * Manage user roles and permissions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { useAuth } from '../hooks/useAuth';
import { AdminService } from '../services/adminService';
import { PermissionService } from '../services/permissionService';
import { User, UserRole } from '../types';

export default function RoleManagementScreen() {
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (!currentUser || !PermissionService.canManageRoles(currentUser.role)) {
      Alert.alert('Access Denied', 'You do not have permission to manage roles');
      navigation.goBack();
      return;
    }
    loadUsers();
  }, [filterRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const filters = filterRole !== 'all' ? { role: filterRole } : undefined;
      const data = await AdminService.getUsers(filters, 100);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    Alert.alert(
      'Change User Role',
      `Change ${user.displayName}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await AdminService.updateUserRole(user.id, newRole, currentUser!.id);
              setShowRoleModal(false);
              setSelectedUser(null);
              Alert.alert('Success', 'User role updated successfully');
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to update user role');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((user) =>
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        setSelectedUser(item);
        setShowRoleModal(true);
      }}
    >
      {item.photoURL ? (
        <Image
          source={{ uri: item.photoURL }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={24} color="#94a3b8" />
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.displayName}</Text>
          {item.verified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary.main} />
          )}
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.roleContainer}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {item.role.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
  );

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '#E74C3C';
      case UserRole.MODERATOR:
        return '#9B59B6';
      case UserRole.VILLAGE_HEAD:
        return '#3498DB';
      default:
        return '#95A5A6';
    }
  };

  const roles = [UserRole.USER, UserRole.VILLAGE_HEAD, UserRole.MODERATOR, UserRole.ADMIN];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Role Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Role Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={['all', ...roles]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterRole === item && styles.activeFilterChip,
              ]}
              onPress={() => setFilterRole(item as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterRole === item && styles.activeFilterText,
                ]}
              >
                {item === 'all' ? 'All' : item.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Role</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <>
                <View style={styles.userPreview}>
                  {selectedUser.photoURL ? (
                    <Image
                      source={{ uri: selectedUser.photoURL }}
                      style={styles.modalAvatar}
                    />
                  ) : (
                    <View style={[styles.modalAvatar, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="person" size={24} color="#94a3b8" />
                    </View>
                  )}
                  <View>
                    <Text style={styles.modalUserName}>{selectedUser.displayName}</Text>
                    <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                  </View>
                </View>

                <Text style={styles.sectionLabel}>Select New Role:</Text>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      selectedUser.role === role && styles.currentRoleOption,
                    ]}
                    onPress={() => handleChangeRole(selectedUser, role)}
                    disabled={selectedUser.role === role}
                  >
                    <View style={[styles.roleIconContainer, { backgroundColor: getRoleColor(role) + '20' }]}>
                      <Ionicons name="shield-checkmark" size={24} color={getRoleColor(role)} />
                    </View>
                    <View style={styles.roleOptionContent}>
                      <Text style={styles.roleOptionTitle}>{role.replace('_', ' ').toUpperCase()}</Text>
                      <Text style={styles.roleOptionDesc}>{getRoleDescription(role)}</Text>
                    </View>
                    {selectedUser.role === role && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getRoleDescription = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Full access to all features and settings';
    case UserRole.MODERATOR:
      return 'Can moderate content and manage reports';
    case UserRole.VILLAGE_HEAD:
      return 'Can manage village and control devices';
    case UserRole.USER:
      return 'Standard user with basic permissions';
    default:
      return '';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.paper,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
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
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filtersList: {
    paddingHorizontal: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background.paper,
    marginRight: spacing.sm,
  },
  activeFilterChip: {
    backgroundColor: colors.primary.main,
  },
  filterText: {
    ...typography.body2,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  activeFilterText: {
    color: colors.background.default,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  userName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  userEmail: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  roleContainer: {
    flexDirection: 'row',
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  roleText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  userPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  modalUserName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalUserEmail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  sectionLabel: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  currentRoleOption: {
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionTitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  roleOptionDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
});
