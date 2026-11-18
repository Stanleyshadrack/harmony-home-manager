import { apiRequest } from '@/api/https';

export type NotificationTune = 'gentle' | 'bright' | 'classic' | 'soft' | 'urgent';

export interface NotificationSoundSettings {
  enabled: boolean;
  tune: NotificationTune;
  volume: number;
}

export const DEFAULT_SOUND_SETTINGS: NotificationSoundSettings = {
  enabled: true, tune: 'gentle', volume: 45,
};

export const SOUND_TUNES: { id: NotificationTune; name: string; description: string }[] = [
  { id: 'gentle', name: 'Gentle Chime', description: 'Two warm, calm notes' },
  { id: 'bright', name: 'Bright Bells', description: 'Three ascending notes' },
  { id: 'classic', name: 'Classic Ding', description: 'A short familiar bell' },
  { id: 'soft', name: 'Soft Ripple', description: 'A delicate four-note melody' },
  { id: 'urgent', name: 'Attention', description: 'Two clear alert pulses' },
];

type Note = { frequency: number; start: number; duration: number };
const notes: Record<NotificationTune, Note[]> = {
  gentle: [{frequency: 659.25, start: 0, duration: .25}, {frequency: 880, start: .17, duration: .36}],
  bright: [{frequency: 523.25, start: 0, duration: .18}, {frequency: 659.25, start: .13, duration: .18}, {frequency: 1046.5, start: .27, duration: .35}],
  classic: [{frequency: 783.99, start: 0, duration: .48}],
  soft: [{frequency: 523.25, start: 0, duration: .22}, {frequency: 659.25, start: .13, duration: .22}, {frequency: 783.99, start: .26, duration: .22}, {frequency: 1046.5, start: .39, duration: .32}],
  urgent: [{frequency: 880, start: 0, duration: .14}, {frequency: 880, start: .24, duration: .14}],
};

let audioContext: AudioContext | undefined;

export async function playNotificationTune(settings: NotificationSoundSettings, preview = false): Promise<void> {
  if ((!settings.enabled && !preview) || settings.volume <= 0) return;
  const Context = window.AudioContext;
  if (!Context) throw new Error('Audio is unavailable in this browser');
  audioContext ??= new Context();
  await audioContext.resume();
  if (audioContext.state !== 'running') throw new Error('Browser blocked audio playback');
  const now = audioContext.currentTime + .015;
  for (const note of notes[settings.tune] ?? notes.gentle) {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = settings.tune === 'urgent' ? 'triangle' : 'sine';
    oscillator.frequency.value = note.frequency;
    const start = now + note.start;
    const peak = Math.max(.0001, (settings.volume / 100) * .14);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(peak, start + .018);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + note.duration);
    oscillator.connect(envelope);
    envelope.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + note.duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }
}

/** Dedupes polling across notification bell and full-page instances.
 * The first successful result establishes a silent baseline; only later IDs may chime.
 */
const seenByUser = new Map<string, Set<string>>();
export function claimNewUnreadNotification(userId: string, items: {id: number; read: boolean}[]): boolean {
  const prior = seenByUser.get(userId);
  const currentIds = new Set(items.map(item => String(item.id)));
  if (!prior) {
    seenByUser.set(userId, currentIds);
    return false;
  }
  const isNew = items.some(item => !item.read && !prior.has(String(item.id)));
  for (const id of currentIds) prior.add(id);
  // Keep a bounded history while retaining IDs that are still in the feed.
  if (prior.size > 500) seenByUser.set(userId, currentIds);
  return isNew;
}

type SoundPreferencesResponse = { sound?: NotificationSoundSettings; inApp?: { enabled?: boolean } };
export async function playIncomingNotificationSound(): Promise<void> {
  if (document.visibilityState !== 'visible') return;
  try {
    const prefs = await apiRequest<null, SoundPreferencesResponse>({
      path: '/api/account-support/notification-preferences', method: 'GET',
    });
    if (prefs.inApp?.enabled === false) return;
    await playNotificationTune(prefs.sound ?? DEFAULT_SOUND_SETTINGS);
  } catch {
    // Notification delivery and badge updates never depend on audio permissions.
  }
}
