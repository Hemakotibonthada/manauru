/**
 * Chat Service
 * Handles chat and messaging operations
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
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Chat, Message, ChatType, MessageType, ParticipantDetail } from '../types';

export class ChatService {
  /**
   * Create or get direct chat between two users
   */
  static async createOrGetDirectChat(
    user1Id: string,
    user1Name: string,
    user1Avatar: string | undefined,
    user2Id: string,
    user2Name: string,
    user2Avatar: string | undefined
  ): Promise<string> {
    try {
      // Check if chat already exists
      const existingChat = await this.findDirectChat(user1Id, user2Id);
      if (existingChat) {
        return existingChat.id;
      }

      // Create new chat
      const chatRef = doc(collection(db, 'chats'));
      const chatData: Omit<Chat, 'id'> = {
        type: ChatType.DIRECT,
        participants: [user1Id, user2Id],
        participantDetails: [
          { userId: user1Id, userName: user1Name, userAvatar: user1Avatar },
          { userId: user2Id, userName: user2Name, userAvatar: user2Avatar },
        ],
        unreadCount: { [user1Id]: 0, [user2Id]: 0 },
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(chatRef, chatData);
      console.log('✅ Chat created successfully');
      return chatRef.id;
    } catch (error) {
      console.error('❌ Error creating chat:', error);
      throw new Error('Failed to create chat');
    }
  }

  /**
   * Find existing direct chat between two users
   */
  private static async findDirectChat(
    user1Id: string,
    user2Id: string
  ): Promise<Chat | null> {
    try {
      const q = query(
        collection(db, 'chats'),
        where('type', '==', ChatType.DIRECT),
        where('participants', 'array-contains', user1Id)
      );

      const snapshot = await getDocs(q);
      const chat = snapshot.docs.find((doc) => {
        const data = doc.data();
        return data.participants.includes(user2Id);
      });

      return chat ? ({ id: chat.id, ...chat.data() } as Chat) : null;
    } catch (error) {
      console.error('❌ Error finding direct chat:', error);
      return null;
    }
  }

  /**
   * Create group chat
   */
  static async createGroupChat(
    creatorId: string,
    participantIds: string[],
    participantDetails: ParticipantDetail[]
  ): Promise<string> {
    try {
      const chatRef = doc(collection(db, 'chats'));
      const allParticipants = [creatorId, ...participantIds];
      
      const unreadCount: { [userId: string]: number } = {};
      allParticipants.forEach((id) => {
        unreadCount[id] = 0;
      });

      const chatData: Omit<Chat, 'id'> = {
        type: ChatType.GROUP,
        participants: allParticipants,
        participantDetails,
        unreadCount,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(chatRef, chatData);
      console.log('✅ Group chat created successfully');
      return chatRef.id;
    } catch (error) {
      console.error('❌ Error creating group chat:', error);
      throw new Error('Failed to create group chat');
    }
  }

  /**
   * Send message
   */
  static async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    senderAvatar?: string,
    replyTo?: string
  ): Promise<string> {
    try {
      const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
      const messageData: Omit<Message, 'id'> = {
        chatId,
        senderId,
        senderName,
        senderAvatar,
        type,
        content,
        replyTo,
        readBy: [senderId],
        deliveredTo: [senderId],
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      await setDoc(messageRef, messageData);

      // Update chat with last message
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const unreadCount = { ...chatData.unreadCount };
        
        // Increment unread count for all participants except sender
        chatData.participants.forEach((participantId: string) => {
          if (participantId !== senderId) {
            unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
          }
        });

        await updateDoc(chatRef, {
          lastMessage: { id: messageRef.id, ...messageData },
          lastMessageTime: serverTimestamp(),
          unreadCount,
          updatedAt: serverTimestamp(),
        });
      }

      console.log('✅ Message sent successfully');
      return messageRef.id;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get chat messages
   */
  static async getMessages(
    chatId: string,
    pageSize: number = 50
  ): Promise<Message[]> {
    try {
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
        .reverse();
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      throw new Error('Failed to fetch messages');
    }
  }

  /**
   * Listen to messages in real-time
   */
  static subscribeToMessages(
    chatId: string,
    callback: (messages: Message[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const messages = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Message)
          );
          callback(messages);
        },
        (error) => {
          console.error('❌ Error listening to messages:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
    } catch (error) {
      console.error('❌ Error setting up message listener:', error);
      throw new Error('Failed to subscribe to messages');
    }
  }

  /**
   * Get user chats
   */
  static async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Chat));
    } catch (error) {
      console.error('❌ Error fetching user chats:', error);
      throw new Error('Failed to fetch user chats');
    }
  }

  /**
   * Listen to user chats in real-time
   */
  static subscribeToUserChats(
    userId: string,
    callback: (chats: Chat[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    try {
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const chats = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Chat)
          );
          callback(chats);
        },
        (error) => {
          console.error('❌ Error listening to chats:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
    } catch (error) {
      console.error('❌ Error setting up chat listener:', error);
      throw new Error('Failed to subscribe to chats');
    }
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(
    chatId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        readBy: arrayUnion(userId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('❌ Error marking message as read:', error);
    }
  }

  /**
   * Mark chat as read (reset unread count)
   */
  static async markChatAsRead(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const unreadCount = { ...chatData.unreadCount };
        unreadCount[userId] = 0;

        await updateDoc(chatRef, {
          unreadCount,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('❌ Error marking chat as read:', error);
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(chatId: string, messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        content: 'This message has been deleted',
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Message deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Add reaction to message
   */
  static async addReaction(
    chatId: string,
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        const reactions = messageData.reactions || {};
        
        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }
        
        // Toggle reaction
        const userIndex = reactions[emoji].indexOf(userId);
        if (userIndex === -1) {
          reactions[emoji].push(userId);
        } else {
          reactions[emoji].splice(userIndex, 1);
          if (reactions[emoji].length === 0) {
            delete reactions[emoji];
          }
        }
        
        await updateDoc(messageRef, {
          reactions,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('❌ Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  /**
   * Set typing status
   */
  static async setTypingStatus(
    chatId: string,
    userId: string,
    isTyping: boolean
  ): Promise<void> {
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const typing = chatData.typing || {};
        
        if (isTyping) {
          typing[userId] = Timestamp.now();
        } else {
          delete typing[userId];
        }
        
        await updateDoc(chatRef, { typing });
      }
    } catch (error) {
      console.error('❌ Error setting typing status:', error);
    }
  }

  /**
   * Subscribe to typing indicator
   */
  static subscribeToTyping(
    chatId: string,
    currentUserId: string,
    callback: (isTyping: boolean) => void
  ): () => void {
    try {
      const chatRef = doc(db, 'chats', chatId);
      
      return onSnapshot(chatRef, (snapshot) => {
        if (snapshot.exists()) {
          const chatData = snapshot.data();
          const typing = chatData.typing || {};
          
          // Check if any other user is typing
          const otherUsersTyping = Object.keys(typing).some(
            (userId) => userId !== currentUserId
          );
          
          callback(otherUsersTyping);
        }
      });
    } catch (error) {
      console.error('❌ Error subscribing to typing:', error);
      return () => {};
    }
  }

  /**
   * Update user online status
   */
  static async updateOnlineStatus(
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp(),
      });
    } catch (error) {
      console.error('❌ Error updating online status:', error);
    }
  }

  /**
   * Search messages in chat
   */
  static async searchMessages(
    chatId: string,
    searchQuery: string
  ): Promise<Message[]> {
    try {
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const allMessages = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Message)
      );

      // Filter messages containing search query
      return allMessages.filter((message) =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } catch (error) {
      console.error('❌ Error searching messages:', error);
      throw new Error('Failed to search messages');
    }
  }

  /**
   * Send message with media
   */
  static async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    senderAvatar: string | undefined,
    content: string,
    type: MessageType = MessageType.TEXT,
    replyTo?: string
  ): Promise<string> {
    try {
      const messageRef = doc(collection(db, 'chats', chatId, 'messages'));
      const messageData: Omit<Message, 'id'> = {
        chatId,
        senderId,
        senderName,
        senderAvatar,
        type,
        content,
        replyTo,
        readBy: [senderId],
        deliveredTo: [senderId],
        timestamp: serverTimestamp() as any,
      };

      await setDoc(messageRef, messageData);

      // Update chat with last message
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const unreadCount = { ...chatData.unreadCount };
        
        // Increment unread count for all participants except sender
        chatData.participants.forEach((participantId: string) => {
          if (participantId !== senderId) {
            unreadCount[participantId] = (unreadCount[participantId] || 0) + 1;
          }
        });

        await updateDoc(chatRef, {
          lastMessage: content.substring(0, 100),
          lastMessageTime: serverTimestamp(),
          lastMessageType: type,
          unreadCount,
          updatedAt: serverTimestamp(),
        });
      }

      console.log('✅ Message sent successfully');
      return messageRef.id;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }
}

export default ChatService;
