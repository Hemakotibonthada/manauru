/**
 * Create Post Screen
 * Create and publish new posts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../hooks/useAuth';
import { PostService } from '../services/postService';
import { uploadMultipleImages } from '../services/storageService';
import { PostType, PostVisibility } from '../types';
import { colors, spacing, borderRadius, typography } from '../styles/theme';
import { Button } from '../components/Button';

interface CreatePostScreenProps {
  navigation: any;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.PUBLIC);
  const [loading, setLoading] = useState(false);

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to add photos.');
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
        setImages((prev: string[]) => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
  };

  const handlePost = async () => {
    if (!user) return;

    if (!content.trim() && images.length === 0) {
      Alert.alert('Empty Post', 'Please add some content or images to your post.');
      return;
    }

    setLoading(true);
    try {
      let mediaUrls: string[] = [];
      
      // Upload images if any
      if (images.length > 0) {
        const timestamp = Date.now();
        mediaUrls = await uploadMultipleImages(
          images,
          `posts/${user.id}/${timestamp}`
        );
      }

      const media = mediaUrls.map((url) => ({ type: 'image' as const, url }));

      await PostService.createPost(
        user.id,
        user.displayName,
        content.trim(),
        images.length > 0 ? PostType.IMAGE : PostType.TEXT,
        images,
        user.villageId,
        undefined, // villageName - can be added if needed
        visibility,
        [] // tags - can be added later
      );

      Alert.alert('Success', 'Your post has been published!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const visibilityOptions = [
    { value: PostVisibility.PUBLIC, label: 'Public', icon: 'globe' },
    { value: PostVisibility.VILLAGE, label: 'Village', icon: 'location' },
    { value: PostVisibility.FOLLOWERS, label: 'Followers', icon: 'people' },
    { value: PostVisibility.PRIVATE, label: 'Private', icon: 'lock-closed' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color={colors.text.disabled} />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.displayName}</Text>
            <TouchableOpacity style={styles.visibilityButton}>
              <Ionicons
                name={
                  visibilityOptions.find((v) => v.value === visibility)?.icon as any
                }
                size={16}
                color={colors.primary.main}
              />
              <Text style={styles.visibilityText}>
                {visibilityOptions.find((v) => v.value === visibility)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Input */}
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.text.disabled}
          multiline
          value={content}
          onChangeText={setContent}
          autoFocus
        />

        {/* Images Preview */}
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((uri: string, index: number) => (
                <View key={`image-${index}`} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.background.paper} />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity style={styles.addMoreButton} onPress={handlePickImages}>
                  <Ionicons name="add" size={32} color={colors.primary.main} />
                  <Text style={styles.addMoreText}>Add more</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* Visibility Options */}
        <View style={styles.visibilitySection}>
          <Text style={styles.sectionTitle}>Who can see this?</Text>
          <View style={styles.visibilityOptions}>
            {visibilityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.visibilityOption,
                  visibility === option.value && styles.visibilityOptionActive,
                ]}
                onPress={() => setVisibility(option.value)}
              >
                <Ionicons
                  name={option.icon as any}
                  size={20}
                  color={
                    visibility === option.value
                      ? colors.primary.contrast
                      : colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.visibilityOptionText,
                    visibility === option.value && styles.visibilityOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePickImages}>
            <Ionicons name="image" size={24} color={colors.primary.main} />
            <Text style={styles.actionButtonText}>Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} disabled>
            <Ionicons name="videocam" size={24} color={colors.text.disabled} />
            <Text style={[styles.actionButtonText, { color: colors.text.disabled }]}>
              Video
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} disabled>
            <Ionicons name="location" size={24} color={colors.text.disabled} />
            <Text style={[styles.actionButtonText, { color: colors.text.disabled }]}>
              Location
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Post"
          onPress={handlePost}
          loading={loading}
          disabled={loading || (!content.trim() && images.length === 0)}
          style={styles.postButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight as any,
    color: colors.text.primary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  visibilityText: {
    fontSize: typography.body2.fontSize,
    color: colors.primary.main,
    fontWeight: typography.h5.fontWeight as any,
  },
  input: {
    fontSize: typography.body1.fontSize,
    color: colors.text.primary,
    padding: spacing.md,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  imagesContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  imagePreview: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.paper,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error.main,
    borderRadius: 12,
  },
  addMoreButton: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoreText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  visibilitySection: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body1.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  visibilityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  visibilityOptionActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  visibilityOptionText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
  },
  visibilityOptionTextActive: {
    color: colors.primary.contrast,
    fontWeight: typography.h5.fontWeight as any,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background.paper,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    fontSize: typography.body2.fontSize,
    color: colors.primary.main,
  },
  postButton: {
    width: '100%',
  },
});
