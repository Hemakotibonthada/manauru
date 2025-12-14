/**
 * Create Event Screen
 * Form to create a new community event
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { EventCategory } from '../types';
import { useAuth } from '../hooks/useAuth';
import { EventService } from '../services/eventService';

const CATEGORY_OPTIONS = [
  { value: EventCategory.FESTIVAL, label: 'Festival', icon: 'sparkles' },
  { value: EventCategory.MEETING, label: 'Meeting', icon: 'people' },
  { value: EventCategory.WORKSHOP, label: 'Workshop', icon: 'hammer' },
  { value: EventCategory.SPORTS, label: 'Sports', icon: 'football' },
  { value: EventCategory.CULTURAL, label: 'Cultural', icon: 'color-palette' },
  { value: EventCategory.HEALTH, label: 'Health', icon: 'medical' },
  { value: EventCategory.EDUCATION, label: 'Education', icon: 'school' },
];

type NavigationProp = StackNavigationProp<any>;

export default function CreateEventScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>(EventCategory.CULTURAL);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [maxAttendees, setMaxAttendees] = useState('');
  const [price, setPrice] = useState('');

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocationCoords({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Reverse geocoding to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (addresses.length > 0) {
        const addr = addresses[0];
        setLocationName(
          `${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`.trim()
        );
      }

      Alert.alert('Success', 'Current location captured!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

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

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter event title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter event description');
      return false;
    }
    if (!startDate) {
      Alert.alert('Validation Error', 'Please enter start date');
      return false;
    }
    if (!endDate) {
      Alert.alert('Validation Error', 'Please enter end date');
      return false;
    }
    if (!locationName.trim()) {
      Alert.alert('Validation Error', 'Please enter location');
      return false;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      Alert.alert('Validation Error', 'Please use YYYY-MM-DD format for dates');
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    try {
      setLoading(true);

      const start = new Date(startDate);
      const end = new Date(endDate);

      await EventService.createEvent(
        user.id,
        user.displayName || 'Unknown',
        title.trim(),
        description.trim(),
        category,
        start,
        end,
        {
          address: locationName.trim(),
          latitude: locationCoords?.latitude || 0,
          longitude: locationCoords?.longitude || 0,
        },
        user.villageId,
        undefined, // villageName can be fetched if needed
        coverImage || undefined,
        maxAttendees ? parseInt(maxAttendees) : undefined,
        price ? parseFloat(price) : undefined
      );

      Alert.alert(
        'Success',
        'Event created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
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
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={{ width: 24 }} />
        </View>

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

        {/* Form */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter event title"
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
              placeholder="Describe your event..."
              placeholderTextColor={colors.text.disabled}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
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

          {/* Start Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Start Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-01-01"
              placeholderTextColor={colors.text.disabled}
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>

          {/* End Date */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>End Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-01-02"
              placeholderTextColor={colors.text.disabled}
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Location *</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter location"
                placeholderTextColor={colors.text.disabled}
                value={locationName}
                onChangeText={setLocationName}
              />
              <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                <Ionicons name="location" size={20} color={colors.primary.main} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Max Attendees (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Max Attendees (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Leave empty for unlimited"
              placeholderTextColor={colors.text.disabled}
              value={maxAttendees}
              onChangeText={setMaxAttendees}
              keyboardType="numeric"
            />
          </View>

          {/* Price (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Entry Fee (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter price in INR"
              placeholderTextColor={colors.text.disabled}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
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
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Create Event</Text>
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
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.text.secondary,
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
    height: 100,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationButton: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.divider,
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
