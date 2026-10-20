import React, { useState } from 'react';
import { ArrowLeft, CalendarDays, MapPin, Wallet, Route as RouteIcon, Pencil } from 'lucide-react';
import {
  TravelItinerary,
  SoloTraveler,
  SoloPersonalExpense,
  ExpenseItem,
  TravelTrip
} from '../types/travel';
import { getTranslation } from '../utils/i18n';
import { getFxRates, convertAmount } from '../utils/currency';
import { ItineraryView } from './ItineraryView';
import { TripCostView } from './TripCostView';

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
  // The costs ledger is the default tab — the old Trip Costs experience, per trip
  const [tab, setTab] = useState<'costs' | 'plan'>('costs');

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

  const tabPill = (key: 'costs' | 'plan', label: string, Icon: React.FC<{ className?: string }>) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
        tab === key
          ? 'bg-stone-950 dark:bg-lime-400 text-lime-300 dark:text-stone-950 shadow-md'
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
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-stone-950 dark:bg-lime-400 text-lime-300 dark:text-stone-950 hover:scale-[1.03] transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{getTranslation('backToTrips').replace('← ', '')}</span>
        </button>

        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-lime-600 dark:text-lime-400">
          {getTranslation('myTripsTitle')} · {itinerary.country || itinerary.destination.split(',').pop()?.trim()}
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 leading-[1.05]">
          {itinerary.destination}
        </h1>

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
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime-200 dark:bg-lime-300 border border-lime-400/60 font-bold text-stone-900 tabular-nums">
              <Wallet className="w-3.5 h-3.5" />
              ${Math.round(totalUSD).toLocaleString()}
            </span>
          )}
        </div>

        {/* Page tabs: Costs (default) / Plan */}
        <div className="flex items-center gap-2 pt-1">
          {tabPill('costs', getTranslation('tripCostsTitle'), Wallet)}
          {tabPill('plan', getTranslation('navTrips'), RouteIcon)}
        </div>
      </div>

      {tab === 'costs' ? (
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
