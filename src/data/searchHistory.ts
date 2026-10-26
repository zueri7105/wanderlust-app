/**
 * Destination search history — records what the user searches on WanderLust so
 * "Popular" / "Quick" picks can show THEIR top searches, falling back to the
 * world's top searches when there is no history yet.
 */

const KEY = 'wanderlust_search_history';

interface SearchRecord {
  dest: string;
  count: number;
  last: number;
}

function readAll(): SearchRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Record a destination search (call whenever the user executes a search). */
export function recordSearch(dest: string): void {
  const d = dest.trim();
  if (!d) return;
  const all = readAll();
  const key = d.toLowerCase();
  const existing = all.find((r) => r.dest.toLowerCase() === key);
  if (existing) {
    existing.count += 1;
    existing.last = Date.now();
    existing.dest = d; // keep latest casing
  } else {
    all.push({ dest: d, count: 1, last: Date.now() });
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(all.slice(-60)));
  } catch {
    /* storage full — ignore */
  }
}

/** The world's most-searched travel destinations (used as fallback). */
export const WORLD_TOP_SEARCHES = [
  'Bangkok, Thailand',
  'Tokyo, Japan',
  'Paris, France',
  'London, United Kingdom',
  'Barcelona, Spain',
  'Rome, Italy',
  'Bali, Indonesia',
  'Dubai, United Arab Emirates'
];

/**
 * The user's top N most-searched destinations. When fewer than `minFallback`
 * searches exist, world top searches fill the remaining slots.
 */
export function getTopSearches(n = 5): string[] {
  const mine = readAll()
    .sort((a, b) => b.count - a.count || b.last - a.last)
    .map((r) => r.dest);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const d of mine) {
    const k = d.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(d);
    if (out.length >= n) return out;
  }
  for (const d of WORLD_TOP_SEARCHES) {
    const k = d.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(d);
    if (out.length >= n) break;
  }
  return out;
}
