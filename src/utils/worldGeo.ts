/**
 * worldGeo — offline gazetteer of the whole world (GeoNames data):
 *   · 252 countries with centroids
 *   · 3,784 first-order divisions (every province / state / region)
 *   · 236,632 cities & towns (population ≥ 500) with coordinates,
 *     ascii names and common alternates (Munich/München, Bombay/Mumbai, …)
 *
 * The ~12 MB database is downloaded once from /worldgeo.json, lazily — the
 * first lookup (or app start) triggers the fetch — then indexed in memory by
 * normalized name so any typed city or region resolves to its country
 * instantly, with no network call and no guessing.
 */

export interface WorldGeoHit {
  name: string;
  lat: number;
  lng: number;
  /** ISO-3166 alpha-2, uppercase */
  cc: string;
  /** Country display name (English, from GeoNames) */
  countryName: string;
  kind: 'city' | 'region' | 'country';
  pop: number;
}

type RawCity = [string, (string | number)?, number?, number?, string?, number?, string?];
type RawRegion = [string, (string | number)?, number?, number?, string?];

interface WorldGeoDb {
  v: number;
  c: Record<string, [string, number?, number?]>;
  r: RawRegion[];
  t: RawCity[];
}

const URL_PATH = `${(import.meta as any).env?.BASE_URL || '/'}worldgeo.json`;

/** Matches the Python-side normalization: lowercase, strip diacritics,
    drop apostrophes, punctuation → single spaces. */
export const normPlace = (s: string): string =>
  (s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

let db: WorldGeoDb | null = null;
let loadPromise: Promise<WorldGeoDb | null> | null = null;

/** name-key → city rows (best first) */
const cityIndex = new Map<string, WorldGeoHit[]>();
/** name-key → region rows */
const regionIndex = new Map<string, WorldGeoHit[]>();
/** name-key → country row (country names are unique) */
const countryIndex = new Map<string, WorldGeoHit>();

const addTo = <T,>(map: Map<string, T[]>, key: string, val: T) => {
  if (!key) return;
  const arr = map.get(key);
  if (arr) arr.push(val);
  else map.set(key, [val]);
};

const buildIndex = (data: WorldGeoDb) => {
  db = data;
  cityIndex.clear();
  regionIndex.clear();
  countryIndex.clear();

  const countryName = (cc: string) => data.c[cc]?.[0] || cc;

  for (const [cc, row] of Object.entries(data.c)) {
    const hit: WorldGeoHit = {
      name: row[0],
      lat: row[1] ?? 0,
      lng: row[2] ?? 0,
      cc,
      countryName: row[0],
      kind: 'country',
      pop: 0
    };
    countryIndex.set(normPlace(row[0]), hit);
  }

  for (const row of data.r) {
    const cc = row[4] as string;
    if (!cc) continue;
    const hit: WorldGeoHit = {
      name: row[0],
      lat: (row[2] as number) ?? 0,
      lng: (row[3] as number) ?? 0,
      cc,
      countryName: countryName(cc),
      kind: 'region',
      pop: 0
    };
    addTo(regionIndex, normPlace(row[0]), hit);
    if (typeof row[1] === 'string' && row[1]) addTo(regionIndex, normPlace(row[1]), hit);
  }

  for (const row of data.t) {
    const cc = row[4] as string;
    if (!cc) continue;
    const hit: WorldGeoHit = {
      name: row[0],
      lat: (row[2] as number) ?? 0,
      lng: (row[3] as number) ?? 0,
      cc,
      countryName: countryName(cc),
      kind: 'city',
      pop: (row[5] as number) ?? 0
    };
    const keys = new Set<string>([normPlace(row[0]), normPlace(row[0]).replace(/ /g, '')]);
    if (typeof row[1] === 'string' && row[1]) keys.add(normPlace(row[1]));
    if (typeof row[6] === 'string' && row[6]) {
      for (const alt of row[6].split('|')) keys.add(normPlace(alt));
    }
    for (const k of keys) addTo(cityIndex, k, hit);
  }

  // Rank each bucket: biggest city first so "Paris" → Paris, France.
  cityIndex.forEach((arr) => arr.sort((a, b) => b.pop - a.pop));
};

export const worldGeoLoaded = () => db !== null;

/** Start loading + indexing the database (idempotent, fire-and-forget). */
export const startWorldGeoLoad = (): Promise<WorldGeoDb | null> => {
  if (db) return Promise.resolve(db);
  if (!loadPromise) {
    loadPromise = fetch(URL_PATH)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WorldGeoDb | null) => {
        if (data && Array.isArray(data.t)) buildIndex(data);
        return db;
      })
      .catch(() => {
        loadPromise = null; // network hiccup — the next lookup retries
        return null;
      });
  }
  return loadPromise;
};

const pickBest = (hits: WorldGeoHit[] | undefined, isoHint: string | null): WorldGeoHit | null => {
  if (!hits || hits.length === 0) return null;
  if (isoHint) {
    const inCountry = hits.filter((h) => h.cc === isoHint);
    if (inCountry.length > 0) return inCountry[0];
  }
  return hits[0];
};

/**
 * Synchronous lookup (once loaded). `isoHint` constrains the match to a
 * country ("Córdoba" + hint "ES" → Córdoba, Spain instead of Argentina).
 * Cities beat regions beat countries at the same specificity level.
 */
export const lookupWorldGeoSync = (text: string, isoHint?: string | null): WorldGeoHit | null => {
  if (!db) return null;
  const raw = (text || '').trim();
  if (!raw) return null;
  const iso = isoHint || null;
  const key = normPlace(raw);
  const squashed = key.replace(/ /g, '');

  // Full text → then last comma segment ("Kyoto, Japan" handled by callers,
  // but a bare "City, Country" typed anywhere should still resolve).
  const candidates = [key, squashed];
  const lastSeg = raw.includes(',') ? normPlace(raw.split(',').pop() || '') : '';
  if (lastSeg && lastSeg !== key) candidates.push(lastSeg);

  for (const k of candidates) {
    if (!k) continue;
    const city = pickBest(cityIndex.get(k), iso);
    if (city) return city;
    const region = pickBest(regionIndex.get(k), iso);
    if (region) return region;
    const country = countryIndex.get(k);
    if (country && (!iso || country.cc === iso)) return country;
  }
  return null;
};

/**
 * Async country resolver — waits for the database if it hasn't finished
 * loading. This is the "any city or region → its country" entry point.
 */
export const resolvePlaceCountry = async (text: string): Promise<WorldGeoHit | null> => {
  const raw = (text || '').trim();
  if (!raw) return null;
  await startWorldGeoLoad();
  if (!db) return null;

  // "City, Country" — resolve the city constrained to the typed country first.
  if (raw.includes(',')) {
    const segs = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const last = segs[segs.length - 1];
    const maybeCountry = lookupWorldGeoSync(last);
    if (maybeCountry && maybeCountry.kind === 'country') {
      const first = segs.slice(0, -1).join(', ');
      const inCountry = lookupWorldGeoSync(first, maybeCountry.cc);
      return inCountry || maybeCountry;
    }
  }
  return lookupWorldGeoSync(raw);
};
