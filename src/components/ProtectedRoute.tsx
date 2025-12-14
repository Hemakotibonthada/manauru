/**
 * Protected Route Component
 * Wrapper component for routes that require specific permissions
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../styles/theme';
import { useAuth } from '../hooks/useAuth';
import { usePermission, useAnyPermission, useAllPermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requireAnyPermission?: string[];
  requireAllPermissions?: string[];
  fallbackRoute?: string;
  showAccessDenied?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requireAnyPermission,
  requireAllPermissions,
  fallbackRoute = 'Home',
  showAccessDenied = true,
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const hasSinglePermission = usePermission(requiredPermission || '');
  const hasAnyPerms = useAnyPermission(requireAnyPermission || []);
  const hasAllPerms = useAllPermissions(requireAllPermissions || []);
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [user, hasSinglePermission, hasAnyPerms, hasAllPerms]);

  const checkAccess = () => {
    if (!user) {
      setHasAccess(false);
      setChecking(false);
      if (!showAccessDenied) {
        navigation.navigate(fallbackRoute as never);
      }
      return;
    }

    let access = true;

    if (requiredPermission) {
      access = hasSinglePermission;
    }

    if (requireAnyPermission && requireAnyPermission.length > 0) {
      access = access && hasAnyPerms;
    }

    if (requireAllPermissions && requireAllPermissions.length > 0) {
      access = access && hasAllPerms;
    }

    setHasAccess(access);
    setChecking(false);

    if (!access && !showAccessDenied) {
      navigation.navigate(fallbackRoute as never);
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (!hasAccess) {
    if (!showAccessDenied) {
      return null;
    }

    return (
      <View style={styles.container}>
        <Ionicons name="lock-closed" size={64} color={colors.error.main} />
        <Text style={styles.deniedTitle}>Access Denied</Text>
        <Text style={styles.deniedText}>
          You don't have permission to access this section. {'\n'}
          Contact an administrator if you believe this is an error.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  deniedTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  deniedText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
