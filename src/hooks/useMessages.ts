import { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from '@/api/service/chatApi';
import { fetchProtectedFile } from '@/api/service/mediaApi';
import { decryptChatFile, decryptChatMessage, encryptChatMessage,
  ensureChatIdentity, encryptionSupported } from '@/services/chatE2EE';
import type { Conversation, Message, NewConversationData } from '@/types/message';
import { useAuth } from '@/contexts/AuthContext';

async function presentMessage(conversationId: number, userId: number, message: Message): Promise<Message> {
  if (!message.encrypted || message.deleted) return message;
  try {
    const result = await decryptChatMessage(conversationId, userId, message);
    return { ...message, content: result.text, decryptedAttachment: result.attachment };
  } catch {
    // No plaintext fallback: never expose raw ciphertext in the UI.
    return { ...message, content: '🔒 Encrypted message unavailable on this device' };
  }
}

/** Real server conversations with automatic single-browser E2EE identity registration. */
export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [encryptionError, setEncryptionError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!encryptionSupported()) {
      setEncryptionError('Secure messaging requires HTTPS or localhost. This HTTP phone address cannot send or decrypt encrypted messages.');
      return;
    }
    let active = true;
    void ensureChatIdentity(Number(user.id))
      .then(() => { if (active) setEncryptionError(''); })
      .catch(e => { if (active) setEncryptionError(e instanceof Error ? e.message : 'Encryption setup failed'); });
    return () => { active = false; };
  }, [user?.id]);

  const refreshConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    try {
      const updated = await chatApi.conversations();
      // The list never shows ciphertext, which is accessible only to the client
      // after explicit decryption of a selected conversation.
      setConversations(updated.map(c => ({
        ...c,
        lastMessage: c.lastMessage?.encrypted && !c.lastMessage.deleted
          ? { ...c.lastMessage, content: '🔒 Encrypted message' } : c.lastMessage,
      })));
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
    if (!user) throw new Error('Sign in to start a chat');
    await ensureChatIdentity(Number(user.id));
    // The first message must never be handed to the server as plaintext.
    const { initialMessage, ...details } = data;
    let created = await chatApi.create(details);
    // An existing direct chat may predate E2EE. Upgrade only after every
    // participant has registered a key; old history remains visibly legacy.
    if (!created.e2eeEnabled && created.type === 'DIRECT') {
      created = await chatApi.enableE2EE(created.id);
    }
    if (initialMessage?.trim()) {
      const keys = await chatApi.recipientKeys(created.id);
      const { payload } = await encryptChatMessage(created.id, Number(user.id), keys, initialMessage.trim());
      await chatApi.sendEncrypted(created.id, payload);
    }
    await refreshConversations();
    return created;
  }, [user?.id, refreshConversations]);

  const markAsRead = useCallback(async (id: number) => {
    await chatApi.markRead(id);
    setConversations(previous => previous.map(c =>
      c.id === id ? { ...c, unreadCount: 0 } : c
    ));
  }, []);

  return {
    conversations, isLoading, error, encryptionError,
    createConversation, markAsRead, refreshConversations,
  };
}

/** Current conversation messages; decrypt only in the authenticated browser. */
export function useMessages(conversationId: number | null, e2eeEnabled = false) {
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
        const hydrated = await Promise.all(incoming.map(message =>
          presentMessage(conversationId, Number(user.id), message)));
        if (!active) return;
        setMessages(hydrated);
        setError('');
        const unseen = incoming.filter(m =>
          m.senderId !== Number(user.id) && m.id > seenRef.current);
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

  const addSent = useCallback(async (msg: Message) => {
    if (!user || conversationId == null) return msg;
    const shown = await presentMessage(conversationId, Number(user.id), msg);
    setMessages(previous => previous.some(m => m.id === shown.id) ? previous : [...previous, shown]);
    return shown;
  }, [conversationId, user?.id]);

  const sendMessage = useCallback(async (content: string) => {
    if (conversationId == null || !user) throw new Error('Select a conversation');
    if (e2eeEnabled) {
      const recipients = await chatApi.recipientKeys(conversationId);
      const { payload } = await encryptChatMessage(conversationId, Number(user.id), recipients, content);
      return addSent(await chatApi.sendEncrypted(conversationId, payload));
    }
    return addSent(await chatApi.send(conversationId, content));
  }, [conversationId, user?.id, e2eeEnabled, addSent]);

  const uploadAttachment = useCallback(async (file: File, caption = '') => {
    if (conversationId == null || !user) throw new Error('Select a conversation');
    if (e2eeEnabled) {
      const recipients = await chatApi.recipientKeys(conversationId);
      const { payload, encryptedFile } = await encryptChatMessage(
        conversationId, Number(user.id), recipients, caption, file);
      if (!encryptedFile) throw new Error('Attachment could not be encrypted');
      return addSent(await chatApi.sendEncryptedFile(conversationId, payload, encryptedFile));
    }
    return addSent(await chatApi.uploadAttachment(conversationId, file, caption));
  }, [conversationId, user?.id, e2eeEnabled, addSent]);

  const forwardMessage = useCallback(async (message: Message, destinationId: number,
    destinationEncrypted: boolean) => {
    if (conversationId == null || !user) throw new Error('Select a conversation');
    if (message.encrypted && (!message.crypto ||
        message.content === '🔒 Encrypted message unavailable on this device')) {
      throw new Error('This device cannot decrypt the original message, so it cannot be forwarded.');
    }
    if (message.encrypted && !destinationEncrypted)
      throw new Error('Encrypted messages cannot be forwarded to an unencrypted chat. Enable encryption on the destination first.');
    if (destinationEncrypted) {
      const keys = await chatApi.recipientKeys(destinationId);
      let file: File | undefined;
      if (message.attachment) {
        const blob = await fetchProtectedFile(chatApi.attachmentUrl(
          conversationId, message.attachment.id));
        const plain = message.encrypted
          ? await decryptChatFile(conversationId, Number(user.id), message, blob)
          : blob;
        const detail = message.decryptedAttachment;
        file = new File([plain], detail?.filename || message.attachment.filename,
          { type: detail?.contentType || message.attachment.contentType });
      }
      const { payload, encryptedFile } = await encryptChatMessage(
        destinationId, Number(user.id), keys, message.content, file, true);
      const result = encryptedFile
        ? await chatApi.sendEncryptedFile(destinationId, payload, encryptedFile)
        : await chatApi.sendEncrypted(destinationId, payload);
      if (destinationId === conversationId) await addSent(result);
      return result;
    }
    const result = await chatApi.forward(destinationId, conversationId, message.id);
    if (destinationId === conversationId) await addSent(result);
    return result;
  }, [conversationId, user?.id, addSent]);

  const deleteMessage = useCallback(async (messageId: number) => {
    if (conversationId == null) throw new Error('Select a conversation');
    const deleted = await chatApi.deleteMessage(conversationId, messageId);
    setMessages(previous => previous.map(m => m.id === deleted.id ? deleted : m));
  }, [conversationId]);

  return { messages, isLoading, error, sendMessage, uploadAttachment, forwardMessage, deleteMessage };
}
