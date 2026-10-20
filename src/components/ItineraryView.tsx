import React, { useState, useEffect, useRef } from 'react';
import { TravelItinerary, SoloTraveler, ItineraryDay, TravelGuideInfo, TripScope, SoloPersonalExpense, ExpenseItem } from '../types/travel';
import {
  Calendar,
  MapPin,
  Users,
  Compass,
  Plus,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  DollarSign,
  CloudSun,
  Luggage,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckSquare,
  Square,
  MessageSquare,
  FileText,
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
  Eye,
  EyeOff,
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
import { cardAcceptanceForCountry, tippingForCountry, countryInfoFor, countryNameFor, visaVerdictFor, isSameBlocTraveler } from '../utils/countryInfo';
import { taxInfoFor } from '../utils/taxInfo';
import ActivityImage from './ActivityImage';
import { travelAppsFor } from '../data/travelApps';
import { emergencyNumbersFor } from '../data/emergencyNumbers';
import { getFxRates, refreshFxRates, benchmarkString, rateFor, convertAmount, type FxState } from '../utils/currency';
import { getTranslation, tv } from '../utils/i18n';
import AutoGrowTextarea from './AutoGrowTextarea';
import { WORLD_COUNTRIES } from './DestinationSelector';
import { TripRouteMap } from './TripRouteMap';
import { findPlaceGeo, estimateLeg, optimizeStopOrder, type TravelMode } from '../utils/placeGeo';

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

const COMMON_PURPOSES = [
  'Split Car Rental & Fuel',
  'Split Taxi to Outlying Sights',
  'Shared Dining / Tapas & Feast Partner',
  'Dawn Photography Walk',
  'Hiking Safety Partner',
  'Full Trip Travel Buddy',
  'Explore Local Markets Together'
];

interface FormDayItem {
  name: string; // activity heading box
  detail: string; // fill-in detail box
}

interface FormDayDraft {
  title: string;
  items: FormDayItem[];
  companionGoal: string;
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
                                      [`${key}:${taskIdx}`]: e.target.value
                                    }
                                  })
                                }
                                onPointerDown={(e) => e.stopPropagation()}
                                placeholder={getTranslation('timePh')}
                                title={getTranslation('activityTimeTitle')}
                                className="w-12 shrink-0 mt-0.5 mr-1.5 px-1 py-0.5 text-[10px] font-mono tabular-nums text-center text-slate-600 dark:text-slate-300 bg-slate-50/80 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-600 rounded-md placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-solid focus:border-violet-400"
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

// Whole-trip swipe-left-to-delete shell (pointer-driven, works on touch + mouse)
const SwipeableTripShell: React.FC<{
  canDelete: boolean;
  onDelete: () => void;
  children: React.ReactNode;
}> = ({ canDelete, onDelete, children }) => {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startX: number; startY: number; startOffset: number; moved: boolean; horizontal: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDelete) return;
    drag.current = { startX: e.clientX, startY: e.clientY, startOffset: offset, moved: false, horizontal: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    // Only hijack clearly-horizontal swipes so vertical page scrolling keeps working
    if (!drag.current.moved) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // vertical scroll — bail out
        return;
      }
      drag.current.moved = true;
      drag.current.horizontal = true;
    }
    setDragging(true);
    setOffset(Math.min(0, Math.max(-SWIPE_DELETE_WIDTH, drag.current.startOffset + dx)));
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    setOffset((cur) => (cur < -SWIPE_DELETE_WIDTH / 2 ? -SWIPE_DELETE_WIDTH : 0));
  };

  return (
    <div className="relative rounded-2xl overflow-hidden group/trip">
      {/* Red delete zone revealed behind the trip card when swiping left */}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute inset-y-0 right-0 w-[88px] bg-gradient-to-br from-red-500 to-rose-600 flex flex-col items-center justify-center gap-1 text-white cursor-pointer"
          title="Delete this trip"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Delete</span>
        </button>
      )}

      <div
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative touch-pan-y bg-white dark:bg-slate-900 ${dragging ? '' : 'transition-transform'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
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

  // Studio bento stats
  const costFx = getFxRates();
  const totalSpentAll =
    soloExpenses.reduce((sum, e) => sum + convertAmount(e.amount, e.currency || 'USD', 'USD', costFx), 0) +
    sharedExpenses.reduce((sum, e) => sum + convertAmount(e.amount, e.currency || 'USD', 'USD', costFx), 0);
  const countryCount = new Set(
    itineraries.map((it) => (it.country || it.destination.split(',').pop() || '').trim().toLowerCase()).filter(Boolean)
  ).size;

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

  // Visibility toggle popup ("open to public" / "private")
  const [visibilityToast, setVisibilityToast] = useState<{ isPublic: boolean; text: string } | null>(null);
  const visibilityToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggleVisibility = (itin: TravelItinerary) => {
    const isPublic = (itin.visibility || 'public') === 'public';
    const nextPublic = !isPublic;
    onUpdateItinerary?.({ ...itin, visibility: nextPublic ? 'public' : 'private' });
    if (visibilityToastTimer.current) clearTimeout(visibilityToastTimer.current);
    setVisibilityToast({
      isPublic: nextPublic,
      text: nextPublic
        ? `${itin.destination} is now open to public — other travelers can discover this trip and connect with you.`
        : `${itin.destination} is now private — visible only to you.`
    });
    visibilityToastTimer.current = setTimeout(() => setVisibilityToast(null), 3200);
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

  // Editor activity slots: one box per activity. Splits on the same separators
  // the day card uses (newlines, "·", "•", ";") so boxes match the display.
  const editDayLines = (text: string): string[] => {
    if (!text || !text.trim()) return [''];
    return text.split(/[\n\r]+|[·•;]\s*/);
  };

  // Update a single activity box (line) inside a morning/afternoon/evening slot
  const handleUpdateEditDayActivityLine = (
    index: number,
    field: 'morningActivity' | 'afternoonActivity' | 'eveningActivity',
    lineIdx: number,
    val: string
  ) => {
    setEditTripDays((prev) =>
      prev.map((d, i) => {
        if (i !== index) return d;
        const lines = editDayLines(d[field]);
        lines[lineIdx] = val;
        return { ...d, [field]: lines.join('\n') };
      })
    );
  };

  // "+" beside a slot appends a fresh empty activity box to that slot
  const handleAddEditDayActivityBox = (
    index: number,
    field: 'morningActivity' | 'afternoonActivity' | 'eveningActivity'
  ) => {
    setEditTripDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: `${editDayLines(d[field]).join('\n')}\n` } : d))
    );
  };

  // Small × on a box removes that activity line
  const handleRemoveEditDayActivityBox = (
    index: number,
    field: 'morningActivity' | 'afternoonActivity' | 'eveningActivity',
    lineIdx: number
  ) => {
    setEditTripDays((prev) =>
      prev.map((d, i) => {
        if (i !== index) return d;
        const lines = editDayLines(d[field]).filter((_, li) => li !== lineIdx);
        return { ...d, [field]: lines.join('\n') };
      })
    );
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  // Form state — destination split into Country box + City box.
  // City is optional (country alone is enough for companion matching) and may
  // hold several comma-separated cities for multi-city trips.
  const [formCountry, setFormCountry] = useState('');
  const [formCity, setFormCity] = useState('');
  const formCities = formCity
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const formDest = formCities.length > 0 && formCountry.trim()
    ? `${formCities.join(' · ')}, ${formCountry.trim()}`
    : (formCities.join(' · ') || formCountry.trim());
  const [formStartDate, setFormStartDate] = useState('2026-11-01');
  const [formEndDate, setFormEndDate] = useState('2026-11-05');
  const [formNotes, setFormNotes] = useState('');
  const [formTripScope, setFormTripScope] = useState<TripScope>('Flexible (Full or Part)');
  const [formDateFlexibility, setFormDateFlexibility] = useState<'Exact Dates' | '±1 Day' | '±2 Days' | '±3 Days'>('Exact Dates');
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([
    'Shared Dining / Tapas & Feast Partner',
    'Split Car Rental & Fuel'
  ]);

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

  const syncDraftDaysCount = (targetDays: number) => {
    setFormDays((prev) => {
      if (prev.length === targetDays) return prev;
      if (prev.length < targetDays) {
        const added: FormDayDraft[] = [];
        for (let i = prev.length + 1; i <= targetDays; i++) {
          added.push({
            title: `Day ${i} Exploration`,
            items: [
              { name: 'Morning walk or local breakfast', detail: '' },
              { name: 'Afternoon excursion or landmark', detail: '' },
              { name: 'Dinner with travel companions', detail: '' }
            ],
            companionGoal: 'Companion for shared activities'
          });
        }
        return [...prev, ...added];
      }
      return prev.slice(0, targetDays);
    });
  };

  const handleStartDateChange = (val: string) => {
    setFormStartDate(val);
    const dur = computeStayDuration(val, formEndDate);
    syncDraftDaysCount(dur.days);
  };

  const handleEndDateChange = (val: string) => {
    setFormEndDate(val);
    const dur = computeStayDuration(formStartDate, val);
    syncDraftDaysCount(dur.days);
  };

  // Dynamic multi-day draft list (destination-neutral templates, fully editable)
  const [formDays, setFormDays] = useState<FormDayDraft[]>([
    {
      title: 'Arrival & Old Town First Walk',
      items: [
        { name: 'Arrive & check in', detail: 'Airport arrival, transfer to accommodation, settle in.' },
        { name: 'Historic square stroll', detail: 'Explore the central historic square, local cafe stop.' },
        { name: 'Welcome dinner', detail: 'Casual dinner at a neighborhood tavern / bistro bar.' }
      ],
      companionGoal: 'Open for dinner companion to celebrate first evening'
    },
    {
      title: 'Iconic Architecture & Viewpoints',
      items: [
        { name: 'Landmark walk', detail: 'Early morning walk past the main landmarks before heat and crowds.' },
        { name: 'Market & viewpoint', detail: 'Artisan market crawl and a scenic city viewpoint.' },
        { name: 'Sunset dinner', detail: 'Sunset viewpoint walk and local dinner.' }
      ],
      companionGoal: 'Companion for viewpoint photos and dinner'
    },
    {
      title: 'Day Excursion & Outdoor Adventure',
      items: [
        { name: 'Day trip out', detail: 'Nearby island, national park, or guided outdoor tour.' },
        { name: 'Nature highlights', detail: 'Explore scenic highlights and local nature spots.' },
        { name: 'Panoramic terrace', detail: 'Sunset drinks at a panoramic terrace.' }
      ],
      companionGoal: 'Split tour or transport costs for the excursion'
    },
    {
      title: 'Cultural Heritage & Sunset Walk',
      items: [
        { name: 'Palace / museum visit', detail: 'Visit the main palace, museum, or heritage monument.' },
        { name: 'Promenade coffee', detail: 'Artisan shopping and a relaxed coffee break on the main promenade.' },
        { name: 'Farewell dinner', detail: 'Farewell celebratory dinner at a local terrace.' }
      ],
      companionGoal: 'Shared multi-course dinner and travel stories'
    },
    {
      title: 'Morning Views & Departure',
      items: [
        { name: 'Farewell vista', detail: 'Cable car or viewpoint for a panoramic farewell vista.' },
        { name: 'Pack & transfer', detail: 'Pack and airport transfer.' },
        { name: 'Departure', detail: 'Departure flight.' }
      ],
      companionGoal: 'Split airport taxi'
    }
  ]);

  const togglePurpose = (p: string) => {
    if (selectedPurposes.includes(p)) {
      setSelectedPurposes(selectedPurposes.filter((item) => item !== p));
    } else {
      setSelectedPurposes([...selectedPurposes, p]);
    }
  };

  const handleAddCustomGoal = () => {
    const trimmed = customGoalInput.trim();
    if (!trimmed) return;
    if (!selectedPurposes.includes(trimmed)) {
      setSelectedPurposes([...selectedPurposes, trimmed]);
    }
    setCustomGoalInput('');
  };

  const handleAddDraftDay = () => {
    const nextNum = formDays.length + 1;
    setFormDays([
      ...formDays,
      {
        title: `Day ${nextNum} Exploration`,
        items: [
          { name: 'Morning walk and breakfast', detail: '' },
          { name: 'Afternoon excursion or museum', detail: '' },
          { name: 'Dinner with fellow travelers', detail: '' }
        ],
        companionGoal: 'Companion for shared activities'
      }
    ]);
  };

  const handleRemoveDraftDay = (index: number) => {
    if (formDays.length <= 1) return;
    setFormDays(formDays.filter((_, idx) => idx !== index));
  };

  const handleUpdateDraftDay = (index: number, field: 'title' | 'companionGoal', val: string) => {
    const next = [...formDays];
    next[index] = { ...next[index], [field]: val };
    setFormDays(next);
  };

  const handleUpdateDayItem = (dayIdx: number, itemIdx: number, field: keyof FormDayItem, val: string) => {
    setFormDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, items: d.items.map((it, j) => (j === itemIdx ? { ...it, [field]: val } : it)) }
          : d
      )
    );
  };

  const handleAddDayItem = (dayIdx: number) => {
    setFormDays((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, items: [...d.items, { name: '', detail: '' }] } : d))
    );
  };

  const handleRemoveDayItem = (dayIdx: number, itemIdx: number) => {
    setFormDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx && d.items.length > 1
          ? { ...d, items: d.items.filter((_, j) => j !== itemIdx) }
          : d
      )
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDest || !formStartDate || !formEndDate) return;

    setIsGeneratingGuide(true);

    const guide = await buildTravelGuide(formDest, formCountry, formCities[0], formNotes, formStartDate, formEndDate);

    const newItinerary: TravelItinerary = {
      id: `itin_${Date.now()}`,
      travelerId: currentUser.id,
      destination: formDest.includes(',') ? formDest : `${formCities[0] || formDest}, ${guide.destinationCountry}`,
      country: guide.destinationCountry,
      cities: formCities.length > 1 ? formCities : undefined,
      startDate: formStartDate,
      endDate: formEndDate,
      companionPurpose: selectedPurposes.length > 0 ? selectedPurposes : ['Solo Exploration'],
      notes: formNotes || `Solo trip to ${formDest}.`,
      days: formDays.map((d, idx) => {
        // Map the user's free-form activity boxes onto the structured day slots:
        // first 3 activities → morning / afternoon / evening, extras join the evening slot.
        const fmt = (it?: FormDayItem) =>
          it ? (it.detail.trim() ? `${it.name.trim() || 'Activity'} — ${it.detail.trim()}` : it.name.trim()) : '';
        const [m, a, ...rest] = d.items;
        const eveningParts = rest.map(fmt).filter(Boolean);
        return {
          dayNumber: idx + 1,
          title: d.title,
          morningActivity: fmt(m) || 'Free morning to explore at your own pace.',
          afternoonActivity: fmt(a) || 'Free afternoon for spontaneous plans.',
          eveningActivity: eveningParts.join(' · ') || 'Relaxed evening, dinner nearby.',
          companionGoal: d.companionGoal
        };
      }),
      travelGuide: guide,
      tripScope: formTripScope,
      dateFlexibility: formDateFlexibility,
      visibility: 'public'
    };

    onAddItinerary(newItinerary);
    setIsAddModalOpen(false);

    // Auto expand the new trip
    setExpandedIds((prev) => ({ ...prev, [newItinerary.id]: true }));
  };

  /** Shared guide builder (country knowledge base + optional AI generation). */
  const buildTravelGuide = async (
    destInput: string,
    countryInput: string,
    firstCity: string | undefined,
    notes: string,
    startDate: string,
    endDate: string
  ): Promise<TravelGuideInfo> => {
    // Country knowledge base: resolves bare cities ("Bangkok" → Thailand) and aligns
    // entry rules, customs, phrases and currency with whatever destination is typed.
    const kb = lookupCountryGuide(destInput);
    const nat = currentUser.country || 'Germany';
    const country = countryInput.trim() || (kb.key !== 'generic' ? kb.name : destInput);
    const city = firstCity || destInput;
    const visaText = visaAdviceFor(nat, kb);
    const tippingText = tippingAdviceFor(nat, kb);
    const kbCurrency = {
      code: kb.currencyCode,
      name: kb.currencyName,
      symbol: kb.currencySymbol,
      rateBenchmark: '',
      cardAcceptance: 'Cards are widely accepted in cities; carry some cash for markets, taxis, and small towns.',
      tippingRules: tippingText
    };

    // Country-specific emergency numbers (police / ambulance) for the safety panel
    const emergency = emergencyNumbersFor(`${formDest} ${country}`);
    const emergencyAdvisory =
      `Emergency numbers in ${emergency.country}: ` +
      (emergency.numbers.general ? `General ${emergency.numbers.general} · ` : '') +
      `Police ${emergency.numbers.police} · Ambulance ${emergency.numbers.ambulance}` +
      (emergency.numbers.fire ? ` · Fire ${emergency.numbers.fire}` : '') +
      '. Save them offline before you arrive.';
    // Concrete, locally-used travel apps for this destination
    const localApps = travelAppsFor(`${formDest} ${country}`);

    let guide: TravelGuideInfo;
    try {
      const generated = await generateDestinationTravelGuide(formDest, nat, formNotes);
      guide = {
        travelerNationality: nat,
        destinationCity: city,
        destinationCountry: country,
        visaRequirements: visaText,
        specificCurrency: {
          ...kbCurrency,
          cardAcceptance: generated.specificCurrency?.cardAcceptance || kbCurrency.cardAcceptance
        },
        weatherOutlook: generated.weatherOutlook || {
          cityName: `${city} Local Climate`,
          seasonPeriod: `${formStartDate} to ${formEndDate}`,
          temperatureRange: '14°C – 23°C (57°F – 73°F)',
          daytimeAvg: '21°C',
          nighttimeAvg: '14°C',
          rainProbability: '15% chance of light showers',
          conditions: 'Sunny, pleasant afternoons with cool evenings.',
          daylightSummary: 'Approx. 11 hours daylight.',
          clothingAdvice: 'Pack comfortable layers, walking shoes, and a light windbreaker.'
        },
        recommendedToBring: generated.recommendedToBring?.length
          ? generated.recommendedToBring
          : ['Walking shoes', 'Plug adapter', 'Light jacket'],
        arrivalRulesAndApps: {
          connectivityAdvice:
            generated.arrivalRulesAndApps?.connectivityAdvice ||
            'Purchase an international eSIM or check roaming coverage before departure.',
          recommendedApps: generated.arrivalRulesAndApps?.recommendedApps?.length
            ? generated.arrivalRulesAndApps.recommendedApps
            : localApps,
          entryRegulations: kb.entryRules
        },
        culturalNorms: kb.customs,
        basicGreetings: kb.phrases,
        culturalShocks: generated.culturalShocks || [
          {
            title: 'Dining Schedules & Local Pace',
            description: 'Restaurants and shops operate on local rhythms.',
            tip: 'Check opening hours for afternoon closures.'
          }
        ],
        soloSafetyAdvisories: [
          emergencyAdvisory,
          ...(generated.soloSafetyAdvisories?.length
            ? generated.soloSafetyAdvisories
            : ['Meet potential travel companions in public plazas.'])
        ]
      };
    } catch {
      guide = {
        travelerNationality: nat,
        destinationCity: city,
        destinationCountry: country,
        visaRequirements: visaText,
        specificCurrency: kbCurrency,
        weatherOutlook: {
          cityName: `${city} City Outlook`,
          seasonPeriod: `${formStartDate} to ${formEndDate}`,
          temperatureRange: '16°C – 24°C',
          daytimeAvg: '22°C',
          nighttimeAvg: '15°C',
          rainProbability: '20%',
          conditions: 'Mild pleasant autumn weather.',
          daylightSummary: 'Approx. 11 hours daylight.',
          clothingAdvice: 'Light layers, good walking sneakers, sunglasses.'
        },
        recommendedToBring: [
          'Comfortable walking shoes',
          'Power bank for full-day photo exploration',
          'Universal power plug adapter',
          'Lightweight packable rain jacket'
        ],
        arrivalRulesAndApps: {
          connectivityAdvice: 'Download offline maps before leaving airport.',
          recommendedApps: localApps,
          entryRegulations: kb.entryRules
        },
        culturalNorms: kb.customs,
        basicGreetings: kb.phrases,
        culturalShocks: [
          { title: 'Local Etiquette', description: 'Be respectful of local traditions.', tip: 'Observe locals.' }
        ],
        soloSafetyAdvisories: [emergencyAdvisory, 'Meet potential travel companions in busy public places and share your live location with someone you trust.']
      };
    }
    setIsGeneratingGuide(false);
    return guide;
  };

  /* ── Pi-Travel creation hub ────────────────────────────────────────────── */
  const [createTab, setCreateTab] = useState<'quick' | 'parse'>('quick');
  const [quickText, setQuickText] = useState('');
  const [parseText, setParseText] = useState('');

  /** Quick create: "想去北京3天2晚" → draft itinerary skeleton, then refine in Edit Trip. */
  const handleQuickCreate = async () => {
    const raw = quickText.trim();
    if (!raw || isGeneratingGuide) return;
    const m = raw.match(/^(.+?)\s*(\d+)\s*(?:天|days?|day)(?:\s*(\d+)\s*(?:晚|nights?))?/i);
    const destination = (m ? m[1] : raw).replace(/^想去\s*/, '').trim() || raw;
    const dayCount = m ? Math.min(14, Math.max(1, Number(m[2]))) : 3;
    const start = new Date();
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setDate(end.getDate() + dayCount - 1);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const days: ItineraryDay[] = Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        dayNumber: i + 1,
        date: iso(d),
        title: '',
        morningActivity: '',
        afternoonActivity: '',
        eveningActivity: ''
      };
    });
    setIsGeneratingGuide(true);
    const guide = await buildTravelGuide(destination, '', destination.split(',')[0]?.trim(), '', iso(start), iso(end));
    const newItinerary: TravelItinerary = {
      id: `itin_${Date.now()}`,
      travelerId: currentUser.id,
      destination,
      country: destination.includes(',') ? destination.split(',').pop()!.trim() : guide.destinationCountry,
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
    setExpandedIds((prev) => ({ ...prev, [newItinerary.id]: true }));
    handleOpenEditTrip(newItinerary);
  };

  /** Parse pasted guide text: named places fall into the Want-to-go pool of a draft trip. */
  const handleParseImport = async () => {
    const text = parseText.trim();
    if (!text || isGeneratingGuide) return;
    const dayCount = Math.max(2, Math.min(7, Math.round(text.length / 400) || 2));
    const places: string[] = [];
    const seen = new Set<string>();
    text
      .split(/[\n,，。;；、·•]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2 && s.length <= 60)
      .forEach((s) => {
        if (!findPlaceGeo(s) || seen.has(s.toLowerCase())) return;
        seen.add(s.toLowerCase());
        places.push(s);
      });
    const start = new Date();
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setDate(end.getDate() + dayCount - 1);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const days: ItineraryDay[] = Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        dayNumber: i + 1,
        date: iso(d),
        title: '',
        morningActivity: '',
        afternoonActivity: '',
        eveningActivity: ''
      };
    });
    const firstPlace = places[0] ? findPlaceGeo(places[0])?.name || '' : '';
    setIsGeneratingGuide(true);
    const guide = await buildTravelGuide(firstPlace || text.slice(0, 40), '', firstPlace, text.slice(0, 300), iso(start), iso(end));
    const newItinerary: TravelItinerary = {
      id: `itin_${Date.now()}`,
      travelerId: currentUser.id,
      destination: firstPlace
        ? firstPlace.replace(/\b\w/g, (c) => c.toUpperCase())
        : getTranslation('untitledTrip'),
      country: '',
      startDate: iso(start),
      endDate: iso(end),
      companionPurpose: [],
      notes: tv('parsedFromGuide', { n: places.length }),
      days,
      travelGuide: guide,
      wishlist: places,
      visibility: 'private'
    };
    onAddItinerary(newItinerary);
    setParseText('');
    setExpandedIds((prev) => ({ ...prev, [newItinerary.id]: true }));
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

        {/* Bento stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-xs">
            <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 tabular-nums">
              {sortedItineraries.length}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">
              {getTranslation('statTrips')}
            </div>
          </div>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-xs">
            <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 tabular-nums">
              {countryCount}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">
              {getTranslation('statCountries')}
            </div>
          </div>
          <div className="bg-stone-950 dark:bg-violet-400 rounded-3xl p-4 shadow-xs">
            <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-violet-300 dark:text-stone-950 tabular-nums">
              {totalSpentAll > 0 ? `$${Math.round(totalSpentAll).toLocaleString()}` : '—'}
            </div>
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-700">
              {getTranslation('statSpent')}
            </div>
          </div>
        </div>

        {/* Command-bar creation card */}
        <div className="max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setCreateTab('quick')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                createTab === 'quick'
                  ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{getTranslation('quickCreateTab')}</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateTab('parse')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                createTab === 'parse'
                  ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{getTranslation('parseGuideTab')}</span>
            </button>
          </div>

          {createTab === 'quick' ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickCreate();
                }}
                placeholder={getTranslation('quickCreatePh')}
                className="flex-1 min-w-0 px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={handleQuickCreate}
                className="w-12 h-12 rounded-2xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center transition-all hover:scale-105 cursor-pointer shadow-md shrink-0"
                title={getTranslation('createTripBtn')}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <textarea
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                rows={3}
                placeholder={getTranslation('parseGuidePh')}
                className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:scale-[1.03] transition-all cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{getTranslation('parseGuideBtn')}</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-right">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
            >
              {getTranslation('manualCreateLink')}
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
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{getTranslation('createItineraryBox')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedItineraries.map((itinerary) => {
            const isExpanded = !!expandedIds[itinerary.id];
            // Traveller nationality drives the visa chip on the card header
            const guideNat = itinerary.travelGuide?.travelerNationality || currentUser.country || 'Germany';
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
              <SwipeableTripShell
                key={itinerary.id}
                canDelete={!!onDeleteItinerary}
                onDelete={() => handleDeleteTripFromEdit(itinerary)}
              >
              <div
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md overflow-hidden transition-all"
              >
                {/* Trip Itinerary Box Header (Clickable to Expand / Collapse) */}
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
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer bg-gradient-to-r from-stone-100/80 via-stone-50/50 to-transparent dark:from-stone-800/40 dark:via-stone-800/20 dark:to-transparent hover:from-stone-100 dark:hover:from-stone-800/60 transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-[10px] font-bold uppercase font-mono tracking-wider">
                        {itinerary.days.length}
                      </span>
                      <span className="text-[9px] uppercase tracking-tight opacity-80">
                        Days
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                          {itinerary.destination}
                        </h3>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {itinerary.startDate} – {itinerary.endDate}
                        </span>
                        {/* Total planned stops, Pi-Travel card style */}
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 rounded">
                          <MapPin className="w-3 h-3" />
                          {tv('placesCount', { n: placesCount })}
                        </span>
                        {/* Visa chip — does the traveller's passport need a visa for this country? */}
                        {(() => {
                          const destText = `${itinerary.country || ''} ${itinerary.destination}`;
                          const v = visaVerdictFor(guideNat, destText);
                          if (v.verdict === 'Check requirements') return null;
                          const sameBloc = isSameBlocTraveler(guideNat, destText);
                          const isHome = v.verdict.startsWith('Home country');
                          const label = isHome
                            ? getTranslation('visaHomeCountry')
                            : v.tone === 'free'
                            ? (sameBloc ? getTranslation('visaFreeMovement') : getTranslation('visaFreeLikely'))
                            : v.tone === 'online'
                            ? getTranslation('visaOnArrival')
                            : getTranslation('visaEmbassy');
                          const cls = isHome || v.tone === 'free'
                            ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800'
                            : v.tone === 'online'
                            ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800'
                            : 'text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-800';
                          return (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cls}`}
                              title={v.verdict}
                            >
                              <Stamp className="w-3 h-3" />
                              {label}
                            </span>
                          );
                        })()}
                        {/* Eye icon visibility toggle — tap to open to public / make private */}
                        {(() => {
                          const isPublic = (itinerary.visibility || 'public') === 'public';
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVisibility(itinerary);
                              }}
                              title={isPublic ? 'Open to public — tap to make private' : 'Private — tap to open to public'}
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                isPublic
                                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100'
                                  : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{isPublic ? getTranslation('openToPublic') : getTranslation('privateTrip')}</span>
                            </button>
                          );
                        })()}
                        {itinerary.tripScope && (
                          <span className="text-[10px] font-semibold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800 px-2 py-0.5 rounded">
                            {itinerary.tripScope}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                        {itinerary.notes}
                      </p>

                      {/* Multi-city route chips */}
                      {itinerary.cities && itinerary.cities.length > 1 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px]">
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
                          <span className="text-slate-400 ml-1">{getTranslation('multiCityTrip')}</span>
                        </div>
                      )}

                      {/* Companion goals live on the profile instead — tap a
                          traveller's bio to see what they're looking for. */}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditTrip(itinerary);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Edit this trip — all days at once, or delete the trip"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{getTranslation('editTrip')}</span>
                    </button>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isExpanded ? getTranslation('hideDetails') : getTranslation('tapToView')}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Journey, Day Schedule Editing & Travel Guide */}
                {isExpanded && (
                  <div className="p-6 space-y-8 bg-slate-50/40 dark:bg-slate-950/30">
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
              </SwipeableTripShell>
            );
          })}
        </div>
      )}

      {/* Visibility toggle popup (open to public / private) */}
      {visibilityToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] animate-in fade-in slide-in-from-bottom-2">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md ${
            visibilityToast.isPublic
              ? 'bg-emerald-600/95 border-emerald-400/50 text-white'
              : 'bg-slate-900/95 border-slate-600/50 text-white'
          }`}>
            {visibilityToast.isPublic ? <Eye className="w-4 h-4 shrink-0" /> : <EyeOff className="w-4 h-4 shrink-0" />}
            <span>{visibilityToast.text}</span>
          </div>
        </div>
      )}



      {/* Plan New Itinerary Modal with Dynamic Multi-Day Builder */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-display font-bold text-xl text-slate-950 dark:text-slate-50">
              Plan New Trip Itinerary & Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Build your day-by-day plan with morning, afternoon, and evening activities, plus companion goals. Add Day 2, Day 3, or as many days as your trip requires.
            </p>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      list="wl-country-list"
                      placeholder="Country (e.g. Croatia)"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <datalist id="wl-country-list">
                      {WORLD_COUNTRIES.map((c) => (
                        <option key={c.country} value={c.country} />
                      ))}
                    </datalist>
                    <span className="block text-[10px] text-slate-400 mt-1">Country</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="City — optional (e.g. Dubrovnik, or Kyoto, Osaka)"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <span className="block text-[10px] text-slate-400 mt-1">
                      City — optional. Visiting several cities? Separate them with commas. Leave blank to match companions by country.
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Automatically generated Duration of Stay */}
              {(() => {
                const dur = computeStayDuration(formStartDate, formEndDate);
                return (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-900 dark:text-rose-200">
                      Duration of stay:
                    </span>
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                      {dur.days} Days ({dur.nights} Nights)
                    </span>
                  </div>
                );
              })()}

              {/* Scope & Date Flexibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Travel Together Scope:
                  </label>
                  <select
                    value={formTripScope}
                    onChange={(e) => setFormTripScope(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  >
                    <option value="Flexible (Full or Part)">Flexible (Full or Part of Trip)</option>
                    <option value="Full Trip">Full Trip (Travel Together Throughout)</option>
                    <option value="Part of Trip">Part of Trip (Meet for Specific Days / Sights)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Date Flexibility:
                  </label>
                  <select
                    value={formDateFlexibility}
                    onChange={(e) => setFormDateFlexibility(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  >
                    <option value="Exact Dates">Exact Dates (Fixed schedule)</option>
                    <option value="±1 Day">±1 Day (Slightly flexible)</option>
                    <option value="±2 Days">±2 Days (Moderate flexibility)</option>
                    <option value="±3 Days">±3 Days (Highly flexible)</option>
                  </select>
                </div>
              </div>

              {/* Companionship Goals for This Trip (Optional with chips and custom write-in) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Companionship Goals for this trip <span className="text-slate-400 font-normal">(optional)</span>:
                  </label>
                  <span className="text-[10px] text-slate-400">Pick or type custom</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PURPOSES.map((p) => {
                    const active = selectedPurposes.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePurpose(p)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                          active
                            ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomGoal();
                      }
                    }}
                    placeholder="Add custom companionship goal (e.g. Split boat charter)..."
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGoal}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-semibold hover:brightness-105 cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Privacy Notice on Itinerary Visibility */}
              <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-800 dark:text-slate-200">Open to public:</strong> Dates, destination, flexibility, and general notes are viewable by public travelers to find companions. Detailed journey can be customized in Settings.
              </div>

              {/* Multi-Day Schedule Builder called Travel Planning */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    Travel Planning ({formDays.length} Days)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDraftDay}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Day</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formDays.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Day {idx + 1}</span>
                        {formDays.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftDay(idx)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Day Title (e.g. Dawn Temple Photography)"
                        value={d.title}
                        onChange={(e) => handleUpdateDraftDay(idx, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-xs"
                      />

                      {/* Activity boxes: name (heading) + detail (fill-in) + add-more */}
                      <div className="space-y-2">
                        {d.items.map((it, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 shrink-0 w-4 text-center">
                                {itemIdx + 1}
                              </span>
                              <input
                                type="text"
                                placeholder={`Name of activity (e.g. Fushimi Inari at sunrise)`}
                                value={it.name}
                                onChange={(e) => handleUpdateDayItem(idx, itemIdx, 'name', e.target.value)}
                                className="flex-1 min-w-0 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                              />
                              {d.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDayItem(idx, itemIdx)}
                                  className="p-1 text-slate-400 hover:text-red-600 shrink-0 cursor-pointer"
                                  title="Remove activity"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Fill in details (time, place, bookings...)"
                              value={it.detail}
                              onChange={(e) => handleUpdateDayItem(idx, itemIdx, 'detail', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                            />
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddDayItem(idx)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-dashed border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add another activity to Day {idx + 1}
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Companionship goal (e.g. dinner companion or split taxi)..."
                        value={d.companionGoal}
                        onChange={(e) => handleUpdateDraftDay(idx, 'companionGoal', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trip Overview & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline key priorities, lodging style, or pace preferences..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingGuide}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:brightness-105 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {isGeneratingGuide ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Travel Guide...</span>
                    </>
                  ) : (
                    <span>Save Itinerary Box</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal — edit every day at once; delete trip lives here */}
      {editingTripId && (() => {
        const itin = itineraries.find((x) => x.id === editingTripId);
        if (!itin) return null;
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setEditingTripId(null)}>
            <div
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setEditingTripId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-slate-950 dark:text-slate-50">
                    {getTranslation('editTrip')} · {itin.destination}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {itin.startDate} – {itin.endDate} · {getTranslation('editTripSub')}
                  </p>
                </div>
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

                {editTripDays.map((d, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{tv('dayN', { n: idx + 1 })}</span>
                      {editTripDays.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditDay(idx)}
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
                          title={getTranslation('removeDayTitle')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={d.title}
                      onChange={(e) => handleUpdateEditDay(idx, 'title', e.target.value)}
                      placeholder={getTranslation('dayTitlePh')}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                    />

                    <div className="space-y-2.5">
                      {DAY_TIME_ROWS.map(({ key, labelKey, Icon }) => {
                        const lines = editDayLines(d[key]);
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                <Icon className="w-3 h-3" />
                                {getTranslation(labelKey)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddEditDayActivityBox(idx, key)}
                                className="w-6 h-6 shrink-0 inline-flex items-center justify-center rounded-full border border-dashed border-rose-300 dark:border-rose-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title={`${getTranslation('addActivityBox')} · ${getTranslation(labelKey)}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {/* One auto-growing box per activity — no scrolling, no manual resize */}
                            <div className="space-y-1.5">
                              {lines.map((line, lineIdx) => (
                                <div key={lineIdx} className="flex items-start gap-1.5">
                                  <AutoGrowTextarea
                                    value={line}
                                    onChange={(e) => handleUpdateEditDayActivityLine(idx, key, lineIdx, e.target.value)}
                                    placeholder={getTranslation('activityPh')}
                                    className="flex-1 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                  />
                                  {lines.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEditDayActivityBox(idx, key, lineIdx)}
                                      className="mt-1 p-1 text-slate-300 hover:text-red-500 cursor-pointer shrink-0"
                                      title={getTranslation('removeActivityBox')}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={d.companionGoal || ''}
                      onChange={(e) => handleUpdateEditDay(idx, 'companionGoal', e.target.value)}
                      placeholder={getTranslation('companionGoalPh')}
                      className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                    />
                  </div>
                ))}

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
