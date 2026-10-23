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
  /** Generic city/area pin — landmarks always outrank these when both match. */
  isCity: boolean;
}

/** Canonical names (first alias) of the generic city pins in the table below. */
const CITY_NAMES = new Set([
  'kyoto', 'tokyo', 'osaka', 'dubrovnik', 'split', 'zagreb', 'barcelona', 'madrid',
  'seville', 'málaga', 'rome', 'florence', 'venice', 'milan', 'naples', 'oaxaca',
  'mexico city', 'guadalajara', 'bangkok', 'chiang mai', 'phuket', 'bali',
  'singapore', 'hanoi', 'ho chi minh', 'lisbon', 'porto', 'paris', 'london',
  'berlin', 'amsterdam', 'prague', 'vienna', 'budapest', 'athens', 'istanbul',
  'reykjavik', 'marrakech', 'zurich', 'basel', 'bern', 'geneva', 'lucerne',
  'interlaken', 'zermatt', 'liechtenstein', 'salzburg', 'innsbruck', 'krakow',
  'warsaw', 'copenhagen', 'stockholm', 'oslo', 'helsinki', 'dublin', 'edinburgh',
  'brussels', 'manchester', 'seoul', 'busan', 'shanghai', 'beijing', 'hong kong',
  'taipei', 'delhi', 'agra', 'giza', 'cairo', 'dubai', 'cape town', 'new york',
  'manhattan', 'brooklyn', 'los angeles', 'san francisco', 'vancouver',
  'rio de janeiro', 'buenos aires', 'cusco', 'lima', 'sydney', 'melbourne',
  'queenstown', 'auckland'
]);

const P = (lat: number, lng: number, ...names: string[]): PlaceEntry => ({
  names,
  lat,
  lng,
  isCity: CITY_NAMES.has(names[0])
});

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
  P(44.8654, 15.582, 'plitvice', 'plitvice lakes'),
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
  P(40.4153, -3.6845, 'retiro', 'el retiro'),
  P(40.4138, -3.6921, 'prado', 'prado museum'),
  P(40.4168, -3.7038, 'madrid'),
  P(37.3831, -5.9902, 'alcázar of seville', 'seville alcázar', 'seville alcazar', 'real alcázar'),
  P(37.3891, -5.9845, 'seville', 'sevilla'),
  P(36.7213, -4.4214, 'málaga', 'malaga'),
  // ── Amalfi Coast / Italy ───────────────────────────────────────────────
  P(40.6281, 14.485, 'positano'),
  P(40.634, 14.6027, 'amalfi'),
  P(40.6492, 14.6115, 'ravello', 'villa rufolo', 'villa cimbrone'),
  P(40.5532, 14.2222, 'capri', 'blue grotto'),
  P(40.6781, 14.4928, 'path of the gods', 'sentiero degli dei'),
  P(40.7489, 14.4893, 'sorrento'),
  P(40.7488, 14.4848, 'pompeii'),
  P(41.8902, 12.4922, 'colosseum', 'colosseo'),
  P(41.9029, 12.4534, 'vatican', 'vatican city', 'st peter'),
  P(41.9009, 12.4833, 'trevi', 'trevi fountain'),
  P(41.9028, 12.4964, 'rome', 'roma'),
  P(43.7731, 11.256, 'florence cathedral', 'duomo'),
  P(43.7696, 11.2558, 'florence', 'firenze'),
  P(45.4408, 12.3155, 'venice', 'venezia'),
  P(45.4642, 9.19, 'milan', 'milano'),
  P(40.8518, 14.2681, 'naples', 'napoli'),
  // ── Oaxaca / Mexico ────────────────────────────────────────────────────
  P(17.0597, -96.7224, 'santo domingo oaxaca', 'santo domingo'),
  P(17.0654, -96.7236, 'mercado 20 de noviembre', '20 de noviembre'),
  P(17.0432, -96.7679, 'monte albán', 'monte alban'),
  P(16.9972, -96.5178, 'hierve el agua'),
  P(17.0732, -96.7266, 'oaxaca'),
  P(19.4326, -99.1332, 'zócalo', 'zocalo'),
  P(19.4194, -99.1627, 'roma norte'),
  P(19.3467, -99.1617, 'coyoacán', 'coyoacan'),
  P(19.3551, -99.1625, 'frida kahlo', 'casa azul'),
  P(19.4326, -99.1332, 'mexico city', 'cdmx', 'ciudad de méxico', 'ciudad de mexico'),
  P(20.6597, -103.3496, 'guadalajara'),
  // ── Southeast Asia ─────────────────────────────────────────────────────
  P(13.75, 100.4913, 'grand palace', 'the grand palace'),
  P(13.7465, 100.493, 'wat pho'),
  P(13.7437, 100.4889, 'wat arun'),
  P(13.7999, 100.5503, 'chatuchak'),
  P(13.7563, 100.5018, 'bangkok'),
  P(18.8049, 98.9216, 'doi suthep'),
  P(18.7883, 98.9853, 'chiang mai'),
  P(7.8804, 98.3923, 'phuket'),
  P(-8.5069, 115.2625, 'ubud'),
  P(-8.8291, 115.0849, 'uluwatu'),
  P(-8.6478, 115.1385, 'canggu'),
  P(-8.6913, 115.1685, 'seminyak'),
  P(-8.4312, 115.2776, 'tegallalang'),
  P(-8.3405, 115.092, 'bali'),
  P(1.2836, 103.8607, 'marina bay'),
  P(1.2816, 103.8636, 'gardens by the bay'),
  P(1.2494, 103.8303, 'sentosa'),
  P(1.2838, 103.8442, 'chinatown'),
  P(1.3521, 103.8198, 'singapore'),
  P(21.0285, 105.8542, 'hanoi'),
  P(10.8231, 106.6297, 'ho chi minh', 'saigon'),
  // ── Europe (other) ─────────────────────────────────────────────────────
  P(38.7139, -9.1255, 'alfama'),
  P(38.6979, -9.2063, 'belém', 'belem'),
  P(38.8029, -9.3817, 'sintra'),
  P(38.7223, -9.1393, 'lisbon', 'lisboa'),
  P(41.1579, -8.6291, 'porto'),
  P(48.8584, 2.2945, 'eiffel tower', 'eiffel', 'tour eiffel'),
  P(48.8606, 2.3376, 'louvre', 'the louvre'),
  P(48.8867, 2.3431, 'montmartre', 'sacré-cœur', 'sacre-coeur', 'sacre coeur'),
  P(48.853, 2.3499, 'notre dame', 'notre-dame'),
  P(48.8566, 2.3522, 'paris'),
  P(51.5007, -0.1246, 'big ben'),
  P(51.539, -0.1426, 'camden', 'camden market'),
  P(51.5229, -0.0777, 'shoreditch'),
  P(51.4995, -0.1333, 'westminster'),
  P(51.5072, -0.1276, 'london'),
  P(52.5163, 13.3777, 'brandenburg gate', 'brandenburg'),
  P(52.4976, 13.4115, 'kreuzberg'),
  P(52.52, 13.405, 'berlin'),
  P(52.36, 4.8852, 'rijksmuseum'),
  P(52.3676, 4.9041, 'amsterdam'),
  P(50.0755, 14.4378, 'prague', 'praha'),
  P(48.2082, 16.3738, 'vienna', 'wien'),
  P(47.4979, 19.0402, 'budapest'),
  P(37.9715, 23.7257, 'acropolis', 'parthenon'),
  P(37.9838, 23.7275, 'athens'),
  P(41.0086, 28.9802, 'hagia sophia'),
  P(41.0054, 28.9768, 'sultanahmet'),
  P(41.0106, 28.968, 'grand bazaar'),
  P(41.0082, 28.9784, 'istanbul'),
  P(63.8804, -22.4495, 'blue lagoon'),
  P(64.3271, -20.1199, 'golden circle', 'gullfoss'),
  P(64.1417, -21.9266, 'hallgrimskirkja', 'hallgrímskirkja'),
  P(64.1466, -21.9426, 'reykjavik'),
  P(31.633, -7.9888, 'medina'),
  P(31.6258, -7.9891, 'jemaa el-fnaa', 'jemaa el fnaa'),
  P(31.6295, -7.9811, 'marrakech', 'marrakesh'),
  // ── Switzerland & Central/Northern Europe ─────────────────────────────
  P(47.3726, 8.5391, 'bahnhofstrasse'),
  P(47.3739, 8.5452, 'niederdorf'),
  P(47.3386, 8.541, 'lake zurich', 'lake zürich'),
  P(47.3769, 8.5417, 'zurich', 'zürich'),
  P(47.5596, 7.5886, 'basel'),
  P(46.948, 7.4474, 'bern', 'berne', 'zytglogge'),
  P(46.2044, 6.1432, 'geneva', 'genève', 'jet d\'eau', 'lake geneva'),
  P(47.0516, 8.3073, 'chapel bridge', 'kapellbrücke', 'kapellbrucke'),
  P(46.9795, 8.2548, 'mount pilatus', 'pilatus'),
  P(47.0502, 8.3093, 'lucerne', 'luzern'),
  P(46.5475, 7.9851, 'jungfraujoch', 'jungfrau'),
  P(46.5935, 7.9091, 'lauterbrunnen'),
  P(46.6242, 8.0414, 'grindelwald'),
  P(46.6863, 7.8632, 'interlaken'),
  P(45.9763, 7.6586, 'matterhorn'),
  P(45.9833, 7.7847, 'gornergrat'),
  P(46.0207, 7.7491, 'zermatt'),
  P(47.3495, 8.4913, 'uetliberg'),
  P(47.3729, 8.5412, 'lindenhof'),
  P(47.6779, 8.6151, 'rhine falls', 'rheinfall'),
  P(47.6595, 8.8585, 'stein am rhein'),
  P(47.1415, 9.5215, 'liechtenstein', 'vaduz'),
  P(47.5622, 13.6493, 'hallstatt'),
  P(47.6062, 13.0486, 'salzburg'),
  P(47.2692, 11.4041, 'innsbruck'),
  P(50.088, 14.4208, 'charles bridge', 'old town square'),
  P(50.0619, 19.9369, 'krakow', 'kraków'),
  P(52.2297, 21.0122, 'warsaw', 'warszawa'),
  P(55.6798, 12.5914, 'nyhavn'),
  P(55.6737, 12.5681, 'tivoli', 'tivoli gardens'),
  P(55.6761, 12.5683, 'copenhagen'),
  P(59.3251, 18.0717, 'gamla stan'),
  P(59.3293, 18.0686, 'stockholm'),
  P(59.9139, 10.7522, 'oslo'),
  P(60.1699, 24.9384, 'helsinki'),
  P(53.3455, -6.263, 'temple bar'),
  P(53.3498, -6.2603, 'dublin'),
  P(55.9505, -3.1883, 'royal mile'),
  P(55.9441, -3.1618, 'arthur\'s seat', 'arthurs seat'),
  P(55.9533, -3.1883, 'edinburgh'),
  P(50.8467, 4.3525, 'grand place', 'grote markt'),
  P(50.8503, 4.3517, 'brussels'),
  P(53.4808, -2.2426, 'manchester'),
  // ── East Asia ──────────────────────────────────────────────────────────
  P(37.5796, 126.977, 'gyeongbokgung'),
  P(37.5637, 126.9838, 'myeongdong'),
  P(37.5563, 126.9236, 'hongdae'),
  P(37.5826, 126.9831, 'bukchon', 'bukchon hanok'),
  P(37.5665, 126.978, 'seoul'),
  P(35.1796, 129.0756, 'busan'),
  P(31.24, 121.49, 'the bund', 'bund'),
  P(31.2304, 121.4737, 'shanghai'),
  P(39.9163, 116.3972, 'forbidden city'),
  P(40.4319, 116.5704, 'great wall', 'mutianyu'),
  P(39.9042, 116.4074, 'beijing'),
  P(22.2759, 114.1455, 'victoria peak', 'the peak'),
  P(22.3193, 114.1694, 'mong kok'),
  P(22.2783, 114.1747, 'hong kong', 'central'),
  P(25.033, 121.5654, 'taipei 101'),
  P(25.0883, 121.5254, 'shilin', 'shilin night market'),
  P(25.0478, 121.5318, 'taipei'),
  // ── South Asia / Middle East / Africa ─────────────────────────────────
  P(28.6139, 77.209, 'delhi', 'new delhi'),
  P(27.1751, 78.0421, 'agra', 'taj mahal'),
  P(29.9792, 31.1342, 'pyramids', 'giza pyramids', 'great pyramid'),
  P(30.0131, 31.2089, 'giza'),
  P(30.0444, 31.2357, 'cairo'),
  P(25.1972, 55.2744, 'burj khalifa'),
  P(25.2048, 55.2708, 'dubai'),
  P(-33.9628, 18.4098, 'table mountain'),
  P(-33.9249, 18.4241, 'cape town'),
  // ── Americas / Oceania ────────────────────────────────────────────────
  P(40.7829, -73.9654, 'central park'),
  P(40.758, -73.9855, 'times square'),
  P(40.7831, -73.9712, 'manhattan'),
  P(40.6782, -73.9442, 'brooklyn'),
  P(40.7128, -74.006, 'new york', 'nyc'),
  P(34.0195, -118.4912, 'santa monica'),
  P(34.0928, -118.3287, 'hollywood'),
  P(34.0522, -118.2437, 'los angeles'),
  P(37.8199, -122.4783, 'golden gate', 'golden gate bridge'),
  P(37.7749, -122.4194, 'san francisco'),
  P(49.2827, -123.1207, 'vancouver'),
  P(-22.9711, -43.1822, 'copacabana'),
  P(-22.9519, -43.2105, 'christ the redeemer', 'cristo redentor'),
  P(-22.9068, -43.1729, 'rio de janeiro', 'rio'),
  P(-34.6037, -58.3816, 'buenos aires'),
  P(-13.1631, -72.545, 'machu picchu'),
  P(-13.3333, -72.0833, 'sacred valley'),
  P(-13.532, -71.9675, 'cusco', 'cuzco'),
  P(-12.0464, -77.0428, 'lima'),
  P(-33.8915, 151.2767, 'bondi', 'bondi beach'),
  P(-33.8568, 151.2153, 'opera house', 'sydney opera house'),
  P(-33.8688, 151.2093, 'sydney'),
  P(-37.8136, 144.9631, 'melbourne'),
  P(-44.6414, 167.8972, 'milford sound', 'milford'),
  P(-45.0312, 168.6626, 'queenstown'),
  P(-36.8485, 174.7633, 'auckland')
];

/**
 * Sorted once: landmarks before generic city pins (so "The Peak, Hong Kong"
 * pins the Peak, not the city), then longer aliases first (so "dubrovnik old
 * town" beats "dubrovnik").
 */
const SORTED_ALIASES: Array<{ alias: string; entry: PlaceEntry }> = PLACE_TABLE.flatMap((entry) =>
  entry.names.map((alias) => ({ alias, entry }))
).sort((a, b) => Number(a.entry.isCity) - Number(b.entry.isCity) || b.alias.length - a.alias.length);

const geoCache = new Map<string, PlaceGeo | null>();

/** Lowercase + strip diacritics so "zürich" matches "zurich". */
const normText = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Substring match that still respects word boundaries — "gion" must NOT light
 * up inside "region" or "religion" (that bug pinned Kyoto onto unrelated trips).
 */
const indexWithBoundaries = (haystack: string, needle: string): number => {
  let idx = haystack.indexOf(needle);
  while (idx >= 0) {
    const before = idx === 0 ? '' : haystack[idx - 1];
    const after = idx + needle.length >= haystack.length ? '' : haystack[idx + needle.length];
    if (!/[a-z]/.test(before) && !/[a-z]/.test(after)) return idx;
    idx = haystack.indexOf(needle, idx + 1);
  }
  return -1;
};

/**
 * Resolve free text (an activity line, a destination, "City, Country") to
 * coordinates. Matches known place names with word boundaries; falls back to
 * any comma-separated segment that is itself a known place.
 */
export const findPlaceGeo = (text: string): PlaceGeo | null => {
  const raw = normText((text || '').trim());
  if (!raw) return null;
  const cached = geoCache.get(raw);
  if (cached !== undefined) return cached;

  let found: PlaceGeo | null = null;
  for (const { alias, entry } of SORTED_ALIASES) {
    if (indexWithBoundaries(raw, alias) >= 0) {
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

/** Airport-to-airport legs are flights by default, whatever the distance. */
const AIRPORT_LEG_RE = /\b(airport|intl airport|international airport|aeroport|flughafen|aeropuerto|aeroporto|aerodrom)\b|\([A-Z]{3}\)|\b[A-Z]{3} airport\b/i;

export const isAirportLeg = (fromLabel: string, toLabel: string): boolean =>
  AIRPORT_LEG_RE.test(fromLabel) && AIRPORT_LEG_RE.test(toLabel);

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
