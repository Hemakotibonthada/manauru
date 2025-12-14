/**
 * Group/Community Service
 * Handles all group-related operations including CRUD, membership, and posts
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import {
  Group,
  GroupCategory,
  GroupType,
  GroupMember,
  GroupRole,
  MemberStatus,
  GroupPost,
  GroupInvitation,
  InvitationStatus,
  Media,
} from '../types';

class GroupService {
  private groupsCollection = collection(db, 'groups');
  private membersCollection = collection(db, 'groupMembers');
  private postsCollection = collection(db, 'groupPosts');
  private invitationsCollection = collection(db, 'groupInvitations');

  // ============= Group CRUD Operations =============
  
  async createGroup(
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    name: string,
    description: string,
    category: GroupCategory,
    type: GroupType,
    coverImage?: string,
    villageId?: string,
    rules?: string[]
  ): Promise<string> {
    try {
      const groupData: any = {
        name,
        description,
        category,
        type,
        adminIds: [userId],
        moderatorIds: [],
        memberIds: [userId],
        memberCount: 1,
        rules: rules || [],
        tags: [],
        isPrivate: type !== GroupType.PUBLIC,
        requiresApproval: type === GroupType.PRIVATE,
        verified: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Only add optional fields if they have values
      if (coverImage) groupData.coverImage = coverImage;
      if (villageId) groupData.villageId = villageId;

      const docRef = await addDoc(this.groupsCollection, groupData);

      // Add creator as admin member
      const memberData: any = {
        groupId: docRef.id,
        userId,
        userName,
        role: GroupRole.ADMIN,
        joinedAt: Timestamp.now(),
        status: MemberStatus.ACTIVE,
      };

      if (userAvatar) memberData.userAvatar = userAvatar;

      await addDoc(this.membersCollection, memberData);

      return docRef.id;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async getGroup(groupId: string): Promise<Group | null> {
    try {
      const groupDoc = await getDoc(doc(this.groupsCollection, groupId));
      if (!groupDoc.exists()) return null;
      return { id: groupDoc.id, ...groupDoc.data() } as Group;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  }

  async getAllGroups(limitCount: number = 50): Promise<Group[]> {
    try {
      const q = query(
        this.groupsCollection,
        where('isPrivate', '==', false),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Group));
    } catch (error: any) {
      if (error?.code === 'failed-precondition') {
        console.warn('Firebase index not created yet, using simple query');
        // Fallback: get all groups without ordering
        const q = query(this.groupsCollection, limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Group))
          .filter((g) => !g.isPrivate);
      }
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  async getGroupsByCategory(category: GroupCategory, limitCount: number = 50): Promise<Group[]> {
    try {
      const q = query(
        this.groupsCollection,
        where('category', '==', category),
        where('isPrivate', '==', false),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Group));
    } catch (error: any) {
      if (error?.code === 'failed-precondition') {
        console.warn('Firebase index not created yet, using simple query');
        // Fallback: filter in memory
        const q = query(this.groupsCollection, limit(limitCount));
        const snapshot = await getDocs(q);
        return snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Group))
          .filter((g) => g.category === category && !g.isPrivate);
      }
      console.error('Error fetching groups by category:', error);
      return [];
    }
  }

  async getGroupsByVillage(villageId: string): Promise<Group[]> {
    try {
      const q = query(
        this.groupsCollection,
        where('villageId', '==', villageId),
        orderBy('memberCount', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Group));
    } catch (error) {
      console.error('Error fetching village groups:', error);
      throw error;
    }
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const q = query(
        this.groupsCollection,
        where('memberIds', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Group));
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw error;
    }
  }

  async updateGroup(
    groupId: string,
    updates: Partial<Omit<Group, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const groupRef = doc(this.groupsCollection, groupId);
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  async deleteGroup(groupId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete group
      batch.delete(doc(this.groupsCollection, groupId));

      // Delete all members
      const membersQuery = query(this.membersCollection, where('groupId', '==', groupId));
      const membersSnapshot = await getDocs(membersQuery);
      membersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete all posts
      const postsQuery = query(this.postsCollection, where('groupId', '==', groupId));
      const postsSnapshot = await getDocs(postsQuery);
      postsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  // ============= Membership Operations =============

  async joinGroup(groupId: string, userId: string, userName: string, userAvatar?: string): Promise<void> {
    try {
      const group = await this.getGroup(groupId);
      if (!group) throw new Error('Group not found');

      const memberStatus = group.requiresApproval ? MemberStatus.PENDING : MemberStatus.ACTIVE;

      // Add member record
      await addDoc(this.membersCollection, {
        groupId,
        userId,
        userName,
        userAvatar,
        role: GroupRole.MEMBER,
        joinedAt: Timestamp.now(),
        status: memberStatus,
      });

      // Update group if approved
      if (memberStatus === MemberStatus.ACTIVE) {
        const groupRef = doc(this.groupsCollection, groupId);
        await updateDoc(groupRef, {
          memberIds: arrayUnion(userId),
          memberCount: increment(1),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    try {
      // Remove member record
      const membersQuery = query(
        this.membersCollection,
        where('groupId', '==', groupId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(membersQuery);
      
      if (!snapshot.empty) {
        await deleteDoc(snapshot.docs[0].ref);
      }

      // Update group
      const groupRef = doc(this.groupsCollection, groupId);
      await updateDoc(groupRef, {
        memberIds: arrayRemove(userId),
        adminIds: arrayRemove(userId),
        moderatorIds: arrayRemove(userId),
        memberCount: increment(-1),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const q = query(
        this.membersCollection,
        where('groupId', '==', groupId),
        where('status', '==', MemberStatus.ACTIVE),
        orderBy('joinedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }
  }

  async updateMemberRole(groupId: string, userId: string, newRole: GroupRole): Promise<void> {
    try {
      const membersQuery = query(
        this.membersCollection,
        where('groupId', '==', groupId),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(membersQuery);
      
      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, { role: newRole });

        // Update group arrays
        const groupRef = doc(this.groupsCollection, groupId);
        if (newRole === GroupRole.ADMIN) {
          await updateDoc(groupRef, {
            adminIds: arrayUnion(userId),
            moderatorIds: arrayRemove(userId),
          });
        } else if (newRole === GroupRole.MODERATOR) {
          await updateDoc(groupRef, {
            moderatorIds: arrayUnion(userId),
            adminIds: arrayRemove(userId),
          });
        } else {
          await updateDoc(groupRef, {
            adminIds: arrayRemove(userId),
            moderatorIds: arrayRemove(userId),
          });
        }
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      await this.leaveGroup(groupId, userId);
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  // ============= Group Posts Operations =============

  async createGroupPost(
    groupId: string,
    userId: string,
    userName: string,
    content: string,
    mediaUris?: string[],
    userAvatar?: string
  ): Promise<string> {
    try {
      let media: Media[] = [];

      if (mediaUris && mediaUris.length > 0) {
        media = await Promise.all(
          mediaUris.map(async (uri) => {
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `group_posts/${groupId}/${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);
            return { type: 'image' as const, url };
          })
        );
      }

      const postData = {
        groupId,
        userId,
        userName,
        userAvatar,
        content,
        media,
        likes: [],
        likeCount: 0,
        commentCount: 0,
        isPinned: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(this.postsCollection, postData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating group post:', error);
      throw error;
    }
  }

  async getGroupPosts(groupId: string, limitCount: number = 20): Promise<GroupPost[]> {
    try {
      const q = query(
        this.postsCollection,
        where('groupId', '==', groupId),
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GroupPost));
    } catch (error) {
      console.error('Error fetching group posts:', error);
      throw error;
    }
  }

  async likeGroupPost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(this.postsCollection, postId);
      await updateDoc(postRef, {
        likes: arrayUnion(userId),
        likeCount: increment(1),
      });
    } catch (error) {
      console.error('Error liking group post:', error);
      throw error;
    }
  }

  async unlikeGroupPost(postId: string, userId: string): Promise<void> {
    try {
      const postRef = doc(this.postsCollection, postId);
      await updateDoc(postRef, {
        likes: arrayRemove(userId),
        likeCount: increment(-1),
      });
    } catch (error) {
      console.error('Error unliking group post:', error);
      throw error;
    }
  }

  async deleteGroupPost(postId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.postsCollection, postId));
    } catch (error) {
      console.error('Error deleting group post:', error);
      throw error;
    }
  }

  // ============= Image Upload =============

  async uploadGroupImage(groupId: string, imageUri: string, type: 'cover' | 'profile'): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `groups/${groupId}/${type}_${Date.now()}`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading group image:', error);
      throw error;
    }
  }

  // ============= Search =============

  async searchGroups(searchTerm: string): Promise<Group[]> {
    try {
      const q = query(
        this.groupsCollection,
        where('isPrivate', '==', false),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      const groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Group));
      
      // Filter by search term (client-side filtering)
      return groups.filter(
        (group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching groups:', error);
      throw error;
    }
  }
}

export default new GroupService();
