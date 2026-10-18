// Central app-settings reader. All views read from here so changes in
// Settings propagate everywhere (App re-renders on 'wanderlust-settings-changed').

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'zh' | 'ja' | 'fr' | 'de' | 'ko' | 'pt' | 'ar' | 'ru';
  unitSystem: 'metric' | 'imperial';
  femaleSafetyPriority: boolean;
  anonymousMode: boolean;
  chatSounds: boolean;
  tripReminders: boolean;
  emergencyInterval: 'off' | '15min' | '30min' | '1hour';
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'en',
  unitSystem: 'metric',
  femaleSafetyPriority: false,
  anonymousMode: false,
  chatSounds: true,
  tripReminders: true,
  emergencyInterval: '30min'
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
