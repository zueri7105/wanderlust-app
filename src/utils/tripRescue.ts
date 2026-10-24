/**
 * Trip Rescue — on-device day planner.
 *
 * Two modes:
 *  - 'rescue': the traveller fell behind (overslept, rain, a museum took longer
 *    than planned…). Given "it's now HH:MM" and "day ends HH:MM", pick the
 *    best subset of the remaining stops (must-sees are hard constraints),
 *    order them to minimise travel, and lay out an honest timeline.
 *  - 'route': keep every stop, just re-order the day so travel time and
 *    backtracking shrink.
 *
 * Everything runs locally: geocodes come from the offline gazetteer, travel
 * estimates reuse the same speed table as the leg chips. No network, no
 * waiting, and the plan works on a plane.
 */

import { ItineraryDay } from '../types/travel';
import { geoForTask } from './geocode';
import { estimateLegForMode, isAirportLeg, TravelMode } from './placeGeo';
import { haversineKm } from './units';

export type RescueMode = 'rescue' | 'route';

export type RescueLegMode = Exclude<TravelMode, 'flight'>;

export interface RescueStop {
  label: string;
  slotKey: 'morningActivity' | 'afternoonActivity' | 'eveningActivity';
  lat?: number;
  lng?: number;
  category: RescueCategory;
  /** 1 = nice-to-have, 2 = must-see (hard constraint in rescue mode). */
  importance: 1 | 2;
  durationMin: number;
}

export type RescueCategory = 'sights' | 'food' | 'lodging' | 'transport' | 'other';

export const RESCUE_CATEGORIES: RescueCategory[] = ['sights', 'food', 'lodging', 'transport', 'other'];

/** Rough dwell time per category — enough to plan a day without asking. */
export const CATEGORY_MINUTES: Record<RescueCategory, number> = {
  sights: 90,
  food: 60,
  other: 45,
  lodging: 40,
  transport: 35
};

export const categoryOf = (label: string): RescueCategory => {
  const t = label.toLowerCase();
  if (/(flight|airport|fly to|train|rail|metro|subway|shinkansen|bus|taxi|ferry|drive to|transfer|station|harbor|port)\b/.test(t))
    return 'transport';
  if (/(hotel|check[- ]?in|hostel|ryokan|airbnb|resort|lodge|stay at|guesthouse|inn)\b/.test(t))
    return 'lodging';
  if (/(breakfast|lunch|dinner|brunch|café|cafe|coffee|restaurant|ramen|sushi|izakaya|food|eat at|street food|night market|tea house|bakery|market|bar)\b/.test(t))
    return 'food';
  if (/(shopping|shop|souvenir|free time|rest|relax|laundry|packing|pack)\b/.test(t)) return 'other';
  return 'sights';
};

/** Preferred start-of-stop hour for each slot — used as a soft nudge only. */
const SLOT_PREF_HOUR: Record<RescueStop['slotKey'], number> = {
  morningActivity: 10,
  afternoonActivity: 14,
  eveningActivity: 19
};

const SLOT_MINUTES: Record<RescueStop['slotKey'], number> = {
  morningActivity: SLOT_PREF_HOUR.morningActivity * 60,
  afternoonActivity: SLOT_PREF_HOUR.afternoonActivity * 60,
  eveningActivity: SLOT_PREF_HOUR.eveningActivity * 60
};

const splitTasks = (text: string): string[] =>
  (text || '')
    .split(/[\n\r]+|[·•;]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

const SLOT_KEYS: Array<RescueStop['slotKey']> = ['morningActivity', 'afternoonActivity', 'eveningActivity'];

/** Flatten a day's three slots into stops, mirroring the journey board. */
export const rescueStopsOf = (day: ItineraryDay, context = ''): RescueStop[] => {
  const out: RescueStop[] = [];
  SLOT_KEYS.forEach((slotKey) => {
    splitTasks(day[slotKey]).forEach((task) => {
      const override = day.locationOverrides?.[task]?.trim();
      const geo = (override ? geoForTask(override, context) : null) || geoForTask(task, context);
      const category = categoryOf(task);
      out.push({
        label: task,
        slotKey,
        lat: geo?.lat,
        lng: geo?.lng,
        category,
        importance: 1,
        durationMin: CATEGORY_MINUTES[category]
      });
    });
  });
  return out;
};

/** Minutes to get from one stop to the next; 15-min guess when un-geocoded. */
export const legMinutesBetween = (
  from: { label: string; lat?: number; lng?: number } | null,
  to: { label: string; lat?: number; lng?: number },
  mode: RescueLegMode
): number => {
  if (from && isAirportLeg(from.label, to.label))
    return estimateLegForMode(
      from.lat != null && from.lng != null && to.lat != null && to.lng != null
        ? haversineKm(from.lat, from.lng, to.lat, to.lng)
        : 30,
      'flight'
    );
  if (
    from != null &&
    from.lat != null &&
    from.lng != null &&
    to.lat != null &&
    to.lng != null
  ) {
    return estimateLegForMode(haversineKm(from.lat, from.lng, to.lat, to.lng), mode);
  }
  return from == null ? 20 : 15; // getting underway / unknown spacing
};

/** How much a stop is worth keeping — must-sees dominate, sights beat errands. */
const stopValue = (s: RescueStop): number =>
  s.importance * 30 +
  (s.category === 'sights' ? 12 : s.category === 'food' ? 8 : 4) +
  Math.min(s.durationMin, 120) * 0.05;

/** Total busy minutes (dwell + travel) for a sequence starting at startMin. */
const busyOf = (seq: RescueStop[], mode: RescueLegMode, startMin: number): number => {
  let t = startMin;
  let prev: RescueStop | null = null;
  for (const s of seq) {
    t += legMinutesBetween(prev, s, mode);
    t += s.durationMin;
    prev = s;
  }
  return t - startMin;
};

/**
 * Cheapest way to insert `stop` into `seq`; returns the delta in busy minutes
 * and the best position. A stop placed far outside its preferred slot window
 * pays a soft 15-minute penalty so the day still "feels" like the original.
 */
const bestInsertion = (
  seq: RescueStop[],
  stop: RescueStop,
  mode: RescueLegMode,
  startMin: number
): { idx: number; delta: number } => {
  let best = { idx: 0, delta: Infinity };
  for (let i = 0; i <= seq.length; i++) {
    const prev = i === 0 ? null : seq[i - 1];
    const next = i === seq.length ? null : seq[i];
    const removed = prev && next ? legMinutesBetween(prev, next, mode) : 0;
    const added =
      (prev ? legMinutesBetween(prev, stop, mode) : legMinutesBetween(null, stop, mode)) +
      (next ? legMinutesBetween(stop, next, mode) : 0);
    // what time would this stop actually start at?
    let t = startMin;
    for (let j = 0; j < i; j++) {
      t += legMinutesBetween(j === 0 ? null : seq[j - 1], seq[j], mode) + seq[j].durationMin;
    }
    t += prev ? legMinutesBetween(prev, stop, mode) : legMinutesBetween(null, stop, mode);
    const hour = t / 60;
    const pref = SLOT_PREF_HOUR[stop.slotKey];
    const windowPenalty = Math.abs(hour - pref) > 3 ? 15 : 0;
    const delta = added - removed + windowPenalty;
    if (delta < best.delta) best = { idx: i, delta };
  }
  return best;
};

/** 2-opt polish: repeatedly drop the worst edge crossing while it pays off. */
const twoOpt = (seq: RescueStop[], mode: RescueLegMode, startMin: number): RescueStop[] => {
  const n = seq.length;
  if (n < 3) return seq.slice();
  const cost = (a: RescueStop | null, b: RescueStop) => legMinutesBetween(a, b, mode);
  let best = seq.slice();
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 12) {
    improved = false;
    for (let i = 0; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const cand = best.slice(0, i).concat(best.slice(i, k + 1).reverse(), best.slice(k + 1));
        if (busyOf(cand, mode, startMin) < busyOf(best, mode, startMin)) {
          best = cand;
          improved = true;
        }
      }
    }
  }
  return best;
};

export interface PlannedStop extends RescueStop {
  /** Minutes from midnight when the stop starts. */
  startMin: number;
  /** Travel minutes from the previous stop (null for the first). */
  legInMin: number;
  legKm: number | null;
}

export interface RescuePlan {
  planned: PlannedStop[];
  dropped: RescueStop[];
  /** Total busy minutes (dwell + travel) from day start to last stop. */
  totalMin: number;
  travelMin: number;
  /** False when even the must-sees can't fit — user decides what to drop. */
  feasible: boolean;
  /** Travel minutes of the ORIGINAL order, for the route-mode "you save" line. */
  originalTravelMin: number;
}

const travelOf = (seq: RescueStop[], mode: RescueLegMode, startMin: number): number => {
  let t = 0;
  let prev: RescueStop | null = null;
  for (const s of seq) {
    t += legMinutesBetween(prev, s, mode);
    prev = s;
  }
  return t;
};

export interface RescueOptions {
  mode: RescueMode;
  /** Rescue only: minutes-from-midnight "it is now". */
  startMin: number;
  /** Rescue only: minutes-from-midnight when the day ends. */
  endMin: number;
  legMode: RescueLegMode;
}

export const planRescue = (stops: RescueStop[], opts: RescueOptions): RescuePlan => {
  const originalTravelMin = travelOf(stops, opts.legMode, opts.startMin);
  if (stops.length === 0) {
    return { planned: [], dropped: [], totalMin: 0, travelMin: 0, feasible: true, originalTravelMin };
  }

  // Route mode: keep everything, minimise travel.
  if (opts.mode === 'route') {
    const ordered = twoOpt(stops, opts.legMode, 9 * 60);
    return timeline(ordered, [], 9 * 60, opts, true, originalTravelMin);
  }

  // Rescue mode: must-sees form the spine, greedy insertion fills the rest.
  const musts = stops.filter((s) => s.importance === 2);
  const rest = stops.filter((s) => s.importance !== 2);
  const budget = Math.max(0, opts.endMin - opts.startMin);

  let spine: RescueStop[] = musts.slice().sort((a, b) => SLOT_MINUTES[a.slotKey] - SLOT_MINUTES[b.slotKey]);
  let feasible = busyOf(spine, opts.legMode, opts.startMin) <= budget;
  if (!feasible) {
    // try the travel-first arrangement before giving up
    const alt = twoOpt(spine, opts.legMode, opts.startMin);
    if (busyOf(alt, opts.legMode, opts.startMin) <= budget) {
      spine = alt;
      feasible = true;
    }
  }

  if (feasible) {
    // Greedy: keep inserting the stop with the best value-per-extra-minute.
    const pool = rest.slice();
    for (;;) {
      let pick: { poolIdx: number; pos: number; gain: number } | null = null;
      for (let poolIdx = 0; poolIdx < pool.length; poolIdx++) {
        const stop = pool[poolIdx];
        const { idx: pos, delta } = bestInsertion(spine, stop, opts.legMode, opts.startMin);
        const gain = stopValue(stop) - 0.45 * delta;
        if (busyOf(spine, opts.legMode, opts.startMin) + delta <= budget && gain > 0 && (!pick || gain > pick.gain)) {
          pick = { poolIdx, pos, gain };
        }
      }
      if (!pick) break;
      spine.splice(pick.pos, 0, pool[pick.poolIdx]);
      pool.splice(pick.poolIdx, 1);
    }
    spine = twoOpt(spine, opts.legMode, opts.startMin);
  }

  return timeline(spine, stops.filter((s) => !spine.includes(s)), opts.startMin, opts, feasible, originalTravelMin);
};

const timeline = (
  seq: RescueStop[],
  dropped: RescueStop[],
  startMin: number,
  opts: RescueOptions,
  feasible: boolean,
  originalTravelMin: number
): RescuePlan => {
  const planned: PlannedStop[] = [];
  let t = startMin;
  let prev: RescueStop | null = null;
  let travelMin = 0;
  for (const s of seq) {
    const legIn = legMinutesBetween(prev, s, opts.legMode);
    travelMin += legIn;
    t += legIn;
    let legKm: number | null = null;
    if (prev && prev.lat != null && prev.lng != null && s.lat != null && s.lng != null)
      legKm = haversineKm(prev.lat, prev.lng, s.lat, s.lng);
    planned.push({ ...s, startMin: t, legInMin: legIn, legKm });
    t += s.durationMin;
    prev = s;
  }
  return {
    planned,
    dropped,
    totalMin: t - startMin,
    travelMin,
    feasible,
    originalTravelMin
  };
};

/** Which slot a planned start time belongs to — used when applying a plan. */
export const slotForStart = (startMin: number): RescueStop['slotKey'] =>
  startMin < 12 * 60 ? 'morningActivity' : startMin < 17 * 60 ? 'afternoonActivity' : 'eveningActivity';

/** Format minutes-from-midnight as '9:05 AM'. */
export const fmtTime = (min: number): string => {
  const h24 = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
};
