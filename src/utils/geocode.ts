/**
 * geocode — exact point lookup for free-text places the traveller types.
 *
 * Resolution order:
 *  1. The curated local landmark table (instant, offline) via findPlaceGeo.
 *  2. A localStorage cache of earlier online lookups.
 *  3. OpenStreetMap's Nominatim geocoder, queried with the trip destination as
 *     context ("Senso-ji, Tokyo, Japan") AND the trip country's ISO code, so the
 *     pin lands on the exact place in the right country. The typed text is
 *     cleaned first (dangling "— details" and time-of-day filler are dropped),
 *     and if the anchored query misses we retry the cleaned place name on its
 *     own. Requests are queued one per ~1.1s to stay polite; results
 *     (including misses) are cached so each place is only ever looked up once.
 */

import { findPlaceGeo, type PlaceGeo } from './placeGeo';

const CACHE_KEY = 'wl_geocode_cache_v2';
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000; // retry misses after a day

interface CacheEntry {
  lat?: number;
  lng?: number;
  name?: string;
  fail?: boolean;
  t: number;
}

type CacheShape = Record<string, CacheEntry>;

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Country name → ISO 3166-1 alpha-2 (mirrors the COUNTRY_INFO catalogue). */
const COUNTRY_ISO2: Record<string, string> = {
  'Afghanistan': 'AF',
  'Albania': 'AL',
  'Algeria': 'DZ',
  'Andorra': 'AD',
  'Angola': 'AO',
  'Antigua and Barbuda': 'AG',
  'Argentina': 'AR',
  'Armenia': 'AM',
  'Australia': 'AU',
  'Austria': 'AT',
  'Azerbaijan': 'AZ',
  'Bahamas': 'BS',
  'Bahrain': 'BH',
  'Bangladesh': 'BD',
  'Barbados': 'BB',
  'Belarus': 'BY',
  'Belgium': 'BE',
  'Belize': 'BZ',
  'Benin': 'BJ',
  'Bhutan': 'BT',
  'Bolivia': 'BO',
  'Bosnia and Herzegovina': 'BA',
  'Botswana': 'BW',
  'Brazil': 'BR',
  'Brunei': 'BN',
  'Bulgaria': 'BG',
  'Burkina Faso': 'BF',
  'Burundi': 'BI',
  'Cabo Verde': 'CV',
  'Cambodia': 'KH',
  'Cameroon': 'CM',
  'Canada': 'CA',
  'Central African Republic': 'CF',
  'Chad': 'TD',
  'Chile': 'CL',
  'China': 'CN',
  'Colombia': 'CO',
  'Comoros': 'KM',
  'Costa Rica': 'CR',
  'Croatia': 'HR',
  'Cuba': 'CU',
  'Cyprus': 'CY',
  'Czechia': 'CZ',
  'Côte d\'Ivoire': 'CI',
  'Democratic Republic of the Congo': 'CD',
  'Denmark': 'DK',
  'Djibouti': 'DJ',
  'Dominica': 'DM',
  'Dominican Republic': 'DO',
  'Ecuador': 'EC',
  'Egypt': 'EG',
  'El Salvador': 'SV',
  'Equatorial Guinea': 'GQ',
  'Eritrea': 'ER',
  'Estonia': 'EE',
  'Eswatini': 'SZ',
  'Ethiopia': 'ET',
  'Fiji': 'FJ',
  'Finland': 'FI',
  'France': 'FR',
  'Gabon': 'GA',
  'Gambia': 'GM',
  'Georgia': 'GE',
  'Germany': 'DE',
  'Ghana': 'GH',
  'Greece': 'GR',
  'Grenada': 'GD',
  'Guatemala': 'GT',
  'Guinea': 'GN',
  'Guinea-Bissau': 'GW',
  'Guyana': 'GY',
  'Haiti': 'HT',
  'Honduras': 'HN',
  'Hungary': 'HU',
  'Iceland': 'IS',
  'India': 'IN',
  'Indonesia': 'ID',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Ireland': 'IE',
  'Israel': 'IL',
  'Italy': 'IT',
  'Jamaica': 'JM',
  'Japan': 'JP',
  'Jordan': 'JO',
  'Kazakhstan': 'KZ',
  'Kenya': 'KE',
  'Kiribati': 'KI',
  'Kosovo': 'XK',
  'Kuwait': 'KW',
  'Kyrgyzstan': 'KG',
  'Laos': 'LA',
  'Latvia': 'LV',
  'Lebanon': 'LB',
  'Lesotho': 'LS',
  'Liberia': 'LR',
  'Libya': 'LY',
  'Liechtenstein': 'LI',
  'Lithuania': 'LT',
  'Luxembourg': 'LU',
  'Madagascar': 'MG',
  'Malawi': 'MW',
  'Malaysia': 'MY',
  'Maldives': 'MV',
  'Mali': 'ML',
  'Malta': 'MT',
  'Marshall Islands': 'MH',
  'Mauritania': 'MR',
  'Mauritius': 'MU',
  'Mexico': 'MX',
  'Micronesia': 'FM',
  'Moldova': 'MD',
  'Monaco': 'MC',
  'Mongolia': 'MN',
  'Montenegro': 'ME',
  'Morocco': 'MA',
  'Mozambique': 'MZ',
  'Myanmar': 'MM',
  'Namibia': 'NA',
  'Nauru': 'NR',
  'Nepal': 'NP',
  'Netherlands': 'NL',
  'New Zealand': 'NZ',
  'Nicaragua': 'NI',
  'Niger': 'NE',
  'Nigeria': 'NG',
  'North Korea': 'KP',
  'North Macedonia': 'MK',
  'Norway': 'NO',
  'Oman': 'OM',
  'Pakistan': 'PK',
  'Palau': 'PW',
  'Palestine': 'PS',
  'Panama': 'PA',
  'Papua New Guinea': 'PG',
  'Paraguay': 'PY',
  'Peru': 'PE',
  'Philippines': 'PH',
  'Poland': 'PL',
  'Portugal': 'PT',
  'Qatar': 'QA',
  'Republic of the Congo': 'CG',
  'Romania': 'RO',
  'Russia': 'RU',
  'Rwanda': 'RW',
  'Saint Kitts and Nevis': 'KN',
  'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  'Samoa': 'WS',
  'San Marino': 'SM',
  'Saudi Arabia': 'SA',
  'Senegal': 'SN',
  'Serbia': 'RS',
  'Seychelles': 'SC',
  'Sierra Leone': 'SL',
  'Singapore': 'SG',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Solomon Islands': 'SB',
  'Somalia': 'SO',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  'South Sudan': 'SS',
  'Spain': 'ES',
  'Sri Lanka': 'LK',
  'Sudan': 'SD',
  'Suriname': 'SR',
  'Sweden': 'SE',
  'Switzerland': 'CH',
  'Syria': 'SY',
  'São Tomé and Príncipe': 'ST',
  'Taiwan': 'TW',
  'Tajikistan': 'TJ',
  'Tanzania': 'TZ',
  'Thailand': 'TH',
  'Timor-Leste': 'TL',
  'Togo': 'TG',
  'Tonga': 'TO',
  'Trinidad and Tobago': 'TT',
  'Tunisia': 'TN',
  'Turkey': 'TR',
  'Turkmenistan': 'TM',
  'Tuvalu': 'TV',
  'Uganda': 'UG',
  'Ukraine': 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  'Uruguay': 'UY',
  'Uzbekistan': 'UZ',
  'Vanuatu': 'VU',
  'Vatican City': 'VA',
  'Venezuela': 'VE',
  'Vietnam': 'VN',
  'Yemen': 'YE',
  'Zambia': 'ZM',
  'Zimbabwe': 'ZW'
};

/** Normalised country name → ISO2, for spotting the country inside a context string. */
const NORM_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_ISO2).map(([name, iso]) => [norm(name), iso])
);
// A few everyday aliases travellers type.
Object.assign(NORM_ISO2, {
  usa: 'US', 'united states of america': 'US', america: 'US', uk: 'GB', britain: 'GB',
  'great britain': 'GB', england: 'GB', scotland: 'GB', wales: 'GB', holland: 'NL',
  'south korea': 'KR', korea: 'KR', 'north korea': 'KP', 'czech republic': 'CZ',
  'ivory coast': 'CI', burma: 'MM', 'hong kong': 'HK', macau: 'MO', 'macao': 'MO',
  'the bahamas': 'BS', 'uae': 'AE', 'democratic republic of congo': 'CD',
  'republic of congo': 'CG', drc: 'CD', 'east timor': 'TL', 'swaziland': 'SZ'
});
const COUNTRY_NAMES_BY_LENGTH = Object.keys(NORM_ISO2).sort((a, b) => b.length - a.length);

/** Best-effort ISO2 code for a free-text country / context string. */
export const iso2ForCountry = (text: string): string | null => {
  const t = norm(text);
  if (!t) return null;
  if (NORM_ISO2[t]) return NORM_ISO2[t];
  for (const name of COUNTRY_NAMES_BY_LENGTH) {
    if (name.length >= 4 && new RegExp(`(^|[\\s,])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[\\s,])`).test(t)) {
      return NORM_ISO2[name];
    }
  }
  return null;
};

/**
 * Geocoding context for a trip — "Tokyo, Japan". Skips appending the country
 * when the destination already names it, so we never query "…, Japan, Japan".
 */
export const tripGeoContext = (destination: string, country?: string): string => {
  const dest = (destination || '').trim();
  const c = (country || '').trim();
  if (!c) return dest;
  return norm(dest).includes(norm(c)) ? dest : `${dest}, ${c}`;
};

/** The ISO2 country constraint for a context string, when we can tell. */
export const iso2FromContext = (context: string): string | null => iso2ForCountry(context);

const cacheKey = (task: string, context: string) => `${norm(task)}|${norm(context)}`;

let memCache: CacheShape | null = null;

const loadCache = (): CacheShape => {
  if (memCache) return memCache;
  try {
    memCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as CacheShape;
  } catch {
    memCache = {};
  }
  return memCache!;
};

const saveCache = () => {
  try {
    // keep the cache bounded — newest 500 entries
    const entries = Object.entries(loadCache()).sort((a, b) => b[1].t - a[1].t).slice(0, 500);
    memCache = Object.fromEntries(entries);
    localStorage.setItem(CACHE_KEY, JSON.stringify(memCache));
  } catch {
    /* storage full — the in-memory cache still works for this session */
  }
};

/** Time-of-day / filler fragments that never help a geocoder find the place. */
const FILLER_RE =
  /\b(at|by|around|before|after|during)\s+(dawn|sunrise|sunset|dusk|midday|noon|night|nightfall|dark|golden hour|blue hour)\b|\b(sunrise|sunset|dawn|dusk|morning|afternoon|evening|night|late night|early morning)\s+(visit|walk|hike|stroll|views?|lights|glow|session|swim)\b|\b(in the|early|late)\s+(morning|afternoon|evening|night)\b/gi;

/**
 * Trim a typed stop down to the place itself: drop " — anything the traveller
 * added as a note" and time-of-day filler, collapse leftover punctuation.
 */
export const cleanPlaceQuery = (task: string): string => {
  let q = (task || '').split(/\s+[—–]\s+/)[0]; // em/en dash introduces a personal note
  q = q.replace(FILLER_RE, ' ');
  q = q.replace(/\s*\([^)]*\)\s*/g, ' '); // "(optional)"-style asides
  q = q.replace(/\s{2,}/g, ' ').replace(/^[\s,.;:]+|[\s,.;:]+$/g, '');
  return q || task.trim();
};

/**
 * Synchronous lookup: local table first (raw text, then the cleaned place
 * name), then the persisted online-lookup cache. Returns null when the place
 * has never been resolved — callers should then queue requestGeocode and
 * re-render once it lands.
 */
export const geoForTask = (task: string, context: string): PlaceGeo | null => {
  const local = findPlaceGeo(task) || findPlaceGeo(cleanPlaceQuery(task));
  if (local) return local;
  const hit = loadCache()[cacheKey(task, context)];
  if (hit && !hit.fail && hit.lat != null && hit.lng != null) {
    return { lat: hit.lat, lng: hit.lng, name: hit.name || task };
  }
  return null;
};

interface QueueItem {
  task: string;
  context: string;
  iso: string | null;
}

const queue: QueueItem[] = [];
const queuedKeys = new Set<string>();
let drainPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Subscribe to geocode completions (each resolved place notifies once). */
export const onGeocodeResolved = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const notify = () => listeners.forEach((fn) => fn());

/** Returns a cacheable entry, 'miss' (geocoder answered, no match), or null
 *  (network hiccup — leave uncached so a later session can retry). */
const fetchNominatim = async (q: string, iso: string | null): Promise<CacheEntry | 'miss' | null> => {
  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    if (iso) url += `&countrycodes=${iso.toLowerCase()}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    const first = Array.isArray(json) ? json[0] : null;
    if (!first || first.lat == null || first.lon == null) return 'miss';
    return {
      lat: Number(first.lat),
      lng: Number(first.lon),
      name: String(first.display_name || q).split(',')[0],
      t: Date.now()
    };
  } catch {
    return null; // offline — don't cache
  }
};

const drain = (): Promise<void> => {
  if (drainPromise) return drainPromise;
  drainPromise = (async () => {
    while (queue.length > 0) {
      const { task, context, iso } = queue.shift()!;
      const key = cacheKey(task, context);
      queuedKeys.delete(key);
      const cleaned = cleanPlaceQuery(task);
      // The task may carry its own context ("Skytree, Tokyo") — use it
      // verbatim, otherwise anchor the query to the trip destination.
      const anchored = task.includes(',') || !context ? cleaned : `${cleaned}, ${context}`;
      let result = await fetchNominatim(anchored, iso);
      // Second chance: the destination anchor sometimes confuses the geocoder
      // (e.g. region vs city) — retry the cleaned place name on its own,
      // still pinned to the trip country.
      if (result === 'miss' && anchored !== cleaned) {
        await new Promise((r) => setTimeout(r, 1100));
        result = await fetchNominatim(cleaned, iso);
      }
      if (result) {
        loadCache()[key] = result === 'miss' ? { fail: true, t: Date.now() } : result;
        saveCache();
        if (result !== 'miss') notify();
      }
      if (queue.length > 0) await new Promise((r) => setTimeout(r, 1100));
    }
  })().finally(() => {
    drainPromise = null;
  });
  return drainPromise;
};

/**
 * Queue an online lookup for a place the local table doesn't know. Misses are
 * cached for a day so we don't hammer the API for unresolvable scribbles.
 */
export const requestGeocode = (task: string, context: string): void => {
  if (!task.trim()) return;
  if (findPlaceGeo(task) || findPlaceGeo(cleanPlaceQuery(task))) return; // local table knows it
  const key = cacheKey(task, context);
  const hit = loadCache()[key];
  if (hit) {
    if (!hit.fail) return; // already resolved — geoForTask will find it
    if (Date.now() - hit.t < NEGATIVE_TTL_MS) return; // recent miss, don't retry yet
  }
  if (queuedKeys.has(key)) return;
  queuedKeys.add(key);
  queue.push({ task, context, iso: iso2FromContext(context) });
  void drain();
};
