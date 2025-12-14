/**
 * Events Screen
 * Browse and manage village events
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity, 
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { Event, EventCategory, EventStatus } from '../types';
import { EventService } from '../services/eventService';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';
import moment from 'moment';

interface EventsScreenProps {
  navigation: any;
}

export const EventsScreen: React.FC<EventsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'attending'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      let data: Event[] = [];
      
      if (filter === 'all') {
        data = user?.villageId ? await EventService.getVillageEvents(user.villageId) : await EventService.getAllEvents();
      } else if (filter === 'upcoming') {
        data = await EventService.getUpcomingEvents();
        if (user?.villageId) {
          data = data.filter(e => e.villageId === user.villageId);
        }
      } else if (filter === 'attending' && user?.id) {
        data = await EventService.getUserEvents(user.id);
      }
      
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case EventCategory.FESTIVAL:
        return 'sparkles';
      case EventCategory.MEETING:
        return 'people';
      case EventCategory.WORKSHOP:
        return 'construct';
      case EventCategory.SPORTS:
        return 'football';
      case EventCategory.CULTURAL:
        return 'musical-notes';
      case EventCategory.HEALTH:
        return 'medical';
      case EventCategory.EDUCATION:
        return 'school';
      default:
        return 'calendar';
    }
  };

  const getCategoryColor = (category: EventCategory) => {
    switch (category) {
      case EventCategory.FESTIVAL:
        return colors.warning.main;
      case EventCategory.HEALTH:
        return colors.error.main;
      case EventCategory.EDUCATION:
        return colors.info.main;
      case EventCategory.SPORTS:
        return colors.success.main;
      default:
        return colors.primary.main;
    }
  };

  const renderEvent = ({ item }: { item: Event }) => {
    const isAttending = item.attendees.includes(user?.id || '');
    const categoryColor = getCategoryColor(item.category);

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        {item.coverImage ? (
          <Image source={{ uri: item.coverImage }} style={styles.eventImage} />
        ) : (
          <View style={[styles.eventImagePlaceholder, { backgroundColor: categoryColor + '20' }]}>
            <Ionicons name={getCategoryIcon(item.category) as any} size={48} color={categoryColor} />
          </View>
        )}

        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
              <Ionicons name={getCategoryIcon(item.category) as any} size={16} color={categoryColor} />
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {item.category}
              </Text>
            </View>
            {isAttending && (
              <View style={styles.attendingBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
                <Text style={styles.attendingText}>Attending</Text>
              </View>
            )}
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {moment(item.startDate.toDate()).format('MMM DD, YYYY')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText}>
                {moment(item.startDate.toDate()).format('hh:mm A')}
              </Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            <View style={styles.attendeeInfo}>
              <Ionicons name="people" size={16} color={colors.text.secondary} />
              <Text style={styles.attendeeCount}>{item.attendeeCount} attending</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={colors.text.secondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.location.address}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'upcoming' && styles.activeFilterTab]}
          onPress={() => setFilter('upcoming')}
        >
          <Text style={[styles.filterText, filter === 'upcoming' && styles.activeFilterText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'attending' && styles.activeFilterTab]}
          onPress={() => setFilter('attending')}
        >
          <Text style={[styles.filterText, filter === 'attending' && styles.activeFilterText]}>
            Attending
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No events found</Text>
            </View>
          }
        />
      )}

      {/* Create Event FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Ionicons name="add" size={28} color={colors.primary.contrast} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.default,
  },
  activeFilterTab: {
    backgroundColor: colors.primary.main,
  },
  filterText: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.h5.fontWeight as any,
  },
  activeFilterText: {
    color: colors.primary.contrast,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
  },
  eventCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  eventImage: {
    width: '100%',
    height: 150,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    padding: spacing.md,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  categoryText: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    textTransform: 'capitalize',
  },
  attendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendingText: {
    fontSize: typography.caption.fontSize,
    color: colors.success.main,
    fontWeight: typography.h5.fontWeight as any,
  },
  eventTitle: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  eventDescription: {
    fontSize: typography.body2.fontSize,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  eventDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendeeCount: {
    fontSize: typography.caption.fontSize,
    color: colors.text.secondary,
    fontWeight: typography.h5.fontWeight as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: typography.body1.fontSize,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});
