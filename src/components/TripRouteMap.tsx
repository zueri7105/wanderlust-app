import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Maximize2, Minimize2, Eye, EyeOff, Languages } from 'lucide-react';
import { ItineraryDay, TravelItinerary } from '../types/travel';
import {
  dayRouteColor,
  estimateLeg,
  estimateLegForMode,
  isAirportLeg,
  TRAVEL_MODE_LINE,
  fetchLegRoute,
  getLegRoute,
  onRouteResolved,
  legOperatorFor,
  type TravelMode
} from '../utils/placeGeo';
import { geoForTask, requestGeocode, onGeocodeResolved, tripGeoContext, iso2ForCountry } from '../utils/geocode';
import { haversineKm } from '../utils/units';
import { getTranslation, tv } from '../utils/i18n';
import { COUNTRY_INFO_NAMES } from '../utils/countryInfo';
import COUNTRIES_GEO from '../data/countriesGeo';

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

/* ── Ocean-crossing legs become ferries automatically ────────────────────────
   The Natural-Earth land polygons let us test whether the straight line
   between two stops crosses open water: sample the great-circle midpoint
   plus quarter points; when the majority fall outside every land polygon,
   the leg almost certainly spans an ocean strait — so it rides a ferry. */
let landFeatures: { minLat: number; maxLat: number; minLng: number; maxLng: number; polys: number[][][] }[] | null = null;

const normKey = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const GEO_NAME_FIX: Record<string, string> = {
  'united states': 'united states of america',
  'tanzania': 'united republic of tanzania',
  'czechia': 'czech republic',
  'czech republic': 'czech republic',
  'ivory coast': "cote d'ivoire",
  "cote d'ivoire": "cote d'ivoire",
  'serbia': 'republic of serbia',
  'vietnam': 'vietnam',
  'south korea': 'republic of korea',
  'north korea': "democratic people's republic of korea",
  'bolivia': 'bolivia',
  'venezuela': 'venezuela',
  'iran': 'iran',
  'russia': 'russia',
  'syria': 'syrian arab republic',
  'laos': "lao people's democratic republic",
  'moldova': 'moldova',
  'ukraine': 'ukraine',
  'brunei': 'brunei',
  'cape verde': 'cape verde',
  'east timor': 'east timor',
  'eswatini': 'swaziland',
  'the bahamas': 'the bahamas',
  'bahamas': 'the bahamas',
  'gambia': 'gambia',
  'micronesia': 'federated states of micronesia'
};

const loadLandFeatures = () => {
  if (landFeatures) return landFeatures;
  const wanted = new Set(COUNTRY_INFO_NAMES.map((n) => GEO_NAME_FIX[normKey(n)] || normKey(n)));
  landFeatures = ((COUNTRIES_GEO as any).features as any[])
    .filter((f: any) => wanted.has(normKey(f?.properties?.name || '')))
    .map((f: any) => {
      const polys: number[][][] =
        f.geometry.type === 'Polygon'
          ? [f.geometry.coordinates as unknown as number[][]]
          : f.geometry.type === 'MultiPolygon'
          ? (f.geometry.coordinates as unknown as number[][][])
          : [];
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      polys.forEach((poly: number[][]) => {
        const ring = ((poly[0] || []) as unknown) as number[][];
        ring.forEach((pt: number[]) => {
          const lng = pt[0];
          const lat = pt[1];
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        });
      });
      return { minLat, maxLat, minLng, maxLng, polys };
    })
    .filter((f: { polys: number[][][] }) => f.polys.length > 0);
  return landFeatures!;
};

const pointInRing = (lat: number, lng: number, ring: number[][]) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const pointOnLand = (lat: number, lng: number): boolean => {
  for (const f of loadLandFeatures()) {
    if (lat < f.minLat || lat > f.maxLat || lng < f.minLng || lng > f.maxLng) continue;
    for (const poly of f.polys) {
      if (pointInRing(lat, lng, (poly[0] as unknown) as number[][])) return true;
    }
  }
  return false;
};

/** True when the direct leg crosses open water → travel it as a ferry. */
const crossesOcean = (a: [number, number], b: [number, number]): boolean => {
  const N = 9;
  let water = 0;
  for (let i = 1; i < N; i++) {
    const t = i / N;
    const lat = a[0] + (b[0] - a[0]) * t;
    const lng = a[1] + (b[1] - a[1]) * t;
    if (!pointOnLand(lat, lng)) water++;
  }
  return water >= 6; // mostly water — an ocean strait, not a coastal road
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
  operator: string | null;
  measuredKm: number | null;
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
  // Full-screen mode — same escape-the-card pattern as the journal map:
  // the map container turns into a fixed viewport overlay and the day
  // tabs / stop legend become floating panels on top of it.
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [legendHidden, setLegendHidden] = useState(false);
  const [labelsHidden, setLabelsHidden] = useState(false);
  const [englishLabels, setEnglishLabels] = useState(false);

  // Re-render whenever a queued online geocode lands, and queue lookups for
  // every stop the local table doesn't know (anchored to this trip's
  // destination so the pin lands on the exact place).
  const [geoVer, setGeoVer] = useState(0);
  useEffect(() => onGeocodeResolved(() => setGeoVer((v) => v + 1)), []);
  // Re-render when a road-network (OSRM) measurement lands.
  useEffect(() => onRouteResolved(() => setGeoVer((v) => v + 1)), []);
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

  /** Mode for a leg: the traveller's saved choice, else ocean-crossing ferry,
      else airport⇄airport flies, else a distance-based guess. */
  const modeForLeg = (day: ItineraryDay, from: RouteStop, to: RouteStop): { mode: TravelMode; km: number; measured: boolean } => {
    const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
    // Road-network distance once OSRM has measured it — the same figure Google
    // Maps quotes — falling back to the straight line until then.
    const measuredKm = getLegRoute([from.lat, from.lng], [to.lat, to.lng])?.km ?? null;
    const road = measuredKm ?? km;
    const saved = day.legModes?.[legKey(from, to)] as TravelMode | undefined;
    if (saved && LEG_MODES.some((m) => m.mode === saved)) return { mode: saved, km: road, measured: measuredKm != null };
    if (isAirportLeg(from.label, to.label)) return { mode: 'flight', km: road, measured: measuredKm != null };
    const guessed = estimateLeg(km, measuredKm).mode;
    if (guessed !== 'flight' && km > 25 && crossesOcean([from.lat, from.lng], [to.lat, to.lng])) {
      return { mode: 'ferry', km: road, measured: measuredKm != null };
    }
    return { mode: guessed, km: road, measured: measuredKm != null };
  };

  /** Queue road-network measurements for every visible leg (no-op when cached). */
  useEffect(() => {
    visible.forEach(({ stops }) => {
      for (let i = 1; i < stops.length; i += 1) {
        const from = stops[i - 1];
        const to = stops[i];
        fetchLegRoute([from.lat, from.lng], [to.lat, to.lng]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSignature, geoVer]);

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
    <div
      className={
        isFullscreen
          ? 'contents'
          : 'rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/60 bg-white dark:bg-slate-900 shadow-xs'
      }
    >
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-[90] w-screen h-screen bg-white dark:bg-slate-950'
            : 'relative'
        }
      >
        <MapContainer
          key={isFullscreen ? 'route-map-fs' : 'route-map-inline'}
          center={center}
          zoom={baseZoom}
          scrollWheelZoom
          maxZoom={18}
          className={isFullscreen ? 'w-full h-full z-0' : 'h-72 sm:h-80 w-full z-0'}
        >
          {/* Map translation: default OSM shows labels in the local script
              (日本語, 中文, 한국어…). The toggle swaps to an English-labelled
              layer (Esri World Street Map — free to use with attribution) so
              non-Latin destinations stay navigable. */}
          {englishLabels ? (
            <TileLayer
              key="map-english"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> · <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
              // The translated layer only renders detailed tiles up to z16 —
              // past that coverage thins out ("map unavailable" grey squares).
              // maxNativeZoom makes Leaflet upscale the z16 tiles instead of
              // requesting non-existent deeper ones.
              maxNativeZoom={16}
              maxZoom={18}
            />
          ) : (
            <TileLayer
              key="map-standard"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}
          {allPoints.length > 0 && <FitBounds points={allPoints} />}
          {visible.map(({ day, stops }) => {
            const color = dayRouteColor(day.dayNumber);
            const focused = activeDay !== 0;
            return (
              <React.Fragment key={day.dayNumber}>
                {/* one segment per leg — solid on land, dotted for ferries, curved dotted for flights */}
                {stops.slice(0, -1).map((from, i) => {
                  const legIdx = i;
                  const to = stops[i + 1];
                  const { mode, km: legKm, measured } = modeForLeg(day, from, to);
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
                      {/* Dark casing + white halo make the day's colour pop off
                          the map's own roads — yellow legs never blend into yellow
                          motorways. Ferry/flight share the dot pattern so each dot
                          is individually outlined, not one solid outline. */}
                      <Polyline
                        positions={positions}
                        smoothFactor={positions.length > 2 ? 0 : 1}
                        interactive={false}
                        pathOptions={{
                          color: '#0f172a',
                          weight: (focused ? 4.5 : 3.5) + 9,
                          opacity: 0.9,
                          lineCap: 'round',
                          dashArray: dotted ? '1 9' : undefined
                        }}
                      />
                      <Polyline
                        positions={positions}
                        smoothFactor={positions.length > 2 ? 0 : 1}
                        interactive={false}
                        pathOptions={{
                          color: '#ffffff',
                          weight: (focused ? 4.5 : 3.5) + 4,
                          opacity: 0.95,
                          lineCap: 'round',
                          dashArray: dotted ? '1 9' : undefined
                        }}
                      />
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
                              km: legKm,
                              mode,
                              operator: legOperatorFor(mode, itinerary.country, from.label, to.label),
                              measuredKm: measured ? legKm : null
                            })
                        }}
                      >
                        {/* WHO runs this leg — always on the map, no tap needed.
                            Real brand per country (ALSA, JR, Greyhound…) when
                            known; falls back to the plain mode word. */}
                        {!labelsHidden && (
                          <Tooltip
                            permanent
                            direction="top"
                            offset={[0, -16 - (legIdx % 3) * 15]}
                            className="wl-leg-tip"
                          >
                            <span>
                              {legKm < 10 ? legKm.toFixed(1) : Math.round(legKm)} km ·{' '}
                              {legOperatorFor(mode, itinerary.country, from.label, to.label) ??
                                getTranslation(LEG_MODES.find((m) => m.mode === mode)?.labelKey || '')}
                            </span>
                          </Tooltip>
                        )}
                      </Marker>
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

        {/* Full-screen toggle — matches the journal map's expand control */}
        <button
          type="button"
          onClick={() => setIsFullscreen((v) => !v)}
          className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit full screen' : 'View map full screen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'Exit' : 'Full screen'}</span>
        </button>

        {/* Translate map toggle — swaps local-script labels to English.
            Sits right of the zoom control (Leaflet keeps +/- at top-left). */}
        <button
          type="button"
          onClick={() => setEnglishLabels((v) => !v)}
          title={englishLabels ? 'Show local-language map' : 'Translate map labels to English'}
          className={`absolute top-3 left-14 z-[1000] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur border shadow-lg text-[11px] font-bold transition-colors cursor-pointer ${
            englishLabels
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
          }`}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{englishLabels ? 'Local map' : 'Translate map'}</span>
        </button>

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
          <div className={`absolute inset-x-2 z-[1200] rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl p-3 space-y-2 ${isFullscreen ? 'top-12' : 'bottom-2'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-[11px]">
                <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {pickedLeg.fromLabel} → {pickedLeg.toLabel}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {pickedLeg.km < 10 ? pickedLeg.km.toFixed(1) : Math.round(pickedLeg.km)} km
                  {pickedLeg.operator ? ` · ${pickedLeg.operator}` : ''} · {getTranslation('travelModeTitle')}
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
                const mins = estimateLegForMode(pickedLeg.km, mode, pickedLeg.measuredKm);
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
      <div
        className={
          isFullscreen
            ? 'fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-3 sm:left-auto sm:w-auto sm:max-w-[calc(100vw-2rem)] z-[600] flex items-center gap-1.5 overflow-x-auto px-3 py-2 rounded-2xl bg-white/92 dark:bg-slate-900/92 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl'
            : 'px-3.5 pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto bg-white dark:bg-slate-900 border-t border-emerald-100 dark:border-emerald-900/60'
        }
      >
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
      {/* Stop legend — hideable so it never covers the map when you want the
          whole screen for the route itself */}
      {legendHidden ? (
        <button
          type="button"
          onClick={() => setLegendHidden(false)}
          title="Show stops"
          className={
            isFullscreen
              ? 'fixed bottom-16 sm:bottom-[4.5rem] right-3 z-[600] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/92 dark:bg-slate-900/92 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer'
              : 'mx-3.5 mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-[10px] font-bold text-stone-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer self-start'
          }
        >
          <Eye className="w-3.5 h-3.5" />
          Stops
        </button>
      ) : (
      <div
        className={
          isFullscreen
            ? 'fixed bottom-16 sm:bottom-[4.5rem] inset-x-3 sm:inset-x-auto sm:right-3 sm:left-auto sm:max-w-[calc(100vw-2rem)] z-[600] flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[11px] text-slate-600 dark:text-slate-300 rounded-2xl bg-white/92 dark:bg-slate-900/92 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl max-h-[24vh] overflow-y-auto'
            : 'px-3.5 pb-2.5 pt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
        }
      >
        <button
          type="button"
          onClick={() => setLegendHidden(true)}
          title="Hide stops"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors cursor-pointer shrink-0"
        >
          <EyeOff className="w-3 h-3" />
        </button>
        {/* Labels toggle — hide the black leg signs for an unobstructed map */}
        <button
          type="button"
          onClick={() => setLabelsHidden((v) => !v)}
          title={labelsHidden ? 'Show leg labels' : 'Hide leg labels'}
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
            labelsHidden
              ? 'bg-stone-300 dark:bg-slate-600 text-stone-500 dark:text-slate-300'
              : 'bg-stone-950 dark:bg-slate-200 text-white dark:text-slate-900'
          }`}
        >
          {labelsHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
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
      )}
    </div>
  );
};
