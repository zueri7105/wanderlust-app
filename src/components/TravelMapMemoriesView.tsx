import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTranslation } from '../utils/i18n';
import { haversineKm, formatDistance, estimateFlightTime } from '../utils/units';
import { SoloTraveler, TravelItinerary, TravelMemory } from '../types/travel';
import { MapContainer, TileLayer, Marker, CircleMarker, Polyline, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import COUNTRIES_GEO from '../data/countriesGeo';
import { TravelerProfilePopup } from './TravelerProfilePopup';
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
  Pencil,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  LocateFixed,
  Info,
  Minus,
  Maximize2,
  Minimize2,
  BookOpen
} from 'lucide-react';

interface TravelMapMemoriesViewProps {
  currentUser: SoloTraveler;
  travelers: SoloTraveler[];
  itineraries?: TravelItinerary[];
  onOpenChatWithTraveler: (traveler: SoloTraveler, destination?: string) => void;
  onGoToItinerary: (destination: string) => void;
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

const MY_GEO = CITY_GEO.kyoto;
const MY_DESTINATION = 'Kyoto, Japan';

interface TravelerPin {
  id: string;
  name: string;
  destination: string;
  lat: number;
  lng: number;
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
  return { id, name, destination: destinationLabel, lat: g.lat, lng: g.lng, isMe, color };
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

// Demo trail dots — shown for confirmed companions only (they chose to share)
const COMPANION_TRAILS: Record<string, { lat: number; lng: number; label: string; status: 'Visited' | 'Dream Next' }[]> = {
  user_kenji: [
    { lat: 34.6937, lng: 135.5023, label: 'Osaka, Japan', status: 'Visited' },
    { lat: -8.3405, lng: 115.092, label: 'Bali, Indonesia', status: 'Dream Next' }
  ],
  user_maya: [
    { lat: 49.2827, lng: -123.1207, label: 'Vancouver, Canada', status: 'Visited' },
    { lat: 20.6597, lng: -103.3496, label: 'Guadalajara, Mexico', status: 'Visited' }
  ]
};

const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
const DEFAULT_MEMORY_PHOTO = U('photo-1507525428034-b723cf961d3e');

/** Old % coordinates on the artwork → approximate real lat/lng (inverse of the old projection). */
const legacyPercentToLatLng = (x: number, y: number) => {
  const rawX = (x + 9) / 1.054;
  const rawY = (y - 12.4) / 0.98;
  return { lat: 90 - rawY * 1.8, lng: rawX * 3.6 - 180 };
};

const INITIAL_MEMORIES: TravelMemory[] = [
  {
    id: 'mem_kyoto_1',
    destination: 'Kyoto',
    country: 'Japan',
    coordinates: { x: 0, y: 0, lat: CITY_GEO.kyoto.lat, lng: CITY_GEO.kyoto.lng },
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
    coordinates: { x: 0, y: 0, lat: CITY_GEO.dubrovnik.lat, lng: CITY_GEO.dubrovnik.lng },
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
    coordinates: { x: 0, y: 0, lat: CITY_GEO.oaxaca.lat, lng: CITY_GEO.oaxaca.lng },
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
    coordinates: { x: 0, y: 0, lat: CITY_GEO.amalfi.lat, lng: CITY_GEO.amalfi.lng },
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
    coordinates: { x: 0, y: 0, lat: CITY_GEO.barcelona.lat, lng: CITY_GEO.barcelona.lng },
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

type TravelerViewMode = 'all' | 'nearby' | 'buddies';
/** "People nearby" radius for the My View traveler filter */
const NEARBY_RADIUS_KM = 1500;

type MapPrivacy = 'everyone' | 'companions' | 'current';

/** Migrate legacy memories: single-photo shape → multi-photo, % coords → lat/lng. */
const migrateMemories = (raw: unknown): TravelMemory[] => {
  if (!Array.isArray(raw)) return INITIAL_MEMORIES;
  return raw.map((m: any) => {
    let coords = m?.coordinates || {};
    if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      const known = geoFor(m?.destination || '');
      if (known) coords = { x: 0, y: 0, ...known };
      else if (typeof coords.x === 'number') coords = { ...coords, ...legacyPercentToLatLng(coords.x, coords.y) };
      else coords = { x: 0, y: 0, lat: 20, lng: 0 };
    }
    return {
      ...m,
      coordinates: coords,
      photos: Array.isArray(m?.photos) && m.photos.length > 0 ? m.photos : [m?.photoUrl || DEFAULT_MEMORY_PHOTO]
    };
  });
};

/** Round avatar pin rendered as a Leaflet divIcon — stays glued to its lat/lng at every zoom. */
const avatarIcon = (url: string, color: string, isSelected: boolean, isMe: boolean) =>
  L.divIcon({
    className: 'wl-pin',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    html: `<div style="
      width:${isSelected ? 52 : 44}px;height:${isSelected ? 52 : 44}px;border-radius:9999px;
      border:3px solid #fff;outline:3px solid ${color};overflow:hidden;background:#fff;
      box-shadow:0 8px 20px -6px ${color}aa;transition:all .2s ease;position:relative;">
      <img src="${url}" style="width:100%;height:100%;object-fit:cover;" draggable="false"/>
      ${isMe ? `<span style="position:absolute;inset:-6px;border-radius:9999px;border:2px solid ${color};opacity:.55;animation:wl-ping 1.6s cubic-bezier(0,0,.2,1) infinite;"></span>` : ''}
    </div>`
  });

/** Smoothly flies the map when the selected pin changes. */
const MapFlyer: React.FC<{ target: { lat: number; lng: number } | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 4), { duration: 0.9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.lat, target?.lng]);
  return null;
};

/** Zooms out and flies to any explicit target (e.g. hotspot city cards under the map). */
const FreeFlyer: React.FC<{ target: { lat: number; lng: number; seq: number } | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 5), { duration: 0.9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.seq]);
  return null;
};

// ─── Nomad-Table-style city hotspots ─────────────────────────────────────────
// Live "who's travelling where" counts per city right now (community-wide).
const CITY_HOTSPOTS: { city: string; label: string; count: number; vibe: string }[] = [
  { city: 'bangkok', label: 'Bangkok, Thailand', count: 246, vibe: 'Street food & rooftop nights' },
  { city: 'tokyo', label: 'Tokyo, Japan', count: 214, vibe: 'Neon izakayas & hidden shrines' },
  { city: 'london', label: 'London, United Kingdom', count: 203, vibe: 'Markets, museums & pubs' },
  { city: 'barcelona', label: 'Barcelona, Spain', count: 189, vibe: 'Tapas crawls & beach sunsets' },
  { city: 'bali', label: 'Bali, Indonesia', count: 178, vibe: 'Surf cafés & jungle scooters' },
  { city: 'paris', label: 'Paris, France', count: 167, vibe: 'Croissants & gallery afternoons' },
  { city: 'lisbon', label: 'Lisbon, Portugal', count: 158, vibe: 'Tram rides & miradouro views' },
  { city: 'melbourne', label: 'Melbourne, Australia', count: 132, vibe: 'Coffee lanes & live music' },
  { city: 'mexico city', label: 'Mexico City, Mexico', count: 121, vibe: 'Taco tours & Frida Fridays' },
  { city: 'kyoto', label: 'Kyoto, Japan', count: 86, vibe: 'Torii gates & tea houses' },
  { city: 'oaxaca', label: 'Oaxaca, Mexico', count: 64, vibe: 'Mole feasts & mezcal tastings' },
  { city: 'dubrovnik', label: 'Dubrovnik, Croatia', count: 57, vibe: 'Fortress walls & island hops' },
  { city: 'amalfi', label: 'Amalfi Coast, Italy', count: 43, vibe: 'Cliff hikes & lemon groves' },
  { city: 'reykjavik', label: 'Reykjavik, Iceland', count: 38, vibe: 'Hot springs & northern lights' }
];

/** Count bubble pin (Nomad-Table style) — number of solo travellers in a city right now. */
const hotspotIcon = (count: number, isActive: boolean) =>
  L.divIcon({
    className: 'wl-hotspot',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    html: `<div style="
      width:${isActive ? 46 : 38}px;height:${isActive ? 46 : 38}px;border-radius:9999px;
      background:linear-gradient(135deg,#0f172a,#334155);color:#fff;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      border:2px solid ${isActive ? '#fb923c' : '#fff'};box-shadow:0 6px 18px -4px #0f172a88;
      font-weight:800;font-size:${count > 99 ? 11 : 12.5}px;line-height:1;transition:all .2s ease;">
      <span>${count}</span><span style="font-size:6.5px;font-weight:600;opacity:.75;letter-spacing:.04em;">HERE</span>
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
  const [mapZoom, setMapZoom] = useState(2.2);

  // Pin visibility options (the red/green/visited/dream layer toggles)
  const [pinLayers, setPinLayers] = useState({ travelers: true, hotspots: true, current: true, visited: true, dream: true });
  // Nomad-Table-style hotspot: active city + free-fly target for hotspot cards
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [hotspotFly, setHotspotFly] = useState<{ lat: number; lng: number; seq: number } | null>(null);
  // Traveller profile popup (tap a map pin's "View Profile")
  const [profileTravelerId, setProfileTravelerId] = useState<string | null>(null);

  // MY VIEW filter — which traveler pins *I* see on the map
  const [travelerView, setTravelerView] = useState<TravelerViewMode>('all');

  // Map privacy: what OTHER people can see of my dots
  const [mapPrivacy, setMapPrivacy] = useState<MapPrivacy>(() => {
    return (localStorage.getItem('wanderlust_map_privacy') as MapPrivacy) || 'companions';
  });
  useEffect(() => {
    localStorage.setItem('wanderlust_map_privacy', mapPrivacy);
  }, [mapPrivacy]);

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
  const [newPhotos, setNewPhotos] = useState<string[]>([DEFAULT_MEMORY_PHOTO]);
  const [newNote, setNewNote] = useState('');
  const [newTaggedCompanion, setNewTaggedCompanion] = useState('');
  const [newStatus, setNewStatus] = useState<'Visited' | 'Current Location' | 'Dream Next'>('Visited');
  const [selectedItineraryId, setSelectedItineraryId] = useState('');
  // When set, the modal edits this existing memory instead of creating a new one
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  // Map legend collapsed/expanded
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  // Full-screen map mode (viewport-filling overlay) — opens full-screen by default so the
  // first thing you see is the big world map; exit with Esc / the minimise button.
  const [isMapFullscreen, setIsMapFullscreen] = useState(true);
  // On-map Memories Journal drawer (combined into the map)
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  /** Fly the map to a memory's city dot and highlight its status. */
  const flyToMemory = (mem: TravelMemory) => {
    if (typeof mem.coordinates.lat === 'number' && typeof mem.coordinates.lng === 'number') {
      setHotspotFly({ lat: mem.coordinates.lat, lng: mem.coordinates.lng, seq: Date.now() });
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
    setNewPhotos(mem.photos.length > 0 ? [...mem.photos] : [DEFAULT_MEMORY_PHOTO]);
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

  const handleShareLocation = () => {
    const shareText = `📍 ${currentUser.name}'s Live Travel Location: ${MY_DESTINATION} · Safe & Active · Shared via WanderLust`;
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
    const coords = geo
      ? { x: 0, y: 0, lat: geo.lat, lng: geo.lng }
      : { x: 0, y: 0, lat: 10 + Math.random() * 40, lng: -20 + Math.random() * 80 };

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
                coordinates: m.coordinates.lat ? m.coordinates : coords,
                date: newDate,
                photos: photos.length > 0 ? photos : [DEFAULT_MEMORY_PHOTO],
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
        photos: photos.length > 0 ? photos : [DEFAULT_MEMORY_PHOTO],
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
    setNewPhotos([DEFAULT_MEMORY_PHOTO]);
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

  const filteredMemories = memories.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.status === activeFilter;
  });

  const getTravelerById = (id: string) => {
    if (id === 'user_current') return currentUser;
    return travelers.find((t) => t.id === id) || travelers[0];
  };

  // My View filter: all travelers / people nearby (≤1,500 km) / confirmed buddies only
  const visibleTravelerPins = MAP_TRAVELER_PINS.filter((pin) => {
    if (pin.isMe) return true;
    if (travelerView === 'all') return true;
    if (travelerView === 'buddies') return !!getTravelerById(pin.id).isConfirmedBuddy;
    return haversineKm(MY_GEO.lat, MY_GEO.lng, pin.lat, pin.lng) <= NEARBY_RADIUS_KM;
  });

  // Country colouring: each country's strongest status wins (Current > Visited > Dream)
  const countryStatusMap = useMemo(() => {
    const priority: Record<TravelMemory['status'], number> = {
      'Current Location': 3,
      'Visited': 2,
      'Dream Next': 1
    };
    const map = new Map<string, TravelMemory['status']>();
    memories.forEach((m) => {
      const key = geoKeyFor(m.country || m.destination);
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

  const styleCountryFeature = (feature?: { properties?: { name?: string } }) => {
    const name = feature?.properties?.name;
    const status = name ? countryStatusMap.get(normCountry(name)) : undefined;
    if (!status) {
      return { fillColor: 'transparent', fillOpacity: 0, color: 'transparent', weight: 0 };
    }
    const color = STATUS_STYLES[status].dot;
    return {
      fillColor: color,
      fillOpacity: status === 'Current Location' ? 0.4 : 0.3,
      color,
      weight: 1.2,
      opacity: 0.8
    };
  };

  const activePinTraveler = getTravelerById(selectedPinId);
  const activePinInfo = MAP_TRAVELER_PINS.find((p) => p.id === selectedPinId) || MAP_TRAVELER_PINS[0];
  const myPin = MAP_TRAVELER_PINS[0];
  const isActiveConfirmed = !!activePinTraveler.isConfirmedBuddy && !activePinInfo.isMe;

  // Real great-circle distance between You and the selected traveler
  const distanceKm = !activePinInfo.isMe
    ? haversineKm(MY_GEO.lat, MY_GEO.lng, activePinInfo.lat, activePinInfo.lng)
    : null;

  // Which of MY memory dots render depends on the layer toggles
  const visibleMemoryDots = memories.filter((m) => {
    if (m.status === 'Visited') return pinLayers.visited;
    if (m.status === 'Dream Next') return pinLayers.dream;
    return pinLayers.current;
  });

  const pinIcons = useMemo(() => {
    const map: Record<string, L.DivIcon> = {};
    MAP_TRAVELER_PINS.forEach((pin) => {
      const traveler = getTravelerById(pin.id);
      map[pin.id] = avatarIcon(traveler.avatar, pin.color, pin.id === selectedPinId, pin.isMe);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPinId, travelers, currentUser]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Leaflet pin pulse keyframes */}
      <style>{`@keyframes wl-ping{0%{transform:scale(1);opacity:.6}80%,100%{transform:scale(1.6);opacity:0}} .wl-pin{background:transparent;border:none;} .leaflet-container{font-family:inherit;}`}</style>

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
            onClick={() => {
              setEditingMemoryId(null);
              setNewCity('');
              setNewCountry('');
              setNewNote('');
              setNewTaggedCompanion('');
              setNewPhotos([DEFAULT_MEMORY_PHOTO]);
              setSelectedItineraryId('');
              setIsAddMemoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 rounded-xl hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-lg shadow-orange-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>{getTranslation('recordMemory')}</span>
          </button>
        </div>
      </div>

      {/* Map Card — wraps inline; in full-screen mode the map overlays escape the card */}
      <div className={isMapFullscreen ? 'contents' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm'}>
        {/* Map Top Bar: live counter + layer toggles (hidden in full-screen — controls float on the map) */}
        {!isMapFullscreen && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-rose-50/70 via-orange-50/50 to-amber-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {getTranslation('liveRadar')}: {visibleTravelerPins.length} of {MAP_TRAVELER_PINS.length} Travellers Shown
            </span>
          </div>

          {/* My View — filter which traveler pins I see */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">My view:</span>
            {([
              ['all', 'All travelers'],
              ['nearby', `People nearby (≤${NEARBY_RADIUS_KM.toLocaleString()} km)`],
              ['buddies', 'Confirmed buddies']
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setTravelerView(val)}
                className={`px-2 py-1 rounded-full border transition-all cursor-pointer ${
                  travelerView === val
                    ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-300'
                }`}
                title={`Filter traveler pins: ${label}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Layer toggles — tap to show/hide each dot type */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold">
            {([
              ['travelers', 'bg-rose-500', 'Travellers'],
              ['hotspots', 'bg-slate-900', 'City Buzz'],
              ['current', 'bg-emerald-500', 'Current'],
              ['visited', 'bg-sky-600', 'Visited'],
              ['dream', 'bg-amber-500', 'Dream Next']
            ] as const).map(([key, dotClass, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPinLayers((p) => ({ ...p, [key]: !p[key] }))}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all cursor-pointer ${
                  pinLayers[key]
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 line-through'
                }`}
                title={`Show / hide ${label} pins`}
              >
                <span className={`w-2 h-2 rounded-full ${dotClass} ${pinLayers[key] ? '' : 'opacity-30'}`} />
                {label}
                {pinLayers[key] ? <Eye className="w-3 h-3 text-slate-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Interactive real world map (OpenStreetMap/CARTO tiles — zoom & pan native) */}
        <div
          className={
            isMapFullscreen
              ? 'fixed inset-0 z-[90] w-screen h-screen bg-[#dbeafe]'
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
            style={{ background: '#dbeafe' }}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
            <ZoomWatcher onZoom={setMapZoom} />
            <MapFlyer target={activePinInfo} />

            {/* Country colouring — Visited / Current / Dream countries filled on the world map */}
            <GeoJSON
              key={geoLayerKey || 'geo-base'}
              data={COUNTRIES_GEO as any}
              style={styleCountryFeature as any}
            />

            {/* Flight arc You → selected traveler */}
            {!activePinInfo.isMe && (
              <Polyline
                positions={[
                  [myPin.lat, myPin.lng],
                  [activePinInfo.lat, activePinInfo.lng]
                ]}
                pathOptions={{ color: activePinInfo.color, weight: 2.5, dashArray: '6 8', opacity: 0.85 }}
              />
            )}

            {/* My memory journal CITY dots — dark halo ring + solid colour dot so cities
                stand out clearly from the filled country shapes underneath */}
            {visibleMemoryDots.map((mem) => (
              <React.Fragment key={`dot-${mem.id}`}>
                <CircleMarker
                  center={[mem.coordinates.lat!, mem.coordinates.lng!]}
                  radius={9}
                  pathOptions={{ color: '#0f172a', weight: 1.5, fillColor: '#ffffff', fillOpacity: 0.9 }}
                />
                <CircleMarker
                  center={[mem.coordinates.lat!, mem.coordinates.lng!]}
                  radius={5.5}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 1.5,
                    fillColor: STATUS_STYLES[mem.status].dot,
                    fillOpacity: 1
                  }}
                  eventHandlers={{ click: () => setActiveFilter(mem.status) }}
                />
              </React.Fragment>
            ))}

            {/* Confirmed companions' shared trail dots */}
            {Object.entries(COMPANION_TRAILS).map(([tid, dots]) => {
              const traveler = travelers.find((t) => t.id === tid);
              if (!traveler?.isConfirmedBuddy) return null;
              return dots.map((d, i) => (
                <CircleMarker
                  key={`trail-${tid}-${i}`}
                  center={[d.lat, d.lng]}
                  radius={5}
                  pathOptions={{
                    color: '#fff',
                    weight: 1.5,
                    fillColor: d.status === 'Visited' ? '#0ea5e9' : '#f59e0b',
                    fillOpacity: 0.95
                  }}
                  eventHandlers={{ click: () => setSelectedPinId(tid) }}
                />
              ));
            })}

            {/* Traveller avatar pins (filtered by My View) */}
            {pinLayers.travelers &&
              visibleTravelerPins.map((pin) => (
                <Marker
                  key={pin.id}
                  position={[pin.lat, pin.lng]}
                  icon={pinIcons[pin.id]}
                  eventHandlers={{ click: () => setSelectedPinId(pin.id) }}
                />
              ))}

            {/* City Buzz hotspots — live count of solo travellers per city (Nomad-Table style).
                Only rendered at world/region zoom so the count bubbles never cover nearby
                traveller profile pics when you zoom in. */}
            {pinLayers.hotspots && mapZoom <= 3.5 &&
              CITY_HOTSPOTS.map((h) => {
                const g = geoFor(h.city);
                if (!g) return null;
                return (
                  <Marker
                    key={`hot-${h.city}`}
                    position={[g.lat, g.lng]}
                    icon={hotspotIcon(h.count, activeHotspot === h.city)}
                    eventHandlers={{
                      click: () => {
                        setActiveHotspot(h.city);
                        setHotspotFly({ lat: g.lat, lng: g.lng, seq: Date.now() });
                      }
                    }}
                  />
                );
              })}
            <FreeFlyer target={hotspotFly} />
          </MapContainer>

          {/* Full-screen controls row — compact layer toggles floating on the map */}
          {isMapFullscreen && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl text-[10px] font-semibold max-w-[calc(100vw-7rem)] overflow-x-auto">
              {([
                ['travelers', 'bg-rose-500', 'Travellers'],
                ['hotspots', 'bg-slate-900', 'City Buzz'],
                ['current', 'bg-emerald-500', 'Current'],
                ['visited', 'bg-sky-600', 'Visited'],
                ['dream', 'bg-amber-500', 'Dream']
              ] as const).map(([key, dotClass, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPinLayers((p) => ({ ...p, [key]: !p[key] }))}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    pinLayers[key] ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 line-through'
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 text-white text-[10px] font-bold backdrop-blur shadow-md">
              <LocateFixed className="w-3 h-3 text-emerald-300" />
              {mapZoom > 3
                ? mapZoom > 3.5 && pinLayers.hotspots
                  ? `Zoom ${mapZoom.toFixed(1)}× · City Buzz counts hidden — travellers clear`
                  : `Zoom ${mapZoom.toFixed(1)}×`
                : 'Scroll / pinch to zoom · drag to explore'}
            </span>
          </div>

          {/* Full-screen toggle */}
          <button
            type="button"
            onClick={() => setIsMapFullscreen((v) => !v)}
            className="absolute top-3 right-3 z-[600] w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
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
                className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer transition-colors"
                title="Show map legend"
              >
                <Info className="w-4 h-4" />
              </button>
            ) : (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg space-y-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 pointer-events-auto">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Map legend</div>
                  <button
                    type="button"
                    onClick={() => setLegendCollapsed(true)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer -mr-0.5 p-0.5"
                    title="Minimise legend"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#10b981', opacity: 0.4, border: '1px solid #10b981' }} />
                Current country
                <span className="w-2 h-2 rounded-full ml-2" style={{ background: '#10b981', outline: '1.5px solid #0f172a' }} />
                Current city
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#0ea5e9', opacity: 0.35, border: '1px solid #0ea5e9' }} />
                Visited country
                <span className="w-2 h-2 rounded-full ml-2" style={{ background: '#0ea5e9', outline: '1.5px solid #0f172a' }} />
                Visited city
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f59e0b', opacity: 0.35, border: '1px solid #f59e0b' }} />
                Dream country
                <span className="w-2 h-2 rounded-full ml-2" style={{ background: '#f59e0b', outline: '1.5px solid #0f172a' }} />
                Dream city
              </div>
              <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-200/70 dark:border-slate-700/70">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                Traveller pins
              </div>
              </div>
            )}
          </div>

          {/* Journal floating button — opens the on-map Memories Journal drawer */}
          {!isJournalOpen && (
            <button
              type="button"
              onClick={() => setIsJournalOpen(true)}
              className="absolute bottom-28 sm:bottom-4 right-3 z-[600] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/85 dark:bg-slate-800/95 backdrop-blur-md text-white text-[11px] font-bold shadow-xl border border-white/20 hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
              title="Open your Memories Journal on the map"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Journal ({memories.length})</span>
            </button>
          )}

          {/* On-map Memories Journal — your saved places, right on the map.
              Tap any entry to fly to its city dot. Everything stays saved in your journal below. */}
          {isJournalOpen && (
            <div className="absolute z-[600] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[55%] max-sm:rounded-t-2xl sm:top-3 sm:bottom-3 sm:right-3 sm:w-80 sm:rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  <span className="font-display font-bold text-sm text-slate-900 dark:text-slate-100">
                    Memories Journal
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {filteredMemories.length}/{memories.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsJournalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Close journal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status filter pills */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto shrink-0">
                {(['all', 'Visited', 'Current Location', 'Dream Next'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {filter === 'all' ? `All (${memories.length})` : filter.replace('Current Location', 'Current')}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {filteredMemories.length === 0 ? (
                  <div className="p-6 text-center text-[11px] text-slate-400">
                    No memories under this filter yet.
                  </div>
                ) : (
                  filteredMemories.map((mem) => {
                    const thumb = mem.photos[0] || DEFAULT_MEMORY_PHOTO;
                    return (
                      <div
                        key={`j-${mem.id}`}
                        className="group/j flex items-start gap-2.5 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                        onClick={() => flyToMemory(mem)}
                        title="Fly to this memory on the map"
                      >
                        <img
                          src={thumb}
                          alt={mem.destination}
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: STATUS_STYLES[mem.status].dot }}
                            />
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {mem.destination}, {mem.country}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{mem.date}</div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                            {mem.memoryNote}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditMemory(mem);
                          }}
                          className="p-1 rounded-lg text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover/j:opacity-100 transition-opacity cursor-pointer shrink-0"
                          title="Edit this memory"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingMemoryId(null);
                  setNewCity('');
                  setNewCountry('');
                  setNewNote('');
                  setNewTaggedCompanion('');
                  setNewPhotos([DEFAULT_MEMORY_PHOTO]);
                  setSelectedItineraryId('');
                  setIsAddMemoryModalOpen(true);
                }}
                className="m-2.5 mt-0 shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl hover:brightness-105 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record a New Memory</span>
              </button>
            </div>
          )}

          {/* Active Pin Overlay Card (stays fixed, not zoomed) */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/60 dark:border-slate-700 rounded-2xl p-3.5 shadow-2xl z-[500]">
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
                      {activePinInfo.isMe ? `You (${currentUser.name.split(' ')[0]})` : activePinTraveler.name}
                    </span>
                    {activePinInfo.isMe && (
                      <span className="text-[9px] bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 px-1.5 py-0.5 rounded-full font-bold">
                        You are here
                      </span>
                    )}
                    {!activePinInfo.isMe && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActiveConfirmed
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {isActiveConfirmed ? 'Confirmed companion' : 'Current position only'}
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
                  <>
                    <button
                      type="button"
                      onClick={() => setProfileTravelerId(activePinTraveler.id)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChatWithTraveler(activePinTraveler, activePinInfo.destination)}
                      className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-orange-500/25"
                    >
                      Say Hello
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onGoToItinerary(MY_DESTINATION)}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    My Itinerary
                  </button>
                )}
              </div>
            </div>

            {/* Distance from you + privacy note */}
            {!activePinInfo.isMe && distanceKm !== null && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 text-[10px] font-bold">
                  <Plane className="w-3 h-3" />
                  {formatDistance(distanceKm)} away from you
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                  {estimateFlightTime(distanceKm)}
                </span>
                {!isActiveConfirmed && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    Visited & dream pins unlock after mutual confirmation
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map privacy selector — OTHERS SEE ME: who can see my pins */}
        {!isMapFullscreen && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50/60 dark:bg-slate-900">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Others see me — who can see my Visited & Dream pins:
          </span>
          <div className="flex items-center gap-1.5">
            {([
              ['everyone', 'Everyone'],
              ['companions', 'Confirmed companions only'],
              ['current', 'Current location only']
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setMapPrivacy(val)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                  mapPrivacy === val
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Traveller profile popup — tap "View Profile" on any map pin */}
      {profileTravelerId && (
        <TravelerProfilePopup
          traveler={getTravelerById(profileTravelerId)}
          currentUserId={currentUser.id}
          itineraries={itineraries}
          onClose={() => setProfileTravelerId(null)}
          onOpenChat={(t) => onOpenChatWithTraveler(t)}
        />
      )}

      {/* City Buzz — Nomad-Table-style "who's travelling where" leaderboard */}<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span>City Buzz · Live</span>
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Where Solo Travellers Are Right Now
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tap a city to fly there on the map and see who's around.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {CITY_HOTSPOTS.reduce((a, h) => a + h.count, 0).toLocaleString()} travellers online
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-thin">
          {CITY_HOTSPOTS.map((h, rank) => {
            const isActive = activeHotspot === h.city;
            const pinsHere = MAP_TRAVELER_PINS.filter(
              (p) => p.destination.toLowerCase().split(',')[0].trim() === h.city || (h.city === 'amalfi' && p.destination.includes('Amalfi'))
            );
            return (
              <button
                key={h.city}
                type="button"
                onClick={() => {
                  const g = geoFor(h.city);
                  setActiveHotspot(h.city);
                  if (g) setHotspotFly({ lat: g.lat, lng: g.lng, seq: Date.now() });
                }}
                className={`snap-start shrink-0 w-52 text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-amber-300' : 'text-slate-400'}`}>
                    #{rank + 1}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/15 text-white' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  }`}>
                    <Users className="w-2.5 h-2.5" />
                    {h.count}
                  </span>
                </div>
                <div className={`mt-1.5 font-bold text-sm leading-tight truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                  {h.label.split(',')[0]}
                </div>
                <div className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {h.label.split(',').slice(1).join(',').trim()}
                </div>
                <div className={`mt-1.5 text-[10px] italic truncate ${isActive ? 'text-amber-200/90' : 'text-rose-500 dark:text-rose-400'}`}>
                  {h.vibe}
                </div>
                {pinsHere.length > 0 && (
                  <div className="mt-2 flex items-center -space-x-1.5">
                    {pinsHere.slice(0, 4).map((p) => {
                      const t = getTravelerById(p.id);
                      return (
                        <img
                          key={p.id}
                          src={t.avatar}
                          alt={t.name}
                          className="w-5 h-5 rounded-full object-cover border-2 border-white dark:border-slate-800"
                        />
                      );
                    })}
                    <span className={`pl-2.5 text-[9px] font-semibold ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      on WanderLust
                    </span>
                  </div>
                )}
              </button>
            );
          })}
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
                  {/* Photo carousel — tap to open lightbox */}
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-orange-100 via-rose-100 to-amber-100 dark:from-slate-800 dark:to-slate-800">
                    <img
                      key={photos[idx]}
                      src={photos[idx]}
                      alt={mem.destination}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                      onClick={() => openLightbox(photos, idx, `${mem.destination}, ${mem.country}`)}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 cursor-zoom-in"
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
                    {editingNoteId === mem.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-y"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-2.5 py-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNote(mem.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-md cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group/note">
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic pr-6">
                          "{mem.memoryNote}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(mem.id);
                            setEditNoteText(mem.memoryNote);
                          }}
                          className="absolute top-0 right-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-0 group-hover/note:opacity-100 transition-opacity cursor-pointer"
                          title="Edit this memory note"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Companions Tagged (optional — each chip can be removed) */}
                    {mem.companionsTagged.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          With:
                        </span>
                        {mem.companionsTagged.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 pl-2 pr-1 py-0.5 rounded-full"
                          >
                            {c}
                            <button
                              type="button"
                              onClick={() => handleRemoveMemoryCompanion(mem.id, c)}
                              className="p-0.5 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900 text-orange-500 hover:text-orange-800 dark:hover:text-orange-200 transition-colors cursor-pointer"
                              title={`Remove ${c} from this memory`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
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

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditMemory(mem)}
                      className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1 transition-colors cursor-pointer"
                      title="Edit this memory (photos, companions, note...)"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareMemory(mem)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      title="Share this memory"
                    >
                      <Share2 className="w-3.5 h-3.5" />
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Photo Lightbox — tap photo to pop up, zoom in/out, click outside to close */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[1000] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAddMemoryModalOpen(false);
                setEditingMemoryId(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
              {editingMemoryId ? 'Edit Travel Memory' : 'Record a Travel Memory'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {editingMemoryId
                ? 'Update the destination, photos, companions you traveled with, and your journal passage.'
                : 'Add a place you have gone to, your companion buddies, photos, and personal memory notes.'}
            </p>

            <form onSubmit={handleCreateMemory} className="mt-4 space-y-3.5 text-xs">
              {/* Generate journal from one of my itineraries */}
              {itineraries.length > 0 && !editingMemoryId && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border border-rose-200/70 dark:border-rose-900/50">
                  <label className="block font-semibold text-rose-800 dark:text-rose-300 mb-1.5">
                    Generate from my itinerary (optional)
                  </label>
                  <select
                    value={selectedItineraryId}
                    onChange={(e) => generateFromItinerary(e.target.value)}
                    className="w-full px-3 py-2 border border-rose-200 dark:border-rose-900 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Multi-photo inputs (up to 9) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photos (add up to 9)
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
