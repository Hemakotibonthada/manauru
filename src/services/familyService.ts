/**
 * Family Service
 * Manages family trees, members, and relations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  FamilyTree,
  FamilyMember,
  FamilyRelation,
  FamilyTreeNode,
  FamilyEvent,
  FamilyRelationType,
} from '../types';

export class FamilyService {
  // ============= Family Tree Operations =============

  /**
   * Create a new family tree
   */
  static async createFamilyTree(
    name: string,
    description: string,
    rootMember: Omit<FamilyMember, 'id' | 'familyTreeId' | 'createdAt' | 'updatedAt' | 'generation'>,
    ownerId: string,
    isPublic: boolean = false
  ): Promise<string> {
    try {
      const treeRef = doc(collection(db, 'family_trees'));
      const memberRef = doc(collection(db, 'family_members'));

      const batch = writeBatch(db);

      // Create family tree
      const treeData: Omit<FamilyTree, 'id'> = {
        name,
        description,
        rootMemberId: memberRef.id,
        ownerId,
        collaborators: [],
        viewers: [],
        villageId: undefined,
        isPublic,
        memberCount: 1,
        generationCount: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      batch.set(treeRef, treeData);

      // Create root member
      const memberData: Omit<FamilyMember, 'id'> = {
        ...rootMember,
        familyTreeId: treeRef.id,
        generation: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      batch.set(memberRef, memberData);

      await batch.commit();

      return treeRef.id;
    } catch (error) {
      console.error('Error creating family tree:', error);
      throw error;
    }
  }

  /**
   * Get family tree by ID
   */
  static async getFamilyTree(treeId: string): Promise<FamilyTree | null> {
    try {
      const treeDoc = await getDoc(doc(db, 'family_trees', treeId));
      if (treeDoc.exists()) {
        return { id: treeDoc.id, ...treeDoc.data() } as FamilyTree;
      }
      return null;
    } catch (error) {
      console.error('Error getting family tree:', error);
      throw error;
    }
  }

  /**
   * Get all family trees for a user
   */
  static async getUserFamilyTrees(userId: string): Promise<FamilyTree[]> {
    try {
      const q = query(
        collection(db, 'family_trees'),
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FamilyTree));
    } catch (error) {
      console.error('Error getting user family trees:', error);
      throw error;
    }
  }

  /**
   * Get public family trees
   */
  static async getPublicFamilyTrees(): Promise<FamilyTree[]> {
    try {
      const q = query(
        collection(db, 'family_trees'),
        where('isPublic', '==', true),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FamilyTree));
    } catch (error) {
      console.error('Error getting public family trees:', error);
      throw error;
    }
  }

  /**
   * Update family tree
   */
  static async updateFamilyTree(
    treeId: string,
    updates: Partial<FamilyTree>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'family_trees', treeId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating family tree:', error);
      throw error;
    }
  }

  /**
   * Delete family tree (and all members and relations)
   */
  static async deleteFamilyTree(treeId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete tree
      batch.delete(doc(db, 'family_trees', treeId));

      // Delete all members
      const membersQuery = query(
        collection(db, 'family_members'),
        where('familyTreeId', '==', treeId)
      );
      const membersSnapshot = await getDocs(membersQuery);
      membersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete all relations
      const relationsQuery = query(
        collection(db, 'family_relations'),
        where('familyTreeId', '==', treeId)
      );
      const relationsSnapshot = await getDocs(relationsQuery);
      relationsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete all events
      const eventsQuery = query(
        collection(db, 'family_events'),
        where('familyTreeId', '==', treeId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      eventsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
    } catch (error) {
      console.error('Error deleting family tree:', error);
      throw error;
    }
  }

  // ============= Family Member Operations =============

  /**
   * Add a family member
   */
  static async addFamilyMember(
    member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>,
    parentId?: string,
    relationType?: FamilyRelationType
  ): Promise<string> {
    try {
      const memberRef = doc(collection(db, 'family_members'));
      const batch = writeBatch(db);

      // Add member
      const memberData: Omit<FamilyMember, 'id'> = {
        ...member,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      batch.set(memberRef, memberData);

      // Create relation if parent specified
      if (parentId && relationType) {
        const relationRef = doc(collection(db, 'family_relations'));
        const relationData: Omit<FamilyRelation, 'id'> = {
          familyTreeId: member.familyTreeId,
          fromMemberId: parentId,
          toMemberId: memberRef.id,
          relationType,
          createdBy: member.createdBy,
          createdAt: Timestamp.now(),
        };
        batch.set(relationRef, relationData);
      }

      // Update tree member count
      const treeRef = doc(db, 'family_trees', member.familyTreeId);
      batch.update(treeRef, {
        memberCount: arrayUnion(memberRef.id),
        updatedAt: Timestamp.now(),
      });

      await batch.commit();

      return memberRef.id;
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  }

  /**
   * Get family member by ID
   */
  static async getFamilyMember(memberId: string): Promise<FamilyMember | null> {
    try {
      const memberDoc = await getDoc(doc(db, 'family_members', memberId));
      if (memberDoc.exists()) {
        return { id: memberDoc.id, ...memberDoc.data() } as FamilyMember;
      }
      return null;
    } catch (error) {
      console.error('Error getting family member:', error);
      throw error;
    }
  }

  /**
   * Get all members of a family tree
   */
  static async getTreeMembers(treeId: string): Promise<FamilyMember[]> {
    try {
      const q = query(
        collection(db, 'family_members'),
        where('familyTreeId', '==', treeId),
        orderBy('generation', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FamilyMember));
    } catch (error) {
      console.error('Error getting tree members:', error);
      throw error;
    }
  }

  /**
   * Update family member
   */
  static async updateFamilyMember(
    memberId: string,
    updates: Partial<FamilyMember>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'family_members', memberId), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating family member:', error);
      throw error;
    }
  }

  /**
   * Delete family member
   */
  static async deleteFamilyMember(memberId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete member
      batch.delete(doc(db, 'family_members', memberId));

      // Delete all relations involving this member
      const relationsQuery = query(
        collection(db, 'family_relations'),
        where('fromMemberId', '==', memberId)
      );
      const relationsSnapshot = await getDocs(relationsQuery);
      relationsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

      const relationsQuery2 = query(
        collection(db, 'family_relations'),
        where('toMemberId', '==', memberId)
      );
      const relationsSnapshot2 = await getDocs(relationsQuery2);
      relationsSnapshot2.docs.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
    } catch (error) {
      console.error('Error deleting family member:', error);
      throw error;
    }
  }

  // ============= Family Relations Operations =============

  /**
   * Create a relation between two members
   */
  static async createRelation(
    familyTreeId: string,
    fromMemberId: string,
    toMemberId: string,
    relationType: FamilyRelationType,
    createdBy: string
  ): Promise<string> {
    try {
      const relationRef = doc(collection(db, 'family_relations'));

      const relationData: Omit<FamilyRelation, 'id'> = {
        familyTreeId,
        fromMemberId,
        toMemberId,
        relationType,
        createdBy,
        createdAt: Timestamp.now(),
      };

      await setDoc(relationRef, relationData);

      return relationRef.id;
    } catch (error) {
      console.error('Error creating relation:', error);
      throw error;
    }
  }

  /**
   * Get all relations for a family tree
   */
  static async getTreeRelations(treeId: string): Promise<FamilyRelation[]> {
    try {
      const q = query(
        collection(db, 'family_relations'),
        where('familyTreeId', '==', treeId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FamilyRelation));
    } catch (error) {
      console.error('Error getting tree relations:', error);
      throw error;
    }
  }

  /**
   * Get relations for a specific member
   */
  static async getMemberRelations(memberId: string): Promise<FamilyRelation[]> {
    try {
      const q1 = query(
        collection(db, 'family_relations'),
        where('fromMemberId', '==', memberId)
      );
      const q2 = query(
        collection(db, 'family_relations'),
        where('toMemberId', '==', memberId)
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const relations1 = snapshot1.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FamilyRelation));
      const relations2 = snapshot2.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FamilyRelation));

      return [...relations1, ...relations2];
    } catch (error) {
      console.error('Error getting member relations:', error);
      throw error;
    }
  }

  /**
   * Delete a relation
   */
  static async deleteRelation(relationId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'family_relations', relationId));
    } catch (error) {
      console.error('Error deleting relation:', error);
      throw error;
    }
  }

  // ============= Family Tree Building =============

  /**
   * Build complete family tree structure
   */
  static async buildFamilyTree(treeId: string): Promise<FamilyTreeNode> {
    try {
      const [tree, members, relations] = await Promise.all([
        this.getFamilyTree(treeId),
        this.getTreeMembers(treeId),
        this.getTreeRelations(treeId),
      ]);

      if (!tree) throw new Error('Family tree not found');

      const rootMember = members.find((m) => m.id === tree.rootMemberId);
      if (!rootMember) throw new Error('Root member not found');

      return this.buildTreeNode(rootMember, members, relations);
    } catch (error) {
      console.error('Error building family tree:', error);
      throw error;
    }
  }

  /**
   * Build tree node recursively
   */
  private static buildTreeNode(
    member: FamilyMember,
    allMembers: FamilyMember[],
    allRelations: FamilyRelation[]
  ): FamilyTreeNode {
    // Find spouse
    const spouseRelation = allRelations.find(
      (r) =>
        (r.fromMemberId === member.id || r.toMemberId === member.id) &&
        r.relationType === FamilyRelationType.SPOUSE
    );
    const spouse = spouseRelation
      ? allMembers.find(
          (m) =>
            m.id ===
            (spouseRelation.fromMemberId === member.id
              ? spouseRelation.toMemberId
              : spouseRelation.fromMemberId)
        )
      : undefined;

    // Find children
    const childRelations = allRelations.filter(
      (r) =>
        r.fromMemberId === member.id &&
        (r.relationType === FamilyRelationType.SON ||
          r.relationType === FamilyRelationType.DAUGHTER)
    );
    const children = childRelations
      .map((r) => allMembers.find((m) => m.id === r.toMemberId))
      .filter((m): m is FamilyMember => m !== undefined)
      .map((child) => this.buildTreeNode(child, allMembers, allRelations));

    // Find parents
    const parentRelations = allRelations.filter(
      (r) =>
        r.toMemberId === member.id &&
        (r.relationType === FamilyRelationType.FATHER ||
          r.relationType === FamilyRelationType.MOTHER)
    );
    const parents = parentRelations
      .map((r) => allMembers.find((m) => m.id === r.fromMemberId))
      .filter((m): m is FamilyMember => m !== undefined);

    // Find siblings
    const siblingRelations = allRelations.filter(
      (r) =>
        (r.fromMemberId === member.id || r.toMemberId === member.id) &&
        (r.relationType === FamilyRelationType.BROTHER ||
          r.relationType === FamilyRelationType.SISTER)
    );
    const siblings = siblingRelations
      .map((r) =>
        allMembers.find(
          (m) =>
            m.id ===
            (r.fromMemberId === member.id ? r.toMemberId : r.fromMemberId)
        )
      )
      .filter((m): m is FamilyMember => m !== undefined);

    // Get all relations for this member
    const memberRelations = allRelations.filter(
      (r) => r.fromMemberId === member.id || r.toMemberId === member.id
    );

    return {
      member,
      spouse,
      children,
      parents,
      siblings,
      relations: memberRelations,
    };
  }

  // ============= Family Events =============

  /**
   * Create a family event
   */
  static async createFamilyEvent(
    event: Omit<FamilyEvent, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const eventRef = doc(collection(db, 'family_events'));

      const eventData: Omit<FamilyEvent, 'id'> = {
        ...event,
        createdAt: Timestamp.now(),
      };

      await setDoc(eventRef, eventData);

      return eventRef.id;
    } catch (error) {
      console.error('Error creating family event:', error);
      throw error;
    }
  }

  /**
   * Get events for a family tree
   */
  static async getTreeEvents(treeId: string): Promise<FamilyEvent[]> {
    try {
      const q = query(
        collection(db, 'family_events'),
        where('familyTreeId', '==', treeId),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FamilyEvent));
    } catch (error) {
      console.error('Error getting tree events:', error);
      throw error;
    }
  }

  // ============= Search and Discovery =============

  /**
   * Search family members by name
   */
  static async searchMembers(treeId: string, searchTerm: string): Promise<FamilyMember[]> {
    try {
      const members = await this.getTreeMembers(treeId);
      const lowerSearch = searchTerm.toLowerCase();

      return members.filter(
        (m) =>
          m.firstName.toLowerCase().includes(lowerSearch) ||
          m.lastName.toLowerCase().includes(lowerSearch) ||
          m.displayName.toLowerCase().includes(lowerSearch)
      );
    } catch (error) {
      console.error('Error searching members:', error);
      throw error;
    }
  }

  /**
   * Find connection between two members
   */
  static async findConnection(
    treeId: string,
    member1Id: string,
    member2Id: string
  ): Promise<FamilyMember[]> {
    try {
      if (member1Id === member2Id) {
        const member = await this.getFamilyMember(member1Id);
        return member ? [member] : [];
      }

      const members = await this.getTreeMembers(treeId);
      const relations = await this.getTreeRelations(treeId);

      // Build adjacency list for BFS
      const adjacencyMap = new Map<string, string[]>();
      members.forEach((member) => adjacencyMap.set(member.id!, []));

      relations.forEach((relation) => {
        const neighbors = adjacencyMap.get(relation.fromMemberId) || [];
        neighbors.push(relation.toMemberId);
        adjacencyMap.set(relation.fromMemberId, neighbors);

        const neighbors2 = adjacencyMap.get(relation.toMemberId) || [];
        neighbors2.push(relation.fromMemberId);
        adjacencyMap.set(relation.toMemberId, neighbors2);
      });

      // BFS to find shortest path
      const queue: { id: string; path: string[] }[] = [{ id: member1Id, path: [member1Id] }];
      const visited = new Set<string>([member1Id]);

      while (queue.length > 0) {
        const { id: currentId, path } = queue.shift()!;

        if (currentId === member2Id) {
          // Found the connection - map IDs to FamilyMember objects
          return path
            .map((id) => members.find((m) => m.id === id))
            .filter((m): m is FamilyMember => m !== undefined);
        }

        const neighbors = adjacencyMap.get(currentId) || [];
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({ id: neighborId, path: [...path, neighborId] });
          }
        }
      }

      // No connection found
      return [];
    } catch (error) {
      console.error('Error finding connection:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a family tree
   */
  static async getTreeStatistics(treeId: string): Promise<{
    totalMembers: number;
    livingMembers: number;
    generations: number;
    marriages: number;
    averageAge: number;
  }> {
    try {
      const members = await this.getTreeMembers(treeId);
      const relations = await this.getTreeRelations(treeId);

      const livingMembers = members.filter((m) => m.isAlive).length;
      const marriages = relations.filter(
        (r) => r.relationType === FamilyRelationType.SPOUSE
      ).length;

      const generations = Math.max(...members.map((m) => Math.abs(m.generation))) + 1;

      const ages = members
        .filter((m) => m.isAlive && m.dateOfBirth)
        .map((m) => {
          const birthYear = new Date(m.dateOfBirth!).getFullYear();
          return new Date().getFullYear() - birthYear;
        });

      const averageAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

      return {
        totalMembers: members.length,
        livingMembers,
        generations,
        marriages,
        averageAge: Math.round(averageAge),
      };
    } catch (error) {
      console.error('Error getting tree statistics:', error);
      throw error;
    }
  }
}

export default FamilyService;
