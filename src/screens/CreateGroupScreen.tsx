/**
 * Create Group Screen
 * Form to create a new community group
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { GroupCategory, GroupType } from '../types';
import groupService from '../services/groupService';
import { useAuth } from '../hooks/useAuth';

type NavigationProp = StackNavigationProp<any>;

export default function CreateGroupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>(GroupCategory.CULTURAL);
  const [type, setType] = useState<GroupType>(GroupType.PUBLIC);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [rules, setRules] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: GroupCategory.CULTURAL, label: 'Cultural', icon: 'color-palette' },
    { value: GroupCategory.SPORTS, label: 'Sports', icon: 'football' },
    { value: GroupCategory.EDUCATION, label: 'Education', icon: 'school' },
    { value: GroupCategory.HEALTH, label: 'Health', icon: 'medical' },
    { value: GroupCategory.AGRICULTURE, label: 'Agriculture', icon: 'leaf' },
    { value: GroupCategory.BUSINESS, label: 'Business', icon: 'briefcase' },
    { value: GroupCategory.YOUTH, label: 'Youth', icon: 'people' },
    { value: GroupCategory.WOMEN, label: 'Women', icon: 'woman' },
    { value: GroupCategory.SENIORS, label: 'Seniors', icon: 'accessibility' },
  ];

  const types = [
    {
      value: GroupType.PUBLIC,
      label: 'Public',
      description: 'Anyone can see and join',
      icon: 'globe',
    },
    {
      value: GroupType.PRIVATE,
      label: 'Private',
      description: 'Anyone can see, approval required to join',
      icon: 'lock-closed',
    },
    {
      value: GroupType.SECRET,
      label: 'Secret',
      description: 'Only members can see',
      icon: 'eye-off',
    },
  ];

  const pickCoverImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const addRule = () => {
    setRules([...rules, '']);
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules.length > 0 ? newRules : ['']);
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a group name');
      return false;
    }

    if (name.length < 3) {
      Alert.alert('Validation Error', 'Group name must be at least 3 characters');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a group description');
      return false;
    }

    if (description.length < 10) {
      Alert.alert('Validation Error', 'Description must be at least 10 characters');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!user || !validateForm()) return;

    try {
      setLoading(true);

      const filteredRules = rules.filter((rule) => rule.trim().length > 0);

      const groupId = await groupService.createGroup(
        user.id,
        user.displayName || 'User',
        user.photoURL,
        name,
        description,
        category,
        type,
        coverImage || undefined,
        user.villageId,
        filteredRules.length > 0 ? filteredRules : undefined
      );

      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.replace('GroupDetail', { groupId }),
        },
      ]);
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <TouchableOpacity style={styles.coverImageContainer} onPress={pickCoverImage}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image" size={48} color={colors.text.secondary} />
              <Text style={styles.coverPlaceholderText}>Add cover image</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          {/* Group Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter group name"
              placeholderTextColor={colors.text.secondary}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            <Text style={styles.characterCount}>{name.length}/50</Text>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your group..."
              placeholderTextColor={colors.text.secondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{description.length}/500</Text>
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.optionsGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    category === cat.value && styles.selectedOption,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={category === cat.value ? colors.primary.main : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      category === cat.value && styles.selectedOptionText,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy Type */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Privacy *</Text>
            {types.map((typeOption) => (
              <TouchableOpacity
                key={typeOption.value}
                style={[
                  styles.privacyOption,
                  type === typeOption.value && styles.selectedPrivacyOption,
                ]}
                onPress={() => setType(typeOption.value)}
              >
                <View style={styles.privacyIcon}>
                  <Ionicons
                    name={typeOption.icon as any}
                    size={32}
                    color={type === typeOption.value ? colors.primary.main : colors.text.secondary}
                  />
                </View>
                <View style={styles.privacyInfo}>
                  <Text
                    style={[
                      styles.privacyLabel,
                      type === typeOption.value && styles.selectedPrivacyLabel,
                    ]}
                  >
                    {typeOption.label}
                  </Text>
                  <Text style={styles.privacyDescription}>{typeOption.description}</Text>
                </View>
                {type === typeOption.value && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary.main} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Group Rules */}
          <View style={styles.inputContainer}>
            <View style={styles.rulesHeader}>
              <Text style={styles.label}>Group Rules (Optional)</Text>
              <TouchableOpacity onPress={addRule} style={styles.addRuleButton}>
                <Ionicons name="add-circle" size={24} color={colors.primary.main} />
              </TouchableOpacity>
            </View>
            {rules.map((rule, index) => (
              <View key={index} style={styles.ruleInputContainer}>
                <TextInput
                  style={[styles.input, styles.ruleInput]}
                  placeholder={`Rule ${index + 1}`}
                  placeholderTextColor={colors.text.secondary}
                  value={rule}
                  onChangeText={(value) => updateRule(index, value)}
                  maxLength={200}
                />
                {rules.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeRule(index)}
                    style={styles.removeRuleButton}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.error.main} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="people" size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Group</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By creating a group, you agree to follow our community guidelines and terms of
            service.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  coverImageContainer: {
    width: '100%',
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  form: {
    padding: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryOption: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedOption: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  optionText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedPrivacyOption: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  privacyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyLabel: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  selectedPrivacyLabel: {
    color: colors.primary.main,
  },
  privacyDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addRuleButton: {
    padding: spacing.xs,
  },
  ruleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ruleInput: {
    flex: 1,
  },
  removeRuleButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  createButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  disclaimer: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
