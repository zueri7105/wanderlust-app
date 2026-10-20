import React, { useState, useRef, useEffect } from 'react';
import { TravelTrip, SoloTraveler, TravelItinerary, TripScope, CompanionReview } from '../types/travel';
import {
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  Star,
  MessageSquare,
  Compass,
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Check,
  Send
} from 'lucide-react';
import { generateCompanionIcebreakers, generateJointTripPlan } from '../services/geminiService';
import { getAppSettings } from '../utils/settings';
import { getTranslation } from '../utils/i18n';
import { DestinationSelector } from './DestinationSelector';
import { TravelerProfilePopup } from './TravelerProfilePopup';
import { recordSearch, getTopSearches } from '../data/searchHistory';

interface CompanionMatcherProps {
  trips: TravelTrip[];
  itineraries: TravelItinerary[];
  travelers: SoloTraveler[];
  currentUser: SoloTraveler;
  selectedDestination: string;
  onSelectDestination: (destination: string) => void;
  selectedInterest: string;
  onSelectInterest: (interest: string) => void;
  selectedScope: string;
  onSelectScope: (scope: string) => void;
  onToggleStarTraveler: (travelerId: string) => void;
  onOpenChatWithTraveler: (traveler: SoloTraveler, destination: string) => void;
  onViewActivitiesForDestination: (destination: string) => void;
  onAddReview?: (travelerId: string, review: CompanionReview) => void;
}

const SCOPE_OPTIONS = [
  'All Trips',
  'Full Trip',
  'Part of Trip',
  'Flexible (Full or Part)'
];

const INTEREST_OPTIONS = [
  'All Interests',
  'Photography',
  'Day Hikes',
  'Street Food',
  'Architecture',
  'Roadtrips',
  'Sailing & Boating'
];

export const CompanionMatcher: React.FC<CompanionMatcherProps> = ({
  trips,
  itineraries,
  travelers,
  currentUser,
  selectedDestination,
  onSelectDestination,
  selectedInterest,
  onSelectInterest,
  selectedScope,
  onSelectScope,
  onToggleStarTraveler,
  onOpenChatWithTraveler,
  onViewActivitiesForDestination,
  onAddReview
}) => {
  const [activeTravelerModal, setActiveTravelerModal] = useState<SoloTraveler | null>(null);
  // Avatar-tap profile popup (bio + public trips)
  const [profilePopupTravelerId, setProfilePopupTravelerId] = useState<string | null>(null);
  const [viewSavedOnly, setViewSavedOnly] = useState(false);
  const [femaleOnly, setFemaleOnly] = useState(false);
  const [connectModalData, setConnectModalData] = useState<{
    traveler: SoloTraveler;
    trip: TravelTrip;
    icebreakers: string[];
    loadingIcebreakers: boolean;
  } | null>(null);

  const [aiItinerary, setAiItinerary] = useState<{
    loading: boolean;
    data: any | null;
  }>({ loading: false, data: null });

  // Ref to auto-scroll down to potential travel companions section when search is pressed
  const resultsSectionRef = useRef<HTMLDivElement>(null);

  // Local search inputs synced with props
  const [inputDest, setInputDest] = useState(selectedDestination);
  const [inputScope, setInputScope] = useState(selectedScope);
  const [inputInterest, setInputInterest] = useState(selectedInterest);

  // Companion Rating & Review State
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewDest, setReviewDest] = useState<string>('Kyoto, Japan');
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  useEffect(() => {
    setInputDest(selectedDestination);
  }, [selectedDestination]);

  useEffect(() => {
    setInputScope(selectedScope);
  }, [selectedScope]);

  useEffect(() => {
    setInputInterest(selectedInterest);
  }, [selectedInterest]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputDest && inputDest !== 'All Destinations') recordSearch(inputDest);
    onSelectDestination(inputDest);
    onSelectScope(inputScope);
    onSelectInterest(inputInterest);
    setViewSavedOnly(false);

    // Auto-scroll down smoothly to find potential travel companions
    setTimeout(() => {
      resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const getTraveler = (id: string) => travelers.find((t) => t.id === id) || travelers[0];

  // User's active destinations from trips & itineraries
  const userDestinations = [
    ...trips.filter((t) => t.travelerId === currentUser.id).map((t) => t.destination.toLowerCase()),
    ...itineraries.map((it) => it.destination.toLowerCase())
  ];

  // Helper to calculate date overlap with current user's trips
  const getOverlapDetails = (trip: TravelTrip) => {
    const userTrip = trips.find(
      (t) =>
        t.travelerId === currentUser.id &&
        t.destination.toLowerCase().includes(trip.destination.toLowerCase().split(',')[0].trim())
    );

    if (!userTrip) {
      return {
        overlapText: 'Nearby window',
        overlapDays: 3,
        matchScore: 85,
        sharedInterests: trip.interests.filter((i) => currentUser.interests.includes(i))
      };
    }

    const tripStart = new Date(trip.startDate).getTime();
    const tripEnd = new Date(trip.endDate).getTime();
    const userStart = new Date(userTrip.startDate).getTime();
    const userEnd = new Date(userTrip.endDate).getTime();

    const start = Math.max(tripStart, userStart);
    const end = Math.min(tripEnd, userEnd);
    const diffDays = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

    const shared = trip.interests.filter((i) => currentUser.interests.includes(i));
    const score = Math.min(99, 75 + diffDays * 3 + shared.length * 4);

    return {
      overlapText: diffDays > 0 ? `${diffDays} days overlapping dates` : 'Nearby dates',
      overlapDays: diffDays,
      matchScore: score,
      sharedInterests: shared
    };
  };

  // Filter trips based on selected criteria
  const baseFilteredTrips = trips.filter((trip) => {
    if (trip.travelerId === currentUser.id) return false;

    const traveler = getTraveler(trip.travelerId);

    // Female companions only filter for women safety
    if (femaleOnly && traveler.gender !== 'female') {
      return false;
    }

    if (viewSavedOnly && !traveler.isStarred) {
      return false;
    }

    if (selectedDestination !== 'All Destinations') {
      const q = selectedDestination.toLowerCase().split(',')[0].trim();
      if (!trip.destination.toLowerCase().includes(q)) return false;
    }

    if (selectedScope !== 'All Trips' && trip.tripScope !== selectedScope) {
      return false;
    }

    if (selectedInterest !== 'All Interests') {
      const match = trip.interests.some(
        (i) => i.toLowerCase().includes(selectedInterest.toLowerCase())
      );
      if (!match) return false;
    }

    return true;
  });

  // Categorize: 1) Matches with Itinerary / My upcoming trips, 2) Other potential companions
  const itineraryMatchedTrips = baseFilteredTrips.filter((trip) =>
    userDestinations.some((d) => d.includes(trip.destination.toLowerCase().split(',')[0]))
  );

  const otherPotentialTrips = baseFilteredTrips.filter(
    (trip) => !userDestinations.some((d) => d.includes(trip.destination.toLowerCase().split(',')[0]))
  );

  // Safety setting: when "Prioritise Female Solo Travellers" is enabled in
  // Settings, verified female travelers are surfaced first in every list.
  const femaleSafetyPriority = getAppSettings().femaleSafetyPriority;
  const prioritizeFemale = (list: TravelTrip[]) =>
    femaleSafetyPriority
      ? [...list].sort((a, b) => {
          const af = getTraveler(a.travelerId).gender === 'female' ? 0 : 1;
          const bf = getTraveler(b.travelerId).gender === 'female' ? 0 : 1;
          return af - bf;
        })
      : list;
  const sortedItineraryMatches = prioritizeFemale(itineraryMatchedTrips);
  const sortedOtherTrips = prioritizeFemale(otherPotentialTrips);

  // Count ALL starred companions (total saved by the user, across destinations)
  const starredCount = travelers.filter((t) => t.isStarred && t.id !== currentUser.id).length;

  const handleOpenConnect = async (trip: TravelTrip, traveler: SoloTraveler) => {
    const { sharedInterests } = getOverlapDetails(trip);
    setConnectModalData({
      traveler,
      trip,
      icebreakers: [],
      loadingIcebreakers: true
    });

    try {
      const icebreakers = await generateCompanionIcebreakers(
        currentUser,
        traveler,
        trip.destination,
        sharedInterests,
        trip.tripScope
      );
      setConnectModalData((prev) =>
        prev ? { ...prev, icebreakers, loadingIcebreakers: false } : null
      );
    } catch {
      setConnectModalData((prev) =>
        prev
          ? {
              ...prev,
              icebreakers: [
                `Hey ${traveler.name}, saw you'll be in ${trip.destination.split(',')[0]} too! Are you open to traveling together or teaming up for shared activities?`
              ],
              loadingIcebreakers: false
            }
          : null
      );
    }
  };

  const handleGenerateSharedPlan = async (traveler: SoloTraveler, destination: string) => {
    setAiItinerary({ loading: true, data: null });
    try {
      const plan = await generateJointTripPlan(destination, currentUser, traveler, 2);
      setAiItinerary({ loading: false, data: plan });
    } catch {
      setAiItinerary({
        loading: false,
        data: {
          title: 'Joint Travel Plan',
          summary: 'Balanced shared itinerary for traveling together.',
          days: []
        }
      });
    }
  };

  const AVATAR_GRADIENTS = [
    'from-rose-500 to-orange-400',
    'from-violet-500 to-fuchsia-400',
    'from-sky-500 to-cyan-400',
    'from-emerald-500 to-teal-400',
    'from-amber-500 to-yellow-400',
    'from-indigo-500 to-blue-400'
  ];

  const scoreColor = (score: number) =>
    score >= 92
      ? 'from-emerald-500 to-teal-400'
      : score >= 85
        ? 'from-rose-500 to-orange-400'
        : 'from-slate-500 to-slate-400';

  // Companion card — avatar-led, match-score badge, brand-gradient actions
  const renderSuccinctTripCard = (trip: TravelTrip) => {
    const traveler = getTraveler(trip.travelerId);
    const { overlapText, matchScore, sharedInterests } = getOverlapDetails(trip);
    const isStarred = !!traveler.isStarred;
    const gradient = AVATAR_GRADIENTS[traveler.name.charCodeAt(0) % AVATAR_GRADIENTS.length];

    return (
      <div
        key={trip.id}
        className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-rose-500/5 hover:-translate-y-0.5 hover:border-rose-200 dark:hover:border-rose-900/60 transition-all duration-200 shadow-xs"
      >
        {/* Top brand accent line */}
        <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />

        <div className="p-5 flex-1">
          {/* Card Top: Avatar, Name, Match Score & Star */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {traveler.avatar ? (
                <button
                  type="button"
                  onClick={() => setProfilePopupTravelerId(traveler.id)}
                  className="shrink-0 cursor-pointer rounded-full hover:scale-105 transition-transform"
                  title={`View ${traveler.name.split(' ')[0]}'s profile`}
                >
                  <img
                    src={traveler.avatar}
                    alt={traveler.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-md"
                  />
                </button>
              ) : (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} text-white font-bold flex items-center justify-center text-base shrink-0 shadow-md`}>
                  {traveler.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-slate-950 dark:text-slate-50 truncate">
                    {traveler.name}
                  </span>
                  {traveler.gender === 'female' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 px-1.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      <span>Female Solo</span>
                    </span>
                  )}
                  {femaleSafetyPriority && traveler.gender === 'female' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-rose-600 px-1.5 py-0.5 rounded-full shadow-xs">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Priority</span>
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {traveler.homeCity}, {traveler.country} · {traveler.soloTripsCount} solo trips
                </div>
              </div>
            </div>

            {/* Star Favorite Button */}
            <button
              type="button"
              onClick={() => onToggleStarTraveler(traveler.id)}
              className={`p-2 rounded-full border transition-all cursor-pointer shrink-0 hover:scale-110 ${
                isStarred
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-500'
              }`}
              title={isStarred ? 'Unstar companion' : 'Star companion'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
          </div>

          {/* Destination + Match score */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-950 dark:text-slate-50 text-sm min-w-0">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{trip.destination}</span>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white bg-gradient-to-r ${scoreColor(matchScore)} shadow-sm shrink-0`}>
              <Sparkles className="w-3 h-3" />
              {matchScore}% Match
            </span>
          </div>

          {/* Dates, scope, overlap chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono tabular-nums">
              <Calendar className="w-3 h-3 text-slate-400" />
              {trip.startDate} – {trip.endDate}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-semibold border border-violet-100 dark:border-violet-900/60">
              {trip.tripScope}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-100 dark:border-emerald-900/60">
              {overlapText}
            </span>
          </div>

          {/* Headline Quote */}
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed line-clamp-2 border-l-2 border-rose-300 dark:border-rose-800 pl-2.5">
            "{trip.headline}"
          </p>

          {/* Shared Interests Badges */}
          <div className="flex flex-wrap gap-1.5 pt-3">
            {trip.interests.slice(0, 4).map((int) => {
              const isShared = currentUser.interests.includes(int);
              return (
                <span
                  key={int}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                    isShared
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isShared && '✓ '}{int}
                </span>
              );
            })}
          </div>

          {/* Traveller Pace & Trust stats */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Pace: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{traveler.travelPace}</strong></span>
            <span className="font-mono tabular-nums">{traveler.budgetTier}</span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-slate-700 dark:text-slate-200">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              {traveler.safetyRating}
            </span>
          </div>

          {sharedInterests.length > 0 && (
            <div className="mt-2 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              ♥ {sharedInterests.length} shared interest{sharedInterests.length === 1 ? '' : 's'} with you
            </div>
          )}
        </div>

        {/* Card Action Footer */}
        <div className="px-5 pb-5 flex items-center justify-between gap-2">
          <button
            onClick={() => setActiveTravelerModal(traveler)}
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer py-1 underline-offset-2 hover:underline"
          >
            Bio & Trust
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChatWithTraveler(traveler, trip.destination)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Message</span>
            </button>

            <button
              onClick={() => handleOpenConnect(trip, traveler)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:brightness-105 hover:shadow-md transition-all cursor-pointer shadow-xs"
            >
              <span>Connect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* 1. Cohesive Search Panel (Matching Explore Page) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        {/* Minimal header band */}
        <div className="p-6 sm:p-8 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Companion Search
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {getTranslation('matcherTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            {getTranslation('matcherSub')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              <Users className="w-3 h-3" />
              {baseFilteredTrips.length} travellers available
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              {starredCount} saved by you
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              <ShieldCheck className="w-3 h-3" />
              Verified community
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
        {/* Search Panel Form */}
        <form onSubmit={handleSearchSubmit} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Destination Selector (Categorized into Continents with Search Bar on top) */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Destination (By Continent)</span>
              </label>
              <DestinationSelector
                value={inputDest}
                onChange={(newDest) => {
                  setInputDest(newDest);
                  onSelectDestination(newDest);
                }}
              />
            </div>

            {/* Travel Scope Selector */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-rose-500" />
                <span>Travel Scope</span>
              </label>
              <select
                value={inputScope}
                onChange={(e) => setInputScope(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium h-[38px]"
              >
                {SCOPE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Shared Interest Selector */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-rose-500" />
                <span>Shared Interest</span>
              </label>
              <select
                value={inputInterest}
                onChange={(e) => setInputInterest(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium h-[38px]"
              >
                {INTEREST_OPTIONS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>

            {/* Explicit Search Button with Auto-Scroll */}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2 px-3 text-xs font-bold text-white bg-rose-600 rounded-lg hover:brightness-105 hover:shadow-md transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 h-[38px]"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Female Companions Only Filter Switch (For Protecting Females Travelling & Meeting Abroad) */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-rose-300 transition-colors">
              <input
                type="checkbox"
                checked={femaleOnly}
                onChange={(e) => setFemaleOnly(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Female Companions Only Filter
                </span>
                <span className="text-[10px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full font-medium">
                  Women Safety Protection
                </span>
              </div>
            </label>

            {/* Quick Destination Pill Tags — your most-searched destinations (or the world's top searches) */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Quick:</span>
              {['All Destinations', ...getTopSearches(5)].map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => {
                    setInputDest(dest);
                    onSelectDestination(dest);
                    if (dest !== 'All Destinations') recordSearch(dest);
                    setViewSavedOnly(false);
                    setTimeout(() => {
                      resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedDestination === dest
                      ? 'bg-rose-600 text-white font-bold shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-300 dark:hover:border-rose-800'
                  }`}
                >
                  {dest}
                </button>
                ))}
              </div>
            </div>
          </form>

        {/* Segmented View Switcher: All vs Saved Site */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setViewSavedOnly(false)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                !viewSavedOnly ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
            >
              All Companions ({baseFilteredTrips.length})
            </button>
            <button
              onClick={() => setViewSavedOnly(true)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewSavedOnly ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Saved / Starred Site ({starredCount})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            {selectedDestination !== 'All Destinations' ? (
              <span>Filtering for: <strong>{selectedDestination}</strong></span>
            ) : (
              <span>Showing all destinations</span>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* 2. Target Section: Auto-Scrolls here on Search */}
      <div ref={resultsSectionRef} className="scroll-mt-6">
        {/* VIEW 1: Starred / Saved Companions View */}
        {viewSavedOnly ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>Your Saved Travel Companions ({starredCount})</span>
              </div>
              <button
                onClick={() => setViewSavedOnly(false)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Show all companions
              </button>
            </div>

            {baseFilteredTrips.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No starred companions found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {selectedDestination !== 'All Destinations'
                    ? `You haven't starred any companions for ${selectedDestination} yet.`
                    : 'Tap the star icon on any travel companion card to save them here for quick access.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {baseFilteredTrips.map(renderSuccinctTripCard)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* CATEGORY 1: Companions Matching Your Itinerary & Upcoming Trips */}
            {itineraryMatchedTrips.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Companions Matching Your Itinerary & Upcoming Trips</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Travellers heading to the exact destinations and dates you have planned in your schedule.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-1 rounded-full font-semibold">
                    {sortedItineraryMatches.length} Direct Matches
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sortedItineraryMatches.map(renderSuccinctTripCard)}
                </div>
              </section>
            )}

            {/* CATEGORY 2: Potential Travel Companions */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                    {selectedDestination !== 'All Destinations'
                      ? `Potential Travel Companions in ${selectedDestination}`
                      : 'All Potential Solo Travel Companions'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Browse verified solo travelers ready to coordinate activities, share transit, or travel together.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {sortedOtherTrips.length} Available
                </span>
              </div>

              {otherPotentialTrips.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400">
                  {itineraryMatchedTrips.length > 0
                    ? 'All matching travelers for this destination are listed in the itinerary match section above.'
                    : 'No companions currently found for this filter. Try selecting "All Destinations" or post your own trip.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sortedOtherTrips.map(renderSuccinctTripCard)}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Traveller Detail Modal */}
      {/* Avatar-tap profile popup — bio + trips shared publicly */}
      {profilePopupTravelerId && (
        <TravelerProfilePopup
          traveler={travelers.find((t) => t.id === profilePopupTravelerId) || travelers[0]}
          currentUserId={currentUser.id}
          itineraries={itineraries}
          onClose={() => setProfilePopupTravelerId(null)}
          onOpenChat={(t) => onOpenChatWithTraveler(t, selectedDestination || t.currentDestination || '')}
        />
      )}

      {activeTravelerModal && (

        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveTravelerModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <img
                src={activeTravelerModal.avatar}
                alt={activeTravelerModal.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                    {activeTravelerModal.name}
                  </h3>
                  <button
                    onClick={() => onToggleStarTraveler(activeTravelerModal.id)}
                    className="p-1 text-amber-500 cursor-pointer"
                  >
                    <Star className={`w-4 h-4 ${activeTravelerModal.isStarred ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span>{activeTravelerModal.age} years old</span>
                  <span className="mx-1.5">·</span>
                  <span>{activeTravelerModal.homeCity}, {activeTravelerModal.country}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Solo Travel Philosophy
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                  {activeTravelerModal.bio}
                </p>
              </div>

              {/* Trust & Safety Attributes */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Trust & Safety Profile
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                  <div>• {activeTravelerModal.soloTripsCount} verified solo journeys</div>
                  <div>• {activeTravelerModal.vouchedByCount} companion vouches</div>
                  <div>• Emergency contact on file</div>
                  <div>• {activeTravelerModal.safetyRating}/5.0 safety score</div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Languages
                </div>
                <div className="text-slate-700 dark:text-slate-300 font-medium">
                  {activeTravelerModal.languages.join(' · ')}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Interests
                </div>
                <div className="text-slate-700 dark:text-slate-300 font-medium">
                  {activeTravelerModal.interests.join(' · ')}
                </div>
              </div>

              {/* Reviews & Ratings Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>Companion Reviews & Rating</span>
                      <span className="text-xs font-mono font-semibold text-slate-700">
                        ({activeTravelerModal.safetyRating.toFixed(1)} / 5.0 avg)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Feedback from fellow solo wanderers who met or traveled together.
                    </p>
                  </div>
                </div>

                {/* Existing Reviews List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {(activeTravelerModal.reviews && activeTravelerModal.reviews.length > 0) ? (
                    activeTravelerModal.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={rev.reviewerAvatar}
                              alt={rev.reviewerName}
                              className="w-6 h-6 rounded-full object-cover border border-slate-300"
                            />
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                              {rev.reviewerName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              · {rev.destinationVisited}
                            </span>
                          </div>

                          <div className="flex items-center text-amber-500 text-xs">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className="relative inline-flex w-3 h-3">
                                <Star className="w-3 h-3 text-slate-200" />
                                {rev.rating >= i + 1 && (
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-500 absolute inset-0" />
                                )}
                                {rev.rating >= i + 0.5 && rev.rating < i + 1 && (
                                  <span className="absolute inset-0 overflow-hidden w-1/2">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                  </span>
                                )}
                              </span>
                            ))}
                            <span className="ml-1 text-[10px] font-mono font-bold text-slate-500">
                              {rev.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                          "{rev.comment}"
                        </p>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {rev.date}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-[11px] text-slate-500 dark:text-slate-400">
                      No reviews yet for {activeTravelerModal.name.split(' ')[0]}. Be the first to leave a review!
                    </div>
                  )}
                </div>

                {/* Rate & Leave Review Form */}
                <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 mt-3">
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Rate {activeTravelerModal.name.split(' ')[0]} & Leave a Review:</span>
                    {reviewSuccess && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Review posted!
                      </span>
                    )}
                  </div>

                  {/* 5-Star Clickable Selector — supports half-star steps (4.5, 3.5, ...) */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">Your Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="relative inline-flex w-4 h-4">
                          {/* left half → star - 0.5 */}
                          <button
                            type="button"
                            onClick={() => setReviewRating(star - 0.5)}
                            className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer"
                            title={`${(star - 0.5).toFixed(1)} stars`}
                          />
                          {/* right half → full star */}
                          <button
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer"
                            title={`${star.toFixed(1)} stars`}
                          />
                          {/* base empty star */}
                          <Star className="w-4 h-4 text-slate-300" />
                          {/* filled portion: full, half, or none */}
                          {reviewRating >= star && (
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500 absolute inset-0 pointer-events-none" />
                          )}
                          {reviewRating >= star - 0.5 && reviewRating < star && (
                            <span className="absolute inset-0 overflow-hidden w-1/2 pointer-events-none">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {reviewRating.toFixed(1)} / 5.0
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Destination traveled together (e.g. Kyoto, Japan)..."
                    value={reviewDest}
                    onChange={(e) => setReviewDest(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                  />

                  <textarea
                    rows={2}
                    placeholder={`How was your experience traveling with ${activeTravelerModal.name.split(' ')[0]}? Was the companion punctual, respectful, fun to travel with?`}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 leading-relaxed resize-none"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (!reviewComment.trim()) return;
                      const newReview: CompanionReview = {
                        id: `rev_${Date.now()}`,
                        reviewerId: currentUser.id,
                        reviewerName: currentUser.name,
                        reviewerAvatar: currentUser.avatar,
                        travelerId: activeTravelerModal.id,
                        rating: reviewRating,
                        comment: reviewComment.trim(),
                        date: 'Just now',
                        destinationVisited: reviewDest || 'Recent Trip'
                      };

                      const currentReviews = activeTravelerModal.reviews || [];
                      const updatedReviews = [newReview, ...currentReviews];
                      const newAvgRating = Number(
                        (updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(2)
                      );

                      const updatedTraveler: SoloTraveler = {
                        ...activeTravelerModal,
                        reviews: updatedReviews,
                        safetyRating: newAvgRating,
                        vouchedByCount: (activeTravelerModal.vouchedByCount || 0) + 1
                      };

                      setActiveTravelerModal(updatedTraveler);
                      if (onAddReview) {
                        onAddReview(activeTravelerModal.id, newReview);
                      }

                      setReviewComment('');
                      setReviewSuccess(true);
                      setTimeout(() => setReviewSuccess(false), 3000);
                    }}
                    disabled={!reviewComment.trim()}
                    className="w-full py-1.5 px-3 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:brightness-105 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Review</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setActiveTravelerModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Modal & AI Icebreaker Assistant */}
      {connectModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setConnectModalData(null);
                setAiItinerary({ loading: false, data: null });
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Trip to {connectModalData.trip.destination} · Scope: {connectModalData.trip.tripScope}
              </div>
              <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50 mt-1">
                Reach out to {connectModalData.traveler.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Propose traveling together for the same trip or exploring key activities together to split costs.
              </p>
            </div>

            {/* AI Generated Icebreaker Starters */}
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  Suggested Message Starters:
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select to use in chat
                </span>
              </div>

              {connectModalData.loadingIcebreakers ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                  Synthesizing conversation starters based on destination and shared interests...
                </div>
              ) : (
                <div className="space-y-2.5">
                  {connectModalData.icebreakers.map((starter, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 hover:border-rose-300 dark:hover:border-rose-800 transition-colors flex items-start justify-between gap-3"
                    >
                      <p className="leading-relaxed italic">"{starter}"</p>
                      <button
                        onClick={() => {
                          onOpenChatWithTraveler(
                            connectModalData.traveler,
                            connectModalData.trip.destination
                          );
                          setConnectModalData(null);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-rose-600 rounded hover:brightness-105 transition-all shrink-0 cursor-pointer"
                      >
                        Send in Chat
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Shared Trip Plan Preview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Preview Suggested Joint Itinerary
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Explore activities you can experience together.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleGenerateSharedPlan(
                        connectModalData.traveler,
                        connectModalData.trip.destination
                      )
                    }
                    disabled={aiItinerary.loading}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-md hover:brightness-105 disabled:opacity-50 transition-all cursor-pointer shrink-0"
                  >
                    {aiItinerary.loading ? 'Planning...' : 'Generate Plan'}
                  </button>
                </div>

                {/* Render Itinerary Results */}
                {aiItinerary.data && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {aiItinerary.data.title}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {aiItinerary.data.summary}
                    </p>
                    <div className="space-y-2 mt-2">
                      {aiItinerary.data.days.map((d: any, i: number) => (
                        <div key={i} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs space-y-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{d.day}</div>
                          <div className="text-slate-600 dark:text-slate-300"><strong>Morning:</strong> {d.morning}</div>
                          <div className="text-slate-500 dark:text-slate-400"><strong>Afternoon:</strong> {d.afternoon}</div>
                          <div className="text-slate-600 dark:text-slate-300"><strong>Evening:</strong> {d.evening}</div>
                          <div className="text-emerald-700 font-mono text-[11px]">{d.sharedCostEstimate}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                onClick={() => {
                  onViewActivitiesForDestination(connectModalData.trip.destination);
                  setConnectModalData(null);
                }}
                className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 underline cursor-pointer"
              >
                Browse shared activities in {connectModalData.trip.destination.split(',')[0]}
              </button>
              <button
                onClick={() => {
                  onOpenChatWithTraveler(
                    connectModalData.traveler,
                    connectModalData.trip.destination
                  );
                  setConnectModalData(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-md hover:brightness-105 transition-all cursor-pointer"
              >
                Open Direct Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
