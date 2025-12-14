/**
 * People Screen
 * Browse and search community members
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { colors, typography, spacing, borderRadius } from '../styles/theme';
import { User, Profession } from '../types';
import { useAuth } from '../hooks/useAuth';

type NavigationProp = StackNavigationProp<any>;

export default function PeopleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user: currentUser } = useAuth();
  const [people, setPeople] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfession, setFilterProfession] = useState<Profession | 'all'>('all');

  useEffect(() => {
    loadPeople();
  }, [filterProfession]);

  const loadPeople = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      let q;

      if (currentUser?.villageId) {
        if (filterProfession !== 'all') {
          q = query(
            usersRef,
            where('villageId', '==', currentUser.villageId),
            where('profession', '==', filterProfession),
            limit(100)
          );
        } else {
          q = query(
            usersRef,
            where('villageId', '==', currentUser.villageId),
            limit(100)
          );
        }
      } else {
        q = query(usersRef, limit(100));
      }

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      setPeople(users.filter((u) => u.id !== currentUser?.id));
    } catch (error) {
      console.error('Error loading people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPeople();
    setRefreshing(false);
  };

  const filteredPeople = people.filter((person: User) => {
    const matchesSearch =
      person.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.villageName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const professionFilters = [
    { value: 'all', label: 'All', icon: 'people-outline' },
    { value: Profession.FARMER, label: 'Farmer', icon: 'leaf-outline' },
    { value: Profession.TEACHER, label: 'Teacher', icon: 'school-outline' },
    { value: Profession.DOCTOR, label: 'Doctor', icon: 'medical-outline' },
    { value: Profession.ENGINEER, label: 'Engineer', icon: 'construct-outline' },
    { value: Profession.BUSINESSMAN, label: 'Business', icon: 'briefcase-outline' },
    { value: Profession.STUDENT, label: 'Student', icon: 'book-outline' },
    { value: Profession.GOVERNMENT_EMPLOYEE, label: 'Govt Job', icon: 'business-outline' },
  ];

  const getProfessionIcon = (profession?: Profession) => {
    switch (profession) {
      case Profession.FARMER:
        return 'leaf';
      case Profession.TEACHER:
        return 'school';
      case Profession.DOCTOR:
      case Profession.NURSE:
        return 'medical';
      case Profession.ENGINEER:
        return 'construct';
      case Profession.BUSINESSMAN:
      case Profession.SHOPKEEPER:
        return 'briefcase';
      case Profession.STUDENT:
        return 'book';
      case Profession.GOVERNMENT_EMPLOYEE:
      case Profession.PRIVATE_EMPLOYEE:
        return 'business';
      case Profession.DRIVER:
        return 'car';
      case Profession.ARTISAN:
      case Profession.CARPENTER:
        return 'hammer';
      default:
        return 'person';
    }
  };

  const renderPersonCard = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.personCard}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      {item.photoURL ? (
        <Image
          source={{ uri: item.photoURL }}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={40} color="#94a3b8" />
        </View>
      )}
      <View style={styles.personInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.displayName}
          </Text>
          {item.verified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary.main} />
          )}
        </View>

        {item.profession && (
          <View style={styles.professionRow}>
            <Ionicons
              name={getProfessionIcon(item.profession) as any}
              size={14}
              color={colors.text.secondary}
            />
            <Text style={styles.profession}>
              {item.customProfession || item.profession.replace(/_/g, ' ')}
            </Text>
          </View>
        )}

        {item.villageName && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.location} numberOfLines={1}>
              {item.villageName}
            </Text>
          </View>
        )}

        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsRow}>
            {item.skills.slice(0, 3).map((skill, index) => (
              <View style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {item.skills.length > 3 && (
              <Text style={styles.moreSkills}>+{item.skills.length - 3}</Text>
            )}
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyTitle}>No people found</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery
          ? 'Try adjusting your search'
          : 'No community members in your village yet'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.primary.main} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, profession..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Profession Filters */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={professionFilters}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              filterProfession === item.value && styles.selectedFilterChip,
            ]}
            onPress={() => setFilterProfession(item.value as Profession | 'all')}
          >
            <Ionicons
              name={item.icon as any}
              size={16}
              color={
                filterProfession === item.value
                  ? colors.background.default
                  : colors.text.secondary
              }
            />
            <Text
              style={[
                styles.filterText,
                filterProfession === item.value && styles.selectedFilterText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterList}
      />

      {/* People List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={filteredPeople}
          keyExtractor={(item) => item.id}
          renderItem={renderPersonCard}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary.main}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background.paper,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body1,
    color: colors.text.primary,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background.paper,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  selectedFilterChip: {
    backgroundColor: colors.primary.main,
  },
  filterText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  selectedFilterText: {
    color: colors.background.default,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
  },
  personInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  name: {
    ...typography.body1,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  professionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  profession: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  skillTag: {
    backgroundColor: colors.primary.main + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  skillText: {
    ...typography.caption,
    color: colors.primary.main,
    fontSize: 10,
  },
  moreSkills: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    paddingHorizontal: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
