import React, { useState, useEffect, useRef } from 'react';
import { TravelItinerary, SoloTraveler, ItineraryDay, TravelGuideInfo, TripScope, SoloPersonalExpense, ExpenseItem } from '../types/travel';
import {
  CheckCircle2,
  Calendar,
  CalendarDays,
  MapPin,
  Users,
  Compass,
  Plus,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  DollarSign,
  CloudSun,
  Luggage,
  Trash2,
  CheckSquare,
  Square,
  MessageSquare,
  NotebookPen,
  X,
  Edit2,
  Check,
  Languages,
  Smartphone,
  AlertTriangle,
  Globe,
  Stamp,
  Sunrise,
  Sun,
  MoonStar,
  Pencil,
  Map as MapIcon,
  Wand2,
  Footprints,
  Bus,
  Car,
  TrainFront,
  CarTaxiFront,
  Ship,
  Plane,
  BookmarkPlus,
  ListPlus
} from 'lucide-react';
import { generateDestinationTravelGuide } from '../services/geminiService';
import { formatTemperature, haversineKm } from '../utils/units';
import { lookupCountryGuide, visaAdviceFor, tippingAdviceFor } from '../utils/countryGuides';
import { buildBasicGuide } from '../utils/guideBuilder';
import { canonicalCountrySegment, resolvePlaceCountry } from '../utils/worldGeo';
import { cardAcceptanceForCountry, tippingForCountry, countryInfoFor, countryNameFor, visaVerdictFor } from '../utils/countryInfo';
import { taxInfoFor } from '../utils/taxInfo';
import ActivityImage from './ActivityImage';
import { travelAppsFor } from '../data/travelApps';
import { emergencyNumbersFor } from '../data/emergencyNumbers';
import { getTranslation, tv } from '../utils/i18n';
import AutoGrowTextarea from './AutoGrowTextarea';
import { PlaceTypeahead } from './PlaceTypeahead';
import { TripRouteMap } from './TripRouteMap';
import { JourneyBoard } from './JourneyBoard';
import { findPlaceGeo, estimateLeg, optimizeStopOrder, suggestPlacesFor, type TravelMode } from '../utils/placeGeo';
import { getTripCover } from '../utils/tripCovers';

interface ItineraryViewProps {
  itineraries: TravelItinerary[];
  currentUser: SoloTraveler;
  soloExpenses?: SoloPersonalExpense[];
  sharedExpenses?: ExpenseItem[];
  onAddItinerary: (itinerary: TravelItinerary) => void;
  onUpdateItinerary?: (itinerary: TravelItinerary) => void;
  onDeleteItinerary?: (id: string) => void;
  onGoToCompanions?: (destination: string) => void;
  onGoToExploreTrips?: (destination: string) => void;
  onGoToActivities?: (destination: string) => void;
  onOpenChatWithCompanion?: (travelerId: string) => void;
  /** Trip detail mode: render just this trip, fully expanded (its own page) */
  detailTripId?: string;
  /** Card tap behaviour override — used on the Trips list to open the trip page */
  onOpenTripDetail?: (itinerary: TravelItinerary) => void;
}





const DAY_TIME_ROWS: Array<{
  key: 'morningActivity' | 'afternoonActivity' | 'eveningActivity';
  labelKey: string;
  Icon: typeof Sun;
  chip: string;
  dot: string;
}> = [
  {
    key: 'morningActivity',
    labelKey: 'slotMorning',
    Icon: Sunrise,
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/70 dark:border-amber-900/60',
    dot: 'bg-amber-400'
  },
  {
    key: 'afternoonActivity',
    labelKey: 'slotAfternoon',
    Icon: Sun,
    chip: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200/70 dark:border-orange-900/60',
    dot: 'bg-orange-400'
  },
  {
    key: 'eveningActivity',
    labelKey: 'slotEvening',
    Icon: MoonStar,
    chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200/70 dark:border-indigo-900/60',
    dot: 'bg-indigo-400'
  }
];

const SWIPE_DELETE_WIDTH = 88;


/** Split a morning/afternoon/evening block into individual tasks ("a · b", "a; b"). */
const splitTasks = (text: string): string[] =>
  (text || '')
    .split(/[\n\r]+|[·•;]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Transport mode meta for the "km · min" leg connector between two stops. */
const LEG_MODE_META: Record<TravelMode, { Icon: typeof Footprints; labelKey: string }> = {
  walk: { Icon: Footprints, labelKey: 'modeWalk' },
  transit: { Icon: Bus, labelKey: 'modeTransit' },
  drive: { Icon: Car, labelKey: 'modeDrive' },
  taxi: { Icon: CarTaxiFront, labelKey: 'modeTaxi' },
  train: { Icon: TrainFront, labelKey: 'modeTrain' },
  bus: { Icon: Bus, labelKey: 'modeBus' },
  ferry: { Icon: Ship, labelKey: 'modeFerry' },
  flight: { Icon: Plane, labelKey: 'modeFlight' }
};

/**
 * Pi-Travel-style leg connector: shown between two consecutive stops when both
 * resolve to real places — "2.8 km · ~9 min" with a walk/transit/drive icon.
 */
const DayLegConnector: React.FC<{ from: string; to: string }> = ({ from, to }) => {
  const a = findPlaceGeo(from);
  const b = findPlaceGeo(to);
  if (!a || !b) return null;
  const km = haversineKm(a.lat, a.lng, b.lat, b.lng);
  if (km < 0.05) return null; // same spot, no leg
  const leg = estimateLeg(km);
  const { Icon, labelKey } = LEG_MODE_META[leg.mode];
  return (
    <div className="relative pl-4 pb-2.5 flex items-center">
      <span
        aria-hidden="true"
        className="absolute left-[2.5px] top-0 bottom-0 border-l-2 border-dotted border-slate-300 dark:border-slate-600"
      />
      <span className="inline-flex items-center gap-1.5 ml-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
        <Icon className="w-3 h-3" />
        <span className="font-mono tabular-nums">
          {tv('legEstimate', { km: km < 10 ? km.toFixed(1) : Math.round(km).toString(), min: leg.minutes })}
        </span>
        <span className="text-emerald-600/80 dark:text-emerald-400/80 font-medium">
          · {getTranslation(labelKey)}
        </span>
      </span>
    </div>
  );
};

interface SwipeableDayCardProps {
  day: ItineraryDay;
  isLast: boolean;
  canDelete: boolean;
  onDelete: () => void;
  destination?: string;
  /** One-tap route optimiser (magic wand) for this day's stops */
  onOptimize?: () => void;
  optimized?: boolean;
  /** Persist edits to this day (e.g. optional per-activity clock times) */
  onUpdateDay?: (day: ItineraryDay) => void;
}


/** Auto-split typed digits into HH:MM — "9" → "9", "930" → "9:30", "0945" → "09:45". */
const formatTimeInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
};

// Timeline day card with swipe-left-to-delete (pointer-driven, works on touch + mouse)
const SwipeableDayCard: React.FC<SwipeableDayCardProps> = ({ day, canDelete, onDelete, destination = '', onOptimize, optimized, onUpdateDay }) => {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startX: number; startOffset: number; moved: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDelete) return;
    drag.current = { startX: e.clientX, startOffset: offset, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(dx) < 6) return;
    drag.current.moved = true;
    setDragging(true);
    setOffset(Math.min(0, Math.max(-SWIPE_DELETE_WIDTH, drag.current.startOffset + dx)));
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    setOffset((cur) => (cur < -SWIPE_DELETE_WIDTH / 2 ? -SWIPE_DELETE_WIDTH : 0));
  };

  // Ordered slot → tasks lists so leg connectors can span slot boundaries
  // (last activity of one slot → first activity of the next).
  const slotsWithTasks = DAY_TIME_ROWS.map((row) => ({ ...row, tasks: splitTasks(day[row.key]) }));
  const nonEmptySlots = slotsWithTasks.filter((s) => s.tasks.length > 0);
  const nextTaskAfter = (slotIdx: number, taskIdx: number): string | null => {
    const slot = nonEmptySlots[slotIdx];
    if (taskIdx < slot.tasks.length - 1) return slot.tasks[taskIdx + 1];
    const nextSlot = nonEmptySlots[slotIdx + 1];
    return nextSlot ? nextSlot.tasks[0] : null;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden group/day">
      {/* Red delete zone revealed behind the card when swiping left */}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute inset-y-0 right-0 w-[88px] bg-gradient-to-br from-red-500 to-rose-600 flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
          title="Delete this day"
        >
          <Trash2 className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Delete</span>
        </button>
      )}

      {/* Sliding card content */}
      <div
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 touch-pan-y select-none ${dragging ? '' : 'transition-all'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="p-4 sm:p-5 flex gap-4">
          {/* Timeline rail — a full-height gradient line under every day circle,
              fading as it descends. Every day gets one, including the last. */}
          <div className="relative flex flex-col items-center shrink-0 w-10 self-stretch">
            <div className="relative z-10 w-10 h-10 rounded-full bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center font-display font-extrabold text-sm shadow-md shrink-0">
              {day.dayNumber}
            </div>
            <div
              className="flex-1 w-[3px] rounded-full mt-1"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(28,25,23,0.85), rgba(120,113,108,0.4), rgba(214,211,209,0.12))'
              }}
            />
          </div>

          {/* Day body */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-display font-bold text-sm sm:text-base text-slate-950 dark:text-slate-50 leading-snug truncate">
                  {day.title}
                </h4>
                {day.date && (
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">{day.date}</span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onOptimize && (
                  <button
                    type="button"
                    onClick={onOptimize}
                    className={`inline-flex items-center gap-1 p-1.5 rounded-lg transition-all cursor-pointer ${
                      optimized
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'sm:opacity-0 sm:group-hover/day:opacity-100 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                    title={getTranslation('optimizeRouteTitle')}
                  >
                    {optimized ? <Check className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                    {optimized && (
                      <span className="text-[10px] font-bold">{getTranslation('routeOptimized')}</span>
                    )}
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="sm:opacity-0 sm:group-hover/day:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
                    title="Delete this day (or swipe left)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3.5">
              {nonEmptySlots.map(({ key, labelKey, Icon, chip, dot, tasks }, slotIdx) => {
                return (
                  <div key={key}>
                    {/* Slot label on its own row; activities stack below it so the
                        photo and text get the full card width */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${chip}`}>
                      <Icon className="w-3 h-3" />
                      <span>{getTranslation(labelKey)}</span>
                    </span>
                    {/* Dotted task list with km·min leg connectors between stops */}
                    <div className="mt-1.5">
                      {tasks.map((task, taskIdx) => {
                        const nextTask = nextTaskAfter(slotIdx, taskIdx);
                        return (
                          <React.Fragment key={taskIdx}>
                            <div className="relative pl-4 pb-2.5 flex items-start">
                              {(taskIdx < tasks.length - 1 || nextTask) && (
                                <span
                                  aria-hidden="true"
                                  className="absolute left-[2.5px] top-[16px] bottom-0 border-l-2 border-dotted border-slate-300 dark:border-slate-600"
                                />
                              )}
                              <span className={`absolute left-0 top-[7px] w-1.5 h-1.5 rounded-full ${dot} ring-2 ring-white dark:ring-slate-900 z-10`} />
                              {/* optional clock time for this activity — blank until the traveller writes one */}
                              <input
                                type="text"
                                inputMode="numeric"
                                value={day.activityTimes?.[`${key}:${taskIdx}`] || ''}
                                onChange={(e) =>
                                  onUpdateDay?.({
                                    ...day,
                                    activityTimes: {
                                      ...(day.activityTimes || {}),
                                      [`${key}:${taskIdx}`]: formatTimeInput(e.target.value)
                                    }
                                  })
                                }
                                onPointerDown={(e) => e.stopPropagation()}
                                placeholder={getTranslation('timePh')}
                                title={getTranslation('activityTimeTitle')}
                                className="w-13 shrink-0 mt-0.5 mr-1.5 px-1 py-0.5 text-[10px] font-mono tabular-nums text-center text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-600 rounded-md placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-solid focus:border-violet-400"
                              />
                              {/* key-term photo sits in front of the words, behind the bullet dot — tap for a bigger view + intro */}
                              <ActivityImage text={task} destination={destination} />
                              <span className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 pt-0.5">{task}</span>
                            </div>
                            {nextTask && <DayLegConnector from={task} to={nextTask} />}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

/** Default packing checklist — connectivity essentials only; travelers add their own items. */
const DEFAULT_PACKING_ITEMS = [
  'Pocket WiFi / eSIM (stay connected everywhere)',
  'Power bank (10,000mAh+ for full-day exploring)'
];

/** Swipe left on a trip card to delete it — same gesture as deleting a stop. */
const TRIP_SWIPE_WIDTH = 96;
const SwipeableTripCard: React.FC<{ onDelete: () => void; children: React.ReactNode }> = ({ onDelete, children }) => {
  // Swipe left REVEALS a Delete button — the card stays put until the
  // traveller taps it. Nothing is deleted by the swipe gesture itself.
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const drag = useRef<{ startX: number; startY: number; active: boolean; decided: boolean } | null>(null);
  const swiped = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
    // No pointer capture yet — capturing here would retarget the coming click
    // to this wrapper and the card's own click-to-open would never fire.
    drag.current = { startX: e.clientX, startY: e.clientY, active: true, decided: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d?.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.decided) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      d.decided = true;
      if (Math.abs(dy) > Math.abs(dx)) {
        d.active = false; // vertical scroll, not a swipe
        return;
      }
      // Horizontal swipe — capture now so the drag survives leaving the card.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* harmless */
      }
      swiped.current = true;
    }
    // Follow the finger from wherever the card started (open or closed).
    setOffset(Math.max(-TRIP_SWIPE_WIDTH, Math.min(0, (open ? -TRIP_SWIPE_WIDTH : 0) + dx)));
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.active) return;
    // Snap: past half-way → stay open; otherwise close.
    setOpen(offset <= -TRIP_SWIPE_WIDTH / 2);
    setOffset(offset <= -TRIP_SWIPE_WIDTH / 2 ? -TRIP_SWIPE_WIDTH : 0);
  };
  const close = () => {
    setOpen(false);
    setOffset(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* red DELETE button revealed behind the card — tappable, but the
          swipe itself never deletes; the trip only goes when this is pressed */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r-2xl"
        style={{ width: TRIP_SWIPE_WIDTH }}
      >
        <button
          type="button"
          onClick={() => {
            close();
            onDelete();
          }}
          className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-900/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          aria-label={getTranslation('deleteThisTrip')}
          title={getTranslation('deleteThisTrip')}
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>
      <div
        className="relative transition-transform select-none"
        style={{
          transform: `translateX(${offset}px)`,
          transitionDuration: drag.current?.active ? '0ms' : '180ms'
        }}
        // Without these, a press-drag over the card text lets the browser start
        // a native selection/element drag — it fires pointercancel and the
        // swipe gesture dies mid-way. Inputs keep their own selection.
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (swiped.current) {
            // a swipe just happened — don't let the card's click open the trip
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
            return;
          }
          if (open) {
            // card is sitting open — a plain tap closes it instead of opening the trip
            e.preventDefault();
            e.stopPropagation();
            close();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  itineraries,
  currentUser,
  soloExpenses = [],
  sharedExpenses = [],
  onAddItinerary,
  onUpdateItinerary,
  onDeleteItinerary,
  onGoToCompanions,
  onGoToExploreTrips,
  onGoToActivities,
  detailTripId,
  onOpenTripDetail
}) => {
  // Sort itineraries top to bottom by earlier start date
  const sortedItineraries = (detailTripId
    ? itineraries.filter((it) => it.id === detailTripId)
    : [...itineraries]
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  /* Countdown from today to the travel date. kind: future (>0 days out),
     today (departure day), now (trip under way), past (trip ended). */
  const countdownFor = (start: string, end: string): { kind: 'future' | 'today' | 'now' | 'past'; days: number } => {
    const s = new Date(start);
    if (isNaN(s.getTime())) return { kind: 'past', days: 0 };
    const e = new Date(end || start);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    s.setHours(0, 0, 0, 0);
    if (!isNaN(e.getTime())) e.setHours(0, 0, 0, 0);
    const days = Math.round((s.getTime() - today.getTime()) / 86400000);
    if (days > 0) return { kind: 'future', days };
    if (days === 0) return { kind: 'today', days: 0 };
    if (!isNaN(e.getTime()) && today.getTime() <= e.getTime()) return { kind: 'now', days: 0 };
    return { kind: 'past', days: 0 };
  };

  const countdownLabel = (cd: { kind: 'future' | 'today' | 'now' | 'past'; days: number }): string => {
    if (cd.kind === 'today') return getTranslation('cdToday');
    if (cd.kind === 'now') return getTranslation('cdNow');
    if (cd.kind === 'past') return getTranslation('cdPast');
    if (cd.days === 1) return getTranslation('cdInDay');
    if (cd.days < 45) return tv('cdInDays', { n: cd.days });
    if (cd.days < 320) return tv('cdInMonths', { n: Math.max(2, Math.round(cd.days / 30.44)) });
    if (cd.days < 550) return getTranslation('cdInYear');
    const yrs = Math.round((cd.days / 365.25) * 10) / 10;
    return tv('cdInYears', { n: yrs });
  };

  // One-off celebration on the departure day: plane flyover + fireworks over
  // the trip card. Fires once per trip per day (sessionStorage flag).
  const todayStamp = new Date().toISOString().slice(0, 10);
  const [celebrating, setCelebrating] = useState<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    sortedItineraries.forEach((it) => {
      const cd = countdownFor(it.startDate, it.endDate);
      const flag = `wl_celebrated_${it.id}_${todayStamp}`;
      if (cd.kind === 'today' && !sessionStorage.getItem(flag)) {
        sessionStorage.setItem(flag, '1');
        out[it.id] = true;
      }
    });
    return out;
  });
  useEffect(() => {
    if (!Object.keys(celebrating).length) return;
    const t = setTimeout(() => setCelebrating({}), 5200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Do not automatically expand any trip box on open; only expand when tapped as
  // requested — except in trip detail mode, where the one trip is always expanded
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>(
    detailTripId ? { [detailTripId]: true } : {}
  );
  useEffect(() => {
    if (detailTripId) setExpandedIds((prev) => ({ ...prev, [detailTripId]: true }));
  }, [detailTripId]);

  // Edit Trip modal state — edit ALL days at once, delete trip lives inside this editor
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editTripDays, setEditTripDays] = useState<ItineraryDay[]>([]);
  const [editTripNotes, setEditTripNotes] = useState('');

  // Pi-Travel-style route map — which trip currently shows its day route map
  const [routeMapOpenFor, setRouteMapOpenFor] = useState<string | null>(null);
  // "Optimized!" confirmation on the magic-wand button, per trip+day
  const [optimizedDayKey, setOptimizedDayKey] = useState<string | null>(null);
  // Want-to-go pool: draft text of the add-place input, per trip
  const [wishlistDrafts, setWishlistDrafts] = useState<Record<string, string>>({});

  // Track checked packing items per itinerary
  const [checkedPackingItems, setCheckedPackingItems] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('wanderlust_checked_packing');
    return saved ? JSON.parse(saved) : {};
  });

  const togglePackingCheck = (key: string) => {
    setCheckedPackingItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('wanderlust_checked_packing', JSON.stringify(next));
      return next;
    });
  };

  // Editable custom checklist items per itinerary
  const [checklistByItin, setChecklistByItin] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('wanderlust_custom_checklists');
    return saved ? JSON.parse(saved) : {};
  });

  const [newChecklistText, setNewChecklistText] = useState<Record<string, string>>({});

  // Editable personal travel notes per itinerary
  const [notesByItin, setNotesByItin] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('wanderlust_custom_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const handleAddChecklistItem = (itinId: string, defaultItems: string[]) => {
    const text = (newChecklistText[itinId] || '').trim();
    if (!text) return;
    const currentList = checklistByItin[itinId] || defaultItems || [];
    const updated = [...currentList, text];
    const newMap = { ...checklistByItin, [itinId]: updated };
    setChecklistByItin(newMap);
    localStorage.setItem('wanderlust_custom_checklists', JSON.stringify(newMap));
    setNewChecklistText((prev) => ({ ...prev, [itinId]: '' }));
  };

  const handleRemoveChecklistItem = (itinId: string, idxToRemove: number, defaultItems: string[]) => {
    const currentList = checklistByItin[itinId] || defaultItems || [];
    const updated = currentList.filter((_, idx) => idx !== idxToRemove);
    const newMap = { ...checklistByItin, [itinId]: updated };
    setChecklistByItin(newMap);
    localStorage.setItem('wanderlust_custom_checklists', JSON.stringify(newMap));
  };

  const handleUpdateNotes = (itinId: string, notes: string) => {
    const newMap = { ...notesByItin, [itinId]: notes };
    setNotesByItin(newMap);
    localStorage.setItem('wanderlust_custom_notes', JSON.stringify(newMap));
  };

  const handleOpenEditTrip = (itin: TravelItinerary) => {
    setEditingTripId(itin.id);
    setEditTripDays(itin.days.map((d) => ({ ...d })));
    setEditTripNotes(itin.notes || '');
  };

  const handleSaveTripEdit = (itin: TravelItinerary) => {
    // Drop empty activity boxes, tidy whitespace, and give untitled days a
    // sensible default so blank editor fields never leak into the timeline.
    const clean = (text: string) =>
      (text || '')
        .split(/[\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .join('\n');
    const renumbered = editTripDays.map((d, i) => ({
      ...d,
      dayNumber: i + 1,
      title: (d.title || '').trim() || `Day ${i + 1}`,
      morningActivity: clean(d.morningActivity),
      afternoonActivity: clean(d.afternoonActivity),
      eveningActivity: clean(d.eveningActivity),
      companionGoal: (d.companionGoal || '').trim()
    }));
    onUpdateItinerary?.({ ...itin, days: renumbered, notes: editTripNotes });
    setEditingTripId(null);
  };

  const handleDeleteTripFromEdit = (itin: TravelItinerary) => {
    if (!onDeleteItinerary) return;
    if (window.confirm(`Delete the itinerary for ${itin.destination}? This cannot be undone.`)) {
      onDeleteItinerary(itin.id);
      setEditingTripId(null);
    }
  };

  const handleUpdateEditDay = (index: number, field: keyof ItineraryDay, val: string) => {
    setEditTripDays((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: val } : d)));
  };

  // New days start completely blank — placeholders guide, no pre-filled text.
  const handleAddEditDay = () => {
    const nextNum = editTripDays.length + 1;
    setEditTripDays((prev) => [
      ...prev,
      {
        dayNumber: nextNum,
        title: '',
        morningActivity: '',
        afternoonActivity: '',
        eveningActivity: '',
        companionGoal: ''
      }
    ]);
  };

  const handleRemoveEditDay = (index: number) => {
    if (editTripDays.length <= 1) return;
    setEditTripDays((prev) => prev.filter((_, i) => i !== index));
  };

  // Swipe-left / tap-trash day deletion on the schedule timeline (renumbers days)
  const handleDeleteDayFromSchedule = (itin: TravelItinerary, dayNumber: number) => {
    if (itin.days.length <= 1) return;
    const updatedDays = itin.days
      .filter((d) => d.dayNumber !== dayNumber)
      .map((d, i) => ({ ...d, dayNumber: i + 1 }));
    onUpdateItinerary?.({ ...itin, days: updatedDays });
  };

  /* ── Pi-Travel-style route features (圆周旅迹) ─────────────────────────── */

  /** Magic wand: reorder each slot's stops by nearest-neighbour to cut backtracking. */
  const handleOptimizeDayRoute = (itin: TravelItinerary, dayNumber: number) => {
    const day = itin.days.find((d) => d.dayNumber === dayNumber);
    if (!day) return;
    const slotKeys: Array<'morningActivity' | 'afternoonActivity' | 'eveningActivity'> = [
      'morningActivity',
      'afternoonActivity',
      'eveningActivity'
    ];
    const optimizedDay = { ...day };
    let changed = false;
    slotKeys.forEach((key) => {
      const tasks = splitTasks(day[key]);
      if (tasks.length < 3) return; // reordering <3 stops never helps
      const reordered = optimizeStopOrder(tasks.map((t) => ({ t, geo: findPlaceGeo(t) })));
      const nextText = reordered.map((x) => x.t).join('\n');
      if (nextText !== tasks.join('\n')) {
        optimizedDay[key] = nextText;
        changed = true;
      }
    });
    if (changed) {
      onUpdateItinerary?.({
        ...itin,
        days: itin.days.map((d) => (d.dayNumber === dayNumber ? optimizedDay : d))
      });
    }
    // Flash the confirmation either way so the tap always feels responsive
    const key = `${itin.id}_${dayNumber}`;
    setOptimizedDayKey(key);
    setTimeout(() => setOptimizedDayKey((cur) => (cur === key ? null : cur)), 2600);
  };

  /** Want-to-go pool: stash a place for later. */
  const handleAddWishlistPlace = (itin: TravelItinerary) => {
    const text = (wishlistDrafts[itin.id] || '').trim();
    if (!text) return;
    const wishlist = [...(itin.wishlist || []), text];
    onUpdateItinerary?.({ ...itin, wishlist });
    setWishlistDrafts((prev) => ({ ...prev, [itin.id]: '' }));
  };

  const handleRemoveWishlistPlace = (itin: TravelItinerary, idx: number) => {
    const wishlist = (itin.wishlist || []).filter((_, i) => i !== idx);
    onUpdateItinerary?.({ ...itin, wishlist });
  };

  /** Assign a pooled place to a day's morning/afternoon/evening slot. */
  const handleAssignWishlistPlace = (
    itin: TravelItinerary,
    idx: number,
    dayNumber: number,
    slot: 'morningActivity' | 'afternoonActivity' | 'eveningActivity'
  ) => {
    const place = (itin.wishlist || [])[idx];
    if (!place) return;
    const days = itin.days.map((d) => {
      if (d.dayNumber !== dayNumber) return d;
      const existing = splitTasks(d[slot]);
      return { ...d, [slot]: [...existing, place].join('\n') };
    });
    const wishlist = (itin.wishlist || []).filter((_, i) => i !== idx);
    onUpdateItinerary?.({ ...itin, days, wishlist });
  };

  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);


  /* Next default trip card name: "Untitled trip" (i18n) — unique per card. */
  const nextTripName = () => {
    const base = getTranslation('untitledTrip');
    const used = new Set(itineraries.map((i) => (i.name || '').trim()).filter(Boolean));
    if (!used.has(base)) return base;
    let n = 2;
    while (used.has(`${base} ${n}`)) n += 1;
    return `${base} ${n}`;
  };

  // Compute duration of stay automatically
  const computeStayDuration = (start: string, end: string) => {
    if (!start || !end) return { days: 1, nights: 0 };
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    if (isNaN(d1) || isNaN(d2) || d2 < d1) return { days: 1, nights: 0 };
    const nights = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    const days = nights + 1;
    return { days, nights };
  };

  /* ── Trip creation hub: one big box — search the destination, name the
      trip, pick dates and duration, then land straight in the day planner. ── */
  const [quickText, setQuickText] = useState('');
  // Optional trip card name — unnamed trips default to "Untitled trip".
  const [quickName, setQuickName] = useState('');
  const [quickStart, setQuickStart] = useState('');
  const [quickEnd, setQuickEnd] = useState('');
  const [quickDays, setQuickDays] = useState(3);
  const createBoxRef = useRef<HTMLDivElement | null>(null);

  const isoOf = (d: Date) => d.toISOString().slice(0, 10);
  const addDaysIso = (iso: string, n: number) => {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + n);
    return isoOf(d);
  };
  const defaultStartIso = () => {
    const s = new Date();
    s.setDate(s.getDate() + 14);
    return isoOf(s);
  };
  const diffDays = (a: string, b: string) =>
    Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000) + 1;

  const changeStart = (v: string) => {
    setQuickStart(v);
    if (!v) return;
    setQuickEnd((prev) => addDaysIso(v, quickDays - 1));
  };
  const changeEnd = (v: string) => {
    setQuickEnd(v);
    const start = quickStart || defaultStartIso();
    if (v && new Date(v) >= new Date(start)) setQuickDays(diffDays(start, v));
  };
  const focusCreateBox = () => {
    createBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = createBoxRef.current?.querySelector('input');
    window.setTimeout(() => (input as HTMLInputElement | null)?.focus(), 350);
  };

  /** Big create box: destination + name + dates + duration → draft skeleton,
      auto-planned route, then refine in Edit Trip. */
  const handleQuickCreate = async () => {
    const raw = quickText.trim();
    if (!raw || isGeneratingGuide) return;
    const m = raw.match(/^(.+?)\s*(\d+)\s*(?:天|days?|day)(?:\s*(\d+)\s*(?:晚|nights?))?/i);
    const destination = (m ? m[1] : raw).replace(/^想去\s*/, '').trim() || raw;
    const dayCount = Math.max(1, Math.min(365, quickDays || (m ? Number(m[2]) : 3) || 3));
    const iso = isoOf;
    const startIso = quickStart || defaultStartIso();
    const endIso = quickEnd && new Date(quickEnd) >= new Date(startIso)
      ? quickEnd
      : addDaysIso(startIso, dayCount - 1);
    const start = new Date(`${startIso}T12:00:00`);
    const end = new Date(`${endIso}T12:00:00`);
    // Auto-plan the route: real sights near the destination fill the day slots
    // so the route map has numbered stops & legs the moment the trip exists.
    const suggestions = suggestPlacesFor(destination, dayCount * 3);
    const days: ItineraryDay[] = Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const picks = suggestions.slice(i * 3, i * 3 + 3);
      return {
        dayNumber: i + 1,
        date: iso(d),
        title: '',
        morningActivity: picks[0] ? `Visit ${picks[0].name}` : '',
        afternoonActivity: picks[1] ? `Explore ${picks[1].name}` : '',
        eveningActivity: picks[2] ? `Evening at ${picks[2].name}` : ''
      };
    });
    // Any city/region resolves to its real country via the world gazetteer.
    const world = await resolvePlaceCountry(destination);
    const typedRaw = destination.includes(',') ? destination.split(',').pop()!.trim() : '';
    // Canonicalise the typed tail: "Paris, Texas" resolves to United States,
    // not a country literally called "Texas".
    const typedCountry = canonicalCountrySegment(typedRaw);
    const guide = buildBasicGuide(destination, typedCountry || world?.countryName || '', destination.split(',')[0]?.trim(), currentUser.country || '', iso(start), iso(end));
    const newItinerary: TravelItinerary = {
      id: `itin_${Date.now()}`,
      travelerId: currentUser.id,
      name: quickName.trim() || nextTripName(),
      destination,
      country: typedCountry || world?.countryName || guide.destinationCountry,
      startDate: iso(start),
      endDate: iso(end),
      companionPurpose: [],
      notes: '',
      days,
      travelGuide: guide,
      visibility: 'private'
    };
    onAddItinerary(newItinerary);
    setQuickText('');
    setQuickName('');
    setQuickStart('');
    setQuickEnd('');
    setQuickDays(3);
    setExpandedIds((prev) => ({ ...prev, [newItinerary.id]: true }));
    setRouteMapOpenFor(newItinerary.id); // route map opens already planned
    handleOpenEditTrip(newItinerary);
  };

  return (
    <div className="space-y-10">
      {/* ── Studio header: editorial greeting + command-bar creation (list view only) ── */}
      {!detailTripId && (
      <div className="space-y-7">
        <div className="max-w-2xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-600 dark:text-violet-400 mb-2.5">
            {getTranslation('myTripsTitle')}
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 leading-[1.05]">
            {tv('tripsGreeting', { name: currentUser.name.split(' ')[0] })}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-xl">
            {getTranslation('tripsHeroSub')}
          </p>
        </div>

        {/* One-box trip creation: search where, name it, pick dates + duration */}
        <div
          ref={createBoxRef}
          className="max-w-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm"
        >
          {/* Designed header: gradient icon tile + title + hint.
              Sky-blue in Daybreak, violet in Galaxy. */}
          <div className="relative flex items-center gap-3.5 px-5 sm:px-6 pt-5 pb-4 bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent dark:from-violet-400/10 dark:via-indigo-400/5 border-b border-stone-100 dark:border-stone-800">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-sky-500/10 dark:bg-violet-400/10 blur-2xl pointer-events-none" />
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 dark:from-violet-500 dark:to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="relative min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                {getTranslation('planNewItinerary')}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {getTranslation('whereToPh')}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">

          {/* Where to? */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              {getTranslation('whereLabel')}
            </label>
            <PlaceTypeahead
              value={quickText}
              onChange={setQuickText}
              onEnter={handleQuickCreate}
              onPick={(hit) => {
                const label = hit.kind === 'country' ? hit.name : `${hit.name}, ${hit.countryName}`;
                setQuickText(label);
              }}
              placeholder={getTranslation('whereToPh')}
              className="w-full px-4 py-3.5 text-sm sm:text-base border border-stone-200 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              wrapperClassName="w-full"
            />
          </div>

          {/* Trip name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              {getTranslation('tripNameLabel')}
            </label>
            <input
              type="text"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder={getTranslation('tripNamePh')}
              className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          {/* When: twin date boxes. Each cell is a min-w-0 flexbox that hosts
              a 0×0 CSS grid — so the inner bordered box sizes to the cell's
              content box and can never overflow into its neighbour, whatever
              intrinsic width the phone's date control reports. No
              overflow-hidden anywhere, so the rounded borders paint fully
              to the edge. Trip length = days between FROM and TO. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 min-w-0">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {getTranslation('fromDate')}
              </label>
              <div className="flex min-w-0">
                <div className="flex-1 min-w-0 border border-stone-200 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-800">
                  <input
                    type="date"
                    value={quickStart}
                    onChange={(e) => changeStart(e.target.value)}
                    className="block w-full max-w-full min-w-0 px-3 py-3 text-sm bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-violet-400 rounded-2xl [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5 min-w-0">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {getTranslation('toDate')}
              </label>
              <div className="flex min-w-0">
                <div className="flex-1 min-w-0 border border-stone-200 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-800">
                  <input
                    type="date"
                    value={quickEnd}
                    min={quickStart || undefined}
                    onChange={(e) => changeEnd(e.target.value)}
                    className="block w-full max-w-full min-w-0 px-3 py-3 text-sm bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-violet-400 rounded-2xl [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickCreate}
            disabled={!quickText.trim() || isGeneratingGuide}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 text-sm font-bold transition-all hover:brightness-110 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shadow-md"
          >
            <ArrowRight className="w-4 h-4" />
            <span>{getTranslation('createTripBtn')}</span>
          </button>
          </div>
        </div>
      </div>

      )}

      {/* My trips */}
      {!detailTripId && (
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
          {getTranslation('myTripsTitle')}
        </h2>
        <span className="text-xs font-medium text-stone-400 font-mono tabular-nums">
          {sortedItineraries.length}
        </span>
      </div>
      )}

      {/* Itinerary Boxes Stacked Top to Bottom Sorted by Earlier Start Date */}
      {sortedItineraries.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{getTranslation('noItinerariesYet')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Create your first detailed itinerary box with multi-day morning, afternoon, and evening schedules.
          </p>
          <button
            onClick={focusCreateBox}
            className="mt-4 inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{getTranslation('createItineraryBox')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedItineraries.map((itinerary, cardIdx) => {
            const isExpanded = !!expandedIds[itinerary.id];
            // The traveller's own name for the trip — unnamed trips read "Untitled trip".
            const cardName = (itinerary.name || '').trim() || getTranslation('untitledTrip');
            // Traveller nationality drives the visa chip on the card header
            const guideNat = (itinerary.travelGuide?.travelerNationality || currentUser.country || '').trim();
            // Pi-style card stat: total planned stops across every day & slot
            const placesCount = itinerary.days.reduce(
              (n, d) =>
                n +
                splitTasks(d.morningActivity).length +
                splitTasks(d.afternoonActivity).length +
                splitTasks(d.eveningActivity).length,
              0
            );

            return (
              <div
                key={itinerary.id}
              >
              {detailTripId ? (
                /* Trip page: day-by-day journey board (date tabs + route map) */
                <JourneyBoard
                  itinerary={itinerary}
                  onUpdateItinerary={onUpdateItinerary}
                />
              ) : (
              <SwipeableTripCard onDelete={() => onDeleteItinerary?.(itinerary.id)}>
              <div
                className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md overflow-hidden transition-all"
              >
                {/* Departure-day celebration: one-off plane flyover + fireworks */}
                {celebrating[itinerary.id] && (
                  <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl" aria-hidden>
                    <div className="absolute left-[6%] right-[6%] top-8 border-t-2 border-dashed border-violet-400/90 wl-trail" />
                    <Plane className="absolute top-5 w-6 h-6 text-violet-500 dark:text-violet-300 wl-plane-fly" />
                    {[
                      { left: '12%', top: '18%', color: '#f59e0b', delay: '0.2s' },
                      { left: '78%', top: '12%', color: '#8b5cf6', delay: '0.7s' },
                      { left: '55%', top: '30%', color: '#ec4899', delay: '1.1s' },
                      { left: '32%', top: '8%', color: '#10b981', delay: '1.5s' }
                    ].map((p, i) => (
                      <Sparkles
                        key={i}
                        className="absolute w-6 h-6 wl-burst"
                        style={{ left: p.left, top: p.top, color: p.color, animationDelay: p.delay }}
                      />
                    ))}
                  </div>
                )}

                {/* Trip card — the whole card is tappable and opens the trip page */}
                {(() => {
                  const cover = getTripCover(itinerary.id);
                  const dur = computeStayDuration(itinerary.startDate, itinerary.endDate);
                  const cd = countdownFor(itinerary.startDate, itinerary.endDate);
                  // Big-number form for the countdown badge: 30 + days, 8 + months…
                  const cdUnit = (() => {
                    if (cd.kind !== 'future') return null;
                    if (cd.days === 1) return { n: 1, unit: getTranslation('cdU_Day') };
                    if (cd.days < 45) return { n: cd.days, unit: getTranslation('cdU_Days') };
                    if (cd.days < 320) return { n: Math.max(2, Math.round(cd.days / 30.44)), unit: getTranslation('cdU_Months') };
                    if (cd.days < 550) return { n: 1, unit: getTranslation('cdU_Year') };
                    return { n: Math.round((cd.days / 365.25) * 10) / 10, unit: getTranslation('cdU_Years') };
                  })();
                  const cdCls =
                    cd.kind === 'today'
                      ? 'bg-violet-600 text-white border-violet-500'
                      : cd.kind === 'now'
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : cd.kind === 'past'
                      ? 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                      : 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800';
                  return (
                <div
                  onClick={() => {
                    if (!detailTripId && onOpenTripDetail) {
                      onOpenTripDetail(itinerary);
                      return;
                    }
                    setExpandedIds((prev) => ({
                      ...prev,
                      [itinerary.id]: !prev[itinerary.id]
                    }));
                  }}
                  className={`relative p-5 sm:p-6 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 ${
                    cover
                      ? ''
                      : 'bg-gradient-to-r from-stone-100/80 via-stone-50/50 to-transparent dark:from-stone-800/40 dark:via-stone-800/20 dark:to-transparent hover:from-stone-100 dark:hover:from-stone-800/60'
                  }`}
                >
                  {/* Cover picture background (chosen inside the trip) */}
                  {cover && (
                    <>
                      <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/60 to-stone-950/35" />
                    </>
                  )}

                  <div className="relative flex items-start gap-4">
                    {/* Countdown clock — big number + unit until departure */}
                    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl shrink-0 shadow-xs ${
                      cover
                        ? 'bg-white/15 backdrop-blur-sm text-white border border-white/20'
                        : 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950'
                    }`}>
                      {cd.kind === 'today' || cd.kind === 'now' ? (
                        <Sparkles className="w-5 h-5" />
                      ) : cd.kind === 'past' ? (
                        <CheckCircle2 className="w-5 h-5 opacity-90" />
                      ) : (
                        <Clock className="w-5 h-5 opacity-90" />
                      )}
                      {cdUnit ? (
                        <span className="leading-none">
                          <span className="block font-display text-2xl font-extrabold tabular-nums leading-none">
                            {cdUnit.n}
                          </span>
                          <span className="block text-[9px] font-bold uppercase tracking-[0.18em] opacity-80 mt-1">
                            {cdUnit.unit}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-black uppercase tracking-wider leading-tight max-w-[88px]">
                          {countdownLabel(cd)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-display font-bold text-lg ${cover ? 'text-white' : 'text-slate-950 dark:text-slate-50'}`}>
                          {cardName}
                        </h3>
                        {/* Visa chip — passport × destination specific, from official sources */}
                        {!guideNat && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cover ? 'text-white/90 bg-white/10 border-white/25' : 'text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/60 border-stone-300/80 dark:border-stone-700'}`}>
                            <Stamp className="w-3 h-3" />
                            {getTranslation('visaNeedNat')}
                          </span>
                        )}
                        {guideNat && (() => {
                          const destText = `${itinerary.country || ''} ${itinerary.destination}`;
                          const v = visaVerdictFor(guideNat, destText);
                          const daysStr = v.days ? tv('visaDaysShort', { n: v.days }) : '';
                          const label = v.status === 'home'
                            ? getTranslation('visaChipHome')
                            : v.status === 'free'
                            ? `${getTranslation('visaChipFree')}${v.days ? ` · ${daysStr}` : ''}`
                            : v.status === 'eta'
                            ? (v.etaName || getTranslation('visaChipEta'))
                            : v.status === 'evisa'
                            ? (v.etaName || getTranslation('visaChipEvisa'))
                            : v.status === 'voa'
                            ? `${getTranslation('visaChipVoa')}${v.days ? ` · ${daysStr}` : ''}`
                            : v.status === 'required'
                            ? getTranslation('visaChipRequired')
                            : getTranslation('visaChipCheck');
                          const cls = v.tone === 'free'
                            ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800'
                            : v.tone === 'online'
                            ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800'
                            : v.tone === 'embassy'
                            ? 'text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800'
                            : 'text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/60 border-stone-300/80 dark:border-stone-700';
                          return (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cls}`}
                              title={`${v.verdict}${v.note ? ` — ${v.note}` : ''}`}
                            >
                              <Stamp className="w-3 h-3" />
                              {label}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Date row — calendar symbol + days/nights worked out from the dates */}
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${cover ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}`}>
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono tabular-nums">{itinerary.startDate} – {itinerary.endDate}</span>
                        <span className={cover ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}>
                          ({tv('stayNights', { d: dur.days, n: dur.nights })})
                        </span>
                      </div>

                      {/* Location row — country · countdown to the travel date · planned places */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border ${
                          cover
                            ? 'text-white bg-white/15 border-white/25'
                            : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}>
                          <MapPin className="w-3 h-3" />
                          {itinerary.country || itinerary.destination || getTranslation('untitledTrip')}
                          <span className="opacity-50">·</span>
                          {tv('placesCount', { n: placesCount })}
                        </span>
                      </div>

                      {itinerary.notes && (
                        <p className={`text-xs mt-0.5 line-clamp-1 ${cover ? 'text-white/75' : 'text-slate-600 dark:text-slate-400'}`}>
                          {itinerary.notes}
                        </p>
                      )}

                      {/* Multi-city route chips */}
                      {itinerary.cities && itinerary.cities.length > 1 && (
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          {itinerary.cities.map((c, i) => (
                            <span key={c} className="inline-flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900 font-semibold">
                                {c}
                              </span>
                              {i < itinerary.cities!.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                              )}
                            </span>
                          ))}
                          <span className={`ml-1 ${cover ? 'text-white/60' : 'text-slate-400'}`}>{getTranslation('multiCityTrip')}</span>
                        </div>
                      )}

                      {/* Companion goals live on the profile instead — tap a
                          traveller's bio to see what they're looking for. */}
                    </div>
                  </div>
                </div>
                  );
                })()}

                {/* Expanded Detailed Journey, Day Schedule Editing & Travel Guide */}
                {isExpanded && (
                  <div className="p-6 space-y-8 bg-slate-50/40 dark:bg-slate-950/30">
                    {/* Checklist and Notes (Removed 'fully editable' badge as requested) */}
                    <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3.5 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Luggage className="w-4 h-4 text-emerald-700" />
                          <span>{getTranslation('checklistNotes')}</span>
                        </div>
                      </div>

                      {/* Checklist Items — starts with just WiFi & power bank; add your own */}
                      {(() => {
                        const defaultItems = DEFAULT_PACKING_ITEMS;
                        const currentItems = checklistByItin[itinerary.id] || defaultItems;
                        const packedCount = currentItems.filter(
                          (item, idx) => checkedPackingItems[`${itinerary.id}_pack_${item}_${idx}`]
                        ).length;

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{getTranslation('essentialsHint')}</span>
                              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                                {packedCount}/{currentItems.length} {getTranslation('packedWord')}
                              </span>
                            </div>
                            <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto pr-1">
                              {currentItems.map((item, idx) => {
                                const checkKey = `${itinerary.id}_pack_${item}_${idx}`;
                                const isChecked = !!checkedPackingItems[checkKey];

                                return (
                                  <li
                                    key={idx}
                                    className={`flex items-center justify-between gap-2 group px-2.5 py-1.5 rounded-lg border transition-colors ${
                                      isChecked
                                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50'
                                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800'
                                    }`}
                                  >
                                    <div
                                      onClick={() => togglePackingCheck(checkKey)}
                                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                    >
                                      <span className="shrink-0 text-slate-600">
                                        {isChecked ? (
                                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                          <Square className="w-3.5 h-3.5 text-slate-400" />
                                        )}
                                      </span>
                                      <span className={`truncate text-xs ${isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {item}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveChecklistItem(itinerary.id, idx, defaultItems)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity cursor-pointer rounded"
                                      title="Delete item"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>

                            {/* Add New Checklist Item Input */}
                            <div className="flex items-center gap-1.5 pt-1.5">
                              <input
                                type="text"
                                value={newChecklistText[itinerary.id] || ''}
                                onChange={(e) =>
                                  setNewChecklistText((prev) => ({
                                    ...prev,
                                    [itinerary.id]: e.target.value
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddChecklistItem(itinerary.id, defaultItems);
                                  }
                                }}
                                placeholder={getTranslation('addPackingPh')}
                                className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddChecklistItem(itinerary.id, defaultItems)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-xl hover:scale-[1.03] transition-all cursor-pointer shrink-0"
                              >
                                {getTranslation('addBtn')}
                              </button>
                            </div>

                            {/* Editable Personal Notes Textarea */}
                            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                              <label className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100 text-[11px]">
                                <NotebookPen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>{getTranslation('myNotes')}</span>
                              </label>
                              <AutoGrowTextarea
                                minRows={2}
                                value={notesByItin[itinerary.id] ?? (itinerary.notes || '')}
                                onChange={(e) => handleUpdateNotes(itinerary.id, e.target.value)}
                                placeholder={getTranslation('notesPh')}
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed"
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Want-to-go pool (圆周旅迹 待规划地点): stash places now, assign to a day slot later */}
                    <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/70 dark:border-emerald-900/50 rounded-xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
                          <BookmarkPlus className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                            {getTranslation('wishlistTitle')}
                          </div>
                          <p className="text-[11px] text-emerald-800/70 dark:text-emerald-300/70">
                            {getTranslation('wishlistSub')}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={wishlistDrafts[itinerary.id] || ''}
                          onChange={(e) =>
                            setWishlistDrafts((prev) => ({ ...prev, [itinerary.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddWishlistPlace(itinerary);
                            }
                          }}
                          placeholder={getTranslation('wishlistPh')}
                          className="flex-1 min-w-0 px-3 py-2 text-xs border border-emerald-200 dark:border-emerald-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddWishlistPlace(itinerary)}
                          className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:scale-[1.03] cursor-pointer shadow-xs shrink-0 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{getTranslation('addBtn')}</span>
                        </button>
                      </div>

                      {(itinerary.wishlist || []).length > 0 && (
                        <div className="space-y-1.5">
                          {(itinerary.wishlist || []).map((place, idx) => (
                            <div
                              key={`${place}_${idx}`}
                              className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 rounded-lg"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {place}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWishlistPlace(itinerary, idx)}
                                  className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                                  title={getTranslation('removeFromPool')}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <ListPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <select
                                  value=""
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (!v) return;
                                    const [dayNum, slot] = v.split('|');
                                    handleAssignWishlistPlace(
                                      itinerary,
                                      idx,
                                      Number(dayNum),
                                      slot as 'morningActivity' | 'afternoonActivity' | 'eveningActivity'
                                    );
                                  }}
                                  className="px-2 py-1.5 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 cursor-pointer"
                                >
                                  <option value="">{getTranslation('assignToSlot')}</option>
                                  {itinerary.days.map((d) => (
                                    <optgroup key={d.dayNumber} label={`${tv('dayN', { n: d.dayNumber })}${d.title ? ` · ${d.title}` : ''}`}>
                                      <option value={`${d.dayNumber}|morningActivity`}>
                                        {tv('dayN', { n: d.dayNumber })} · {getTranslation('slotMorning')}
                                      </option>
                                      <option value={`${d.dayNumber}|afternoonActivity`}>
                                        {tv('dayN', { n: d.dayNumber })} · {getTranslation('slotAfternoon')}
                                      </option>
                                      <option value={`${d.dayNumber}|eveningActivity`}>
                                        {tv('dayN', { n: d.dayNumber })} · {getTranslation('slotEvening')}
                                      </option>
                                    </optgroup>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Detailed Day-by-Day Journey Timeline — swipe a day card left to delete it */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                          {getTranslation('yourJourney')} · {itinerary.days.length}{' '}
                          {itinerary.days.length === 1 ? getTranslation('dayOne') : getTranslation('dayMany')}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() =>
                              setRouteMapOpenFor((cur) => (cur === itinerary.id ? null : itinerary.id))
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer shadow-xs transition-colors ${
                              routeMapOpenFor === itinerary.id
                                ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 hover:scale-[1.03] transition-all'
                                : 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            }`}
                            title={getTranslation('routeMapTitle')}
                          >
                            <MapIcon className="w-3.5 h-3.5" />
                            <span>{getTranslation('routeMap')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditTrip(itinerary)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:scale-[1.03] cursor-pointer shadow-xs transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>{getTranslation('editTrip')}</span>
                          </button>
                        </div>
                      </div>

                      {/* 圆周旅迹-style day route map: numbered stops + connecting lines */}
                      {routeMapOpenFor === itinerary.id && (
                        <TripRouteMap
                          itinerary={itinerary}
                          onUpdateItinerary={onUpdateItinerary}
                        />
                      )}

                      <div className="space-y-3">
                        {itinerary.days.map((day, dayIdx) => (
                          <SwipeableDayCard
                            key={`${itinerary.id}_${day.dayNumber}_${itinerary.days.length}`}
                            day={day}
                            isLast={dayIdx === itinerary.days.length - 1}
                            canDelete={itinerary.days.length > 1}
                            onDelete={() => handleDeleteDayFromSchedule(itinerary, day.dayNumber)}
                            onOptimize={() => handleOptimizeDayRoute(itinerary, day.dayNumber)}
                            optimized={optimizedDayKey === `${itinerary.id}_${day.dayNumber}`}
                            destination={`${itinerary.destination} ${itinerary.country || ''}`}
                            onUpdateDay={(newDay) =>
                              onUpdateItinerary?.({
                                ...itinerary,
                                days: itinerary.days.map((d) =>
                                  d.dayNumber === day.dayNumber ? newDay : d
                                )
                              })
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {/* Travel Guide moved to the trip page's own Travel Guide tab */}
                  </div>
                )}
              </div>
              </SwipeableTripCard>
              )}
              </div>
            );
          })}
        </div>
      )}

      {/* Visibility toggle popup (open to public / private) */}




      {/* Edit Trip Modal — edit every day at once; delete trip lives here */}
      {editingTripId && (() => {
        const itin = itineraries.find((x) => x.id === editingTripId);
        if (!itin) return null;
        return (
          <div className="wl-modal-overlay" onClick={() => setEditingTripId(null)}>
            <div
              className="wl-modal-card max-w-2xl p-6 sm:p-7 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="wl-modal-eyebrow">WanderLust Studio</div>
                  <h3 className="wl-modal-title mt-1.5">
                    {getTranslation('editTrip')} · {itin.destination}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                    {itin.startDate} – {itin.endDate} · {getTranslation('editTripSub')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTripId(null)}
                  className="wl-modal-close"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {getTranslation('daySchedule')} ({tv('daysCount', { n: editTripDays.length })})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEditDay}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{getTranslation('addAnotherDay')}</span>
                  </button>
                </div>

                {/* Per day: one heading + one plan box (one activity per line),
                    linked on the dotted line — the same layout as the trip page. */}
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute left-[15px] top-4 bottom-4 border-l-2 border-dotted border-slate-300 dark:border-slate-600"
                  />
                  <div className="space-y-3">
                    {editTripDays.map((d, idx) => {
                      // Three slot boxes per day — Morning / Afternoon / Evening
                      // stay separate so the headings survive the edit.
                      const slotRows: Array<{
                        key: 'morningActivity' | 'afternoonActivity' | 'eveningActivity';
                        label: string;
                      }> = [
                        { key: 'morningActivity', label: getTranslation('slotMorning') },
                        { key: 'afternoonActivity', label: getTranslation('slotAfternoon') },
                        { key: 'eveningActivity', label: getTranslation('slotEvening') }
                      ];
                      return (
                        <div key={idx} className="relative pl-11">
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-3 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm border-2 border-white dark:border-slate-900"
                          >
                            <CalendarDays className="w-4 h-4" />
                          </span>
                          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                            {/* One box per day: the title is the box's header row,
                                the plan lines sit right under it — no nested boxes */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400 shrink-0">
                                {tv('dayN', { n: idx + 1 })}
                              </span>
                              <input
                                type="text"
                                value={d.title}
                                onChange={(e) => handleUpdateEditDay(idx, 'title', e.target.value)}
                                placeholder={getTranslation('dayTitlePh')}
                                className="flex-1 min-w-0 py-1 bg-transparent border-b border-transparent focus:border-rose-300 dark:focus:border-rose-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none transition-colors"
                              />
                              {editTripDays.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditDay(idx)}
                                  className="p-1 text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                                  title={getTranslation('removeDayTitle')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {slotRows.map(({ key, label }, slotIdx) => (
                              <div key={key} className={slotIdx === 0 ? 'mt-1.5' : 'mt-1'}>
                                <div className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                                  {label}
                                </div>
                                <textarea
                                  rows={Math.max(1, (d[key] || '').split('\n').length)}
                                  value={d[key]}
                                  onChange={(e) => handleUpdateEditDay(idx, key, e.target.value)}
                                  placeholder={getTranslation('activityPh')}
                                  className="w-full py-1 bg-transparent border-t border-dashed border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none resize-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {getTranslation('tripNotesLabel')}
                  </label>
                  <AutoGrowTextarea
                    minRows={2}
                    value={editTripNotes}
                    onChange={(e) => setEditTripNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Danger zone: deleting the trip lives inside the editor */}
                <button
                  type="button"
                  onClick={() => handleDeleteTripFromEdit(itin)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-lg hover:brightness-105 transition-colors shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{getTranslation('deleteThisTrip')}</span>
                </button>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingTripId(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    {getTranslation('cancelBtn')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTripEdit(itin)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:brightness-105 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{getTranslation('saveAllChanges')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
