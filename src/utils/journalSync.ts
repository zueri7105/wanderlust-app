/**
 * journalSync — keeps My Journal (memories, map droplets, country colouring)
 * in step with My Trips. Creating a trip pins a corresponding memory onto the
 * journal timeline & map; editing the trip refreshes the memory's derived
 * fields (place, date, status); deleting the trip removes the memory.
 * Notes, photos and companions the user edited on the memory are preserved.
 *
 * Storage is the same `wanderlust_travel_memories` localStorage key the
 * journal view reads on mount — Trips and Journal never render at the same
 * time, so a write here is always picked up on the next Journal visit.
 */

import { TravelItinerary, TravelMemory } from '../types/travel';
import { findPlaceGeo } from './placeGeo';
import { activityImageUrl } from './activityImages';

const STORAGE_KEY = 'wanderlust_travel_memories';

const memIdFor = (itineraryId: string) => `mem_itin_${itineraryId}`;

const readMemories = (): TravelMemory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeMemories = (memories: TravelMemory[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
};

/** Trip dates → journal status, same rule as the journal's auto-fill. */
export const statusForItinerary = (it: TravelItinerary): TravelMemory['status'] => {
  const today = new Date();
  const start = new Date(it.startDate);
  const end = new Date(it.endDate);
  if (end < today) return 'Visited';
  if (start <= today) return 'Current Location';
  return 'Dream Next';
};

/** "Day 1 — Title: morning · afternoon · evening" lines for the journal note. */
const dayLinesFor = (it: TravelItinerary): string[] =>
  (it.days || []).map((d) => {
    const parts = [d.morningActivity, d.afternoonActivity, d.eveningActivity].filter(Boolean);
    return `Day ${d.dayNumber}${d.title ? ` — ${d.title}` : ''}: ${parts.join(' · ')}`;
  });

/** Build the journal memory for a trip (used on create; edits merge instead). */
const memoryFromItinerary = (it: TravelItinerary): TravelMemory => {
  const city = it.cities?.[0] || it.destination.split(',')[0].trim();
  const country = (it.country || it.destination.split(',').slice(-1)[0] || '').trim();
  const geo = findPlaceGeo(city) || findPlaceGeo(it.destination) || findPlaceGeo(country);
  const start = new Date(it.startDate);
  const firstActivity =
    it.days?.[0]?.morningActivity || it.days?.[0]?.afternoonActivity || it.days?.[0]?.eveningActivity || '';
  const dayLines = dayLinesFor(it);

  return {
    id: memIdFor(it.id),
    destination: city,
    country,
    coordinates: geo
      ? { x: 0, y: 0, lat: geo.lat, lng: geo.lng }
      : { x: 0, y: 0, lat: 20, lng: 0 },
    date: start.toLocaleString('default', { month: 'long', year: 'numeric' }),
    photos: [activityImageUrl(firstActivity || city, city, 'card')],
    memoryNote:
      `My ${it.days.length}-day ${it.tripScope || 'trip'} in ${it.destination}. ` +
      (it.notes ? `${it.notes} ` : '') +
      (dayLines.length > 0 ? `\n\n${dayLines.join('\n')}` : ''),
    companionsTagged: [],
    status: statusForItinerary(it)
  };
};

/**
 * Create or refresh the memory linked to a trip. User-touched content
 * (note, photos, tagged companions) survives trip edits — only the fields
 * derived from the trip itself (place, coordinates, date, status) update.
 */
export const upsertMemoryFromItinerary = (it: TravelItinerary) => {
  const memories = readMemories();
  const id = memIdFor(it.id);
  const idx = memories.findIndex((m) => m.id === id);
  if (idx === -1) {
    writeMemories([memoryFromItinerary(it), ...memories]);
    return;
  }
  const fresh = memoryFromItinerary(it);
  const prev = memories[idx];
  memories[idx] = {
    ...fresh,
    memoryNote: prev.memoryNote || fresh.memoryNote,
    photos: Array.isArray(prev.photos) && prev.photos.length > 0 ? prev.photos : fresh.photos,
    companionsTagged: prev.companionsTagged || []
  };
  writeMemories(memories);
};

/** Remove the memory linked to a trip (trip deleted). */
export const removeMemoryForItinerary = (itineraryId: string) => {
  const id = memIdFor(itineraryId);
  writeMemories(readMemories().filter((m) => m.id !== id));
};
