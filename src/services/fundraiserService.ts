/**
 * Fundraiser Service
 * Handles fundraising operations
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
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Fundraiser,
  FundraiserCategory,
  FundraiserStatus,
  Contributor,
  Media,
} from '../types';
import { uploadMultipleImages } from './storageService';

export class FundraiserService {
  /**
   * Create a new fundraiser
   */
  static async createFundraiser(
    userId: string,
    userName: string,
    title: string,
    description: string,
    goalAmount: number,
    category: FundraiserCategory,
    endDate: Date,
    mediaUris?: string[],
    villageId?: string,
    villageName?: string,
    userAvatar?: string
  ): Promise<string> {
    try {
      const fundraiserRef = doc(collection(db, 'fundraisers'));
      let media: Media[] = [];

      // Upload media if provided
      if (mediaUris && mediaUris.length > 0) {
        const uploadedUrls = await uploadMultipleImages(
          mediaUris,
          `fundraisers/${fundraiserRef.id}`
        );
        media = uploadedUrls.map((url) => ({ type: 'image', url }));
      }

      const fundraiserData: Omit<Fundraiser, 'id'> = {
        userId,
        userName,
        userAvatar,
        villageId,
        villageName,
        title,
        description,
        goalAmount,
        raisedAmount: 0,
        currency: 'INR',
        category,
        media,
        contributors: [],
        status: FundraiserStatus.ACTIVE,
        startDate: serverTimestamp() as any,
        endDate: endDate as any,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        verified: false,
      };

      await setDoc(fundraiserRef, fundraiserData);
      console.log('✅ Fundraiser created successfully');
      return fundraiserRef.id;
    } catch (error) {
      console.error('❌ Error creating fundraiser:', error);
      throw new Error('Failed to create fundraiser');
    }
  }

  /**
   * Get fundraiser by ID
   */
  static async getFundraiser(fundraiserId: string): Promise<Fundraiser | null> {
    try {
      const fundraiserDoc = await getDoc(doc(db, 'fundraisers', fundraiserId));
      if (fundraiserDoc.exists()) {
        return { id: fundraiserDoc.id, ...fundraiserDoc.data() } as Fundraiser;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching fundraiser:', error);
      return null;
    }
  }

  /**
   * Get all active fundraisers
   */
  static async getActiveFundraisers(pageSize: number = 20): Promise<Fundraiser[]> {
    try {
      const q = query(
        collection(db, 'fundraisers'),
        where('status', '==', FundraiserStatus.ACTIVE),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Fundraiser)
      );
    } catch (error) {
      console.error('❌ Error fetching active fundraisers:', error);
      throw new Error('Failed to fetch active fundraisers');
    }
  }

  /**
   * Get fundraisers by village
   */
  static async getVillageFundraisers(villageId: string): Promise<Fundraiser[]> {
    try {
      const q = query(
        collection(db, 'fundraisers'),
        where('villageId', '==', villageId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Fundraiser)
      );
    } catch (error) {
      console.error('❌ Error fetching village fundraisers:', error);
      throw new Error('Failed to fetch village fundraisers');
    }
  }

  /**
   * Get fundraisers by user
   */
  static async getUserFundraisers(userId: string): Promise<Fundraiser[]> {
    try {
      const q = query(
        collection(db, 'fundraisers'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Fundraiser)
      );
    } catch (error) {
      console.error('❌ Error fetching user fundraisers:', error);
      throw new Error('Failed to fetch user fundraisers');
    }
  }

  /**
   * Contribute to fundraiser
   */
  static async contribute(
    fundraiserId: string,
    userId: string,
    userName: string,
    amount: number,
    message?: string,
    anonymous: boolean = false
  ): Promise<void> {
    try {
      const contributor: Contributor = {
        userId,
        userName: anonymous ? 'Anonymous' : userName,
        amount,
        message,
        anonymous,
        timestamp: serverTimestamp() as any,
      };

      const fundraiserRef = doc(db, 'fundraisers', fundraiserId);
      await updateDoc(fundraiserRef, {
        contributors: arrayUnion(contributor),
        raisedAmount: increment(amount),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Contribution added successfully');
    } catch (error) {
      console.error('❌ Error adding contribution:', error);
      throw new Error('Failed to add contribution');
    }
  }

  /**
   * Update fundraiser status
   */
  static async updateFundraiserStatus(
    fundraiserId: string,
    status: FundraiserStatus
  ): Promise<void> {
    try {
      const fundraiserRef = doc(db, 'fundraisers', fundraiserId);
      await updateDoc(fundraiserRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Fundraiser status updated successfully');
    } catch (error) {
      console.error('❌ Error updating fundraiser status:', error);
      throw new Error('Failed to update fundraiser status');
    }
  }

  /**
   * Update fundraiser
   */
  static async updateFundraiser(
    fundraiserId: string,
    updates: Partial<Fundraiser>
  ): Promise<void> {
    try {
      const fundraiserRef = doc(db, 'fundraisers', fundraiserId);
      await updateDoc(fundraiserRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Fundraiser updated successfully');
    } catch (error) {
      console.error('❌ Error updating fundraiser:', error);
      throw new Error('Failed to update fundraiser');
    }
  }

  /**
   * Get fundraisers by category
   */
  static async getFundraisersByCategory(
    category: FundraiserCategory
  ): Promise<Fundraiser[]> {
    try {
      const q = query(
        collection(db, 'fundraisers'),
        where('category', '==', category),
        where('status', '==', FundraiserStatus.ACTIVE),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Fundraiser)
      );
    } catch (error) {
      console.error('❌ Error fetching fundraisers by category:', error);
      throw new Error('Failed to fetch fundraisers by category');
    }
  }

  /**
   * Search fundraisers
   */
  static async searchFundraisers(searchTerm: string): Promise<Fundraiser[]> {
    try {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const allFundraisers = await this.getActiveFundraisers(100);

      return allFundraisers.filter(
        (fundraiser) =>
          fundraiser.title.toLowerCase().includes(lowerSearchTerm) ||
          fundraiser.description.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error('❌ Error searching fundraisers:', error);
      throw new Error('Failed to search fundraisers');
    }
  }
}

export default FundraiserService;
