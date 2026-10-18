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

const DESTINATION_OPTIONS = [
  'All Destinations',
  'Kyoto, Japan',
  'Oaxaca, Mexico',
  'Amalfi Coast, Italy',
  'Barcelona, Spain',
  'Lisbon, Portugal'
];

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

  // Safety setting: when "Prioritize Female Solo Travelers" is enabled in
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

  // Count starred companions according to destination filter
  const starredCount = travelers.filter((t) => {
    if (!t.isStarred || t.id === currentUser.id) return false;
    if (selectedDestination === 'All Destinations') return true;
    const q = selectedDestination.toLowerCase().split(',')[0].trim();
    const matchesTrip = trips.some(
      (tr) => tr.travelerId === t.id && tr.destination.toLowerCase().includes(q)
    );
    const matchesDest = t.currentDestination?.toLowerCase().includes(q);
    return matchesTrip || matchesDest;
  }).length;

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

  // Succinct companion card design (NO PHOTO)
  const renderSuccinctTripCard = (trip: TravelTrip) => {
    const traveler = getTraveler(trip.travelerId);
    const { overlapText, matchScore } = getOverlapDetails(trip);
    const isStarred = !!traveler.isStarred;

    return (
      <div
        key={trip.id}
        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
      >
        <div>
          {/* Card Top: Traveler Monogram Initials, Name, Nationality & Star (No photo) */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                {traveler.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 truncate">
                    {traveler.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({traveler.country})
                  </span>
                  {traveler.gender === 'female' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded-md">
                      <ShieldCheck className="w-3 h-3 text-rose-600" />
                      <span>Female Solo</span>
                    </span>
                  )}
                  {femaleSafetyPriority && traveler.gender === 'female' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 px-1.5 py-0.2 rounded-md shadow-xs">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Priority Match</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  From {traveler.homeCity} · {traveler.soloTripsCount} solo trips
                </div>
              </div>
            </div>

            {/* Star Favorite Button */}
            <button
              type="button"
              onClick={() => onToggleStarTraveler(traveler.id)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                isStarred
                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-amber-500'
              }`}
              title={isStarred ? 'Unstar companion' : 'Star companion'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
          </div>

          {/* Trip Metadata (Destination, Scope, Dates, Overlap) */}
          <div className="mt-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-bold text-slate-950 text-sm">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{trip.destination}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Scope: {trip.tripScope}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-slate-600 flex-wrap">
              <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{trip.startDate} – {trip.endDate}</span>
              </div>
              <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {matchScore}% Match · {overlapText}
              </div>
            </div>

            {/* Headline Quote */}
            <p className="mt-2 text-xs text-slate-700 italic leading-relaxed line-clamp-2">
              "{trip.headline}"
            </p>

            {/* Shared Interests Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {trip.interests.slice(0, 4).map((int) => {
                const isShared = currentUser.interests.includes(int);
                return (
                  <span
                    key={int}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded ${
                      isShared
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {int}
                  </span>
                );
              })}
            </div>

            {/* Traveler Pace & Trust stats */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Pace: {traveler.travelPace}</span>
              <span className="font-mono tabular-nums">Budget: {traveler.budgetTier}</span>
              <span className="font-semibold text-slate-700">★ {traveler.safetyRating} rating</span>
            </div>
          </div>
        </div>

        {/* Card Action Footer */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={() => setActiveTravelerModal(traveler)}
            className="text-xs font-medium text-slate-600 hover:text-slate-950 transition-colors cursor-pointer py-1"
          >
            Bio & Trust
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChatWithTraveler(traveler, trip.destination)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
              <span>Message</span>
            </button>

            <button
              onClick={() => handleOpenConnect(trip, traveler)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
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
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-md mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Companion Search & Filter</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 tracking-tight">
            {getTranslation('matcherTitle')}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">
            {getTranslation('matcherSub')}
          </p>
        </div>

        {/* Search Panel Form */}
        <form onSubmit={handleSearchSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* Destination Selector (Categorized into Continents with Search Bar on top) */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>Travel Scope</span>
              </label>
              <select
                value={inputScope}
                onChange={(e) => setInputScope(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium h-[38px]"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Shared Interest</span>
              </label>
              <select
                value={inputInterest}
                onChange={(e) => setInputInterest(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium h-[38px]"
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
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5 h-[38px]"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </div>

          {/* Female Companions Only Filter Switch (For Protecting Females Travelling & Meeting Abroad) */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:border-rose-300 transition-colors">
              <input
                type="checkbox"
                checked={femaleOnly}
                onChange={(e) => setFemaleOnly(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span className="font-semibold text-slate-900">
                  Female Companions Only Filter
                </span>
                <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.2 rounded-full font-medium">
                  Women Safety Protection
                </span>
              </div>
            </label>

            {/* Quick Destination Pill Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">Quick:</span>
              {['All Destinations', 'Kyoto, Japan', 'Dubrovnik, Croatia', 'Amalfi Coast, Italy'].map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => {
                    setInputDest(dest);
                    onSelectDestination(dest);
                    setViewSavedOnly(false);
                    setTimeout(() => {
                      resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedDestination === dest
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setViewSavedOnly(false)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                !viewSavedOnly ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              All Companions ({baseFilteredTrips.length})
            </button>
            <button
              onClick={() => setViewSavedOnly(true)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                viewSavedOnly ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Saved / Starred Site ({starredCount})</span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            {selectedDestination !== 'All Destinations' ? (
              <span>Filtering for: <strong>{selectedDestination}</strong></span>
            ) : (
              <span>Showing all destinations</span>
            )}
          </div>
        </div>
      </section>

      {/* 2. Target Section: Auto-Scrolls here on Search */}
      <div ref={resultsSectionRef} className="scroll-mt-6">
        {/* VIEW 1: Starred / Saved Companions View */}
        {viewSavedOnly ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
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
              <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
                <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-900">No starred companions found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Companions Matching Your Itinerary & Upcoming Trips</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Travelers heading to the exact destinations and dates you have planned in your schedule.
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
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
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-950">
                    {selectedDestination !== 'All Destinations'
                      ? `Potential Travel Companions in ${selectedDestination}`
                      : 'All Potential Solo Travel Companions'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Browse verified solo travelers ready to coordinate activities, share transit, or travel together.
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-600">
                  {sortedOtherTrips.length} Available
                </span>
              </div>

              {otherPotentialTrips.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
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

      {/* Traveler Detail Modal */}
      {activeTravelerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
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
                  <h3 className="font-display font-bold text-lg text-slate-950">
                    {activeTravelerModal.name}
                  </h3>
                  <button
                    onClick={() => onToggleStarTraveler(activeTravelerModal.id)}
                    className="p-1 text-amber-500 cursor-pointer"
                  >
                    <Star className={`w-4 h-4 ${activeTravelerModal.isStarred ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
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
                <p className="text-slate-700 leading-relaxed text-sm">
                  {activeTravelerModal.bio}
                </p>
              </div>

              {/* Trust & Safety Attributes */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="text-[11px] font-semibold text-slate-700">
                  Trust & Safety Profile
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
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
                <div className="text-slate-700 font-medium">
                  {activeTravelerModal.languages.join(' · ')}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Interests
                </div>
                <div className="text-slate-700 font-medium">
                  {activeTravelerModal.interests.join(' · ')}
                </div>
              </div>

              {/* Reviews & Ratings Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>Companion Reviews & Rating</span>
                      <span className="text-xs font-mono font-semibold text-slate-700">
                        ({activeTravelerModal.safetyRating} / 5.0)
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
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={rev.reviewerAvatar}
                              alt={rev.reviewerName}
                              className="w-6 h-6 rounded-full object-cover border border-slate-300"
                            />
                            <span className="font-semibold text-slate-900 text-xs">
                              {rev.reviewerName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              · {rev.destinationVisited}
                            </span>
                          </div>

                          <div className="flex items-center text-amber-500 text-xs">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'}`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-slate-700 leading-relaxed text-[11px]">
                          "{rev.comment}"
                        </p>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {rev.date}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center text-[11px] text-slate-500">
                      No reviews yet for {activeTravelerModal.name.split(' ')[0]}. Be the first to leave a 5-star review!
                    </div>
                  )}
                </div>

                {/* Rate & Leave Review Form */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5 mt-3">
                  <div className="font-semibold text-xs text-slate-900 flex items-center justify-between">
                    <span>Rate {activeTravelerModal.name.split(' ')[0]} & Leave a Review:</span>
                    {reviewSuccess && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Review posted!
                      </span>
                    )}
                  </div>

                  {/* 5-Star Clickable Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600">Your Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-0.5 cursor-pointer hover:scale-115 transition-transform"
                        >
                          <Star
                            className={`w-4 h-4 ${star <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {reviewRating}.0 / 5.0
                    </span>
                  </div>

                  <input
                    type="text"
                    placeholder="Destination traveled together (e.g. Kyoto, Japan)..."
                    value={reviewDest}
                    onChange={(e) => setReviewDest(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
                  />

                  <textarea
                    rows={2}
                    placeholder={`How was your experience traveling with ${activeTravelerModal.name.split(' ')[0]}? Was the companion punctual, respectful, fun to travel with?`}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 leading-relaxed resize-none"
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
                    className="w-full py-1.5 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit 5-Star Review</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setActiveTravelerModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
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
          <div className="bg-white rounded-xl border border-slate-200 max-w-xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setConnectModalData(null);
                setAiItinerary({ loading: false, data: null });
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-slate-200 pb-4">
              <div className="text-xs text-slate-500 font-medium">
                Trip to {connectModalData.trip.destination} · Scope: {connectModalData.trip.tripScope}
              </div>
              <h3 className="font-display font-bold text-lg text-slate-950 mt-1">
                Reach out to {connectModalData.traveler.name}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Propose traveling together for the same trip or exploring key activities together to split costs.
              </p>
            </div>

            {/* AI Generated Icebreaker Starters */}
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                  Suggested Message Starters:
                </span>
                <span className="text-[11px] text-slate-500">
                  Select to use in chat
                </span>
              </div>

              {connectModalData.loadingIcebreakers ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 animate-pulse">
                  Synthesizing conversation starters based on destination and shared interests...
                </div>
              ) : (
                <div className="space-y-2.5">
                  {connectModalData.icebreakers.map((starter, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 hover:border-slate-400 transition-colors flex items-start justify-between gap-3"
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
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                      >
                        Send in Chat
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Shared Trip Plan Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">
                      Preview Suggested Joint Itinerary
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
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
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                  >
                    {aiItinerary.loading ? 'Planning...' : 'Generate Plan'}
                  </button>
                </div>

                {/* Render Itinerary Results */}
                {aiItinerary.data && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-900">
                      {aiItinerary.data.title}
                    </div>
                    <p className="text-xs text-slate-600">
                      {aiItinerary.data.summary}
                    </p>
                    <div className="space-y-2 mt-2">
                      {aiItinerary.data.days.map((d: any, i: number) => (
                        <div key={i} className="p-2.5 bg-white border border-slate-200 rounded text-xs space-y-1">
                          <div className="font-semibold text-slate-900">{d.day}</div>
                          <div className="text-slate-600"><strong>Morning:</strong> {d.morning}</div>
                          <div className="text-slate-500"><strong>Afternoon:</strong> {d.afternoon}</div>
                          <div className="text-slate-600"><strong>Evening:</strong> {d.evening}</div>
                          <div className="text-emerald-700 font-mono text-[11px]">{d.sharedCostEstimate}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  onViewActivitiesForDestination(connectModalData.trip.destination);
                  setConnectModalData(null);
                }}
                className="text-xs font-medium text-slate-600 hover:text-slate-950 underline cursor-pointer"
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
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
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
