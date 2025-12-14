/**
 * Profile Screen
 * Displays and allows editing of user profile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import { AuthService } from '../services/authService';
import { uploadImage } from '../services/storageService';
import { User, Profession, Gender, MaritalStatus, BloodGroup, Qualification } from '../types';
import { spacing, borderRadius, typography, getThemedColors } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { FamilyMemberSearch } from '../components/FamilyMemberSearch';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';

export const ProfileScreen = () => {
  const { user, refreshUser } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  
  // Professional information
  const [profession, setProfession] = useState<Profession | undefined>(user?.profession);
  const [customProfession, setCustomProfession] = useState(user?.customProfession || '');
  const [workplace, setWorkplace] = useState(user?.workplace || '');
  const [experience, setExperience] = useState(user?.experience?.toString() || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [qualifications, setQualifications] = useState<Qualification[]>(user?.qualifications || []);
  
  // Personal information
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState<Gender | undefined>(user?.gender);
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | undefined>(user?.maritalStatus);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | undefined>(user?.bloodGroup);
  
  // UI state
  const [showProfessionPicker, setShowProfessionPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [editingSection, setEditingSection] = useState<'basic' | 'professional' | 'personal' | null>(null);
  const [skillInput, setSkillInput] = useState('');
  
  // Family relationship state
  const [showFatherSearch, setShowFatherSearch] = useState(false);
  const [showMotherSearch, setShowMotherSearch] = useState(false);
  const [showSpouseSearch, setShowSpouseSearch] = useState(false);
  const [father, setFather] = useState<User | null>(null);
  const [mother, setMother] = useState<User | null>(null);
  const [spouse, setSpouse] = useState<User | null>(null);
  const [children, setChildren] = useState<User[]>([]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setPhoneNumber(user.phoneNumber || '');
      setPhotoURL(user.photoURL || '');
      setProfession(user.profession);
      setCustomProfession(user.customProfession || '');
      setWorkplace(user.workplace || '');
      setExperience(user.experience?.toString() || '');
      setSkills(user.skills || []);
      setQualifications(user.qualifications || []);
      setDateOfBirth(user.dateOfBirth || '');
      setGender(user.gender);
      setMaritalStatus(user.maritalStatus);
      setBloodGroup(user.bloodGroup);
      
      // Load family members
      loadFamilyMembers();
    }
  }, [user]);

  const loadFamilyMembers = async () => {
    if (!user) return;

    try {
      // Load father
      if (user.fatherId) {
        const fatherDoc = await getDoc(doc(db, 'users', user.fatherId));
        if (fatherDoc.exists()) {
          setFather({ id: fatherDoc.id, ...fatherDoc.data() } as User);
        }
      }

      // Load mother
      if (user.motherId) {
        const motherDoc = await getDoc(doc(db, 'users', user.motherId));
        if (motherDoc.exists()) {
          setMother({ id: motherDoc.id, ...motherDoc.data() } as User);
        }
      }

      // Load spouse
      if (user.spouseId) {
        const spouseDoc = await getDoc(doc(db, 'users', user.spouseId));
        if (spouseDoc.exists()) {
          setSpouse({ id: spouseDoc.id, ...spouseDoc.data() } as User);
        }
      }

      // Load children
      if (user.childrenIds && user.childrenIds.length > 0) {
        const childrenData: User[] = [];
        for (const childId of user.childrenIds) {
          const childDoc = await getDoc(doc(db, 'users', childId));
          if (childDoc.exists()) {
            childrenData.push({ id: childDoc.id, ...childDoc.data() } as User);
          }
        }
        setChildren(childrenData);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const handleLinkFather = async (father: User) => {
    if (!user) return;

    try {
      // Update current user's fatherId
      await updateDoc(doc(db, 'users', user.id), {
        fatherId: father.id,
      });

      // Add current user to father's children
      await updateDoc(doc(db, 'users', father.id), {
        childrenIds: arrayUnion(user.id),
      });

      setFather(father);
      await refreshUser();
      Alert.alert('Success', 'Father linked successfully!');
    } catch (error) {
      console.error('Error linking father:', error);
      Alert.alert('Error', 'Failed to link father. Please try again.');
    }
  };

  const handleLinkMother = async (mother: User) => {
    if (!user) return;

    try {
      // Update current user's motherId
      await updateDoc(doc(db, 'users', user.id), {
        motherId: mother.id,
      });

      // Add current user to mother's children
      await updateDoc(doc(db, 'users', mother.id), {
        childrenIds: arrayUnion(user.id),
      });

      setMother(mother);
      await refreshUser();
      Alert.alert('Success', 'Mother linked successfully!');
    } catch (error) {
      console.error('Error linking mother:', error);
      Alert.alert('Error', 'Failed to link mother. Please try again.');
    }
  };

  const handleLinkSpouse = async (spouse: User) => {
    if (!user) return;

    try {
      // Update current user's spouseId
      await updateDoc(doc(db, 'users', user.id), {
        spouseId: spouse.id,
      });

      // Update spouse's spouseId (reciprocal relationship)
      await updateDoc(doc(db, 'users', spouse.id), {
        spouseId: user.id,
      });

      setSpouse(spouse);
      await refreshUser();
      Alert.alert('Success', 'Spouse linked successfully!');
    } catch (error) {
      console.error('Error linking spouse:', error);
      Alert.alert('Error', 'Failed to link spouse. Please try again.');
    }
  };

  const handleRemoveFather = async () => {
    if (!user || !father) return;

    Alert.alert(
      'Remove Father',
      'Are you sure you want to remove this relationship?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove fatherId from current user
              await updateDoc(doc(db, 'users', user.id), {
                fatherId: null,
              });

              // Remove current user from father's children
              await updateDoc(doc(db, 'users', father.id), {
                childrenIds: arrayRemove(user.id),
              });

              setFather(null);
              await refreshUser();
              Alert.alert('Success', 'Father relationship removed.');
            } catch (error) {
              console.error('Error removing father:', error);
              Alert.alert('Error', 'Failed to remove relationship.');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMother = async () => {
    if (!user || !mother) return;

    Alert.alert(
      'Remove Mother',
      'Are you sure you want to remove this relationship?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove motherId from current user
              await updateDoc(doc(db, 'users', user.id), {
                motherId: null,
              });

              // Remove current user from mother's children
              await updateDoc(doc(db, 'users', mother.id), {
                childrenIds: arrayRemove(user.id),
              });

              setMother(null);
              await refreshUser();
              Alert.alert('Success', 'Mother relationship removed.');
            } catch (error) {
              console.error('Error removing mother:', error);
              Alert.alert('Error', 'Failed to remove relationship.');
            }
          },
        },
      ]
    );
  };

  const handleRemoveSpouse = async () => {
    if (!user || !spouse) return;

    Alert.alert(
      'Remove Spouse',
      'Are you sure you want to remove this relationship?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove spouseId from current user
              await updateDoc(doc(db, 'users', user.id), {
                spouseId: null,
              });

              // Remove spouseId from spouse (reciprocal)
              await updateDoc(doc(db, 'users', spouse.id), {
                spouseId: null,
              });

              setSpouse(null);
              await refreshUser();
              Alert.alert('Success', 'Spouse relationship removed.');
            } catch (error) {
              console.error('Error removing spouse:', error);
              Alert.alert('Error', 'Failed to remove relationship.');
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageLoading(true);
        try {
          // Upload image
          const imageUrl = await uploadImage(
            result.assets[0].uri,
            `profiles/${user?.id}/avatar.jpg`
          );
          setPhotoURL(imageUrl);

          // Update immediately if not in edit mode
          if (!isEditing && user) {
            await AuthService.updateUserProfile(user.id, { photoURL: imageUrl });
            await refreshUser();
            Alert.alert('Success', 'Profile picture updated!');
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
          setImageLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setImageLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const updateData: Partial<User> = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        phoneNumber: phoneNumber.trim(),
        photoURL,
      };

      // Add professional information if editing professional section
      if (editingSection === 'professional') {
        if (profession) updateData.profession = profession;
        if (customProfession) updateData.customProfession = customProfession.trim();
        if (workplace) updateData.workplace = workplace.trim();
        if (experience) updateData.experience = parseInt(experience);
        updateData.skills = skills;
        updateData.qualifications = qualifications;
      }

      // Add personal information if editing personal section
      if (editingSection === 'personal') {
        if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
        if (gender) updateData.gender = gender;
        if (maritalStatus) updateData.maritalStatus = maritalStatus;
        if (bloodGroup) updateData.bloodGroup = bloodGroup;
      }

      await AuthService.updateUserProfile(user.id, updateData);

      await refreshUser();
      setIsEditing(false);
      setEditingSection(null);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || '');
      setPhoneNumber(user.phoneNumber || '');
      setPhotoURL(user.photoURL || '');
      setProfession(user.profession);
      setCustomProfession(user.customProfession || '');
      setWorkplace(user.workplace || '');
      setExperience(user.experience?.toString() || '');
      setSkills(user.skills || []);
      setQualifications(user.qualifications || []);
      setDateOfBirth(user.dateOfBirth || '');
      setGender(user.gender);
      setMaritalStatus(user.maritalStatus);
      setBloodGroup(user.bloodGroup);
    }
    setIsEditing(false);
    setEditingSection(null);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
    }
  };

  const addSkillsFromText = (text: string) => {
    // Split by comma and process each skill
    const newSkills = text
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !skills.includes(s));
    
    if (newSkills.length > 0) {
      setSkills([...skills, ...newSkills]);
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_: string, i: number) => i !== index));
  };

  const professions = Object.values(Profession);
  const genders = Object.values(Gender);
  const maritalStatuses = Object.values(MaritalStatus);
  const bloodGroups = Object.values(BloodGroup);
  
  const styles = createStyles(colors);

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header with Edit Button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={24} color={colors.primary.main} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Profile Picture */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarWrapper}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={64} color={colors.text.disabled} />
            </View>
          )}
          {imageLoading && (
            <View style={styles.avatarLoading}>
              <ActivityIndicator size="small" color={colors.primary.main} />
            </View>
          )}
        </View>
        {isEditing && (
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handlePickImage}
            disabled={imageLoading}
          >
            <Ionicons name="camera" size={20} color={colors.primary.main} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Information */}
      <View style={styles.content}>
        {isEditing ? (
          // Edit Mode
          <View style={styles.form}>
            {editingSection === 'basic' && (
              <>
                <Input
                  label="Display Name *"
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter your name"
                  autoCapitalize="words"
                />
                <Input
                  label="Bio"
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                  style={styles.bioInput}
                />
                <Input
                  label="Phone Number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+91 1234567890"
                  keyboardType="phone-pad"
                />
              </>
            )}

            {editingSection === 'professional' && (
              <>
                <View>
                  <Text style={styles.inputLabel}>Profession</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowProfessionPicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {profession ? profession.replace(/_/g, ' ') : 'Select profession'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                {profession === Profession.OTHER && (
                  <Input
                    label="Custom Profession"
                    value={customProfession}
                    onChangeText={setCustomProfession}
                    placeholder="Enter your profession"
                  />
                )}

                <Input
                  label="Workplace"
                  value={workplace}
                  onChangeText={setWorkplace}
                  placeholder="Where do you work?"
                />

                <Input
                  label="Experience (years)"
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="Years of experience"
                  keyboardType="numeric"
                />

                <View>
                  <Text style={styles.inputLabel}>Skills</Text>
                  <View style={styles.skillsEditContainer}>
                    {skills.map((skill: string, index: number) => (
                      <View key={`skill-edit-${index}`} style={styles.skillEditChip}>
                        <Text style={styles.skillEditText}>{skill}</Text>
                        <TouchableOpacity onPress={() => removeSkill(index)}>
                          <Ionicons name="close-circle" size={18} color={colors.error.main} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  <Input
                    placeholder="Enter skills separated by commas (e.g., IoT, Software Development)"
                    value={skillInput}
                    onChangeText={setSkillInput}
                    onSubmitEditing={() => {
                      if (skillInput.trim()) {
                        addSkillsFromText(skillInput);
                        setSkillInput('');
                      }
                    }}
                    onBlur={() => {
                      if (skillInput.trim()) {
                        addSkillsFromText(skillInput);
                        setSkillInput('');
                      }
                    }}
                  />
                  <Text style={styles.helperText}>Tip: Enter skills separated by commas</Text>
                </View>
              </>
            )}

            {editingSection === 'personal' && (
              <>
                <Input
                  label="Date of Birth"
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                />

                <View>
                  <Text style={styles.inputLabel}>Gender</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowGenderPicker(true)}
                  >
                    <Text style={styles.pickerText}>
                      {gender ? gender.replace(/_/g, ' ') : 'Select gender'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                <View>
                  <Text style={styles.inputLabel}>Marital Status</Text>
                  <View style={styles.optionsRow}>
                    {maritalStatuses.map((status) => (
                      <TouchableOpacity
                        key={`marital-${status}`}
                        style={[
                          styles.optionChip,
                          maritalStatus === status && styles.selectedOptionChip,
                        ]}
                        onPress={() => setMaritalStatus(status)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            maritalStatus === status && styles.selectedOptionText,
                          ]}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={styles.inputLabel}>Blood Group</Text>
                  <View style={styles.optionsRow}>
                    {bloodGroups.map((group) => (
                      <TouchableOpacity
                        key={`blood-${group}`}
                        style={[
                          styles.optionChip,
                          bloodGroup === group && styles.selectedOptionChip,
                        ]}
                        onPress={() => setBloodGroup(group)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            bloodGroup === group && styles.selectedOptionText,
                          ]}
                        >
                          {group}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="outline"
                style={styles.button}
              />
              <Button
                title="Save"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={styles.button}
              />
            </View>
          </View>
        ) : (
          // View Mode
          <View style={styles.infoContainer}>
            {/* Basic Information */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingSection('basic');
                  setIsEditing(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary.main} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user.displayName}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>

            {user.phoneNumber && (
              <View style={styles.infoSection}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{user.phoneNumber}</Text>
              </View>
            )}

            {user.bio && (
              <View style={styles.infoSection}>
                <Text style={styles.label}>Bio</Text>
                <Text style={styles.value}>{user.bio}</Text>
              </View>
            )}

            {/* Professional Information */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Professional Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingSection('professional');
                  setIsEditing(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary.main} />
              </TouchableOpacity>
            </View>

            {user.profession ? (
              <>
                <View style={styles.infoSection}>
                  <Text style={styles.label}>Profession</Text>
                  <Text style={styles.value}>
                    {user.customProfession || user.profession.replace(/_/g, ' ')}
                  </Text>
                </View>

                {user.workplace && (
                  <View style={styles.infoSection}>
                    <Text style={styles.label}>Workplace</Text>
                    <Text style={styles.value}>{user.workplace}</Text>
                  </View>
                )}

                {user.experience && (
                  <View style={styles.infoSection}>
                    <Text style={styles.label}>Experience</Text>
                    <Text style={styles.value}>
                      {user.experience} {user.experience === 1 ? 'year' : 'years'}
                    </Text>
                  </View>
                )}
                {user.skills && user.skills.length > 0 && (
                  <View style={styles.infoSection}>
                    <Text style={styles.label}>Skills</Text>
                    <View style={styles.skillsContainer}>
                      {user.skills.map((skill: string, index: number) => (
                        <View key={`skill-display-${index}`} style={styles.skillChip}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>No professional information added yet</Text>
            )}

            {/* Personal Information */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Personal Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditingSection('personal');
                  setIsEditing(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary.main} />
              </TouchableOpacity>
            </View>

            {user.dateOfBirth || user.gender || user.maritalStatus || user.bloodGroup ? (
              <>
                {user.dateOfBirth && (
                  <View style={styles.infoSection}>
                    <Text style={styles.label}>Date of Birth</Text>
                    <Text style={styles.value}>
                      {new Date(user.dateOfBirth).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {user.gender && (
                  <View style={styles.infoSection}>
                    <Text style={styles.label}>Gender</Text>
                    <Text style={styles.value}>{user.gender.replace(/_/g, ' ')}</Text>
                  </View>
                )}

                {user.maritalStatus && (
                  <View style={styles.infoSection}>
                    <Text style={styles.label}>Marital Status</Text>
                    <Text style={styles.value}>
                      {user.maritalStatus.charAt(0).toUpperCase() + user.maritalStatus.slice(1)}
                    </Text>
                  </View>
                )}

                {user.bloodGroup && (
                  <View style={styles.infoSection}>
                    <Text style={styles.label}>Blood Group</Text>
                    <Text style={styles.value}>{user.bloodGroup}</Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>No personal information added yet</Text>
            )}

            {/* Family Relationships */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family</Text>
              <TouchableOpacity onPress={() => loadFamilyMembers()}>
                <Ionicons name="refresh-outline" size={20} color={colors.primary.main} />
              </TouchableOpacity>
            </View>

            {/* Parents */}
            <View style={styles.familySubsection}>
              <Text style={styles.familySubtitle}>Parents</Text>
              
              {/* Father */}
              <View style={styles.familyMemberContainer}>
                <Text style={styles.familyLabel}>Father</Text>
                {father ? (
                  <View style={styles.familyMemberCard}>
                    <Image
                      source={{ uri: father.photoURL || 'https://via.placeholder.com/40' }}
                      style={styles.familyAvatar}
                    />
                    <View style={styles.familyMemberInfo}>
                      <Text style={styles.familyMemberName}>{father.displayName}</Text>
                      {father.profession && (
                        <Text style={styles.familyMemberDetail}>
                          {father.profession.replace(/_/g, ' ')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={handleRemoveFather}>
                      <Ionicons name="close-circle" size={24} color={colors.error.main} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addFamilyButton}
                    onPress={() => setShowFatherSearch(true)}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary.main} />
                    <Text style={styles.addFamilyText}>Link Father's Account</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Mother */}
              <View style={styles.familyMemberContainer}>
                <Text style={styles.familyLabel}>Mother</Text>
                {mother ? (
                  <View style={styles.familyMemberCard}>
                    <Image
                      source={{ uri: mother.photoURL || 'https://via.placeholder.com/40' }}
                      style={styles.familyAvatar}
                    />
                    <View style={styles.familyMemberInfo}>
                      <Text style={styles.familyMemberName}>{mother.displayName}</Text>
                      {mother.profession && (
                        <Text style={styles.familyMemberDetail}>
                          {mother.profession.replace(/_/g, ' ')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={handleRemoveMother}>
                      <Ionicons name="close-circle" size={24} color={colors.error.main} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addFamilyButton}
                    onPress={() => setShowMotherSearch(true)}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary.main} />
                    <Text style={styles.addFamilyText}>Link Mother's Account</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Spouse */}
            <View style={styles.familySubsection}>
              <Text style={styles.familySubtitle}>Spouse</Text>
              {spouse ? (
                <View style={styles.familyMemberCard}>
                  <Image
                    source={{ uri: spouse.photoURL || 'https://via.placeholder.com/40' }}
                    style={styles.familyAvatar}
                  />
                  <View style={styles.familyMemberInfo}>
                    <Text style={styles.familyMemberName}>{spouse.displayName}</Text>
                    {spouse.profession && (
                      <Text style={styles.familyMemberDetail}>
                        {spouse.profession.replace(/_/g, ' ')}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={handleRemoveSpouse}>
                    <Ionicons name="close-circle" size={24} color={colors.error.main} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addFamilyButton}
                  onPress={() => setShowSpouseSearch(true)}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary.main} />
                  <Text style={styles.addFamilyText}>Link Spouse's Account</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Children */}
            {children.length > 0 && (
              <View style={styles.familySubsection}>
                <Text style={styles.familySubtitle}>Children ({children.length})</Text>
                {children.map((child) => (
                  <View key={child.id} style={styles.familyMemberCard}>
                    <Image
                      source={{ uri: child.photoURL || 'https://via.placeholder.com/40' }}
                      style={styles.familyAvatar}
                    />
                    <View style={styles.familyMemberInfo}>
                      <Text style={styles.familyMemberName}>{child.displayName}</Text>
                      {child.dateOfBirth && (
                        <Text style={styles.familyMemberDetail}>
                          Born: {new Date(child.dateOfBirth).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.label}>Member Since</Text>
              <Text style={styles.value}>
                {user.createdAt?.toDate?.().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.followers?.length || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.following?.length || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sign Out Button */}
        {!isEditing && (
          <View style={styles.signOutContainer}>
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="outline"
              icon={<Ionicons name="log-out-outline" size={20} color={colors.error.main} />}
              textStyle={{ color: colors.error.main }}
            />
          </View>
        )}
      </View>

      {/* Profession Picker Modal */}
      <Modal
        visible={showProfessionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfessionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Profession</Text>
              <TouchableOpacity onPress={() => setShowProfessionPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {professions.map((prof) => (
                <TouchableOpacity
                  key={`profession-${prof}`}
                  style={styles.modalItem}
                  onPress={() => {
                    setProfession(prof);
                    setShowProfessionPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{prof.replace(/_/g, ' ')}</Text>
                  {profession === prof && (
                    <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {genders.map((g) => (
                <TouchableOpacity
                  key={`gender-${g}`}
                  style={styles.modalItem}
                  onPress={() => {
                    setGender(g);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{g.replace(/_/g, ' ')}</Text>
                  {gender === g && (
                    <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Family Member Search Modals */}
      <FamilyMemberSearch
        visible={showFatherSearch}
        onClose={() => setShowFatherSearch(false)}
        onSelectMember={handleLinkFather}
        title="Link Father's Account"
        currentUserId={user?.id || ''}
        villageId={user?.villageId}
      />

      <FamilyMemberSearch
        visible={showMotherSearch}
        onClose={() => setShowMotherSearch(false)}
        onSelectMember={handleLinkMother}
        title="Link Mother's Account"
        currentUserId={user?.id || ''}
        villageId={user?.villageId}
      />

      <FamilyMemberSearch
        visible={showSpouseSearch}
        onClose={() => setShowSpouseSearch(false)}
        onSelectMember={handleLinkSpouse}
        title="Link Spouse's Account"
        currentUserId={user?.id || ''}
        villageId={user?.villageId}
      />
    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight as any,
    color: colors.text.primary,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.paper,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background.default,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.divider,
  },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  changePhotoText: {
    fontSize: typography.body1.fontSize,
    color: colors.primary.main,
    marginLeft: spacing.xs,
    fontWeight: typography.h5.fontWeight as any,
  },
  content: {
    padding: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
  infoContainer: {
    gap: spacing.lg,
  },
  infoSection: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: typography.h5.fontWeight as any,
  },
  value: {
    fontSize: typography.body1.fontSize,
    color: colors.text.primary,
    lineHeight: typography.body1.lineHeight,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  statValue: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight as any,
    color: colors.primary.main,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
  },
  signOutContainer: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
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
  inputLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pickerText: {
    ...typography.body1,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  skillsEditContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  skillEditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    gap: spacing.xs,
  },
  skillEditText: {
    ...typography.body2,
    color: colors.primary.main,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionChip: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  selectedOptionChip: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  optionText: {
    ...typography.body2,
    color: colors.text.primary,
  },
  selectedOptionText: {
    color: colors.background.default,
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  modalList: {
    padding: spacing.md,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  modalItemText: {
    ...typography.body1,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  skillInput: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
  },
  helperText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  familySubsection: {
    marginBottom: spacing.lg,
  },
  familySubtitle: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  familyMemberContainer: {
    marginBottom: spacing.md,
  },
  familyLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  familyMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  familyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.md,
  },
  familyMemberInfo: {
    flex: 1,
  },
  familyMemberName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  familyMemberDetail: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  addFamilyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    borderStyle: 'dashed',
  },
  addFamilyText: {
    ...typography.body2,
    color: colors.primary.main,
    marginLeft: spacing.sm,
  },
});
