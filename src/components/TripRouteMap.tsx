import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X } from 'lucide-react';
import { ItineraryDay, TravelItinerary } from '../types/travel';
import {
  dayRouteColor,
  estimateLeg,
  estimateLegForMode,
  isAirportLeg,
  TRAVEL_MODE_LINE,
  type TravelMode
} from '../utils/placeGeo';
import { geoForTask, requestGeocode, onGeocodeResolved, tripGeoContext } from '../utils/geocode';
import { haversineKm } from '../utils/units';
import { getTranslation, tv } from '../utils/i18n';

export interface RouteStop {
  label: string;
  lat: number;
  lng: number;
  slot: 'morning' | 'afternoon' | 'evening';
  order: number; // 1-based within the day
}

const SLOT_KEYS: Array<{ key: 'morningActivity' | 'afternoonActivity' | 'eveningActivity'; slot: RouteStop['slot'] }> = [
  { key: 'morningActivity', slot: 'morning' },
  { key: 'afternoonActivity', slot: 'afternoon' },
  { key: 'eveningActivity', slot: 'evening' }
];

const splitTasks = (text: string): string[] =>
  (text || '')
    .split(/[\n\r]+|[·•;]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Geocode one day's activities into an ordered stop list. Local landmark
 * table first, then the cached/online geocoder anchored to the trip
 * destination — so any typed place pins to its exact spot, not just the
 * right country.
 */
export const stopsForDay = (day: ItineraryDay, context = ''): RouteStop[] => {
  const stops: RouteStop[] = [];
  let order = 0;
  SLOT_KEYS.forEach(({ key, slot }) => {
    splitTasks(day[key]).forEach((task) => {
      // A typed pinpoint (address / street / postcode / coords) outranks the
      // guessed geocode of the stop's name.
      const override = day.locationOverrides?.[task]?.trim();
      const geo = (override ? geoForTask(override, context) : null) || geoForTask(task, context);
      if (geo) {
        order += 1;
        stops.push({ label: task, lat: geo.lat, lng: geo.lng, slot, order });
      }
    });
  });
  return stops;
};

/** Transport modes the traveller can pick for a leg, with map badge glyphs. */
const LEG_MODES: Array<{ mode: TravelMode; glyph: string; labelKey: string }> = [
  { mode: 'walk', glyph: '🚶', labelKey: 'modeWalk' },
  { mode: 'transit', glyph: '🚇', labelKey: 'modeTransit' },
  { mode: 'bus', glyph: '🚌', labelKey: 'modeBus' },
  { mode: 'train', glyph: '🚆', labelKey: 'modeTrain' },
  { mode: 'taxi', glyph: '🚕', labelKey: 'modeTaxi' },
  { mode: 'drive', glyph: '🚗', labelKey: 'modeDrive' },
  { mode: 'ferry', glyph: '⛴️', labelKey: 'modeFerry' },
  { mode: 'flight', glyph: '✈️', labelKey: 'modeFlight' }
];

const glyphFor = (mode: TravelMode) => LEG_MODES.find((m) => m.mode === mode)?.glyph || '🚶';

/** Teardrop map marker in the day's route colour — WanderLust's own pin shape. */
const teardropPin = (n: number, color: string, big = false) => {
  const s = big ? 30 : 26;
  return L.divIcon({
    className: '',
    html: `<div style="width:${s}px;height:${s}px;transform:rotate(-45deg);
      background:${color};border:2.5px solid #fff;border-radius:50% 50% 50% 4px;
      box-shadow:0 3px 9px rgba(15,23,42,.4);display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);color:#fff;font-weight:800;
        font-size:${big ? 13 : 11}px;font-family:system-ui,sans-serif;">${n}</span></div>`,
    iconSize: [s, s],
    iconAnchor: [s / 2, s - 2]
  });
};

/** Small white badge with the leg's transport glyph — sits on top of the leg line, tap to change mode. */
const modeBadge = (mode: TravelMode, color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:#fff;
      border:2px solid ${color};box-shadow:0 2px 7px rgba(15,23,42,.35);cursor:pointer;
      display:flex;align-items:center;justify-content:center;font-size:12px;line-height:1;">${glyphFor(mode)}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

/** Quadratic-Bézier arc between two lat/lng points (flights "fly over" the map). */
const flightArc = (a: [number, number], b: [number, number]): [number, number][] => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  // control point pushed perpendicular to the straight line
  const cx = mx - dy * 0.22;
  const cy = my + dx * 0.22;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    pts.push([
      (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0],
      (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]
    ]);
  }
  return pts;
};

/** Point on the flight arc at t=0.5 (for the mode badge position). */
const arcMidpoint = (a: [number, number], b: [number, number]): [number, number] => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const cx = mx - (b[1] - a[1]) * 0.22;
  const cy = my + (b[0] - a[0]) * 0.22;
  return [0.25 * a[0] + 0.5 * cx + 0.25 * b[0], 0.25 * a[1] + 0.5 * cy + 0.25 * b[1]];
};

/** Road-following geometry for land legs, fetched from the public OSRM demo
 *  server (OpenStreetMap road network). Cached per leg; [] marks "failed, use straight". */
const roadKey = (a: [number, number], b: [number, number]) =>
  `${a[0].toFixed(5)},${a[1].toFixed(5)}>${b[0].toFixed(5)},${b[1].toFixed(5)}`;

const fetchRoadRoute = async (a: [number, number], b: [number, number]): Promise<[number, number][] | null> => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const json = await res.json();
    const coords = json?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    return coords.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
  } catch {
    return null;
  }
};

/** Stable key for a leg so the chosen transport mode survives reloads. */
const legKey = (from: RouteStop, to: RouteStop) => `${from.label}→${to.label}`;

/** Fit the map to whatever stops are currently shown. */
const FitBounds: React.FC<{ points: Array<[number, number]> }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p[0], p[1]))), { padding: [36, 36] });
    }
  }, [map, JSON.stringify(points)]);
  return null;
};

interface PickedLeg {
  dayNumber: number;
  key: string;
  fromLabel: string;
  toLabel: string;
  km: number;
  mode: TravelMode;
}

interface TripRouteMapProps {
  itinerary: TravelItinerary;
  onUpdateItinerary?: (itinerary: TravelItinerary) => void;
  /** Controlled day selection (0 = overview). When set, the internal tabs can be hidden. */
  activeDay?: number;
  onActiveDayChange?: (day: number) => void;
  hideDayTabs?: boolean;
}

/**
 * WanderLust route map: teardrop stops in per-day colours, and a transport
 * symbol on every leg — solid lines on land, dotted for ferries, curved
 * dotted arcs for flights. Tap a symbol to choose how you travel that leg.
 */
export const TripRouteMap: React.FC<TripRouteMapProps> = ({
  itinerary,
  onUpdateItinerary,
  activeDay: controlledDay,
  onActiveDayChange,
  hideDayTabs = false
}) => {
  const { days, destination } = itinerary;
  // 0 = Overview (all days); otherwise a 1-based day number
  const [internalDay, setInternalDay] = useState(0);
  const isControlled = controlledDay !== undefined;
  const activeDay = isControlled ? controlledDay : internalDay;
  const setActiveDay = (d: number) => {
    if (!isControlled) setInternalDay(d);
    onActiveDayChange?.(d);
  };
  const [pickedLeg, setPickedLeg] = useState<PickedLeg | null>(null);

  // Re-render whenever a queued online geocode lands, and queue lookups for
  // every stop the local table doesn't know (anchored to this trip's
  // destination so the pin lands on the exact place).
  const [geoVer, setGeoVer] = useState(0);
  useEffect(() => onGeocodeResolved(() => setGeoVer((v) => v + 1)), []);
  const geoContext = tripGeoContext(destination, itinerary.country);
  useEffect(() => {
    days.forEach((d) => {
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
  }, [days, geoContext, geoVer]);

  const stopsByDay = useMemo(
    () => days.map((d) => ({ day: d, stops: stopsForDay(d, geoContext) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, geoContext, geoVer]
  );
  const totalStops = stopsByDay.reduce((n, x) => n + x.stops.length, 0);

  // Auto-jump to the first day that actually has mappable stops (uncontrolled
  // mode only — a controlling parent may intentionally view an empty day)
  const firstDayWithStops = stopsByDay.find((x) => x.stops.length > 0)?.day.dayNumber ?? 0;
  useEffect(() => {
    if (isControlled) return;
    if (activeDay !== 0 && !stopsByDay.some((x) => x.day.dayNumber === activeDay && x.stops.length > 0)) {
      setActiveDay(firstDayWithStops);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstDayWithStops]);

  const visible =
    activeDay === 0 ? stopsByDay : stopsByDay.filter((x) => x.day.dayNumber === activeDay);

  // Road-following paths for land legs — fetched once per leg, cached in state
  const [roadPaths, setRoadPaths] = useState<Record<string, [number, number][] | null>>({});
  const roadPending = useRef<Set<string>>(new Set());

  const visibleSignature = JSON.stringify(
    visible.map(({ day, stops }) => [
      day.dayNumber,
      stops.map((x) => `${x.lat.toFixed(4)},${x.lng.toFixed(4)}`),
      day.legModes || {}
    ])
  );

  useEffect(() => {
    visible.forEach(({ day, stops }) => {
      stops.slice(0, -1).forEach((from, i) => {
        const to = stops[i + 1];
        const { mode } = modeForLeg(day, from, to);
        if (TRAVEL_MODE_LINE[mode] !== 'solid') return; // ferries + flights keep their own paths
        const a: [number, number] = [from.lat, from.lng];
        const b: [number, number] = [to.lat, to.lng];
        const key = roadKey(a, b);
        if (roadPaths[key] !== undefined || roadPending.current.has(key)) return;
        roadPending.current.add(key);
        fetchRoadRoute(a, b).then((path) => {
          roadPending.current.delete(key);
          setRoadPaths((prev) => ({ ...prev, [key]: path }));
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSignature]);

  const allPoints: Array<[number, number]> = visible.flatMap((x) =>
    x.stops.map((s) => [s.lat, s.lng] as [number, number])
  );

  const center: [number, number] = allPoints[0] || (() => {
    const g = geoForTask(destination, itinerary.country || '');
    return g ? [g.lat, g.lng] : [20, 0];
  })();
  // The map is ALWAYS on — with stops we zoom into them, without any we frame
  // the destination itself (or a world view when the place is unknown).
  const destGeo = geoForTask(destination, itinerary.country || '');
  const baseZoom = allPoints.length ? 12 : destGeo ? 11 : 2;
  // Unknown destination? Queue an exact lookup so the map frames it correctly.
  useEffect(() => {
    if (!destGeo) requestGeocode(destination, itinerary.country || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, itinerary.country, geoVer]);

  /** Mode for a leg: the traveller's saved choice, else airport⇄airport flies, else a distance-based guess. */
  const modeForLeg = (day: ItineraryDay, from: RouteStop, to: RouteStop): { mode: TravelMode; km: number } => {
    const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
    const saved = day.legModes?.[legKey(from, to)] as TravelMode | undefined;
    if (saved && LEG_MODES.some((m) => m.mode === saved)) return { mode: saved, km };
    if (isAirportLeg(from.label, to.label)) return { mode: 'flight', km };
    return { mode: estimateLeg(km).mode, km };
  };

  const chooseMode = (leg: PickedLeg, mode: TravelMode) => {
    const day = days.find((d) => d.dayNumber === leg.dayNumber);
    if (!day) return;
    const legModes = { ...(day.legModes || {}), [leg.key]: mode };
    onUpdateItinerary?.({
      ...itinerary,
      days: days.map((d) => (d.dayNumber === leg.dayNumber ? { ...d, legModes } : d))
    });
    setPickedLeg(null);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/60 bg-white dark:bg-slate-900 shadow-xs">
      <div className="relative">
        <MapContainer
          center={center}
          zoom={baseZoom}
          scrollWheelZoom
          className="h-72 sm:h-80 w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {allPoints.length > 0 && <FitBounds points={allPoints} />}
          {visible.map(({ day, stops }) => {
            const color = dayRouteColor(day.dayNumber);
            const focused = activeDay !== 0;
            return (
              <React.Fragment key={day.dayNumber}>
                {/* one segment per leg — solid on land, dotted for ferries, curved dotted for flights */}
                {stops.slice(0, -1).map((from, i) => {
                  const to = stops[i + 1];
                  const { mode } = modeForLeg(day, from, to);
                  const lineKind = TRAVEL_MODE_LINE[mode];
                  const a: [number, number] = [from.lat, from.lng];
                  const b: [number, number] = [to.lat, to.lng];
                  const dotted = lineKind !== 'solid';
                  const road = lineKind === 'solid' ? roadPaths[roadKey(a, b)] : null;
                  const positions = lineKind === 'curved-dotted'
                    ? flightArc(a, b)
                    : road && road.length > 1
                      ? road
                      : [a, b];
                  const badgePos = lineKind === 'curved-dotted'
                    ? arcMidpoint(a, b)
                    : road && road.length > 1
                      ? road[Math.floor(road.length / 2)]
                      : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as [number, number];
                  const key = legKey(from, to);
                  return (
                    <React.Fragment key={`${day.dayNumber}_leg_${i}`}>
                      <Polyline
                        positions={positions}
                        // keep every sampled point so flight arcs stay smooth curves
                        smoothFactor={positions.length > 2 ? 0 : 1}
                        pathOptions={{
                          color,
                          weight: focused ? 4.5 : 3.5,
                          opacity: focused ? 0.95 : 0.8,
                          dashArray: dotted ? '1 9' : undefined,
                          lineCap: 'round'
                        }}
                      />
                      <Marker
                        position={badgePos}
                        icon={modeBadge(mode, color)}
                        eventHandlers={{
                          click: () =>
                            setPickedLeg({
                              dayNumber: day.dayNumber,
                              key,
                              fromLabel: from.label,
                              toLabel: to.label,
                              km: haversineKm(from.lat, from.lng, to.lat, to.lng),
                              mode
                            })
                        }}
                      />
                    </React.Fragment>
                  );
                })}
                {stops.map((s) => (
                  <Marker
                    key={`${day.dayNumber}_${s.order}`}
                    position={[s.lat, s.lng]}
                    icon={teardropPin(s.order, color, focused)}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Empty-trip hint floats over the map instead of replacing it */}
        {totalStops === 0 && (
          <div className="absolute left-1/2 top-3 -translate-x-1/2 z-[1000] max-w-[90%] rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800 shadow-md px-3.5 py-2 text-center">
            <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
              {getTranslation('routeMapEmptyTitle')}
            </div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/70 leading-snug">
              {getTranslation('routeMapEmptyHint')}
            </div>
          </div>
        )}

        {/* Transport picker — tap a leg's symbol to choose how you travel it */}
        {pickedLeg && (
          <div className="absolute inset-x-2 bottom-2 z-[1000] rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-[11px]">
                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {pickedLeg.fromLabel} → {pickedLeg.toLabel}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {pickedLeg.km < 10 ? pickedLeg.km.toFixed(1) : Math.round(pickedLeg.km)} km · {getTranslation('travelModeTitle')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickedLeg(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LEG_MODES.map(({ mode, glyph, labelKey }) => {
                const active = pickedLeg.mode === mode;
                const mins = estimateLegForMode(pickedLeg.km, mode);
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => chooseMode(pickedLeg, mode)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 border-transparent'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <span>{glyph}</span>
                    <span>{getTranslation(labelKey)}</span>
                    <span className={`font-mono tabular-nums text-[9px] ${active ? 'opacity-70' : 'text-slate-400'}`}>
                      ~{mins}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend: trip scope chips (Overview / each Day) + ordered stop pinpoints.
          Overview paints the whole trip at once; a Day shows just that day's routes.
          Tabs hidden when the parent (journey board) owns day selection. */}
      {!hideDayTabs && (
      <div className="px-3.5 pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto bg-white dark:bg-slate-900 border-t border-emerald-100 dark:border-emerald-900/60">
        <button
          type="button"
          onClick={() => setActiveDay(0)}
          className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeDay === 0
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white/80 dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
          }`}
        >
          {getTranslation('overview')}
        </button>
        {days.map((d) => {
          const color = dayRouteColor(d.dayNumber);
          const active = activeDay === d.dayNumber;
          return (
            <button
              key={d.dayNumber}
              type="button"
              onClick={() => setActiveDay(d.dayNumber)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                active
                  ? 'text-white shadow-xs'
                  : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              style={active ? { background: color } : undefined}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: active ? '#fff' : color }}
              />
              {tv('dayN', { n: d.dayNumber })}
            </button>
          );
        })}
      </div>
      )}
      <div className="px-3.5 pb-2.5 pt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
        {visible.flatMap(({ day, stops }) =>
          stops.map((s) => (
            <span key={`${day.dayNumber}_${s.order}_lbl`} className="inline-flex items-center gap-1 min-w-0">
              <span
                className="w-3.5 h-3.5 text-white flex items-center justify-center text-[9px] font-extrabold shrink-0"
                style={{ background: dayRouteColor(day.dayNumber), borderRadius: '50% 50% 50% 2px', transform: 'rotate(-45deg)' }}
              >
                <span style={{ transform: 'rotate(45deg)' }}>{s.order}</span>
              </span>
              <span className="truncate max-w-[180px]">{s.label}</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
};
