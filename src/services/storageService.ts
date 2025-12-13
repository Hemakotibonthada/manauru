/**
 * Storage Service
 * Handles file uploads to Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { Platform } from 'react-native';

export class StorageService {
  /**
   * Upload image to Firebase Storage
   */
  static async uploadImage(
    uri: string,
    path: string,
    fileName?: string
  ): Promise<string> {
    try {
      const blob = await this.uriToBlob(uri);
      const timestamp = Date.now();
      const name = fileName || `image_${timestamp}.jpg`;
      const storageRef = ref(storage, `${path}/${name}`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      console.log('✅ Image uploaded successfully');
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Upload video to Firebase Storage
   */
  static async uploadVideo(
    uri: string,
    path: string,
    fileName?: string
  ): Promise<string> {
    try {
      const blob = await this.uriToBlob(uri);
      const timestamp = Date.now();
      const name = fileName || `video_${timestamp}.mp4`;
      const storageRef = ref(storage, `${path}/${name}`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      console.log('✅ Video uploaded successfully');
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading video:', error);
      throw new Error('Failed to upload video');
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
    uris: string[],
    path: string
  ): Promise<string[]> {
    try {
      const uploadPromises = uris.map((uri, index) =>
        this.uploadImage(uri, path, `image_${Date.now()}_${index}.jpg`)
      );
      const urls = await Promise.all(uploadPromises);
      console.log('✅ Multiple images uploaded successfully');
      return urls;
    } catch (error) {
      console.error('❌ Error uploading multiple images:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Delete file from Firebase Storage
   */
  static async deleteFile(url: string): Promise<void> {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
      console.log('✅ File deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Convert URI to Blob for upload
   */
  private static async uriToBlob(uri: string): Promise<Blob> {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      return await response.blob();
    } else {
      // For React Native
      const response = await fetch(uri);
      return await response.blob();
    }
  }

  /**
   * Get file extension from URI
   */
  private static getFileExtension(uri: string): string {
    const match = uri.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1] : 'jpg';
  }
}

// Export convenience functions
export const uploadImage = StorageService.uploadImage.bind(StorageService);
export const uploadVideo = StorageService.uploadVideo.bind(StorageService);
export const uploadMultipleImages = StorageService.uploadMultipleImages.bind(StorageService);
export const deleteFile = StorageService.deleteFile.bind(StorageService);

export default StorageService;
