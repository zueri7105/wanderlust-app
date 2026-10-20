import React, { useState, useEffect, useRef } from 'react';
import { TravelItinerary, SoloTraveler, ItineraryDay, TravelGuideInfo, TripScope } from '../types/travel';
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
import { getFxRates, refreshFxRates, benchmarkString, rateFor, type FxState } from '../utils/currency';
import { getTranslation, tv } from '../utils/i18n';
import AutoGrowTextarea from './AutoGrowTextarea';
import { WORLD_COUNTRIES } from './DestinationSelector';
import { TripRouteMap } from './TripRouteMap';
import { findPlaceGeo, estimateLeg, optimizeStopOrder, type TravelMode } from '../utils/placeGeo';

interface ItineraryViewProps {
  itineraries: TravelItinerary[];
  currentUser: SoloTraveler;
  onAddItinerary: (itinerary: TravelItinerary) => void;
  onUpdateItinerary?: (itinerary: TravelItinerary) => void;
  onDeleteItinerary?: (id: string) => void;
  onGoToCompanions?: (destination: string) => void;
  onGoToExploreTrips?: (destination: string) => void;
  onGoToActivities?: (destination: string) => void;
  onOpenChatWithCompanion?: (travelerId: string) => void;
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

export function resolveDestinationCurrency(itinerary: TravelItinerary) {
  const guideCurr = itinerary.travelGuide?.specificCurrency;
  const destLower = (itinerary.destination + ' ' + (itinerary.country || '')).toLowerCase();

  // If destination is Japan
  if (destLower.includes('japan') || destLower.includes('kyoto') || destLower.includes('tokyo') || destLower.includes('osaka')) {
    return {
      code: 'JPY',
      name: 'Japanese Yen (¥ / JPY)',
      symbol: '¥',
      rateBenchmark: '1 USD ≈ ¥152.00 · 1 EUR ≈ ¥165.50',
      cardAcceptance: 'Cards and Suica/Pasmo IC accepted at convenience stores & stations; carry ¥10,000–¥20,000 cash for historic shrines & ramen stalls.',
      tippingRules: 'Strictly zero tipping. Polite thanks ("Gochisousama deshita") is proper appreciation.'
    };
  }

  // If guide has an accurate non-default code matching non-Japan destinations
  if (guideCurr?.code && guideCurr.code !== 'JPY') {
    return guideCurr;
  }

  // Exact mapping by destination name and country
  if (destLower.includes('croatia') || destLower.includes('dubrovnik') || destLower.includes('split')) {
    return {
      code: 'EUR',
      name: 'Euro (€)',
      symbol: '€',
      rateBenchmark: '1 EUR ≈ 1.09 USD · 1 EUR ≈ 0.86 GBP (HRK phased out 2023)',
      cardAcceptance: 'Universal card acceptance in restaurants, Old Town shops, and museums. Keep €20 cash for island ferries & fruit stalls.',
      tippingRules: 'Service charge not itemized. Rounding up to nearest Euro or leaving 10% is customary.'
    };
  }

  if (
    destLower.includes('spain') ||
    destLower.includes('madrid') ||
    destLower.includes('seville') ||
    destLower.includes('barcelona') ||
    destLower.includes('italy') ||
    destLower.includes('amalfi') ||
    destLower.includes('rome') ||
    destLower.includes('france') ||
    destLower.includes('paris') ||
    destLower.includes('germany') ||
    destLower.includes('greece') ||
    destLower.includes('portugal') ||
    destLower.includes('lisbon') ||
    destLower.includes('austria') ||
    destLower.includes('netherlands') ||
    destLower.includes('amsterdam')
  ) {
    return {
      code: 'EUR',
      name: 'Euro (€)',
      symbol: '€',
      rateBenchmark: '1 EUR ≈ 1.09 USD · 1 EUR ≈ 0.86 GBP',
      cardAcceptance: 'Contactless cards and Apple/Google Pay accepted universally from transport turnstiles to neighborhood cafes.',
      tippingRules: 'Service included by law. Rounding up or leaving small change is appreciated.'
    };
  }

  if (destLower.includes('mexico') || destLower.includes('oaxaca') || destLower.includes('cancun')) {
    return {
      code: 'MXN',
      name: 'Mexican Peso ($ / MXN)',
      symbol: '$',
      rateBenchmark: '1 USD ≈ 19.80 MXN · 1 EUR ≈ 21.50 MXN',
      cardAcceptance: 'Cash essential ($500–$1,000 MXN in small bills) for food markets, street tacos, artisan mezcal, and colectivos.',
      tippingRules: 'La propina: 10%–15% is standard for good table service in sit-down restaurants.'
    };
  }

  if (destLower.includes('uk') || destLower.includes('london') || destLower.includes('scotland') || destLower.includes('britain') || destLower.includes('england')) {
    return {
      code: 'GBP',
      name: 'British Pound (£)',
      symbol: '£',
      rateBenchmark: '1 GBP ≈ 1.30 USD · 1 GBP ≈ 1.18 EUR',
      cardAcceptance: 'Almost completely cashless; tap phone or contactless card on Tube, black cabs, and pubs.',
      tippingRules: 'Discretionary 12.5% service charge usually included on restaurant bills.'
    };
  }

  if (destLower.includes('swiss') || destLower.includes('switzerland') || destLower.includes('grindelwald') || destLower.includes('zurich')) {
    return {
      code: 'CHF',
      name: 'Swiss Franc (CHF / Fr.)',
      symbol: 'Fr.',
      rateBenchmark: '1 CHF ≈ 1.13 USD · 1 CHF ≈ 1.05 EUR',
      cardAcceptance: 'Cards and mobile pay accepted everywhere including alpine gondolas and mountain huts.',
      tippingRules: 'Service included by law. Rounding up to next 5 Francs on a meal is appreciated.'
    };
  }

  if (destLower.includes('china') || destLower.includes('shanghai') || destLower.includes('beijing')) {
    return {
      code: 'CNY',
      name: 'Chinese Yuan (¥ / RMB)',
      symbol: '¥',
      rateBenchmark: '1 USD ≈ ¥7.15 CNY · 1 EUR ≈ ¥7.80 CNY',
      cardAcceptance: 'Fully digital cashless: bind foreign credit card to Alipay or WeChat Pay before arrival.',
      tippingRules: 'Strictly no tipping.'
    };
  }

  if (destLower.includes('thailand') || destLower.includes('bangkok') || destLower.includes('chiang mai')) {
    return {
      code: 'THB',
      name: 'Thai Baht (฿ / THB)',
      symbol: '฿',
      rateBenchmark: '1 USD ≈ 34.5 THB · 1 EUR ≈ 37.5 THB',
      cardAcceptance: 'Cash is king for street night markets, songthaews, and island longtail boats. Cards accepted in malls and hotels.',
      tippingRules: 'Tipping is not customary; rounding up 20–50 Baht for pleasant table dining is appreciated.'
    };
  }

  if (destLower.includes('vietnam') || destLower.includes('hanoi') || destLower.includes('da nang')) {
    return {
      code: 'VND',
      name: 'Vietnamese Dong (₫ / VND)',
      symbol: '₫',
      rateBenchmark: '1 USD ≈ 25,400 VND · 1 EUR ≈ 27,500 VND',
      cardAcceptance: 'Cash essential for street pho stalls and cyclo rides. ATMs widely available in cities.',
      tippingRules: 'Not expected; small change left at cafes is appreciated.'
    };
  }

  if (destLower.includes('indonesia') || destLower.includes('bali')) {
    return {
      code: 'IDR',
      name: 'Indonesian Rupiah (Rp / IDR)',
      symbol: 'Rp',
      rateBenchmark: '1 USD ≈ 15,800 IDR · 1 EUR ≈ 17,200 IDR',
      cardAcceptance: 'Cash needed for warungs, temple sarong rentals, and scooter parking. Cards accepted in beach clubs.',
      tippingRules: '5-10% appreciated for good service if service charge is not on the bill.'
    };
  }

  if (destLower.includes('korea') || destLower.includes('seoul')) {
    return {
      code: 'KRW',
      name: 'South Korean Won (₩ / KRW)',
      symbol: '₩',
      rateBenchmark: '1 USD ≈ ₩1,380 KRW · 1 EUR ≈ ₩1,500 KRW',
      cardAcceptance: 'Almost cashless; credit cards and T-Money transport cards accepted universally.',
      tippingRules: 'Strictly no tipping.'
    };
  }

  if (destLower.includes('australia') || destLower.includes('sydney')) {
    return {
      code: 'AUD',
      name: 'Australian Dollar (A$ / AUD)',
      symbol: 'A$',
      rateBenchmark: '1 AUD ≈ 0.65 USD',
      cardAcceptance: 'Contactless cards and Apple/Google Pay accepted everywhere.',
      tippingRules: 'No tipping required or expected.'
    };
  }

  if (destLower.includes('canada') || destLower.includes('vancouver') || destLower.includes('toronto')) {
    return {
      code: 'CAD',
      name: 'Canadian Dollar (CA$ / CAD)',
      symbol: 'CA$',
      rateBenchmark: '1 CAD ≈ 0.72 USD',
      cardAcceptance: 'Tap to pay everywhere from taxis to coffee shops.',
      tippingRules: '15-18% standard tipping for table dining.'
    };
  }

  // Any other recognised country: use its own currency (never default to USD)
  const kbFallback = lookupCountryGuide(destLower);
  if (kbFallback.key !== 'generic') {
    return {
      code: kbFallback.currencyCode,
      name: `${kbFallback.currencyName} (${kbFallback.currencySymbol} / ${kbFallback.currencyCode})`,
      symbol: kbFallback.currencySymbol,
      rateBenchmark: '',
      cardAcceptance: cardAcceptanceForCountry(destLower),
      tippingRules: tippingForCountry(destLower)
    };
  }

  return {
    code: 'USD',
    name: 'US Dollar ($)',
    symbol: '$',
    rateBenchmark: '1 USD = $1.00 USD',
    cardAcceptance: 'Cards accepted at all major establishments.',
    tippingRules: '15%–20% standard table tipping in North America; check local destination customs.'
  };
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

/** Default packing checklist — connectivity essentials only; travelers add their own items. */
const DEFAULT_PACKING_ITEMS = [
  'Pocket WiFi / eSIM (stay connected everywhere)',
  'Power bank (10,000mAh+ for full-day exploring)'
];

/** Deterministic small hash for per-city weather variation on multi-city trips. */
const hashStr = (s: string): number => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** Shift every °C value in a temperature string by delta degrees. */
const shiftCelsius = (s: string, delta: number): string =>
  s.replace(/(-?\d+)\s*°C/g, (_m, n) => `${Number(n) + delta}°C`);

const CITY_CONDITION_VARIANTS = [
  'Expect sunny intervals with pleasant afternoons.',
  'Mostly clear skies with a light local breeze.',
  'Passing clouds with mild, comfortable temperatures.',
  'Bright mornings giving way to cooler evenings.',
  'Occasional short showers possible — pack a light layer.'
];

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
  drive: { Icon: Car, labelKey: 'modeDrive' }
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
}

// Timeline day card with swipe-left-to-delete (pointer-driven, works on touch + mouse)
const SwipeableDayCard: React.FC<SwipeableDayCardProps> = ({ day, canDelete, onDelete, destination = '', onOptimize, optimized }) => {
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
            <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 text-white flex items-center justify-center font-display font-extrabold text-sm shadow-md shadow-orange-500/30 shrink-0">
              {day.dayNumber}
            </div>
            <div
              className="flex-1 w-[3px] rounded-full mt-1"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(251,113,133,0.95), rgba(251,146,60,0.55), rgba(254,205,170,0.12))'
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

            {day.companionGoal && (
              <div className="flex items-start gap-2 text-[11px] bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-xl px-3 py-2">
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-emerald-900 dark:text-emerald-200">
                  <strong className="font-semibold">{getTranslation('companionshipGoal')}</strong> {day.companionGoal}
                </span>
              </div>
            )}
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
  onAddItinerary,
  onUpdateItinerary,
  onDeleteItinerary,
  onGoToCompanions,
  onGoToExploreTrips,
  onGoToActivities
}) => {
  // Sort itineraries top to bottom by earlier start date
  const sortedItineraries = [...itineraries].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Do not automatically expand any trip box on open; only expand when tapped as requested
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

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

  // Visa details popup — full visa paragraph + entry customs, on demand
  const [visaPopupItinId, setVisaPopupItinId] = useState<string | null>(null);

  // Tax-refund tips popup — the country name whose tax guide is open
  const [taxTipsCountry, setTaxTipsCountry] = useState<string | null>(null);

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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  // Live FX rates — refreshed from the API on mount, cached 6h, offline fallback estimates
  const [fx, setFx] = useState<FxState>(() => getFxRates());
  useEffect(() => {
    let alive = true;
    refreshFxRates().then((s) => {
      if (alive) setFx(s);
    });
    return () => {
      alive = false;
    };
  }, []);

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
      {/* ── Pi-Travel-style hero + creation hub ─────────────────────────── */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 sm:-mt-10 px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-8 bg-gradient-to-b from-sky-100/90 via-sky-50/60 to-transparent dark:from-sky-950/50 dark:via-slate-950/20">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
            {getTranslation('heroPlannerTitle')}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            {getTranslation('heroPlannerSub')}
          </p>

          {/* Creation card — quick create / parse a guide */}
          <div className="mt-6 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-700 rounded-2xl shadow-lg shadow-sky-100/60 dark:shadow-none p-4 sm:p-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setCreateTab('quick')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  createTab === 'quick'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
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
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
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
                  className="flex-1 min-w-0 px-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/60 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
                <button
                  type="button"
                  onClick={handleQuickCreate}
                  className="w-11 h-11 rounded-xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md shadow-sky-500/30 shrink-0"
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
                  className="w-full px-4 py-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/60 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseImport}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors cursor-pointer shadow-md shadow-sky-500/30"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{getTranslation('parseGuideBtn')}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                {getTranslation('manualCreateLink')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* My trips */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
          {getTranslation('myTripsTitle')}
        </h2>
        <span className="text-xs font-medium text-slate-400 font-mono tabular-nums">
          {sortedItineraries.length}
        </span>
      </div>

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
            className="mt-4 inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{getTranslation('createItineraryBox')}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedItineraries.map((itinerary) => {
            const isExpanded = !!expandedIds[itinerary.id];
            // Country knowledge overlay — keeps rules, customs, phrases & currency aligned
            // with the destination even for itineraries saved before the knowledge base existed.
            const guideKb = lookupCountryGuide(`${itinerary.destination} ${itinerary.country || ''}`);
            const guideNat = itinerary.travelGuide?.travelerNationality || currentUser.country || 'Germany';
            // Concrete apps locals actually use + emergency numbers for this destination
            const guideApps = travelAppsFor(`${itinerary.destination} ${itinerary.country || ''}`);
            const guideEmergency = emergencyNumbersFor(
              `${itinerary.country || ''} ${itinerary.destination}`
            );
            // Traveller nationality's home currency (for the dual exchange-rate display)
            const natCurrency = countryInfoFor(guideNat)?.currency || { code: 'EUR', symbol: '€', name: 'Euro' };
            const visaVerdict = visaVerdictFor(guideNat, `${itinerary.country || ''} ${itinerary.destination}`);
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
                  onClick={() =>
                    setExpandedIds((prev) => ({
                      ...prev,
                      [itinerary.id]: !prev[itinerary.id]
                    }))
                  }
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer bg-gradient-to-r from-sky-50/70 via-cyan-50/40 to-transparent dark:from-sky-950/30 dark:via-cyan-950/15 dark:to-transparent hover:from-sky-50 hover:via-cyan-50/60 dark:hover:from-sky-950/40 transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex flex-col items-center justify-center shrink-0 shadow-xs shadow-emerald-500/30">
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
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
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
                          className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:brightness-105 cursor-pointer shadow-xs shrink-0"
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
                                ? 'text-white bg-emerald-600 hover:brightness-105'
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-lg hover:brightness-105 cursor-pointer shadow-xs"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>{getTranslation('editTrip')}</span>
                          </button>
                        </div>
                      </div>

                      {/* 圆周旅迹-style day route map: numbered stops + connecting lines */}
                      {routeMapOpenFor === itinerary.id && (
                        <TripRouteMap days={itinerary.days} destination={itinerary.destination} />
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
                          />
                        ))}
                      </div>
                    </div>

                    {/* Enriched Travel Guide Box */}
                    {itinerary.travelGuide && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 space-y-6 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                                {getTranslation('travelGuideLabel')} · {itinerary.travelGuide.destinationCity || itinerary.destination.split(',')[0]} ({itinerary.travelGuide.destinationCountry})
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {getTranslation('verifiedRun')}{' '}
                                <strong className="text-slate-800 dark:text-slate-200">{itinerary.travelGuide.travelerNationality}</strong>
                              </p>
                            </div>
                          </div>

                          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md self-start sm:self-auto">
                            {getTranslation('verifiedGuide')}
                          </span>
                        </div>

                        {/* Visa & Entry — short verdict strip; details live in a popup */}
                        <div className="p-4 sm:p-5 bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
                              <Stamp className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {getTranslation('visaEntryLabel')} · {guideKb.name}
                              </div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                                {tv('forPassport', { nat: guideNat })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                visaVerdict.tone === 'free'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : visaVerdict.tone === 'online'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {visaVerdict.tone === 'free' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                              <span>{visaVerdict.verdict}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setVisaPopupItinId(itinerary.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
                            >
                              {getTranslation('moreDetails')}
                            </button>
                          </div>
                        </div>

                        {/* Top Highlights: City Weather Outlook & Checklist */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* City-Specific Weather Outlook (Microclimate & Period Trends) */}
                          <div className="p-4 sm:p-5 bg-gradient-to-br from-sky-50 via-orange-50/60 to-amber-50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 border border-sky-100 dark:border-slate-700 rounded-xl space-y-2.5 text-xs">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                              <CloudSun className="w-4 h-4 text-amber-600" />
                              <span>{getTranslation('cityWeather')}</span>
                            </div>

                            {/* Multi-city trips: one weather card per city */}
                            {itinerary.cities && itinerary.cities.length > 1 ? (
                              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                {itinerary.cities.map((cityName, cityIdx) => {
                                  const base = itinerary.travelGuide.weatherOutlook;
                                  const shift = ((hashStr(cityName) % 5) - 2); // -2..+2 °C variation per city
                                  const conditions = CITY_CONDITION_VARIANTS[hashStr(cityName) % CITY_CONDITION_VARIANTS.length];
                                  return (
                                    <div
                                      key={cityName}
                                      className="bg-white/80 dark:bg-slate-800/70 border border-sky-100 dark:border-slate-700 rounded-xl p-3 space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                                          <MapPin className="w-3 h-3 text-rose-500" />
                                          {cityName}
                                        </span>
                                        <span className="font-mono tabular-nums font-bold text-slate-950 dark:text-slate-50 text-[11px]">
                                          {formatTemperature(shiftCelsius(base?.temperatureRange || '14°C – 23°C', shift))}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                                        <div className="bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                                          <span className="text-amber-700 dark:text-amber-400">{getTranslation('dayShort')}</span>{' '}
                                          <span className="font-bold text-amber-900 dark:text-amber-200">{formatTemperature(shiftCelsius(base?.daytimeAvg || '20°C', shift))}</span>
                                        </div>
                                        <div className="bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800">
                                          <span className="text-indigo-500 dark:text-indigo-400">{getTranslation('nightShort')}</span>{' '}
                                          <span className="font-bold text-indigo-900 dark:text-indigo-200">{formatTemperature(shiftCelsius(base?.nighttimeAvg || '13°C', shift))}</span>
                                        </div>
                                      </div>
                                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {base?.conditions ? `${base.conditions} ` : ''}{conditions}
                                      </p>
                                      {cityIdx === 0 && base?.clothingAdvice && (
                                        <p className="text-[10px] text-amber-800 dark:text-amber-300">
                                          <strong>{getTranslation('clothingRoute')}</strong> {base.clothingAdvice}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                            <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">{getTranslation('locationLabel')}</span>{' '}
                                {itinerary.travelGuide.weatherOutlook?.cityName || itinerary.travelGuide.destinationCity || itinerary.destination}
                              </div>
                              <div className="font-mono tabular-nums text-slate-950 dark:text-slate-50 font-bold text-sm">
                                {getTranslation('tempRange')} {formatTemperature(itinerary.travelGuide.weatherOutlook?.temperatureRange || '14°C – 23°C')}
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 text-[11px] font-mono">
                                <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                                  <span className="text-amber-700 dark:text-amber-400 block">{getTranslation('daytimeHigh')}</span>
                                  <span className="font-bold text-amber-900 dark:text-amber-200">{formatTemperature(itinerary.travelGuide.weatherOutlook?.daytimeAvg || '20°C')}</span>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded border border-indigo-200 dark:border-indigo-800">
                                  <span className="text-indigo-500 dark:text-indigo-400 block">{getTranslation('nighttimeLow')}</span>
                                  <span className="font-bold text-indigo-900 dark:text-indigo-200">{formatTemperature(itinerary.travelGuide.weatherOutlook?.nighttimeAvg || '13°C')}</span>
                                </div>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {itinerary.travelGuide.weatherOutlook?.conditions}
                              </p>
                              {itinerary.travelGuide.weatherOutlook?.clothingAdvice && (
                                <div className="text-[11px] bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded border border-amber-200/60 text-amber-900 dark:text-amber-200">
                                  <strong>{getTranslation('clothingAdvice')}</strong> {itinerary.travelGuide.weatherOutlook.clothingAdvice}
                                </div>
                              )}
                            </div>
                            )}
                          </div>

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
                                      className="px-2.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-md hover:brightness-105 transition-colors cursor-pointer shrink-0"
                                    >
                                      {getTranslation('addBtn')}
                                    </button>
                                  </div>

                                  {/* Editable Personal Notes Textarea */}
                                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                                    <label className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100 text-[11px]">
                                      <FileText className="w-3 h-3 text-slate-500" />
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
                        </div>

                        {/* Specific Currency Section (Refined: Corresponds specifically to country) */}
                        {(() => {
                          const base = resolveDestinationCurrency(itinerary);
                          const curr =
                            guideKb.key !== 'generic'
                              ? {
                                  ...base,
                                  code: guideKb.currencyCode,
                                  name: `${guideKb.currencyName} (${guideKb.currencySymbol} / ${guideKb.currencyCode})`,
                                  symbol: guideKb.currencySymbol
                                }
                              : base;
                          return (
                            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700">
                                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                                  <DollarSign className="w-4 h-4 text-emerald-600" />
                                  <span>{getTranslation('currencyTitle')}</span>
                                </div>
                                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded">
                                  {curr.code} ({curr.symbol})
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] text-slate-500 block">{getTranslation('exchangeRates')}</span>
                                    <span
                                      className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                        fx.isLive
                                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300'
                                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          fx.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                                        }`}
                                      />
                                      {fx.isLive ? getTranslation('liveBadge') : getTranslation('estimatedBadge')}
                                    </span>
                                  </div>
                                  {/* Each conversion gets two stacked rows: the currency pair on
                                      the first row, its exchange rate on the row below */}
                                  {(() => {
                                    const tgt = curr.code;
                                    const fmtRateN = (n: number) =>
                                      n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
                                      : n >= 10 ? n.toFixed(1)
                                      : n.toFixed(2);
                                    const same = tgt === 'USD';
                                    const usdLine = same ? '—' : `1 USD ≈ ${curr.symbol}${fmtRateN(rateFor(tgt, fx))} ${tgt}`;
                                    const natCode = natCurrency.code;
                                    const natLine = natCode === tgt
                                      ? '—'
                                      : `1 ${natCode} ≈ ${curr.symbol}${fmtRateN(rateFor(tgt, fx) / rateFor(natCode, fx))} ${tgt}`;
                                    return (
                                      <div className="mt-1.5 space-y-2">
                                        <div>
                                          <div className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wide">USD → {tgt}</div>
                                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums" title={same ? getTranslation('sameCurrency') : undefined}>{usdLine}</div>
                                        </div>
                                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700">
                                          <div className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wide">{natCode} ({guideNat}) → {tgt}</div>
                                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums" title={natCode === tgt ? getTranslation('sameCurrency') : undefined}>{natLine}</div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 sm:col-span-2">
                                  <span className="text-[11px] text-slate-500 block">{getTranslation('cardCash')}</span>
                                  <span className="text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                                    {curr.cardAcceptance}
                                  </span>
                                  {/* Sales tax awareness — included/excluded in displayed prices + rate */}
                                  {(() => {
                                    const tax = taxInfoFor(`${itinerary.country || ''} ${itinerary.destination}`);
                                    if (!tax) return null;
                                    return (
                                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-start justify-between gap-2">
                                        <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                          <strong className="text-slate-800 dark:text-slate-200">{getTranslation('taxLabel')}</strong>{' '}
                                          <strong>{tax.included ? getTranslation('taxIncluded') : getTranslation('taxExcluded')}</strong> ({tax.rate})
                                          — {getTranslation('unlessStore')}.
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setTaxTipsCountry(countryNameFor(`${itinerary.country || ''} ${itinerary.destination}`))}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 transition-colors cursor-pointer shrink-0"
                                          title={getTranslation('taxBack')}
                                        >
                                          {getTranslation('taxTips')}
                                        </button>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                                <strong className="text-slate-900 dark:text-slate-100">{getTranslation('tippingRules')}</strong>{' '}
                                {tippingAdviceFor(guideNat, guideKb)}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Rules, Connectivity & Essential Apps (e.g. China VPN & Amap, Japan IC cards) */}
                        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm pb-2 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-blue-600" />
                              <span>{getTranslation('connectivityTitle')}</span>
                            </div>
                            <span className="text-[10px] text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded font-medium">
                              {getTranslation('criticalAdvice')}
                            </span>
                          </div>

                          {/* Connectivity & VPN guidance */}
                          {itinerary.travelGuide.arrivalRulesAndApps?.connectivityAdvice && (
                            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 rounded-lg text-slate-800 dark:text-slate-200">
                              <div className="font-semibold text-blue-900 dark:text-blue-300 text-xs mb-0.5">
                                {getTranslation('connectivityAdvice')}
                              </div>
                              <p className="leading-relaxed text-xs">
                                {itinerary.travelGuide.arrivalRulesAndApps.connectivityAdvice}
                              </p>
                            </div>
                          )}

                          {/* Recommended Apps — concrete apps locals actually use */}
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-2">
                              {tv('essentialAppsFor', { dest: guideKb.key !== 'generic' ? guideKb.name : itinerary.country || itinerary.destination })}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {guideApps.map((app, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <div className="font-bold text-slate-900 dark:text-slate-100">{app.name}</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{app.purpose}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                        {/* Local Customs & Cultural Etiquette */}
                        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm pb-2 border-b border-slate-200 dark:border-slate-700 mb-2.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>{getTranslation('customsTitle')}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(() => {
                              const base = guideKb.key !== 'generic'
                                ? guideKb.customs
                                : itinerary.travelGuide.culturalNorms || [];
                              // Always present exactly six etiquette cards per destination
                              const FILLER = [
                                'Learn the local hand gestures and table manners before you go — what is friendly at home can be rude abroad.',
                                'Haggling rules vary widely: bargain only where it is expected (markets), never in fixed-price shops.',
                                'Keep your voice down in public transport and sacred spaces — loudness is the top tourist giveaway.',
                                'Carry small change for tips, toilets and street vendors — cards are not universal outside cities.'
                              ];
                              const norms = [...base];
                              let i = 0;
                              while (norms.length < 6 && i < FILLER.length) {
                if (!norms.some((n) => n === FILLER[i])) norms.push(FILLER[i]);
                                i++;
                              }
                              return norms.slice(0, 6).map((norm, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{norm}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Basic Local Greetings & Cultural Expectations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                          {/* Basic Greetings */}
                          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                              <Languages className="w-4 h-4 text-indigo-600" />
                              <span>{getTranslation('greetingsTitle')}</span>
                            </div>
                            <div className="space-y-2 pt-1">
                              {(guideKb.key !== 'generic'
                                ? guideKb.phrases
                                : itinerary.travelGuide.basicGreetings || []
                              ).map((g, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                    {g.phrase}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                                    <span>{getTranslation('meaningLabel')} <em>{g.translation}</em></span>
                                    <span className="font-mono text-indigo-700 dark:text-indigo-400 font-semibold">[{g.phonetic}]</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Cultural Shocks & Realities */}
                          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              <span>{getTranslation('shocksTitle')}</span>
                            </div>
                            <div className="space-y-2 pt-1">
                              {itinerary.travelGuide.culturalShocks?.map((shock, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                    {shock.title}
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                    {shock.description}
                                  </p>
                                  <div className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                                    {getTranslation('tipLabel')} {shock.tip}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Safety & Meeting Point Guidelines */}
                        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-2">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {getTranslation('safetyTitle')}
                          </div>

                          {/* Emergency & police numbers for the destination country */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {guideEmergency.numbers.general && (
                              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 text-center">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{getTranslation('emergencyLabel')} ({guideEmergency.country})</div>
                                <div className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm tabular-nums">{guideEmergency.numbers.general}</div>
                              </div>
                            )}
                            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 text-center">
                              <div className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{getTranslation('policeLabel')}</div>
                              <div className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm tabular-nums">{guideEmergency.numbers.police}</div>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 text-center">
                              <div className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{getTranslation('ambulanceLabel')}</div>
                              <div className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm tabular-nums">{guideEmergency.numbers.ambulance}</div>
                            </div>
                            {guideEmergency.numbers.fire && (
                              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 text-center">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{getTranslation('fireLabel')}</div>
                                <div className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm tabular-nums">{guideEmergency.numbers.fire}</div>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            {itinerary.travelGuide.soloSafetyAdvisories?.map((adv, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                                {adv}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
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

      {/* Visa details popup — full visa paragraph on top, entry customs & regulations below */}
      {visaPopupItinId && (() => {
        const itin = itineraries.find((x) => x.id === visaPopupItinId);
        if (!itin) return null;
        const kb = lookupCountryGuide(`${itin.destination} ${itin.country || ''}`);
        const nat = itin.travelGuide?.travelerNationality || currentUser.country || 'Germany';
        const rules = kb.key !== 'generic'
          ? kb.entryRules
          : itin.travelGuide?.arrivalRulesAndApps?.entryRegulations || [];
        return (
          <div
            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setVisaPopupItinId(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                    {getTranslation('visaEntryLabel')} · {kb.name}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400 mt-0.5">
                    {tv('forPassport', { nat })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVisaPopupItinId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
                {visaAdviceFor(nat, kb)}
              </p>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {getTranslation('entryCustoms')}
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {rules.map((reg, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-violet-400 font-bold">•</span>
                      <span>{reg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tax tips popup — tourist tax-refund procedure for the destination */}
      {taxTipsCountry && (() => {
        const tax = taxInfoFor(taxTipsCountry);
        if (!tax) return null;
        return (
          <div
            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setTaxTipsCountry(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                    {tv('taxIn', { country: taxTipsCountry })}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tv(tax.included ? 'taxPopupSubInc' : 'taxPopupSubExc', { rate: tax.rate })} ({getTranslation('unlessStore')})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTaxTipsCountry(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="pt-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">{getTranslation('taxBack')}</div>
                {tax.refund ? (
                  <p>{tax.refund}</p>
                ) : (
                  <p>{tv('noRefund', { country: taxTipsCountry })}</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

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
