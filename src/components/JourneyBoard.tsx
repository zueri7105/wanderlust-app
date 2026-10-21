import React, { useMemo, useRef, useState } from 'react';
import {
  Footprints,
  TramFront,
  Car,
  Ship,
  Plane,
  Plus,
  Pencil,
  Route as RouteIcon,
  ImagePlus,
  X,
  Check
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
import {
  loadChecklistItems,
  saveChecklistItems,
  checkKeyFor,
  loadChecked,
  toggleChecked
} from '../utils/checklistStore';

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

/** Photo with a graceful gradient fallback when the photo service hiccups. */
const SmartImage: React.FC<{
  src: string;
  color: string;
  className: string;
  iconCls?: string;
}> = ({ src, color, className, iconCls = 'w-6 h-6' }) => {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`${className} overflow-hidden flex items-center justify-center`}
      style={{ background: `linear-gradient(135deg, ${color}40, ${color}14)` }}
    >
      {failed ? (
        <Footprints className={iconCls} aria-hidden style={{ color }} />
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      )}
    </span>
  );
};

/** Downscale an uploaded photo so data URLs stay localStorage-friendly. */
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 800;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(String(reader.result));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

interface JourneyBoardProps {
  itinerary: TravelItinerary;
  onUpdateItinerary?: (itinerary: TravelItinerary) => void;
  onEditTrip: () => void;
}

/**
 * Day-by-day journey board. The route map is ALWAYS on top and follows the
 * selected day; below it: editable note + checklist (overview) or a per-day
 * hero photo, editable heading, stops with legs, notes & photos (day view).
 */
export const JourneyBoard: React.FC<JourneyBoardProps> = ({
  itinerary,
  onUpdateItinerary,
  onEditTrip
}) => {
  const [activeDay, setActiveDay] = useState(0); // 0 = Overview, else 1-based day number
  const [draft, setDraft] = useState('');
  const [draftSlot, setDraftSlot] = useState<(typeof SLOT_KEYS)[number]['key']>('afternoonActivity');

  // Overview note — tap the box and pen straight away; saves on blur
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  // Checklist (shared store with the trips list)
  const [checklistVer, setChecklistVer] = useState(0);
  const [itemDraft, setItemDraft] = useState('');
  const checklist = useMemo(
    () => loadChecklistItems(itinerary.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itinerary.id, checklistVer]
  );
  const checked = useMemo(() => loadChecked(), [checklistVer]);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const updateDay = (dayNumber: number, patch: Partial<ItineraryDay>) => {
    onUpdateItinerary?.({
      ...itinerary,
      days: itinerary.days.map((d) => (d.dayNumber === dayNumber ? { ...d, ...patch } : d))
    });
  };

  const addStop = () => {
    const label = draft.trim();
    if (!label || !onUpdateItinerary || !day) return;
    updateDay(day.dayNumber, {
      [draftSlot]: day[draftSlot] ? `${day[draftSlot]} · ${label}` : label
    } as Partial<ItineraryDay>);
    setDraft('');
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files || !day) return;
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 6)) {
      try {
        urls.push(await fileToDataUrl(f));
      } catch {
        /* skip unreadable files */
      }
    }
    if (urls.length) updateDay(day.dayNumber, { photos: [...(day.photos || []), ...urls] });
  };

  const pillCls = (active: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
      active
        ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 border-stone-950 dark:border-violet-400 shadow-md'
        : 'bg-white dark:bg-slate-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-600'
    }`;

  const dayColor = day ? dayRouteColor(day.dayNumber) : '#8b5cf6';

  return (
    <div className="space-y-4 min-w-0">
      {/* Horizontal date tab bar — Overview + one pill per day (owns the map too) */}
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

      {/* The route map is always here — it follows the selected day and every
          stop the traveller types appears on it immediately. */}
      <TripRouteMap
        itinerary={itinerary}
        onUpdateItinerary={onUpdateItinerary}
        activeDay={activeDay}
        onActiveDayChange={setActiveDay}
        hideDayTabs
      />

      {activeDay === 0 || !day ? (
        /* ── Overview: note you pen inline + checklist with strike-through ── */
        <div className="space-y-4">
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

          {/* Trip note — no edit button: tap the box and write */}
          <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4">
            <textarea
              value={noteDraft ?? itinerary.notes ?? ''}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() => {
                if (noteDraft !== null && noteDraft !== itinerary.notes) {
                  onUpdateItinerary?.({ ...itinerary, notes: noteDraft });
                }
                setNoteDraft(null);
              }}
              placeholder={getTranslation('jdNotePh')}
              rows={Math.max(2, (noteDraft ?? itinerary.notes ?? '').split('\n').length)}
              className="w-full bg-transparent text-xs text-amber-900 dark:text-amber-200 placeholder:text-amber-700/50 dark:placeholder:text-amber-300/40 leading-relaxed resize-none focus:outline-none"
            />
          </div>

          {/* Checklist — add your own, tap to strike through when done */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 p-4 space-y-2.5">
            <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
              {getTranslation('checklistNotes')}
            </div>
            {checklist.map((item, idx) => {
              const key = checkKeyFor(itinerary.id, item, idx);
              const done = !!checked[key];
              return (
                <div key={key} className="flex items-center gap-2.5 group">
                  <button
                    type="button"
                    onClick={() => {
                      toggleChecked(key);
                      setChecklistVer((v) => v + 1);
                    }}
                    className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-stone-300 dark:border-stone-600 hover:border-emerald-400'
                    }`}
                    aria-pressed={done}
                  >
                    {done && <Check className="w-3 h-3" />}
                  </button>
                  <span
                    onClick={() => {
                      toggleChecked(key);
                      setChecklistVer((v) => v + 1);
                    }}
                    className={`flex-1 text-xs cursor-pointer select-none ${
                      done
                        ? 'line-through text-stone-400 dark:text-stone-500'
                        : 'text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    {item}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      saveChecklistItems(itinerary.id, checklist.filter((_, i) => i !== idx));
                      setChecklistVer((v) => v + 1);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-opacity cursor-pointer"
                    aria-label="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={itemDraft}
                onChange={(e) => setItemDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && itemDraft.trim()) {
                    saveChecklistItems(itinerary.id, [...checklist, itemDraft.trim()]);
                    setItemDraft('');
                    setChecklistVer((v) => v + 1);
                  }
                }}
                placeholder={getTranslation('jdItemPh')}
                className="flex-1 min-w-0 px-3.5 py-2 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (!itemDraft.trim()) return;
                  saveChecklistItems(itinerary.id, [...checklist, itemDraft.trim()]);
                  setItemDraft('');
                  setChecklistVer((v) => v + 1);
                }}
                className="w-9 h-9 rounded-xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center hover:scale-105 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day summary chips — tap to jump into that day */}
          <div className="grid gap-2 sm:grid-cols-2">
            {itinerary.days.map((d, i) => {
              const dayStops = stopsOf(d);
              return (
                <button
                  key={d.dayNumber}
                  type="button"
                  onClick={() => setActiveDay(d.dayNumber)}
                  className="flex items-center gap-3 p-3 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all cursor-pointer min-w-0"
                >
                  <span
                    className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: dayRouteColor(d.dayNumber) }}
                  >
                    {d.dayNumber}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                      {d.title || tv('dayN', { n: d.dayNumber })}
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
        /* ── Single day: hero photo, editable heading, stops, notes & photos ── */
        <div className="space-y-3 min-w-0">
          {/* Hero photo — auto-generated from the day's own places */}
          <div className="relative">
            <SmartImage
              src={activityImageUrl(
                stops[0]?.label || itinerary.destination,
                itinerary.destination,
                'card'
              )}
              color={dayColor}
              className="w-full h-36 sm:h-44 rounded-2xl"
              iconCls="w-8 h-8"
            />
            <span
              className="absolute top-3 left-3 w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-lg"
              style={{ backgroundColor: dayColor }}
            >
              {day.dayNumber}
            </span>
            <button
              type="button"
              onClick={onEditTrip}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-stone-700 dark:text-stone-200 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{getTranslation('editTrip')}</span>
            </button>
          </div>

          {/* Heading — straight-away editable, no edit button needed */}
          <div className="flex items-baseline gap-2 min-w-0">
            <input
              type="text"
              value={day.title}
              onChange={(e) => updateDay(day.dayNumber, { title: e.target.value })}
              placeholder={getTranslation('jdTitlePh')}
              className="flex-1 min-w-0 bg-transparent font-display text-lg font-bold text-stone-950 dark:text-stone-50 placeholder:text-stone-400/70 placeholder:font-medium border-b border-dashed border-transparent hover:border-stone-300 dark:hover:border-stone-600 focus:border-violet-400 focus:outline-none transition-colors pb-0.5 truncate"
            />
            <span className="text-[11px] font-medium text-stone-400 shrink-0">
              {dayDate(day.dayNumber - 1)} · {tv('jdStops', { n: stops.length })}
              {dayKm > 0 && ` · ≈${dayKm.toFixed(1)} km`}
            </span>
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
                    style={{ backgroundColor: dayColor }}
                  >
                    {idx + 1}
                  </span>
                  <SmartImage
                    src={activityImageUrl(stop.label, itinerary.destination, 'thumb')}
                    color={dayColor}
                    className="w-14 h-14 rounded-xl shrink-0"
                    iconCls="w-5 h-5"
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
          <div className="pt-1">
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

          {/* Day note — pen anything; add photos from the day */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 p-4 space-y-3">
            <textarea
              value={day.note ?? ''}
              onChange={(e) => updateDay(day.dayNumber, { note: e.target.value })}
              placeholder={getTranslation('jdDayNotePh')}
              rows={Math.max(2, (day.note ?? '').split('\n').length)}
              className="w-full bg-transparent text-xs text-stone-700 dark:text-stone-200 placeholder:text-stone-400 leading-relaxed resize-none focus:outline-none"
            />
            {(day.photos || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(day.photos || []).map((url, i) => (
                  <span key={i} className="relative group">
                    <img
                      src={url}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover border border-stone-200 dark:border-stone-700"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateDay(day.dayNumber, {
                          photos: (day.photos || []).filter((_, j) => j !== i)
                        })
                      }
                      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 w-[18px] h-[18px] rounded-full bg-stone-900 text-white items-center justify-center hidden group-hover:flex"
                      aria-label="Remove photo"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>{getTranslation('jdAddPhoto')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyBoard;
