import React, { useState, useRef, useMemo } from 'react';
import { TravelTrip, SoloTraveler, TravelItinerary } from '../types/travel';
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  Plus,
  Sparkles,
  Search,
  Star,
  MessageSquare,
  Compass,
  ChevronLeft,
  ChevronRight,
  Heart,
  Camera,
  ShieldCheck,
  Check,
  X,
  Share2,
  ExternalLink
} from 'lucide-react';
import { DestinationSelector } from './DestinationSelector';
import { getTranslation } from '../utils/i18n';
import { getAppSettings } from '../utils/settings';

import kyotoImg from '../assets/images/destination_kyoto_bamboo_1792119350483.jpg';
import oaxacaImg from '../assets/images/destination_oaxaca_market_1792119352389.jpg';
import amalfiImg from '../assets/images/destination_amalfi_boat_1792119352021.jpg';
import exploreImg from '../assets/images/solo_travelers_explore_1792127184490.jpg';
import diningImg from '../assets/images/solo_travelers_dining_1792127167887.jpg';
import heroCompanionsImg from '../assets/images/hero_travel_companions_1792119350242.jpg';

interface ExploreTripsViewProps {
  myTrips: TravelTrip[];
  allTrips: TravelTrip[];
  travelers: SoloTraveler[];
  currentUser: SoloTraveler;
  selectedDestination: string;
  onSelectDestination: (destination: string) => void;
  selectedScope: string;
  onSelectScope: (scope: string) => void;
  selectedInterest: string;
  onSelectInterest: (interest: string) => void;
  onGoToMatcher: (destination?: string) => void;
  onGoToActivities: (destination?: string) => void;
  onGoToItinerary: (destination: string) => void;
  onOpenCreateTrip: () => void;
  onToggleStarTraveler: (travelerId: string) => void;
  onOpenChatWithTraveler: (traveler: SoloTraveler, destination: string) => void;
  itineraries?: TravelItinerary[];
}

interface MeetupStory {
  id: string;
  title: string;
  location: string;
  country: string;
  image: string;
  travelerNames: string[];
  travelerAvatars: string[];
  activityTag: string;
  story: string;
  sharedCostSnippet: string;
  date: string;
}

export const ExploreTripsView: React.FC<ExploreTripsViewProps> = ({
  myTrips,
  allTrips,
  travelers,
  currentUser,
  selectedDestination,
  onSelectDestination,
  selectedScope,
  onSelectScope,
  selectedInterest,
  onSelectInterest,
  onGoToMatcher,
  onGoToActivities,
  onGoToItinerary,
  onOpenCreateTrip,
  onToggleStarTraveler,
  onOpenChatWithTraveler,
  itineraries = []
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search input state
  const [searchInput, setSearchInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [femaleOnlyFilter, setFemaleOnlyFilter] = useState(false);

  // Active Interactive Meetup Photo Modal
  const [selectedMeetup, setSelectedMeetup] = useState<MeetupStory | null>(null);

  // Interactive Solo Traveler Meetup Photos
  const meetupStories: MeetupStory[] = [
    {
      id: 'meetup_1',
      title: 'Dawn Fushimi Inari Torii Trek & Ramen Crawl',
      location: 'Kyoto, Kansai',
      country: 'Japan',
      image: heroCompanionsImg,
      travelerNames: ['Elena Rostova', 'Kenji Sato', 'Maya Lin'],
      travelerAvatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'
      ],
      activityTag: 'Dawn Hike & Food Crawl',
      story: 'We met outside Kyoto Station at 05:45 AM to beat the tour buses. After hiking the full summit mountain trails together, we shared a warm breakfast of roasted tea and tamagoyaki in a quiet hillside pavilion.',
      sharedCostSnippet: 'Split taxi ¥4,200 from Higashiyama · Shared matcha sampler ¥2,800',
      date: 'October 2026'
    },
    {
      id: 'meetup_2',
      title: 'Sunset Wooden Boat Cruise & Cliff Swim',
      location: 'Amalfi & Positano',
      country: 'Italy',
      image: amalfiImg,
      travelerNames: ['Clara Moreau', 'Lucia Rossi', 'Elena Rostova'],
      travelerAvatars: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
      ],
      activityTag: 'Shared Vintage Boat Charter',
      story: 'Renting a private classic wooden gozzo boat solo was €280, but splitting 3 ways made it just €93 each! We swam in the turquoise sea caves off Capri and shared fresh lemon granitas on deck at golden hour.',
      sharedCostSnippet: 'Split private gozzo boat charter €280 / 3 = €93.33 each',
      date: 'Late October 2026'
    },
    {
      id: 'meetup_3',
      title: 'Artisan Mezcal Tasting & Street Tlayuda Crawl',
      location: 'Oaxaca City',
      country: 'Mexico',
      image: oaxacaImg,
      travelerNames: ['Sofia Ramirez', 'Marcos Delgado'],
      travelerAvatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
      ],
      activityTag: 'Culinary Market Walk',
      story: 'Both traveling solo as food writers. We linked up at Mercado 20 de Noviembre, grabbed a long wooden table in the smoke alley (Pasillo de Humo), and tasted 4 regional moles together.',
      sharedCostSnippet: 'Split charcoal grilled tasajo feast $420 MXN ($21 USD total)',
      date: 'November 2026'
    },
    {
      id: 'meetup_4',
      title: 'Historic Fortress Walls & Sunset Kayak Expedition',
      location: 'Dubrovnik Old Town',
      country: 'Croatia',
      image: exploreImg,
      travelerNames: ['Elena Rostova', 'Kenji Sato'],
      travelerAvatars: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
      ],
      activityTag: 'Sea Kayak & Cliff Jump',
      story: 'Paddled around the ancient sea walls to Betina Cave beach. Shared photos and celebrated over fresh grilled calamari along the Stradun promenade at dusk.',
      sharedCostSnippet: 'Split tandem sea kayak rental €45 total (€22.50 each)',
      date: 'November 2026'
    }
  ];

  // Popular Destinations for horizontal scrolling
  const popularDestinations = [
    {
      name: 'Kyoto, Japan',
      image: kyotoImg,
      activeTravelers: 14,
      openActivities: 3,
      tags: ['Temple Trails', 'Dawn Photography', 'Soba & Tea']
    },
    {
      name: 'Dubrovnik, Croatia',
      image: exploreImg,
      activeTravelers: 9,
      openActivities: 2,
      tags: ['Old Town Ramparts', 'Sea Kayaking', 'Seafood Bistros']
    },
    {
      name: 'Amalfi Coast, Italy',
      image: amalfiImg,
      activeTravelers: 11,
      openActivities: 4,
      tags: ['Cliff Trails', 'Shared Boat Charter', 'Limoncello']
    },
    {
      name: 'Oaxaca, Mexico',
      image: oaxacaImg,
      activeTravelers: 8,
      openActivities: 3,
      tags: ['Market Crawl', 'Mezcal Distilleries', 'Textile Villages']
    },
    {
      name: 'Madrid & Seville, Spain',
      image: diningImg,
      activeTravelers: 12,
      openActivities: 5,
      tags: ['Tapas Crawls', 'White Villages Roadtrip', 'Flamenco']
    }
  ];

  const scrollDestinations = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getTraveler = (travelerId: string): SoloTraveler => {
    return (
      travelers.find((t) => t.id === travelerId) || {
        id: travelerId,
        name: 'Fellow Solo Traveler',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        country: 'Global Explorer',
        homeCity: 'Wanderer',
        age: 28,
        bio: 'An adventurous solo traveler exploring the world one trip at a time.',
        languages: ['English'],
        travelPace: 'Moderate Explorer',
        budgetTier: '$$',
        interests: ['Photography', 'Street Food'],
        emergencyContactLinked: false,
        soloTripsCount: 6,
        safetyRating: 4.9,
        vouchedByCount: 0,
        gender: 'female' as const,
        isStarred: false
      }
    );
  };

  // Synchronized Upcoming Trips: Merges myTrips + itineraries!
  const synchronizedUpcomingTrips = useMemo(() => {
    const combined: Array<{
      id: string;
      destination: string;
      startDate: string;
      endDate: string;
      tripScope: string;
      notes: string;
      source: 'trip' | 'itinerary';
      raw: TravelTrip | TravelItinerary;
    }> = [];

    // From my posted trips
    myTrips.forEach((t) => {
      combined.push({
        id: t.id,
        destination: t.destination,
        startDate: t.startDate,
        endDate: t.endDate,
        tripScope: t.tripScope,
        notes: t.headline,
        source: 'trip',
        raw: t
      });
    });

    // From my itineraries
    itineraries.forEach((it) => {
      // Avoid duplicate display if same destination and start date
      const exists = combined.some(
        (c) => c.destination.toLowerCase() === it.destination.toLowerCase() && c.startDate === it.startDate
      );
      if (!exists) {
        combined.push({
          id: it.id,
          destination: it.destination,
          startDate: it.startDate,
          endDate: it.endDate,
          tripScope: it.tripScope || 'Full Trip',
          notes: it.notes || `${it.days.length} Days Itinerary planned`,
          source: 'itinerary',
          raw: it
        });
      }
    });

    // Sort chronologically earlier to later
    return combined.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [myTrips, itineraries]);

  // Extract all available trip months in format 'YYYY-MM'
  const availableMonths = useMemo(() => {
    const months = Array.from(
      new Set(
        synchronizedUpcomingTrips.map((t) => {
          const d = new Date(t.startDate);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          return `${year}-${month}`;
        })
      )
    ).sort();
    return months;
  }, [synchronizedUpcomingTrips]);

  // Selected Month filter for upcoming trips
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    if (availableMonths.length > 0) return availableMonths[0];
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter trips for selected month
  const tripsForSelectedMonth = useMemo(() => {
    return synchronizedUpcomingTrips.filter((t) => {
      const d = new Date(t.startDate);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mStr === selectedMonth;
    });
  }, [synchronizedUpcomingTrips, selectedMonth]);

  // Jump to nearest month that has trips
  const handleJumpToNearestTripMonth = () => {
    if (availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  };

  const formatMonthTitle = (monthKey: string) => {
    const [year, m] = monthKey.split('-');
    const date = new Date(Number(year), Number(m) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleExecuteSearch = (dest?: string) => {
    const target = dest || searchInput;
    if (target) {
      onSelectDestination(target);
    }
    setHasSearched(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecuteSearch();
    }
  };

  // Potential companions filtered
  const foundCompanionsTrips = allTrips.filter((t) => {
    if (t.travelerId === currentUser.id) return false;
    const traveler = getTraveler(t.travelerId);

    if (femaleOnlyFilter && traveler.gender !== 'female') {
      return false;
    }

    if (selectedDestination !== 'All Destinations') {
      const prefix = selectedDestination.toLowerCase().split(',')[0].trim();
      const tripDest = t.destination.toLowerCase();
      if (!tripDest.includes(prefix)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-12 pb-12">
      {/* 1. Top Hero with Search & Filters — vibrant sunset gradient */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-orange-500 to-amber-400 dark:from-rose-950 dark:via-orange-950/80 dark:to-slate-900 border border-rose-300/40 dark:border-rose-900/40 text-white p-6 sm:p-10 shadow-xl shadow-rose-500/20">
        {/* Decorative floating circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-amber-300/30 blur-2xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-20 right-24 w-56 h-56 rounded-full bg-fuchsia-400/20 blur-2xl pointer-events-none" aria-hidden="true" />
        <div className="absolute top-10 right-40 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-amber-50">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>{getTranslation('heroTagline')}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
            {getTranslation('heroTitle')}
          </h1>

          <p className="text-sm sm:text-base text-rose-50/95 max-w-2xl leading-relaxed">
            {getTranslation('heroSubtitle')}
          </p>

          {/* Search Bar Input */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={getTranslation('searchDestination')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <button
              onClick={() => handleExecuteSearch()}
              className="px-6 py-3 bg-slate-950 hover:brightness-105 text-amber-300 font-bold text-sm rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>{getTranslation('findCompanions')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <button
              onClick={() => setFemaleOnlyFilter(!femaleOnlyFilter)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors cursor-pointer ${
                femaleOnlyFilter
                  ? 'bg-rose-950 text-white border border-rose-300'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-100" />
              <span>{getTranslation('femaleTravelersOnly')}</span>
              {femaleOnlyFilter && <Check className="w-3 h-3 text-emerald-300" />}
            </button>

            <span className="text-rose-100/60 hidden sm:inline">|</span>
            <span className="text-rose-50 text-xs hidden sm:inline">Popular:</span>
            {['Kyoto, Japan', 'Dubrovnik, Croatia', 'Amalfi Coast, Italy', 'Oaxaca, Mexico'].map((dest) => (
              <button
                key={dest}
                onClick={() => {
                  setSearchInput(dest);
                  handleExecuteSearch(dest);
                }}
                className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
              >
                {dest.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Popular Solo Destinations Carousel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>{getTranslation('trendingDestinations')}</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {getTranslation('popularSoloDestinations')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollDestinations('left')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:brightness-105 text-slate-700 dark:text-slate-300 cursor-pointer shadow-xs"
              title="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollDestinations('right')}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:brightness-105 text-slate-700 dark:text-slate-300 cursor-pointer shadow-xs"
              title="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
        >
          {popularDestinations.map((dest) => (
            <div
              key={dest.name}
              className="w-[280px] sm:w-[310px] shrink-0 snap-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md font-medium">
                    {dest.activeTravelers} Solo Travelers Active
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    {dest.name}
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    {dest.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {dest.openActivities} open activities
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectDestination(dest.name);
                    onGoToMatcher(dest.name);
                  }}
                  className="font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{getTranslation('findCompanions')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Search Results for Chosen Destination */}
      {hasSearched && (
        <section ref={resultsRef} className="space-y-4 pt-2 scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                Potential Travel Companions {selectedDestination !== 'All Destinations' ? `in ${selectedDestination}` : ''}
              </h2>
              <span className="text-xs px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-full font-mono font-semibold">
                {foundCompanionsTrips.length} found
              </span>
            </div>

            <button
              onClick={() => onGoToMatcher(selectedDestination)}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              <span>View Full Filtered Matcher</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {foundCompanionsTrips.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
              No companions currently found for this specific filter. Try choosing "All Destinations" or clearing the Female Only filter!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {foundCompanionsTrips.map((trip) => {
                const traveler = getTraveler(trip.travelerId);
                return (
                  <div
                    key={trip.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-700 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={traveler.avatar}
                            alt={traveler.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                {traveler.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                ({traveler.country})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              From {traveler.homeCity} · {traveler.soloTripsCount} solo trips
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleStarTraveler(traveler.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            traveler.isStarred
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${traveler.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{trip.destination}</span>
                          <span className="font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded font-semibold">
                            {trip.tripScope}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">{trip.startDate} – {trip.endDate}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-xs italic line-clamp-2 mt-1">
                          "{trip.headline}"
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenChatWithTraveler(traveler, trip.destination)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg hover:brightness-105 cursor-pointer shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectDestination(trip.destination);
                          onGoToMatcher(trip.destination);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        <span>View Match</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4. {getTranslation('upcomingTrips')} (Synced with itinerary, organized per month, NO 'Post a Trip' button) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{getTranslation('syncedWithItinerary')}</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
              {getTranslation('upcomingTrips')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {getTranslation('upcomingTripsSub')}
            </p>
          </div>

          {/* Month Selector Tabs */}
          {availableMonths.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {availableMonths.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedMonth === m
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {formatMonthTitle(m)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Per-Month Trip Display */}
        {synchronizedUpcomingTrips.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {getTranslation('noMoreUpcomingTrips')}
            </p>
            <p className="text-xs text-slate-400">
              Plan your next trip inside Itinerary tab to schedule future adventures!
            </p>
          </div>
        ) : tripsForSelectedMonth.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No upcoming trips scheduled for {formatMonthTitle(selectedMonth)}.
            </p>
            <p className="text-xs text-slate-500">
              Jump forward to the nearest month that has scheduled trips:
            </p>
            <button
              onClick={handleJumpToNearestTripMonth}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-lg text-xs font-bold hover:brightness-105 cursor-pointer shadow-xs"
            >
              <span>Jump to {formatMonthTitle(availableMonths[0])}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tripsForSelectedMonth.map((trip) => {
              const matchedCount = allTrips.filter(
                (t) =>
                  t.travelerId !== currentUser.id &&
                  t.destination.toLowerCase().includes(trip.destination.toLowerCase().split(',')[0].trim())
              ).length;

              return (
                <div
                  key={trip.id}
                  className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:brightness-105 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-bold text-base text-slate-950 dark:text-slate-50">
                        {trip.destination}
                      </span>
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded">
                        {trip.tripScope}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold px-2 py-0.5 bg-slate-200/60 dark:bg-slate-700 rounded">
                        {trip.source === 'itinerary' ? 'From Itinerary' : 'Posted Trip'}
                      </span>
                      {getAppSettings().anonymousMode ? (
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold">
                          • Private Mode: dates hidden until mutual match
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                          • {getTranslation('openToPublic')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {getAppSettings().anonymousMode ? (
                        <span className="font-mono tabular-nums font-semibold italic text-slate-500">
                          Exact dates hidden (Private Browsing on)
                        </span>
                      ) : (
                        <span className="font-mono tabular-nums font-semibold">{trip.startDate} to {trip.endDate}</span>
                      )}
                      <span className="text-slate-400">·</span>
                      <span className="italic truncate max-w-md">"{trip.notes}"</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        onSelectDestination(trip.destination);
                        onGoToMatcher(trip.destination);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg hover:brightness-105 cursor-pointer shadow-xs"
                    >
                      <span>{getTranslation('viewMatches')}</span>
                      <span className="px-1.5 py-0.2 text-[10px] bg-slate-700 dark:bg-slate-300 rounded font-mono">
                        {matchedCount}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onGoToItinerary(trip.destination)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:brightness-105 rounded-lg cursor-pointer"
                    >
                      {getTranslation('viewItinerary')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. AT THE VERY BOTTOM: Interactive Photos of Solo Travelers Meeting Up Together */}
      <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
              <Camera className="w-3.5 h-3.5" />
              <span>Interactive Community Moments</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {getTranslation('interactiveMeetups')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {getTranslation('interactiveMeetupsSubtitle')}
            </p>
          </div>
        </div>

        {/* Interactive Photo Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {meetupStories.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedMeetup(item)}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                    {item.activityTag}
                  </div>

                  {/* Country Flag / Location Badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    {item.country}
                  </div>

                  {/* Travelers meeting up avatars on photo */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center -space-x-2">
                      {item.travelerAvatars.map((av, i) => (
                        <img
                          key={i}
                          src={av}
                          alt="Traveler"
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-xs"
                        />
                      ))}
                      <span className="pl-3 text-[11px] font-semibold text-white drop-shadow-md">
                        {item.travelerNames.length} Travelers Met
                      </span>
                    </div>

                    <span className="text-[10px] bg-white/20 text-white backdrop-blur-xs px-2 py-0.5 rounded font-mono">
                      Tap Story
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    <span>{item.location}</span>
                    <span className="mx-1">·</span>
                    <span className="font-mono">{item.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    "{item.story}"
                  </p>
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-between">
                <span>View Full Meetup Details</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Meetup Modal */}
      {selectedMeetup && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setSelectedMeetup(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative h-56 w-full bg-slate-100 dark:bg-slate-800 shrink-0">
              <img
                src={selectedMeetup.image}
                alt={selectedMeetup.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-600 rounded">
                  {selectedMeetup.activityTag}
                </span>
                <h3 className="font-display font-bold text-lg mt-1 leading-snug">
                  {selectedMeetup.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-200 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>{selectedMeetup.location}, {selectedMeetup.country}</span>
                  <span>·</span>
                  <span className="font-mono">{selectedMeetup.date}</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Connected Travelers */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Solo Travelers Who Connected:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedMeetup.travelerNames.map((name, i) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 p-1.5 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full"
                    >
                      <img
                        src={selectedMeetup.travelerAvatars[i]}
                        alt={name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-bold text-slate-900 dark:text-slate-100">{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Story */}
              <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl space-y-1 text-slate-800 dark:text-slate-200">
                <div className="font-bold text-rose-800 dark:text-rose-300 text-xs">
                  How We Coordinated & Met:
                </div>
                <p className="leading-relaxed text-xs">
                  "{selectedMeetup.story}"
                </p>
              </div>

              {/* Split Cost Breakdown */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Shared Cost Savings:
                </span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold block">
                  {selectedMeetup.sharedCostSnippet}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMeetup(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMeetup(null);
                    onSelectDestination(selectedMeetup.location);
                    onGoToMatcher(selectedMeetup.location);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Find Companions Here</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
