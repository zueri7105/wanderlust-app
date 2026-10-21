import React, { useState } from 'react';
import {
  Globe,
  Stamp as StampIcon,
  Plane,
  Languages,
  Heart,
  Route,
  Instagram,
  Link2,
  ChevronLeft,
  ChevronRight,
  Trophy
} from 'lucide-react';
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

const STAMPS_PER_PAGE = 6;

export const PassportView: React.FC<PassportViewProps> = ({
  currentUser,
  itineraries
}) => {
  // ── Stamps derived from real trips: one per country, earliest visit wins ──
  const splitCities = (dest: string): string[] =>
    dest
      .split(',')[0]
      .split(/\s*[&+]\s*|\s+and\s+/i)
      .map((c) => c.trim())
      .filter(Boolean);

  const stamps: StampEntry[] = [];
  const byCountry = new Map<string, StampEntry>();
  const homeCountry = (currentUser.country || '').trim();
  const homeStamp: StampEntry | null = homeCountry
    ? { country: homeCountry, year: '', cities: currentUser.homeCity ? [currentUser.homeCity] : [] }
    : null;
  if (homeStamp) byCountry.set(homeCountry.toLowerCase(), homeStamp);
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

  // ── Book pages: page 0 is the identity cover, then stamp pages of 6 ──
  const stampPages: StampEntry[][] = [];
  for (let i = 0; i < stamps.length; i += STAMPS_PER_PAGE) {
    stampPages.push(stamps.slice(i, i + STAMPS_PER_PAGE));
  }
  if (stampPages.length === 0) stampPages.push([]); // always at least one stamps page
  const totalPages = 1 + stampPages.length;
  const [page, setPage] = useState(0);
  const [flipDir, setFlipDir] = useState<'next' | 'prev'>('next');
  const goTo = (p: number) => {
    const clamped = Math.max(0, Math.min(totalPages - 1, p));
    if (clamped === page) return;
    setFlipDir(clamped > page ? 'next' : 'prev');
    setPage(clamped);
  };

  // ── Stats ──
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

  const instagramHandle = (currentUser.instagram || '').replace(/^@/, '').trim();
  const websiteUrl = (currentUser.website || '').trim();
  const websiteHref = websiteUrl
    ? (/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`)
    : '';
  const websiteLabel = websiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  return (
    <div className="space-y-8">
      {/* ── The passport book ──────────────────────────────────────────── */}
      <div className="wl-book relative">
        {/* binding spine with stitching */}
        <div className="absolute inset-y-3 left-0 w-2.5 rounded-l-[2rem] bg-gradient-to-b from-violet-950 via-stone-950 to-violet-950 dark:from-black dark:via-violet-950 dark:to-black z-20" aria-hidden>
          <div className="absolute inset-y-4 left-1/2 -transtone-x-1/2 border-l-2 border-dotted border-violet-300/40" />
        </div>

        <div
          key={page}
          className={`wl-book-page ${flipDir === 'next' ? 'wl-flip-next' : 'wl-flip-prev'} relative ml-2 overflow-hidden rounded-r-[2rem] rounded-l-md min-h-[30rem] ${
            page === 0
              ? 'bg-stone-950 dark:bg-black text-stone-100 shadow-xl'
              : 'bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(139,92,246,0.14),transparent_70%)] bg-white dark:bg-[#0e0820] border border-stone-200 dark:border-violet-900/40 shadow-xl'
          }`}
        >
          {page === 0 ? (
            /* ── Identity cover page ── */
            <>
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

                  {/* photo + home immigration stamp */}
                  <div className="flex items-start gap-5 shrink-0">
                    <div className="flex flex-col items-center gap-2">
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-violet-300/70 rotate-2 shadow-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-violet-300 text-stone-950 flex items-center justify-center font-display font-extrabold text-2xl rotate-2 shadow-lg">
                          {currentUser.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                        </div>
                      )}
                      {/* social links under the photo */}
                      <div className="flex flex-col items-center gap-1">
                        {instagramHandle && (
                          <a
                            href={`https://instagram.com/${instagramHandle}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-300 text-stone-950 hover:scale-105 transition-all"
                            title="Open Instagram profile"
                          >
                            <Instagram className="w-3 h-3" />
                            <span>@{instagramHandle}</span>
                          </a>
                        )}
                        {websiteUrl && (
                          <a
                            href={websiteHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-violet-300/50 text-violet-200 hover:bg-white/10 transition-colors"
                            title="Open personal website"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>{websiteLabel}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* home stamp — immigration cleared */}
                    {homeStamp && (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 -rotate-6 text-emerald-600 dark:text-emerald-400 shrink-0 select-none" title={`${homeStamp.country} · Immigration Cleared`}>
                        <PassportStamp
                          country={homeStamp.country}
                          year="HOME"
                          cities={homeStamp.cities}
                          bottomText={getTranslation('immigrationCleared')}
                          className="w-full h-full"
                        />
                      </div>
                    )}
                  </div>
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
            </>
          ) : (
            /* ── Stamps page ── */
            <>
              {/* passport-page guilloché texture */}
              <div
                className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px), radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px)',
                  backgroundSize: '26px 26px, 34px 34px'
                }}
                aria-hidden
              />
              <div className="relative z-10 p-6 sm:p-9 text-stone-900 dark:text-stone-100">
                <div className="flex items-baseline justify-between gap-3 mb-6">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-600 dark:text-violet-400 mb-1">
                      {getTranslation('passportKicker')}
                    </div>
                    <h2 className="font-display text-xl font-bold tracking-tight">
                      {getTranslation('passportStamps')}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-stone-400 tabular-nums">
                    {stamps.length} {getTranslation('statStamps')}
                  </span>
                </div>

                {stampPages[page - 1].length === 0 ? (
                  <div className="p-10 text-center border border-dashed border-stone-300 dark:border-violet-800/50 rounded-3xl text-sm text-stone-500 dark:text-stone-400">
                    {getTranslation('passportEmpty')}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-7 justify-items-center">
                    {stampPages[page - 1].map((st, i) => {
                      const rot = ((i * 47 + page * 13) % 13) - 6;
                      return (
                        <div
                          key={`${st.country}-${st.year}`}
                          className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full select-none ${STAMP_INKS[(i + page) % STAMP_INKS.length]}`}
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
            </>
          )}
        </div>

        {/* page-turn controls */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={page === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {getTranslation('prevPage')}
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Page ${i + 1}`}
                className={`rounded-full transition-all cursor-pointer ${
                  i === page
                    ? 'w-5 h-2 bg-violet-500 dark:bg-violet-400'
                    : 'w-2 h-2 bg-stone-300 dark:bg-stone-700 hover:bg-violet-300'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages - 1}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 hover:brightness-105 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {getTranslation('nextPage')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── What I have to say ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
          <Heart className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
            {getTranslation('aboutTitle')}
          </span>
        </div>
        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed max-w-3xl">
          {currentUser.bio}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-2">
              <Languages className="w-3.5 h-3.5" />
              <span>{getTranslation('statLanguages')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {languages.map((lang) => (
                <span key={lang} className="px-2 py-0.5 bg-white dark:bg-stone-800 border border-sky-200 dark:border-sky-800 rounded-md text-stone-800 dark:text-stone-200 font-medium text-[11px]">
                  {lang}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-2">
              <Heart className="w-3.5 h-3.5" />
              <span>{getTranslation('statHobbies')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hobbies.map((interest) => (
                <span key={interest} className="px-2 py-0.5 bg-white dark:bg-stone-800 border border-violet-200 dark:border-violet-800 rounded-md text-stone-800 dark:text-stone-200 font-medium text-[11px]">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── My Achievements ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-5">
          <Trophy className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
            {getTranslation('achieveTitle')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 text-center">
            <Globe className="w-4 h-4 text-violet-500 dark:text-violet-300 mx-auto mb-2" />
            <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 tabular-nums">
              {stamps.length}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mt-1">
              {getTranslation('statCountries')}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 text-center">
            <Route className="w-4 h-4 text-emerald-500 dark:text-emerald-300 mx-auto mb-2" />
            <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 tabular-nums">
              {totalDistanceKm > 0 ? totalDistanceKm.toLocaleString() : '—'}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mt-1">
              {getTranslation('statTotalKm')}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 text-center">
            <StampIcon className="w-4 h-4 text-amber-500 dark:text-amber-300 mx-auto mb-2" />
            <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 tabular-nums">
              {stamps.length}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400 mt-1">
              {getTranslation('statStamps')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
