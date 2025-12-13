/**
 * Custom Hooks for Chat
 */

import { useState, useEffect, useCallback } from 'react';
import { Chat, Message, MessageType } from '../types';
import ChatService from '../services/chatService';

export const useChats = (userId: string) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    
    const unsubscribe = ChatService.subscribeToUserChats(
      userId,
      (newChats) => {
        setChats(newChats);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { chats, loading, error };
};

export const useMessages = (chatId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) return;

    setLoading(true);

    const unsubscribe = ChatService.subscribeToMessages(
      chatId,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = useCallback(
    async (
      senderId: string,
      senderName: string,
      content: string,
      type: MessageType = MessageType.TEXT,
      senderAvatar?: string
    ) => {
      try {
        await ChatService.sendMessage(
          chatId,
          senderId,
          senderName,
          content,
          type,
          senderAvatar
        );
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [chatId]
  );

  return { messages, loading, error, sendMessage };
};

export const useSendMessage = (chatId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    senderId: string,
    senderName: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    senderAvatar?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await ChatService.sendMessage(
        chatId,
        senderId,
        senderName,
        content,
        type,
        senderAvatar
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
};
