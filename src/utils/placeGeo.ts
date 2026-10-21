/**
 * placeGeo — lightweight place-name → coordinates matcher for itinerary routes.
 *
 * Powers the Pi-Travel-style day route map, the "km · min" leg connectors and
 * the one-tap route optimiser. No network calls: a curated table of cities and
 * famous landmarks is matched against free-text activity lines (longest name
 * wins), so plans written in plain words still resolve to real places.
 */

export interface PlaceGeo {
  lat: number;
  lng: number;
  /** The canonical place name that matched (for tooltips/labels). */
  name: string;
}

interface PlaceEntry {
  names: string[]; // lowercase aliases, longest/most-specific first
  lat: number;
  lng: number;
}

const P = (lat: number, lng: number, ...names: string[]): PlaceEntry => ({ names, lat, lng });

/** Curated landmarks + cities. Aliases are matched case-insensitively as substrings. */
const PLACE_TABLE: PlaceEntry[] = [
  // ── Kyoto ──────────────────────────────────────────────────────────────
  P(34.9671, 135.7727, 'fushimi inari'),
  P(35.0394, 135.7292, 'kinkaku-ji', 'kinkakuji', 'golden pavilion'),
  P(35.0094, 135.6722, 'arashiyama', 'bamboo grove', 'bamboo forest'),
  P(35.0037, 135.7755, 'gion'),
  P(34.9949, 135.785, 'kiyomizu-dera', 'kiyomizudera', 'kiyomizu temple'),
  P(35.0142, 135.7482, 'nijo castle', 'nijō castle'),
  P(35.0045, 135.7704, 'nishiki market', 'nishiki'),
  P(35.0312, 135.7831, 'philosopher', 'tetsugaku'),
  P(34.9858, 135.7584, 'ginkaku-ji', 'silver pavilion'),
  P(35.0066, 135.7703, 'pontocho', 'pontochō'),
  P(35.0185, 135.7328, 'ryoan-ji', 'ryoanji'),
  P(34.9913, 135.8132, 'daigo-ji'),
  P(35.0116, 135.7681, 'kyoto'),
  // ── Tokyo ──────────────────────────────────────────────────────────────
  P(35.7148, 139.7967, 'senso-ji', 'sensō-ji', 'asakusa'),
  P(35.6595, 139.7005, 'shibuya'),
  P(35.6895, 139.6917, 'shinjuku'),
  P(35.6764, 139.6993, 'meiji shrine', 'meiji jingu'),
  P(35.6586, 139.7454, 'tokyo tower'),
  P(35.6654, 139.7707, 'tsukiji'),
  P(35.7101, 139.8107, 'tokyo skytree', 'skytree'),
  P(35.6895, 139.7536, 'imperial palace'),
  P(35.6717, 139.765, 'ginza'),
  P(35.6984, 139.773, 'akihabara'),
  P(35.6652, 139.7126, 'harajuku', 'takeshita'),
  P(35.6812, 139.7671, 'tokyo station'),
  P(35.6762, 139.6503, 'tokyo'),
  // ── Osaka ──────────────────────────────────────────────────────────────
  P(34.6873, 135.5262, 'osaka castle'),
  P(34.6687, 135.5013, 'dotonbori', 'dōtonbori', 'namba'),
  P(34.6525, 135.5063, 'shinsekai', 'tsutenkaku'),
  P(34.7024, 135.4959, 'umeda'),
  P(34.6937, 135.5023, 'osaka'),
  // ── Dubrovnik / Croatia ────────────────────────────────────────────────
  P(42.6414, 18.1077, 'city walls', 'fortress walls', 'dubrovnik walls'),
  P(42.6407, 18.1104, 'old town dubrovnik', 'dubrovnik old town', 'stradun'),
  P(42.6428, 18.1072, 'buža', 'buza bar'),
  P(42.6278, 18.1136, 'lokrum'),
  P(42.6497, 18.0833, 'mount srđ', 'srd', 'cable car'),
  P(42.6507, 18.0944, 'dubrovnik'),
  P(43.5081, 16.4402, 'diocletian', 'split'),
  P(45.815, 15.9819, 'zagreb'),
  P(44.8666, 13.8496, 'plitvice'),
  P(42.9629, 17.1368, 'korčula', 'korcula'),
  P(43.1729, 16.4411, 'hvar'),
  // ── Barcelona / Spain ──────────────────────────────────────────────────
  P(41.4036, 2.1744, 'sagrada familia', 'sagrada família'),
  P(41.4145, 2.1527, 'park güell', 'park guell'),
  P(41.3831, 2.1761, 'gothic quarter', 'barri gòtic', 'barri gotic'),
  P(41.381, 2.1701, 'la rambla', 'las ramblas', 'rambla'),
  P(41.3784, 2.1925, 'barceloneta'),
  P(41.3879, 2.1699, 'casa batlló', 'casa batllo'),
  P(41.3953, 2.162, 'casa milà', 'la pedrera'),
  P(41.3645, 2.1559, 'montjuïc', 'montjuic'),
  P(41.3817, 2.1806, 'el born', 'picasso museum'),
  P(41.3874, 2.1686, 'barcelona'),
  P(40.4168, -3.7038, 'madrid', 'retiro', 'prado'),
  P(37.3891, -5.9845, 'seville', 'sevilla', 'alcázar', 'alcazar'),
  P(36.7213, -4.4214, 'málaga', 'malaga'),
  // ── Amalfi Coast / Italy ───────────────────────────────────────────────
  P(40.6281, 14.485, 'positano'),
  P(40.634, 14.6027, 'amalfi'),
  P(40.6492, 14.6115, 'ravello', 'villa rufolo', 'villa cimbrone'),
  P(40.5532, 14.2222, 'capri', 'blue grotto'),
  P(40.6781, 14.4928, 'path of the gods', 'sentiero degli dei'),
  P(40.7489, 14.4893, 'sorrento'),
  P(40.7488, 14.4848, 'pompeii'),
  P(41.9028, 12.4964, 'rome', 'colosseum', 'colosseo', 'vatican', 'trevi'),
  P(43.7696, 11.2558, 'florence', 'firenze', 'duomo'),
  P(45.4408, 12.3155, 'venice', 'venezia'),
  P(45.4642, 9.19, 'milan', 'milano'),
  // ── Oaxaca / Mexico ────────────────────────────────────────────────────
  P(17.0597, -96.7224, 'santo domingo oaxaca', 'santo domingo'),
  P(17.0654, -96.7236, 'mercado 20 de noviembre', '20 de noviembre'),
  P(17.0432, -96.7679, 'monte albán', 'monte alban'),
  P(16.9972, -96.5178, 'hierve el agua'),
  P(17.0732, -96.7266, 'oaxaca'),
  P(19.4326, -99.1332, 'mexico city', 'cdmx', 'zócalo', 'zocalo', 'roma norte', 'coyoacán', 'coyoacan', 'frida kahlo'),
  P(20.6597, -103.3496, 'guadalajara'),
  // ── Southeast Asia ─────────────────────────────────────────────────────
  P(13.7563, 100.5018, 'bangkok', 'grand palace', 'wat pho', 'wat arun', 'chatuchak'),
  P(18.7883, 98.9853, 'chiang mai', 'doi suthep'),
  P(7.8804, 98.3923, 'phuket'),
  P(-8.3405, 115.092, 'bali', 'ubud', 'uluwatu', 'canggu', 'seminyak', 'tegallalang'),
  P(1.3521, 103.8198, 'singapore', 'marina bay', 'gardens by the bay', 'sentosa', 'chinatown'),
  P(21.0285, 105.8542, 'hanoi'),
  P(10.8231, 106.6297, 'ho chi minh', 'saigon'),
  // ── Europe (other) ─────────────────────────────────────────────────────
  P(38.7223, -9.1393, 'lisbon', 'lisboa', 'alfama', 'belém', 'belem', 'sintra'),
  P(41.1579, -8.6291, 'porto'),
  P(48.8566, 2.3522, 'paris', 'eiffel', 'louvre', 'montmartre', 'notre dame', 'seine'),
  P(51.5072, -0.1276, 'london', 'big ben', 'camden', 'shoreditch', 'westminster'),
  P(52.52, 13.405, 'berlin', 'brandenburg', 'kreuzberg'),
  P(52.3676, 4.9041, 'amsterdam', 'rijksmuseum'),
  P(50.0755, 14.4378, 'prague', 'praha'),
  P(48.2082, 16.3738, 'vienna', 'wien'),
  P(47.4979, 19.0402, 'budapest'),
  P(37.9838, 23.7275, 'athens', 'acropolis'),
  P(41.0082, 28.9784, 'istanbul', 'hagia sophia', 'sultanahmet', 'grand bazaar'),
  P(64.1466, -21.9426, 'reykjavik', 'blue lagoon', 'golden circle', 'hallgrimskirkja'),
  P(31.6295, -7.9811, 'marrakech', 'marrakesh', 'medina', 'jemaa el-fnaa'),
  // ── East Asia ──────────────────────────────────────────────────────────
  P(37.5665, 126.978, 'seoul', 'gyeongbokgung', 'myeongdong', 'hongdae', 'bukchon'),
  P(35.1796, 129.0756, 'busan'),
  P(31.2304, 121.4737, 'shanghai', 'the bund'),
  P(39.9042, 116.4074, 'beijing', 'forbidden city', 'great wall'),
  P(22.3193, 114.1694, 'hong kong', 'victoria peak', 'mong kok'),
  P(25.033, 121.5654, 'taipei', 'taipei 101', 'shilin'),
  // ── South Asia / Middle East / Africa ─────────────────────────────────
  P(28.6139, 77.209, 'delhi', 'new delhi'),
  P(27.1751, 78.0421, 'agra', 'taj mahal'),
  P(30.0444, 31.2357, 'cairo', 'pyramids', 'giza'),
  P(25.2048, 55.2708, 'dubai', 'burj khalifa'),
  P(-33.9249, 18.4241, 'cape town', 'table mountain'),
  // ── Americas / Oceania ────────────────────────────────────────────────
  P(40.7128, -74.006, 'new york', 'manhattan', 'brooklyn', 'central park', 'times square'),
  P(34.0522, -118.2437, 'los angeles', 'santa monica', 'hollywood'),
  P(37.7749, -122.4194, 'san francisco', 'golden gate'),
  P(49.2827, -123.1207, 'vancouver'),
  P(19.4326, -99.1332, 'ciudad de méxico'),
  P(-22.9068, -43.1729, 'rio de janeiro', 'copacabana', 'christ the redeemer'),
  P(-34.6037, -58.3816, 'buenos aires'),
  P(-13.532, -71.9675, 'cusco', 'machu picchu', 'sacred valley'),
  P(-12.0464, -77.0428, 'lima'),
  P(-33.8688, 151.2093, 'sydney', 'bondi', 'opera house'),
  P(-37.8136, 144.9631, 'melbourne'),
  P(-45.0312, 168.6626, 'queenstown', 'milford'),
  P(-36.8485, 174.7633, 'auckland')
];

/** Sorted once: longer aliases first so "dubrovnik old town" beats "dubrovnik". */
const SORTED_ALIASES: Array<{ alias: string; entry: PlaceEntry }> = PLACE_TABLE.flatMap((entry) =>
  entry.names.map((alias) => ({ alias, entry }))
).sort((a, b) => b.alias.length - a.alias.length);

const geoCache = new Map<string, PlaceGeo | null>();

/**
 * Resolve free text (an activity line, a destination, "City, Country") to
 * coordinates. Matches known place names as substrings; falls back to any
 * comma-separated segment that is itself a known place.
 */
export const findPlaceGeo = (text: string): PlaceGeo | null => {
  const raw = (text || '').toLowerCase().trim();
  if (!raw) return null;
  const cached = geoCache.get(raw);
  if (cached !== undefined) return cached;

  let found: PlaceGeo | null = null;
  for (const { alias, entry } of SORTED_ALIASES) {
    if (raw.includes(alias)) {
      found = { lat: entry.lat, lng: entry.lng, name: alias };
      break;
    }
  }
  if (!found && raw.includes(',')) {
    for (const seg of raw.split(',').map((s) => s.trim())) {
      if (!seg) continue;
      for (const { alias, entry } of SORTED_ALIASES) {
        if (seg === alias) {
          found = { lat: entry.lat, lng: entry.lng, name: alias };
          break;
        }
      }
      if (found) break;
    }
  }
  geoCache.set(raw, found);
  return found;
};

/** "kinkaku-ji" → "Kinkaku-ji" — display form for auto-planned activity lines. */
export const titleCasePlace = (name: string): string =>
  name
    .split(/(\s+|-)/)
    .map((part) => (/^\s|-/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');

/**
 * Landmark suggestions around a destination — powers the automatic route plan
 * when a new trip is created. Finds the anchor city/place, then returns the
 * curated places clustered around it (nearest first), the generic city pin
 * itself excluded so route stops are real sights, not duplicates of the centre.
 */
export const suggestPlacesFor = (destination: string, limit = 12): PlaceGeo[] => {
  const anchor = findPlaceGeo(destination);
  if (!anchor) return [];
  const seen = new Set<string>();
  const out: PlaceGeo[] = [];
  for (const entry of PLACE_TABLE) {
    const dist = Math.hypot(entry.lat - anchor.lat, entry.lng - anchor.lng);
    if (dist > 1.2) continue; // ~metro area / day-trip radius
    const canonical = entry.names[0];
    if (canonical === anchor.name || seen.has(canonical)) continue;
    seen.add(canonical);
    out.push({ lat: entry.lat, lng: entry.lng, name: titleCasePlace(canonical) });
  }
  out.sort(
    (a, b) =>
      Math.hypot(a.lat - anchor.lat, a.lng - anchor.lng) -
      Math.hypot(b.lat - anchor.lat, b.lng - anchor.lng)
  );
  return out.slice(0, limit);
};

export type TravelMode =
  | 'walk'
  | 'transit'
  | 'drive'
  | 'taxi'
  | 'train'
  | 'bus'
  | 'ferry'
  | 'flight';

/**
 * How a leg of this mode is drawn on the route map:
 *  - solid: land modes follow a straight solid line
 *  - dotted: ferry hops (dotted straight line)
 *  - curved-dotted: flights arc over the map as a curved dotted line
 */
export const TRAVEL_MODE_LINE: Record<TravelMode, 'solid' | 'dotted' | 'curved-dotted'> = {
  walk: 'solid',
  transit: 'solid',
  drive: 'solid',
  taxi: 'solid',
  train: 'solid',
  bus: 'solid',
  ferry: 'dotted',
  flight: 'curved-dotted'
};

/** Average speed (km/h) + fixed overhead (min) used when a mode is hand-picked. */
export const TRAVEL_MODE_SPEED: Record<TravelMode, { kmh: number; overheadMin: number }> = {
  walk: { kmh: 5, overheadMin: 0 },
  transit: { kmh: 23, overheadMin: 6 },
  drive: { kmh: 42, overheadMin: 12 },
  taxi: { kmh: 38, overheadMin: 6 },
  train: { kmh: 90, overheadMin: 18 },
  bus: { kmh: 24, overheadMin: 8 },
  ferry: { kmh: 28, overheadMin: 25 },
  flight: { kmh: 700, overheadMin: 120 }
};

/** Minutes for a leg with a traveller-chosen mode. */
export const estimateLegForMode = (km: number, mode: TravelMode): number => {
  const { kmh, overheadMin } = TRAVEL_MODE_SPEED[mode];
  return Math.max(2, Math.round((km / kmh) * 60) + overheadMin);
};

export interface LegEstimate {
  km: number;
  minutes: number;
  mode: TravelMode;
}

/** Rough solo-traveller leg estimate from straight-line distance. */
export const estimateLeg = (km: number): LegEstimate => {
  if (km <= 1.5) return { km, minutes: Math.max(3, Math.round(km * 12)), mode: 'walk' };
  if (km <= 12) return { km, minutes: Math.round(km * 2.6) + 6, mode: 'transit' };
  return { km, minutes: Math.round(km * 1.4) + 12, mode: 'drive' };
};

/**
 * Nearest-neighbour reorder of items that have coordinates. Items without a
 * resolved location keep their relative order and are appended after the
 * routed ones (nothing is ever dropped).
 */
export const optimizeStopOrder = <T extends { geo: PlaceGeo | null }>(items: T[]): T[] => {
  const routed = items.filter((i) => i.geo);
  const unrouted = items.filter((i) => !i.geo);
  if (routed.length < 3) return items;

  const remaining = [...routed];
  const ordered: T[] = [remaining.shift()!];
  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1].geo!;
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((cand, idx) => {
      const g = cand.geo!;
      const dLat = g.lat - last.lat;
      const dLng = (g.lng - last.lng) * Math.cos((last.lat * Math.PI) / 180);
      const d = dLat * dLat + dLng * dLng;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = idx;
      }
    });
    ordered.push(remaining.splice(bestIdx, 1)[0]);
  }
  // Don't churn the plan if the optimiser changes nothing.
  const sameOrder = ordered.every((it, i) => it === routed[i]) && unrouted.length === 0;
  return sameOrder ? items : [...ordered, ...unrouted];
};

/** Distinct, colour-blind-friendly hues for Day 1..N route lines. */
export const DAY_ROUTE_COLORS = [
  '#f43f5e',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316'
];

export const dayRouteColor = (dayNumber: number) =>
  DAY_ROUTE_COLORS[(dayNumber - 1) % DAY_ROUTE_COLORS.length];
