/**
 * Add Place Screen
 * Share a new famous place or landmark
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { PlaceCategory } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as placesService from '../services/placesService';

const CATEGORY_OPTIONS = [
  { value: PlaceCategory.TEMPLE, label: 'Temple', icon: 'star' },
  { value: PlaceCategory.MOSQUE, label: 'Mosque', icon: 'moon' },
  { value: PlaceCategory.CHURCH, label: 'Church', icon: 'cross' },
  { value: PlaceCategory.MONUMENT, label: 'Monument', icon: 'flag' },
  { value: PlaceCategory.PARK, label: 'Park', icon: 'leaf' },
  { value: PlaceCategory.LAKE, label: 'Lake', icon: 'water' },
  { value: PlaceCategory.WATERFALL, label: 'Waterfall', icon: 'water' },
  { value: PlaceCategory.HERITAGE_SITE, label: 'Heritage Site', icon: 'archive' },
  { value: PlaceCategory.MUSEUM, label: 'Museum', icon: 'library' },
  { value: PlaceCategory.SCENIC_SPOT, label: 'Scenic Spot', icon: 'camera' },
  { value: PlaceCategory.HISTORICAL_LANDMARK, label: 'Historical', icon: 'time' },
  { value: PlaceCategory.NATURAL_WONDER, label: 'Natural Wonder', icon: 'sparkles' },
  { value: PlaceCategory.RESTAURANT, label: 'Restaurant', icon: 'restaurant' },
  { value: PlaceCategory.MARKET, label: 'Market', icon: 'storefront' },
  { value: PlaceCategory.OTHER, label: 'Other', icon: 'location' },
];

export default function AddPlaceScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PlaceCategory>(PlaceCategory.OTHER);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [openingHours, setOpeningHours] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('');
  const [facilities, setFacilities] = useState('');
  const [tags, setTags] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [historicalInfo, setHistoricalInfo] = useState('');
  const [tips, setTips] = useState('');

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
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
        setAddress(
          `${addr.street || ''} ${addr.city || ''} ${addr.region || ''} ${addr.postalCode || ''}`.trim()
        );
      }

      Alert.alert('Success', 'Current location captured!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant photo library permission');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setPhotos([...photos, ...newPhotos].slice(0, 10)); // Max 10 photos
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !address.trim()) {
      Alert.alert('Error', 'Please fill in name, description, and address');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please capture the location');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }

    if (!user) return;

    try {
      setLoading(true);

      const placeData = {
        name: name.trim(),
        description: description.trim(),
        category,
        villageId: user.villageId || '',
        villageName: user.villageName || '',
        location,
        address: address.trim(),
        photos,
        coverImage: photos[0],
        addedBy: user.id,
        addedByName: user.displayName,
        addedByAvatar: user.photoURL,
        featured: false,
        openingHours: openingHours.trim() || undefined,
        entryFee: entryFee.trim() || undefined,
        bestTimeToVisit: bestTimeToVisit.trim() || undefined,
        facilities: facilities
          .split(',')
          .map(f => f.trim())
          .filter(Boolean),
        tags: tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        contactPhone: contactPhone.trim() || undefined,
        historicalSignificance: historicalInfo.trim() || undefined,
        tips: tips
          .split('\n')
          .map(t => t.trim())
          .filter(Boolean),
      };

      await placesService.createPlace(placeData);

      Alert.alert('Success', 'Place added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error adding place:', error);
      Alert.alert('Error', 'Failed to add place. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.default }]}>
      <View style={[styles.header, { backgroundColor: colors.primary.main }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Famous Place</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Photos */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.text.primary }]}>Photos *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 10 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages}>
                <Ionicons name="camera" size={32} color={colors.text.secondary} />
                <Text style={[styles.addPhotoText, { color: colors.text.secondary }]}>
                  Add Photos
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Basic Info */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="Enter place name"
            placeholderTextColor={colors.text.secondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Description *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="Describe this place..."
            placeholderTextColor={colors.text.secondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORY_OPTIONS.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: category === cat.value ? colors.primary.main : colors.background.card,
                    borderColor: category === cat.value ? colors.primary.main : colors.border,
                  },
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={category === cat.value ? '#fff' : colors.text.primary}
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    { color: category === cat.value ? '#fff' : colors.text.primary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Location *</Text>
          <TouchableOpacity
            style={[styles.locationButton, { backgroundColor: colors.primary.main }]}
            onPress={getCurrentLocation}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.locationButtonText}>
              {location ? 'Location Captured ✓' : 'Capture Current Location'}
            </Text>
          </TouchableOpacity>
          {location && (
            <Text style={[styles.locationText, { color: colors.text.secondary }]}>
              📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Address *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="Enter address"
            placeholderTextColor={colors.text.secondary}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Additional Details */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Opening Hours</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="e.g., 6:00 AM - 8:00 PM"
            placeholderTextColor={colors.text.secondary}
            value={openingHours}
            onChangeText={setOpeningHours}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Entry Fee</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="e.g., Free, ₹50"
            placeholderTextColor={colors.text.secondary}
            value={entryFee}
            onChangeText={setEntryFee}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Best Time to Visit</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="e.g., October to March"
            placeholderTextColor={colors.text.secondary}
            value={bestTimeToVisit}
            onChangeText={setBestTimeToVisit}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Facilities (comma-separated)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="e.g., Parking, Restrooms, Cafeteria"
            placeholderTextColor={colors.text.secondary}
            value={facilities}
            onChangeText={setFacilities}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Tags (comma-separated)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="e.g., ancient, religious, peaceful"
            placeholderTextColor={colors.text.secondary}
            value={tags}
            onChangeText={setTags}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Contact Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="Enter contact number"
            placeholderTextColor={colors.text.secondary}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Historical Significance</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="Share any historical information..."
            placeholderTextColor={colors.text.secondary}
            value={historicalInfo}
            onChangeText={setHistoricalInfo}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>Tips (one per line)</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.background.card, color: colors.text.primary }]}
            placeholder="Share tips for visitors..."
            placeholderTextColor={colors.text.secondary}
            value={tips}
            onChangeText={setTips}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary.main }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Add Place</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
      paddingBottom: 16,
      paddingHorizontal: 16,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    section: {
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    photosScroll: {
      marginBottom: 8,
    },
    photoPreview: {
      width: 120,
      height: 120,
      marginRight: 12,
      position: 'relative',
    },
    photoImage: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    removePhotoButton: {
      position: 'absolute',
      top: -8,
      right: -8,
    },
    addPhotoButton: {
      width: 120,
      height: 120,
      borderRadius: 8,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: '#ccc',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addPhotoText: {
      fontSize: 12,
      marginTop: 8,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    textArea: {
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    categoryScroll: {
      marginVertical: 4,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      marginRight: 8,
      gap: 6,
    },
    categoryButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    locationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 8,
      gap: 8,
    },
    locationButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    locationText: {
      fontSize: 12,
      marginTop: 8,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 8,
      marginTop: 8,
      marginBottom: 32,
      gap: 8,
    },
    submitButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
    },
  });
