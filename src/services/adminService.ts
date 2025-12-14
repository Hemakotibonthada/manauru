/**
 * Admin Service
 * Administrative functions and analytics
 */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, UserRole, AdminStats, AuditLog, Report } from '../types';

export class AdminService {
  /**
   * Get admin dashboard statistics
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Get new users today
      const newUsersQuery = query(
        collection(db, 'users'),
        where('createdAt', '>=', Timestamp.fromDate(todayStart))
      );
      const newUsersSnapshot = await getDocs(newUsersQuery);
      const newUsersToday = newUsersSnapshot.size;

      // Get total villages
      const villagesSnapshot = await getDocs(collection(db, 'villages'));
      const totalVillages = villagesSnapshot.size;

      // Get total posts
      const postsSnapshot = await getDocs(collection(db, 'posts'));
      const totalPosts = postsSnapshot.size;

      // Get total groups
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      const totalGroups = groupsSnapshot.size;

      // Get reported content
      const reportsQuery = query(
        collection(db, 'reports'),
        where('status', '==', 'pending')
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportedContent = reportsSnapshot.size;

      // Active users (logged in last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const activeUsersQuery = query(
        collection(db, 'users'),
        where('updatedAt', '>=', Timestamp.fromDate(sevenDaysAgo))
      );
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      const activeUsers = activeUsersSnapshot.size;

      return {
        totalUsers,
        totalVillages,
        totalPosts,
        totalGroups,
        activeUsers,
        newUsersToday,
        reportedContent,
        pendingApprovals: 0, // Placeholder
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, newRole: UserRole, adminId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
      });

      // Log the action
      await this.createAuditLog({
        userId: adminId,
        action: 'UPDATE_USER_ROLE',
        targetType: 'user',
        targetId: userId,
        details: `Changed role to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Ban/Unban user
   */
  static async banUser(userId: string, banned: boolean, adminId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        banned,
        updatedAt: serverTimestamp(),
      });

      await this.createAuditLog({
        userId: adminId,
        action: banned ? 'BAN_USER' : 'UNBAN_USER',
        targetType: 'user',
        targetId: userId,
        details: banned ? 'User banned' : 'User unbanned',
      });
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  }

  /**
   * Get all users with filters
   */
  static async getUsers(
    filters?: {
      role?: UserRole;
      villageId?: string;
      verified?: boolean;
    },
    limitCount = 50
  ): Promise<User[]> {
    try {
      let q = query(collection(db, 'users'), limit(limitCount));

      if (filters?.role) {
        q = query(q, where('role', '==', filters.role));
      }
      if (filters?.villageId) {
        q = query(q, where('villageId', '==', filters.villageId));
      }
      if (filters?.verified !== undefined) {
        q = query(q, where('verified', '==', filters.verified));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete or hard delete)
   */
  static async deleteUser(userId: string, adminId: string, hardDelete = false): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);

      if (hardDelete) {
        await deleteDoc(userRef);
      } else {
        await updateDoc(userRef, {
          deleted: true,
          deletedAt: serverTimestamp(),
          deletedBy: adminId,
        });
      }

      await this.createAuditLog({
        userId: adminId,
        action: 'DELETE_USER',
        targetType: 'user',
        targetId: userId,
        details: hardDelete ? 'Hard delete' : 'Soft delete',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get reports
   */
  static async getReports(status?: string): Promise<Report[]> {
    try {
      let q = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      if (status) {
        q = query(collection(db, 'reports'), where('status', '==', status));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Report));
    } catch (error) {
      console.error('Error getting reports:', error);
      // Return empty array if index not available
      return [];
    }
  }

  /**
   * Update report status
   */
  static async updateReport(
    reportId: string,
    status: string,
    resolution: string,
    adminId: string
  ): Promise<void> {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status,
        resolution,
        reviewedBy: adminId,
        reviewedAt: serverTimestamp(),
      });

      await this.createAuditLog({
        userId: adminId,
        action: 'REVIEW_REPORT',
        targetType: 'report',
        targetId: reportId,
        details: `Status: ${status}, Resolution: ${resolution}`,
      });
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  /**
   * Create audit log
   */
  static async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'userName'>): Promise<void> {
    try {
      const userDoc = await getDoc(doc(db, 'users', log.userId));
      const userName = userDoc.exists() ? userDoc.data().displayName : 'Unknown';

      const auditLogRef = doc(collection(db, 'auditLogs'));
      await setDoc(auditLogRef, {
        ...log,
        userName,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw - audit log failure shouldn't break main operation
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(limitCount = 100): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  /**
   * Delete content (post, comment, etc.)
   */
  static async deleteContent(
    contentType: string,
    contentId: string,
    adminId: string
  ): Promise<void> {
    try {
      const contentRef = doc(db, contentType, contentId);
      await deleteDoc(contentRef);

      await this.createAuditLog({
        userId: adminId,
        action: 'DELETE_CONTENT',
        targetType: contentType,
        targetId: contentId,
        details: `Deleted ${contentType}`,
      });
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivity(userId: string): Promise<any> {
    try {
      // Get user's posts
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);

      // Get user's comments
      const commentsQuery = query(collection(db, 'comments'), where('userId', '==', userId));
      const commentsSnapshot = await getDocs(commentsQuery);

      return {
        postsCount: postsSnapshot.size,
        commentsCount: commentsSnapshot.size,
        lastActive: new Date(), // Would need to track this
      };
    } catch (error) {
      console.error('Error getting user activity:', error);
      return { postsCount: 0, commentsCount: 0 };
    }
  }
}
