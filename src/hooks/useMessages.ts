import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '@/api/service/chatApi';
import type { Conversation, Message, NewConversationData } from '@/types/message';
import { useAuth } from '@/contexts/AuthContext';

/** Live conversations, always read from the server, never localStorage mocks. */
export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    try {
      const updated = await chatApi.conversations();
      setConversations(updated);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    setConversations([]);
    setIsLoading(true);
    void refreshConversations();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshConversations();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [refreshConversations]);

  const createConversation = useCallback(async (data: NewConversationData) => {
    const created = await chatApi.create(data);
    await refreshConversations();
    return created;
  }, [refreshConversations]);

  const markAsRead = useCallback(async (id: number) => {
    await chatApi.markRead(id);
    setConversations(previous => previous.map(c =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    ));
  }, []);

  return {
    conversations, isLoading, error,
    createConversation, markAsRead, refreshConversations,
  };
}

/** Latest 100 messages; short polling supports phone and LAN without fake events. */
export function useMessages(conversationId: number | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const seenRef = useRef(0);

  useEffect(() => {
    setMessages([]);
    setError('');
    seenRef.current = 0;
    if (conversationId == null || !user) {
      setIsLoading(false);
      return;
    }

    let active = true;
    let inFlight = false;
    setIsLoading(true);

    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const incoming = await chatApi.messages(conversationId);
        if (!active) return;
        setMessages(incoming);
        setError('');
        const unseen = incoming.filter(m =>
          m.senderId !== Number(user.id) && m.id > seenRef.current
        );
        const newestId = incoming.length ? incoming[incoming.length - 1].id : 0;
        seenRef.current = Math.max(seenRef.current, newestId);
        if (unseen.length && document.visibilityState === 'visible') {
          await chatApi.markRead(conversationId);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load messages');
      } finally {
        inFlight = false;
        if (active) setIsLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 3000);
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [conversationId, user?.id]);

  const sendMessage = useCallback(async (content: string) => {
    if (conversationId == null) throw new Error('Select a conversation');
    const sent = await chatApi.send(conversationId, content);
    setMessages(previous => previous.some(m => m.id === sent.id)
      ? previous : [...previous, sent]);
    return sent;
  }, [conversationId]);

  const deleteMessage = useCallback(async (messageId: number) => {
    if (conversationId == null) throw new Error('Select a conversation');
    const deleted = await chatApi.deleteMessage(conversationId, messageId);
    setMessages(previous => previous.map(m => m.id === deleted.id ? deleted : m));
  }, [conversationId]);

  return { messages, isLoading, error, sendMessage, deleteMessage };
}
