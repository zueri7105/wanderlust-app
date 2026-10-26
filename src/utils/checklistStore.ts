/** Shared per-trip checklist store — same localStorage keys ItineraryView uses,
 *  so items and strike-throughs stay in sync across views. */

export const DEFAULT_PACKING_ITEMS = [
  'Pocket WiFi / eSIM (stay connected everywhere)',
  'Power bank (10,000mAh+ for full-day exploring)'
];

const ITEMS_KEY = 'wanderlust_custom_checklists';
const CHECKED_KEY = 'wanderlust_checked_packing';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const loadChecklistItems = (itinId: string): string[] => {
  const map = read<Record<string, string[]>>(ITEMS_KEY, {});
  return map[itinId] || DEFAULT_PACKING_ITEMS;
};

export const saveChecklistItems = (itinId: string, items: string[]) => {
  const map = read<Record<string, string[]>>(ITEMS_KEY, {});
  map[itinId] = items;
  localStorage.setItem(ITEMS_KEY, JSON.stringify(map));
};

export const checkKeyFor = (itinId: string, item: string, idx: number) =>
  `${itinId}_pack_${item}_${idx}`;

export const loadChecked = (): Record<string, boolean> => read(CHECKED_KEY, {});

export const toggleChecked = (key: string): Record<string, boolean> => {
  const map = read<Record<string, boolean>>(CHECKED_KEY, {});
  map[key] = !map[key];
  localStorage.setItem(CHECKED_KEY, JSON.stringify(map));
  return map;
};
