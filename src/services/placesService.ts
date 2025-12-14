/**
 * Places Service
 * Handles famous places, landmarks, and village attractions
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { FamousPlace, PlaceReview, PlaceVisit, PlaceCategory } from '../types';

// ============= Place Operations =============
export const createPlace = async (
  placeData: Omit<FamousPlace, 'id' | 'createdAt' | 'updatedAt' | 'visitCount' | 'likeCount' | 'likedBy' | 'rating' | 'reviewCount' | 'verified'>
): Promise<string> => {
  const placeRef = await addDoc(collection(db, 'famousPlaces'), {
    ...placeData,
    visitCount: 0,
    likeCount: 0,
    likedBy: [],
    rating: 0,
    reviewCount: 0,
    verified: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return placeRef.id;
};

export const getPlace = async (placeId: string): Promise<FamousPlace | null> => {
  const placeDoc = await getDoc(doc(db, 'famousPlaces', placeId));
  if (!placeDoc.exists()) return null;
  return { id: placeDoc.id, ...placeDoc.data() } as FamousPlace;
};

export const getPlacesByVillage = async (villageId: string): Promise<FamousPlace[]> => {
  const q = query(
    collection(db, 'famousPlaces'),
    where('villageId', '==', villageId),
    orderBy('featured', 'desc'),
    orderBy('rating', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamousPlace));
};

export const getPlacesByCategory = async (
  villageId: string,
  category: PlaceCategory
): Promise<FamousPlace[]> => {
  const q = query(
    collection(db, 'famousPlaces'),
    where('villageId', '==', villageId),
    where('category', '==', category),
    orderBy('rating', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamousPlace));
};

export const getFeaturedPlaces = async (villageId: string): Promise<FamousPlace[]> => {
  const q = query(
    collection(db, 'famousPlaces'),
    where('villageId', '==', villageId),
    where('featured', '==', true),
    orderBy('rating', 'desc'),
    limit(10)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamousPlace));
};

export const getNearbyPlaces = async (
  villageId: string,
  userLat: number,
  userLng: number,
  radiusKm: number = 10
): Promise<FamousPlace[]> => {
  // Get all places in village first, then filter by distance
  const places = await getPlacesByVillage(villageId);
  
  return places.filter(place => {
    if (!place.location) return false;
    const distance = calculateDistance(
      userLat,
      userLng,
      place.location.latitude,
      place.location.longitude
    );
    return distance <= radiusKm;
  }).sort((a, b) => {
    const distA = calculateDistance(userLat, userLng, a.location.latitude, a.location.longitude);
    const distB = calculateDistance(userLat, userLng, b.location.latitude, b.location.longitude);
    return distA - distB;
  });
};

export const searchPlaces = async (searchTerm: string, villageId: string): Promise<FamousPlace[]> => {
  const places = await getPlacesByVillage(villageId);
  const lowerSearch = searchTerm.toLowerCase();
  
  return places.filter(place =>
    place.name.toLowerCase().includes(lowerSearch) ||
    place.description.toLowerCase().includes(lowerSearch) ||
    place.tags.some(tag => tag.toLowerCase().includes(lowerSearch)) ||
    place.address.toLowerCase().includes(lowerSearch)
  );
};

export const updatePlace = async (placeId: string, updates: Partial<FamousPlace>): Promise<void> => {
  await updateDoc(doc(db, 'famousPlaces', placeId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const deletePlace = async (placeId: string): Promise<void> => {
  await deleteDoc(doc(db, 'famousPlaces', placeId));
};

export const uploadPlaceImage = async (
  placeId: string,
  imageUri: string,
  imageName: string
): Promise<string> => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  const imageRef = ref(storage, `places/${placeId}/${imageName}`);
  await uploadBytes(imageRef, blob);
  return await getDownloadURL(imageRef);
};

// ============= Like/Unlike Operations =============
export const likePlace = async (placeId: string, userId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  const placeRef = doc(db, 'famousPlaces', placeId);
  batch.update(placeRef, {
    likedBy: arrayUnion(userId),
    likeCount: increment(1),
  });
  
  await batch.commit();
};

export const unlikePlace = async (placeId: string, userId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  const placeRef = doc(db, 'famousPlaces', placeId);
  batch.update(placeRef, {
    likedBy: arrayRemove(userId),
    likeCount: increment(-1),
  });
  
  await batch.commit();
};

// ============= Visit Tracking =============
export const recordVisit = async (
  visitData: Omit<PlaceVisit, 'id' | 'createdAt'>
): Promise<string> => {
  const batch = writeBatch(db);
  
  // Add visit record
  const visitRef = doc(collection(db, 'placeVisits'));
  batch.set(visitRef, {
    ...visitData,
    createdAt: Timestamp.now(),
  });
  
  // Increment visit count
  const placeRef = doc(db, 'famousPlaces', visitData.placeId);
  batch.update(placeRef, {
    visitCount: increment(1),
  });
  
  await batch.commit();
  return visitRef.id;
};

export const getUserVisits = async (userId: string): Promise<PlaceVisit[]> => {
  const q = query(
    collection(db, 'placeVisits'),
    where('userId', '==', userId),
    orderBy('visitDate', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlaceVisit));
};

export const getPlaceVisits = async (placeId: string): Promise<PlaceVisit[]> => {
  const q = query(
    collection(db, 'placeVisits'),
    where('placeId', '==', placeId),
    orderBy('visitDate', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlaceVisit));
};

// ============= Review Operations =============
export const addPlaceReview = async (
  reviewData: Omit<PlaceReview, 'id' | 'createdAt' | 'updatedAt' | 'helpful'>
): Promise<string> => {
  const batch = writeBatch(db);
  
  // Add review
  const reviewRef = doc(collection(db, 'placeReviews'));
  batch.set(reviewRef, {
    ...reviewData,
    helpful: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  // Update place rating and review count
  const place = await getPlace(reviewData.placeId);
  if (place) {
    const newReviewCount = place.reviewCount + 1;
    const newRating = ((place.rating * place.reviewCount) + reviewData.rating) / newReviewCount;
    
    const placeRef = doc(db, 'famousPlaces', reviewData.placeId);
    batch.update(placeRef, {
      rating: newRating,
      reviewCount: newReviewCount,
    });
  }
  
  await batch.commit();
  return reviewRef.id;
};

export const getPlaceReviews = async (placeId: string): Promise<PlaceReview[]> => {
  const q = query(
    collection(db, 'placeReviews'),
    where('placeId', '==', placeId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlaceReview));
};

export const markReviewHelpful = async (reviewId: string, userId: string): Promise<void> => {
  await updateDoc(doc(db, 'placeReviews', reviewId), {
    helpful: arrayUnion(userId),
  });
};

export const unmarkReviewHelpful = async (reviewId: string, userId: string): Promise<void> => {
  await updateDoc(doc(db, 'placeReviews', reviewId), {
    helpful: arrayRemove(userId),
  });
};

// ============= Utility Functions =============
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ============= Navigation Helper =============
export const openInMaps = (latitude: number, longitude: number, placeName: string): void => {
  const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
  const latLng = `${latitude},${longitude}`;
  const label = placeName;
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`,
  });

  Linking.openURL(url as string);
};

import { Platform, Linking } from 'react-native';
