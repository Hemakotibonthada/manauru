/**
 * User Profile Screen
 * Detailed view of a community member's profile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { User, Qualification } from '../types';
import { useAuth } from '../hooks/useAuth';

type RouteParams = {
  UserProfile: {
    userId: string;
  };
};

type NavigationProp = StackNavigationProp<any>;

export default function UserProfileScreen() {
  const route = useRoute<RouteProp<RouteParams, 'UserProfile'>>();
  const navigation = useNavigation<NavigationProp>();
  const { user: currentUser } = useAuth();
  const { userId } = route.params;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUser({ id: userDoc.id, ...userDoc.data() } as User);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleMessage = () => {
    // Navigate to chat or messaging screen
    Alert.alert('Coming Soon', 'Messaging feature will be available soon');
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle-outline" size={64} color={colors.text.secondary} />
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const age = calculateAge(user.dateOfBirth);
  const isOwnProfile = currentUser?.id === userId;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        {isOwnProfile && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="create-outline" size={24} color={colors.primary.main} />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {user.photoURL ? (
          <Image
            source={{ uri: user.photoURL }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={60} color="#94a3b8" />
          </View>
        )}
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{user.displayName}</Text>
            {user.verified && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
            )}
          </View>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleMessage}>
              <Ionicons name="chatbubble" size={18} color={colors.background.default} />
              <Text style={styles.primaryButtonText}>Message</Text>
            </TouchableOpacity>
            {user.phoneNumber && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleCall(user.phoneNumber!)}
              >
                <Ionicons name="call" size={18} color={colors.primary.main} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoCard}>
          {user.email && (
            <InfoRow icon="mail" label="Email" value={user.email} />
          )}
          {user.phoneNumber && (
            <InfoRow icon="call" label="Phone" value={user.phoneNumber} />
          )}
          {user.dateOfBirth && (
            <InfoRow
              icon="calendar"
              label="Date of Birth"
              value={`${formatDate(user.dateOfBirth)}${age ? ` (${age} years)` : ''}`}
            />
          )}
          {user.gender && (
            <InfoRow
              icon="person"
              label="Gender"
              value={user.gender.replace(/_/g, ' ')}
            />
          )}
          {user.maritalStatus && (
            <InfoRow
              icon="heart"
              label="Marital Status"
              value={user.maritalStatus.charAt(0).toUpperCase() + user.maritalStatus.slice(1)}
            />
          )}
          {user.bloodGroup && (
            <InfoRow icon="water" label="Blood Group" value={user.bloodGroup} />
          )}
        </View>
      </View>

      {/* Professional Information */}
      {user.profession && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Details</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="briefcase"
              label="Profession"
              value={user.customProfession || user.profession.replace(/_/g, ' ')}
            />
            {user.workplace && (
              <InfoRow icon="business" label="Workplace" value={user.workplace} />
            )}
            {user.experience && (
              <InfoRow
                icon="time"
                label="Experience"
                value={`${user.experience} ${user.experience === 1 ? 'year' : 'years'}`}
              />
            )}
          </View>
        </View>
      )}

      {/* Education */}
      {user.qualifications && user.qualifications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {user.qualifications.map((qual: Qualification, index: number) => (
            <QualificationCard qualification={qual} />
          ))}
        </View>
      )}

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {user.skills.map((skill: string, index: number) => (
              <View style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Address */}
      {user.address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.infoCard}>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={20} color={colors.primary.main} />
              <Text style={styles.addressText}>
                {[
                  user.address.street,
                  user.address.area,
                  user.address.landmark,
                  user.villageName,
                  user.address.district,
                  user.address.state,
                  user.address.pincode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Emergency Contact */}
      {user.emergencyContact && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="person" label="Name" value={user.emergencyContact.name} />
            <InfoRow
              icon="people"
              label="Relationship"
              value={user.emergencyContact.relationship}
            />
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="call" size={18} color={colors.text.secondary} />
                <Text style={styles.infoLabelText}>Phone</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleCall(user.emergencyContact!.phoneNumber)}
              >
                <Text style={[styles.infoValue, styles.phoneLink]}>
                  {user.emergencyContact.phoneNumber}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// Helper Components
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabel}>
      <Ionicons name={icon as any} size={18} color={colors.text.secondary} />
      <Text style={styles.infoLabelText}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const QualificationCard = ({ qualification }: { qualification: Qualification }) => (
  <View style={styles.qualCard}>
    <View style={styles.qualHeader}>
      <Ionicons name="school" size={20} color={colors.primary.main} />
      <View style={styles.qualInfo}>
        <Text style={styles.qualDegree}>{qualification.degree}</Text>
        {qualification.field && (
          <Text style={styles.qualField}>{qualification.field}</Text>
        )}
      </View>
    </View>
    <Text style={styles.qualInstitution}>{qualification.institution}</Text>
    <Text style={styles.qualYear}>{qualification.year}</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    padding: spacing.xl,
  },
  errorText: {
    ...typography.h3,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  backButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  editBtn: {
    padding: spacing.xs,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  displayName: {
    ...typography.h2,
    color: colors.text.primary,
  },
  bio: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.background.default,
  },
  secondaryButton: {
    backgroundColor: colors.primary.main + '20',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.default,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  infoLabelText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.body2,
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
    textTransform: 'capitalize',
  },
  phoneLink: {
    color: colors.primary.main,
    textDecorationLine: 'underline',
  },
  addressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addressText: {
    ...typography.body2,
    color: colors.text.primary,
    flex: 1,
  },
  qualCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  qualHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  qualInfo: {
    flex: 1,
  },
  qualDegree: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  qualField: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  qualInstitution: {
    ...typography.body2,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  qualYear: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skillChip: {
    backgroundColor: colors.primary.main + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
  },
  skillText: {
    ...typography.body2,
    color: colors.primary.main,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});
