export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'tenant' | 'employee' | 'landlord';
  content: string;
  attachments?: MessageAttachment[];
  isForwarded: boolean;
  forwardedFrom?: string;
  readBy: string[];
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  type: 'direct' | 'group';
  subject?: string;
  propertyId?: string;
  unitId?: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  userId: string;
  name: string;
  role: 'tenant' | 'employee' | 'landlord';
  avatarUrl?: string;
}

export interface NewMessageData {
  conversationId: string;
  content: string;
  attachments?: File[];
}

export interface NewConversationData {
  participantIds: string[];
  subject?: string;
  initialMessage: string;
}
