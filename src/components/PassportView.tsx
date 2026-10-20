import React from 'react';
import { Globe, MapPin, CalendarDays, Wallet, Stamp as StampIcon } from 'lucide-react';
import { SoloTraveler, TravelItinerary, SoloPersonalExpense, ExpenseItem } from '../types/travel';
import { getTranslation } from '../utils/i18n';
import { getFxRates, convertAmount } from '../utils/currency';

interface PassportViewProps {
  currentUser: SoloTraveler;
  itineraries: TravelItinerary[];
  soloExpenses: SoloPersonalExpense[];
  sharedExpenses: ExpenseItem[];
}

// Stamp-ink colours cycle so neighbouring stamps never share an ink
const STAMP_INKS = [
  'text-indigo-700 border-indigo-700/70 dark:text-indigo-400 dark:border-indigo-400/70',
  'text-red-700 border-red-700/70 dark:text-red-400 dark:border-red-400/70',
  'text-emerald-700 border-emerald-700/70 dark:text-emerald-400 dark:border-emerald-400/70',
  'text-sky-700 border-sky-700/70 dark:text-sky-400 dark:border-sky-400/70',
  'text-amber-700 border-amber-700/70 dark:text-amber-400 dark:border-amber-400/70'
];

interface StampEntry {
  country: string;
  year: string;
  city: string;
}

export const PassportView: React.FC<PassportViewProps> = ({
  currentUser,
  itineraries,
  soloExpenses,
  sharedExpenses
}) => {
  // ── Stamps derived from real trips: one per country, earliest visit wins ──
  const stamps: StampEntry[] = [];
  const seen = new Set<string>();
  const homeCountry = (currentUser.country || '').trim();
  if (homeCountry) {
    stamps.push({ country: homeCountry, year: 'HOME', city: currentUser.homeCity || '' });
    seen.add(homeCountry.toLowerCase());
  }
  [...itineraries]
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .forEach((it) => {
      const country = (it.country || it.destination.split(',').pop() || '').trim();
      if (!country || seen.has(country.toLowerCase())) return;
      seen.add(country.toLowerCase());
      stamps.push({
        country,
        year: (it.startDate || '').slice(0, 4),
        city: it.destination.split(',')[0].trim()
      });
    });

  // ── Stats ──
  const fx = getFxRates();
  const totalSpentUSD =
    soloExpenses.reduce((sum, e) => sum + convertAmount(e.amount, e.currency || 'USD', 'USD', fx), 0) +
    sharedExpenses.reduce((sum, e) => sum + convertAmount(e.amount, e.currency || 'USD', 'USD', fx), 0);
  const cities = new Set(itineraries.map((it) => it.destination.split(',')[0].trim().toLowerCase())).size;
  const daysOnRoad = itineraries.reduce((sum, it) => sum + (it.days?.length || 0), 0);
  const memberSince = String(2024 + ((currentUser.id.length + currentUser.name.length) % 2)); // stable pseudo year

  const statCard = (icon: React.ReactNode, value: string, label: string) => (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-2 shadow-xs">
      <div className="w-8 h-8 rounded-xl bg-stone-950 dark:bg-lime-400 text-lime-300 dark:text-stone-950 flex items-center justify-center">
        {icon}
      </div>
      <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 tabular-nums">
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">{label}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* ── Passport cover ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 dark:bg-black text-stone-100 shadow-xl">
        {/* faint globe watermark */}
        <Globe className="absolute -right-10 -top-10 w-56 h-56 text-stone-800/80 dark:text-stone-900" strokeWidth={0.6} />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-lime-300 via-lime-400 to-emerald-400" />

        <div className="relative p-6 sm:p-9">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-lime-300">
                <StampIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
                  {getTranslation('passportKicker')}
                </span>
              </div>
              <h1 className="mt-3 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                {currentUser.name}
              </h1>
              <p className="mt-2 text-sm text-stone-400 max-w-md">{getTranslation('passportSub')}</p>
            </div>

            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-lime-300/70 rotate-2 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-lime-300 text-stone-950 flex items-center justify-center font-display font-extrabold text-2xl rotate-2 shadow-lg shrink-0">
                {currentUser.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
              </div>
            )}
          </div>

          {/* Passport data strip */}
          <div className="mt-7 pt-5 border-t border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">
                {getTranslation('passportHolder')}
              </div>
              <div className="mt-1 font-mono font-semibold text-stone-200 truncate">
                {currentUser.homeCity || currentUser.country}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">
                {getTranslation('statCountries')}
              </div>
              <div className="mt-1 font-mono font-semibold text-stone-200">{currentUser.country}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">
                {getTranslation('passportSince')}
              </div>
              <div className="mt-1 font-mono font-semibold text-stone-200">{memberSince}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">ID</div>
              <div className="mt-1 font-mono font-semibold text-lime-300">
                WL·{String(
                  currentUser.id.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 1000000, 7)
                ).padStart(6, '0')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats bento ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCard(<Globe className="w-4 h-4" />, String(Math.max(0, stamps.length - (homeCountry ? 1 : 0))), getTranslation('statCountries'))}
        {statCard(<MapPin className="w-4 h-4" />, String(cities), getTranslation('statCities'))}
        {statCard(<CalendarDays className="w-4 h-4" />, String(daysOnRoad), getTranslation('statDays'))}
        {statCard(
          <Wallet className="w-4 h-4" />,
          totalSpentUSD > 0 ? `$${Math.round(totalSpentUSD).toLocaleString()}` : '—',
          getTranslation('statSpent')
        )}
      </div>

      {/* ── Entry stamps wall ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="font-display text-xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
            {getTranslation('passportStamps')}
          </h2>
          <span className="font-mono text-xs text-stone-400 tabular-nums">{stamps.length}</span>
        </div>

        {stamps.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 rounded-3xl text-sm text-stone-500">
            {getTranslation('passportEmpty')}
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {stamps.map((st, i) => {
              const rot = ((i * 47) % 13) - 6; // deterministic tilt between -6° and +6°
              return (
                <div
                  key={`${st.country}-${st.year}`}
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-[3px] border-dashed flex flex-col items-center justify-center text-center p-3 select-none ${STAMP_INKS[i % STAMP_INKS.length]}`}
                  style={{ transform: `rotate(${rot}deg)` }}
                  title={`${st.city ? `${st.city}, ` : ''}${st.country} · ${st.year}`}
                >
                  <Globe className="w-4 h-4 opacity-70 mb-1" />
                  <div className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest leading-tight line-clamp-2">
                    {st.country}
                  </div>
                  <div className="mt-1 text-[10px] font-mono font-bold opacity-80">{st.year}</div>
                  <div className="text-[8px] font-bold uppercase tracking-[0.25em] opacity-60">Entry</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footprints map is rendered by App directly below this view */}
      <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
        <h2 className="font-display text-xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
          {getTranslation('footprintsSection')}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{getTranslation('mapSub')}</p>
      </div>
    </div>
  );
};
