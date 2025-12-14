/**
 * New Chat Screen - User Search and Chat Initiation
 * Enterprise level user discovery and direct chat creation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { ChatService } from '../services/chatService';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserSearchResult {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  village?: string;
  isOnline?: boolean;
}

export default function NewChatScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      searchUsers();
    } else {
      loadRecentUsers();
    }
  }, [searchQuery]);

  const loadRecentUsers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('id', '!=', user.id),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const usersList: UserSearchResult[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          displayName: data.displayName || data.email?.split('@')[0] || 'User',
          email: data.email || '',
          photoURL: data.photoURL,
          village: data.village,
          isOnline: data.isOnline,
        });
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!user || !searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const searchLower = searchQuery.toLowerCase();
      
      // Search by display name
      const nameQuery = query(
        usersRef,
        where('displayNameLower', '>=', searchLower),
        where('displayNameLower', '<=', searchLower + '\uf8ff'),
        limit(10)
      );
      
      const nameSnapshot = await getDocs(nameQuery);
      const usersList: UserSearchResult[] = [];
      
      nameSnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== user.id) {
          usersList.push({
            id: doc.id,
            displayName: data.displayName || data.email?.split('@')[0] || 'User',
            email: data.email || '',
            photoURL: data.photoURL,
            village: data.village,
            isOnline: data.isOnline,
          });
        }
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (otherUser: UserSearchResult) => {
    if (!user || creating) return;
    
    setCreating(true);
    try {
      const chatId = await ChatService.createOrGetDirectChat(
        user.id,
        user.displayName || 'User',
        user.photoURL,
        otherUser.id,
        otherUser.displayName,
        otherUser.photoURL
      );
      
      // Navigate to chat screen
      // @ts-ignore - Navigation typing issue
      navigation.replace('Chat', { chatId });
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setCreating(false);
    }
  };

  const renderUser = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleCreateChat(item)}
      disabled={creating}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.photoURL || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          {item.isOnline && <View style={styles.onlineBadge} />}
        </View>

        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userMeta}>
            {item.village ? `${item.village} • ` : ''}{item.email}
          </Text>
        </View>
      </View>

      <Ionicons name="chatbubble-outline" size={20} color={colors.text.disabled} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.disabled} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name..."
          placeholderTextColor={colors.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.disabled} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No users found' : 'Search for users to start a chat'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.usersList}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
  },
  usersList: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.paper,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: colors.background.paper,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 13,
    color: colors.text.secondary,
  },
});
