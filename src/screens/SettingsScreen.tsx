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
import { getAuth, deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
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

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently delete all your data including posts, comments, and messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!user?.id) return;
              
              // Delete user data from Firestore
              await deleteDoc(doc(db, 'users', user.id));
              
              // Delete from Firebase Auth
              const auth = getAuth();
              if (auth.currentUser) {
                await deleteUser(auth.currentUser);
              }
              
              Alert.alert('Success', 'Your account has been deleted', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
              ]);
            } catch (error: any) {
              console.error('Error deleting account:', error);
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Re-authentication Required',
                  'Please log out and log in again, then try deleting your account.'
                );
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            }
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
          () => {
            Alert.alert(
              'Privacy Settings',
              'Choose your privacy preferences',
              [
                {
                  text: 'Post Visibility',
                  onPress: () => Alert.alert(
                    'Default Post Visibility',
                    'Choose who can see your posts by default',
                    [
                      { text: 'Public', onPress: () => console.log('Set to Public') },
                      { text: 'Village Only', onPress: () => console.log('Set to Village') },
                      { text: 'Followers Only', onPress: () => console.log('Set to Followers') },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  )
                },
                {
                  text: 'Profile Visibility',
                  onPress: () => Alert.alert(
                    'Profile Visibility',
                    'Choose who can see your profile',
                    [
                      { text: 'Everyone', onPress: () => console.log('Public profile') },
                      { text: 'Village Members', onPress: () => console.log('Village only') },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  )
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
        )}
        {renderSettingItem(
          'shield-checkmark-outline',
          'Security',
          'Password and authentication',
          () => {
            Alert.alert(
              'Security Settings',
              'Manage your account security',
              [
                {
                  text: 'Change Password',
                  onPress: () => {
                    const auth = getAuth();
                    if (auth.currentUser?.email) {
                      sendPasswordResetEmail(auth, auth.currentUser.email)
                        .then(() => {
                          Alert.alert(
                            'Password Reset Email Sent',
                            'Check your email for password reset instructions.'
                          );
                        })
                        .catch((error: any) => {
                          Alert.alert('Error', 'Failed to send password reset email.');
                        });
                    }
                  }
                },
                {
                  text: 'Two-Factor Authentication',
                  onPress: () => Alert.alert('Coming Soon', '2FA will be available soon')
                },
                {
                  text: 'Active Sessions',
                  onPress: () => Alert.alert('Active Sessions', 'You are currently logged in on 1 device')
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }
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
    paddingBottom: spacing.xl * 4,
    flexGrow: 1,
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
