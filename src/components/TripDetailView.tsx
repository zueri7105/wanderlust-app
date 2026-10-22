import React, { useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin, Wallet, Route as RouteIcon, BookOpen } from 'lucide-react';
import {
  TravelItinerary,
  SoloTraveler,
  SoloPersonalExpense,
  ExpenseItem,
  TravelTrip
} from '../types/travel';
import { getTranslation } from '../utils/i18n';
import { buildBasicGuide } from '../utils/guideBuilder';
import { resolvePlaceCountry } from '../utils/worldGeo';
import { getFxRates, convertAmount } from '../utils/currency';
import { ItineraryView } from './ItineraryView';
import { TripCostView } from './TripCostView';
import { TravelGuidePanel } from './TravelGuidePanel';

interface TripDetailViewProps {
  itinerary: TravelItinerary;
  currentUser: SoloTraveler;
  travelers: SoloTraveler[];
  soloExpenses: SoloPersonalExpense[];
  sharedExpenses: ExpenseItem[];
  trips: TravelTrip[];
  itineraries: TravelItinerary[];
  onBack: () => void;
  onAddItinerary: (itinerary: TravelItinerary) => void;
  onUpdateItinerary: (itinerary: TravelItinerary) => void;
  onDeleteItinerary: (id: string) => void;
  onAddSoloExpense: (expense: Omit<SoloPersonalExpense, 'id'>) => void;
  onAddSharedExpense: (expense: Omit<ExpenseItem, 'id' | 'settled'>) => void;
  onToggleSharedSettled: (id: string) => void;
  onDeleteSoloExpense: (id: string) => void;
  onDeleteSharedExpense: (id: string) => void;
}

export const TripDetailView: React.FC<TripDetailViewProps> = ({
  itinerary,
  currentUser,
  travelers,
  soloExpenses,
  sharedExpenses,
  trips,
  itineraries,
  onBack,
  onAddItinerary,
  onUpdateItinerary,
  onDeleteItinerary,
  onAddSoloExpense,
  onAddSharedExpense,
  onToggleSharedSettled,
  onDeleteSoloExpense,
  onDeleteSharedExpense
}) => {
  // Tabs in order: Trips (the plan) → Trip costs → Travel Guide
  const [tab, setTab] = useState<'plan' | 'costs' | 'guide'>('plan');

  // Blank-destination trip (created via "+ Add a new trip"): the masthead is a
  // destination input; committing it names the trip and builds its guide.
  const [destDraft, setDestDraft] = useState('');
  const [destSaving, setDestSaving] = useState(false);
  const commitDestination = async () => {
    const dest = destDraft.trim();
    if (!dest || destSaving) return;
    setDestSaving(true);
    // Any city or region in the world resolves to its real country via the
    // offline gazetteer (GeoNames) — never guessed, never left blank when
    // the place is known.
    const world = await resolvePlaceCountry(dest);
    const typedCountry = dest.includes(',') ? (dest.split(',').pop() || '').trim() : '';
    const country = typedCountry || world?.countryName || '';
    const guide = buildBasicGuide(
      dest,
      country,
      dest.split(',')[0]?.trim(),
      currentUser.country || '',
      itinerary.startDate,
      itinerary.endDate
    );
    onUpdateItinerary({
      ...itinerary,
      destination: dest,
      country: country || guide.destinationCountry,
      travelGuide: guide
    });
    setDestSaving(false);
  };

  // Per-trip spend (destination-prefix match, converted to USD for the chip)
  const fx = getFxRates();
  const seg = itinerary.destination.toLowerCase().split(',')[0].trim();
  const matches = (d: string) => !!seg && (d || '').toLowerCase().includes(seg);
  const tripExpenses = [
    ...soloExpenses.filter((e) => matches(e.destination)),
    ...sharedExpenses.filter((e) => matches(e.destination))
  ];
  const totalUSD = tripExpenses.reduce(
    (sum, e) => sum + convertAmount(e.amount, e.currency || 'USD', 'USD', fx),
    0
  );
  const placesCount = itinerary.days.reduce(
    (n, d) =>
      n +
      (d.morningActivity || '').split('·').filter((t) => t.trim()).length +
      (d.afternoonActivity || '').split('·').filter((t) => t.trim()).length +
      (d.eveningActivity || '').split('·').filter((t) => t.trim()).length,
    0
  );

  const tabPill = (key: 'plan' | 'costs' | 'guide', label: string, Icon: React.FC<{ className?: string }>) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
        tab === key
          ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 shadow-md'
          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Masthead: back link + big destination + trip meta */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 hover:scale-[1.03] transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{getTranslation('backToTrips').replace('← ', '')}</span>
        </button>

        {(itinerary.country || itinerary.destination.split(',').pop()?.trim()) && (
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-600 dark:text-violet-400">
            {getTranslation('myTripsTitle')} · {itinerary.country || itinerary.destination.split(',').pop()?.trim()}
          </div>
        )}
        {itinerary.destination.trim() ? (
          <h1 className="font-display text-3xl sm:text-6xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 leading-[1.05] break-words">
            {itinerary.destination}
          </h1>
        ) : (
          <div className="max-w-xl">
            <input
              autoFocus
              value={destDraft}
              onChange={(e) => setDestDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void commitDestination();
                }
              }}
              onBlur={() => { void commitDestination(); }}
              placeholder={getTranslation('whereToPh')}
              className="w-full font-display text-2xl sm:text-4xl font-extrabold tracking-tight bg-white dark:bg-stone-900 border-2 border-dashed border-violet-300 dark:border-violet-700 rounded-2xl px-4 py-3 text-stone-950 dark:text-stone-50 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-violet-500"
            />
            {destSaving && (
              <p className="mt-2 text-xs font-semibold text-violet-500">…</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-semibold text-stone-700 dark:text-stone-200">
            <CalendarDays className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-mono tabular-nums">{itinerary.startDate} – {itinerary.endDate}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 font-semibold text-stone-700 dark:text-stone-200">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            {itinerary.days.length} days · {placesCount} places
          </span>
          {tripExpenses.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-200 dark:bg-violet-300 border border-violet-400/60 font-bold text-stone-900 tabular-nums">
              <Wallet className="w-3.5 h-3.5" />
              ${Math.round(totalUSD).toLocaleString()}
            </span>
          )}
        </div>

        {/* Page tabs: Trips (default) / Trip costs / Travel Guide */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {tabPill('plan', getTranslation('navTrips'), RouteIcon)}
          {tabPill('costs', getTranslation('tripCostsTitle'), Wallet)}
          {tabPill('guide', getTranslation('travelGuideTab'), BookOpen)}
        </div>
      </div>

      {tab === 'guide' ? (
        /* Travel Guide — visa, weather, checklist, currency, customs, safety */
        itinerary.travelGuide ? (
          <TravelGuidePanel itinerary={itinerary} currentUser={currentUser} />
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {getTranslation('travelGuideEmpty')}
            </p>
          </div>
        )
      ) : tab === 'costs' ? (
        /* Full trip costs — currency basket, budget, split ledger, locked to this trip */
        <TripCostView
          soloExpenses={soloExpenses}
          sharedExpenses={sharedExpenses}
          travelers={travelers}
          currentUser={currentUser}
          selectedDestination={itinerary.destination}
          itineraries={itineraries}
          trips={trips}
          lockedDestination={itinerary.destination}
          onAddSoloExpense={onAddSoloExpense}
          onAddSharedExpense={onAddSharedExpense}
          onToggleSharedSettled={onToggleSharedSettled}
          onDeleteSoloExpense={onDeleteSoloExpense}
          onDeleteSharedExpense={onDeleteSharedExpense}
        />
      ) : (
        /* The trip planner — days, route map, wishlist pool, guides */
        <ItineraryView
          itineraries={[itinerary]}
          currentUser={currentUser}
          soloExpenses={soloExpenses}
          sharedExpenses={sharedExpenses}
          onAddItinerary={onAddItinerary}
          onUpdateItinerary={onUpdateItinerary}
          onDeleteItinerary={(id) => {
            onDeleteItinerary(id);
            onBack();
          }}
          detailTripId={itinerary.id}
        />
      )}
    </div>
  );
};
