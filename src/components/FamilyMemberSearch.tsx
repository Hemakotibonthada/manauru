/**
 * Family Member Search Component
 * Search and link family members (parents, spouse)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

interface FamilyMemberSearchProps {
  visible: boolean;
  onClose: () => void;
  onSelectMember: (member: User) => void;
  title: string;
  currentUserId: string;
  villageId?: string;
}

export const FamilyMemberSearch: React.FC<FamilyMemberSearchProps> = ({
  visible,
  onClose,
  onSelectMember,
  title,
  currentUserId,
  villageId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      let q = query(
        usersRef,
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );

      // If village filter is needed
      if (villageId) {
        q = query(
          usersRef,
          where('villageId', '==', villageId),
          where('displayName', '>=', searchQuery),
          where('displayName', '<=', searchQuery + '\uf8ff'),
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as User))
        .filter((user) => user.id !== currentUserId); // Exclude current user

      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (member: User) => {
    onSelectMember(member);
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  const renderMemberItem = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.memberItem} onPress={() => handleSelect(item)}>
      <Image
        source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.displayName}</Text>
        <Text style={styles.memberDetails}>
          {item.villageName ? `${item.villageName}` : 'No village'}
          {item.profession && ` • ${item.profession.replace(/_/g, ' ')}`}
        </Text>
        {item.phoneNumber && (
          <Text style={styles.memberPhone}>{item.phoneNumber}</Text>
        )}
      </View>
      <Ionicons name="add-circle" size={24} color={colors.primary.main} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name..."
                placeholderTextColor={colors.text.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary.main} />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.id}
              style={styles.resultsList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={colors.text.disabled} />
                  <Text style={styles.emptyText}>
                    {searchQuery.length > 0
                      ? 'No users found. Try a different search.'
                      : 'Search for family members by name'}
                  </Text>
                  <Text style={styles.emptyHint}>
                    Make sure they have an account in the app
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body1,
    color: colors.text.primary,
  },
  searchButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  searchButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  resultsList: {
    maxHeight: 400,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  memberDetails: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  memberPhone: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emptyContainer: {
    padding: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
