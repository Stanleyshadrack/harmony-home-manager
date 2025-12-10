export interface Session {
  id: string;
  userId: string;
  deviceInfo: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

const SESSIONS_KEY = 'user_sessions';

const getBrowserInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown Browser';
};

const getOSInfo = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
  return 'Unknown OS';
};

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  return 'Desktop';
};

// Mock locations for demo purposes
const mockLocations = ['Nairobi, Kenya', 'Mombasa, Kenya', 'Kisumu, Kenya', 'Nakuru, Kenya'];
const mockIPs = ['192.168.1.', '10.0.0.', '172.16.0.'];

export const sessionService = {
  getSessions: (userId: string): Session[] => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      if (!stored) return [];
      const sessions: Session[] = JSON.parse(stored);
      return sessions.filter(s => s.userId === userId);
    } catch {
      return [];
    }
  },

  createSession: (userId: string): Session => {
    const sessions = sessionService.getSessions(userId);
    
    // Mark all existing sessions as not current
    sessions.forEach(s => s.isCurrent = false);
    
    const newSession: Session = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      deviceInfo: getDeviceType(),
      browser: getBrowserInfo(),
      os: getOSInfo(),
      ipAddress: mockIPs[Math.floor(Math.random() * mockIPs.length)] + Math.floor(Math.random() * 255),
      location: mockLocations[0], // Current session always from primary location
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isCurrent: true,
    };
    
    sessions.push(newSession);
    
    // Add some mock historical sessions for demo
    if (sessions.length === 1) {
      const mockSessions: Session[] = [
        {
          id: `session-mock-1`,
          userId,
          deviceInfo: 'Mobile',
          browser: 'Chrome',
          os: 'Android',
          ipAddress: '192.168.1.45',
          location: 'Mombasa, Kenya',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          isCurrent: false,
        },
        {
          id: `session-mock-2`,
          userId,
          deviceInfo: 'Desktop',
          browser: 'Firefox',
          os: 'Windows',
          ipAddress: '10.0.0.123',
          location: 'Kisumu, Kenya',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          isCurrent: false,
        },
      ];
      sessions.push(...mockSessions);
    }
    
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return newSession;
  },

  updateLastActive: (sessionId: string): void => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      if (!stored) return;
      
      const sessions: Session[] = JSON.parse(stored);
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.lastActiveAt = new Date().toISOString();
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      }
    } catch {
      // Ignore errors
    }
  },

  revokeSession: (sessionId: string): boolean => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      if (!stored) return false;
      
      const sessions: Session[] = JSON.parse(stored);
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
      return true;
    } catch {
      return false;
    }
  },

  revokeAllOtherSessions: (userId: string, currentSessionId: string): number => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      if (!stored) return 0;
      
      const sessions: Session[] = JSON.parse(stored);
      const userSessions = sessions.filter(s => s.userId === userId);
      const otherSessions = userSessions.filter(s => s.id !== currentSessionId);
      const count = otherSessions.length;
      
      const updatedSessions = sessions.filter(s => s.userId !== userId || s.id === currentSessionId);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
      
      return count;
    } catch {
      return 0;
    }
  },

  getCurrentSession: (userId: string): Session | null => {
    const sessions = sessionService.getSessions(userId);
    return sessions.find(s => s.isCurrent) || null;
  },
};
