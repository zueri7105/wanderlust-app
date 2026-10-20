import React, { useState, useEffect } from 'react';
import { getTranslation } from '../utils/i18n';
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
  HeartHandshake,
  CircleDot,
  Info,
  Languages,
  ArrowLeft
} from 'lucide-react';
import { AppSettings, DEFAULT_APP_SETTINGS, PRESENCE_META, PresenceStatus } from '../utils/settings';

export type { AppSettings } from '../utils/settings';

const DEFAULT_SETTINGS = DEFAULT_APP_SETTINGS;

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'zh', name: 'Chinese', native: '中文 (简体)', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱' }
] as const;

export const SettingsView: React.FC<{ userGender?: string; onBack?: () => void }> = ({ userGender, onBack }) => {
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
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Profile</span>
            </button>
          )}
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
            {getTranslation('settingsTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {getTranslation('settingsSub')}
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs">
              {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                {getTranslation('themeLabel')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bright for daytime exploring, Dark for late-night planning.
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                {getTranslation('languageLabel')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick the language for menus, guides and messages.
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                {getTranslation('unitsLabel')}
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

        {/* 4. Chat Presence Status — pick the badge others see on your messages profile */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-sky-500 text-white flex items-center justify-center shadow-xs">
              <CircleDot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                Chat Presence Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the badge companions see next to your messages profile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {(Object.keys(PRESENCE_META) as PresenceStatus[]).map((status) => {
              const meta = PRESENCE_META[status];
              const active = settings.presenceStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateSetting('presenceStatus', status)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-slate-950 dark:border-slate-100 bg-slate-50 dark:bg-slate-800 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                      {status === 'hidden' ? (
                        <span className="w-3 h-3 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600" title="No dot" />
                      ) : status === 'dnd' ? (
                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-400 flex items-center justify-center">
                          <Moon className="w-2 h-2 text-white" />
                        </span>
                      ) : (
                        <span className="w-3 h-3 rounded-full" style={{ background: meta.dot || '#cbd5e1' }} />
                      )}
                      {meta.label}
                    </span>
                    {active && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    {meta.hint}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4b. Message Translation — which language received messages are translated into */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-xs">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                Message Translation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tap "Translate" on any message and it lands in this language.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <select
              value={settings.translateLang || 'app'}
              onChange={(e) => updateSetting('translateLang', e.target.value as AppSettings['translateLang'])}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium cursor-pointer"
            >
              <option value="app">
                Same as my app language ({LANGUAGES.find((l) => l.code === settings.language)?.native || 'English'})
              </option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.native} ({lang.name})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 leading-snug">
              By default messages translate into your app language. Pick another language here if you'd rather read
              translations in something else — handy while you're practising Spanish on the road!
            </p>
          </div>
        </div>

        {/* 5. Safety & Solo Female Protection Mode */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-red-500 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                {getTranslation('safetyLabel')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Safeguards and safe meet-up protocols while travelling.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Only travellers whose profile gender is female see this protection option */}
            {userGender === 'female' ? (
              <div className="flex items-center justify-between gap-3 p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-lg">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
                    <span>Prioritise Female Solo Travellers</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Promote verified female solo traveller matches and safe public meet-up points.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.femaleSafetyPriority}
                  onChange={(e) => updateSetting('femaleSafetyPriority', e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Female-only matching</span> is
                  available on profiles where gender is set to female. Update your gender under{' '}
                  <span className="font-semibold">My Profile → Edit Profile</span> to unlock this option.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                  <span>Private Profile Browsing</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Only reveal your full trip dates to travellers after a mutual match.
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

        {/* 6. Notifications & Sound */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white flex items-center justify-center shadow-xs">
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

        {/* 7. Emergency Auto-Ping Interval */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-rose-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                Emergency GPS Refresh Interval
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                How often your live location refreshes while you are out exploring solo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
          <span className="font-semibold text-slate-900 dark:text-slate-100">WanderLust v2.4</span> · Premium Itinerary Planner
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
