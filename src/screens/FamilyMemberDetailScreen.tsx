/**
 * Family Member Detail Screen
 * View and edit individual family member details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { FamilyService } from '../services/familyService';
import { FamilyMember, FamilyRelation, FamilyRelationType, FamilyEvent, Gender } from '../types';

interface FamilyMemberDetailScreenProps {
  route: {
    params: {
      memberId: string;
    };
  };
  navigation: any;
}

export default function FamilyMemberDetailScreen({
  route,
  navigation,
}: FamilyMemberDetailScreenProps) {
  const { user } = useAuth();
  const { memberId } = route.params;

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [relations, setRelations] = useState<FamilyRelation[]>([]);
  const [relatedMembers, setRelatedMembers] = useState<{
    [key: string]: FamilyMember;
  }>({});
  const [events, setEvents] = useState<FamilyEvent[]>([]);

  useEffect(() => {
    loadMemberData();
  }, [memberId]);

  const loadMemberData = async () => {
    try {
      setLoading(true);

      // Load member details
      const memberData = await FamilyService.getFamilyMember(memberId);
      if (!memberData) {
        Alert.alert('Error', 'Member not found');
        navigation.goBack();
        return;
      }
      setMember(memberData);

      // Load relations
      const memberRelations = await FamilyService.getMemberRelations(memberId);
      setRelations(memberRelations);

      // Load related members
      const relatedIds = new Set<string>();
      memberRelations.forEach((r) => {
        if (r.fromMemberId !== memberId) relatedIds.add(r.fromMemberId);
        if (r.toMemberId !== memberId) relatedIds.add(r.toMemberId);
      });

      const relatedMembersData: { [key: string]: FamilyMember } = {};
      await Promise.all(
        Array.from(relatedIds).map(async (id) => {
          const m = await FamilyService.getFamilyMember(id);
          if (m) relatedMembersData[id] = m;
        })
      );
      setRelatedMembers(relatedMembersData);

      // Load events
      const treeEvents = await FamilyService.getTreeEvents(memberData.familyTreeId);
      const memberEvents = treeEvents.filter((e) =>
        e.attendees.includes(memberId)
      );
      setEvents(memberEvents);
    } catch (error) {
      console.error('Error loading member data:', error);
      Alert.alert('Error', 'Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Family Member',
      'Are you sure? This will also delete all relations involving this member.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await FamilyService.deleteFamilyMember(memberId);
              Alert.alert('Success', 'Member deleted', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting member:', error);
              Alert.alert('Error', 'Failed to delete member');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getRelationTypeLabel = (
    relation: FamilyRelation,
    currentMemberId: string
  ): string => {
    const isFrom = relation.fromMemberId === currentMemberId;
    const type = relation.relationType;

    // If current member is "from", return the relation type as-is
    // If current member is "to", return the inverse
    const inverseMap: { [key: string]: string } = {
      [FamilyRelationType.FATHER]: 'Child',
      [FamilyRelationType.MOTHER]: 'Child',
      [FamilyRelationType.SON]: 'Parent',
      [FamilyRelationType.DAUGHTER]: 'Parent',
      [FamilyRelationType.BROTHER]: 'Sibling',
      [FamilyRelationType.SISTER]: 'Sibling',
      [FamilyRelationType.SPOUSE]: 'Spouse',
      [FamilyRelationType.GRANDFATHER]: 'Grandchild',
      [FamilyRelationType.GRANDMOTHER]: 'Grandchild',
      [FamilyRelationType.GRANDSON]: 'Grandparent',
      [FamilyRelationType.GRANDDAUGHTER]: 'Grandparent',
    };

    if (isFrom) {
      return type.replace(/_/g, ' ');
    } else {
      return inverseMap[type] || type.replace(/_/g, ' ');
    }
  };

  const renderRelations = () => {
    if (relations.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="people-outline" size={40} color="#cbd5e1" />
          <Text style={styles.emptySectionText}>No relations yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.relationsContainer}>
        {relations.map((relation) => {
          const relatedMemberId =
            relation.fromMemberId === memberId
              ? relation.toMemberId
              : relation.fromMemberId;
          const relatedMember = relatedMembers[relatedMemberId];

          if (!relatedMember) return null;

          const relationLabel = getRelationTypeLabel(relation, memberId);

          return (
            <TouchableOpacity
              key={relation.id}
              style={styles.relationCard}
              onPress={() =>
                navigation.push('FamilyMemberDetail', { memberId: relatedMemberId })
              }
            >
              <View style={styles.relationInfo}>
                <Ionicons name="person-circle" size={40} color="#3b82f6" />
                <View style={styles.relationText}>
                  <Text style={styles.relationName}>{relatedMember.displayName}</Text>
                  <Text style={styles.relationType}>{relationLabel}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderEvents = () => {
    if (events.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Ionicons name="calendar-outline" size={40} color="#cbd5e1" />
          <Text style={styles.emptySectionText}>No events recorded</Text>
        </View>
      );
    }

    return (
      <View style={styles.eventsContainer}>
        {events.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <Ionicons name="calendar" size={20} color="#3b82f6" />
              <Text style={styles.eventTitle}>{event.title}</Text>
            </View>
            {event.description && (
              <Text style={styles.eventDescription}>{event.description}</Text>
            )}
            <Text style={styles.eventDate}>
              {new Date(event.date).toLocaleDateString()}
            </Text>
            {event.location && (
              <View style={styles.eventLocation}>
                <Ionicons name="location" size={14} color="#64748b" />
                <Text style={styles.eventLocationText}>{event.location}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading member details...</Text>
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Member not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Details</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profilePhotoContainer}>
            {member.photoURL ? (
              <Image source={{ uri: member.photoURL }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Ionicons name="person" size={60} color="#94a3b8" />
              </View>
            )}
          </View>

          <Text style={styles.memberName}>{member.displayName}</Text>

          {member.occupation && (
            <Text style={styles.memberOccupation}>{member.occupation}</Text>
          )}

          <View style={styles.badges}>
            <View style={styles.badge}>
              <Ionicons
                name={member.isAlive ? 'heart' : 'heart-dislike'}
                size={16}
                color={member.isAlive ? '#10b981' : '#64748b'}
              />
              <Text style={styles.badgeText}>
                {member.isAlive ? 'Living' : 'Deceased'}
              </Text>
            </View>

            <View style={styles.badge}>
              <Ionicons name="layers" size={16} color="#3b82f6" />
              <Text style={styles.badgeText}>Gen {Math.abs(member.generation)}</Text>
            </View>

            {member.gender && (
              <View style={styles.badge}>
                <Ionicons
                  name={member.gender === Gender.MALE ? 'male' : 'female'}
                  size={16}
                  color="#8b5cf6"
                />
                <Text style={styles.badgeText}>{member.gender}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {member.dateOfBirth && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Born</Text>
                <Text style={styles.infoValue}>{member.dateOfBirth}</Text>
              </View>
            </View>
          )}

          {!member.isAlive && member.dateOfDeath && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#64748b" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Died</Text>
                <Text style={styles.infoValue}>{member.dateOfDeath}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Biography */}
        {member.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biography</Text>
            <Text style={styles.bioText}>{member.bio}</Text>
          </View>
        )}

        {/* Relations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Relations</Text>
          {renderRelations()}
        </View>

        {/* Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Life Events</Text>
          {renderEvents()}
        </View>

        {/* Add Relation Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('AddFamilyMember', {
              treeId: member.familyTreeId,
              parentId: member.id,
            })
          }
        >
          <Ionicons name="person-add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Related Member</Text>
        </TouchableOpacity>
      </ScrollView>
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
  errorText: {
    fontSize: 16,
    color: '#ef4444',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  profilePhotoContainer: {
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  memberOccupation: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 16,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
  },
  bioText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  relationsContainer: {
    gap: 8,
  },
  relationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  relationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  relationText: {
    marginLeft: 12,
    flex: 1,
  },
  relationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  relationType: {
    fontSize: 14,
    color: '#3b82f6',
  },
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  emptySection: {
    alignItems: 'center',
    padding: 24,
  },
  emptySectionText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
