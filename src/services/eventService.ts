/**
 * Event Service
 * Handles event-related operations
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
import { Event, EventCategory, EventStatus, Location } from '../types';

export class EventService {
  /**
   * Create a new event
   */
  static async createEvent(
    userId: string,
    userName: string,
    title: string,
    description: string,
    category: EventCategory,
    startDate: Date,
    endDate: Date,
    location: Location,
    villageId?: string,
    villageName?: string,
    coverImage?: string,
    maxAttendees?: number,
    price?: number
  ): Promise<string> {
    try {
      const eventRef = doc(collection(db, 'events'));
      const eventData: Omit<Event, 'id'> = {
        userId,
        userName,
        villageId,
        villageName,
        title,
        description,
        category,
        startDate: startDate as any,
        endDate: endDate as any,
        location,
        coverImage,
        attendees: [],
        attendeeCount: 0,
        maxAttendees,
        price,
        organizer: userName,
        status: EventStatus.UPCOMING,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(eventRef, eventData);
      console.log('✅ Event created successfully');
      return eventRef.id;
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw new Error('Failed to create event');
    }
  }

  /**
   * Get event by ID
   */
  static async getEvent(eventId: string): Promise<Event | null> {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        return { id: eventDoc.id, ...eventDoc.data() } as Event;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching event:', error);
      return null;
    }
  }

  /**
   * Get all events
   */
  static async getAllEvents(pageSize: number = 50): Promise<Event[]> {
    try {
      const q = query(
        collection(db, 'events'),
        orderBy('startDate', 'asc'),
        limit(pageSize)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Event)
      );
    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  }

  /**
   * Get upcoming events
   */
  static async getUpcomingEvents(pageSize: number = 50): Promise<Event[]> {
    try {
      const q = query(
        collection(db, 'events'),
        where('status', '==', EventStatus.UPCOMING),
        orderBy('startDate', 'asc'),
        limit(pageSize)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Event)
      );
    } catch (error) {
      console.error('❌ Error fetching upcoming events:', error);
      throw new Error('Failed to fetch upcoming events');
    }
  }

  /**
   * Get events for a village
   */
  static async getVillageEvents(
    villageId: string,
    pageSize: number = 50
  ): Promise<Event[]> {
    try {
      const q = query(
        collection(db, 'events'),
        where('villageId', '==', villageId),
        orderBy('startDate', 'asc'),
        limit(pageSize)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Event)
      );
    } catch (error) {
      console.error('❌ Error fetching village events:', error);
      throw new Error('Failed to fetch village events');
    }
  }

  /**
   * Join/Attend an event
   */
  static async attendEvent(eventId: string, userId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        attendees: arrayUnion(userId),
        attendeeCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Event joined successfully');
    } catch (error) {
      console.error('❌ Error joining event:', error);
      throw new Error('Failed to join event');
    }
  }

  /**
   * Leave an event
   */
  static async leaveEvent(eventId: string, userId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        attendees: arrayRemove(userId),
        attendeeCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Event left successfully');
    } catch (error) {
      console.error('❌ Error leaving event:', error);
      throw new Error('Failed to leave event');
    }
  }

  /**
   * Update event
   */
  static async updateEvent(
    eventId: string,
    updates: Partial<Event>
  ): Promise<void> {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Event updated successfully');
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw new Error('Failed to update event');
    }
  }

  /**
   * Cancel event
   */
  static async cancelEvent(eventId: string): Promise<void> {
    try {
      await this.updateEvent(eventId, { status: EventStatus.CANCELLED });
      console.log('✅ Event cancelled successfully');
    } catch (error) {
      console.error('❌ Error cancelling event:', error);
      throw new Error('Failed to cancel event');
    }
  }
}

export default EventService;
