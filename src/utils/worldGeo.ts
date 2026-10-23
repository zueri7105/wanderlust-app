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
/** Sorted normalized name keys for prefix autocomplete (built with the index). */
let searchKeys: string[] | null = null;

/** name-key → city rows (best first) */
const cityIndex = new Map<string, WorldGeoHit[]>();
const cityAliasIndex = new Map<string, WorldGeoHit[]>();
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
  cityAliasIndex.clear();
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
    // Primary names (local + ASCII form) rank above alternate names, so a
    // same-named big city's alias ("Venice" as an old name of Dayton) can
    // never hijack the place the traveller actually typed.
    const keys = new Set<string>([normPlace(row[0]), normPlace(row[0]).replace(/ /g, '')]);
    if (typeof row[1] === 'string' && row[1]) keys.add(normPlace(row[1]));
    for (const k of keys) if (k) addTo(cityIndex, k, hit);
    if (typeof row[6] === 'string' && row[6]) {
      for (const alt of row[6].split('|')) {
        const a = (alt || '').trim();
        // GeoNames alternates include machine transliterations written
        // all-lowercase ("bali" for Bari, "porto" for Bordeaux) — matching
        // those hijacks real places. Genuine alternate names are
        // capitalised ("Firenze", "Köln", "Roma"), so lowercase-ASCII
        // alternates never enter the index.
        if (/^[a-z0-9 ]+$/.test(a)) continue;
        const nk = normPlace(a);
        if (nk && !keys.has(nk)) addTo(cityAliasIndex, nk, hit);
      }
    }
  }

  // Rank each bucket: biggest city first so "Paris" → Paris, France.
  cityIndex.forEach((arr) => arr.sort((a, b) => b.pop - a.pop));
  cityAliasIndex.forEach((arr) => arr.sort((a, b) => b.pop - a.pop));

  // One sorted key list over every name the gazetteer knows, so typed-place
  // autocomplete can binary-search a prefix instead of scanning 240k entries.
  searchKeys = Array.from(
    new Set([
      ...countryIndex.keys(),
      ...regionIndex.keys(),
      ...cityIndex.keys(),
      ...cityAliasIndex.keys()
    ])
  ).sort();
};

/** All index buckets a normalized name key may live in. */
const hitsForKey = (key: string): WorldGeoHit[] => [
  ...(countryIndex.has(key) ? [countryIndex.get(key)!] : []),
  ...(regionIndex.get(key) || []),
  ...(cityIndex.get(key) || []),
  ...(cityAliasIndex.get(key) || [])
];

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
    // A country constraint is strict: no in-country match means NO match —
    // falling back here is what pinned Córdoba onto Argentina when the trip
    // said Spain.
    const inCountry = hits.filter((h) => h.cc === isoHint);
    return inCountry.length > 0 ? inCountry[0] : null;
  }
  return hits[0];
};

/**
 * Famous travel places whose biggest GeoNames name-sake is NOT the one
 * travellers mean (normalized name → ISO2 of the intended country).
 */
const TRAVEL_INTENT_ISO: Record<string, string> = {
  queenstown: 'NZ', // adventure capital, not Komani (ex-Queenstown), Eastern Cape
  bali: 'ID', // the island province, not Bāli, India (nor Bari via a junk alias)
  bari: 'IT', // Puglia's port city, not Somalia's Bari region
  valencia: 'ES', // not Valencia, Venezuela
  merida: 'MX', // Yucatán, not Venezuela's Mérida region
  kochi: 'IN', // Kerala's port city, not Kōchi prefecture
  trujillo: 'PE', // Chan Chan's city, not Venezuela's Trujillo region
  munster: 'DE', // Münster, Westphalia — not Ireland's Munster province
  sucre: 'BO', // Bolivia's constitutional capital, not Venezuela's Sucre state
  safi: 'MA', // Morocco's ceramic coast, not Malta's hamlet
  southampton: 'GB', // the UK port city, not Bermuda's Southampton Parish
  'porto novo': 'BJ', // Benin's capital, not Cape Verde's Porto-Novo
  'san salvador': 'SV', // El Salvador's capital, not the Bahamian island
  manchester: 'GB' // the UK city, not Jamaica's Manchester Parish
};

/**
 * Synchronous lookup (once loaded). `isoHint` constrains the match to a
 * country ("Córdoba" + hint "ES" → Córdoba, Spain instead of Argentina).
 * Exact country names win, then exact region/state names, then cities.
 */
export const lookupWorldGeoSync = (text: string, isoHint?: string | null): WorldGeoHit | null => {
  if (!db) return null;
  const raw = (text || '').trim();
  if (!raw) return null;
  const key = normPlace(raw);
  // Traveller intent beats raw population for a few famously ambiguous spots
  // (Queenstown NZ, not the bigger Komani/Queenstown in South Africa).
  const iso = isoHint || TRAVEL_INTENT_ISO[key] || null;
  const squashed = key.replace(/ /g, '');

  // Full text → then last comma segment ("Kyoto, Japan" handled by callers,
  // but a bare "City, Country" typed anywhere should still resolve).
  const candidates = [key, squashed];
  const lastSeg = raw.includes(',') ? normPlace(raw.split(',').pop() || '') : '';
  if (lastSeg && lastSeg !== key) candidates.push(lastSeg);

  // Travellers mean the most specific named thing they typed: an exact
  // country ("Japan"), then an exact region/state ("Bali", "Bavaria"),
  // then the biggest city with that exact name ("Paris").
  for (const k of candidates) {
    if (!k) continue;
    const country = countryIndex.get(k);
    if (country && (!iso || country.cc === iso)) return country;
    const region = pickBest(regionIndex.get(k), iso);
    if (region) return region;
    const city = pickBest(cityIndex.get(k), iso);
    const alias = pickBest(cityAliasIndex.get(k), iso);
    // Exact-name hits win; an alternate-spelling hit only overrides one when
    // it is a far bigger place ("Roma" → Rome, Italy, not Roma, Texas).
    if (city && alias) return alias.pop >= city.pop * 10 ? alias : city;
    const hit = city || alias;
    if (hit) return hit;
  }
  return null;
};

/**
 * Canonicalise the country segment a traveller typed after a comma:
 * "Paris, Texas" → "United States" (Texas is a state), "Kyoto, japan" →
 * "Japan" (canonical spelling). Unknown text passes through unchanged —
 * never blank out what the traveller wrote.
 */
export const canonicalCountrySegment = (seg: string): string => {
  const t = (seg || '').trim();
  if (!t || !db) return t;
  const hit = lookupWorldGeoSync(t);
  return hit?.countryName || t;
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

/**
 * Type-ahead search over every place the gazetteer knows (countries, regions,
 * cities and their genuine alternate names). Returns the biggest matches for
 * a typed prefix — "par" → Paris, París… — each labelled with its country so
 * travellers pick the exact place instead of a lookalike. Empty until the
 * database has finished loading (startWorldGeoLoad).
 */
export const searchPlaces = (query: string, limit = 8): WorldGeoHit[] => {
  if (!db || !searchKeys) return [];
  const q = normPlace(query);
  if (q.length < 2) return [];

  // Binary search the sorted key list for the first key >= q, then walk the
  // prefix run.
  let lo = 0;
  let hi = searchKeys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (searchKeys[mid] < q) lo = mid + 1;
    else hi = mid;
  }
  const seen = new Set<string>();
  const prefixHits: WorldGeoHit[] = [];
  const wordHits: WorldGeoHit[] = [];
  const push = (hit: WorldGeoHit, bucket: WorldGeoHit[]) => {
    const dk = `${normPlace(hit.name)}|${hit.cc}|${hit.kind}`;
    if (seen.has(dk)) return;
    seen.add(dk);
    bucket.push(hit);
  };
  for (let i = lo; i < searchKeys.length && searchKeys[i].startsWith(q); i++) {
    for (const h of hitsForKey(searchKeys[i])) push(h, prefixHits);
    if (prefixHits.length >= 80) break;
  }
  // Fallback: a word inside the name starts with the query ("york" → New York).
  if (prefixHits.length < limit) {
    const needle = ` ${q}`;
    for (const k of searchKeys) {
      if (k.includes(needle)) {
        for (const h of hitsForKey(k)) push(h, wordHits);
        if (wordHits.length >= 80) break;
      }
    }
  }
  const byPop = (a: WorldGeoHit, b: WorldGeoHit) => b.pop - a.pop;
  prefixHits.sort(byPop);
  wordHits.sort(byPop);
  // Countries and regions float to the top of their bucket — a typed country
  // should offer the country, not just its biggest same-named city.
  const rank = (h: WorldGeoHit) => (h.kind === 'country' ? 2 : h.kind === 'region' ? 1 : 0);
  const byKindThenPop = (a: WorldGeoHit, b: WorldGeoHit) => rank(b) - rank(a) || byPop(a, b);
  prefixHits.sort(byKindThenPop);
  wordHits.sort(byKindThenPop);
  return [...prefixHits, ...wordHits].slice(0, limit);
};
