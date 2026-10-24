import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Footprints,
  TramFront,
  TrainFront,
  TrainFrontTunnel,
  Bus,
  CarTaxiFront,
  Car,
  Ship,
  Plane,
  Plus,
  Pencil,
  Route as RouteIcon,
  ImagePlus,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  BedDouble,
  Utensils,
  Camera,
  Compass,
  NotebookPen,
  Image as ImageIcon,
  Trash2,
  MapPin,
  CalendarDays,
  Sparkles,
  Star
} from 'lucide-react';
import { TravelItinerary, ItineraryDay } from '../types/travel';
import { TripRouteMap } from './TripRouteMap';
import {
  estimateLeg,
  estimateLegForMode,
  isAirportLeg,
  dayRouteColor,
  TravelMode
} from '../utils/placeGeo';
import { geoForTask, requestGeocode, onGeocodeResolved, tripGeoContext, isAddressQuery, geocodeAddress, storeGeocode, GeocodeCandidate } from '../utils/geocode';
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
import { getTripCover, setTripCover } from '../utils/tripCovers';
import TripRescueModal from './TripRescueModal';

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
  slotKey: (typeof SLOT_KEYS)[number]['key'];
  lat?: number;
  lng?: number;
}

const stopsOf = (day: ItineraryDay, context = ''): StopItem[] => {
  const out: StopItem[] = [];
  SLOT_KEYS.forEach(({ key, labelKey }) => {
    splitTasks(day[key]).forEach((task) => {
      // A typed pinpoint (address / street / postcode / coords) outranks the
      // guessed geocode of the stop's name.
      const override = day.locationOverrides?.[task]?.trim();
      const geo = (override ? geoForTask(override, context) : null) || geoForTask(task, context);
      out.push({ label: task, slotLabelKey: labelKey, slotKey: key, lat: geo?.lat, lng: geo?.lng });
    });
  });
  return out;
};

/** Legs between consecutive geocoded stops of a day (distance + travel mode). */
const legsOf = (day: ItineraryDay, context = '') => {
  const stops = stopsOf(day, context);
  return stops.slice(1).map((to, i) => {
    const from = stops[i];
    if (from.lat == null || to.lat == null || from.lng == null || to.lng == null) return null;
    const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
    const chosen = day.legModes?.[`${from.label}→${to.label}`] as TravelMode | undefined;
    // Airport ⇄ airport defaults to flying — nobody drives between airports.
    const est = chosen
      ? { km, minutes: estimateLegForMode(km, chosen), mode: chosen }
      : isAirportLeg(from.label, to.label)
      ? { km, minutes: estimateLegForMode(km, 'flight'), mode: 'flight' as TravelMode }
      : estimateLeg(km);
    return { from: from.label, to: to.label, ...est };
  });
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

const CAT_META: Record<StopCategory, { key: string; cls: string; Icon: typeof Camera }> = {
  transport: {
    key: 'jdCatTransport',
    cls: 'text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-200/80 dark:border-sky-800',
    Icon: TramFront
  },
  sights: {
    key: 'jdCatSights',
    cls: 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/80 dark:border-emerald-800',
    Icon: Camera
  },
  food: {
    key: 'jdCatFood',
    cls: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/80 dark:border-amber-800',
    Icon: Utensils
  },
  lodging: {
    key: 'jdCatLodging',
    cls: 'text-violet-800 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border-violet-200/80 dark:border-violet-800',
    Icon: BedDouble
  },
  other: {
    key: 'jdCatOther',
    cls: 'text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800/70 border-stone-200 dark:border-stone-700',
    Icon: Compass
  }
};

/** Per-mode icon: foot / underground / bus / train / taxi / car / ferry / flight. */
const modeIcon = (mode: string) => {
  switch (mode) {
    case 'walk':
      return Footprints;
    case 'transit':
      return TrainFrontTunnel; // underground / metro
    case 'bus':
      return Bus;
    case 'train':
      return TrainFront;
    case 'taxi':
      return CarTaxiFront;
    case 'ferry':
      return Ship;
    case 'flight':
      return Plane;
    case 'drive':
      return Car;
    default:
      return TramFront;
  }
};

/** Modes offered when the traveller picks how to travel a leg. */
const LEG_MODE_CHOICES: Array<{ mode: TravelMode; labelKey: string }> = [
  { mode: 'walk', labelKey: 'modeWalk' },
  { mode: 'transit', labelKey: 'modeTransit' },
  { mode: 'bus', labelKey: 'modeBus' },
  { mode: 'train', labelKey: 'modeTrain' },
  { mode: 'taxi', labelKey: 'modeTaxi' },
  { mode: 'drive', labelKey: 'modeDrive' },
  { mode: 'ferry', labelKey: 'modeFerry' },
  { mode: 'flight', labelKey: 'modeFlight' }
];

/* ── Swipe-left-to-delete stop bullet ──────────────────────────────────────── */

const STOP_SWIPE_WIDTH = 72;

/**
 * One activity bullet in a day card. Swipe (or drag) left to reveal the red
 * delete zone; release past halfway — or tap the revealed trash — to delete.
 */
const SwipeableStop: React.FC<{ onDelete: () => void; children: React.ReactNode }> = ({
  onDelete,
  children
}) => {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startX: number; startOffset: number; moved: boolean } | null>(null);
  // After a real drag, the browser still fires a click on release — that
  // phantom click must not immediately close the zone we just opened.
  const suppressClick = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
    suppressClick.current = false;
    drag.current = { startX: e.clientX, startOffset: offset, moved: false };
    try {
      // keep the gesture on this element even when the pointer leaves the card
      // (mouse drags otherwise fire pointerleave mid-swipe and cancel it)
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* older browsers — touch devices capture implicitly anyway */
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(dx) < 6) return;
    drag.current.moved = true;
    setDragging(true);
    setOffset(Math.min(0, Math.max(-STOP_SWIPE_WIDTH, drag.current.startOffset + dx)));
  };
  const endDrag = () => {
    if (!drag.current) return;
    const wasMoved = drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (!wasMoved) return; // plain tap — the open/close is handled by click capture
    suppressClick.current = true;
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 350);
    if (offset <= -STOP_SWIPE_WIDTH + 6) {
      onDelete(); // full swipe — the bullet is gone, no second tap needed
      return;
    }
    const staysOpen = offset < -STOP_SWIPE_WIDTH / 2;
    setOpen(staysOpen);
    setOffset(staysOpen ? -STOP_SWIPE_WIDTH : 0);
  };

  return (
    <div className="relative rounded-xl">
      {/* Red delete zone behind the bullet, revealed on swipe-left. Only
          mounted while open so it never pokes out behind the bullet — in
          Daybreak (light mode) the bullet's translucent light card would
          otherwise show a red sliver at the right edge. */}
      {open && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute inset-y-0 right-0 w-[72px] rounded-r-xl bg-gradient-to-br from-red-500 to-rose-600 flex flex-col items-center justify-center gap-0.5 text-white cursor-pointer shadow-lg"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Delete</span>
        </button>
      )}
      <div
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative touch-pan-y select-none ${dragging ? '' : 'transition-transform'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => {
          if (open) {
            // open + plain tap (not the trash) → close instead of bubbling a
            // click through to whatever's inside the bullet. Clicks that
            // immediately follow a drag are phantom release-clicks — swallow
            // them but keep the zone open.
            e.preventDefault();
            e.stopPropagation();
            if (suppressClick.current) return;
            setOpen(false);
            setOffset(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Photo with a graceful activity-symbol tile when the photo service hiccups —
 *  named places still get real photos; generic activities get a simple drawing
 *  of what they are (a bed for a hotel stay, utensils for dinner…). */
const SmartImage: React.FC<{
  src: string;
  color: string;
  className: string;
  iconCls?: string;
  Icon?: typeof Camera;
}> = ({ src, color, className, iconCls = 'w-6 h-6', Icon = Camera }) => {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`${className} overflow-hidden flex items-center justify-center`}
      style={{ background: `linear-gradient(135deg, ${color}40, ${color}14)` }}
    >
      {failed ? (
        <Icon className={iconCls} aria-hidden style={{ color }} />
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
 * selected day. Overview: checklist first, then the notebook for penning
 * notes, then the trip-cover picker. Day view: every day stacked as one
 * dotted-line timeline — a heading + remark box per day, double-tap to edit.
 */
export const JourneyBoard: React.FC<JourneyBoardProps> = ({
  itinerary,
  onUpdateItinerary,
  onEditTrip
}) => {
  const [activeDay, setActiveDay] = useState(0); // 0 = Overview, else 1-based day number

  // Trip Rescue (AI day planner): which day's modal is open, and the
  // must-see stars a traveller pins on stops. Stars persist across sessions.
  const [rescueDay, setRescueDay] = useState<ItineraryDay | null>(null);
  const MUSTSEE_KEY = 'wanderlust_mustsee_v1';
  const [stopImportance, setStopImportance] = useState<Record<string, 1 | 2>>(() => {
    try {
      return JSON.parse(localStorage.getItem(MUSTSEE_KEY) || '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(MUSTSEE_KEY, JSON.stringify(stopImportance));
    } catch {
      /* storage full/blocked — stars just won't persist */
    }
  }, [stopImportance]);
  const toggleImportance = (label: string) =>
    setStopImportance((prev) => ({ ...prev, [label]: prev[label] === 2 ? 1 : 2 }));
  const applyRescue = (dayNumber: number, slots: string[][]) => {
    commitSlots(dayNumber, slots);
    setRescueDay(null);
  };

  // Exact-place geocoding: re-render when an online lookup lands, and queue
  // one for any stop the local landmark table doesn't know yet.
  const geoContext = tripGeoContext(itinerary.destination, itinerary.country);
  const [geoVer, setGeoVer] = useState(0);
  useEffect(() => onGeocodeResolved(() => setGeoVer((v) => v + 1)), []);
  useEffect(() => {
    itinerary.days.forEach((d) => {
      SLOT_KEYS.forEach(({ key }) => {
        splitTasks(d[key]).forEach((task) => {
          const override = d.locationOverrides?.[task]?.trim();
          if (override) {
            if (!geoForTask(override, geoContext)) requestGeocode(override, geoContext);
          } else if (!geoForTask(task, geoContext)) requestGeocode(task, geoContext);
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itinerary.days, geoContext, geoVer]);

  // Which leg's inline transport picker is open: "dayNumber|from→to"
  const [openLegPicker, setOpenLegPicker] = useState<string | null>(null);

  const chooseLegMode = (day: ItineraryDay, key: string, mode: TravelMode) => {
    updateDay(day.dayNumber, { legModes: { ...(day.legModes || {}), [key]: mode } });
    setOpenLegPicker(null);
  };

  // Overview note — tap the box and pen straight away; saves on blur
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  // Double-tap editing: which day card is currently in edit form
  const [editingDay, setEditingDay] = useState<number | null>(null);
  // Draft while editing: day heading + one heading/box pair per activity
  const [editDraft, setEditDraft] = useState<{
    dayNumber: number;
    title: string;
    items: Array<{ name: string; detail: string }>;
  } | null>(null);

  const beginEditDay = (d: ItineraryDay) => {
    const items = stopsOf(d, geoContext).map((s) => ({
      name: s.label,
      detail: d.stopDetails?.[s.label] ?? ''
    }));
    setEditingDay(d.dayNumber);
    setEditDraft({
      dayNumber: d.dayNumber,
      title: d.title,
      items: items.length > 0 ? items : [{ name: '', detail: '' }]
    });
  };

  const commitEditDraft = () => {
    if (!editDraft) return;
    const names = editDraft.items.map((i) => i.name.trim()).filter(Boolean);
    const details: Record<string, string> = {};
    editDraft.items.forEach((i) => {
      const n = i.name.trim();
      if (n && i.detail.trim()) details[n] = i.detail.trim();
    });
    updateDay(editDraft.dayNumber, {
      title: editDraft.title,
      morningActivity: names.join('\n'),
      afternoonActivity: '',
      eveningActivity: '',
      stopDetails: details
    });
    setEditingDay(null);
    setEditDraft(null);
  };

  // Trip cover picker (rendered on the trip card back on the Trips list)
  const [coverOpen, setCoverOpen] = useState(false);
  const [coverVer, setCoverVer] = useState(0);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const cover = getTripCover(itinerary.id); // eslint-disable-line react-hooks/exhaustive-deps -- coverVer forces re-read
  const coverOptions = useMemo(
    () =>
      [
        activityImageUrl(itinerary.destination, itinerary.destination, 'card'),
        ...itinerary.days.flatMap((d) => d.photos || [])
      ].slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itinerary.destination, itinerary.days, coverVer]
  );

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
  const photoDayRef = useRef<{ day: number; stop: string | null }>({ day: 0, stop: null }); // where the open file picker's photos go
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const dayDate = (idx: number): string => {
    const d = new Date(itinerary.startDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + idx);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const totalStops = useMemo(
    () => itinerary.days.reduce((n, d) => n + stopsOf(d, geoContext).length, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itinerary.days, geoContext, geoVer]
  );

  const updateDay = (dayNumber: number, patch: Partial<ItineraryDay>) => {
    onUpdateItinerary?.({
      ...itinerary,
      days: itinerary.days.map((d) => (d.dayNumber === dayNumber ? { ...d, ...patch } : d))
    });
  };

  /* Stop editing + reorder: positions are flattened across the day's three
     slots, so moving past a slot boundary naturally reassigns the slot. */
  const slotsOfDay = (d: ItineraryDay): string[][] => SLOT_KEYS.map(({ key }) => splitTasks(d[key]));
  const flatPositions = (d: ItineraryDay): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    SLOT_KEYS.forEach(({ key }, s) => splitTasks(d[key]).forEach((_, t) => out.push([s, t])));
    return out;
  };
  const commitSlots = (dayNumber: number, slots: string[][]) =>
    updateDay(dayNumber, {
      morningActivity: slots[0].join(' · '),
      afternoonActivity: slots[1].join(' · '),
      eveningActivity: slots[2].join(' · ')
    });

  const moveStop = (d: ItineraryDay, flatIdx: number, dir: -1 | 1) => {
    const slots = slotsOfDay(d);
    const flat = flatPositions(d);
    const a = flat[flatIdx];
    const b = flat[flatIdx + dir];
    if (!a || !b) return;
    const tmp = slots[a[0]][a[1]];
    slots[a[0]][a[1]] = slots[b[0]][b[1]];
    slots[b[0]][b[1]] = tmp;
    commitSlots(d.dayNumber, slots);
  };

  const renameStop = (d: ItineraryDay, flatIdx: number, newLabel: string) => {
    const slots = slotsOfDay(d);
    const pos = flatPositions(d)[flatIdx];
    if (!pos) return;
    const v = newLabel.trim();
    const oldLabel = slots[pos[0]][pos[1]];
    let detailsPatch: Record<string, string> | undefined;
    let photosPatch: Record<string, string[]> | undefined;
    let locPatch: Record<string, string> | undefined;
    if (!v) {
      slots[pos[0]].splice(pos[1], 1); // clearing the text removes the stop…
      if (d.stopDetails && oldLabel in d.stopDetails) {
        detailsPatch = { ...d.stopDetails };
        delete detailsPatch[oldLabel]; // …and its write-box notes go with it
      }
      if (d.stopPhotos && oldLabel in d.stopPhotos) {
        photosPatch = { ...d.stopPhotos };
        delete photosPatch[oldLabel]; // …and its photos too
      }
      if (d.locationOverrides && oldLabel in d.locationOverrides) {
        locPatch = { ...d.locationOverrides };
        delete locPatch[oldLabel]; // …and its pinpoint override
      }
    } else if (oldLabel === v) return;
    else {
      slots[pos[0]][pos[1]] = v;
      if (d.stopDetails && oldLabel in d.stopDetails) {
        detailsPatch = { ...d.stopDetails };
        detailsPatch[v] = detailsPatch[oldLabel];
        delete detailsPatch[oldLabel];
      }
      if (d.stopPhotos && oldLabel in d.stopPhotos) {
        photosPatch = { ...d.stopPhotos };
        photosPatch[v] = photosPatch[oldLabel];
        delete photosPatch[oldLabel];
      }
      if (d.locationOverrides && oldLabel in d.locationOverrides) {
        locPatch = { ...d.locationOverrides };
        locPatch[v] = locPatch[oldLabel];
        delete locPatch[oldLabel];
      }
    }
    updateDay(d.dayNumber, {
      morningActivity: slots[0].join(' · '),
      afternoonActivity: slots[1].join(' · '),
      eveningActivity: slots[2].join(' · '),
      ...(detailsPatch ? { stopDetails: detailsPatch } : {}),
      ...(photosPatch ? { stopPhotos: photosPatch } : {}),
      ...(locPatch ? { locationOverrides: locPatch } : {})
    });
  };

  /** Pinpoint override for one stop — address / street / postcode / coords. */
  const setStopLocation = (d: ItineraryDay, label: string, loc: string) =>
    updateDay(d.dayNumber, { locationOverrides: { ...(d.locationOverrides || {}), [label]: loc } });

  /* ── Exact pin resolution: a typed address is looked up live (building
     level, not city centroid), candidates drop down to pick from, and the
     chosen one is stored under its place NAME (or address — coordinates
     only when the place has neither) so the box stays human-readable. ── */
  const [locSuggest, setLocSuggest] = useState<{
    label: string;
    q: string;
    candidates: GeocodeCandidate[];
    best: GeocodeCandidate | null;
    searching: boolean;
  }>({ label: '', q: '', candidates: [], best: null, searching: false });

  /** Non-null when the override already resolves to an exact point. */
  const locOverrideGeo = (d: ItineraryDay, label: string) => {
    const v = (d.locationOverrides?.[label] || '').trim();
    return v ? geoForTask(v, geoContext) : null;
  };

  /** Human label for a pinned place: its name, else its address, else —
      only when neither exists — the raw coordinates. */
  const pinLabelFor = (c: GeocodeCandidate): string => {
    const name = (c.name || '').trim();
    if (name) return name;
    const addr = (c.address || '').trim();
    if (addr) return addr;
    return `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`;
  };

  const applyPin = (d: ItineraryDay, label: string, c: GeocodeCandidate) => {
    // Cache the exact point under every spelling involved (the full display,
    // the stop label and the stored label) so future lookups hit it instantly.
    const pin = pinLabelFor(c);
    storeGeocode(c.display, geoContext, c.lat, c.lng);
    storeGeocode(label, geoContext, c.lat, c.lng);
    storeGeocode(pin, geoContext, c.lat, c.lng);
    updateDay(d.dayNumber, { locationOverrides: { ...(d.locationOverrides || {}), [label]: pin } });
    setLocSuggest((s) => ({ ...s, candidates: [], best: null, searching: false }));
  };

  const resolvePin = (d: ItineraryDay, label: string) => {
    const v = (d.locationOverrides?.[label] || '').trim();
    if (!v) return;
    // Coordinates: exact already — just store under the stop label.
    const g = geoForTask(v, geoContext);
    if (/^\s*-?\d/.test(v) && g) {
      storeGeocode(label, geoContext, g.lat, g.lng);
      return;
    }
    setLocSuggest((s) => ({ ...s, label, q: v, searching: true, candidates: [], best: null }));
    void (async () => {
      const res = await geocodeAddress(v, geoContext);
      setLocSuggest((s) => {
        if (s.label !== label || s.q !== v) return { ...s, searching: false };
        if (res && res !== 'miss' && res.best) {
          // Pin immediately at the best match — exact for addresses.
          applyPinQuiet(label, res.best);
          return { ...s, searching: false, best: res.best, candidates: res.candidates.slice(1) };
        }
        // No building-level hit — fall back to the queued geocoder (city).
        requestGeocode(v, geoContext, isAddressQuery(v));
        return { ...s, searching: false, candidates: [], best: null };
      });
    })();
  };

  /** Store + pin without touching React state from inside the async callback. */
  const applyPinQuiet = (label: string, c: GeocodeCandidate) => {
    const pin = pinLabelFor(c);
    storeGeocode(c.display, geoContext, c.lat, c.lng);
    storeGeocode(label, geoContext, c.lat, c.lng);
    storeGeocode(pin, geoContext, c.lat, c.lng);
    const d = itinerary.days.find((x) => x.locationOverrides && label in x.locationOverrides);
    if (d) {
      updateDay(d.dayNumber, { locationOverrides: { ...(d.locationOverrides || {}), [label]: pin } });
    }
  };

  /** Write-box content for one stop (its own little note under the heading). */
  const setStopDetail = (d: ItineraryDay, label: string, detail: string) =>
    updateDay(d.dayNumber, { stopDetails: { ...(d.stopDetails || {}), [label]: detail } });

  /** "+ day" pill on the tab bar — appends a blank day and extends the trip. */
  const addDay = () => {
    const n = itinerary.days.length + 1;
    const end = new Date(itinerary.endDate);
    if (!isNaN(end.getTime())) end.setDate(end.getDate() + 1);
    onUpdateItinerary?.({
      ...itinerary,
      endDate: isNaN(end.getTime()) ? itinerary.endDate : end.toISOString().slice(0, 10),
      days: [
        ...itinerary.days,
        { dayNumber: n, title: '', morningActivity: '', afternoonActivity: '', eveningActivity: '' }
      ]
    });
    setActiveDay(n);
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const target = photoDayRef.current;
    const d = itinerary.days.find((x) => x.dayNumber === target.day);
    if (!d) return;
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 6)) {
      try {
        urls.push(await fileToDataUrl(f));
      } catch {
        /* skip unreadable files */
      }
    }
    if (!urls.length) return;
    if (target.stop) {
      // photos belong to this activity's own box under its heading
      updateDay(d.dayNumber, {
        stopPhotos: { ...(d.stopPhotos || {}), [target.stop]: [...(d.stopPhotos?.[target.stop] || []), ...urls] }
      });
    } else {
      updateDay(d.dayNumber, { photos: [...(d.photos || []), ...urls] });
    }
  };

  const pickCover = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    try {
      const url = await fileToDataUrl(files[0]);
      setTripCover(itinerary.id, url);
      setCoverVer((v) => v + 1);
    } catch {
      /* ignore */
    }
  };

  const focusDay = (n: number) => {
    setActiveDay(n);
    requestAnimationFrame(() => {
      dayRefs.current[n]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const pillCls = (active: boolean) =>
    `shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
      active
        ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 border-stone-950 dark:border-violet-400 shadow-md'
        : 'bg-white dark:bg-slate-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-600'
    }`;

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
            onClick={() => focusDay(d.dayNumber)}
            className={pillCls(activeDay === d.dayNumber)}
          >
            <span>{tv('dayN', { n: d.dayNumber })}</span>
            <span className={activeDay === d.dayNumber ? 'opacity-70' : 'text-stone-400'}>
              {dayDate(i)}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={addDay}
          title={getTranslation('addAnotherDay')}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-bold border border-dashed border-stone-300 dark:border-stone-600 text-stone-400 hover:text-violet-500 hover:border-violet-400 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
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

      {activeDay === 0 ? (
        /* ── Overview: checklist first, then the notebook for penning notes ── */
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
              onClick={() => setCoverOpen((v) => !v)}
              className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-2xl transition-all cursor-pointer shadow-xs ${
                coverOpen
                  ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950'
                  : 'text-stone-600 dark:text-stone-300 bg-white dark:bg-slate-900 border border-stone-200 dark:border-stone-700 hover:border-violet-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{getTranslation('coverBtn')}</span>
            </button>
            <button
              type="button"
              onClick={onEditTrip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:scale-[1.03] transition-all cursor-pointer shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{getTranslation('editTrip')}</span>
            </button>
          </div>

          {/* Cover picker — the chosen picture becomes the trip card background */}
          {coverOpen && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {getTranslation('coverChoose')}
              </div>
              <div className="flex flex-wrap gap-2">
                {coverOptions.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setTripCover(itinerary.id, url);
                      setCoverVer((v) => v + 1);
                    }}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      cover === url
                        ? 'border-violet-500 ring-2 ring-violet-300'
                        : 'border-transparent hover:border-violet-300'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {cover === url && (
                      <span className="absolute inset-0 flex items-center justify-center bg-stone-950/30">
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  className="w-20 h-14 rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-600 text-stone-400 hover:text-violet-500 hover:border-violet-400 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span className="text-[9px] font-bold">{getTranslation('coverUpload')}</span>
                </button>
              </div>
              <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pickCover(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
          )}

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

          {/* Trip notebook — no edit button: tap the box and write */}
          <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
              <NotebookPen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{getTranslation('myNotes')}</span>
            </div>
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

          {/* Day summary chips — tap to jump into that day */}
          <div className="grid gap-2 sm:grid-cols-2">
            {itinerary.days.map((d, i) => {
              const dayStops = stopsOf(d, geoContext);
              return (
                <button
                  key={d.dayNumber}
                  type="button"
                  onClick={() => focusDay(d.dayNumber)}
                  className="flex items-center gap-3 p-3 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all cursor-pointer min-w-0"
                >
                  <span
                    className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 shadow-sm"
                    style={{ backgroundColor: dayRouteColor(d.dayNumber) }}
                    aria-hidden
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
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
        /* ── All days on one dotted-line timeline: a heading + a remark box per
             day. Double-tap a day card to edit its heading and activities. ── */
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-stone-400 dark:text-stone-500 mb-2 pl-11">
            {getTranslation('dblTapHint')}
          </p>
          <div className="relative">
            {/* the dotted line linking every day's heading */}
            <span
              className="absolute left-[15px] top-4 bottom-4 border-l-2 border-dotted border-stone-300 dark:border-stone-600"
              aria-hidden
            />
            <div className="space-y-4">
              {itinerary.days.map((d, dayIdx) => {
                const dayColor = dayRouteColor(d.dayNumber);
                const stops = stopsOf(d, geoContext);
                const legs = legsOf(d, geoContext);
                const editing = editingDay === d.dayNumber;
                return (
                  <div
                    key={d.dayNumber}
                    ref={(el) => {
                      dayRefs.current[d.dayNumber] = el;
                    }}
                    className="relative pl-11 scroll-mt-24"
                  >
                    {/* Day badge sitting on the dotted line — a calendar marks
                        the DAY so its number never fights the 1-2-3 activity
                        numbers inside the card. Tap to focus the map. */}
                    <button
                      type="button"
                      onClick={() => setActiveDay(d.dayNumber)}
                      className="absolute left-0 top-3.5 w-8 h-8 rounded-full text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform z-10"
                      style={{ backgroundColor: dayColor }}
                      aria-label={tv('dayN', { n: d.dayNumber })}
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>

                    <div
                      onDoubleClick={(e) => {
                        const t = e.target as HTMLElement;
                        if (t.closest('textarea, input, button, a, img')) return;
                        beginEditDay(d);
                      }}
                      className={`rounded-2xl border bg-white dark:bg-slate-900 p-4 space-y-3 min-w-0 [touch-action:manipulation] transition-shadow ${
                        editing
                          ? 'border-violet-200 dark:border-violet-800/70 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      {/* Heading — and DIRECTLY below it one heading + write box
                          per activity. Display: heading + notes box + picture +
                          stop bullets (each with its own box). Edit (double-tap):
                          a heading input, then per activity a name field with its
                          own box below — never one shared box for all headings. */}
                      {editing && editDraft && editDraft.dayNumber === d.dayNumber ? (
                        <>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editDraft.title}
                              onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                              placeholder={getTranslation('jdTitlePh')}
                              autoFocus
                              className="flex-1 min-w-0 py-1.5 bg-transparent border-b-2 border-violet-200 dark:border-violet-800 font-display text-base font-bold text-stone-950 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:border-violet-400 transition-colors"
                            />
                            <button
                              type="button"
                              onClick={commitEditDraft}
                              className="w-8 h-8 shrink-0 rounded-full bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
                              title={getTranslation('saveAllChanges')}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            {editDraft.items.map((it, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="rounded-xl bg-stone-50/80 dark:bg-slate-800/40 px-3 py-2 border border-stone-200/70 dark:border-slate-700/50"
                              >
                                {/* one box per activity: the name is the box's
                                    header row, its note sits right under it */}
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: dayColor }}
                                  >
                                    {itemIdx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={it.name}
                                    onChange={(e) =>
                                      setEditDraft({
                                        ...editDraft,
                                        items: editDraft.items.map((x, j) =>
                                          j === itemIdx ? { ...x, name: e.target.value } : x
                                        )
                                      })
                                    }
                                    placeholder={getTranslation('jdNamePh')}
                                    className="flex-1 min-w-0 py-1 bg-transparent border-b border-transparent focus:border-violet-400 text-xs font-semibold text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none transition-colors"
                                  />
                                  {editDraft.items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditDraft({
                                          ...editDraft,
                                          items: editDraft.items.filter((_, j) => j !== itemIdx)
                                        })
                                      }
                                      className="p-1 text-stone-400 hover:text-red-500 shrink-0 cursor-pointer"
                                      title="Remove activity"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                <textarea
                                  rows={2}
                                  value={it.detail}
                                  onChange={(e) =>
                                    setEditDraft({
                                      ...editDraft,
                                      items: editDraft.items.map((x, j) =>
                                        j === itemIdx ? { ...x, detail: e.target.value } : x
                                      )
                                    })
                                  }
                                  placeholder={getTranslation('jdStopNotePh')}
                                  className="w-full mt-1 pt-1.5 bg-transparent border-t border-dashed border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-stone-50 placeholder:text-stone-400 leading-relaxed focus:outline-none resize-none"
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setEditDraft({
                                  ...editDraft,
                                  items: [...editDraft.items, { name: '', detail: '' }]
                                })
                              }
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-stone-500 dark:text-stone-400 bg-white dark:bg-slate-900 border border-dashed border-stone-300 dark:border-stone-600 rounded-xl hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{getTranslation('jdAddActivity')}</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex-1 min-w-0 font-display text-base font-bold text-stone-950 dark:text-stone-50 truncate">
                            {d.title || tv('dayN', { n: d.dayNumber })}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRescueDay(d);
                            }}
                            disabled={stops.length < 2}
                            className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="AI day planner — rescue this day or optimize its route"
                          >
                            <Sparkles className="w-3 h-3" />
                            Rescue
                          </button>
                          <span className="text-[11px] font-medium text-stone-400 shrink-0">
                            {dayDate(dayIdx)} · {tv('jdStops', { n: stops.length })}
                          </span>
                        </div>
                      )}

                      {stops.length === 0 && !editing && (
                        <div className="p-4 text-center text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-slate-800/50 border border-dashed border-stone-300 dark:border-stone-700 rounded-xl">
                          {getTranslation('jdEmptyDay')}
                        </div>
                      )}

                      {!editing &&
                        stops.map((stop, idx) => {
                          const cat = categorize(stop.label);
                          const meta = CAT_META[cat];
                          const leg = idx > 0 ? legs[idx - 1] : null;
                          const LegIcon = leg ? modeIcon(leg.mode) : null;
                          const legPickerKey = leg ? `${d.dayNumber}|${leg.from}→${leg.to}` : '';
                          const legStoreKey = leg ? `${leg.from}→${leg.to}` : '';
                          return (
                            <React.Fragment key={`${idx}_${stop.label}`}>
                              {idx > 0 && (
                                <div className="pl-4 py-0.5 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="w-px h-3.5 border-l-2 border-dotted border-stone-300 dark:border-stone-600 ml-[13px]" />
                                    {leg && LegIcon && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setOpenLegPicker((cur) => (cur === legPickerKey ? null : legPickerKey))
                                        }
                                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-stone-500 dark:text-stone-400 bg-stone-100/80 dark:bg-stone-800/60 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-700 dark:hover:text-violet-300 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                                        title={getTranslation('travelModeTitle')}
                                      >
                                        <LegIcon className="w-3 h-3" />
                                        {tv('jdLeg', { km: leg.km.toFixed(1), min: leg.minutes })}
                                      </button>
                                    )}
                                  </div>
                                  {/* Inline transport picker — tap the leg chip, pick a mode,
                                      compare the minutes, choose what suits best */}
                                  {leg && openLegPicker === legPickerKey && (
                                    <div className="flex flex-wrap gap-1 ml-7">
                                      {LEG_MODE_CHOICES.map(({ mode, labelKey }) => {
                                        const MIcon = modeIcon(mode);
                                        const active = leg.mode === mode;
                                        const mins = estimateLegForMode(leg.km, mode);
                                        return (
                                          <button
                                            key={mode}
                                            type="button"
                                            onClick={() => chooseLegMode(d, legStoreKey, mode)}
                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                                              active
                                                ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 border-transparent'
                                                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-violet-400'
                                            }`}
                                          >
                                            <MIcon className="w-3 h-3" />
                                            <span>{getTranslation(labelKey)}</span>
                                            <span className={`font-mono tabular-nums text-[9px] ${active ? 'opacity-70' : 'text-stone-400'}`}>
                                              ~{mins}m
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Stop bullet — heading + its own write box below;
                                  swipe left to delete the whole bullet */}
                              <SwipeableStop onDelete={() => renameStop(d, idx, '')}>
                                <div className="p-2.5 bg-stone-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm"
                                      style={{ backgroundColor: dayColor }}
                                    >
                                      {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <span className="text-xs font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                                        {stop.label}
                                      </span>
                                      <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${meta.cls}`}
                                      >
                                        {getTranslation(meta.key)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => toggleImportance(stop.label)}
                                        className="shrink-0 cursor-pointer ml-auto"
                                        title={stopImportance[stop.label] === 2 ? 'Must-see (tap to unstar)' : 'Mark as must-see for Trip Rescue'}
                                        aria-label={`Must-see ${stop.label}`}
                                      >
                                        <Star
                                          className={`w-3.5 h-3.5 transition-colors ${
                                            stopImportance[stop.label] === 2
                                              ? 'fill-amber-400 text-amber-400'
                                              : 'text-stone-300 dark:text-stone-600 hover:text-amber-400'
                                          }`}
                                        />
                                      </button>
                                    </div>
                                    {/* move the activity up / down (across slots too) */}
                                    <span className="flex flex-col shrink-0 -my-1">
                                      <button
                                        type="button"
                                        onClick={() => moveStop(d, idx, -1)}
                                        disabled={idx === 0}
                                        className="p-1 text-stone-400 hover:text-violet-500 disabled:opacity-25 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                                        aria-label="Move up"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveStop(d, idx, 1)}
                                        disabled={idx === stops.length - 1}
                                        className="p-1 text-stone-400 hover:text-violet-500 disabled:opacity-25 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                                        aria-label="Move down"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </span>
                                  </div>
                                  {/* notes + photos for this activity — flat, no nested box;
                                      write straight in, saves as you type */}
                                  <div className="border-t border-dashed border-stone-200 dark:border-slate-700 pt-1.5">
                                    <textarea
                                      value={d.stopDetails?.[stop.label] ?? ''}
                                      onChange={(e) => setStopDetail(d, stop.label, e.target.value)}
                                      placeholder={getTranslation('jdStopNotePh')}
                                      rows={Math.max(1, (d.stopDetails?.[stop.label] ?? '').split('\n').length)}
                                      className="w-full py-1 bg-transparent text-[11px] text-stone-800 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 leading-relaxed resize-none focus:outline-none"
                                    />
                                    {/* pinpoint box — type an address, street,
                                        postcode or coordinates and the map pins
                                        the EXACT spot; candidates drop down so
                                        you pick the right one */}
                                    <div className="relative">
                                      <div className="flex items-center gap-1.5 pb-1">
                                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                        <input
                                          type="text"
                                          value={d.locationOverrides?.[stop.label] ?? ''}
                                          onChange={(e) => {
                                            setStopLocation(d, stop.label, e.target.value);
                                            const v = e.target.value.trim();
                                            if (locSuggest.label !== stop.label || locSuggest.q !== v) {
                                              setLocSuggest((s) => ({ ...s, label: stop.label, q: v, candidates: [], best: null, searching: false }));
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              const sug = locSuggest;
                                              if (sug.label === stop.label && sug.best) {
                                                applyPin(d, stop.label, sug.best);
                                              } else {
                                                (e.target as HTMLInputElement).blur();
                                              }
                                            }
                                          }}
                                          onBlur={() => resolvePin(d, stop.label)}
                                          placeholder={getTranslation('jdLocationPh')}
                                          className="flex-1 min-w-0 py-0.5 bg-transparent text-[10px] text-stone-600 dark:text-stone-300 placeholder:text-stone-400/70 dark:placeholder:text-stone-500 focus:outline-none border-b border-transparent focus:border-violet-400 transition-colors"
                                        />
                                        {locSuggest.label === stop.label && locSuggest.searching && (
                                          <span className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin shrink-0" aria-label="Locating" />
                                        )}
                                        {locSuggest.label === stop.label && !locSuggest.searching && (locOverrideGeo(d, stop.label) ? locSuggest.best || geoForTask((d.locationOverrides?.[stop.label] || '').trim(), geoContext) : null) && (
                                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0" title={typeof (locSuggest.best?.display) === 'string' ? locSuggest.best!.display : 'Pinned'}>
                                            ✓ precise pin
                                          </span>
                                        )}
                                      </div>
                                      {locSuggest.label === stop.label && locSuggest.candidates.length > 0 && (
                                        <div className="absolute left-4 right-0 top-full mt-0.5 z-30 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                                          {locSuggest.candidates.map((c, ci) => (
                                            <button
                                              key={ci}
                                              type="button"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                applyPin(d, stop.label, c);
                                              }}
                                              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
                                            >
                                              <MapPin className="w-3 h-3 text-violet-500 shrink-0" />
                                              <span className="flex-1 min-w-0 text-[10px] text-stone-700 dark:text-stone-200 truncate">{c.display}</span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    {(d.stopPhotos?.[stop.label] || []).length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 pb-1">
                                        {(d.stopPhotos?.[stop.label] || []).map((url, pi) => (
                                          <span key={pi} className="relative group">
                                            <img
                                              src={url}
                                              alt=""
                                              className="w-14 h-14 rounded-lg object-cover border border-stone-200 dark:border-stone-700"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                updateDay(d.dayNumber, {
                                                  stopPhotos: {
                                                    ...(d.stopPhotos || {}),
                                                    [stop.label]: (d.stopPhotos?.[stop.label] || []).filter((_, j) => j !== pi)
                                                  }
                                                })
                                              }
                                              className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-stone-900 text-white items-center justify-center hidden group-hover:flex"
                                              aria-label="Remove photo"
                                            >
                                              <X className="w-2.5 h-2.5" />
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div className={`flex items-center ${(d.stopPhotos?.[stop.label] || []).length > 0 ? 'pb-1' : ''}`}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          photoDayRef.current = { day: d.dayNumber, stop: stop.label };
                                          fileInputRef.current?.click();
                                        }}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                                      >
                                        <ImagePlus className="w-3 h-3" />
                                        <span>{getTranslation('jdAddPhoto')}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </SwipeableStop>
                            </React.Fragment>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
        </div>
      )}

      {/* Trip Rescue (AI day planner) — pick the best of a broken day, or
          re-order the whole day for least travel. */}
      {rescueDay && (
        <TripRescueModal
          day={rescueDay}
          dayDateLabel={dayDate(Math.max(0, itinerary.days.findIndex((d) => d.dayNumber === rescueDay.dayNumber)))}
          geoContext={geoContext}
          importance={stopImportance}
          onToggleImportance={toggleImportance}
          onApply={(slots) => applyRescue(rescueDay.dayNumber, slots)}
          onClose={() => setRescueDay(null)}
        />
      )}
    </div>
  );
};

export default JourneyBoard;
