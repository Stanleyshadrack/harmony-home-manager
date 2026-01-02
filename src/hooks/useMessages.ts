import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message, NewConversationData, NewMessageData } from '@/types/message';
import { useAuth } from '@/contexts/AuthContext';

const CONVERSATIONS_KEY = 'conversations';
const MESSAGES_KEY = 'messages';

// Initial mock conversations
const initialMockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: [
      { userId: 'current-user', name: 'You', role: 'landlord' },
      { userId: 't1', name: 'John Doe', role: 'tenant' },
    ],
    type: 'direct',
    subject: 'Rent Payment Question',
    unreadCount: 2,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  {
    id: 'conv-2',
    participants: [
      { userId: 'current-user', name: 'You', role: 'landlord' },
      { userId: 'e1', name: 'James Kamau', role: 'employee' },
    ],
    type: 'direct',
    subject: 'Maintenance Update',
    unreadCount: 0,
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-14T16:45:00Z',
  },
  {
    id: 'conv-3',
    participants: [
      { userId: 'current-user', name: 'You', role: 'landlord' },
      { userId: 't2', name: 'Jane Smith', role: 'tenant' },
    ],
    type: 'direct',
    subject: 'Unit A102 - Lease Renewal',
    unreadCount: 1,
    createdAt: '2024-01-13T11:00:00Z',
    updatedAt: '2024-01-15T09:15:00Z',
  },
];

// Initial mock messages
const initialMockMessages: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 't1',
      senderName: 'John Doe',
      senderRole: 'tenant',
      content: 'Hi, I wanted to ask about the rent payment for this month.',
      isForwarded: false,
      readBy: ['t1'],
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'current-user',
      senderName: 'You',
      senderRole: 'landlord',
      content: 'Hello John! Of course, what would you like to know?',
      isForwarded: false,
      readBy: ['current-user', 't1'],
      createdAt: '2024-01-15T10:05:00Z',
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 't1',
      senderName: 'John Doe',
      senderRole: 'tenant',
      content: 'Can I pay via bank transfer this month? I usually use M-Pesa but my phone is having issues.',
      isForwarded: false,
      readBy: ['t1'],
      createdAt: '2024-01-15T14:30:00Z',
    },
  ],
  'conv-2': [
    {
      id: 'msg-4',
      conversationId: 'conv-2',
      senderId: 'e1',
      senderName: 'James Kamau',
      senderRole: 'employee',
      content: 'Good morning! I completed the plumbing repair in unit B202.',
      isForwarded: false,
      readBy: ['e1', 'current-user'],
      createdAt: '2024-01-14T09:00:00Z',
    },
    {
      id: 'msg-5',
      conversationId: 'conv-2',
      senderId: 'current-user',
      senderName: 'You',
      senderRole: 'landlord',
      content: 'Excellent work, James! Please send me the receipt for the parts.',
      isForwarded: false,
      readBy: ['current-user', 'e1'],
      createdAt: '2024-01-14T09:15:00Z',
    },
    {
      id: 'msg-6',
      conversationId: 'conv-2',
      senderId: 'e1',
      senderName: 'James Kamau',
      senderRole: 'employee',
      content: 'Will do! I\'ll upload it to the system shortly.',
      isForwarded: false,
      readBy: ['e1', 'current-user'],
      createdAt: '2024-01-14T16:45:00Z',
    },
  ],
  'conv-3': [
    {
      id: 'msg-7',
      conversationId: 'conv-3',
      senderId: 't2',
      senderName: 'Jane Smith',
      senderRole: 'tenant',
      content: 'Hi, I would like to discuss renewing my lease. The current one expires next month.',
      isForwarded: false,
      readBy: ['t2', 'current-user'],
      createdAt: '2024-01-13T11:00:00Z',
    },
    {
      id: 'msg-8',
      conversationId: 'conv-3',
      senderId: 'current-user',
      senderName: 'You',
      senderRole: 'landlord',
      content: 'Hello Jane! I\'d be happy to renew your lease. Would you prefer a 6-month or 12-month term?',
      isForwarded: false,
      readBy: ['current-user', 't2'],
      createdAt: '2024-01-13T11:30:00Z',
    },
    {
      id: 'msg-9',
      conversationId: 'conv-3',
      senderId: 't2',
      senderName: 'Jane Smith',
      senderRole: 'tenant',
      content: 'I\'d prefer a 12-month term. Will the rent remain the same?',
      isForwarded: false,
      readBy: ['t2'],
      createdAt: '2024-01-15T09:15:00Z',
    },
  ],
};

// Simulated incoming messages for testing
const simulatedMessages = [
  {
    conversationId: 'conv-1',
    senderId: 't1',
    senderName: 'John Doe',
    senderRole: 'tenant' as const,
    content: 'Thank you for your quick response! Yes, bank transfer would work great.',
  },
  {
    conversationId: 'conv-2',
    senderId: 'e1',
    senderName: 'James Kamau',
    senderRole: 'employee' as const,
    content: 'I\'ve uploaded the receipt. Also, unit C303 has a water heater issue that needs attention.',
  },
  {
    conversationId: 'conv-3',
    senderId: 't2',
    senderName: 'Jane Smith',
    senderRole: 'tenant' as const,
    content: 'I\'ve reviewed the terms. Everything looks good. When can we sign the new agreement?',
  },
  {
    conversationId: 'conv-1',
    senderId: 't1',
    senderName: 'John Doe',
    senderRole: 'tenant' as const,
    content: 'One more question - is there a discount for paying the full year upfront?',
  },
  {
    conversationId: 'conv-2',
    senderId: 'e1',
    senderName: 'James Kamau',
    senderRole: 'employee' as const,
    content: 'I\'ve finished the water reading for all units in Block A. Submitting the data now.',
  },
];

const getStoredConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore
  }
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(initialMockConversations));
  return initialMockConversations;
};

const getStoredMessages = (): Record<string, Message[]> => {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore
  }
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(initialMockMessages));
  return initialMockMessages;
};

const saveConversations = (conversations: Conversation[]) => {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
};

const saveMessages = (messages: Record<string, Message[]>) => {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
};

// Notification helper for new messages
const addMessageNotification = (data: {
  userId: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  link?: string;
}) => {
  const NOTIF_KEY = 'in_app_notifications';
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(NOTIF_KEY, JSON.stringify([newNotification, ...notifications].slice(0, 100)));
  } catch {
    // Ignore
  }
};

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const simulationIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setConversations(getStoredConversations());
    setIsLoading(false);

    // Start real-time simulation - incoming messages every 20-35 seconds
    const startSimulation = () => {
      intervalRef.current = setInterval(() => {
        if (simulationIndexRef.current >= simulatedMessages.length) {
          simulationIndexRef.current = 0; // Loop back
        }

        const simMsg = simulatedMessages[simulationIndexRef.current];
        const newMessage: Message = {
          id: `msg-sim-${Date.now()}`,
          conversationId: simMsg.conversationId,
          senderId: simMsg.senderId,
          senderName: simMsg.senderName,
          senderRole: simMsg.senderRole,
          content: simMsg.content,
          isForwarded: false,
          readBy: [simMsg.senderId],
          createdAt: new Date().toISOString(),
        };

        // Update messages
        const allMessages = getStoredMessages();
        if (!allMessages[simMsg.conversationId]) {
          allMessages[simMsg.conversationId] = [];
        }
        allMessages[simMsg.conversationId].push(newMessage);
        saveMessages(allMessages);

        // Update conversation
        const updatedConversations = getStoredConversations().map(conv => {
          if (conv.id === simMsg.conversationId) {
            return {
              ...conv,
              lastMessage: newMessage,
              unreadCount: conv.unreadCount + 1,
              updatedAt: new Date().toISOString(),
            };
          }
          return conv;
        });
        saveConversations(updatedConversations);
        setConversations(updatedConversations);

        // Add notification for new message
        addMessageNotification({
          userId: 'all',
          title: 'New Message',
          message: `${simMsg.senderName}: ${simMsg.content.substring(0, 50)}${simMsg.content.length > 50 ? '...' : ''}`,
          category: 'new_message',
          priority: 'medium',
          link: '/messages',
        });

        simulationIndexRef.current++;
      }, 20000 + Math.random() * 15000); // 20-35 seconds
    };

    startSimulation();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const createConversation = useCallback(async (data: NewConversationData): Promise<Conversation> => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      participants: [
        { userId: 'current-user', name: 'You', role: 'landlord' },
        ...data.participantIds.map(id => ({
          userId: id,
          name: `User ${id}`,
          role: 'tenant' as const,
        })),
      ],
      type: data.participantIds.length > 1 ? 'group' : 'direct',
      subject: data.subject,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    saveConversations(updatedConversations);

    // Add initial message
    const initialMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: newConversation.id,
      senderId: 'current-user',
      senderName: 'You',
      senderRole: 'landlord',
      content: data.initialMessage,
      isForwarded: false,
      readBy: ['current-user'],
      createdAt: new Date().toISOString(),
    };

    const allMessages = getStoredMessages();
    allMessages[newConversation.id] = [initialMessage];
    saveMessages(allMessages);

    return newConversation;
  }, [conversations]);

  const markAsRead = useCallback(async (conversationId: string): Promise<void> => {
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return { ...conv, unreadCount: 0 };
      }
      return conv;
    });
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
  }, [conversations]);

  const refreshConversations = useCallback(() => {
    setConversations(getStoredConversations());
  }, []);

  return {
    conversations,
    isLoading,
    createConversation,
    markAsRead,
    refreshConversations,
  };
}

export function useMessages(conversationId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const loadMessages = () => {
      const allMessages = getStoredMessages();
      setMessages(allMessages[conversationId] || []);
      setIsLoading(false);
    };

    loadMessages();

    // Poll for new messages every 2 seconds
    intervalRef.current = setInterval(loadMessages, 2000);

    // Simulate typing indicators occasionally
    const simulateTyping = () => {
      const conversations = getStoredConversations();
      const currentConv = conversations.find(c => c.id === conversationId);
      if (currentConv) {
        const otherParticipant = currentConv.participants.find(p => p.userId !== 'current-user');
        if (otherParticipant && Math.random() > 0.7) {
          setTypingUsers([otherParticipant.name]);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers([]);
          }, 2000 + Math.random() * 2000);
        }
      }
    };

    const typingInterval = setInterval(simulateTyping, 8000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearInterval(typingInterval);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  const markMessageAsRead = useCallback((messageId: string) => {
    const allMessages = getStoredMessages();
    if (allMessages[conversationId]) {
      allMessages[conversationId] = allMessages[conversationId].map(msg => {
        if (msg.id === messageId && !msg.readBy.includes('current-user')) {
          return { ...msg, readBy: [...msg.readBy, 'current-user'] };
        }
        return msg;
      });
      saveMessages(allMessages);
      setMessages(allMessages[conversationId]);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (data: NewMessageData): Promise<Message> => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: data.conversationId,
      senderId: 'current-user',
      senderName: user ? `${user.firstName} ${user.lastName}` : 'You',
      senderRole: (user?.role as 'tenant' | 'employee' | 'landlord') || 'landlord',
      content: data.content,
      isForwarded: false,
      readBy: ['current-user'],
      createdAt: new Date().toISOString(),
    };

    const allMessages = getStoredMessages();
    if (!allMessages[data.conversationId]) {
      allMessages[data.conversationId] = [];
    }
    allMessages[data.conversationId].push(newMessage);
    saveMessages(allMessages);
    setMessages(allMessages[data.conversationId]);

    // Update conversation's last message
    const storedConversations = getStoredConversations();
    const updatedConversations = storedConversations.map(conv => {
      if (conv.id === data.conversationId) {
        return {
          ...conv,
          lastMessage: newMessage,
          updatedAt: new Date().toISOString(),
        };
      }
      return conv;
    });
    saveConversations(updatedConversations);

    // Simulate message being read after a delay
    setTimeout(() => {
      const msgs = getStoredMessages();
      if (msgs[data.conversationId]) {
        msgs[data.conversationId] = msgs[data.conversationId].map(msg => {
          if (msg.id === newMessage.id) {
            const conversations = getStoredConversations();
            const conv = conversations.find(c => c.id === data.conversationId);
            const otherParticipants = conv?.participants.filter(p => p.userId !== 'current-user').map(p => p.name) || [];
            return { ...msg, readBy: [...msg.readBy, ...otherParticipants] };
          }
          return msg;
        });
        saveMessages(msgs);
        setMessages(msgs[data.conversationId]);
      }
    }, 3000 + Math.random() * 5000);

    return newMessage;
  }, [user]);

  const forwardMessage = useCallback(async (messageId: string, toConversationId: string): Promise<Message> => {
    const allMessages = getStoredMessages();
    let originalMessage: Message | undefined;
    
    for (const msgs of Object.values(allMessages)) {
      originalMessage = msgs.find(m => m.id === messageId);
      if (originalMessage) break;
    }

    if (!originalMessage) {
      throw new Error('Message not found');
    }

    const forwardedMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: toConversationId,
      senderId: 'current-user',
      senderName: user ? `${user.firstName} ${user.lastName}` : 'You',
      senderRole: (user?.role as 'tenant' | 'employee' | 'landlord') || 'landlord',
      content: originalMessage.content,
      isForwarded: true,
      forwardedFrom: originalMessage.senderName,
      readBy: ['current-user'],
      createdAt: new Date().toISOString(),
    };

    if (!allMessages[toConversationId]) {
      allMessages[toConversationId] = [];
    }
    allMessages[toConversationId].push(forwardedMessage);
    saveMessages(allMessages);

    return forwardedMessage;
  }, [user]);

  return {
    messages,
    isLoading,
    sendMessage,
    forwardMessage,
    typingUsers,
    markMessageAsRead,
  };
}
