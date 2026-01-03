// System lock service for manual and automatic system lockdown
// Note: Frontend-only for demo. Production should use server-side controls.

const STORAGE_KEY = 'system_lock';

export interface SystemLockState {
  isLocked: boolean;
  lockedAt: string | null;
  lockedBy: string | null;
  reason: string | null;
  autoLockEnabled: boolean;
  autoLockAfterHours: number; // Auto-lock after X hours of inactivity
  lastActivityAt: string;
  allowedRoles: string[]; // Roles that can still access when locked
}

const defaultState: SystemLockState = {
  isLocked: false,
  lockedAt: null,
  lockedBy: null,
  reason: null,
  autoLockEnabled: false,
  autoLockAfterHours: 24,
  lastActivityAt: new Date().toISOString(),
  allowedRoles: ['super_admin'],
};

export const getSystemLockState = (): SystemLockState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored);
      // Check for auto-lock
      if (state.autoLockEnabled && !state.isLocked) {
        const lastActivity = new Date(state.lastActivityAt).getTime();
        const now = Date.now();
        const hoursInactive = (now - lastActivity) / (1000 * 60 * 60);
        
        if (hoursInactive >= state.autoLockAfterHours) {
          const lockedState = {
            ...state,
            isLocked: true,
            lockedAt: new Date().toISOString(),
            lockedBy: 'System',
            reason: `Auto-locked after ${state.autoLockAfterHours} hours of inactivity`,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lockedState));
          return lockedState;
        }
      }
      return state;
    }
  } catch {
    // Ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
  return defaultState;
};

export const saveSystemLockState = (state: SystemLockState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const lockSystem = (adminEmail: string, reason: string): SystemLockState => {
  const currentState = getSystemLockState();
  const newState: SystemLockState = {
    ...currentState,
    isLocked: true,
    lockedAt: new Date().toISOString(),
    lockedBy: adminEmail,
    reason,
  };
  saveSystemLockState(newState);
  return newState;
};

export const unlockSystem = (adminEmail: string): SystemLockState => {
  const currentState = getSystemLockState();
  const newState: SystemLockState = {
    ...currentState,
    isLocked: false,
    lockedAt: null,
    lockedBy: null,
    reason: null,
    lastActivityAt: new Date().toISOString(),
  };
  saveSystemLockState(newState);
  
  // Log unlock action
  addLockLog({
    action: 'unlock',
    performedBy: adminEmail,
    timestamp: new Date().toISOString(),
    details: 'System unlocked',
  });
  
  return newState;
};

export const updateAutoLockSettings = (
  enabled: boolean,
  hours: number,
  allowedRoles: string[]
): SystemLockState => {
  const currentState = getSystemLockState();
  const newState: SystemLockState = {
    ...currentState,
    autoLockEnabled: enabled,
    autoLockAfterHours: hours,
    allowedRoles,
  };
  saveSystemLockState(newState);
  return newState;
};

export const recordActivity = (): void => {
  const currentState = getSystemLockState();
  currentState.lastActivityAt = new Date().toISOString();
  saveSystemLockState(currentState);
};

export const canAccessSystem = (userRole: string): boolean => {
  const state = getSystemLockState();
  if (!state.isLocked) return true;
  return state.allowedRoles.includes(userRole);
};

// Lock history
const LOCK_LOG_KEY = 'system_lock_logs';

export interface LockLogEntry {
  id: string;
  action: 'lock' | 'unlock' | 'auto_lock';
  performedBy: string;
  timestamp: string;
  details: string;
}

export const getLockLogs = (): LockLogEntry[] => {
  try {
    const stored = localStorage.getItem(LOCK_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addLockLog = (entry: Omit<LockLogEntry, 'id'>) => {
  const logs = getLockLogs();
  logs.unshift({
    ...entry,
    id: `lock-${Date.now()}`,
  });
  // Keep last 50 entries
  localStorage.setItem(LOCK_LOG_KEY, JSON.stringify(logs.slice(0, 50)));
};
