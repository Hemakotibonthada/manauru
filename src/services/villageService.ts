/**
 * Village Service
 * Handles village-related operations
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Village } from '../types';
import { uploadImage } from './storageService';

export class VillageService {
  /**
   * Create a new village
   */
  static async createVillage(
    name: string,
    description: string,
    state: string,
    district: string,
    pincode: string,
    location: { latitude: number; longitude: number; address?: string },
    adminIds: string[],
    language: string = 'en'
  ): Promise<string> {
    try {
      const villageRef = doc(collection(db, 'villages'));
      const villageData: Omit<Village, 'id'> = {
        name,
        description,
        state,
        district,
        pincode,
        location,
        adminIds,
        memberCount: adminIds.length,
        verified: false,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        categories: [],
        language,
      };

      await setDoc(villageRef, villageData);
      console.log('✅ Village created successfully');
      return villageRef.id;
    } catch (error) {
      console.error('❌ Error creating village:', error);
      throw new Error('Failed to create village');
    }
  }

  /**
   * Get village by ID
   */
  static async getVillage(villageId: string): Promise<Village | null> {
    try {
      const villageDoc = await getDoc(doc(db, 'villages', villageId));
      if (villageDoc.exists()) {
        return { id: villageDoc.id, ...villageDoc.data() } as Village;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching village:', error);
      return null;
    }
  }

  /**
   * Get all villages
   */
  static async getAllVillages(pageSize: number = 50): Promise<Village[]> {
    try {
      const q = query(
        collection(db, 'villages'),
        orderBy('memberCount', 'desc'),
        limit(pageSize)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Village)
      );
    } catch (error) {
      console.error('❌ Error fetching villages:', error);
      throw new Error('Failed to fetch villages');
    }
  }

  /**
   * Search villages by name, state, or district
   */
  static async searchVillages(searchTerm: string): Promise<Village[]> {
    try {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const q = query(collection(db, 'villages'), limit(50));
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Village))
        .filter(
          (village) =>
            village.name.toLowerCase().includes(lowerSearchTerm) ||
            village.state.toLowerCase().includes(lowerSearchTerm) ||
            village.district.toLowerCase().includes(lowerSearchTerm)
        );
    } catch (error) {
      console.error('❌ Error searching villages:', error);
      throw new Error('Failed to search villages');
    }
  }

  /**
   * Get villages by state
   */
  static async getVillagesByState(state: string): Promise<Village[]> {
    try {
      const q = query(
        collection(db, 'villages'),
        where('state', '==', state),
        orderBy('memberCount', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Village)
      );
    } catch (error) {
      console.error('❌ Error fetching villages by state:', error);
      throw new Error('Failed to fetch villages by state');
    }
  }

  /**
   * Update village
   */
  static async updateVillage(
    villageId: string,
    updates: Partial<Village>
  ): Promise<void> {
    try {
      const villageRef = doc(db, 'villages', villageId);
      await updateDoc(villageRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Village updated successfully');
    } catch (error) {
      console.error('❌ Error updating village:', error);
      throw new Error('Failed to update village');
    }
  }

  /**
   * Upload village cover image
   */
  static async updateVillageCoverImage(
    villageId: string,
    imageUri: string
  ): Promise<string> {
    try {
      const coverImage = await uploadImage(
        imageUri,
        `villages/${villageId}/cover`
      );
      await this.updateVillage(villageId, { coverImage });
      return coverImage;
    } catch (error) {
      console.error('❌ Error updating village cover image:', error);
      throw new Error('Failed to update village cover image');
    }
  }

  /**
   * Upload village profile image
   */
  static async updateVillageProfileImage(
    villageId: string,
    imageUri: string
  ): Promise<string> {
    try {
      const profileImage = await uploadImage(
        imageUri,
        `villages/${villageId}/profile`
      );
      await this.updateVillage(villageId, { profileImage });
      return profileImage;
    } catch (error) {
      console.error('❌ Error updating village profile image:', error);
      throw new Error('Failed to update village profile image');
    }
  }

  /**
   * Follow a village
   */
  static async followVillage(userId: string, villageId: string): Promise<void> {
    try {
      // Add village to user's followed villages
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        villageId: villageId,
        updatedAt: serverTimestamp(),
      });

      // Increment village member count
      const villageRef = doc(db, 'villages', villageId);
      await updateDoc(villageRef, {
        memberCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Village followed successfully');
    } catch (error) {
      console.error('❌ Error following village:', error);
      throw new Error('Failed to follow village');
    }
  }

  /**
   * Unfollow a village
   */
  static async unfollowVillage(userId: string, villageId: string): Promise<void> {
    try {
      // Remove village from user's followed villages
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        villageId: null,
        updatedAt: serverTimestamp(),
      });

      // Decrement village member count
      const villageRef = doc(db, 'villages', villageId);
      await updateDoc(villageRef, {
        memberCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Village unfollowed successfully');
    } catch (error) {
      console.error('❌ Error unfollowing village:', error);
      throw new Error('Failed to unfollow village');
    }
  }

  /**
   * Add admin to village
   */
  static async addVillageAdmin(
    villageId: string,
    userId: string
  ): Promise<void> {
    try {
      const villageRef = doc(db, 'villages', villageId);
      await updateDoc(villageRef, {
        adminIds: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Admin added successfully');
    } catch (error) {
      console.error('❌ Error adding admin:', error);
      throw new Error('Failed to add admin');
    }
  }

  /**
   * Remove admin from village
   */
  static async removeVillageAdmin(
    villageId: string,
    userId: string
  ): Promise<void> {
    try {
      const villageRef = doc(db, 'villages', villageId);
      await updateDoc(villageRef, {
        adminIds: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Admin removed successfully');
    } catch (error) {
      console.error('❌ Error removing admin:', error);
      throw new Error('Failed to remove admin');
    }
  }

  /**
   * Get nearby villages based on location
   */
  static async getNearbyVillages(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<Village[]> {
    try {
      // Note: This is a simplified implementation
      // For production, use geohashing or GeoFirestore
      const allVillages = await this.getAllVillages(100);

      return allVillages.filter((village) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          village.location.latitude,
          village.location.longitude
        );
        return distance <= radiusKm;
      });
    } catch (error) {
      console.error('❌ Error fetching nearby villages:', error);
      throw new Error('Failed to fetch nearby villages');
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default VillageService;
