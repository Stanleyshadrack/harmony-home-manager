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
