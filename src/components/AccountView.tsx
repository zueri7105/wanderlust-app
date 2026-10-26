import React, { useState } from 'react';
import {
  ArrowLeft,
  LogOut,
  MapPin,
  Trash2,
  Radio,
  Check,
  User,
} from 'lucide-react';
import { getTranslation, tv } from '../utils/i18n';
import { getAppSettings } from '../utils/settings';
import { useAuth } from '@/hooks/useAuth';
import { usePingConsent } from '@/hooks/usePingCollector';
import { trpc } from '@/providers/trpc';
import { getKimiOAuthUrl } from '../services/kimiOAuth';

const t = getTranslation;

function relTime(d: Date): string {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 90) return t('acctPingNow');
  const m = Math.round(s / 60);
  if (m < 60) return tv('acctPingMin', { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return tv('acctPingHour', { n: h });
  return tv('acctPingDay', { n: Math.round(h / 24) });
}

const SOON_PROVIDERS = [
  { name: 'Google (Gmail)', icon: 'G' },
  { name: 'Apple', icon: '' },
  { name: 'WeChat', icon: '微' },
];

export const AccountView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const collector = usePingConsent();
  // Badge state derived locally — this view never runs the collector itself
  // (collection lives solely in App's usePingCollector).
  const status: 'off' | 'paused' | 'live' = !isAuthenticated
    ? 'off'
    : !collector.consent || getAppSettings().emergencyInterval === 'off'
      ? 'paused'
      : 'live';
  const [confirmClear, setConfirmClear] = useState(false);

  const pingsQuery = trpc.pings.list.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated, retry: false },
  );
  const countQuery = trpc.pings.count.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
  });
  const utils = trpc.useUtils();

  const removePing = trpc.pings.remove.useMutation({
    onSuccess: () => {
      utils.pings.list.invalidate();
      utils.pings.count.invalidate();
    },
  });
  const clearPings = trpc.pings.clear.useMutation({
    onSuccess: () => {
      utils.pings.list.invalidate();
      utils.pings.count.invalidate();
      setConfirmClear(false);
    },
  });

  const pings = pingsQuery.data ?? [];
  const oauthUrl = getKimiOAuthUrl();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
            title={t('setBackToProfile')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="font-display font-bold text-2xl text-stone-950 dark:text-stone-50">
            {t('acctTitle')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {t('acctSub')}
          </p>
        </div>
      </div>

      {/* 1 — Sign-in */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        {isLoading ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('acctPingsLoading')}
          </p>
        ) : isAuthenticated && user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-stone-950 dark:text-stone-50 truncate">
                  {user.name ?? '—'}
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  {user.email ?? user.unionId}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                <Check className="w-3 h-3" />
                {t('acctSignedIn')}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              {t('acctSignOut')}
            </button>
          </>
        ) : (
          <>
            <div>
              <h3 className="font-display font-bold text-base text-stone-950 dark:text-stone-50">
                {t('acctSignInTitle')}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {t('acctSignInSub')}
              </p>
            </div>
            <button
              type="button"
              disabled={!oauthUrl}
              onClick={() => {
                if (oauthUrl) window.location.href = oauthUrl;
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-950 dark:bg-stone-50 text-white dark:text-stone-950 text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {t('acctContinueKimi')}
            </button>
          </>
        )}
      </div>

      {/* 2 — Linked providers */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="pb-3 border-b border-stone-100 dark:border-stone-800">
          <h3 className="font-display font-bold text-base text-stone-950 dark:text-stone-50">
            {t('acctLinkedTitle')}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {t('acctLinkedSub')}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white flex items-center justify-center text-sm font-bold">
              K
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                {t('acctProviderKimi')}
              </p>
            </div>
            {isAuthenticated ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                <Check className="w-3 h-3" />
                {t('acctActive')}
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-2 py-1">
                {t('acctSoon')}
              </span>
            )}
          </div>
          {SOON_PROVIDERS.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 opacity-70"
            >
              <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 flex items-center justify-center text-sm font-bold">
                {p.icon || <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                  {p.name}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {t('acctSoonSub')}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 px-2 py-1">
                {t('acctSoon')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3 — Location pings */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 text-white flex items-center justify-center shadow-xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-base text-stone-950 dark:text-stone-50">
              {t('acctPingsTitle')}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {t('acctPingsSub')}
            </p>
          </div>
          {isAuthenticated && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                status === 'live'
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                  : 'text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800'
              }`}
            >
              <Radio className="w-3 h-3" />
              {status === 'live'
                ? t('acctCollectorOn')
                : t('acctCollectorPaused')}
            </span>
          )}
        </div>

        {/* Consent switch */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-stone-950 dark:text-stone-50">
              {t('acctConsent')}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {t('acctConsentSub')}
            </p>
            {isAuthenticated &&
              collector.consent &&
              status === 'paused' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                  {t('acctIntervalOff')}
                </p>
              )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={collector.consent}
            disabled={!isAuthenticated}
            onClick={() => collector.toggleConsent(!collector.consent)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              collector.consent
                ? 'bg-emerald-500'
                : 'bg-stone-300 dark:bg-stone-600'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                collector.consent ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Ping list */}
        {!isAuthenticated ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t('acctNeedSignin')}
          </p>
        ) : pingsQuery.isLoading ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t('acctPingsLoading')}
          </p>
        ) : pings.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t('acctNoPings')}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {pings.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-900 dark:text-stone-100 font-mono">
                      {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {relTime(p.recordedAt)}
                      {typeof p.accuracyM === 'number' &&
                        ` · ${tv('acctPingAcc', { m: Math.round(p.accuracyM) })}`}
                      {` · ${p.source}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePing.mutate({ id: p.id })}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('acctPingDelete')}
                  </button>
                </li>
              ))}
            </ul>
            {(countQuery.data ?? 0) > pings.length && (
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {(countQuery.data ?? 0) - pings.length} +
              </p>
            )}
            <div className="pt-1">
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => clearPings.mutate()}
                    disabled={clearPings.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('acctDeleteAll')}
                  </button>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    {t('acctConfirmClear')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:underline cursor-pointer"
                  >
                    {t('acctCancel')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                >
                  {t('acctClear')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
