/* Per-trip cover pictures for the trip cards on the Trips list.
 * Chosen inside the trip (JourneyBoard overview), rendered on the card. */

const KEY = 'wanderlust_trip_covers';

const loadAll = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

export const getTripCover = (itineraryId: string): string | null =>
  loadAll()[itineraryId] || null;

export const setTripCover = (itineraryId: string, url: string | null) => {
  try {
    const all = loadAll();
    if (url) all[itineraryId] = url;
    else delete all[itineraryId];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage full / unavailable — cover just won't persist */
  }
};
