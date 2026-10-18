import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Globe,
  Bell,
  Shield,
  Sliders,
  Check,
  RefreshCw,
  Lock,
  Volume2,
  HeartHandshake
} from 'lucide-react';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es' | 'zh' | 'ja' | 'fr' | 'de';
  unitSystem: 'metric' | 'imperial';
  femaleSafetyPriority: boolean;
  anonymousMode: boolean;
  chatSounds: boolean;
  tripReminders: boolean;
  emergencyInterval: 'off' | '15min' | '30min' | '1hour';
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'en',
  unitSystem: 'metric',
  femaleSafetyPriority: false,
  anonymousMode: false,
  chatSounds: true,
  tripReminders: true,
  emergencyInterval: '30min'
};

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', native: '中文 (简体)', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' }
] as const;

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('wanderlust_app_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    localStorage.setItem('wanderlust_app_settings', JSON.stringify(settings));
    // Keep the standalone language key used by getTranslation() in sync
    localStorage.setItem('wanderlust_app_lang', settings.language);
    // Apply theme to document (App also listens and handles 'system')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    // Notify App so navigation labels re-render in the new language
    window.dispatchEvent(new Event('wanderlust-settings-changed'));
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset local demo changes and restore initial sample data?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md mb-2">
            <Sliders className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>App Preferences & Customization</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
            Settings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Personalize display theme, interface language, safety settings, and measurement units.
          </p>
        </div>

        {savedNotice && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Preferences Saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Theme & Appearance (Bright / Dark Mode) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                Display Theme
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch between Bright and Dark appearance for daytime or low-light travel.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => updateSetting('theme', 'light')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                settings.theme === 'light'
                  ? 'border-slate-950 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-slate-50 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Bright Mode</span>
              {settings.theme === 'light' && (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium">
                  Active
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => updateSetting('theme', 'dark')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                settings.theme === 'dark'
                  ? 'border-slate-950 dark:border-slate-100 bg-slate-900 dark:bg-slate-800 text-white font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark Mode</span>
              {settings.theme === 'dark' && (
                <span className="text-[10px] px-2 py-0.5 bg-indigo-900/60 text-indigo-200 border border-indigo-700 rounded font-medium">
                  Active
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. App Language */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                App Language
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the preferred language for navigation and guides.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {LANGUAGES.map((lang) => {
              const active = settings.language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => updateSetting('language', lang.code as any)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                    active
                      ? 'border-slate-950 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-slate-50 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="truncate">
                    <span className="mr-1.5">{lang.flag}</span>
                    <span>{lang.native}</span>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Units & Measurements */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                Measurement Units
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distances, hiking trail lengths, and weather temperatures.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => updateSetting('unitSystem', 'metric')}
              className={`flex-1 p-3 rounded-lg border text-center transition-all cursor-pointer ${
                settings.unitSystem === 'metric'
                  ? 'border-slate-950 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-slate-50 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Metric (°C, km, kg)
            </button>
            <button
              type="button"
              onClick={() => updateSetting('unitSystem', 'imperial')}
              className={`flex-1 p-3 rounded-lg border text-center transition-all cursor-pointer ${
                settings.unitSystem === 'imperial'
                  ? 'border-slate-950 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-slate-50 font-bold'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Imperial (°F, miles, lbs)
            </button>
          </div>
        </div>

        {/* 4. Safety & Solo Female Protection Mode */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                Safety & Companion Protections
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Safeguards for female travelers and safe meetup protocols.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
                  <span>Prioritize Female Solo Travelers</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Promote verified female solo traveler matches and safe public meet points.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.femaleSafetyPriority}
                onChange={(e) => updateSetting('femaleSafetyPriority', e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  <span>Private Profile Browsing</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Only show your full trip dates to travelers after mutual match acceptance.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.anonymousMode}
                onChange={(e) => updateSetting('anonymousMode', e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 5. Notifications & Sound */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                Alerts & Sound
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sound effects and companion chat notifications.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Play sound for incoming companion messages
              </span>
              <input
                type="checkbox"
                checked={settings.chatSounds}
                onChange={(e) => updateSetting('chatSounds', e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Morning daily itinerary schedule notifications
              </span>
              <input
                type="checkbox"
                checked={settings.tripReminders}
                onChange={(e) => updateSetting('tripReminders', e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* 6. Emergency Auto-Ping Interval */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                Emergency GPS Refresh Interval
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Frequency for updating your location broadcast when traveling solo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['off', '15min', '30min', '1hour'] as const).map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => updateSetting('emergencyInterval', interval)}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  settings.emergencyInterval === interval
                    ? 'border-slate-950 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 text-slate-950 dark:text-slate-50 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {interval === 'off' ? 'Manual Only' : `Every ${interval.replace('min', ' Minutes').replace('hour', ' Hour')}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">WanderLust v2.4</span> · Solo Group Travel Platform
        </div>
        <button
          type="button"
          onClick={handleResetData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-red-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-red-200 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Sample Demo Data</span>
        </button>
      </div>
    </div>
  );
};
