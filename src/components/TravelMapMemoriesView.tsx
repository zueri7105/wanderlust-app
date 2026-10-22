import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTranslation } from '../utils/i18n';
import { upsertMemoryFromItinerary } from '../utils/journalSync';
import { geoForTask, requestGeocode, onGeocodeResolved } from '../utils/geocode';
import { getTripCover } from '../utils/tripCovers';
import { SoloTraveler, TravelItinerary, TravelMemory } from '../types/travel';
import { MapContainer, TileLayer, Marker, CircleMarker, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import COUNTRIES_GEO from '../data/countriesGeo';
import { landmarkArtFor } from '../utils/landmarkArt';
import {
  MapPin,
  MapPinOff,
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
  Pencil,
  Check,
  Eye,
  EyeOff,
  LocateFixed,
  Info,
  Minus,
  Maximize2,
  Minimize2,
  BookOpen,
  Rocket,
  Sparkles
} from 'lucide-react';

/** Scroll-reveal wrapper — cards drift in from their side one at a time. */
const Reveal: React.FC<{ side?: 'left' | 'right'; delay?: number; className?: string; children: React.ReactNode }> = ({
  side,
  delay = 0,
  className = '',
  children
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            setVisible(true);
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`wl-reveal ${side ? `wl-reveal-${side}` : ''} ${visible ? 'wl-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
};

interface TravelMapMemoriesViewProps {
  currentUser: SoloTraveler;
  travelers: SoloTraveler[];
  itineraries?: TravelItinerary[];
  onOpenChatWithTraveler: (traveler: SoloTraveler, destination?: string) => void;
  onGoToItinerary: (destination: string) => void;
  /** Hide the page header when embedded under another section (e.g. the Passport page) */
  embedded?: boolean;
}

const CITY_GEO: Record<string, { lat: number; lng: number }> = {
  kyoto: { lat: 35.0116, lng: 135.7681 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  dubrovnik: { lat: 42.6507, lng: 18.0944 },
  barcelona: { lat: 41.3874, lng: 2.1686 },
  oaxaca: { lat: 17.0732, lng: -96.7266 },
  'amalfi coast': { lat: 40.6281, lng: 14.485 },
  amalfi: { lat: 40.6281, lng: 14.485 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  reykjavik: { lat: 64.1466, lng: -21.9426 },
  marrakech: { lat: 31.6295, lng: -7.9811 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
  'mexico city': { lat: 19.4326, lng: -99.1332 },
  lisbon: { lat: 38.7223, lng: -9.1393 },
  seoul: { lat: 37.5665, lng: 126.978 },
  paris: { lat: 48.8566, lng: 2.3522 },
  london: { lat: 51.5072, lng: -0.1276 },
  'new york': { lat: 40.7128, lng: -74.006 },
  bali: { lat: -8.3405, lng: 115.092 },
  cairo: { lat: 30.0444, lng: 31.2357 },
  cusco: { lat: -13.532, lng: -71.9675 },
  sydney: { lat: -33.8688, lng: 151.2093 },
  queenstown: { lat: -45.0312, lng: 168.6626 },
  berlin: { lat: 52.52, lng: 13.405 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  seville: { lat: 37.3891, lng: -5.9845 }
};

const geoFor = (city: string) => CITY_GEO[city.trim().toLowerCase()];

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
const DEFAULT_MEMORY_PHOTO = U('photo-1507525428034-b723cf961d3e');

/** Old % coordinates on the artwork → approximate real lat/lng (inverse of the old projection). */
const legacyPercentToLatLng = (x: number, y: number) => {
  const rawX = (x + 9) / 1.054;
  const rawY = (y - 12.4) / 0.98;
  return { lat: 90 - rawY * 1.8, lng: rawX * 3.6 - 180 };
};

const INITIAL_MEMORIES: TravelMemory[] = [];

const STATUS_STYLES: Record<TravelMemory['status'], { dot: string; badge: string }> = {
  'Current Location': { dot: '#10b981', badge: 'bg-emerald-500 text-white' },
  'Visited': { dot: '#0ea5e9', badge: 'bg-sky-600 text-white' },
  'Dream Next': { dot: '#f59e0b', badge: 'bg-amber-500 text-white' }
};

/** Normalize a country name for GeoJSON matching (lowercase, strip diacritics). */
const normCountry = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/** App display name (normalized) → Natural Earth ADMIN name (normalized). */
const GEO_NAME_ALIASES: Record<string, string> = {
  'united states': 'united states of america',
  'tanzania': 'united republic of tanzania',
  'timor-leste': 'east timor',
  'serbia': 'republic of serbia',
  'bahamas': 'the bahamas',
  "cote d'ivoire": 'ivory coast'
};

/** Resolve any user-entered country text to the normalized Natural Earth name. */
const geoKeyFor = (countryText: string) => {
  const n = normCountry(countryText);
  return GEO_NAME_ALIASES[n] || n;
};

/* --------------------------------------------------------------------------
 * Four-colour-theorem country colouring.
 * Countries of the same status (e.g. two Visited countries like Italy and
 * Croatia) used to all get one flat colour, so neighbouring trips blurred
 * together. Instead we assign each country one of 4 shades of its status
 * colour, greedy-graph-coloured so no two neighbours share a shade.
 * "Neighbours" = shared land border (common border vertices in the GeoJSON)
 * OR very close across water (bounding-box gap < 1.5°, e.g. Italy ⇄ Croatia
 * across the Adriatic). A 5th shade exists as a safety fallback.
 * ------------------------------------------------------------------------ */
const FOUR_COLOR_PALETTES: Record<TravelMemory['status'], string[]> = {
  'Visited': ['#0ea5e9', '#3b82f6', '#6366f1', '#06b6d4', '#8b5cf6'],
  'Dream Next': ['#f59e0b', '#f97316', '#eab308', '#c2410c', '#fbbf24'],
  'Current Location': ['#10b981', '#059669', '#34d399', '#047857', '#6ee7b7']
};
/** Bounding boxes closer than this (degrees) count as "across the water" neighbours. */
const MARITIME_NEIGHBOUR_GAP_DEG = 1.5;

interface CountryGeoMeta {
  pointKeys: Set<string>;
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

const geoMetaCache = new Map<string, CountryGeoMeta | null>();

/** Boundary point set + bounding box for a country (cached; data is rounded to 0.1°). */
const geoMetaFor = (geoKey: string): CountryGeoMeta | null => {
  if (geoMetaCache.has(geoKey)) return geoMetaCache.get(geoKey) || null;
  const feature = COUNTRIES_GEO.features.find((f) => normCountry(f.properties.name) === geoKey);
  let meta: CountryGeoMeta | null = null;
  if (feature) {
    const rings =
      feature.geometry.type === 'Polygon'
        ? (feature.geometry.coordinates as number[][][])
        : (feature.geometry.coordinates as number[][][][]).flat();
    meta = { pointKeys: new Set(), minLng: 180, maxLng: -180, minLat: 90, maxLat: -90 };
    rings.forEach((ring) =>
      ring.forEach((p) => {
        meta!.pointKeys.add(`${p[0].toFixed(1)},${p[1].toFixed(1)}`);
        if (p[0] < meta!.minLng) meta!.minLng = p[0];
        if (p[0] > meta!.maxLng) meta!.maxLng = p[0];
        if (p[1] < meta!.minLat) meta!.minLat = p[1];
        if (p[1] > meta!.maxLat) meta!.maxLat = p[1];
      })
    );
  }
  geoMetaCache.set(geoKey, meta);
  return meta;
};

/** Minimum gap between two bounding boxes (0 when they overlap). */
const bboxGapDeg = (a: CountryGeoMeta, b: CountryGeoMeta) => {
  const dx = Math.max(0, Math.max(a.minLng - b.maxLng, b.minLng - a.maxLng));
  const dy = Math.max(0, Math.max(a.minLat - b.maxLat, b.minLat - a.maxLat));
  return Math.hypot(dx, dy);
};

/** Two countries are adjacent if they share border vertices or sit very close across water. */
const countriesAreNeighbours = (a: CountryGeoMeta, b: CountryGeoMeta) => {
  if (bboxGapDeg(a, b) < MARITIME_NEIGHBOUR_GAP_DEG) return true;
  const [small, large] = a.pointKeys.size <= b.pointKeys.size ? [a.pointKeys, b.pointKeys] : [b.pointKeys, a.pointKeys];
  let shared = 0;
  for (const pk of small) {
    if (large.has(pk) && ++shared >= 2) return true;
  }
  return false;
};



/** Migrate legacy memories: single-photo shape → multi-photo, % coords → lat/lng. */
const migrateMemories = (raw: unknown): TravelMemory[] => {
  if (!Array.isArray(raw)) return INITIAL_MEMORIES;
  return raw.map((m: any) => {
    let coords = m?.coordinates || {};
    if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      const known = geoFor(m?.destination || '');
      if (known) coords = { x: 0, y: 0, ...known };
      else if (typeof coords.x === 'number') coords = { ...coords, ...legacyPercentToLatLng(coords.x, coords.y) };
      else coords = { x: 0, y: 0 }; // unresolved — the geocoder effect pins it
    }
    return {
      ...m,
      coordinates: coords,
      photos: Array.isArray(m?.photos) ? m.photos.filter(Boolean) : m?.photoUrl ? [m.photoUrl] : []
    };
  });
};

/** Smoothly flies the map when the selected pin changes. */
const MapFlyer: React.FC<{ target: { lat: number; lng: number } | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 4), { duration: 0.9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.lat, target?.lng]);
  return null;
};





/** The app's galaxy layout as a CSS background — used whenever a memory has no photo. */
const GALAXY_BG =
  'radial-gradient(ellipse 80% 60% at 30% 25%, rgba(139,92,246,0.55), transparent 62%),' +
  'radial-gradient(ellipse 70% 55% at 75% 72%, rgba(56,189,248,0.32), transparent 58%),' +
  'radial-gradient(ellipse at center, #1b1030 0%, #0b0714 78%)';
const GALAXY_STARS =
  'radial-gradient(1px 1px at 22% 30%, #fff, transparent),' +
  'radial-gradient(1px 1px at 64% 16%, #e9d5ff, transparent),' +
  'radial-gradient(1.5px 1.5px at 80% 46%, #fff, transparent),' +
  'radial-gradient(1px 1px at 42% 68%, #c4b5fd, transparent),' +
  'radial-gradient(1px 1px at 12% 82%, #fff, transparent),' +
  'radial-gradient(1.5px 1.5px at 56% 54%, #fff, transparent),' +
  'radial-gradient(1px 1px at 88% 84%, #e9d5ff, transparent),' +
  'radial-gradient(1px 1px at 32% 48%, #fff, transparent)';

/** Galaxy thumbnail — stands in for a missing memory photo (the app's starry layout). */
const GalaxyThumb: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div aria-hidden="true" className={className} style={{ background: GALAXY_BG, ...style }}>
    <div className="w-full h-full" style={{ backgroundImage: GALAXY_STARS }} />
  </div>
);

/** Lead photo for a memory: trip-linked memories sync with their trip card
    cover; then the first real user photo; null → render the galaxy layout. */
const memoryLeadPhoto = (mem: TravelMemory): string | null => {
  if (mem.id.startsWith('mem_itin_')) {
    const cover = getTripCover(mem.id.slice('mem_itin_'.length));
    if (cover) return cover;
  }
  const real = (mem.photos || []).filter((ph) => ph && ph !== DEFAULT_MEMORY_PHOTO);
  return real[0] || null;
};

/** Water-droplet pin for MY memory journal entries — photo pinned at its location. */
const memoryDropletIcon = (photo: string | null, color: string, isDream: boolean) =>
  L.divIcon({
    className: 'wl-mem',
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    html: `<div style="
      position:relative;width:36px;height:36px;border-radius:9999px 9999px 9999px 3px;
      transform:rotate(-45deg);background:#fff;border:2.5px solid ${color};
      box-shadow:0 8px 18px -6px ${color}99;overflow:hidden;${isDream ? 'opacity:.85;border-style:dashed;' : ''}">
      ${
        photo
          ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;transform:rotate(45deg) scale(1.42);" draggable="false"/>`
          : `<div style="width:100%;height:100%;background:${GALAXY_BG};"><div style="width:100%;height:100%;background-image:${GALAXY_STARS};"></div></div>`
      }
    </div>`
  });

/** Keeps map zoom state in React for the zoom pill. */
const ZoomWatcher: React.FC<{ onZoom: (z: number) => void }> = ({ onZoom }) => {
  const map = useMap();
  useEffect(() => {
    const cb = () => onZoom(map.getZoom());
    map.on('zoomend', cb);
    cb();
    return () => {
      map.off('zoomend', cb);
    };
  }, [map, onZoom]);
  return null;
};

export const TravelMapMemoriesView: React.FC<TravelMapMemoriesViewProps> = ({
  currentUser,
  travelers,
  itineraries = [],
  embedded = false
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

  // Reconcile trip cards → journal memories every time the journal opens:
  // every itinerary gets/updates its linked memory, and memories whose trip
  // was deleted elsewhere disappear here too. Nothing can drift out of sync.
  useEffect(() => {
    itineraries.forEach((it) => upsertMemoryFromItinerary(it));
    const itinIds = new Set(itineraries.map((it) => it.id));
    try {
      const saved = JSON.parse(localStorage.getItem('wanderlust_travel_memories') || '[]');
      const cleaned = saved.filter(
        (m: TravelMemory) => !m.id.startsWith('mem_itin_') || itinIds.has(m.id.replace('mem_itin_', ''))
      );
      if (cleaned.length !== saved.length) {
        localStorage.setItem('wanderlust_travel_memories', JSON.stringify(cleaned));
      }
      setMemories(migrateMemories(cleaned));
    } catch {
      /* keep in-memory state */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeFilter, setActiveFilter] = useState<'all' | 'Visited' | 'Current Location' | 'Dream Next'>('all');
  const [shareCopied, setShareCopied] = useState(false);
  const [isAddMemoryModalOpen, setIsAddMemoryModalOpen] = useState(false);
  const [photoIdx, setPhotoIdx] = useState<Record<string, number>>({});
  const [mapZoom, setMapZoom] = useState(2.2);

  // Pin visibility options (current/visited/dream layer toggles)
  const [pinLayers, setPinLayers] = useState({ current: true, visited: true, dream: true });

  // Photo lightbox (tap photo → pop up, zoom in/out, click outside to close)
  const [lightbox, setLightbox] = useState<{ photos: string[]; idx: number; title: string } | null>(null);
  const [lbZoom, setLbZoom] = useState(1);
  const [lbPan, setLbPan] = useState({ x: 0, y: 0 });
  const lbDragRef = useRef<{ sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);

  // Memory note inline editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  // New Memory Form State
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newDate, setNewDate] = useState('October 2026');
  const [newPhotos, setNewPhotos] = useState<string[]>(['']);
  const [newNote, setNewNote] = useState('');
  const [newTaggedCompanion, setNewTaggedCompanion] = useState('');
  const [newStatus, setNewStatus] = useState<'Visited' | 'Current Location' | 'Dream Next'>('Visited');
  const [selectedItineraryId, setSelectedItineraryId] = useState('');
  // When set, the modal edits this existing memory instead of creating a new one
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  // Map legend collapsed/expanded
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  // Full-screen map mode (viewport-filling overlay) — opens inline so the top nav stays
  // reachable; go full-screen with the maximise button (Esc / minimise to exit).
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [pinPanelOn, setPinPanelOn] = useState(false);
  // Map fly-to target when a journal entry is tapped
  const [memoryFly, setMemoryFly] = useState<{ lat: number; lng: number } | null>(null);

  /** Fly the map to a memory's city dot and highlight its status. */
  const flyToMemory = (mem: TravelMemory) => {
    if (typeof mem.coordinates.lat === 'number' && typeof mem.coordinates.lng === 'number') {
      setMemoryFly({ lat: mem.coordinates.lat, lng: mem.coordinates.lng });
      setActiveFilter(mem.status);
    }
  };

  // Esc exits full-screen map
  useEffect(() => {
    if (!isMapFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMapFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMapFullscreen]);

  /** Open the memory modal pre-filled with an existing memory (edit the whole post). */
  const handleEditMemory = (mem: TravelMemory) => {
    setEditingMemoryId(mem.id);
    setNewCity(mem.destination);
    setNewCountry(mem.country);
    setNewStatus(mem.status);
    setNewDate(mem.date);
    setNewNote(mem.memoryNote);
    setNewTaggedCompanion(mem.companionsTagged.join(', '));
    setNewPhotos(mem.photos.length > 0 ? [...mem.photos] : ['']);
    setSelectedItineraryId('');
    setIsAddMemoryModalOpen(true);
  };

  /** Auto-fill the memory from one of my itineraries (journal passage generated from the days). */
  const generateFromItinerary = (itineraryId: string) => {
    setSelectedItineraryId(itineraryId);
    if (!itineraryId) return;
    const it = itineraries.find((i) => i.id === itineraryId);
    if (!it) return;

    const city = it.cities?.[0] || it.destination.split(',')[0].trim();
    const country = it.country || it.destination.split(',').slice(-1)[0].trim();
    const today = new Date();
    const start = new Date(it.startDate);
    const end = new Date(it.endDate);
    const status: 'Visited' | 'Current Location' | 'Dream Next' =
      end < today ? 'Visited' : start <= today ? 'Current Location' : 'Dream Next';

    // Confirmed companion buddies headed to the same destination come along automatically
    const destLow = `${it.destination} ${country} ${city}`.toLowerCase();
    const buddies = travelers
      .filter(
        (t) =>
          t.isConfirmedBuddy &&
          t.currentDestination &&
          destLow.includes(t.currentDestination.split(',')[0].trim().toLowerCase())
      )
      .map((t) => t.name);

    const dayLines = it.days.map((d) => {
      const parts = [d.morningActivity, d.afternoonActivity, d.eveningActivity].filter(Boolean);
      return `Day ${d.dayNumber}${d.title ? ` — ${d.title}` : ''}: ${parts.join(' · ')}`;
    });

    setNewCity(city);
    setNewCountry(country);
    setNewStatus(status);
    setNewDate(start.toLocaleString('default', { month: 'long', year: 'numeric' }));
    setNewNote(
      `My ${it.days.length}-day ${it.tripScope || 'trip'} in ${it.destination}. ` +
        (buddies.length > 0 ? `Traveled together with ${buddies.join(' & ')}. ` : 'Traveled solo. ') +
        (it.notes ? `${it.notes} ` : '') +
        `\n\n${dayLines.join('\n')}`
    );
    setNewTaggedCompanion(buddies.join(', '));
  };

  const removeTaggedName = (name: string) => {
    const names = newTaggedCompanion.split(',').map((s) => s.trim()).filter(Boolean);
    setNewTaggedCompanion(names.filter((n) => n !== name).join(', '));
  };

  const saveMemories = (updated: TravelMemory[]) => {
    setMemories(updated);
    localStorage.setItem('wanderlust_travel_memories', JSON.stringify(updated));
  };

  // Pin resolver: memories without coordinates get geocoded (city → country)
  // so every droplet lands inside the same country the map colours — never at
  // a guessed location. Resolved coords are persisted back to localStorage.
  const [geoTick, setGeoTick] = useState(0);
  useEffect(() => onGeocodeResolved(() => setGeoTick((t) => t + 1)), []);
  useEffect(() => {
    let changed = false;
    const next = memories.map((m) => {
      if (typeof m.coordinates.lat === 'number' && typeof m.coordinates.lng === 'number') return m;
      const context = m.country || m.destination;
      const geo =
        geoForTask(m.destination, context) ||
        geoForTask(m.country, m.country) ||
        (m.country ? geoForTask(`${m.destination}, ${m.country}`, m.country) : null);
      if (geo) {
        changed = true;
        return { ...m, coordinates: { x: 0, y: 0, lat: geo.lat, lng: geo.lng } };
      }
      if (m.destination) requestGeocode(m.destination, context);
      else if (m.country) requestGeocode(m.country, m.country);
      return m;
    });
    if (changed) saveMemories(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memories, geoTick]);

  const handleShareLocation = () => {
    const shareText = `📍 ${currentUser.name}'s Live Travel Location: ${myDestination || 'Somewhere new'} · Safe & Active · Shared via WanderLust`;
    if (navigator.share) {
      navigator.share({ title: 'WanderLust Location', text: shareText }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  const handleShareMemory = (mem: TravelMemory) => {
    const text = `${mem.destination}, ${mem.country} (${mem.date}) — ${mem.memoryNote} · via WanderLust`;
    const payload = { title: `${mem.destination} Memory`, text, url: mem.photos[0] };
    if (navigator.share) {
      navigator.share(payload).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} ${payload.url}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity || !newCountry) return;

    const geo = geoFor(newCity) || geoFor(newCountry);
    // Never invent coordinates — unresolved places stay unpinned until the
    // geocoder effect resolves them (a pin must match its coloured country).
    const coords = geo ? { x: 0, y: 0, lat: geo.lat, lng: geo.lng } : { x: 0, y: 0 };

    const photos = newPhotos.map((p) => p.trim()).filter(Boolean);
    const companions = newTaggedCompanion
      ? newTaggedCompanion.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    if (editingMemoryId) {
      // Save edits to the existing memory post (companions, photos, note, status...)
      saveMemories(
        memories.map((m) =>
          m.id === editingMemoryId
            ? {
                ...m,
                destination: newCity,
                country: newCountry,
                coordinates: typeof m.coordinates.lat === 'number' ? m.coordinates : coords,
                date: newDate,
                photos,
                memoryNote: newNote || m.memoryNote,
                companionsTagged: companions,
                status: newStatus
              }
            : m
        )
      );
    } else {
      const newMem: TravelMemory = {
        id: `mem_${Date.now()}`,
        destination: newCity,
        country: newCountry,
        coordinates: coords,
        date: newDate,
        photos,
        memoryNote: newNote || `Wonderful moments captured traveling solo in ${newCity}, ${newCountry}!`,
        companionsTagged: companions,
        status: newStatus
      };
      saveMemories([newMem, ...memories]);
    }

    setIsAddMemoryModalOpen(false);
    setEditingMemoryId(null);
    setNewCity('');
    setNewCountry('');
    setNewNote('');
    setNewTaggedCompanion('');
    setNewPhotos(['']);
    setSelectedItineraryId('');
  };

  const handleDeleteMemory = (id: string) => {
    saveMemories(memories.filter((m) => m.id !== id));
  };

  /** Remove one tagged companion from a saved memory (the "with whom I travelled" chips). */
  const handleRemoveMemoryCompanion = (memId: string, name: string) => {
    saveMemories(
      memories.map((m) =>
        m.id === memId ? { ...m, companionsTagged: m.companionsTagged.filter((c) => c !== name) } : m
      )
    );
  };

  const handleSaveNote = (id: string) => {
    saveMemories(memories.map((m) => (m.id === id ? { ...m, memoryNote: editNoteText } : m)));
    setEditingNoteId(null);
  };

  const stepPhoto = (memId: string, total: number, dir: 1 | -1) => {
    setPhotoIdx((prev) => {
      const cur = prev[memId] || 0;
      return { ...prev, [memId]: (cur + dir + total) % total };
    });
  };

  const openLightbox = (photos: string[], idx: number, title: string) => {
    setLightbox({ photos, idx, title });
    setLbZoom(1);
    setLbPan({ x: 0, y: 0 });
  };

  const lbStep = (dir: 1 | -1) => {
    setLightbox((lb) => (lb ? { ...lb, idx: (lb.idx + dir + lb.photos.length) % lb.photos.length } : lb));
    setLbZoom(1);
    setLbPan({ x: 0, y: 0 });
  };

  const lbApplyZoom = (next: number) => {
    const z = Math.min(4, Math.max(1, next));
    setLbZoom(z);
    if (z === 1) setLbPan({ x: 0, y: 0 });
  };

  // Lightbox wheel zoom
  const lbRef = useRef<HTMLDivElement>(null);
  const lbZoomRef = useRef(1);
  lbZoomRef.current = lbZoom;
  useEffect(() => {
    const el = lbRef.current;
    if (!el || !lightbox) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      lbApplyZoom(lbZoomRef.current + (e.deltaY < 0 ? 0.25 : -0.25));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox]);

  // Timeline order: current location pinned to the top, then visited — newest trips first.
  const parseMemDate = (d: string) => {
    const t = Date.parse(d.replace('Planned ', ''));
    return Number.isNaN(t) ? 0 : t;
  };
  const timelineMemories = memories
    .filter((m) => m.status !== 'Dream Next')
    .sort((a, b) => {
      if (a.status === 'Current Location' && b.status !== 'Current Location') return -1;
      if (b.status === 'Current Location' && a.status !== 'Current Location') return 1;
      return parseMemDate(b.date) - parseMemDate(a.date);
    });
  // Dream Next entries — shown as the amber continuation at the bottom of the timeline
  const dreamMemories = memories
    .filter((m) => m.status === 'Dream Next')
    .sort((a, b) => parseMemDate(a.date) - parseMemDate(b.date));

  // Country colouring: each country's strongest status wins (Current > Visited > Dream)
  const countryStatusMap = useMemo(() => {
    const priority: Record<TravelMemory['status'], number> = {
      'Current Location': 3,
      'Visited': 2,
      'Dream Next': 1
    };
    const map = new Map<string, TravelMemory['status']>();
    memories.forEach((m) => {
      const key = geoKeyFor(m.country || (m.destination.split(',').pop() || '').trim());
      if (!key) return;
      const cur = map.get(key);
      if (!cur || priority[m.status] > priority[cur]) map.set(key, m.status);
    });
    return map;
  }, [memories]);

  // Bump this key whenever statuses change so react-leaflet re-applies the style fn
  const geoLayerKey = useMemo(
    () => [...countryStatusMap.entries()].map(([k, v]) => `${k}:${v}`).sort().join('|'),
    [countryStatusMap]
  );

  // Four-colour-theorem assignment: each country gets one of 4 shades of its
  // status colour so neighbouring countries (Italy ⇄ Croatia) never match.
  const countryColorMap = useMemo(() => {
    const keys = [...countryStatusMap.keys()];
    const adj = new Map<string, Set<string>>(keys.map((k) => [k, new Set<string>()]));
    for (let i = 0; i < keys.length; i++) {
      const a = geoMetaFor(keys[i]);
      if (!a) continue;
      for (let j = i + 1; j < keys.length; j++) {
        const b = geoMetaFor(keys[j]);
        if (!b) continue;
        if (countriesAreNeighbours(a, b)) {
          adj.get(keys[i])!.add(keys[j]);
          adj.get(keys[j])!.add(keys[i]);
        }
      }
    }
    // Greedy colouring, most-constrained country first. Only same-status
    // neighbours conflict (different statuses already use different hues).
    const order = [...keys].sort((x, y) => adj.get(y)!.size - adj.get(x)!.size);
    const colorIdx = new Map<string, number>();
    order.forEach((k) => {
      const status = countryStatusMap.get(k)!;
      const used = new Set(
        [...adj.get(k)!]
          .filter((n) => colorIdx.has(n) && countryStatusMap.get(n) === status)
          .map((n) => colorIdx.get(n)!)
      );
      let ci = 0;
      while (used.has(ci)) ci++;
      colorIdx.set(k, ci);
    });
    const out = new Map<string, string>();
    colorIdx.forEach((ci, k) => {
      const palette = FOUR_COLOR_PALETTES[countryStatusMap.get(k)!];
      out.set(k, palette[ci % palette.length]);
    });
    return out;
  }, [countryStatusMap]);

  const styleCountryFeature = (feature?: { properties?: { name?: string } }) => {
    const name = feature?.properties?.name;
    const geoKey = name ? normCountry(name) : '';
    const status = geoKey ? countryStatusMap.get(geoKey) : undefined;
    if (!status) {
      return { fillColor: 'transparent', fillOpacity: 0, color: 'transparent', weight: 0 };
    }
    const color = countryColorMap.get(geoKey) || STATUS_STYLES[status].dot;
    return {
      fillColor: color,
      fillOpacity: status === 'Current Location' ? 0.4 : 0.3,
      color,
      weight: 1.2,
      opacity: 0.8
    };
  };

  /** The user's current destination label (used for the share text). */
  const myDestination = (currentUser.currentDestination || '').trim();

  // Which of MY memory dots render depends on the layer toggles
  const visibleMemoryDots = memories.filter((m) => {
    if (typeof m.coordinates.lat !== 'number' || typeof m.coordinates.lng !== 'number') return false;
    if (m.status === 'Visited') return pinLayers.visited;
    if (m.status === 'Dream Next') return pinLayers.dream;
    return pinLayers.current;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Leaflet pin pulse keyframes */}
      <style>{`@keyframes wl-ping{0%{transform:scale(1);opacity:.6}80%,100%{transform:scale(1.6);opacity:0}} .wl-pin{background:transparent;border:none;} .leaflet-container{font-family:inherit;}`}</style>

      {/* Header */}
      {!embedded && (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300 rounded-full mb-2 border border-violet-300/70 dark:border-violet-800/40">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{getTranslation('navJournal')}</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
            {getTranslation('navJournal')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Your footprints on the map, and every memory pinned along the way.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleShareLocation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl transition-colors cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-500" />
            <span>{shareCopied ? 'Location Copied!' : getTranslation('shareLocation')}</span>
          </button>

        </div>
      </div>
      )}

      {/* Map Card — wraps inline; in full-screen mode the map overlays escape the card */}
      <div className={isMapFullscreen ? 'contents' : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm'}>
        {/* Interactive real world map (OpenStreetMap/CARTO tiles — zoom & pan native) */}
        <div
          className={
            isMapFullscreen
              ? 'fixed inset-0 z-[90] w-screen h-screen bg-[#dbeafe] dark:bg-[#0b0620]'
              : 'relative w-full h-[62vh] min-h-[26rem] z-0'
          }
        >
          <MapContainer
            key={isMapFullscreen ? 'map-fullscreen' : 'map-inline'}
            center={[30, 15]}
            zoom={2.2}
            minZoom={2}
            maxZoom={16}
            worldCopyJump
            zoomControl={false}
            attributionControl={false}
            className="w-full h-full"
            style={{ background: 'transparent' }}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
            <ZoomWatcher onZoom={setMapZoom} />
            <MapFlyer target={memoryFly} />

            {/* Country colouring — Visited / Current / Dream countries filled on the world map */}
            <GeoJSON
              key={geoLayerKey || 'geo-base'}
              data={COUNTRIES_GEO as any}
              style={styleCountryFeature as any}
            />

            

            {/* My memory journal CITY dots — dark halo ring + solid colour dot so cities
                stand out clearly from the filled country shapes underneath */}
            

            {/* Water-droplet journal pins — my memories pinned as photos at their locations.
                Tap one to fly to its place on the timeline below. */}
            {visibleMemoryDots.map((mem) => (
                <Marker
                  key={`drop-${mem.id}`}
                  position={[mem.coordinates.lat!, mem.coordinates.lng!]}
                  icon={memoryDropletIcon(
                    memoryLeadPhoto(mem),
                    STATUS_STYLES[mem.status].dot,
                    mem.status === 'Dream Next'
                  )}
                  eventHandlers={{ click: () => flyToMemory(mem) }}
                />
              ))}

            


            
          </MapContainer>

          {/* Full-screen controls row — compact layer toggles floating on the map */}
          {isMapFullscreen && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-xl text-[10px] font-semibold max-w-[calc(100vw-7rem)] overflow-x-auto">
              {([
                ['current', 'bg-emerald-500', 'Current'],
                ['visited', 'bg-sky-600', 'Visited'],
                ['dream', 'bg-amber-500', 'Dream']
              ] as const).map(([key, dotClass, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPinLayers((p) => ({ ...p, [key]: !p[key] }))}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    pinLayers[key] ? 'text-stone-700 dark:text-stone-200' : 'text-stone-400 line-through'
                  }`}
                  title={`Show / hide ${label} pins`}
                >
                  <span className={`w-2 h-2 rounded-full ${dotClass} ${pinLayers[key] ? '' : 'opacity-30'}`} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Zoom hint / level pill */}
          <div className="absolute top-3 left-3 z-[500] pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900/70 text-white text-[10px] font-bold backdrop-blur shadow-md">
              <LocateFixed className="w-3 h-3 text-emerald-300" />
              {mapZoom > 3
                ? `Zoom ${mapZoom.toFixed(1)}×`
                : 'Scroll / pinch to zoom · drag to explore'}
            </span>
          </div>

          {/* Full-screen toggle */}
          {/* Pinpoint layers — expand to choose what shows on the map */}
          <div className="absolute top-3 right-12 z-[600]">
            <button
              type="button"
              onClick={() => setPinPanelOn((v) => !v)}
              className="w-8 h-8 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-lg flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer transition-colors"
              title="Choose which pinpoints show on the map"
            >
              {pinPanelOn ? <MapPinOff className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            </button>
            {pinPanelOn && (
              <div className="absolute right-0 mt-2 w-44 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl p-2.5 space-y-1 text-[11px] font-semibold text-stone-700 dark:text-stone-200">
                <div className="px-1 pb-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                  Map pinpoints
                </div>
                {([
                  ['current', '#10b981', 'Current', pinLayers.current, () => setPinLayers((pl) => ({ ...pl, current: !pl.current }))],
                  ['visited', '#0ea5e9', 'Visited', pinLayers.visited, () => setPinLayers((pl) => ({ ...pl, visited: !pl.visited }))],
                  ['dream', '#f59e0b', 'Dream Next', pinLayers.dream, () => setPinLayers((pl) => ({ ...pl, dream: !pl.dream }))]
                ] as const).map(([key, color, label, on, toggle]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={toggle as any}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: on ? (color as string) : '#a8a29e' }} />
                      {label}
                    </span>
                    {on ? <Eye className="w-3.5 h-3.5 text-stone-500" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMapFullscreen((v) => !v)}
            className="absolute top-3 right-3 z-[600] w-8 h-8 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-lg flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer transition-colors"
            title={isMapFullscreen ? 'Exit full-screen map' : 'Open full-screen map'}
          >
            {isMapFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Map legend — country fills vs city dots (collapsible) */}
          <div className="absolute top-14 right-3 z-[500] hidden sm:block">
            {legendCollapsed ? (
              <button
                type="button"
                onClick={() => setLegendCollapsed(false)}
                className="w-8 h-8 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-lg flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer transition-colors"
                title="Show map legend"
              >
                <Info className="w-4 h-4" />
              </button>
            ) : (
              <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200 dark:border-stone-700 rounded-2xl px-3 py-2 shadow-lg space-y-1 text-[10px] font-semibold text-stone-600 dark:text-stone-300 pointer-events-auto">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Map legend</div>
                  <button
                    type="button"
                    onClick={() => setLegendCollapsed(true)}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer -mr-0.5 p-0.5"
                    title="Minimise legend"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                Current
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#0ea5e9' }} />
                Visited
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                Dream Next
              </div>
              </div>
            )}
          </div>

        </div>

      </div>


      {/* My Memories — scrollable journey timeline (current first, then visited) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              My Memories
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Your journey down the line — where you are first, then everywhere you have been.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingMemoryId(null);
              setNewCity('');
              setNewCountry('');
              setNewNote('');
              setNewTaggedCompanion('');
              setNewPhotos(['']);
              setSelectedItineraryId('');
              setIsAddMemoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-lg self-start"
          >
            <Plus className="w-4 h-4" />
            <span>{getTranslation('recordMemory')}</span>
          </button>
        </div>

        {/* Fixed frame with internal scroll — the page never grows with more trips */}
        <div className="relative rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 shadow-xs">
          <div className="h-[26rem] sm:h-[30rem] overflow-y-auto overscroll-contain px-4 sm:px-8 py-6 scrollbar-thin">
            {timelineMemories.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2 text-stone-400">
                <MapPin className="w-6 h-6" />
                <p className="text-xs">No memories yet — record where you are or where you have been.</p>
              </div>
            ) : (
              <div className="relative">
                {/* the galaxy star-trail line */}
                <span
                  aria-hidden="true"
                  className="wl-timeline-line absolute left-4 sm:left-1/2 top-0 bottom-0 sm:-translate-x-1/2"
                />
                {/* tiny plane riding the top of the trail */}
                <Plane
                  aria-hidden="true"
                  className="absolute left-4 sm:left-1/2 -top-1.5 w-3.5 h-3.5 -translate-x-1/2 rotate-[135deg] text-violet-400/70 dark:text-violet-300 z-10"
                />
                <div className="space-y-6">
                  {timelineMemories.map((mem, i) => {
                    const lead = memoryLeadPhoto(mem);
                    const photos = (mem.photos || []).filter((ph) => ph && ph !== DEFAULT_MEMORY_PHOTO);
                    if (lead && !photos.includes(lead)) photos.unshift(lead);
                    const idx = Math.min(photoIdx[mem.id] || 0, Math.max(photos.length - 1, 0));
                    const statusColor = STATUS_STYLES[mem.status].dot;
                    const leftSide = i % 2 === 0;
                    const isCurrent = mem.status === 'Current Location';

                    const card = (
                      <div
                        className={`group relative bg-white dark:bg-stone-900/85 border border-stone-200 dark:border-stone-800 rounded-2xl p-3 shadow-xs hover:shadow-lg hover:border-stone-300 dark:hover:border-stone-700 transition-all ${
                          isCurrent ? 'ring-1 ring-emerald-400/60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800">
                            {photos.length > 0 ? (
                              <img
                                key={photos[idx]}
                                src={photos[idx]}
                                alt={mem.destination}
                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                                onClick={() => openLightbox(photos, idx, `${mem.destination}, ${mem.country}`)}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 cursor-zoom-in"
                              />
                            ) : (
                              <GalaxyThumb className="absolute inset-0 w-full h-full" />
                            )}
                            {photos.length > 1 && (
                              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Camera className="w-2.5 h-2.5" />
                                {idx + 1}/{photos.length}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white"
                                style={{ background: statusColor }}
                              >
                                {isCurrent ? 'Now' : 'Visited'}
                              </span>
                              <span className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate">
                                {mem.destination}, {mem.country}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-stone-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {mem.date}
                            </div>
                            <p
                              className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug italic line-clamp-2 mt-1 cursor-pointer"
                              title="Tap to edit this memory note"
                              onClick={() => {
                                setEditingNoteId(mem.id);
                                setEditNoteText(mem.memoryNote);
                              }}
                            >
                              "{mem.memoryNote}"
                            </p>
                            {editingNoteId === mem.id && (
                              <div className="mt-1.5 space-y-1.5">
                                <textarea
                                  rows={2}
                                  value={editNoteText}
                                  onChange={(e) => setEditNoteText(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-y"
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteId(null)}
                                    className="px-2 py-0.5 text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-800 rounded-md cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveNote(mem.id)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-white bg-rose-600 rounded-md cursor-pointer"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                    Save
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* card actions — own footer row so they never overlap the text */}
                        <div className="mt-2 pt-1.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => flyToMemory(mem)}
                            className="p-1.5 text-stone-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Show on map"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditMemory(mem)}
                            className="p-1.5 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                            title="Edit this memory"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareMemory(mem)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Share this memory"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(mem.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Remove memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );

                    return (
                      <Reveal key={mem.id} side={leftSide ? 'left' : 'right'} delay={(i % 3) * 90}>
                        <div className="relative sm:grid sm:grid-cols-2 sm:gap-10 items-start">
                          {/* glowing node on the trail */}
                          <span
                            aria-hidden="true"
                            className={`absolute left-4 sm:left-1/2 top-5 w-3 h-3 rounded-full -translate-x-1/2 z-10 ${isCurrent ? 'wl-node-current' : ''}`}
                            style={{
                              background: statusColor,
                              boxShadow: `0 0 0 3px ${statusColor}33, 0 0 10px ${statusColor}88`
                            }}
                          />
                          {/* mobile: everything to the right of the line; desktop: staggered */}
                          <div className={`pl-10 sm:pl-0 ${leftSide ? 'sm:col-start-1 sm:pr-2' : 'sm:col-start-2 sm:pl-2'}`}>
                            {card}
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── What's next? Stay tuned… — the amber dream trail ── */}
            <div className="relative mt-10 pb-2">
              {/* amber continuation of the star-trail */}
              <span
                aria-hidden="true"
                className="wl-timeline-line-dream absolute left-4 sm:left-1/2 top-0 bottom-24 sm:-translate-x-1/2"
              />
              <Reveal className="relative">
                <div className="text-center py-2">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-300 text-[10px] font-black uppercase tracking-[0.25em] shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    {getTranslation('whatsNext')}
                  </span>
                </div>
              </Reveal>

              {dreamMemories.length > 0 && (
                <div className="space-y-5 mt-4">
                  {dreamMemories.map((mem, i) => {
                    const leftSide = (timelineMemories.length + i) % 2 === 0;
                    return (
                      <Reveal key={mem.id} side={leftSide ? 'left' : 'right'} delay={(i % 3) * 90}>
                        <div className="relative sm:grid sm:grid-cols-2 sm:gap-10 items-start">
                          <span
                            aria-hidden="true"
                            className="absolute left-4 sm:left-1/2 top-4 w-3 h-3 rounded-full -translate-x-1/2 z-10"
                            style={{ background: '#f59e0b', boxShadow: '0 0 0 3px #f59e0b33, 0 0 10px #f59e0b88' }}
                          />
                          <div className={`pl-10 sm:pl-0 ${leftSide ? 'sm:col-start-1 sm:pr-2' : 'sm:col-start-2 sm:pl-2'}`}>
                            <div className="rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 px-3.5 py-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white bg-amber-500">
                                  {getTranslation('dreamBadge')}
                                </span>
                                <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                                  {mem.country ? `${mem.destination}, ${mem.country}` : mem.destination}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/70 mt-0.5 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {mem.date.replace(/^Planned /, '') || 'Someday'}
                              </div>
                              {/* same 4 functions as current/visited memories */}
                              <div className="mt-2 pt-1.5 border-t border-amber-200/70 dark:border-amber-800/50 flex items-center justify-end gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => flyToMemory(mem)}
                                  className="p-1.5 text-stone-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                  title="Show on map"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditMemory(mem)}
                                  className="p-1.5 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                                  title="Edit this memory"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShareMemory(mem)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Share this memory"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMemory(mem.id)}
                                  className="p-1.5 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Remove memory"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              )}

              {/* decorative horizon: landmark silhouettes, a rocket and a plane */}
              <Reveal className="relative mt-8">
                <div className="relative h-28 overflow-hidden" aria-hidden="true">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 112" preserveAspectRatio="none">
                    <path
                      d="M-10 86 Q 150 34 300 62 T 610 42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeDasharray="0.5 8"
                      strokeLinecap="round"
                      className="text-amber-300/70 dark:text-amber-400/40"
                    />
                  </svg>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-6 sm:gap-10 text-stone-300 dark:text-violet-300/25">
                    {['cairo', 'paris', 'london', 'sydney', 'tokyo'].map((c) => (
                      <svg key={c} viewBox="0 0 24 24" className="w-9 h-9 sm:w-11 sm:h-11">
                        {landmarkArtFor(c)}
                      </svg>
                    ))}
                  </div>
                  <Rocket
                    className="wl-float absolute left-[16%] top-1 w-5 h-5 text-orange-400/80"
                    style={{ ['--wl-rot' as any]: '-45deg' }}
                  />
                  <Plane
                    className="wl-float absolute right-[18%] top-4 w-4 h-4 text-violet-400/70"
                    style={{ ['--wl-rot' as any]: '45deg', animationDelay: '1.4s' }}
                  />
                </div>
                <p className="text-center font-display italic text-sm text-stone-400 dark:text-stone-500 mt-2">
                  {getTranslation('stayTuned')}
                </p>
                <p className="text-center text-[10px] uppercase tracking-[0.3em] text-stone-300 dark:text-stone-600 mt-1">
                  {getTranslation('nextChapter')}
                </p>
              </Reveal>
            </div>
          </div>
          {/* fade hint at the frame's bottom when there is more to scroll */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 rounded-b-3xl bg-gradient-to-t from-white/80 dark:from-[#0b0620]/80 to-transparent" />
        </div>
      </div>

      {/* Photo Lightbox — tap photo to pop up, zoom in/out, click outside to close */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[1000] bg-stone-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
            <span className="text-white/90 text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full">
              {lightbox.title} · {lightbox.idx + 1}/{lightbox.photos.length}
            </span>
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={(e) => { e.stopPropagation(); lbApplyZoom(lbZoom - 0.5); }}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white/80 text-xs font-mono w-10 text-center">{Math.round(lbZoom * 100)}%</span>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={(e) => { e.stopPropagation(); lbApplyZoom(lbZoom + 0.5); }}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prev / Next */}
          {lightbox.photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                onClick={(e) => { e.stopPropagation(); lbStep(-1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center z-10 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={(e) => { e.stopPropagation(); lbStep(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center z-10 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Zoomable image */}
          <div
            ref={lbRef}
            className="max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl"
            style={{ cursor: lbZoom > 1 ? 'grab' : 'zoom-in', touchAction: 'none' }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              lbDragRef.current = { sx: e.clientX, sy: e.clientY, px: lbPan.x, py: lbPan.y, moved: false };
            }}
            onPointerMove={(e) => {
              const d = lbDragRef.current;
              if (!d) return;
              if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
              if (lbZoom > 1) setLbPan({ x: d.px + e.clientX - d.sx, y: d.py + e.clientY - d.sy });
            }}
            onPointerUp={() => {
              const d = lbDragRef.current;
              lbDragRef.current = null;
              if (d && !d.moved && lbZoom === 1) lbApplyZoom(2); // tap to zoom in
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              lbApplyZoom(lbZoom > 1 ? 1 : 2.5);
            }}
          >
            <img
              src={lightbox.photos[lightbox.idx]}
              alt={lightbox.title}
              draggable={false}
              className="max-w-full max-h-[80vh] object-contain select-none"
              style={{
                transform: `translate(${lbPan.x}px, ${lbPan.y}px) scale(${lbZoom})`,
                transition: lbDragRef.current ? 'none' : 'transform 150ms ease-out'
              }}
            />
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-[11px] pointer-events-none">
            Scroll or double-tap to zoom · drag to pan · tap outside to close
          </p>
        </div>
      )}

      {/* Record New Travel Memory Modal */}
      {isAddMemoryModalOpen && (
        <div className="wl-modal-overlay">
          <div className="wl-modal-card max-w-lg p-6 sm:p-7 relative">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="wl-modal-eyebrow">WanderLust Studio</div>
                <h3 className="wl-modal-title mt-1.5">
                  {editingMemoryId ? 'Edit Travel Memory' : 'Record a Travel Memory'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                  {editingMemoryId
                    ? 'Update the destination, photos, companions you traveled with, and your journal passage.'
                    : 'Add a place you have gone to, your companion buddies, photos, and personal memory notes.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddMemoryModalOpen(false);
                  setEditingMemoryId(null);
                }}
                className="wl-modal-close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMemory} className="mt-4 space-y-3.5 text-xs">
              {/* Generate journal from one of my itineraries */}
              {itineraries.length > 0 && !editingMemoryId && (
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
                  <label className="block font-semibold text-rose-800 dark:text-rose-300 mb-1.5">
                    Generate from my itinerary (optional)
                  </label>
                  <select
                    value={selectedItineraryId}
                    onChange={(e) => generateFromItinerary(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-200 dark:border-rose-900 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value="">— Fill in manually instead —</option>
                    {itineraries.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.destination} · {it.startDate} → {it.endDate} ({it.days.length} days)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-rose-600/80 dark:text-rose-300/70 mt-1">
                    Auto-fills city, country, date &amp; status, writes the journal passage from your itinerary days, and tags
                    confirmed travel buddies — everything stays editable below.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    City / Destination
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kyoto or Dubrovnik"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Japan or Croatia"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Visited">Visited</option>
                    <option value="Current Location">Current Location</option>
                    <option value="Dream Next">Dream Next / Bucket List</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Date / Season
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. October 2026 or Summer 2026"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Companion(s) Tagged (optional)
                </label>
                {/* Removable chips for already-tagged companions */}
                {newTaggedCompanion.split(',').map((s) => s.trim()).filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {newTaggedCompanion.split(',').map((s) => s.trim()).filter(Boolean).map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 pl-2 pr-1 py-0.5 rounded-full"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeTaggedName(name)}
                          className="p-0.5 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900 text-orange-500 hover:text-orange-800 dark:hover:text-orange-200 transition-colors cursor-pointer"
                          title={`Remove ${name}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="e.g. Kenji Sato, Sofia Morales — or leave blank if you traveled solo"
                  value={newTaggedCompanion}
                  onChange={(e) => setNewTaggedCompanion(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Multi-photo inputs (up to 9) */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Photos (add up to 9)
                </label>
                <div className="space-y-2">
                  {newPhotos.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 shrink-0 border border-stone-200 dark:border-stone-700">
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
                        className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      />
                      <button
                        type="button"
                        disabled={newPhotos.length === 1}
                        onClick={() => setNewPhotos((prev) => prev.filter((_, j) => j !== i))}
                        className="p-2 text-stone-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {newPhotos.length < 9 && (
                  <button
                    type="button"
                    onClick={() => setNewPhotos((prev) => [...prev, ''])}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Add another photo ({newPhotos.length}/9)
                  </button>
                )}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Personal Travel Story & Memories
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What was the most memorable moment? The food, trails, cafes, or meeting fellow solo wanderers..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddMemoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-lg hover:brightness-105 transition-all shadow-md shadow-orange-500/25"
                >
                  {editingMemoryId ? 'Save Changes' : 'Save Travel Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
