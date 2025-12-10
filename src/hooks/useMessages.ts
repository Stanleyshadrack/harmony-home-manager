import { useState, useEffect } from 'react';
import { Message, Conversation, NewMessageData, NewConversationData } from '@/types/message';

const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: [
      { userId: 'user-1', name: 'John Doe', role: 'tenant' },
      { userId: 'emp-1', name: 'James Mwangi', role: 'employee' },
    ],
    type: 'direct',
    subject: 'Plumbing Issue - Unit A101',
    propertyId: '1',
    unitId: '1',
    unreadCount: 2,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
  },
  {
    id: '2',
    participants: [
      { userId: 'user-2', name: 'Mary Wanjiku', role: 'tenant' },
      { userId: 'landlord-1', name: 'David Kimani', role: 'landlord' },
    ],
    type: 'direct',
    subject: 'Rent Payment Query',
    unreadCount: 0,
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
  {
    id: '3',
    participants: [
      { userId: 'emp-1', name: 'James Mwangi', role: 'employee' },
      { userId: 'landlord-1', name: 'David Kimani', role: 'landlord' },
    ],
    type: 'direct',
    subject: 'Monthly Report',
    unreadCount: 1,
    createdAt: '2024-01-13T08:00:00Z',
    updatedAt: '2024-01-16T09:00:00Z',
  },
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      conversationId: '1',
      senderId: 'user-1',
      senderName: 'John Doe',
      senderRole: 'tenant',
      content: 'Hi, there is a leak in my kitchen sink. It started this morning.',
      isForwarded: false,
      readBy: ['user-1', 'emp-1'],
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      conversationId: '1',
      senderId: 'emp-1',
      senderName: 'James Mwangi',
      senderRole: 'employee',
      content: 'Thank you for reporting. I will come to inspect it this afternoon around 2 PM. Will that work for you?',
      isForwarded: false,
      readBy: ['user-1', 'emp-1'],
      createdAt: '2024-01-15T10:15:00Z',
    },
    {
      id: '3',
      conversationId: '1',
      senderId: 'user-1',
      senderName: 'John Doe',
      senderRole: 'tenant',
      content: 'Yes, 2 PM works for me. Thank you!',
      isForwarded: false,
      readBy: ['user-1', 'emp-1'],
      createdAt: '2024-01-15T10:20:00Z',
    },
    {
      id: '4',
      conversationId: '1',
      senderId: 'emp-1',
      senderName: 'James Mwangi',
      senderRole: 'employee',
      content: 'I have inspected the issue. It requires a plumber. I will arrange for one tomorrow morning.',
      isForwarded: false,
      readBy: ['emp-1'],
      createdAt: '2024-01-16T14:30:00Z',
    },
  ],
  '2': [
    {
      id: '5',
      conversationId: '2',
      senderId: 'user-2',
      senderName: 'Mary Wanjiku',
      senderRole: 'tenant',
      content: 'Hello, I wanted to confirm if my payment for January was received?',
      isForwarded: false,
      readBy: ['user-2', 'landlord-1'],
      createdAt: '2024-01-14T09:00:00Z',
    },
    {
      id: '6',
      conversationId: '2',
      senderId: 'landlord-1',
      senderName: 'David Kimani',
      senderRole: 'landlord',
      content: 'Yes, we received your payment of KES 30,000 on January 5th. Thank you!',
      isForwarded: false,
      readBy: ['user-2', 'landlord-1'],
      createdAt: '2024-01-15T11:00:00Z',
    },
  ],
  '3': [
    {
      id: '7',
      conversationId: '3',
      senderId: 'emp-1',
      senderName: 'James Mwangi',
      senderRole: 'employee',
      content: 'Good morning. Here is the monthly maintenance report for Sunrise Apartments.',
      isForwarded: false,
      readBy: ['emp-1'],
      createdAt: '2024-01-16T09:00:00Z',
    },
  ],
};

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      // Add last message to conversations
      const conversationsWithLastMessage = mockConversations.map((conv) => {
        const messages = mockMessages[conv.id] || [];
        return {
          ...conv,
          lastMessage: messages[messages.length - 1],
        };
      });
      setConversations(conversationsWithLastMessage);
      setIsLoading(false);
    }, 500);
  }, []);

  const createConversation = async (data: NewConversationData): Promise<Conversation> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newConversation: Conversation = {
      id: Date.now().toString(),
      participants: data.participantIds.map((id) => ({
        userId: id,
        name: 'New User',
        role: 'tenant',
      })),
      type: data.participantIds.length > 2 ? 'group' : 'direct',
      subject: data.subject,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    return newConversation;
  };

  const markAsRead = async (conversationId: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );
  };

  return {
    conversations,
    isLoading,
    createConversation,
    markAsRead,
  };
}

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setMessages(mockMessages[conversationId] || []);
      setIsLoading(false);
    }, 300);
  }, [conversationId]);

  const sendMessage = async (data: NewMessageData): Promise<Message> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId: data.conversationId,
      senderId: 'current-user',
      senderName: 'You',
      senderRole: 'landlord',
      content: data.content,
      isForwarded: false,
      readBy: ['current-user'],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const forwardMessage = async (
    messageId: string,
    toConversationId: string
  ): Promise<Message> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const originalMessage = messages.find((m) => m.id === messageId);
    if (!originalMessage) throw new Error('Message not found');

    const forwardedMessage: Message = {
      id: Date.now().toString(),
      conversationId: toConversationId,
      senderId: 'current-user',
      senderName: 'You',
      senderRole: 'landlord',
      content: originalMessage.content,
      isForwarded: true,
      forwardedFrom: originalMessage.senderName,
      readBy: ['current-user'],
      createdAt: new Date().toISOString(),
    };
    return forwardedMessage;
  };

  return {
    messages,
    isLoading,
    sendMessage,
    forwardMessage,
  };
}
