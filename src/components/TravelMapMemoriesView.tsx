import React, { useState } from 'react';
import { SoloTraveler, TravelMemory } from '../types/travel';
import {
  MapPin,
  Share2,
  Plus,
  Compass,
  Calendar,
  Sparkles,
  Users,
  Camera,
  Trash2,
  Check,
  Globe,
  Navigation as NavIcon,
  X,
  ExternalLink,
  Heart
} from 'lucide-react';

interface TravelMapMemoriesViewProps {
  currentUser: SoloTraveler;
  travelers: SoloTraveler[];
  onOpenChatWithTraveler: (traveler: SoloTraveler, destination?: string) => void;
  onGoToItinerary: (destination: string) => void;
}

const INITIAL_MEMORIES: TravelMemory[] = [
  {
    id: 'mem_kyoto_1',
    destination: 'Kyoto',
    country: 'Japan',
    coordinates: { x: 81, y: 40 },
    date: 'Oct 2026',
    photoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    memoryNote: 'Met Kenji at 6:30 AM before the Fushimi Inari torii gates got crowded. Unforgettable crisp autumn morning mist, quiet bamboo groves, and hot matcha soba noodles afterwards!',
    companionsTagged: ['Kenji Sato'],
    status: 'Current Location'
  },
  {
    id: 'mem_dubrovnik_1',
    destination: 'Dubrovnik',
    country: 'Croatia',
    coordinates: { x: 52, y: 36 },
    date: 'Sep 2026',
    photoUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
    memoryNote: 'Walked the ancient polished limestone fortress walls with Sofia. We discovered the secret cliffside hole leading to Buža bar and swam directly into the turquoise Adriatic Sea at sunset.',
    companionsTagged: ['Sofia Morales'],
    status: 'Visited'
  },
  {
    id: 'mem_oaxaca_1',
    destination: 'Oaxaca',
    country: 'Mexico',
    coordinates: { x: 24, y: 48 },
    date: 'Aug 2026',
    photoUrl: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=800&q=80',
    memoryNote: 'Feasted on 7 varieties of authentic mole in Mercado 20 de Noviembre, explored Hierve el Agua calcified waterfalls, and visited a traditional agave distillery with Maya.',
    companionsTagged: ['Maya Lin'],
    status: 'Visited'
  },
  {
    id: 'mem_amalfi_1',
    destination: 'Amalfi Coast',
    country: 'Italy',
    coordinates: { x: 50, y: 38 },
    date: 'Jul 2026',
    photoUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
    memoryNote: 'Hiked the Path of the Gods (Sentiero degli Dei) high above the cliffs with Liam. Shared a wooden boat rental to Capri and ate fresh lemon pasta by the harbour.',
    companionsTagged: ['Liam O\'Connor'],
    status: 'Visited'
  },
  {
    id: 'mem_barcelona_1',
    destination: 'Barcelona',
    country: 'Spain',
    coordinates: { x: 47, y: 37 },
    date: 'Planned May 2027',
    photoUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=800&q=80',
    memoryNote: 'Dreaming of a Gothic Quarter tapas marathon, Park Güell sunset photography, and a day trip carpool to the Costa Brava rocky coves.',
    companionsTagged: ['Lucas Silva'],
    status: 'Dream Next'
  }
];

// Pins placed on interactive stylized map coordinate canvas (0-100% X, 0-100% Y)
const MAP_TRAVELER_PINS = [
  { id: 'user_current', name: 'You (Elena)', destination: 'Kyoto, Japan', x: 81.5, y: 41, isMe: true },
  { id: 'user_kenji', name: 'Kenji', destination: 'Tokyo, Japan', x: 83, y: 39, isMe: false },
  { id: 'user_sofia', name: 'Sofia', destination: 'Dubrovnik, Croatia', x: 53, y: 36, isMe: false },
  { id: 'user_lucas', name: 'Lucas', destination: 'Barcelona, Spain', x: 47, y: 38, isMe: false },
  { id: 'user_maya', name: 'Maya', destination: 'Oaxaca, Mexico', x: 23, y: 49, isMe: false },
  { id: 'user_liam', name: 'Liam', destination: 'Amalfi Coast, Italy', x: 50.5, y: 39, isMe: false },
  { id: 'user_sarah', name: 'Sarah', destination: 'Melbourne, Australia', x: 87, y: 78, isMe: false },
  { id: 'user_alex', name: 'Alex', destination: 'Reykjavik, Iceland', x: 42, y: 20, isMe: false }
];

export const TravelMapMemoriesView: React.FC<TravelMapMemoriesViewProps> = ({
  currentUser,
  travelers,
  onOpenChatWithTraveler,
  onGoToItinerary
}) => {
  const [memories, setMemories] = useState<TravelMemory[]>(() => {
    const saved = localStorage.getItem('wanderlust_travel_memories');
    return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'Visited' | 'Current Location' | 'Dream Next'>('all');
  const [selectedPinId, setSelectedPinId] = useState<string>('user_current');
  const [shareCopied, setShareCopied] = useState(false);
  const [isAddMemoryModalOpen, setIsAddMemoryModalOpen] = useState(false);

  // New Memory Form State
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newDate, setNewDate] = useState('October 2026');
  const [newPhoto, setNewPhoto] = useState('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80');
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

    const newMem: TravelMemory = {
      id: `mem_${Date.now()}`,
      destination: newCity,
      country: newCountry,
      coordinates: { x: Math.floor(Math.random() * 60) + 20, y: Math.floor(Math.random() * 40) + 30 },
      date: newDate,
      photoUrl: newPhoto,
      memoryNote: newNote || `Wonderful moments captured traveling solo in ${newCity}, ${newCountry}!`,
      companionsTagged: newTaggedCompanion ? [newTaggedCompanion] : [],
      status: newStatus
    };

    saveMemories([newMem, ...memories]);
    setIsAddMemoryModalOpen(false);
    setNewCity('');
    setNewCountry('');
    setNewNote('');
    setNewTaggedCompanion('');
  };

  const handleDeleteMemory = (id: string) => {
    saveMemories(memories.filter((m) => m.id !== id));
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-md mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Nomad Radar & Scratchpad</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
            Travel Map & Places Gone
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            View live solo traveler locations on the map, share your location safely, and log memories for everywhere you've journeyed.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleShareLocation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{shareCopied ? 'Location Copied!' : 'Share Your Location'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddMemoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Memory</span>
          </button>
        </div>
      </div>

      {/* Map Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {/* Map Top Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Live Solo Radar: {MAP_TRAVELER_PINS.length} Travelers Active Worldwide
            </span>
          </div>

          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-2">
            <span>Tap any profile pin to view traveler & destination</span>
          </div>
        </div>

        {/* Interactive Stylized World Map Canvas */}
        <div className="relative w-full h-96 sm:h-[420px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-hidden select-none">
          {/* Subtle Grid Lines */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Continents Graphic Backdrop (SVG Stylized World Silhouette) */}
          <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 1000 500" fill="currentColor">
            {/* North America */}
            <path className="text-slate-700" d="M120,80 Q160,60 220,70 Q280,80 260,130 Q280,180 250,220 Q220,240 180,260 Q160,210 130,170 Q100,120 120,80 Z" />
            {/* South America */}
            <path className="text-slate-700" d="M220,270 Q270,280 280,330 Q270,400 240,450 Q210,430 200,360 Q190,300 220,270 Z" />
            {/* Europe */}
            <path className="text-slate-700" d="M460,80 Q520,70 540,110 Q530,160 480,180 Q440,160 430,120 Q440,90 460,80 Z" />
            {/* Africa */}
            <path className="text-slate-700" d="M460,190 Q540,190 560,250 Q560,340 500,400 Q440,360 430,280 Q430,220 460,190 Z" />
            {/* Asia */}
            <path className="text-slate-700" d="M550,80 Q700,60 840,100 Q860,180 780,240 Q680,250 620,210 Q560,160 550,80 Z" />
            {/* Australia */}
            <path className="text-slate-700" d="M780,320 Q860,310 880,360 Q850,420 780,410 Q740,370 780,320 Z" />
          </svg>

          {/* Connecting Routes / Flights between companions */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M 530 151 Q 670 120 815 172"
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="2"
              strokeDasharray="6 4"
              className="animate-pulse opacity-60"
            />
            <path
              d="M 230 205 Q 380 180 505 163"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="opacity-40"
            />
          </svg>

          {/* Traveler Interactive Avatar Pins */}
          {MAP_TRAVELER_PINS.map((pin) => {
            const isSelected = selectedPinId === pin.id;
            const traveler = getTravelerById(pin.id);

            return (
              <div
                key={pin.id}
                onClick={() => setSelectedPinId(pin.id)}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
              >
                {/* Ping wave for Current User */}
                {pin.isMe && (
                  <span className="absolute -inset-2.5 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
                )}

                <div
                  className={`relative flex items-center justify-center rounded-full transition-transform duration-300 ${
                    isSelected
                      ? 'scale-125 ring-3 ring-rose-400 shadow-xl'
                      : 'hover:scale-115 ring-2 ring-white/80 dark:ring-slate-700'
                  }`}
                >
                  <img
                    src={traveler.avatar}
                    alt={pin.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-md"
                  />

                  {/* Marker Pin Badge */}
                  {pin.isMe ? (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs">
                      📍
                    </span>
                  ) : (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                  )}
                </div>

                {/* Name Label */}
                <div
                  className={`absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-semibold transition-opacity duration-200 pointer-events-none ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-700/60 opacity-80 group-hover:opacity-100'
                  }`}
                >
                  {pin.name}
                </div>
              </div>
            );
          })}

          {/* Quick Active Pin Overlay Card on bottom left */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 text-white shadow-2xl z-30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={activePinTraveler.avatar}
                alt={activePinTraveler.name}
                className="w-11 h-11 rounded-full object-cover border border-slate-600 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-xs truncate">
                    {activePinInfo.isMe ? 'You (Elena)' : activePinTraveler.name}
                  </span>
                  {activePinInfo.isMe && (
                    <span className="text-[10px] bg-rose-500/30 text-rose-300 border border-rose-500/50 px-1.5 py-0.2 rounded font-semibold">
                      Your Profile
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="truncate">{activePinInfo.destination}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {!activePinInfo.isMe ? (
                <button
                  type="button"
                  onClick={() => onOpenChatWithTraveler(activePinTraveler, activePinInfo.destination)}
                  className="px-3 py-1.5 bg-white text-slate-950 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Say Hello
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onGoToItinerary('Kyoto, Japan')}
                  className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  My Itinerary
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Places Gone & Memories Journal Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Places You've Gone & Memories Journal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              A personal memory ledger recording stories, companion tags, and photos for every city and country visited.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs overflow-x-auto">
            {(['all', 'Visited', 'Current Location', 'Dream Next'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
                }`}
              >
                {filter === 'all' ? `All (${memories.length})` : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Memories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Photo with badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={mem.photoUrl}
                    alt={mem.destination}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{mem.destination}, {mem.country}</span>
                  </div>

                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs ${
                      mem.status === 'Current Location'
                        ? 'bg-emerald-500 text-white'
                        : mem.status === 'Visited'
                        ? 'bg-blue-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {mem.status}
                  </span>

                  <div className="absolute bottom-2.5 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    {mem.date}
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
                          className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full"
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
                  className="font-medium hover:text-slate-900 dark:hover:text-slate-100 underline cursor-pointer"
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
          ))}
        </div>
      </div>

      {/* Record New Travel Memory Modal */}
      {isAddMemoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddMemoryModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newPhoto}
                  onChange={(e) => setNewPhoto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-none"
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
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
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
