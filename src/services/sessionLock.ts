import { tokenService } from '@/services/tokenService';

const LOCK_KEY = 'apartment:session-lock';
const LOCK_EVENT = 'apartment:lock-event';
export const SESSION_LOCK_EVENT = 'apartment:request-lock';
export const SESSION_IDLE_MINUTES = 30;
export const IDLE_LOCK_OPTIONS = [1, 5, 30] as const;
export type IdleLockMinutes = typeof IDLE_LOCK_OPTIONS[number];
export const SESSION_LOCK_PREFERENCE_EVENT = 'apartment:idle-lock-preference-changed';
const IDLE_LOCK_PREFERENCE_PREFIX = 'apartment:idle-lock-minutes:';

export function getIdleLockMinutes(userId: string | number): IdleLockMinutes {
  try {
    const value = Number(localStorage.getItem(IDLE_LOCK_PREFERENCE_PREFIX + String(userId)));
    if (value === 1 || value === 5 || value === 30) return value;
  } catch { /* Browser storage may be blocked. */ }
  return SESSION_IDLE_MINUTES;
}

export function setIdleLockMinutes(userId: string | number, minutes: IdleLockMinutes) {
  if (!IDLE_LOCK_OPTIONS.includes(minutes)) throw new Error('Invalid lock interval');
  localStorage.setItem(IDLE_LOCK_PREFERENCE_PREFIX + String(userId), String(minutes));
  window.dispatchEvent(new Event(SESSION_LOCK_PREFERENCE_EVENT));
}

export function isIdleLockPreferenceKey(key: string | null) {
  return !!key?.startsWith(IDLE_LOCK_PREFERENCE_PREFIX);
}

type LockInfo = { email: string; path: string; at: number; reason: 'manual' | 'idle' | 'other-tab'; idleMinutes?: number };

export function readLockInfo(): LockInfo | null {
  try {
    const raw = sessionStorage.getItem(LOCK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LockInfo;
    return parsed?.email && parsed?.path ? parsed : null;
  } catch { return null; }
}

/** Immediately remove usable browser credentials before signalling the UI. */
export function lockSession(reason: LockInfo['reason'] = 'manual', broadcast = true, idleMinutes?: number) {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname + window.location.search;
  const email = window.localStorage.getItem('apartment:active-email') || '';
  sessionStorage.setItem(LOCK_KEY, JSON.stringify({
    email, path: path.startsWith('/auth') || path.startsWith('/locked') ? '/dashboard' : path,
    at: Date.now(), reason, idleMinutes,
  } satisfies LockInfo));
  tokenService.clearTokens();
  // A storage event is delivered to other tabs sharing this origin.
  if (broadcast) localStorage.setItem(LOCK_EVENT, String(Date.now()));
  window.dispatchEvent(new Event(SESSION_LOCK_EVENT));
}

export function isLockBroadcastKey(key: string | null) {
  return key === LOCK_EVENT;
}

/** Never restore the previous page when another account authenticates. */
export function consumeUnlockDestination(email: string, defaultPath: string): string {
  const info = readLockInfo();
  sessionStorage.removeItem(LOCK_KEY);
  if (!info || info.email.toLowerCase() !== email.toLowerCase()) return defaultPath;
  const path = info.path;
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/auth') ||
    path.startsWith('/locked') || path.includes('\\')) return defaultPath;
  return path;
}

export function discardLockInfo() {
  sessionStorage.removeItem(LOCK_KEY);
}
