/**
 * Settings Screen
 * App settings and user preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import { PermissionService } from '../services/permissionService';
import AuthService from '../services/authService';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { isDark, themeMode, setThemeMode } = useTheme();
  const colors = getThemedColors(isDark);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    if (user) {
      setHasAdminAccess(PermissionService.canAccessAdmin(user.role));
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              navigation.replace('Login');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available soon');
          },
        },
      ]
    );
  };

  const styles = createStyles(colors);

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={24} color={colors.primary.main} />
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (
        onPress && <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Admin Section - Only for users with admin access */}
        {hasAdminAccess && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administration</Text>
            {renderSettingItem(
              'shield-outline',
              'Admin Dashboard',
              'Manage users, content, and settings',
              () => navigation.navigate('AdminDashboard')
            )}
          </View>
        )}

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {renderSettingItem(
          'person-outline',
          'Edit Profile',
          'Update your profile information',
          () => navigation.navigate('Profile')
        )}
        {renderSettingItem(
          'lock-closed-outline',
          'Privacy',
          'Control who can see your content',
          () => Alert.alert('Coming Soon', 'Privacy settings coming soon')
        )}
        {renderSettingItem(
          'shield-checkmark-outline',
          'Security',
          'Password and authentication',
          () => Alert.alert('Coming Soon', 'Security settings coming soon')
        )}
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {renderSettingItem(
          'notifications-outline',
          'Notifications',
          'Manage notification preferences',
          undefined,
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.text.disabled, true: colors.primary.light }}
            thumbColor={notifications ? colors.primary.main : colors.background.paper}
          />
        )}
        {renderSettingItem(
          'moon-outline',
          'Dark Mode',
          'Toggle dark mode',
          undefined,
          <Switch
            value={themeMode === 'dark'}
            onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
            trackColor={{ false: colors.text.disabled, true: colors.primary.light }}
            thumbColor={themeMode === 'dark' ? colors.primary.main : colors.background.paper}
          />
        )}
        {renderSettingItem(
          'location-outline',
          'Location Sharing',
          'Share your location for nearby features',
          undefined,
          <Switch
            value={locationSharing}
            onValueChange={setLocationSharing}
            trackColor={{ false: colors.text.disabled, true: colors.primary.light }}
            thumbColor={locationSharing ? colors.primary.main : colors.background.paper}
          />
        )}
        {renderSettingItem(
          'language-outline',
          'Language',
          'English',
          () => Alert.alert('Coming Soon', 'Language selection coming soon')
        )}
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        {renderSettingItem(
          'help-circle-outline',
          'Help Center',
          'Get help and support',
          () => Alert.alert('Coming Soon', 'Help center coming soon')
        )}
        {renderSettingItem(
          'document-text-outline',
          'Terms & Conditions',
          'Read our terms and conditions',
          () => Alert.alert('Coming Soon', 'Terms & conditions coming soon')
        )}
        {renderSettingItem(
          'shield-outline',
          'Privacy Policy',
          'Read our privacy policy',
          () => Alert.alert('Coming Soon', 'Privacy policy coming soon')
        )}
        {renderSettingItem(
          'information-circle-outline',
          'About',
          'Version 1.0.0',
          () => Alert.alert('Mana Uru', 'Version 1.0.0\n\nA platform connecting village communities')
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.dangerItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.error.main} />
          <Text style={styles.dangerText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={24} color={colors.error.main} />
          <Text style={styles.dangerText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with ❤️ for Village Communities
        </Text>
      </View>
    </ScrollView>
    </View>
  );
};

// Dynamic styles - recreated when theme changes
const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
  section: {
    marginTop: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dangerText: {
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.error.main,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.disabled,
  },
});
