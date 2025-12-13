/**
 * Problem Service
 * Handles problem reporting and management
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
import {
  Problem,
  ProblemCategory,
  ProblemSeverity,
  ProblemStatus,
  Media,
  Location,
} from '../types';
import { uploadMultipleImages } from './storageService';

export class ProblemService {
  /**
   * Report a new problem
   */
  static async reportProblem(
    userId: string,
    userName: string,
    villageId: string,
    villageName: string,
    title: string,
    description: string,
    category: ProblemCategory,
    severity: ProblemSeverity,
    mediaUris?: string[],
    location?: Location,
    userAvatar?: string
  ): Promise<string> {
    try {
      const problemRef = doc(collection(db, 'problems'));
      let media: Media[] = [];

      // Upload media if provided
      if (mediaUris && mediaUris.length > 0) {
        const uploadedUrls = await uploadMultipleImages(
          mediaUris,
          `problems/${problemRef.id}`
        );
        media = uploadedUrls.map((url) => ({ type: 'image', url }));
      }

      const problemData: Omit<Problem, 'id'> = {
        userId,
        userName,
        userAvatar,
        villageId,
        villageName,
        title,
        description,
        category,
        severity,
        status: ProblemStatus.REPORTED,
        media,
        location,
        upvotes: [],
        upvoteCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(problemRef, problemData);
      console.log('✅ Problem reported successfully');
      return problemRef.id;
    } catch (error) {
      console.error('❌ Error reporting problem:', error);
      throw new Error('Failed to report problem');
    }
  }

  /**
   * Get problem by ID
   */
  static async getProblem(problemId: string): Promise<Problem | null> {
    try {
      const problemDoc = await getDoc(doc(db, 'problems', problemId));
      if (problemDoc.exists()) {
        return { id: problemDoc.id, ...problemDoc.data() } as Problem;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching problem:', error);
      return null;
    }
  }

  /**
   * Get village problems
   */
  static async getVillageProblems(
    villageId: string,
    status?: ProblemStatus
  ): Promise<Problem[]> {
    try {
      let q = query(
        collection(db, 'problems'),
        where('villageId', '==', villageId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Problem)
      );
    } catch (error) {
      console.error('❌ Error fetching village problems:', error);
      throw new Error('Failed to fetch village problems');
    }
  }

  /**
   * Get problems by category
   */
  static async getProblemsByCategory(
    category: ProblemCategory,
    villageId?: string
  ): Promise<Problem[]> {
    try {
      let q = query(
        collection(db, 'problems'),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );

      if (villageId) {
        q = query(q, where('villageId', '==', villageId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Problem)
      );
    } catch (error) {
      console.error('❌ Error fetching problems by category:', error);
      throw new Error('Failed to fetch problems by category');
    }
  }

  /**
   * Get problems by severity
   */
  static async getProblemsBySeverity(
    severity: ProblemSeverity,
    villageId?: string
  ): Promise<Problem[]> {
    try {
      let q = query(
        collection(db, 'problems'),
        where('severity', '==', severity),
        orderBy('upvoteCount', 'desc')
      );

      if (villageId) {
        q = query(q, where('villageId', '==', villageId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Problem)
      );
    } catch (error) {
      console.error('❌ Error fetching problems by severity:', error);
      throw new Error('Failed to fetch problems by severity');
    }
  }

  /**
   * Upvote a problem
   */
  static async upvoteProblem(problemId: string, userId: string): Promise<void> {
    try {
      const problemRef = doc(db, 'problems', problemId);
      await updateDoc(problemRef, {
        upvotes: arrayUnion(userId),
        upvoteCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Problem upvoted successfully');
    } catch (error) {
      console.error('❌ Error upvoting problem:', error);
      throw new Error('Failed to upvote problem');
    }
  }

  /**
   * Remove upvote from problem
   */
  static async removeUpvote(problemId: string, userId: string): Promise<void> {
    try {
      const problemRef = doc(db, 'problems', problemId);
      await updateDoc(problemRef, {
        upvotes: arrayRemove(userId),
        upvoteCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Upvote removed successfully');
    } catch (error) {
      console.error('❌ Error removing upvote:', error);
      throw new Error('Failed to remove upvote');
    }
  }

  /**
   * Update problem status
   */
  static async updateProblemStatus(
    problemId: string,
    status: ProblemStatus,
    assignedTo?: string,
    resolvedBy?: string
  ): Promise<void> {
    try {
      const updates: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (assignedTo) {
        updates.assignedTo = assignedTo;
      }

      if (status === ProblemStatus.RESOLVED && resolvedBy) {
        updates.resolvedBy = resolvedBy;
        updates.resolvedAt = serverTimestamp();
      }

      const problemRef = doc(db, 'problems', problemId);
      await updateDoc(problemRef, updates);
      console.log('✅ Problem status updated successfully');
    } catch (error) {
      console.error('❌ Error updating problem status:', error);
      throw new Error('Failed to update problem status');
    }
  }

  /**
   * Update problem
   */
  static async updateProblem(
    problemId: string,
    updates: Partial<Problem>
  ): Promise<void> {
    try {
      const problemRef = doc(db, 'problems', problemId);
      await updateDoc(problemRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Problem updated successfully');
    } catch (error) {
      console.error('❌ Error updating problem:', error);
      throw new Error('Failed to update problem');
    }
  }

  /**
   * Get trending problems (most upvoted)
   */
  static async getTrendingProblems(
    villageId?: string,
    pageSize: number = 10
  ): Promise<Problem[]> {
    try {
      let q = query(
        collection(db, 'problems'),
        where('status', 'in', [
          ProblemStatus.REPORTED,
          ProblemStatus.ACKNOWLEDGED,
          ProblemStatus.IN_PROGRESS,
        ]),
        orderBy('upvoteCount', 'desc'),
        limit(pageSize)
      );

      if (villageId) {
        q = query(q, where('villageId', '==', villageId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Problem)
      );
    } catch (error) {
      console.error('❌ Error fetching trending problems:', error);
      throw new Error('Failed to fetch trending problems');
    }
  }

  /**
   * Get user reported problems
   */
  static async getUserProblems(userId: string): Promise<Problem[]> {
    try {
      const q = query(
        collection(db, 'problems'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Problem)
      );
    } catch (error) {
      console.error('❌ Error fetching user problems:', error);
      throw new Error('Failed to fetch user problems');
    }
  }

  /**
   * Search problems
   */
  static async searchProblems(
    searchTerm: string,
    villageId?: string
  ): Promise<Problem[]> {
    try {
      const lowerSearchTerm = searchTerm.toLowerCase();
      let problems: Problem[];

      if (villageId) {
        problems = await this.getVillageProblems(villageId);
      } else {
        const q = query(collection(db, 'problems'), limit(100));
        const snapshot = await getDocs(q);
        problems = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Problem)
        );
      }

      return problems.filter(
        (problem) =>
          problem.title.toLowerCase().includes(lowerSearchTerm) ||
          problem.description.toLowerCase().includes(lowerSearchTerm)
      );
    } catch (error) {
      console.error('❌ Error searching problems:', error);
      throw new Error('Failed to search problems');
    }
  }
}

export default ProblemService;
