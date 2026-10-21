import React from 'react';
import { Globe, Stamp as StampIcon, Plane, Languages, Heart, Route } from 'lucide-react';
import { SoloTraveler, TravelItinerary, SoloPersonalExpense, ExpenseItem } from '../types/travel';
import { getTranslation } from '../utils/i18n';
import { PassportStamp } from '../utils/landmarkArt';
import { haversineKm } from '../utils/units';
import { stopsForDay } from './TripRouteMap';

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
  cities: string[]; // every city visited in that country — drives the unique stamp art
}

export const PassportView: React.FC<PassportViewProps> = ({
  currentUser,
  itineraries,
  soloExpenses,
  sharedExpenses
}) => {
  // ── Stamps derived from real trips: one per country, earliest visit wins.
  //    Every city visited in that country is collected so the stamp art is
  //    unique to the traveller's actual stops. ──
  const splitCities = (dest: string): string[] =>
    dest
      .split(',')[0]
      .split(/\s*[&+]\s*|\s+and\s+/i)
      .map((c) => c.trim())
      .filter(Boolean);

  const stamps: StampEntry[] = [];
  const byCountry = new Map<string, StampEntry>();
  const homeCountry = (currentUser.country || '').trim();
  if (homeCountry) {
    const home = { country: homeCountry, year: 'HOME', cities: currentUser.homeCity ? [currentUser.homeCity] : [] };
    stamps.push(home);
    byCountry.set(homeCountry.toLowerCase(), home);
  }
  [...itineraries]
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .forEach((it) => {
      const country = (it.country || it.destination.split(',').pop() || '').trim();
      if (!country) return;
      const key = country.toLowerCase();
      const cities = splitCities(it.destination);
      const existing = byCountry.get(key);
      if (existing) {
        cities.forEach((c) => {
          if (!existing.cities.some((x) => x.toLowerCase() === c.toLowerCase())) existing.cities.push(c);
        });
        return;
      }
      const entry: StampEntry = { country, year: (it.startDate || '').slice(0, 4), cities };
      byCountry.set(key, entry);
      stamps.push(entry);
    });

  // ── Stats ──
  // Total distance travelled: sum of every planned leg across all trips
  const totalDistanceKm = Math.round(
    itineraries.reduce((tripSum, it) => {
      return (
        tripSum +
        (it.days || []).reduce((daySum, d) => {
          const stops = stopsForDay(d);
          let legSum = 0;
          for (let i = 0; i < stops.length - 1; i++) {
            legSum += haversineKm(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
          }
          return daySum + legSum;
        }, 0)
      );
    }, 0)
  );
  const languages = currentUser.languages || [];
  const hobbies = currentUser.interests || [];
  const memberSince = String(2024 + ((currentUser.id.length + currentUser.name.length) % 2)); // stable pseudo year

  const statCard = (icon: React.ReactNode, value: string, label: string, sub?: string) => (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 sm:p-5 flex flex-col gap-2 shadow-xs">
      <div className="w-8 h-8 rounded-xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center">
        {icon}
      </div>
      <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 tabular-nums">
        {value}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">{label}</div>
      {sub && (
        <div className="text-[10px] text-stone-500 dark:text-stone-400 leading-snug -mt-1 line-clamp-2">{sub}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* ── Passport cover ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 dark:bg-black text-stone-100 shadow-xl">
        {/* cosmic wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_0%,rgba(139,92,246,0.28),transparent_70%),radial-gradient(ellipse_45%_40%_at_5%_100%,rgba(76,29,149,0.35),transparent_70%)]" />
        {/* constellation motif */}
        <svg className="absolute top-5 left-6 sm:left-9 w-36 h-24 text-violet-300/50" viewBox="0 0 144 96" fill="none" aria-hidden>
          <path d="M12 74 L44 30 L86 52 L128 18" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 4" strokeLinecap="round" />
          <circle cx="12" cy="74" r="2.4" fill="currentColor" />
          <circle cx="44" cy="30" r="3" fill="currentColor" />
          <circle cx="86" cy="52" r="2" fill="currentColor" />
          <circle cx="128" cy="18" r="2.8" fill="currentColor" />
          <circle cx="66" cy="12" r="1.2" fill="currentColor" opacity="0.7" />
          <circle cx="104" cy="82" r="1.2" fill="currentColor" opacity="0.7" />
          <circle cx="20" cy="20" r="1" fill="currentColor" opacity="0.5" />
        </svg>
        {/* faint globe watermark */}
        <Globe className="absolute -right-10 -top-10 w-56 h-56 text-violet-200/10" strokeWidth={0.6} />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-300 via-violet-400 to-emerald-400" />
        {/* dotted flight path sweeping along the bottom with an aeroplane */}
        <svg className="absolute bottom-2 left-0 w-full h-14" viewBox="0 0 600 56" preserveAspectRatio="none" aria-hidden>
          <path
            d="M-8 46 Q 120 8 260 30 T 590 12"
            fill="none"
            stroke="rgba(196,181,253,0.4)"
            strokeWidth="1.6"
            strokeDasharray="0.5 8"
            strokeLinecap="round"
          />
        </svg>
        <Plane className="absolute right-6 bottom-6 w-4 h-4 text-violet-300/80 rotate-45" />

        <div className="relative z-10 p-6 sm:p-9">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-violet-300">
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
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-violet-300/70 rotate-2 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-violet-300 text-stone-950 flex items-center justify-center font-display font-extrabold text-2xl rotate-2 shadow-lg shrink-0">
                {currentUser.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
              </div>
            )}
          </div>

          {/* Passport data strip */}
          <div className="mt-7 pt-5 border-t border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">
                Departure
              </div>
              <div className="mt-1 font-mono font-semibold text-stone-200 truncate">
                {currentUser.country || currentUser.homeCity}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">
                Arrival
              </div>
              <div className="mt-1 font-mono font-semibold text-stone-200">World</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">
                {getTranslation('passportSince')}
              </div>
              <div className="mt-1 font-mono font-semibold text-stone-200">{memberSince}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">ID</div>
              <div className="mt-1 font-mono font-semibold text-violet-300">
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
        {statCard(<Languages className="w-4 h-4" />, String(languages.length), getTranslation('statLanguages'), languages.join(' · '))}
        {statCard(<Heart className="w-4 h-4" />, String(hobbies.length), getTranslation('statHobbies'), hobbies.join(' · '))}
        {statCard(
          <Route className="w-4 h-4" />,
          totalDistanceKm > 0 ? totalDistanceKm.toLocaleString() : '—',
          getTranslation('statTotalKm')
        )}
      </div>

      {/* ── Entry stamps wall ──────────────────────────────────────────── */}
      <div>
        {/* boarding-route divider: dotted path + aeroplane */}
        <div className="relative h-8 mb-4" aria-hidden>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 32" preserveAspectRatio="none">
            <path
              d="M0 24 Q 180 4 340 18 T 600 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeDasharray="0.5 8"
              strokeLinecap="round"
              className="text-stone-300 dark:text-violet-400/40"
            />
          </svg>
          <Plane className="absolute right-1 top-0 w-3.5 h-3.5 text-stone-400 dark:text-violet-300 rotate-45" />
        </div>
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
                  className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full select-none ${STAMP_INKS[i % STAMP_INKS.length]}`}
                  style={{ transform: `rotate(${rot}deg)` }}
                  title={`${st.cities.length ? `${st.cities.join(', ')}, ` : ''}${st.country} · ${st.year}`}
                >
                  <PassportStamp country={st.country} year={st.year} cities={st.cities} className="w-full h-full" />
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
