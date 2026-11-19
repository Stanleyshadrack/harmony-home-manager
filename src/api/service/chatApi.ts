import { apiRequest } from '@/api/https';
import type { ChatContact, Conversation, Message, NewConversationData } from '@/types/message';

const ROOT = '/api/chat';

export const chatApi = {
  contacts: (search = '') =>
    apiRequest<null, ChatContact[]>({
      path: `${ROOT}/contacts?search=${encodeURIComponent(search)}`,
      method: 'GET',
    }),

  conversations: () =>
    apiRequest<null, Conversation[]>({
      path: `${ROOT}/conversations`,
      method: 'GET',
    }),

  conversation: (id: number) =>
    apiRequest<null, Conversation>({
      path: `${ROOT}/conversations/${id}`,
      method: 'GET',
    }),

  create: (data: NewConversationData) =>
    apiRequest<NewConversationData, Conversation>({
      path: `${ROOT}/conversations`,
      method: 'POST',
      body: data,
    }),

  messages: (id: number) =>
    apiRequest<null, Message[]>({
      path: `${ROOT}/conversations/${id}/messages`,
      method: 'GET',
    }),

  send: (id: number, content: string) =>
    apiRequest<{ content: string }, Message>({
      path: `${ROOT}/conversations/${id}/messages`,
      method: 'POST',
      body: { content },
    }),

  uploadAttachment: (id: number, file: File, caption = '') => {
    const body = new FormData();
    body.append('file', file);
    if (caption.trim()) body.append('caption', caption.trim());
    return apiRequest<FormData, Message>({
      path: `${ROOT}/conversations/${id}/attachments`,
      method: 'POST',
      body,
      timeout: 45000,
    });
  },

  forward: (destinationId: number, sourceConversationId: number, messageId: number) =>
    apiRequest<{ sourceConversationId: number; messageId: number }, Message>({
      path: `${ROOT}/conversations/${destinationId}/forward`,
      method: 'POST',
      body: { sourceConversationId, messageId },
    }),

  attachmentUrl: (conversationId: number, attachmentId: number) =>
    `${ROOT}/conversations/${conversationId}/attachments/${attachmentId}`,

  identity: () =>
    apiRequest<null, { userId: number; publicKey: string } | null>({
      path: `${ROOT}/keys/me`, method: 'GET',
    }),

  registerIdentity: (publicKey: string) =>
    apiRequest<{ publicKey: string }, { userId: number; publicKey: string }>({
      path: `${ROOT}/keys/me`, method: 'PUT', body: { publicKey },
    }),

  recipientKeys: (id: number) =>
    apiRequest<null, Array<{ userId: number; publicKey: string | null }>>({
      path: `${ROOT}/conversations/${id}/keys`, method: 'GET',
    }),

  enableE2EE: (id: number) =>
    apiRequest<null, Conversation>({
      path: `${ROOT}/conversations/${id}/enable-e2ee`, method: 'POST',
    }),

  sendEncrypted: (id: number, payload: {
    ciphertext: string; cipherIv: string; ephemeralPublicKey: string;
    recipientKeys: Array<{userId:number; wrappedKey:string; wrapIv:string}>;
    forwarded: boolean;
  }) =>
    apiRequest<typeof payload, Message>({
      path: `${ROOT}/conversations/${id}/encrypted-messages`,
      method: 'POST', body: payload,
    }),

  sendEncryptedFile: (id: number, payload: {
    ciphertext: string; cipherIv: string; ephemeralPublicKey: string;
    recipientKeys: Array<{userId:number; wrappedKey:string; wrapIv:string}>;
    forwarded: boolean;
  }, encryptedFile: File) => {
    const data = new FormData();
    data.append('file', encryptedFile);
    data.append('payload', JSON.stringify(payload));
    return apiRequest<FormData, Message>({
      path: `${ROOT}/conversations/${id}/encrypted-attachments`,
      method: 'POST', body: data, timeout: 45000,
    });
  },

  deleteConversation: (id: number) =>
    apiRequest<null, void>({
      path: `${ROOT}/conversations/${id}`, method: 'DELETE',
    }),

  uploadGroupAvatar: (id: number, file: File) => {
    const data = new FormData();
    data.append('file', file);
    return apiRequest<FormData, Conversation>({
      path: `${ROOT}/conversations/${id}/avatar`,
      method: 'POST', body: data, timeout: 30000,
    });
  },

  removeGroupAvatar: (id: number) =>
    apiRequest<null, Conversation>({
      path: `${ROOT}/conversations/${id}/avatar`, method: 'DELETE',
    }),

  typing: (id: number) =>
    apiRequest<null, Array<{ userId: number; name: string }>>({
      path: `${ROOT}/conversations/${id}/typing`,
      method: 'GET',
    }),

  setTyping: (id: number, typing: boolean) =>
    apiRequest<{ typing: boolean }, void>({
      path: `${ROOT}/conversations/${id}/typing`,
      method: 'POST',
      body: { typing },
    }),

  markRead: (id: number) =>
    apiRequest<null, void>({
      path: `${ROOT}/conversations/${id}/read`,
      method: 'POST',
    }),

  updateGroup: (
    id: number,
    data: {
      title?: string;
      description?: string;
      adminsOnlySend?: boolean;
      adminsOnlyEditInfo?: boolean;
    }
  ) =>
    apiRequest<typeof data, Conversation>({
      path: `${ROOT}/conversations/${id}/settings`,
      method: 'PATCH',
      body: data,
    }),

  addMember: (id: number, userId: number) =>
    apiRequest<{ userId: number }, Conversation>({
      path: `${ROOT}/conversations/${id}/members`,
      method: 'POST',
      body: { userId },
    }),

  setAdmin: (id: number, userId: number, admin: boolean) =>
    apiRequest<{ admin: boolean }, Conversation>({
      path: `${ROOT}/conversations/${id}/members/${userId}/admin`,
      method: 'PUT',
      body: { admin },
    }),

  removeMember: (id: number, userId: number) =>
    apiRequest<null, Conversation>({
      path: `${ROOT}/conversations/${id}/members/${userId}`,
      method: 'DELETE',
    }),

  leave: (id: number) =>
    apiRequest<null, void>({
      path: `${ROOT}/conversations/${id}/leave`,
      method: 'POST',
    }),

  deleteMessage: (id: number, messageId: number) =>
    apiRequest<null, Message>({
      path: `${ROOT}/conversations/${id}/messages/${messageId}`,
      method: 'DELETE',
    }),
};
