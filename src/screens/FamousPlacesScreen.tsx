/**
 * Famous Places List Screen
 * Discover and explore village landmarks and attractions
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
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { FamousPlace, PlaceCategory } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as placesService from '../services/placesService';

const CATEGORY_ICONS: Record<PlaceCategory, keyof typeof Ionicons.glyphMap> = {
  [PlaceCategory.TEMPLE]: 'star',
  [PlaceCategory.MOSQUE]: 'moon',
  [PlaceCategory.CHURCH]: 'add',
  [PlaceCategory.MONUMENT]: 'flag',
  [PlaceCategory.PARK]: 'leaf',
  [PlaceCategory.LAKE]: 'water',
  [PlaceCategory.RIVER]: 'water',
  [PlaceCategory.WATERFALL]: 'water',
  [PlaceCategory.HILL]: 'triangle',
  [PlaceCategory.FOREST]: 'leaf',
  [PlaceCategory.MARKET]: 'storefront',
  [PlaceCategory.RESTAURANT]: 'restaurant',
  [PlaceCategory.CAFE]: 'cafe',
  [PlaceCategory.HERITAGE_SITE]: 'archive',
  [PlaceCategory.MUSEUM]: 'library',
  [PlaceCategory.LIBRARY]: 'book',
  [PlaceCategory.SCHOOL]: 'school',
  [PlaceCategory.HOSPITAL]: 'medical',
  [PlaceCategory.GOVERNMENT_OFFICE]: 'briefcase',
  [PlaceCategory.COMMUNITY_HALL]: 'people',
  [PlaceCategory.SPORTS_GROUND]: 'football',
  [PlaceCategory.SCENIC_SPOT]: 'camera',
  [PlaceCategory.CULTURAL_CENTER]: 'musical-notes',
  [PlaceCategory.HISTORICAL_LANDMARK]: 'time',
  [PlaceCategory.NATURAL_WONDER]: 'sparkles',
  [PlaceCategory.OTHER]: 'location',
};

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  [PlaceCategory.TEMPLE]: 'Temple',
  [PlaceCategory.MOSQUE]: 'Mosque',
  [PlaceCategory.CHURCH]: 'Church',
  [PlaceCategory.MONUMENT]: 'Monument',
  [PlaceCategory.PARK]: 'Park',
  [PlaceCategory.LAKE]: 'Lake',
  [PlaceCategory.RIVER]: 'River',
  [PlaceCategory.WATERFALL]: 'Waterfall',
  [PlaceCategory.HILL]: 'Hill',
  [PlaceCategory.FOREST]: 'Forest',
  [PlaceCategory.MARKET]: 'Market',
  [PlaceCategory.RESTAURANT]: 'Restaurant',
  [PlaceCategory.CAFE]: 'Cafe',
  [PlaceCategory.HERITAGE_SITE]: 'Heritage Site',
  [PlaceCategory.MUSEUM]: 'Museum',
  [PlaceCategory.LIBRARY]: 'Library',
  [PlaceCategory.SCHOOL]: 'School',
  [PlaceCategory.HOSPITAL]: 'Hospital',
  [PlaceCategory.GOVERNMENT_OFFICE]: 'Government Office',
  [PlaceCategory.COMMUNITY_HALL]: 'Community Hall',
  [PlaceCategory.SPORTS_GROUND]: 'Sports Ground',
  [PlaceCategory.SCENIC_SPOT]: 'Scenic Spot',
  [PlaceCategory.CULTURAL_CENTER]: 'Cultural Center',
  [PlaceCategory.HISTORICAL_LANDMARK]: 'Historical Landmark',
  [PlaceCategory.NATURAL_WONDER]: 'Natural Wonder',
  [PlaceCategory.OTHER]: 'Other',
};

export default function FamousPlacesScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);
  const { user } = useAuth();

  const [places, setPlaces] = useState<FamousPlace[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<FamousPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'visits' | 'name'>('rating');

  useEffect(() => {
    loadPlaces();
  }, []);

  useEffect(() => {
    filterPlaces();
  }, [places, searchQuery, selectedCategory, sortBy]);

  const loadPlaces = async () => {
    try {
      if (!user?.villageId) return;
      const data = await placesService.getPlacesByVillage(user.villageId);
      setPlaces(data);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPlaces = () => {
    let filtered = [...places];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(place => place.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        place =>
          place.name.toLowerCase().includes(query) ||
          place.description.toLowerCase().includes(query) ||
          place.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'visits':
          return b.visitCount - a.visitCount;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredPlaces(filtered);
  };

  const handleLikePlace = async (placeId: string, isLiked: boolean) => {
    if (!user?.id) return;

    try {
      if (isLiked) {
        await placesService.unlikePlace(placeId, user.id);
      } else {
        await placesService.likePlace(placeId, user.id);
      }
      loadPlaces();
    } catch (error) {
      console.error('Error liking place:', error);
    }
  };

  const handleNavigateToPlace = (place: FamousPlace) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${place.location.latitude},${place.location.longitude}`;
    const label = place.name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url as string);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlaces();
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryScroll}
      contentContainerStyle={styles.categoryContent}
    >
      <TouchableOpacity
        style={[
          styles.categoryChip,
          { backgroundColor: selectedCategory === 'all' ? colors.primary.main : colors.background.card },
        ]}
        onPress={() => setSelectedCategory('all')}
      >
        <Text
          style={[
            styles.categoryChipText,
            { color: selectedCategory === 'all' ? '#fff' : colors.text.primary },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {Object.values(PlaceCategory).map(category => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryChip,
            {
              backgroundColor:
                selectedCategory === category ? colors.primary.main : colors.background.card,
            },
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Ionicons
            name={CATEGORY_ICONS[category]}
            size={16}
            color={selectedCategory === category ? '#fff' : colors.text.primary}
          />
          <Text
            style={[
              styles.categoryChipText,
              { color: selectedCategory === category ? '#fff' : colors.text.primary },
            ]}
          >
            {CATEGORY_LABELS[category]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPlaceCard = ({ item }: { item: FamousPlace }) => {
    const isLiked = user?.id ? item.likedBy.includes(user.id) : false;

    return (
      <TouchableOpacity
        style={[styles.placeCard, { backgroundColor: colors.background.card }]}
        onPress={() => navigation.navigate('PlaceDetail', { placeId: item.id })}
      >
        <Image
          source={{ uri: item.coverImage || item.photos[0] || 'https://via.placeholder.com/400x200' }}
          style={styles.placeImage}
        />

        {item.featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#FFA000" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}

        <View style={styles.likeButton}>
          <TouchableOpacity onPress={() => handleLikePlace(item.id, isLiked)}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#F44336' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.placeInfo}>
          <View style={styles.categoryBadge}>
            <Ionicons name={CATEGORY_ICONS[item.category]} size={14} color={colors.primary.main} />
            <Text style={[styles.categoryText, { color: colors.primary.main }]}>
              {CATEGORY_LABELS[item.category]}
            </Text>
          </View>

          <Text style={[styles.placeName, { color: colors.text.primary }]} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={[styles.placeDescription, { color: colors.text.secondary }]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.placeStats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color="#FFA000" />
              <Text style={[styles.statText, { color: colors.text.primary }]}>
                {item.rating.toFixed(1)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="eye" size={16} color={colors.text.secondary} />
              <Text style={[styles.statText, { color: colors.text.secondary }]}>
                {item.visitCount} visits
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="heart" size={16} color={colors.text.secondary} />
              <Text style={[styles.statText, { color: colors.text.secondary }]}>
                {item.likeCount}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.navigateButton, { backgroundColor: colors.primary.main }]}
            onPress={() => handleNavigateToPlace(item)}
          >
            <Ionicons name="navigate" size={16} color="#fff" />
            <Text style={styles.navigateText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background.default }]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background.card }]}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search places..."
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

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Sort Options */}
      <View style={[styles.sortContainer, { backgroundColor: colors.background.card }]}>
        <Text style={[styles.sortLabel, { color: colors.text.secondary }]}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {(['rating', 'visits', 'name'] as const).map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                {
                  backgroundColor: sortBy === option ? colors.primary.main : 'transparent',
                  borderColor: sortBy === option ? colors.primary.main : colors.border,
                },
              ]}
              onPress={() => setSortBy(option)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  { color: sortBy === option ? '#fff' : colors.text.primary },
                ]}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Places List */}
      <FlatList
        data={filteredPlaces}
        renderItem={renderPlaceCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary.main]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={80} color={colors.text.disabled} />
            <Text style={[styles.emptyText, { color: colors.text.primary }]}>
              {searchQuery || selectedCategory !== 'all' ? 'No places found' : 'No places added yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.text.secondary }]}>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'Be the first to add a famous place!'}
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary.main }]}
        onPress={() => navigation.navigate('AddPlace')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
    },
    categoryScroll: {
      maxHeight: 50,
    },
    categoryContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    categoryChipText: {
      fontSize: 14,
      fontWeight: '600',
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginTop: 8,
      gap: 12,
    },
    sortLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    sortButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    sortButton: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    sortButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    listContent: {
      padding: 16,
      paddingTop: 8,
    },
    placeCard: {
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    placeImage: {
      width: '100%',
      height: 200,
    },
    featuredBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    featuredText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFA000',
    },
    likeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeInfo: {
      padding: 16,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      gap: 4,
      marginBottom: 8,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '600',
    },
    placeName: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
    },
    placeDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    placeStats: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 12,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 14,
      fontWeight: '600',
    },
    navigateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    navigateText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  });
