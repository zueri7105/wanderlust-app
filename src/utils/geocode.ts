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

const CACHE_KEY = 'wl_geocode_cache_v5';
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
import { lookupWorldGeoSync } from './worldGeo';

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
/** Raw coordinates typed into a location box resolve without any lookup. */
const COORDS_RE = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

/** Heuristics for "this is a street address or postcode, not a place name". */
const POSTCODE_RE = /[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/i; // UK-style "SW1A 1AA"
const STREET_NO_RE = /\b\d{1,5}\s+[A-Z]/i; // leading house number: "221 Baker St"
const ADDRESS_WORD_RE = /\b(street|st\.?|avenue|ave\.?|road|rd\.?|lane|ln\.?|drive|dr\.?|court|ct\.?|boulevard|blvd\.?|square|sq\.?|terrace|high street|main street|highway|hwy\.?)\b/i;

export const isAddressQuery = (task: string): boolean => {
  const t = (task || '').trim();
  if (!t) return false;
  if (POSTCODE_RE.test(t)) return true;
  if (t.includes(',') && ADDRESS_WORD_RE.test(t)) return true;
  if (STREET_NO_RE.test(t) && ADDRESS_WORD_RE.test(t)) return true;
  return false;
};

/** Named facilities must not be resolved through a city/region gazetteer. */
const FACILITY_RE = /\b(airport|aeropuerto|aeroport|aeroporto|flughafen|aerodrom|airfield|terminal|bus station|bus stop|autobus(?:es)?|autocar(?:es)?|estaci[oó]n|gare|bahnhof|railway station|train station|hotel|hostel|resort|museum|hospital|university|restaurant|cafe|caf[eé]|stadium|theatre|theater|palace|castle|cathedral|church|temple|monastery|port|harbour|harbor|marina)\b/i;
const isSpecificFacility = (task: string) => FACILITY_RE.test(task);
const validCoords = (lat: number, lng: number) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
const distanceKm = (a: {lat:number; lng:number}, b: {lat:number; lng:number}) => {
  const rad = Math.PI / 180;
  const dLat = (b.lat-a.lat)*rad, dLng = (b.lng-a.lng)*rad;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)**2;
  return 12742*Math.asin(Math.min(1,Math.sqrt(h)));
};
const words = (s: string) => norm(s).replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean);
const STOP_WORDS = new Set(['the','de','del','la','el','of','in','at','and','a','an']);
const similarity = (q: string, name: string) => {
  const a = words(q).filter(w=>!STOP_WORDS.has(w));
  const b = new Set(words(name).filter(w=>!STOP_WORDS.has(w)));
  return a.length ? a.filter(w=>b.has(w)).length/a.length : 0;
};
const categoryMatches = (q: string, type: string) => {
  const t = norm(type);
  if (/airport|aeropuerto|aeroport|aeroporto|flughafen/.test(q)) return /airport|aerodrome|terminal/.test(t);
  if (/bus station|autobus|autocar/.test(q)) return /bus_station|bus_stop|bus|station|terminal|transportation/.test(t);
  if (/train station|railway station|bahnhof|gare/.test(q)) return /station|railway|train|halt/.test(t);
  if (/hotel|hostel|resort/.test(q)) return /hotel|hostel|guest_house|resort|motel/.test(t);
  return true;
};
const rankPlaceHits = (hits: GeocodeCandidate[], query: string, context: string, strict: boolean) => {
  const q = cleanPlaceQuery(query);
  const specific = isSpecificFacility(q);
  const center = context ? findPlaceGeo(context) || lookupWorldGeoSync(context, iso2FromContext(context)) : null;
  return hits.filter(c => validCoords(c.lat,c.lng))
    .filter(c => !strict || !(isCoarse(c) || isCoarsePhoton(c)))
    .filter(c => !specific || (!(isCoarse(c) || isCoarsePhoton(c)) && categoryMatches(q,c.type || '')))
    .map(c => {
      const name = c.name || c.display.split(',')[0];
      const sim = similarity(q,name);
      const near = center ? distanceKm(center,c) : null;
      const maxKm = /airport|aeropuerto|aeroport|aeroporto|flughafen/i.test(q) ? 120 : 65;
      const geoPenalty = near != null && near > maxKm ? 5 : 0;
      return {c, sim, score: sim*10 + (norm(q)===norm(name)?6:0) - geoPenalty};
    })
    .filter(x => !specific || x.sim >= 0.45)
    .sort((a,b)=>b.score-a.score)
    .map(x=>x.c);
};

export const geoForTask = (task: string, context = ''): PlaceGeo | null => {
  const coords = task.match(COORDS_RE);
  if (coords) {
    const lat = Number(coords[1]);
    const lng = Number(coords[2]);
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng, name: task.trim() };
  }
  // Addresses: the gazetteer only knows cities — never let a city centroid
  // swallow a street-level query.
  if (isAddressQuery(task)) {
    const hit = loadCache()[cacheKey(task, context)];
    return hit && !hit.fail && hit.lat != null && hit.lng != null
      ? { lat: hit.lat, lng: hit.lng, name: hit.name || task.trim() }
      : null;
  }
  const local = findPlaceGeo(task) || findPlaceGeo(cleanPlaceQuery(task));
  if (local) return local;
  // World gazetteer (when loaded): any city/region on Earth, constrained to
  // the trip's country so same-name cities can't cross borders.
  const world = isSpecificFacility(task) ? null : lookupWorldGeoSync(cleanPlaceQuery(task), iso2FromContext(context));
  if (world) return { lat: world.lat, lng: world.lng, name: world.name };
  // Unconstrained worldwide retry: an activity may be anywhere on Earth
  // ("Pemba, Mozambique" on a Comoros trip). Only accept the retry when the
  // task itself names a country/region — a bare same-name city must stay
  // anchored so "Paris" on a France trip never jumps to Texas.
  const worldWide = isSpecificFacility(task) ? null : (lookupWorldGeoSync(task) || lookupWorldGeoSync(cleanPlaceQuery(task)));
  if (worldWide && /,/.test(task)) {
    return { lat: worldWide.lat, lng: worldWide.lng, name: worldWide.name };
  }
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
  /** A street-address / postcode query: never answer with a city-centroid
      match, and never let the local gazetteer swallow it. */
  exact: boolean;
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
 *  (network hiccup — leave uncached so a later session can retry).
 *  `exact` = street address / postcode query: only building-level matches. */
const fetchNominatim = async (q: string, iso: string | null, exact: boolean): Promise<CacheEntry | 'miss' | null> => {
  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&addressdetails=1&q=${encodeURIComponent(q)}`;
    if (iso) url += `&countrycodes=${iso.toLowerCase()}`;
    if (exact) {
      // Prefer building / street / amenity level matches over a whole city,
      // and hint the postal code when the query looks like one.
      url += '&extratags=1';
      if (POSTCODE_RE.test(q)) url += `&postalcode=${encodeURIComponent((q.match(POSTCODE_RE) || [''])[0])}`;
    }
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    const arr = Array.isArray(json) ? json : [];
    // Exact queries reject city/region/country-scale matches — the user
    // asked for a street address, so only building-level hits count.
    const candidates = shapeHits(arr);
    const usable = rankPlaceHits(candidates, q, '', exact)[0];
    if (!usable) return 'miss';
    return {
      lat: usable.lat,
      lng: usable.lng,
      name: usable.name || usable.display.split(',')[0] || q,
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
      const { task, context, iso, exact } = queue.shift()!;
      const key = cacheKey(task, context);
      queuedKeys.delete(key);
      const cleaned = cleanPlaceQuery(task);
      // Address-level queries: send verbatim with postcode + country hints
      // so Nominatim resolves the exact building, not the nearest city.
      const anchored = exact
        ? cleaned
        : task.includes(',') || !context
        ? cleaned
        : `${cleaned}, ${context}`;
      let result = await fetchNominatim(anchored, iso, exact);
      // Second chance: the destination anchor sometimes confuses the geocoder
      // (e.g. region vs city) — retry the cleaned place name on its own,
      // still pinned to the trip country.
      if (result === 'miss' && !exact && anchored !== cleaned) {
        await new Promise((r) => setTimeout(r, 1100));
        result = await fetchNominatim(cleaned, iso, false);
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
 * `exact` marks street-address / postcode queries (building-level only).
 */
export const requestGeocode = (task: string, context = '', exact = false): void => {
  if (!task.trim()) return;
  const isExact = exact || isAddressQuery(task);
  if (!isExact && (findPlaceGeo(task) || findPlaceGeo(cleanPlaceQuery(task)))) return; // local table knows it
  const key = cacheKey(task, context);
  const hit = loadCache()[key];
  if (hit) {
    if (!hit.fail) return; // already resolved — geoForTask will find it
    if (Date.now() - hit.t < NEGATIVE_TTL_MS) return; // recent miss, don't retry yet
  }
  if (queuedKeys.has(key)) return;
  queuedKeys.add(key);
  queue.push({ task, context, iso: iso2FromContext(context), exact: isExact });
  void drain();
};

/**
 * Store an exact coordinate for a text query NOW (synchronously) — used when
 * a precise address resolves online; the pin appears instantly, without
 * waiting for the drain queue.
 */
export const storeGeocode = (task: string, context: string, lat: number, lng: number, name?: string): void => {
  loadCache()[cacheKey(task, context)] = { lat, lng, name: name || task.trim(), t: Date.now() };
  saveCache();
  notify();
};

export interface GeocodeCandidate {
  lat: number;
  lng: number;
  display: string;
  /** OSM feature type (house/street/city…) — coarse matches get rejected for address queries. */
  type?: string;
  /** Place name when the feature has one ("Tower Bridge", "Baker Street"…). */
  name?: string;
  /** Street address when known ("221B Baker Street") — name's fallback. */
  address?: string;
}

/** JSON from a search endpoint that answers {lat, lng, display}. */
interface RawSearchHit {
  lat: number | null;
  lon: number | null;
  display_name?: string;
  type?: string;
}

/** Building-level (street/amenity/house) results only — never city centroids. */
const FINE_TYPES = new Set([
  'house', 'house_number', 'building', 'addr:housenumber',
  'street', 'residential', 'unclassified', 'tertiary', 'secondary', 'primary',
  'living_street', 'pedestrian', 'service', 'track', 'path',
  'yes', // Nominatim building=yes is a real address
  'museum', 'attraction', 'tourism', 'hotel', 'restaurant', 'cafe', 'shop',
  'amenity', 'place_of_worship', 'church', 'temple', 'stadium', 'theatre'
]);

const shapeHits = (arr: RawSearchHit[]): GeocodeCandidate[] =>
  arr
    .filter((r) => r?.lat != null && r?.lon != null)
    .map((r) => ({ lat: Number(r.lat), lng: Number(r.lon), display: String(r.display_name || ''), type: r.type || '' }))
    .filter((c) => c.display);

/** Photon (OSM-based): primary address geocoder — fast, autocomplete-friendly. */
const photonSearch = async (q: string, iso: string | null, bias: [number, number] | null): Promise<GeocodeCandidate[]> => {
  let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`;
  if (iso) url += `&countrycode=${iso.toLowerCase()}`;
  // Bias toward the trip's area so common street names resolve to the right
  // city — Photon ranks matches near this point first (same city, exact street).
  if (bias) url += `&lat=${bias[0]}&lon=${bias[1]}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const json = await res.json();
  const feats = Array.isArray(json?.features) ? json.features : [];
  return feats
    .map((f: any) => {
      const [lng, lat] = f?.geometry?.coordinates || [null, null];
      const p = f?.properties || {};
      const type = String(p.osm_value || p.type || '');
      const parts = [p.name, p.street, p.housenumber, p.city, p.state, p.country]
        .filter(Boolean).join(', ');
      const name = p.name ? String(p.name) : '';
      const address = [p.housenumber, p.street].filter(Boolean).join(' ');
      return { lat: Number(lat), lng: Number(lng), display: parts || name || address, type, name, address };
    })
    .filter((c: GeocodeCandidate) => c.lat != null && c.lng != null && c.display);
};

/** Nominatim (OSM): fallback when Photon is unreachable. */
const nominatimSearch = async (q: string, iso: string | null): Promise<RawSearchHit[]> => {
  let url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&extratags=1&q=${encodeURIComponent(q)}`;
  if (iso) url += `&countrycodes=${iso.toLowerCase()}`;
  if (POSTCODE_RE.test(q)) url += `&postalcode=${encodeURIComponent((q.match(POSTCODE_RE) || [''])[0])}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : [];
};

/** Building-level results first; city/region-scale matches only as a last resort. */
const isCoarse = (c: GeocodeCandidate) =>
  !FINE_TYPES.has((c.type || '').toLowerCase()) && /,\s*(city|state|region|country)\b/i.test(`, ${c.type || ''}`);

/** Photon surfaces osm_value as type; coarse place levels for address queries. */
const isCoarsePhoton = (c: GeocodeCandidate) => {
  const t = (c.type || '').toLowerCase();
  return t === 'city' || t === 'administrative' || t === 'boundary' || t === 'state' || t === 'county';
};

const rankCandidates = (arr: GeocodeCandidate[], strict: boolean): GeocodeCandidate[] => {
  const fine = arr.filter((c) => !(isCoarse(c) || isCoarsePhoton(c)));
  if (strict && fine.length === 0) return []; // address query: never fall back to a city centroid
  return fine.length > 0 ? fine : arr;
};

/** Prefer building/street hits; returns candidates or [] when nothing usable. */
const searchAddresses = async (
  q: string,
  iso: string | null,
  strict: boolean,
  bias: [number, number] | null
): Promise<GeocodeCandidate[]> => {
  try {
    const p = await photonSearch(q, iso, bias);
    const ranked = rankCandidates(p, strict);
    if (ranked.length > 0) return ranked;
  } catch {
    /* Photon unreachable — try Nominatim */
  }
  try {
    const n = shapeHits(await nominatimSearch(q, iso));
    return rankCandidates(n, strict);
  } catch {
    return [];
  }
};

/** Live place suggestions while typing — used by the day-activity name fields. */
export const searchPlaceSuggestions = async (
  query: string,
  context = '',
  limit = 6
): Promise<GeocodeCandidate[]> => {
  const q = (query || '').trim();
  if (q.length < 3) return [];
  const iso = iso2FromContext(context);
  const ctxGeo = geoForTask(context, '');
  const bias: [number, number] | null = ctxGeo ? [ctxGeo.lat, ctxGeo.lng] : null;
  const full = q.includes(',') || !context ? q : `${q}, ${context}`;
  try {
    const p = await photonSearch(full, iso, bias);
    const ranked = rankPlaceHits(p, q, context, false);
    if (ranked.length > 0) return ranked.slice(0, limit);
  } catch {
    /* Photon unreachable — try Nominatim */
  }
  try {
    const n = shapeHits(await nominatimSearch(full, iso));
    return rankPlaceHits(n, q, context, false).slice(0, limit);
  } catch {
    return [];
  }
};

/**
 * Resolve a typed address/postcode to its exact building-level coordinate.
 * Returns the best candidate plus alternatives (for a confirmation dropdown).
 * 'miss' = online but no match; null = network error (uncached).
 */
export const geocodeAddress = async (
  query: string,
  context = ''
): Promise<{ best: GeocodeCandidate | null; candidates: GeocodeCandidate[] } | 'miss' | null> => {
  const q = (query || '').trim();
  if (!q) return 'miss';
  const iso = iso2FromContext(context);
  // Addresses go verbatim; plain place names get the trip context appended.
  const full = isAddressQuery(q) || q.includes(',') || !context ? q : `${q}, ${context}`;
  const strict = isAddressQuery(q); // typed an address: building-level only
  // Bias to the trip's own location (city/destination) for a tighter match.
  const ctxGeo = geoForTask(context, '');
  const bias: [number, number] | null = ctxGeo ? [ctxGeo.lat, ctxGeo.lng] : null;
  try {
    const candidates = await searchAddresses(full, iso, strict, bias);
    if (candidates.length === 0) return 'miss';
    const ranked = rankPlaceHits(candidates, q, context, strict);
    if (!ranked.length) return 'miss';
    return { best: ranked[0], candidates: ranked.slice(0, 5) };
  } catch {
    return null;
  }
};

/* ── Reverse geocoding: GPS fix → human place name ("Casablanca, Morocco") ──
   Used by the safety check-in and the SOS tracker so both show where the
   phone actually is. Cached per coordinate-rounding so repeat pings are free. */
const reverseCache = new Map<string, string | null>();

export const reverseGeocodePlace = async (lat: number, lng: number): Promise<string | null> => {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (reverseCache.has(key)) return reverseCache.get(key)!;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=en`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      reverseCache.set(key, null);
      return null;
    }
    const json = await res.json();
    const addr = json?.address || {};
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    const country = addr.country || '';
    const name = [city, country].filter(Boolean).join(', ');
    const result = name || (json?.display_name ? String(json.display_name).split(',').slice(0, 2).join(',').trim() : null);
    reverseCache.set(key, result || null);
    return result || null;
  } catch {
    reverseCache.set(key, null);
    return null;
  }
};
