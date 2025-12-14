/**
 * usePermissions Hook
 * Custom hook for checking user permissions
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { PermissionService } from '../services/permissionService';
import { SmartDevice } from '../types';

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(permission: string): boolean {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (user) {
      setHasAccess(PermissionService.hasPermission(user.role, permission));
    } else {
      setHasAccess(false);
    }
  }, [user, permission]);

  return hasAccess;
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (user) {
      setHasAccess(permissions.some(p => PermissionService.hasPermission(user.role, p)));
    } else {
      setHasAccess(false);
    }
  }, [user, permissions]);

  return hasAccess;
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useAllPermissions(permissions: string[]): boolean {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (user) {
      setHasAccess(permissions.every(p => PermissionService.hasPermission(user.role, p)));
    } else {
      setHasAccess(false);
    }
  }, [user, permissions]);

  return hasAccess;
}

/**
 * Hook to check if user can control a specific device
 */
export function useCanControlDevice(device: SmartDevice | null): boolean {
  const { user } = useAuth();
  const [canControl, setCanControl] = useState(false);

  useEffect(() => {
    if (user && device) {
      setCanControl(PermissionService.canControlDevice(user.role, user.id, device.controllableBy));
    } else {
      setCanControl(false);
    }
  }, [user, device]);

  return canControl;
}

/**
 * Hook to check if user can access admin panel
 */
export function useCanAccessAdmin(): boolean {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (user) {
      setHasAccess(PermissionService.canAccessAdmin(user.role));
    } else {
      setHasAccess(false);
    }
  }, [user]);

  return hasAccess;
}

/**
 * Hook to check if user can manage roles
 */
export function useCanManageRoles(): boolean {
  const { user } = useAuth();
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    if (user) {
      setCanManage(PermissionService.canManageRoles(user.role));
    } else {
      setCanManage(false);
    }
  }, [user]);

  return canManage;
}

/**
 * Hook to get all permission checks at once
 */
export function usePermissions() {
  const { user } = useAuth();

  return {
    hasPermission: (permission: string) => 
      user ? PermissionService.hasPermission(user.role, permission) : false,
    hasAnyPermission: (permissions: string[]) => 
      user ? permissions.some(p => PermissionService.hasPermission(user.role, p)) : false,
    hasAllPermissions: (permissions: string[]) => 
      user ? permissions.every(p => PermissionService.hasPermission(user.role, p)) : false,
    canControlDevice: (device: SmartDevice) => 
      user ? PermissionService.canControlDevice(user.role, user.id, device.controllableBy) : false,
    canAccessAdmin: () => 
      user ? PermissionService.canAccessAdmin(user.role) : false,
    canManageRoles: () => 
      user ? PermissionService.canManageRoles(user.role) : false,
  };
}
