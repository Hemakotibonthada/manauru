/**
 * Chat Screen - Enterprise Level
 * Real-time messaging with typing indicators, read receipts, reactions, media sharing
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { getThemedColors } from '../styles/theme';
import { ChatService } from '../services/chatService';
import { Message, MessageType } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId } = route.params as { chatId: string };
  const { user } = useAuth();
  const { isDark } = useTheme();
  const colors = getThemedColors(isDark);
  const styles = createStyles(colors);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    // Subscribe to messages
    const unsubscribe = ChatService.subscribeToMessages(chatId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
      
      // Mark messages as read
      markMessagesAsRead();
    });

    // Subscribe to typing indicator
    const unsubscribeTyping = ChatService.subscribeToTyping(chatId, user.id, (typing) => {
      setIsTyping(typing);
    });

    return () => {
      unsubscribe();
      unsubscribeTyping();
    };
  }, [chatId, user]);

  const markMessagesAsRead = useCallback(async () => {
    if (!user || !chatId) return;
    try {
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== user.id && !msg.readBy?.includes(user.id)
      );
      
      for (const msg of unreadMessages) {
        await ChatService.markMessageAsRead(chatId, msg.id, user.id);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [messages, user, chatId]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      await ChatService.sendMessage(
        chatId,
        user.id,
        user.displayName || 'User',
        user.photoURL,
        messageText,
        MessageType.TEXT
      );
      
      // Stop typing indicator
      await ChatService.setTypingStatus(chatId, user.id, false);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);

    if (!user) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing status
    ChatService.setTypingStatus(chatId, user.id, text.length > 0);

    // Clear typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      ChatService.setTypingStatus(chatId, user.id, false);
    }, 3000);
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && user) {
        setSending(true);
        await ChatService.sendMessage(
          chatId,
          user.id,
          user.displayName || 'User',
          user.photoURL,
          result.assets[0].uri,
          MessageType.IMAGE
        );
        setSending(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image');
      setSending(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    try {
      await ChatService.addReaction(chatId, messageId, user.id, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChatService.deleteMessage(chatId, messageId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === user?.id;
    const showAvatar = !isMyMessage && (index === 0 || messages[index - 1].senderId !== item.senderId);
    const isRead = item.readBy && item.readBy.length > 1;

    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        {!isMyMessage && showAvatar && (
          <Image
            source={{ uri: item.senderAvatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
        )}
        {!isMyMessage && !showAvatar && <View style={styles.avatarSpacer} />}

        <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
          {item.replyTo && (
            <View style={styles.replyPreview}>
              <Text style={styles.replyText} numberOfLines={1}>
                Reply to message
              </Text>
            </View>
          )}

          {item.type === MessageType.IMAGE ? (
            <Image source={{ uri: item.content }} style={styles.messageImage} />
          ) : (
            <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
              {item.content}
            </Text>
          )}

          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
              {formatTime(item.timestamp)}
            </Text>
            {isMyMessage && (
              <Ionicons
                name={isRead ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={isRead ? '#4CAF50' : colors.text.disabled}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>

          {item.reactions && Object.keys(item.reactions).length > 0 && (
            <View style={styles.reactionsContainer}>
              {Object.entries(item.reactions).map(([emoji, users]) => (
                <View key={emoji} style={styles.reactionBubble}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{users.length}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.messageActions}
          onPress={() => {
            Alert.alert('Message Actions', '', [
              { text: 'React', onPress: () => handleReaction(item.id, '❤️') },
              ...(isMyMessage
                ? [{ text: 'Delete', onPress: () => handleDeleteMessage(item.id), style: 'destructive' as const }]
                : []),
              { text: 'Cancel', style: 'cancel' as const },
            ]);
          }}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={colors.text.disabled} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <Text style={styles.typingText}>typing...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={handleImagePick} disabled={sending}>
          <Ionicons name="image" size={24} color={colors.primary.main} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.text.disabled}
          value={inputText}
          onChangeText={handleTyping}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarSpacer: {
    width: 40,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
  },
  myMessage: {
    backgroundColor: colors.primary.main,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: colors.background.paper,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: colors.text.disabled,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  replyPreview: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
    padding: 6,
    marginBottom: 6,
    borderRadius: 4,
  },
  replyText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.default,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  messageActions: {
    padding: 4,
    marginLeft: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.disabled,
  },
  typingText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 8,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.default,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary.main,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
