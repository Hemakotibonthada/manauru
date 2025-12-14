/**
 * Permission Service
 * Role-based access control and permissions management
 */

import { UserRole, PermissionCategory } from '../types';

export class PermissionService {
  // Define all available permissions
  static readonly PERMISSIONS = {
    // User Management
    VIEW_USERS: 'view_users',
    EDIT_USERS: 'edit_users',
    DELETE_USERS: 'delete_users',
    ASSIGN_ROLES: 'assign_roles',
    BAN_USERS: 'ban_users',

    // Content Moderation
    VIEW_REPORTS: 'view_reports',
    MODERATE_CONTENT: 'moderate_content',
    DELETE_CONTENT: 'delete_content',
    APPROVE_CONTENT: 'approve_content',

    // Village Management
    CREATE_VILLAGE: 'create_village',
    EDIT_VILLAGE: 'edit_village',
    DELETE_VILLAGE: 'delete_village',
    MANAGE_VILLAGE_MEMBERS: 'manage_village_members',

    // Smart Things
    VIEW_DEVICES: 'view_devices',
    CONTROL_DEVICES: 'control_devices',
    ADD_DEVICES: 'add_devices',
    REMOVE_DEVICES: 'remove_devices',
    CONFIGURE_DEVICES: 'configure_devices',

    // Analytics
    VIEW_ANALYTICS: 'view_analytics',
    EXPORT_DATA: 'export_data',

    // System Settings
    MANAGE_SETTINGS: 'manage_settings',
    VIEW_AUDIT_LOGS: 'view_audit_logs',
    MANAGE_PERMISSIONS: 'manage_permissions',
  };

  // Role-based permissions mapping
  static readonly ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: [
      // Full access to everything
      ...Object.values(PermissionService.PERMISSIONS),
    ],
    [UserRole.MODERATOR]: [
      PermissionService.PERMISSIONS.VIEW_USERS,
      PermissionService.PERMISSIONS.VIEW_REPORTS,
      PermissionService.PERMISSIONS.MODERATE_CONTENT,
      PermissionService.PERMISSIONS.DELETE_CONTENT,
      PermissionService.PERMISSIONS.APPROVE_CONTENT,
      PermissionService.PERMISSIONS.VIEW_ANALYTICS,
      PermissionService.PERMISSIONS.VIEW_AUDIT_LOGS,
    ],
    [UserRole.VILLAGE_HEAD]: [
      PermissionService.PERMISSIONS.VIEW_USERS,
      PermissionService.PERMISSIONS.EDIT_VILLAGE,
      PermissionService.PERMISSIONS.MANAGE_VILLAGE_MEMBERS,
      PermissionService.PERMISSIONS.VIEW_DEVICES,
      PermissionService.PERMISSIONS.CONTROL_DEVICES,
      PermissionService.PERMISSIONS.VIEW_ANALYTICS,
      PermissionService.PERMISSIONS.MODERATE_CONTENT,
    ],
    [UserRole.USER]: [
      PermissionService.PERMISSIONS.VIEW_DEVICES,
    ],
  };

  /**
   * Check if a user has a specific permission
   */
  static hasPermission(userRole: UserRole, permission: string): boolean {
    const rolePermissions = this.ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if a user has any of the specified permissions
   */
  static hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(userRole, permission));
  }

  /**
   * Check if a user has all of the specified permissions
   */
  static hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(userRole, permission));
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: UserRole): string[] {
    return this.ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if user can control a specific device
   */
  static canControlDevice(
    userRole: UserRole,
    userId: string,
    deviceControllableBy: string[]
  ): boolean {
    // Admins can control everything
    if (userRole === UserRole.ADMIN) return true;

    // Check if user is in the controllable list
    if (deviceControllableBy.includes(userId)) return true;

    // Check if user's role is in the controllable list
    if (deviceControllableBy.includes(userRole)) return true;

    // Check if user has device control permission
    return this.hasPermission(userRole, this.PERMISSIONS.CONTROL_DEVICES);
  }

  /**
   * Check if user can access admin panel
   */
  static canAccessAdmin(userRole: UserRole): boolean {
    return [UserRole.ADMIN, UserRole.MODERATOR, UserRole.VILLAGE_HEAD].includes(userRole);
  }

  /**
   * Check if user can manage roles
   */
  static canManageRoles(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN;
  }

  /**
   * Get permission categories for a role
   */
  static getPermissionsByCategory(role: UserRole): Record<PermissionCategory, string[]> {
    const permissions = this.getRolePermissions(role);
    
    const categorized: Record<PermissionCategory, string[]> = {
      [PermissionCategory.USER_MANAGEMENT]: [],
      [PermissionCategory.CONTENT_MODERATION]: [],
      [PermissionCategory.VILLAGE_MANAGEMENT]: [],
      [PermissionCategory.SMART_THINGS]: [],
      [PermissionCategory.ANALYTICS]: [],
      [PermissionCategory.SYSTEM_SETTINGS]: [],
    };

    permissions.forEach((perm) => {
      if (perm.includes('user') || perm.includes('role') || perm.includes('ban')) {
        categorized[PermissionCategory.USER_MANAGEMENT].push(perm);
      } else if (perm.includes('report') || perm.includes('moderate') || perm.includes('approve')) {
        categorized[PermissionCategory.CONTENT_MODERATION].push(perm);
      } else if (perm.includes('village')) {
        categorized[PermissionCategory.VILLAGE_MANAGEMENT].push(perm);
      } else if (perm.includes('device')) {
        categorized[PermissionCategory.SMART_THINGS].push(perm);
      } else if (perm.includes('analytics') || perm.includes('export')) {
        categorized[PermissionCategory.ANALYTICS].push(perm);
      } else {
        categorized[PermissionCategory.SYSTEM_SETTINGS].push(perm);
      }
    });

    return categorized;
  }
}
