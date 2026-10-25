/**
 * weatherSync — real weather data for the Travel Guide's City Weather card.
 *
 * Source: Open-Meteo (https://open-meteo.com) — an open weather API built on
 * national weather-service models.
 *   · Trips within the next 16 days → the actual daily forecast
 *     (temperature hi/lo + precipitation probability).
 *   · Later trips → the climate-trend projection for those exact dates, so
 *     the guide always shows a data-backed trend instead of a static guess.
 *
 * Results are cached in localStorage for ~12h so reopening a guide is instant.
 */

import { findPlaceGeo } from './placeGeo';
import { startWorldGeoLoad, lookupWorldGeoSync } from './worldGeo';

export interface WeatherTrendDay {
  date: string;
  tMax: number;
  tMin: number;
  /** 0–100, null when the climate projection has no probability */
  precipProb: number | null;
}

export interface WeatherTrend {
  source: 'forecast' | 'climate';
  days: WeatherTrendDay[];
  fetchedAt: number;
  avgHi: number;
  avgLo: number;
  rainDays: number;
}

const CACHE_KEY = 'wl_weather_trend_v1';
const TTL_MS = 12 * 60 * 60 * 1000;

type Cache = Record<string, WeatherTrend>;

const readCache = (): Cache => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};

const cacheKeyFor = (city: string, country: string, start: string, end: string) =>
  `${city}|${country}|${start}|${end}`.toLowerCase();

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** City/country text → coordinates: local landmark/city table first, then the
 *  on-device world gazetteer (every city & country on Earth, so tiny or
 *  less-well-known places resolve without the network), then Nominatim. */
const geocode = async (city: string, country: string): Promise<{ lat: number; lng: number } | null> => {
  const local = findPlaceGeo(city) || findPlaceGeo(country);
  if (local) return { lat: local.lat, lng: local.lng };
  // Offline gazetteer — knows even the smallest documented places.
  try {
    await startWorldGeoLoad();
    const gaz =
      lookupWorldGeoSync(city) ||
      (country ? lookupWorldGeoSync(country) : null) ||
      lookupWorldGeoSync(`${city}, ${country}`);
    if (gaz) return { lat: gaz.lat, lng: gaz.lng };
  } catch {
    /* gazetteer unavailable — fall through to the online lookup */
  }
  try {
    const q = encodeURIComponent(country ? `${city}, ${country}` : city);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
      { headers: { Accept: 'application/json' } }
    );
    const json = await res.json();
    if (Array.isArray(json) && json[0]) {
      return { lat: Number(json[0].lat), lng: Number(json[0].lon) };
    }
  } catch {
    /* offline or blocked — no trend */
  }
  return null;
};

/**
 * Fetch the weather trend for a trip window. Returns null when the place
 * can't be located or the API is unreachable — the static seasonal outlook
 * in the guide stays as the fallback in that case.
 */
export const fetchWeatherTrend = async (
  city: string,
  country: string,
  startDate: string,
  endDate: string
): Promise<WeatherTrend | null> => {
  if (!city.trim() && !country.trim()) return null;

  const key = cacheKeyFor(city, country, startDate, endDate);
  const cached = readCache()[key];
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;

  const loc = await geocode(city, country);
  if (!loc) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tripStart = startDate ? new Date(`${startDate}T00:00:00`) : today;
  const tripEnd = endDate ? new Date(`${endDate}T00:00:00`) : new Date(tripStart.getTime() + 4 * 86400000);
  const daysOut = Math.round((tripStart.getTime() - today.getTime()) / 86400000);

  let url: string;
  let source: WeatherTrend['source'];
  if (daysOut <= 15) {
    // Actual forecast (Open-Meteo covers today … +16 days)
    const s = tripStart < today ? today : tripStart;
    const e = tripEnd < s ? s : tripEnd;
    url =
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=auto&start_date=${iso(s)}&end_date=${iso(e)}`;
    source = 'forecast';
  } else {
    // Far-future trip: climate-trend projection for those exact dates
    url =
      `https://climate-api.open-meteo.com/v1/climate?latitude=${loc.lat}&longitude=${loc.lng}` +
      `&daily=temperature_2m_max,temperature_2m_min&start_date=${iso(tripStart)}&end_date=${iso(tripEnd)}`;
    source = 'climate';
  }

  try {
    // The weather APIs can hang on some networks — cap the wait so the
    // static seasonal outlook below shows promptly instead of pending forever.
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
    const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
    if (timer) clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const daily = json?.daily;
    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) return null;

    const days: WeatherTrendDay[] = daily.time
      .map((date: string, i: number) => ({
        date,
        tMax: Number(daily.temperature_2m_max?.[i]),
        tMin: Number(daily.temperature_2m_min?.[i]),
        precipProb:
          daily.precipitation_probability_max && daily.precipitation_probability_max[i] != null
            ? Number(daily.precipitation_probability_max[i])
            : null
      }))
      .filter((d: WeatherTrendDay) => Number.isFinite(d.tMax) && Number.isFinite(d.tMin))
      .slice(0, 14);
    if (days.length === 0) return null;

    const trend: WeatherTrend = {
      source,
      days,
      fetchedAt: Date.now(),
      avgHi: Math.round(days.reduce((a, d) => a + d.tMax, 0) / days.length),
      avgLo: Math.round(days.reduce((a, d) => a + d.tMin, 0) / days.length),
      rainDays: days.filter((d) => (d.precipProb ?? 0) >= 50).length
    };
    const cache = readCache();
    cache[key] = trend;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      /* quota — ignore */
    }
    return trend;
  } catch {
    return null;
  }
};
