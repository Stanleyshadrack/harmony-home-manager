// Login security service for tracking failed attempts and account lockout
// Note: This is frontend-only for demo. Production should use server-side tracking.

const STORAGE_KEY = 'loginAttempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LoginAttempt {
  email: string;
  failedAttempts: number;
  lastFailedAt: number;
  lockedUntil: number | null;
}

const getAttempts = (): LoginAttempt[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveAttempts = (attempts: LoginAttempt[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
};

const getAttemptForEmail = (email: string): LoginAttempt | undefined => {
  return getAttempts().find(a => a.email.toLowerCase() === email.toLowerCase());
};

export const isAccountLocked = (email: string): { locked: boolean; remainingMs: number } => {
  const attempt = getAttemptForEmail(email);
  
  if (!attempt?.lockedUntil) {
    return { locked: false, remainingMs: 0 };
  }
  
  const now = Date.now();
  if (now >= attempt.lockedUntil) {
    // Lockout expired, reset attempts
    resetAttempts(email);
    return { locked: false, remainingMs: 0 };
  }
  
  return { locked: true, remainingMs: attempt.lockedUntil - now };
};

export const recordFailedAttempt = (email: string): { locked: boolean; attemptsRemaining: number } => {
  const attempts = getAttempts();
  const existingIndex = attempts.findIndex(a => a.email.toLowerCase() === email.toLowerCase());
  
  const now = Date.now();
  
  if (existingIndex >= 0) {
    const existing = attempts[existingIndex];
    
    // Check if previous lockout expired
    if (existing.lockedUntil && now >= existing.lockedUntil) {
      existing.failedAttempts = 1;
      existing.lockedUntil = null;
    } else {
      existing.failedAttempts += 1;
    }
    
    existing.lastFailedAt = now;
    
    // Check if should lock
    if (existing.failedAttempts >= MAX_ATTEMPTS) {
      existing.lockedUntil = now + LOCKOUT_DURATION_MS;
      saveAttempts(attempts);
      return { locked: true, attemptsRemaining: 0 };
    }
    
    saveAttempts(attempts);
    return { locked: false, attemptsRemaining: MAX_ATTEMPTS - existing.failedAttempts };
  } else {
    // First failed attempt for this email
    attempts.push({
      email: email.toLowerCase(),
      failedAttempts: 1,
      lastFailedAt: now,
      lockedUntil: null,
    });
    saveAttempts(attempts);
    return { locked: false, attemptsRemaining: MAX_ATTEMPTS - 1 };
  }
};

export const resetAttempts = (email: string): void => {
  const attempts = getAttempts().filter(a => a.email.toLowerCase() !== email.toLowerCase());
  saveAttempts(attempts);
};

export const formatRemainingTime = (ms: number): string => {
  const minutes = Math.ceil(ms / 60000);
  if (minutes <= 1) {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
};

export const getMaxAttempts = (): number => MAX_ATTEMPTS;
