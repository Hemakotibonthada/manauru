/**
 * Create Problem Screen
 * Report a new community problem
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { ProblemService } from '../services/problemService';
import { ProblemCategory, ProblemSeverity } from '../types';
import { useAuth } from '../hooks/useAuth';
import { spacing, borderRadius, typography, getThemedColors } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

export const CreateProblemScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProblemCategory>(ProblemCategory.OTHER);
  const [severity, setSeverity] = useState<ProblemSeverity>(ProblemSeverity.MEDIUM);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: ProblemCategory.WATER, label: 'Water', icon: 'water' },
    { value: ProblemCategory.ELECTRICITY, label: 'Electricity', icon: 'flash' },
    { value: ProblemCategory.ROAD, label: 'Road', icon: 'car' },
    { value: ProblemCategory.SANITATION, label: 'Sanitation', icon: 'trash' },
    { value: ProblemCategory.HEALTH, label: 'Health', icon: 'medical' },
    { value: ProblemCategory.EDUCATION, label: 'Education', icon: 'school' },
    { value: ProblemCategory.SAFETY, label: 'Safety', icon: 'shield' },
    { value: ProblemCategory.OTHER, label: 'Other', icon: 'alert-circle' },
  ];

  const severities = [
    { value: ProblemSeverity.LOW, label: 'Low', color: '#4CAF50' },
    { value: ProblemSeverity.MEDIUM, label: 'Medium', color: '#2196F3' },
    { value: ProblemSeverity.HIGH, label: 'High', color: '#FF9800' },
    { value: ProblemSeverity.CRITICAL, label: 'Critical', color: '#F44336' },
  ];

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to report a problem');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    setSubmitting(true);
    try {
      await ProblemService.reportProblem(
        user.id,
        user.displayName || 'Anonymous',
        user.villageId || 'default',
        user.villageName || 'Unknown Village',
        title.trim(),
        description.trim(),
        category,
        severity,
        images.length > 0 ? images : undefined,
        undefined, // location - can be added later
        user.photoURL || undefined
      );

      Alert.alert('Success', 'Problem reported successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating problem:', error);
      Alert.alert('Error', 'Failed to report problem. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Title Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of the problem"
            placeholderTextColor={colors.text.disabled}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide detailed information about the problem"
            placeholderTextColor={colors.text.disabled}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.chip,
                  category === cat.value && styles.chipActive,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={category === cat.value ? colors.primary.contrast : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.chipText,
                    category === cat.value && styles.chipTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Severity Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Severity</Text>
          <View style={styles.chipContainer}>
            {severities.map((sev) => (
              <TouchableOpacity
                key={sev.value}
                style={[
                  styles.severityChip,
                  severity === sev.value && {
                    backgroundColor: sev.color,
                    borderColor: sev.color,
                  },
                ]}
                onPress={() => setSeverity(sev.value)}
              >
                <Text
                  style={[
                    styles.severityText,
                    severity === sev.value && styles.severityTextActive,
                  ]}
                >
                  {sev.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <Text style={styles.label}>Photos (Optional)</Text>
          <View style={styles.imagesContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                <Ionicons name="camera" size={32} color={colors.text.disabled} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Report Problem</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.body1.fontSize,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  textArea: {
    minHeight: 120,
  },
  charCount: {
    fontSize: typography.caption.fontSize,
    color: colors.text.disabled,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  chipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  chipText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.h5.fontWeight as any,
  },
  chipTextActive: {
    color: colors.primary.contrast,
  },
  severityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  severityText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.h5.fontWeight as any,
  },
  severityTextActive: {
    color: '#FFFFFF',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.paper,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background.paper,
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.paper,
    borderWidth: 2,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addImageText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.disabled,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: '#FFFFFF',
  },
});
