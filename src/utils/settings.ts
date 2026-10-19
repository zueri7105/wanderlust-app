// Central app-settings reader. All views read from here so changes in
// Settings propagate everywhere (App re-renders on 'wanderlust-settings-changed').

import type { AppLanguage } from './i18n';

export type PresenceStatus = 'online' | 'dnd' | 'offline' | 'hidden';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: AppLanguage;
  unitSystem: 'metric' | 'imperial';
  femaleSafetyPriority: boolean;
  anonymousMode: boolean;
  chatSounds: boolean;
  tripReminders: boolean;
  emergencyInterval: 'off' | '15min' | '30min' | '1hour';
  /** Chat presence shown on your messages profile: green dot, DND moon, orange offline, or no dot */
  presenceStatus: PresenceStatus;
  /** Language received messages are translated into. 'app' = follow the app language (default). */
  translateLang: 'app' | AppLanguage;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'en',
  unitSystem: 'metric',
  femaleSafetyPriority: false,
  anonymousMode: false,
  chatSounds: true,
  tripReminders: true,
  emergencyInterval: '30min',
  presenceStatus: 'online',
  translateLang: 'app'
};

/** Resolve the language code messages should be translated into (defaults to the app language). */
export const getTranslateTarget = (): string => {
  const s = getAppSettings();
  const lang = s.translateLang === 'app' ? s.language : s.translateLang;
  return lang === 'zh' ? 'zh-CN' : lang;
};

export function getAppSettings(): AppSettings {
  try {
    const saved = localStorage.getItem('wanderlust_app_settings');
    if (saved) {
      return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_APP_SETTINGS;
}

export const EMERGENCY_INTERVAL_MS: Record<AppSettings['emergencyInterval'], number | null> = {
  off: null,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1hour': 60 * 60 * 1000
};

// ─── Chat presence helpers ────────────────────────────────────────────────────
export const PRESENCE_META: Record<PresenceStatus, { label: string; hint: string; dot: string | null }> = {
  online: { label: 'Online', hint: 'Green dot — you are around and happy to chat.', dot: '#22c55e' },
  dnd: { label: 'Do Not Disturb', hint: 'Moon badge — quiet mode, replies may be slow.', dot: '#818cf8' },
  offline: { label: 'Appear Offline', hint: 'Orange dot — you look away to others.', dot: '#f97316' },
  hidden: { label: 'Presence Off', hint: 'No dot at all — presence tracking is switched off.', dot: null }
};

/** Deterministic demo presence for other travellers (so the UI shows variety). */
export const demoPresenceFor = (travelerId: string): PresenceStatus => {
  const order: PresenceStatus[] = ['online', 'dnd', 'offline', 'online', 'hidden', 'online'];
  let hash = 0;
  for (let i = 0; i < travelerId.length; i++) hash = (hash * 31 + travelerId.charCodeAt(i)) >>> 0;
  return order[hash % order.length];
};

/** Resolve the presence to show for a traveller id (the current user follows their setting). */
export const presenceForTraveler = (travelerId: string, currentUserId: string): PresenceStatus => {
  if (travelerId === currentUserId) return getAppSettings().presenceStatus;
  return demoPresenceFor(travelerId);
};
