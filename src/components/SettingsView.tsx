import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { AppSettings, DEFAULT_APP_SETTINGS, PRESENCE_META, PresenceStatus } from '../utils/settings';

export type { AppSettings } from '../utils/settings';

const DEFAULT_SETTINGS = DEFAULT_APP_SETTINGS;

// Alphabetical by language name — keep sorted when adding a new language.
const LANGUAGES = [
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans', flag: '🇿🇦' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', native: '中文 (简体)', flag: '🇨🇳' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski', flag: '🇭🇷' },
  { code: 'cs', name: 'Czech', native: 'Čeština', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', native: 'Dansk', flag: '🇩🇰' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'fi', name: 'Finnish', native: 'Suomi', flag: '🇫🇮' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar', flag: '🇭🇺' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'no', name: 'Norwegian', native: 'Norsk', flag: '🇳🇴' },
  { code: 'fa', name: 'Persian', native: 'فارسی', flag: '🇮🇷' },
  { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'sr', name: 'Serbian', native: 'Српски', flag: '🇷🇸' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська', flag: '🇺🇦' }
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

  // Opening Settings should always start at the top of the page, not wherever
  // the previous screen had scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [savedNotice, setSavedNotice] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const currentLangMeta = LANGUAGES.find((l) => l.code === settings.language) || LANGUAGES[0];

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

  const savedNoticeTimer = useRef<number | null>(null);
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavedNotice(true);
    if (savedNoticeTimer.current) window.clearTimeout(savedNoticeTimer.current);
    savedNoticeTimer.current = window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleResetData = () => {
    if (window.confirm(getTranslation('setResetConfirm'))) {
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
              <span>{getTranslation('setBackToProfile')}</span>
            </button>
          )}
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>{getTranslation('setPreferences')}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
            {getTranslation('settingsTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {getTranslation('settingsSub')}
          </p>
        </div>

      </div>

      {/* Floating "preferences saved" toast — fixed overlay, never shifts layout */}
      {savedNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full text-xs font-semibold shadow-lg animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{getTranslation('setSaved')}</span>
          </div>
        </div>
      )}

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
                {getTranslation('setThemeSub')}
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
              <span>{getTranslation('setDaybreak')}</span>
              {settings.theme === 'light' && (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium">
                  {getTranslation('setActive')}
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
              <span>{getTranslation('setGalaxy')}</span>
              {settings.theme === 'dark' && (
                <span className="text-[10px] px-2 py-0.5 bg-indigo-900/60 text-indigo-200 border border-indigo-700 rounded font-medium">
                  {getTranslation('setActive')}
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
                {getTranslation('setLangSub')}
              </p>
            </div>
          </div>

          {/* One tap opens the full language list; the row shows the current pick. */}
          <button
            type="button"
            onClick={() => setLangPickerOpen(true)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">{currentLangMeta.flag}</span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentLangMeta.native}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">{currentLangMeta.name}</span>
              </span>
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              {getTranslation('setChange')}
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* Language picker sheet — full list, searchable-feel rows */}
        {langPickerOpen && (
          <div className="wl-modal-overlay" onClick={() => setLangPickerOpen(false)}>
            <div
              className="wl-modal-card max-w-md p-0 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-display font-bold text-sm text-slate-950 dark:text-slate-50">
                  {getTranslation('setChooseLang')}
                </h3>
                <button
                  type="button"
                  onClick={() => setLangPickerOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer text-slate-500"
                  aria-label={getTranslation('setChooseLang')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {LANGUAGES.map((lang) => {
                  const active = settings.language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        updateSetting('language', lang.code as any);
                        setLangPickerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-5 py-3 text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-slate-50 dark:bg-slate-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{lang.flag}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {lang.native}
                          </span>
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400">{lang.name}</span>
                        </span>
                      </span>
                      {active && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
                {getTranslation('setUnitsSub')}
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
              {getTranslation('setMetric')}
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
              {getTranslation('setImperial')}
            </button>
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
                {getTranslation('setAlertsTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {getTranslation('setAlertsSub')}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">

            <label className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {getTranslation('setMorningNotif')}
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
                {getTranslation('setEmergencyTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {getTranslation('setEmergencySub')}
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
                {interval === 'off'
                  ? getTranslation('setManualOnly')
                  : interval === '15min'
                    ? getTranslation('setEvery15')
                    : interval === '30min'
                      ? getTranslation('setEvery30')
                      : getTranslation('setEvery60')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">WanderLust v2.4</span> · {getTranslation('setVersionLine')}
        </div>
        <button
          type="button"
          onClick={handleResetData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-red-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-red-200 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{getTranslation('setResetData')}</span>
        </button>
      </div>
    </div>
  );
};
