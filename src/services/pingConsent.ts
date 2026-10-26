// Explicit opt-in switch for server-side location-ping collection.
// Stored locally; the collector (src/hooks/usePingCollector.ts) reads it and
// the Account page toggles it. A custom event keeps all subscribers in sync.

const KEY = 'wanderlust_pings_consent';
export const PING_CONSENT_EVENT = 'wanderlust-pings-consent-changed';

export function getPingConsent(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setPingConsent(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable — consent stays off
  }
  window.dispatchEvent(new CustomEvent(PING_CONSENT_EVENT));
}
