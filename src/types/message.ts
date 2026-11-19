/** DTOs from /api/chat. Never use fake user IDs for chat identities. */
export type ChatType = 'DIRECT' | 'GROUP';
export type ChatRole = 'SUPER_ADMIN' | 'LANDLORD' | 'EMPLOYEE' | 'TENANT';

export interface ChatContact {
  id: number;
  name: string;
  email: string;
  role: ChatRole;
  companyId: number | null;
  avatarUrl?: string | null;
}

export interface ChatMember {
  userId: number;
  name: string;
  role: ChatRole;
  admin: boolean;
  joinedAt: string;
  avatarUrl?: string | null;
}

export interface MessageAttachment {
  id: number;
  filename: string;
  contentType: string;
  size: number;
  encrypted?: boolean;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderRole: ChatRole;
  content: string;
  deleted: boolean;
  readBy: number[];
  createdAt: string;
  forwarded?: boolean;
  encrypted?: boolean;
  crypto?: { cipherIv: string; ephemeralPublicKey: string; wrappedKey: string; wrapIv: string } | null;
  decryptedAttachment?: { filename: string; contentType: string; fileIv: string };
  attachment?: MessageAttachment | null;
  senderAvatarUrl?: string | null;
}

export interface Conversation {
  id: number;
  type: ChatType;
  title: string;
  description: string | null;
  companyId: number | null;
  members: ChatMember[];
  lastMessage: Message | null;
  unreadCount: number;
  currentUserAdmin: boolean;
  adminsOnlySend: boolean;
  adminsOnlyEditInfo: boolean;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;
  e2eeEnabled?: boolean;
}

export interface NewConversationData {
  type: ChatType;
  participantIds: number[];
  title?: string;
  description?: string;
  initialMessage?: string;
}
