import { useEffect, useRef, useState, useCallback } from 'react';
import { trpc } from '@/providers/trpc';
import { useAuth } from './useAuth';
import { getAppSettings, EMERGENCY_INTERVAL_MS } from '@/utils/settings';
import {
  getPingConsent,
  setPingConsent,
  PING_CONSENT_EVENT,
} from '@/services/pingConsent';

export type CollectorStatus = 'off' | 'paused' | 'live';

/** Lightweight consent state for views (no collector side-effects). */
export function usePingConsent() {
  const [consent, setConsent] = useState(getPingConsent);
  useEffect(() => {
    const sync = () => setConsent(getPingConsent());
    window.addEventListener(PING_CONSENT_EVENT, sync);
    return () => window.removeEventListener(PING_CONSENT_EVENT, sync);
  }, []);
  return { consent, toggleConsent: setPingConsent };
}

/**
 * Drives server-side GPS ping collection for the signed-in user.
 * Collects only when ALL of these hold:
 *   1. user is authenticated (pings are grouped under their account),
 *   2. explicit consent is on (localStorage opt-in, default OFF),
 *   3. Settings → Emergency GPS refresh interval is not "off".
 * On each tick: browser geolocation → tRPC pings.submit. Failures are
 * swallowed (permission denied, offline, timeout) — never crash the app.
 */
/**
 * Runs the actual collection. Call ONCE at app root — this hook owns the
 * interval and submits pings. Views should use usePingConsent instead.
 */
export function usePingCollector() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const submit = trpc.pings.submit.useMutation({
    onSuccess: () => {
      // Keep the Account page's ping list/count fresh when a new ping lands
      utils.pings.list.invalidate();
      utils.pings.count.invalidate();
    },
  });
  // Keep the mutate fn in a ref so collectOnce stays referentially stable —
  // otherwise every render creates a new effect run and pings flood the server.
  const submitRef = useRef(submit.mutate);
  submitRef.current = submit.mutate;
  const { consent } = usePingConsent();
  const timer = useRef<number | null>(null);

  const collectOnce = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        submitRef.current({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy ?? undefined,
          source: 'gps',
          recordedAt: new Date(),
        });
      },
      () => {
        // denied / unavailable / timeout — stay silent, retry next tick
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const intervalKey = getAppSettings().emergencyInterval;
  const intervalMs = EMERGENCY_INTERVAL_MS[intervalKey];

  useEffect(() => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    if (!isAuthenticated || !consent || !intervalMs) return;
    collectOnce();
    timer.current = window.setInterval(collectOnce, intervalMs);
    return () => {
      if (timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [isAuthenticated, consent, intervalMs, collectOnce]);

  const status: CollectorStatus = !isAuthenticated
    ? 'off'
    : !consent || !intervalMs
      ? 'paused'
      : 'live';

  return { consent, toggleConsent: setPingConsent, status, intervalKey };
}
