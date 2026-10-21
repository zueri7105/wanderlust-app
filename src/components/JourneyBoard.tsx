import React, { useMemo, useState } from 'react';
import {
  Footprints,
  TramFront,
  Car,
  Ship,
  Plane,
  Plus,
  Pencil,
  NotebookPen,
  Route as RouteIcon
} from 'lucide-react';
import { TravelItinerary, ItineraryDay } from '../types/travel';
import { TripRouteMap } from './TripRouteMap';
import {
  findPlaceGeo,
  estimateLeg,
  estimateLegForMode,
  dayRouteColor,
  TravelMode
} from '../utils/placeGeo';
import { haversineKm } from '../utils/units';
import { activityImageUrl } from '../utils/activityImages';
import { getTranslation, tv } from '../utils/i18n';

/* ── Stop parsing (mirrors TripRouteMap, but keeps non-geocodable tasks) ──── */

const SLOT_KEYS = [
  { key: 'morningActivity' as const, labelKey: 'slotMorning' },
  { key: 'afternoonActivity' as const, labelKey: 'slotAfternoon' },
  { key: 'eveningActivity' as const, labelKey: 'slotEvening' }
];

const splitTasks = (text: string): string[] =>
  (text || '')
    .split(/[\n\r]+|[·•;]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

interface StopItem {
  label: string;
  slotLabelKey: string;
  lat?: number;
  lng?: number;
}

const stopsOf = (day: ItineraryDay): StopItem[] => {
  const out: StopItem[] = [];
  SLOT_KEYS.forEach(({ key, labelKey }) => {
    splitTasks(day[key]).forEach((task) => {
      const geo = findPlaceGeo(task);
      out.push({ label: task, slotLabelKey: labelKey, lat: geo?.lat, lng: geo?.lng });
    });
  });
  return out;
};

/* ── Category chips — keyword inference, Pi-Travel style ───────────────────── */

type StopCategory = 'transport' | 'food' | 'lodging' | 'other' | 'sights';

const categorize = (label: string): StopCategory => {
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

const CAT_META: Record<StopCategory, { key: string; cls: string }> = {
  transport: {
    key: 'jdCatTransport',
    cls: 'text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200/80 dark:border-sky-800'
  },
  sights: {
    key: 'jdCatSights',
    cls: 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800'
  },
  food: {
    key: 'jdCatFood',
    cls: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800'
  },
  lodging: {
    key: 'jdCatLodging',
    cls: 'text-violet-800 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border-violet-200/80 dark:border-violet-800'
  },
  other: {
    key: 'jdCatOther',
    cls: 'text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/70 border-stone-200 dark:border-stone-700'
  }
};

const modeIcon = (mode: string) => {
  switch (mode) {
    case 'walk':
      return Footprints;
    case 'transit':
    case 'bus':
    case 'train':
      return TramFront;
    case 'ferry':
      return Ship;
    case 'flight':
      return Plane;
    default:
      return Car;
  }
};

/** Stop photo with a graceful fallback tile when the photo service hiccups. */
const StopThumb: React.FC<{ label: string; destination: string; color: string }> = ({
  label,
  destination,
  color
}) => {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className="w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${color}33, ${color}11)` }}
    >
      {failed ? (
        <Footprints className="w-5 h-5" aria-hidden style={{ color }} />
      ) : (
        <img
          src={activityImageUrl(label, destination, 'thumb')}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover bg-stone-100 dark:bg-stone-800"
        />
      )}
    </span>
  );
};

interface JourneyBoardProps {
  itinerary: TravelItinerary;
  onUpdateItinerary?: (itinerary: TravelItinerary) => void;
  onEditTrip: () => void;
}

/**
 * Day-by-day journey board — horizontal date tabs (Overview + each day),
 * numbered stop cards with photos & category chips, and leg separators with
 * distance/time estimates. Overview keeps the WanderLust route map.
 */
export const JourneyBoard: React.FC<JourneyBoardProps> = ({
  itinerary,
  onUpdateItinerary,
  onEditTrip
}) => {
  const [activeDay, setActiveDay] = useState(0); // 0 = Overview, else 1-based day number
  const [draft, setDraft] = useState('');
  const [draftSlot, setDraftSlot] = useState<(typeof SLOT_KEYS)[number]['key']>('afternoonActivity');

  const dayDate = (idx: number): string => {
    const d = new Date(itinerary.startDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + idx);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const day: ItineraryDay | null =
    activeDay >= 1 && activeDay <= itinerary.days.length ? itinerary.days[activeDay - 1] : null;

  const stops = useMemo(() => (day ? stopsOf(day) : []), [day]);

  const dayLegs = useMemo(() => {
    if (!day) return [];
    return stops.slice(1).map((to, i) => {
      const from = stops[i];
      if (from.lat == null || to.lat == null || from.lng == null || to.lng == null) return null;
      const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
      const chosen = day.legModes?.[`${from.label}→${to.label}`] as TravelMode | undefined;
      const est = chosen
        ? { km, minutes: estimateLegForMode(km, chosen), mode: chosen }
        : estimateLeg(km);
      return { from: from.label, to: to.label, ...est };
    });
  }, [day, stops]);

  const dayKm = dayLegs.reduce((n, l) => n + (l?.km || 0), 0);

  const totalStops = useMemo(
    () => itinerary.days.reduce((n, d) => n + stopsOf(d).length, 0),
    [itinerary.days]
  );

  const addStop = () => {
    const label = draft.trim();
    if (!label || !onUpdateItinerary || !day) return;
    onUpdateItinerary({
      ...itinerary,
      days: itinerary.days.map((d) =>
        d.dayNumber === day.dayNumber
          ? { ...d, [draftSlot]: d[draftSlot] ? `${d[draftSlot]} · ${label}` : label }
          : d
      )
    });
    setDraft('');
  };

  const pillCls = (active: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
      active
        ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 border-stone-950 dark:border-violet-400 shadow-md'
        : 'bg-white dark:bg-slate-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-600'
    }`;

  return (
    <div className="space-y-4">
      {/* Horizontal date tab bar — Overview + one pill per day */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button type="button" onClick={() => setActiveDay(0)} className={pillCls(activeDay === 0)}>
          <RouteIcon className="w-3.5 h-3.5" />
          <span>{getTranslation('overview')}</span>
        </button>
        {itinerary.days.map((d, i) => (
          <button
            key={d.dayNumber}
            type="button"
            onClick={() => setActiveDay(d.dayNumber)}
            className={pillCls(activeDay === d.dayNumber)}
          >
            <span>{tv('dayN', { n: d.dayNumber })}</span>
            <span className={activeDay === d.dayNumber ? 'opacity-70' : 'text-stone-400'}>
              {dayDate(i)}
            </span>
          </button>
        ))}
      </div>

      {activeDay === 0 || !day ? (
        /* ── Overview: our route map + trip notes + day summary chips ── */
        <div className="space-y-4">
          <TripRouteMap itinerary={itinerary} onUpdateItinerary={onUpdateItinerary} />

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
              {tv('daysCount', { n: itinerary.days.length })}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              {tv('jdStops', { n: totalStops })}
            </span>
            <button
              type="button"
              onClick={onEditTrip}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:scale-[1.03] transition-all cursor-pointer shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{getTranslation('editTrip')}</span>
            </button>
          </div>

          {itinerary.notes && (
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 rounded-2xl flex gap-3">
              <NotebookPen className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                {itinerary.notes}
              </p>
            </div>
          )}

          {/* Day summary chips — tap to jump into that day */}
          <div className="grid gap-2 sm:grid-cols-2">
            {itinerary.days.map((d, i) => {
              const dayStops = stopsOf(d);
              return (
                <button
                  key={d.dayNumber}
                  type="button"
                  onClick={() => setActiveDay(d.dayNumber)}
                  className="flex items-center gap-3 p-3 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all cursor-pointer"
                >
                  <span
                    className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: dayRouteColor(d.dayNumber) }}
                  >
                    {d.dayNumber}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                      {tv('dayN', { n: d.dayNumber })}
                      <span className="ml-1.5 font-medium text-stone-400">{dayDate(i)}</span>
                    </span>
                    <span className="block text-[11px] text-stone-500 dark:text-stone-400 truncate">
                      {dayStops.length
                        ? dayStops.map((s) => s.label).join(' → ')
                        : getTranslation('jdEmptyDay')}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Single day: numbered stops with legs, notes & quick add ── */
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 pb-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-md"
                style={{ backgroundColor: dayRouteColor(day.dayNumber) }}
              >
                {day.dayNumber}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-display font-bold text-stone-950 dark:text-stone-50 truncate">
                  {tv('dayN', { n: day.dayNumber })}
                  <span className="ml-2 text-xs font-medium text-stone-400">
                    {dayDate(day.dayNumber - 1)}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  {tv('jdStops', { n: stops.length })}
                  {dayKm > 0 && ` · ≈${dayKm.toFixed(1)} km`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onEditTrip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{getTranslation('editTrip')}</span>
            </button>
          </div>

          {stops.length === 0 && (
            <div className="p-6 text-center text-xs text-stone-500 dark:text-stone-400 bg-white dark:bg-slate-900 border border-dashed border-stone-300 dark:border-stone-700 rounded-2xl">
              {getTranslation('jdEmptyDay')}
            </div>
          )}

          {stops.map((stop, idx) => {
            const cat = categorize(stop.label);
            const meta = CAT_META[cat];
            const leg = idx > 0 ? dayLegs[idx - 1] : null;
            const LegIcon = leg ? modeIcon(leg.mode) : null;
            return (
              <React.Fragment key={`${idx}_${stop.label}`}>
                {idx > 0 && (
                  <div className="flex items-center gap-2 pl-4 py-1">
                    <span className="w-px h-4 border-l-2 border-dotted border-stone-300 dark:border-stone-600 ml-[15px]" />
                    {leg && LegIcon && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400 bg-stone-100/80 dark:bg-stone-800/60 px-2 py-0.5 rounded-full">
                        <LegIcon className="w-3 h-3" />
                        {tv('jdLeg', { km: leg.km.toFixed(1), min: leg.minutes })}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-sm transition-shadow">
                  <span
                    className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: dayRouteColor(day.dayNumber) }}
                  >
                    {idx + 1}
                  </span>
                  <StopThumb
                    label={stop.label}
                    destination={itinerary.destination}
                    color={dayRouteColor(day.dayNumber)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                      {stop.label}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${meta.cls}`}
                      >
                        {getTranslation(meta.key)}
                      </span>
                      <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 px-2 py-0.5 rounded">
                        {getTranslation(stop.slotLabelKey)}
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* Quick add stop — appended to the chosen slot of this day */}
          <div className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addStop();
                }}
                placeholder={getTranslation('jdAddStopPh')}
                className="flex-1 min-w-0 px-4 py-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={addStop}
                disabled={!draft.trim()}
                className="w-10 h-10 rounded-2xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-md shrink-0 disabled:opacity-40 disabled:hover:scale-100"
                title={getTranslation('jdAddStop')}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1.5 mt-2">
              {SLOT_KEYS.map(({ key, labelKey }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraftSlot(key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    draftSlot === key
                      ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 border-stone-950 dark:border-violet-400'
                      : 'text-stone-500 dark:text-stone-400 bg-transparent border-stone-200 dark:border-stone-700 hover:border-violet-300'
                  }`}
                >
                  {getTranslation(labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyBoard;
