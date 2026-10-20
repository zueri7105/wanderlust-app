import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { ItineraryDay } from '../types/travel';
import { findPlaceGeo, dayRouteColor } from '../utils/placeGeo';
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

/** Geocode one day's activities into an ordered stop list. */
export const stopsForDay = (day: ItineraryDay): RouteStop[] => {
  const stops: RouteStop[] = [];
  let order = 0;
  SLOT_KEYS.forEach(({ key, slot }) => {
    splitTasks(day[key]).forEach((task) => {
      const geo = findPlaceGeo(task);
      if (geo) {
        order += 1;
        stops.push({ label: task, lat: geo.lat, lng: geo.lng, slot, order });
      }
    });
  });
  return stops;
};

/** Numbered circular pin in the day's route colour — Pi-Travel style. */
const numberedPin = (n: number, color: string, big = false) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:${big ? 30 : 26}px;height:${big ? 30 : 26}px;border-radius:9999px;
      background:${color};color:#fff;display:flex;align-items:center;justify-content:center;
      font-weight:800;font-size:${big ? 14 : 12}px;font-family:system-ui,sans-serif;
      border:2.5px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.35);">${n}</div>`,
    iconSize: [big ? 30 : 26, big ? 30 : 26],
    iconAnchor: [big ? 15 : 13, big ? 15 : 13]
  });

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

interface TripRouteMapProps {
  days: ItineraryDay[];
  destination: string;
}

/**
 * Day route map in the spirit of 圆周旅迹: numbered stops connected by a
 * polyline per day, a DAY tab strip to focus one day, and an Overview that
 * paints every day in its own colour.
 */
export const TripRouteMap: React.FC<TripRouteMapProps> = ({ days, destination }) => {
  // 0 = Overview (all days); otherwise a 1-based day number
  const [activeDay, setActiveDay] = useState(0);

  const stopsByDay = useMemo(
    () => days.map((d) => ({ day: d, stops: stopsForDay(d) })),
    [days]
  );
  const totalStops = stopsByDay.reduce((n, x) => n + x.stops.length, 0);

  const visible =
    activeDay === 0 ? stopsByDay : stopsByDay.filter((x) => x.day.dayNumber === activeDay);

  const allPoints: Array<[number, number]> = visible.flatMap((x) =>
    x.stops.map((s) => [s.lat, s.lng] as [number, number])
  );

  const center: [number, number] = allPoints[0] || (() => {
    const g = findPlaceGeo(destination);
    return g ? [g.lat, g.lng] : [20, 0];
  })();

  if (totalStops === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 text-center space-y-1.5">
        <MapPin className="w-6 h-6 text-emerald-500 mx-auto" />
        <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
          {getTranslation('routeMapEmptyTitle')}
        </div>
        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70 max-w-md mx-auto leading-relaxed">
          {getTranslation('routeMapEmptyHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/60 bg-white dark:bg-slate-900 shadow-xs">
      {/* DAY tab strip — Overview paints every day in its own colour */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-b border-emerald-100 dark:border-emerald-900/60">
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

      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-72 sm:h-80 w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={allPoints} />
        {visible.map(({ day, stops }) => {
          const color = dayRouteColor(day.dayNumber);
          const focused = activeDay !== 0;
          return (
            <React.Fragment key={day.dayNumber}>
              {stops.length > 1 && (
                <Polyline
                  positions={stops.map((s) => [s.lat, s.lng] as [number, number])}
                  pathOptions={{ color, weight: focused ? 5 : 3.5, opacity: focused ? 0.95 : 0.75 }}
                />
              )}
              {stops.map((s) => (
                <Marker
                  key={`${day.dayNumber}_${s.order}`}
                  position={[s.lat, s.lng]}
                  icon={numberedPin(s.order, color, focused)}
                />
              ))}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Legend: ordered stop names for the focused view */}
      <div className="px-3.5 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
        {visible.flatMap(({ day, stops }) =>
          stops.map((s) => (
            <span key={`${day.dayNumber}_${s.order}_lbl`} className="inline-flex items-center gap-1 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full text-white flex items-center justify-center text-[9px] font-extrabold shrink-0"
                style={{ background: dayRouteColor(day.dayNumber) }}
              >
                {s.order}
              </span>
              <span className="truncate max-w-[180px]">{s.label}</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
};
