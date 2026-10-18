export function formatTemperature(
  tempStringOrNum: string | number,
  unitSystem?: 'metric' | 'imperial'
): string {
  const currentUnit = unitSystem || (localStorage.getItem('wanderlust_app_settings')
    ? JSON.parse(localStorage.getItem('wanderlust_app_settings')!).unitSystem
    : 'metric');

  if (typeof tempStringOrNum === 'number') {
    if (currentUnit === 'imperial') {
      const fahrenheit = Math.round(tempStringOrNum * 1.8 + 32);
      return `${fahrenheit}°F`;
    }
    return `${tempStringOrNum}°C`;
  }

  // Parse strings like "13°C – 22°C (55°F – 72°F)" or "20°C"
  const str = String(tempStringOrNum);
  if (currentUnit === 'imperial') {
    // If string already contains Fahrenheit in parens, prioritize it or convert
    if (str.includes('°F')) {
      const fMatch = str.match(/\(([^)]*°F[^)]*)\)/);
      if (fMatch) return fMatch[1];
    }
    // Convert any °C numbers to °F
    return str.replace(/(\d+)\s*°C/g, (_, c) => {
      const f = Math.round(Number(c) * 1.8 + 32);
      return `${f}°F`;
    });
  }

  // Metric (°C)
  // Strip any parenthetical Fahrenheit if present or keep clean °C
  return str.replace(/\s*\([^)]*°F[^)]*\)/g, '');
}

import { getAppSettings } from './settings';

/** Format a distance given in kilometers according to the user's unit setting. */
export function formatDistance(km: number, unitSystem?: 'metric' | 'imperial'): string {
  const unit = unitSystem || getAppSettings().unitSystem;
  if (unit === 'imperial') {
    const miles = km * 0.621371;
    return `${miles >= 100 ? Math.round(miles).toLocaleString() : miles.toFixed(1)} mi`;
  }
  return `${km >= 100 ? Math.round(km).toLocaleString() : km.toFixed(1)} km`;
}

/** Rough flight time estimate from great-circle km. */
export function estimateFlightTime(km: number): string {
  const hours = km / 820; // avg commercial cruising speed incl. overhead
  if (hours < 1.2) return '< 1h flight';
  if (hours < 10) return `~${hours.toFixed(1)}h flight`;
  return `~${Math.round(hours)}h flight`;
}

/** Great-circle distance in km between two lat/lng points. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
