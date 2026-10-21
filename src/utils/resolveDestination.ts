import { findPlaceGeo, titleCasePlace, PlaceGeo } from './placeGeo';
import { lookupCountryGuide } from './countryGuides';
import { countryNameFor } from './countryInfo';
import { searchCities, normalizePlace } from '../data/cityIndex';

export interface ResolvedDestination {
  /** Canonical city name, or null when the traveller typed a country. */
  city: string | null;
  /** Canonical country name ('' when nothing could be resolved). */
  country: string;
  /** What the trip card shows: "Zürich, Switzerland" for a city, "Japan" for a country. */
  display: string;
  /** Best coordinates for maps; null when the place is unknown. */
  geo: PlaceGeo | null;
}

/**
 * Resolve whatever the traveller typed into a consistent trip destination:
 *  - "zürich" / "Zurich"  → city Zürich, country Switzerland → "Zürich, Switzerland"
 *  - "japan"              → country only → "Japan"
 *  - "Lisbon, Portugal"   → kept as city + country (canonical country spelling)
 *  - unknown places       → title-cased as typed, country '' (never a wrong guess)
 */
export function resolveDestination(input: string): ResolvedDestination {
  const raw = (input || '').trim();
  if (!raw) return { city: null, country: '', display: '', geo: null };

  // "City, Country" (or "City, Region, Country") typed explicitly
  if (raw.includes(',')) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const city = titleCasePlace(parts[0].toLowerCase());
    const typedCountry = parts[parts.length - 1];
    const country = countryNameFor(typedCountry) || titleCasePlace(typedCountry.toLowerCase());
    const display = parts.length > 1 ? `${city}, ${country}` : city;
    return { city, country, display, geo: findPlaceGeo(city) || findPlaceGeo(display) };
  }

  // Bare country name → just the country on the card
  const asCountry = countryNameFor(raw);
  if (asCountry) {
    return { city: null, country: asCountry, display: asCountry, geo: findPlaceGeo(raw) };
  }

  // City lookup: typo-tolerant index (handles zürich→Zurich via diacritic folding).
  // Only exact or prefix matches count — fuzzy near-misses must not guess a country.
  const q = normalizePlace(raw);
  const hits = searchCities(raw, 3);
  const hit = hits.find((h) => {
    const cn = normalizePlace(h.city);
    return cn === q || cn.startsWith(q) || q.startsWith(cn);
  });
  if (hit) {
    const { city, country } = hit;
    // Keep the traveller's own spelling when it's just an accent difference (Zürich!)
    const displayCity = normalizePlace(city) === q ? titleCasePlace(raw.toLowerCase()) : city;
    return { city: displayCity, country, display: `${displayCity}, ${country}`, geo: findPlaceGeo(city) };
  }

  // Country knowledge base aliases (bangkok→Thailand, etc.)
  const kb = lookupCountryGuide(raw);
  if (kb.key !== 'generic') {
    const city = titleCasePlace(raw.toLowerCase());
    return { city, country: kb.name, display: `${city}, ${kb.name}`, geo: findPlaceGeo(raw) };
  }

  // Unknown place — keep what the traveller wrote, guess nothing
  const display = titleCasePlace(raw.toLowerCase());
  return { city: display, country: '', display, geo: findPlaceGeo(raw) };
}
