/**
 * Create Fundraiser Screen
 * Form to create a new fundraising campaign
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
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { FundraiserCategory } from '../types';
import { useAuth } from '../hooks/useAuth';
import { FundraiserService } from '../services/fundraiserService';

const CATEGORY_OPTIONS = [
  { value: FundraiserCategory.EDUCATION, label: 'Education', icon: 'school' },
  { value: FundraiserCategory.HEALTHCARE, label: 'Healthcare', icon: 'medical' },
  { value: FundraiserCategory.INFRASTRUCTURE, label: 'Infrastructure', icon: 'hammer' },
  { value: FundraiserCategory.EMERGENCY, label: 'Emergency', icon: 'alert-circle' },
  { value: FundraiserCategory.CULTURAL, label: 'Cultural', icon: 'color-palette' },
  { value: FundraiserCategory.ENVIRONMENT, label: 'Environment', icon: 'leaf' },
  { value: FundraiserCategory.OTHER, label: 'Other', icon: 'ellipsis-horizontal' },
];

type NavigationProp = StackNavigationProp<any>;

export default function CreateFundraiserScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FundraiserCategory>(FundraiserCategory.EDUCATION);
  const [goalAmount, setGoalAmount] = useState('');
  const [endDate, setEndDate] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter fundraiser title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter fundraiser description');
      return false;
    }
    if (!goalAmount || parseFloat(goalAmount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid goal amount');
      return false;
    }
    if (!endDate) {
      Alert.alert('Validation Error', 'Please enter end date');
      return false;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(endDate)) {
      Alert.alert('Validation Error', 'Please use YYYY-MM-DD format for date');
      return false;
    }

    const end = new Date(endDate);
    const today = new Date();
    if (end < today) {
      Alert.alert('Validation Error', 'End date must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    try {
      setLoading(true);

      const end = new Date(endDate);

      await FundraiserService.createFundraiser(
        user.id,
        user.displayName || 'Unknown',
        title.trim(),
        description.trim(),
        parseFloat(goalAmount),
        category,
        end,
        images.length > 0 ? images : undefined,
        user.villageId,
        undefined, // villageName can be fetched if needed
        user.photoURL
      );

      Alert.alert(
        'Success',
        'Fundraiser created successfully! It will be reviewed and activated shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating fundraiser:', error);
      Alert.alert('Error', 'Failed to create fundraiser. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Fundraiser</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fundraiser Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter fundraiser title"
              placeholderTextColor={colors.text.disabled}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your cause and how the funds will be used..."
              placeholderTextColor={colors.text.disabled}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryOption,
                    category === cat.value && styles.categoryOptionSelected,
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
                      styles.categoryLabel,
                      category === cat.value && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goal Amount */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Goal Amount (INR) *</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                placeholder="Enter amount"
                placeholderTextColor={colors.text.disabled}
                value={goalAmount}
                onChangeText={setGoalAmount}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* End Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>End Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-12-31"
              placeholderTextColor={colors.text.disabled}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>

          {/* Images */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Images (Optional)</Text>
            <Text style={styles.hint}>Add up to 5 images to support your fundraiser</Text>
            
            {images.length > 0 && (
              <View style={styles.imagesContainer}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error.main} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                <Ionicons name="image" size={24} color={colors.primary.main} />
                <Text style={styles.addImageText}>Add Images</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={colors.info.main} />
            <Text style={styles.infoText}>
              Your fundraiser will be reviewed for verification before being published.
              All contributions are securely handled through our platform.
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="heart" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Create Fundraiser</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flex: 1,
    minWidth: '30%',
    aspectRatio: 1,
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.divider,
  },
  categoryOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.main + '10',
  },
  categoryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: colors.text.secondary,
  },
  categoryLabelSelected: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  addImageButton: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  addImageText: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.info.main + '10',
    borderRadius: 8,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.info.main + '20',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
