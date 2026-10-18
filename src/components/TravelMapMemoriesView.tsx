import React, { useEffect, useRef, useState } from 'react';
import { getTranslation } from '../utils/i18n';
import { haversineKm, formatDistance, estimateFlightTime } from '../utils/units';
import { SoloTraveler, TravelMemory } from '../types/travel';
import worldMapImg from '../assets/images/world_map_vibrant.jpg';
import {
  MapPin,
  Share2,
  Plus,
  Users,
  Camera,
  Trash2,
  Globe,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Plane,
  ImagePlus,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';

interface TravelMapMemoriesViewProps {
  currentUser: SoloTraveler;
  travelers: SoloTraveler[];
  onOpenChatWithTraveler: (traveler: SoloTraveler, destination?: string) => void;
  onGoToItinerary: (destination: string) => void;
}

/**
 * Real latitude/longitude → percentage position on the world map artwork.
 * The base equirectangular projection (x = (lng+180)/3.6, y = (90-lat)/1.8) is
 * affine-calibrated to the artwork's framing, which carries slight ocean padding.
 */
const project = (lat: number, lng: number) => {
  const rawX = (lng + 180) / 3.6;
  const rawY = (90 - lat) / 1.8;
  return { x: 1.054 * rawX - 9, y: 0.98 * rawY + 12.4 };
};

const CITY_GEO: Record<string, { lat: number; lng: number }> = {
  kyoto: { lat: 35.0116, lng: 135.7681 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  dubrovnik: { lat: 42.6507, lng: 18.0944 },
  barcelona: { lat: 41.3874, lng: 2.1686 },
  oaxaca: { lat: 17.0732, lng: -96.7266 },
  amalfi: { lat: 40.6281, lng: 14.485 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  reykjavik: { lat: 64.1466, lng: -21.9426 }
};

const geoFor = (city: string) => CITY_GEO[city.trim().toLowerCase()];

const MY_GEO = CITY_GEO.kyoto;
const MY_DESTINATION = 'Kyoto, Japan';

interface TravelerPin {
  id: string;
  name: string;
  destination: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  isMe: boolean;
  color: string;
}

const mkPin = (
  id: string,
  name: string,
  cityKey: string,
  destinationLabel: string,
  isMe: boolean,
  color: string
): TravelerPin => {
  const g = CITY_GEO[cityKey];
  const p = project(g.lat, g.lng);
  return { id, name, destination: destinationLabel, lat: g.lat, lng: g.lng, x: p.x, y: p.y, isMe, color };
};

const MAP_TRAVELER_PINS: TravelerPin[] = [
  mkPin('user_current', 'You (Elena)', 'kyoto', MY_DESTINATION, true, '#f43f5e'),
  mkPin('user_kenji', 'Kenji', 'tokyo', 'Tokyo, Japan', false, '#f97316'),
  mkPin('user_sofia', 'Sofia', 'dubrovnik', 'Dubrovnik, Croatia', false, '#0ea5e9'),
  mkPin('user_lucas', 'Lucas', 'barcelona', 'Barcelona, Spain', false, '#8b5cf6'),
  mkPin('user_maya', 'Maya', 'oaxaca', 'Oaxaca, Mexico', false, '#f59e0b'),
  mkPin('user_liam', 'Liam', 'amalfi', 'Amalfi Coast, Italy', false, '#10b981'),
  mkPin('user_sarah', 'Sarah', 'melbourne', 'Melbourne, Australia', false, '#ec4899'),
  mkPin('user_alex', 'Alex', 'reykjavik', 'Reykjavik, Iceland', false, '#06b6d4')
];

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
const DEFAULT_MEMORY_PHOTO = U('photo-1507525428034-b723cf961d3e');

const INITIAL_MEMORIES: TravelMemory[] = [
  {
    id: 'mem_kyoto_1',
    destination: 'Kyoto',
    country: 'Japan',
    coordinates: project(CITY_GEO.kyoto.lat, CITY_GEO.kyoto.lng),
    date: 'Oct 2026',
    photos: [
      U('photo-1493976040374-85c8e12f0c0e'),
      U('photo-1545569341-9eb8b30979d9'),
      U('photo-1528360983277-13d401cdc186')
    ],
    memoryNote: 'Met Kenji at 6:30 AM before the Fushimi Inari torii gates got crowded. Unforgettable crisp autumn morning mist, quiet bamboo groves, and hot matcha soba noodles afterwards!',
    companionsTagged: ['Kenji Sato'],
    status: 'Current Location'
  },
  {
    id: 'mem_dubrovnik_1',
    destination: 'Dubrovnik',
    country: 'Croatia',
    coordinates: project(CITY_GEO.dubrovnik.lat, CITY_GEO.dubrovnik.lng),
    date: 'Sep 2026',
    photos: [
      U('photo-1533105079780-92b9be482077'),
      U('photo-1507525428034-b723cf961d3e'),
      U('photo-1519046904884-53103b34b206')
    ],
    memoryNote: 'Walked the ancient polished limestone fortress walls with Sofia. We discovered the secret cliffside hole leading to Buža bar and swam directly into the turquoise Adriatic Sea at sunset.',
    companionsTagged: ['Sofia Morales'],
    status: 'Visited'
  },
  {
    id: 'mem_oaxaca_1',
    destination: 'Oaxaca',
    country: 'Mexico',
    coordinates: project(CITY_GEO.oaxaca.lat, CITY_GEO.oaxaca.lng),
    date: 'Aug 2026',
    photos: [
      U('photo-1518638150340-f706e86654de'),
      U('photo-1512813195386-6cf811ad3542'),
      U('photo-1469854523086-cc02fe5d8800')
    ],
    memoryNote: 'Feasted on 7 varieties of authentic mole in Mercado 20 de Noviembre, explored Hierve el Agua calcified waterfalls, and visited a traditional agave distillery with Maya.',
    companionsTagged: ['Maya Lin'],
    status: 'Visited'
  },
  {
    id: 'mem_amalfi_1',
    destination: 'Amalfi Coast',
    country: 'Italy',
    coordinates: project(CITY_GEO.amalfi.lat, CITY_GEO.amalfi.lng),
    date: 'Jul 2026',
    photos: [
      U('photo-1516483638261-f4dbaf036963'),
      U('photo-1533676802871-eca1ae998cd5'),
      U('photo-1523906834658-6e24ef2386f9')
    ],
    memoryNote: 'Hiked the Path of the Gods (Sentiero degli Dei) high above the cliffs with Liam. Shared a wooden boat rental to Capri and ate fresh lemon pasta by the harbour.',
    companionsTagged: ['Liam O\'Connor'],
    status: 'Visited'
  },
  {
    id: 'mem_barcelona_1',
    destination: 'Barcelona',
    country: 'Spain',
    coordinates: project(CITY_GEO.barcelona.lat, CITY_GEO.barcelona.lng),
    date: 'Planned May 2027',
    photos: [
      U('photo-1539037116277-4db20889f2d4'),
      U('photo-1583422409516-2895a77efded'),
      U('photo-1523531294919-4bcd7c65e216')
    ],
    memoryNote: 'Dreaming of a Gothic Quarter tapas marathon, Park Güell sunset photography, and a day trip carpool to the Costa Brava rocky coves.',
    companionsTagged: ['Lucas Silva'],
    status: 'Dream Next'
  }
];

const STATUS_STYLES: Record<TravelMemory['status'], { dot: string; badge: string }> = {
  'Current Location': { dot: '#10b981', badge: 'bg-emerald-500 text-white' },
  'Visited': { dot: '#0ea5e9', badge: 'bg-sky-600 text-white' },
  'Dream Next': { dot: '#f59e0b', badge: 'bg-amber-500 text-white' }
};

/** Migrate legacy single-photo memories (photoUrl) to the multi-photo shape. */
const migrateMemories = (raw: unknown): TravelMemory[] => {
  if (!Array.isArray(raw)) return INITIAL_MEMORIES;
  return raw.map((m: any) => ({
    ...m,
    photos: Array.isArray(m?.photos) && m.photos.length > 0
      ? m.photos
      : [m?.photoUrl || DEFAULT_MEMORY_PHOTO]
  }));
};

export const TravelMapMemoriesView: React.FC<TravelMapMemoriesViewProps> = ({
  currentUser,
  travelers,
  onOpenChatWithTraveler,
  onGoToItinerary
}) => {
  const [memories, setMemories] = useState<TravelMemory[]>(() => {
    const saved = localStorage.getItem('wanderlust_travel_memories');
    if (!saved) return INITIAL_MEMORIES;
    try {
      return migrateMemories(JSON.parse(saved));
    } catch {
      return INITIAL_MEMORIES;
    }
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'Visited' | 'Current Location' | 'Dream Next'>('all');
  const [selectedPinId, setSelectedPinId] = useState<string>('user_current');
  const [shareCopied, setShareCopied] = useState(false);
  const [isAddMemoryModalOpen, setIsAddMemoryModalOpen] = useState(false);
  const [photoIdx, setPhotoIdx] = useState<Record<string, number>>({});

  // ── Map zoom & pan ──────────────────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const dragMovedRef = useRef(false);

  const clampPan = (z: number, x: number, y: number) => {
    const el = mapRef.current;
    if (!el) return { x, y };
    const maxX = (el.clientWidth * (z - 1)) / 2;
    const maxY = (el.clientHeight * (z - 1)) / 2;
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  };

  const applyZoom = (next: number) => {
    const z = Math.min(4, Math.max(1, Math.round(next * 100) / 100));
    setZoom(z);
    setPan((p) => (z === 1 ? { x: 0, y: 0 } : clampPan(z, p.x, p.y)));
  };

  // Non-passive wheel zoom (React's onWheel can't preventDefault)
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(zoomRef.current + (e.deltaY < 0 ? 0.4 : -0.4));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomRef = useRef(1);
  zoomRef.current = zoom;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    dragMovedRef.current = false;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > 5) dragMovedRef.current = true;
    setPan(clampPan(zoom, d.panX + dx, d.panY + dy));
  };

  const handlePointerEnd = () => {
    dragRef.current = null;
    pinchRef.current = null;
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom };
      dragRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const p = pinchRef.current;
    if (e.touches.length === 2 && p) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (p.dist > 0) applyZoom(p.zoom * (dist / p.dist));
    }
  };
  // ────────────────────────────────────────────────────────────────

  // New Memory Form State
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newDate, setNewDate] = useState('October 2026');
  const [newPhotos, setNewPhotos] = useState<string[]>([DEFAULT_MEMORY_PHOTO]);
  const [newNote, setNewNote] = useState('');
  const [newTaggedCompanion, setNewTaggedCompanion] = useState('');
  const [newStatus, setNewStatus] = useState<'Visited' | 'Current Location' | 'Dream Next'>('Visited');

  const saveMemories = (updated: TravelMemory[]) => {
    setMemories(updated);
    localStorage.setItem('wanderlust_travel_memories', JSON.stringify(updated));
  };

  const handleShareLocation = () => {
    const shareText = `📍 Elena's Live Travel Location: Kyoto, Japan · Safe & Active · Shared with confirmed companions via WanderLust`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2500);
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity || !newCountry) return;

    const geo = geoFor(newCity);
    const coords = geo
      ? project(geo.lat, geo.lng)
      : { x: Math.floor(Math.random() * 60) + 20, y: Math.floor(Math.random() * 40) + 25 };

    const photos = newPhotos.map((p) => p.trim()).filter(Boolean);

    const newMem: TravelMemory = {
      id: `mem_${Date.now()}`,
      destination: newCity,
      country: newCountry,
      coordinates: coords,
      date: newDate,
      photos: photos.length > 0 ? photos : [DEFAULT_MEMORY_PHOTO],
      memoryNote: newNote || `Wonderful moments captured traveling solo in ${newCity}, ${newCountry}!`,
      companionsTagged: newTaggedCompanion
        ? newTaggedCompanion.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      status: newStatus
    };

    saveMemories([newMem, ...memories]);
    setIsAddMemoryModalOpen(false);
    setNewCity('');
    setNewCountry('');
    setNewNote('');
    setNewTaggedCompanion('');
    setNewPhotos([DEFAULT_MEMORY_PHOTO]);
  };

  const handleDeleteMemory = (id: string) => {
    saveMemories(memories.filter((m) => m.id !== id));
  };

  const stepPhoto = (memId: string, total: number, dir: 1 | -1) => {
    setPhotoIdx((prev) => {
      const cur = prev[memId] || 0;
      return { ...prev, [memId]: (cur + dir + total) % total };
    });
  };

  const filteredMemories = memories.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.status === activeFilter;
  });

  const getTravelerById = (id: string) => {
    if (id === 'user_current') return currentUser;
    return travelers.find((t) => t.id === id) || travelers[0];
  };

  const activePinTraveler = getTravelerById(selectedPinId);
  const activePinInfo = MAP_TRAVELER_PINS.find((p) => p.id === selectedPinId) || MAP_TRAVELER_PINS[0];
  const myPin = MAP_TRAVELER_PINS[0];

  // Real great-circle distance between You and the selected traveler
  const distanceKm = !activePinInfo.isMe
    ? haversineKm(MY_GEO.lat, MY_GEO.lng, activePinInfo.lat, activePinInfo.lng)
    : null;

  // Flight arc (SVG viewBox is 100x100 so coords == percentages)
  const arcPath = (() => {
    if (activePinInfo.isMe) return '';
    const a = myPin;
    const b = activePinInfo;
    const mx = (a.x + b.x) / 2;
    const cy = Math.max(2, Math.min(a.y, b.y) - 7 - Math.abs(a.x - b.x) / 22);
    return `M ${a.x} ${a.y} Q ${mx} ${cy} ${b.x} ${b.y}`;
  })();

  const arcMid = (() => {
    if (activePinInfo.isMe) return null;
    const a = myPin;
    const b = activePinInfo;
    const mx = (a.x + b.x) / 2;
    const cy = Math.max(2, Math.min(a.y, b.y) - 7 - Math.abs(a.x - b.x) / 22);
    // Quadratic bezier point at t=0.35 — biased toward "You" so the chip
    // floats over open ocean instead of colliding with other pins
    const t = 0.35;
    const u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * mx + t * t * b.x,
      y: u * u * a.y + 2 * u * t * cy + t * t * b.y
    };
  })();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-rose-100 to-orange-100 dark:from-rose-950/50 dark:to-orange-950/50 text-rose-700 dark:text-rose-300 rounded-full mb-2 border border-rose-200/60 dark:border-rose-800/40">
            <Globe className="w-3.5 h-3.5" />
            <span>Nomad Radar & Scratchpad</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
            {getTranslation('mapTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {getTranslation('mapSub')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleShareLocation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-500" />
            <span>{shareCopied ? 'Location Copied!' : getTranslation('shareLocation')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddMemoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 rounded-xl hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-orange-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>{getTranslation('recordMemory')}</span>
          </button>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Map Top Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-rose-50/70 via-orange-50/50 to-amber-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {getTranslation('liveRadar')}: {MAP_TRAVELER_PINS.length} Travelers Active
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Travelers
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Current
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-600" /> Visited
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Dream Next
            </span>
          </div>
        </div>

        {/* Interactive World Map Canvas (zoom, pan & pinch supported) */}
        <div
          ref={mapRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handlePointerEnd}
          className={`relative w-full h-[26rem] sm:h-[30rem] overflow-hidden select-none bg-[#FDF3E3] ${
            isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Zoomable map layer (image + pins + routes all scale together) */}
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 160ms ease-out'
            }}
          >
            <img
              src={worldMapImg}
              alt="Colorful world map"
              draggable={false}
              className="absolute inset-0 w-full h-full object-fill dark:brightness-90 dark:saturate-90 pointer-events-none"
            />

          {/* Memory journal dots */}
          {memories.map((mem) => (
            <div
              key={`dot-${mem.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
              style={{ left: `${mem.coordinates.x}%`, top: `${mem.coordinates.y}%` }}
              title={`${mem.destination}, ${mem.country}`}
            >
              <span
                className="block w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-md"
                style={{
                  backgroundColor: STATUS_STYLES[mem.status].dot,
                  transform: `scale(${1 / zoom})`
                }}
              />
            </div>
          ))}

          {/* Flight arc from You → selected traveler */}
          {!activePinInfo.isMe && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor={activePinInfo.color} />
                </linearGradient>
              </defs>
              <path
                d={arcPath}
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
                className="animate-pulse"
              />
            </svg>
          )}

          {/* Distance chip at arc midpoint */}
          {!activePinInfo.isMe && arcMid && distanceKm !== null && (
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: `${arcMid.x}%`, top: `${arcMid.y}%` }}
            >
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 text-white text-[10px] font-bold shadow-xl border border-white/20 whitespace-nowrap"
                style={{ transform: `scale(${1 / zoom})` }}
              >
                <Plane className="w-3 h-3 text-amber-300" />
                <span>{formatDistance(distanceKm)} · {estimateFlightTime(distanceKm)}</span>
              </div>
            </div>
          )}

          {/* Traveler pins — positioned in the zoomed layer, but counter-scaled
              so avatars keep a crisp constant size and spread apart on zoom */}
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${1 / zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 160ms ease-out'
            }}
          >
          {MAP_TRAVELER_PINS.map((pin) => {
            const isSelected = selectedPinId === pin.id;
            const traveler = getTravelerById(pin.id);

            return (
              <div
                key={pin.id}
                onClick={() => {
                  if (dragMovedRef.current) return; // ignore click after a drag-pan
                  setSelectedPinId(pin.id);
                }}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                {pin.isMe && (
                  <span className="absolute -inset-2.5 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
                )}

                <div
                  className={`relative flex items-center justify-center rounded-full transition-transform duration-300 ${
                    isSelected ? 'scale-125' : 'hover:scale-115'
                  }`}
                  style={{
                    boxShadow: isSelected
                      ? `0 0 0 3px #fff, 0 0 0 6px ${pin.color}, 0 12px 24px -6px ${pin.color}66`
                      : `0 0 0 2px #fff, 0 6px 14px -4px ${pin.color}55`
                  }}
                >
                  <img
                    src={traveler.avatar}
                    alt={pin.name}
                    draggable={false}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover bg-white"
                  />

                  {pin.isMe ? (
                    <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md">
                      <MapPin className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full shadow-sm"
                      style={{ backgroundColor: pin.color }}
                    />
                  )}
                </div>

                {/* Name Label */}
                <div
                  className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 pointer-events-none ${
                    isSelected
                      ? 'text-white shadow-lg opacity-100'
                      : 'bg-white/95 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 opacity-0 group-hover:opacity-100 shadow-md'
                  }`}
                  style={isSelected ? { backgroundColor: pin.color } : undefined}
                >
                  {pin.name}
                </div>
              </div>
            );
          })}
          </div>
          {/* End of zoomable map layer */}
          </div>

          {/* Zoom controls (fixed, outside the zoom layer) */}
          <div className="absolute top-3 right-3 z-40 flex flex-col gap-1.5">
            <button
              type="button"
              aria-label="Zoom in"
              disabled={zoom >= 4}
              onClick={() => applyZoom(zoom + 0.5)}
              className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              disabled={zoom <= 1}
              onClick={() => applyZoom(zoom - 0.5)}
              className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            {zoom > 1 && (
              <button
                type="button"
                aria-label="Reset view"
                onClick={() => applyZoom(1)}
                className="w-9 h-9 rounded-xl bg-slate-900/85 dark:bg-slate-100/90 backdrop-blur border border-slate-700 shadow-lg flex items-center justify-center text-white dark:text-slate-900 hover:bg-slate-800 active:scale-95 transition cursor-pointer"
              >
                <Maximize className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Zoom hint / level pill */}
          <div className="absolute top-3 left-3 z-40 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 text-white text-[10px] font-bold backdrop-blur shadow-md">
              {zoom > 1 ? `${Math.round(zoom * 100)}%` : 'Scroll / pinch to zoom · drag to pan'}
            </span>
          </div>

          {/* Active Pin Overlay Card (stays fixed, not zoomed) */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/60 dark:border-slate-700 rounded-2xl p-3.5 shadow-2xl z-30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activePinTraveler.avatar}
                  alt={activePinTraveler.name}
                  className="w-11 h-11 rounded-full object-cover shrink-0 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                  style={{ ['--tw-ring-color' as any]: activePinInfo.color }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-50 truncate">
                      {activePinInfo.isMe ? 'You (Elena)' : activePinTraveler.name}
                    </span>
                    {activePinInfo.isMe && (
                      <span className="text-[9px] bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 px-1.5 py-0.5 rounded-full font-bold">
                        You are here
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: activePinInfo.color }} />
                    <span className="truncate">{activePinInfo.destination}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!activePinInfo.isMe ? (
                  <button
                    type="button"
                    onClick={() => onOpenChatWithTraveler(activePinTraveler, activePinInfo.destination)}
                    className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-orange-500/25"
                  >
                    Say Hello
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onGoToItinerary('Kyoto, Japan')}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    My Itinerary
                  </button>
                )}
              </div>
            </div>

            {/* Distance from you */}
            {!activePinInfo.isMe && distanceKm !== null && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-[10px] font-bold">
                  <Plane className="w-3 h-3" />
                  {formatDistance(distanceKm)} away from you
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                  {estimateFlightTime(distanceKm)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Places Gone & Memories Journal Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {getTranslation('placesGone')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {getTranslation('placesGoneSub')}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs overflow-x-auto">
            {(['all', 'Visited', 'Current Location', 'Dream Next'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
                }`}
              >
                {filter === 'all' ? `All (${memories.length})` : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Memories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((mem) => {
            const photos = mem.photos.length > 0 ? mem.photos : [DEFAULT_MEMORY_PHOTO];
            const idx = Math.min(photoIdx[mem.id] || 0, photos.length - 1);

            return (
              <div
                key={mem.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo carousel */}
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-orange-100 via-rose-100 to-amber-100 dark:from-slate-800 dark:to-slate-800">
                    <img
                      key={photos[idx]}
                      src={photos[idx]}
                      alt={mem.destination}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />

                    {/* Carousel arrows */}
                    {photos.length > 1 && (
                      <>
                        <button
                          type="button"
                          aria-label="Previous photo"
                          onClick={() => stepPhoto(mem.id, photos.length, -1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next photo"
                          onClick={() => stepPhoto(mem.id, photos.length, 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/45 hover:bg-black/65 text-white flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Dots */}
                        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
                          {photos.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              aria-label={`Photo ${i + 1}`}
                              onClick={() => setPhotoIdx((prev) => ({ ...prev, [mem.id]: i }))}
                              className={`rounded-full transition-all cursor-pointer ${
                                i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{mem.destination}, {mem.country}</span>
                    </div>

                    <span
                      className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs ${STATUS_STYLES[mem.status].badge}`}
                    >
                      {mem.status}
                    </span>

                    <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5">
                      {photos.length > 1 && (
                        <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {idx + 1}/{photos.length}
                        </span>
                      )}
                      <span className="bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {mem.date}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{mem.memoryNote}"
                    </p>

                    {/* Companions Tagged */}
                    {mem.companionsTagged.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          With:
                        </span>
                        {mem.companionsTagged.map((c) => (
                          <span
                            key={c}
                            className="text-[11px] font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded-full"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => onGoToItinerary(`${mem.destination}, ${mem.country}`)}
                    className="font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 underline cursor-pointer"
                  >
                    View Itinerary
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                    title="Remove memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Record New Travel Memory Modal */}
      {isAddMemoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddMemoryModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
              Record a Travel Memory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add a place you have gone to, your companion buddies, photos, and personal memory notes.
            </p>

            <form onSubmit={handleCreateMemory} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Destination
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kyoto or Dubrovnik"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Japan or Croatia"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Visited">Visited</option>
                    <option value="Current Location">Current Location</option>
                    <option value="Dream Next">Dream Next / Bucket List</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date / Season
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. October 2026 or Summer 2026"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Companion(s) Tagged (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kenji Sato, Sofia Morales"
                  value={newTaggedCompanion}
                  onChange={(e) => setNewTaggedCompanion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Multi-photo inputs */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photos (add up to 6)
                </label>
                <div className="space-y-2">
                  {newPhotos.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700">
                        {url.trim() && (
                          <img
                            src={url}
                            alt=""
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={url}
                        onChange={(e) =>
                          setNewPhotos((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))
                        }
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        disabled={newPhotos.length === 1}
                        onClick={() => setNewPhotos((prev) => prev.filter((_, j) => j !== i))}
                        className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {newPhotos.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setNewPhotos((prev) => [...prev, ''])}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Add another photo
                  </button>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Personal Travel Story & Memories
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What was the most memorable moment? The food, trails, cafes, or meeting fellow solo wanderers..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddMemoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg hover:brightness-105 transition-all shadow-md shadow-orange-500/25"
                >
                  Save Travel Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
