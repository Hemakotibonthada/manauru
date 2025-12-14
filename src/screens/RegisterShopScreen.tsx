import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { Shop, ShopCategory, OpeningHours } from '../types';
import { createShop, uploadShopImage, updateShop } from '../services/shopService';
import { useAuth } from '../hooks/useAuth';

const CATEGORY_OPTIONS = [
  { value: ShopCategory.GROCERY, label: 'Grocery' },
  { value: ShopCategory.RESTAURANT, label: 'Restaurant' },
  { value: ShopCategory.CLOTHING, label: 'Clothing' },
  { value: ShopCategory.ELECTRONICS, label: 'Electronics' },
  { value: ShopCategory.PHARMACY, label: 'Pharmacy' },
  { value: ShopCategory.HARDWARE, label: 'Hardware' },
  { value: ShopCategory.BAKERY, label: 'Bakery' },
  { value: ShopCategory.VEGETABLES, label: 'Vegetables' },
  { value: ShopCategory.DAIRY, label: 'Dairy' },
  { value: ShopCategory.MEAT, label: 'Meat' },
  { value: ShopCategory.STATIONERY, label: 'Stationery' },
  { value: ShopCategory.MOBILE_SHOP, label: 'Mobile Shop' },
  { value: ShopCategory.BEAUTY, label: 'Beauty' },
  { value: ShopCategory.JEWELRY, label: 'Jewelry' },
  { value: ShopCategory.FURNITURE, label: 'Furniture' },
  { value: ShopCategory.BOOKS, label: 'Books' },
  { value: ShopCategory.TOYS, label: 'Toys' },
  { value: ShopCategory.SPORTS, label: 'Sports' },
  { value: ShopCategory.AUTOMOBILE, label: 'Automobile' },
  { value: ShopCategory.OTHER, label: 'Other' },
];

export default function RegisterShopScreen() {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ShopCategory>(ShopCategory.GROCERY);
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [tags, setTags] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [16, 9],
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setPhotos([...photos, ...newPhotos].slice(0, 5)); // Max 5 photos
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter shop name');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter shop description');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter shop address');
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter phone number');
      return false;
    }
    if (photos.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one photo');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      // Create shop first
      const shopId = await createShop({
        name: name.trim(),
        description: description.trim(),
        ownerId: user.id,
        ownerName: user.displayName,
        ownerPhone: phoneNumber.trim(),
        villageId: user.villageId!,
        villageName: user.villageName || '',
        category,
        photos: [],
        address: address.trim(),
        isOpen: true,
        verified: false,
        phoneNumber: phoneNumber.trim(),
        whatsappNumber: whatsappNumber.trim() || undefined,
        email: email.trim() || undefined,
        deliveryAvailable,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : undefined,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });

      // Upload photos
      const uploadedPhotoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photoUrl = await uploadShopImage(shopId, photos[i], `photo_${i}_${Date.now()}.jpg`);
        uploadedPhotoUrls.push(photoUrl);
      }

      // Update shop with photo URLs
      await updateShop(shopId, {
        photos: uploadedPhotoUrls,
        coverImage: uploadedPhotoUrls[0],
      });

      Alert.alert(
        'Success',
        'Your shop has been registered successfully! It will be reviewed and verified soon.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error registering shop:', error);
      Alert.alert('Error', 'Failed to register shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.header}>
          <Ionicons name="storefront" size={48} color={colors.primary.main} />
          <Text style={styles.title}>Register Your Shop</Text>
          <Text style={styles.subtitle}>
            Start selling to your village community
          </Text>
        </View>

      {/* Shop Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop Photos *</Text>
        <Text style={styles.sectionSubtitle}>Add up to 5 photos of your shop</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          
          {photos.length < 5 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Ionicons name="camera" size={32} color={colors.primary.main} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Rama's Grocery Store"
            placeholderTextColor={colors.text.disabled}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your shop and what you sell..."
            placeholderTextColor={colors.text.disabled}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.categoryChip,
                  category === option.value && styles.categoryChipSelected,
                ]}
                onPress={() => setCategory(option.value)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === option.value && styles.categoryChipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Shop address with landmark"
            placeholderTextColor={colors.text.disabled}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., organic, fresh, daily needs"
            placeholderTextColor={colors.text.disabled}
            value={tags}
            onChangeText={setTags}
          />
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            placeholderTextColor={colors.text.disabled}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>WhatsApp Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            placeholderTextColor={colors.text.disabled}
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="shop@example.com"
            placeholderTextColor={colors.text.disabled}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Delivery Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Settings</Text>
        
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setDeliveryAvailable(!deliveryAvailable)}
        >
          <Ionicons
            name={deliveryAvailable ? 'checkbox' : 'square-outline'}
            size={24}
            color={deliveryAvailable ? colors.primary.main : colors.text.secondary}
          />
          <Text style={styles.checkboxLabel}>I provide home delivery</Text>
        </TouchableOpacity>

        {deliveryAvailable && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Delivery Fee (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.text.disabled}
                value={deliveryFee}
                onChangeText={setDeliveryFee}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Minimum Order Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.text.disabled}
                value={minOrderAmount}
                onChangeText={setMinOrderAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </>
        )}
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
            <Text style={styles.submitButtonText}>Register Shop</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.noteContainer}>
        <Ionicons name="information-circle" size={20} color={colors.info.main} />
        <Text style={styles.noteText}>
          Your shop will be reviewed and verified within 24 hours. You'll be notified once it's approved.
        </Text>
      </View>
    </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background.paper,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.background.paper,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoWrapper: {
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.background.default,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.divider,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  addPhotoText: {
    fontSize: 12,
    color: colors.primary.main,
    marginTop: 4,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.divider,
    marginHorizontal: 4,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary.main,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: colors.info.light,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: colors.info.dark,
    lineHeight: 18,
  },
});
