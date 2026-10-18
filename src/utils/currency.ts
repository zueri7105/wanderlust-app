/**
 * Live currency exchange rates (USD-based) with a 6h localStorage cache
 * and built-in fallback rates when offline or the API is unreachable.
 */

export interface FxState {
  rates: Record<string, number>; // units of currency per 1 USD
  base: string;
  updatedAt: number; // epoch ms
  isLive: boolean;
}

const CACHE_KEY = 'wanderlust_fx_rates';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

/** Static fallback rates (units per 1 USD), used when offline. */
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 152,
  CNY: 7.15,
  MXN: 19.8,
  THB: 34.5,
  KRW: 1380,
  VND: 25400,
  IDR: 15800,
  CHF: 0.89,
  AUD: 1.54,
  CAD: 1.39,
  NZD: 1.67,
  ISK: 139,
  MAD: 10.1,
  EGP: 48.5,
  PEN: 3.75
};

function readCache(): FxState | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FxState;
    if (!parsed?.rates?.USD) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Synchronous read — returns cache if fresh, otherwise fallback rates. */
export function getFxRates(): FxState {
  const cached = readCache();
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL) {
    return { ...cached, isLive: true };
  }
  return { rates: { ...FALLBACK_RATES }, base: 'USD', updatedAt: Date.now(), isLive: false };
}

/** Async refresh from a free public API; persists to localStorage. */
export async function refreshFxRates(): Promise<FxState> {
  try {
    const resp = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data?.result !== 'success' || !data?.rates?.USD) throw new Error('bad payload');
    const state: FxState = {
      rates: data.rates,
      base: 'USD',
      updatedAt: (data.time_last_update_unix ?? Date.now() / 1000) * 1000,
      isLive: true
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    return state;
  } catch {
    // Keep stale cache if present, else fallback
    const cached = readCache();
    if (cached) return { ...cached, isLive: false };
    return { rates: { ...FALLBACK_RATES }, base: 'USD', updatedAt: Date.now(), isLive: false };
  }
}

/** Rate of `code` per 1 USD from the given state (fallback-safe). */
export function rateFor(code: string, state: FxState): number {
  return state.rates[code] ?? FALLBACK_RATES[code] ?? 1;
}

/** Convert `amount` from one currency to another via USD base. */
export function convertAmount(amount: number, from: string, to: string, state: FxState): number {
  const usd = amount / rateFor(from, state);
  return usd * rateFor(to, state);
}

/** "1 USD ≈ 152.4 JPY · 1 EUR ≈ 165.7 JPY" style benchmark string for a currency. */
export function benchmarkString(code: string, symbol: string, state: FxState): string {
  const perUsd = rateFor(code, state);
  const perEur = perUsd / rateFor('EUR', state);
  const fmt = (n: number) =>
    n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : n >= 10 ? n.toFixed(1)
    : n.toFixed(2);
  if (code === 'USD') return '1 USD = $1.00 · base currency';
  if (code === 'EUR') return `1 EUR ≈ $${(rateFor('USD', state) / rateFor('EUR', state)).toFixed(2)} USD · 1 EUR ≈ £${(rateFor('GBP', state) / rateFor('EUR', state)).toFixed(2)}`;
  return `1 USD ≈ ${symbol}${fmt(perUsd)} ${code} · 1 EUR ≈ ${symbol}${fmt(perEur)} ${code}`;
}
