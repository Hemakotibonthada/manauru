/**
 * Family Tree Screen
 * Main screen for viewing and managing family trees
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { FamilyService } from '../services/familyService';
import { FamilyTree, FamilyTreeNode, FamilyMember, Gender } from '../types';

export default function FamilyTreeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [selectedTree, setSelectedTree] = useState<FamilyTree | null>(null);
  const [treeStructure, setTreeStructure] = useState<FamilyTreeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FamilyMember[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New tree form state
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeDescription, setNewTreeDescription] = useState('');
  const [rootFirstName, setRootFirstName] = useState('');
  const [rootLastName, setRootLastName] = useState('');
  const [rootDateOfBirth, setRootDateOfBirth] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    loadUserTrees();
  }, []);

  useEffect(() => {
    if (selectedTree) {
      loadTreeStructure(selectedTree.id);
    }
  }, [selectedTree]);

  useEffect(() => {
    if (searchQuery.length > 0 && selectedTree) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadUserTrees = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userTrees = await FamilyService.getUserFamilyTrees(user.id);
      const publicTrees = await FamilyService.getPublicFamilyTrees();

      // Combine and deduplicate
      const allTrees = [...userTrees];
      publicTrees.forEach((pt) => {
        if (!allTrees.find((t) => t.id === pt.id)) {
          allTrees.push(pt);
        }
      });

      setTrees(allTrees);

      // Auto-select first tree
      if (allTrees.length > 0 && !selectedTree) {
        setSelectedTree(allTrees[0]);
      }
    } catch (error) {
      console.error('Error loading trees:', error);
      Alert.alert('Error', 'Failed to load family trees');
    } finally {
      setLoading(false);
    }
  };

  const loadTreeStructure = async (treeId: string) => {
    try {
      const structure = await FamilyService.buildFamilyTree(treeId);
      setTreeStructure(structure);
    } catch (error) {
      console.error('Error loading tree structure:', error);
      Alert.alert('Error', 'Failed to load tree structure');
    }
  };

  const performSearch = async () => {
    if (!selectedTree) return;

    try {
      const results = await FamilyService.searchMembers(selectedTree.id, searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching members:', error);
    }
  };

  const handleCreateTree = async () => {
    if (!user) return;
    if (!newTreeName.trim() || !rootFirstName.trim() || !rootLastName.trim()) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      setLoading(true);

      const rootMember = {
        firstName: rootFirstName.trim(),
        lastName: rootLastName.trim(),
        displayName: `${rootFirstName.trim()} ${rootLastName.trim()}`,
        dateOfBirth: rootDateOfBirth || undefined,
        dateOfDeath: undefined,
        gender: user.gender || Gender.MALE,
        occupation: undefined,
        bio: undefined,
        userId: user.id,
        photoURL: user.photoURL,
        isAlive: true,
        generation: 0,
        createdBy: user.id,
      };

      const treeId = await FamilyService.createFamilyTree(
        newTreeName.trim(),
        newTreeDescription.trim(),
        rootMember,
        user.id,
        isPublic
      );

      // Reset form
      setNewTreeName('');
      setNewTreeDescription('');
      setRootFirstName('');
      setRootLastName('');
      setRootDateOfBirth('');
      setIsPublic(false);
      setShowCreateModal(false);

      // Reload trees
      await loadUserTrees();

      Alert.alert('Success', 'Family tree created successfully');
    } catch (error) {
      console.error('Error creating tree:', error);
      Alert.alert('Error', 'Failed to create family tree');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTree = async (treeId: string) => {
    Alert.alert(
      'Delete Family Tree',
      'Are you sure? This will delete all members and relations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await FamilyService.deleteFamilyTree(treeId);
              await loadUserTrees();
              if (selectedTree?.id === treeId) {
                setSelectedTree(null);
                setTreeStructure(null);
              }
              Alert.alert('Success', 'Family tree deleted');
            } catch (error) {
              console.error('Error deleting tree:', error);
              Alert.alert('Error', 'Failed to delete family tree');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderTreeNode = (node: FamilyTreeNode, depth: number = 0) => {
    const { member, spouse, children } = node;

    return (
      <View key={member.id} style={[styles.nodeContainer, { marginLeft: depth * 40 }]}>
        <TouchableOpacity
          style={styles.memberCard}
          onPress={() => navigation.navigate('FamilyMemberDetail', { memberId: member.id })}
        >
          <View style={styles.memberInfo}>
            {member.photoURL && (
              <Ionicons name="person-circle" size={40} color="#3b82f6" />
            )}
            <View style={styles.memberText}>
              <Text style={styles.memberName}>{member.displayName}</Text>
              <Text style={styles.memberDetails}>
                {member.dateOfBirth ? `Born: ${member.dateOfBirth}` : ''}
                {!member.isAlive && member.dateOfDeath
                  ? ` - Died: ${member.dateOfDeath}`
                  : ''}
              </Text>
              {member.occupation && (
                <Text style={styles.memberOccupation}>{member.occupation}</Text>
              )}
            </View>
          </View>
          <View style={styles.generationBadge}>
            <Text style={styles.generationText}>Gen {Math.abs(member.generation)}</Text>
          </View>
        </TouchableOpacity>

        {spouse && (
          <TouchableOpacity
            style={[styles.memberCard, styles.spouseCard]}
            onPress={() => navigation.navigate('FamilyMemberDetail', { memberId: spouse.id })}
          >
            <Ionicons name="heart" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <View style={styles.memberInfo}>
              <View style={styles.memberText}>
                <Text style={styles.memberName}>{spouse.displayName}</Text>
                <Text style={styles.memberDetails}>Spouse</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {children && children.length > 0 && (
          <View style={styles.childrenContainer}>
            {children.map((child) => renderTreeNode(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderTreeSelector = () => (
    <View style={styles.treeSelectorContainer}>
      <Text style={styles.sectionTitle}>Select Family Tree</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {trees.map((tree) => (
          <TouchableOpacity
            key={tree.id}
            style={[
              styles.treeCard,
              selectedTree?.id === tree.id && styles.selectedTreeCard,
            ]}
            onPress={() => setSelectedTree(tree)}
          >
            <View style={styles.treeCardContent}>
              <Text style={styles.treeCardName}>{tree.name}</Text>
              <Text style={styles.treeCardDetails}>
                {tree.memberCount} members • {tree.generationCount} generations
              </Text>
              {tree.isPublic && (
                <View style={styles.publicBadge}>
                  <Ionicons name="globe" size={12} color="#10b981" />
                  <Text style={styles.publicText}>Public</Text>
                </View>
              )}
            </View>
            {tree.ownerId === user?.id && (
              <TouchableOpacity
                onPress={() => handleDeleteTree(tree.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchResults = () => {
    if (searchResults.length === 0) return null;

    return (
      <View style={styles.searchResultsContainer}>
        <Text style={styles.sectionTitle}>Search Results ({searchResults.length})</Text>
        {searchResults.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={styles.searchResultCard}
            onPress={() => navigation.navigate('FamilyMemberDetail', { memberId: member.id })}
          >
            <View style={styles.memberInfo}>
              <Ionicons name="person-circle" size={40} color="#3b82f6" />
              <View style={styles.memberText}>
                <Text style={styles.memberName}>{member.displayName}</Text>
                <Text style={styles.memberDetails}>
                  Generation {Math.abs(member.generation)}
                  {member.occupation && ` • ${member.occupation}`}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Family Tree</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.inputLabel}>Tree Name *</Text>
            <TextInput
              style={styles.input}
              value={newTreeName}
              onChangeText={setNewTreeName}
              placeholder="e.g., Smith Family Tree"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newTreeDescription}
              onChangeText={setNewTreeDescription}
              placeholder="Describe your family tree..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.sectionTitle}>Root Person (You or Family Founder)</Text>

            <Text style={styles.inputLabel}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={rootFirstName}
              onChangeText={setRootFirstName}
              placeholder="First name"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={rootLastName}
              onChangeText={setRootLastName}
              placeholder="Last name"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={rootDateOfBirth}
              onChangeText={setRootDateOfBirth}
              placeholder="1990-01-01"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsPublic(!isPublic)}
            >
              <Ionicons
                name={isPublic ? 'checkbox' : 'square-outline'}
                size={24}
                color="#3b82f6"
              />
              <Text style={styles.checkboxLabel}>Make tree public</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateTree}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create Tree</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && trees.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading family trees...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Family Tree</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tree Selector */}
      {renderTreeSelector()}

      {/* Search Bar */}
      {selectedTree && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search family members..."
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && renderSearchResults()}

      {/* Tree Visualization */}
      {selectedTree && treeStructure && searchResults.length === 0 && (
        <ScrollView style={styles.treeContainer}>
          <View style={styles.treeHeader}>
            <Text style={styles.treeName}>{selectedTree.name}</Text>
            <Text style={styles.treeDescription}>{selectedTree.description}</Text>
          </View>
          {renderTreeNode(treeStructure)}

          {/* Add Member Button */}
          <TouchableOpacity
            style={styles.addMemberButton}
            onPress={() =>
              navigation.navigate('AddFamilyMember', { treeId: selectedTree.id })
            }
          >
            <Ionicons name="person-add" size={24} color="#fff" />
            <Text style={styles.addMemberText}>Add Family Member</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Empty State */}
      {trees.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="git-network-outline" size={80} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Family Trees</Text>
          <Text style={styles.emptyText}>
            Create your first family tree to start tracking your family history
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.emptyButtonText}>Create Family Tree</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Modal */}
      {renderCreateModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 8,
  },
  treeSelectorContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  treeCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTreeCard: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  treeCardContent: {
    flex: 1,
  },
  treeCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  treeCardDetails: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  publicText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  searchResultCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  treeContainer: {
    flex: 1,
    padding: 16,
  },
  treeHeader: {
    marginBottom: 24,
  },
  treeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  treeDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  nodeContainer: {
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  spouseCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberText: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  memberDetails: {
    fontSize: 12,
    color: '#64748b',
  },
  memberOccupation: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
  },
  generationBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  generationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  childrenContainer: {
    marginLeft: 20,
    borderLeftWidth: 2,
    borderLeftColor: '#cbd5e1',
    paddingLeft: 20,
  },
  addMemberButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  addMemberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalForm: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
