import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Stamp,
  Check,
  AlertTriangle,
  CloudSun,
  Droplets,
  MapPin,
  Luggage,
  CheckSquare,
  Square,
  X,
  FileText,
  DollarSign,
  Smartphone,
  ShieldCheck,
  Languages,
  ExternalLink
} from 'lucide-react';
import { TravelItinerary, SoloTraveler } from '../types/travel';
import { formatTemperature } from '../utils/units';
import { lookupCountryGuide, visaAdviceFor, tippingAdviceFor } from '../utils/countryGuides';
import { cardAcceptanceForCountry, tippingForCountry, countryInfoFor, countryNameFor, visaVerdictFor } from '../utils/countryInfo';
import { taxInfoFor } from '../utils/taxInfo';
import AutoGrowTextarea from './AutoGrowTextarea';
import { travelAppsFor } from '../data/travelApps';
import { emergencyNumbersFor } from '../data/emergencyNumbers';
import { getFxRates, refreshFxRates, rateFor, type FxState } from '../utils/currency';
import { getTranslation, tv } from '../utils/i18n';
import { fetchWeatherTrend, type WeatherTrend } from '../utils/weatherSync';

/** Resolve the destination's currency facts (code, benchmark, card & tipping notes). */
export function resolveDestinationCurrency(itinerary: TravelItinerary) {
  const guideCurr = itinerary.travelGuide?.specificCurrency;
  const destLower = (itinerary.destination + ' ' + (itinerary.country || '')).toLowerCase();

  // If destination is Japan
  if (destLower.includes('japan') || destLower.includes('kyoto') || destLower.includes('tokyo') || destLower.includes('osaka')) {
    return {
      code: 'JPY',
      name: 'Japanese Yen (¥ / JPY)',
      symbol: '¥',
      rateBenchmark: '1 USD ≈ ¥152.00 · 1 EUR ≈ ¥165.50',
      cardAcceptance: 'Cards and Suica/Pasmo IC accepted at convenience stores & stations; carry ¥10,000–¥20,000 cash for historic shrines & ramen stalls.',
      tippingRules: 'Strictly zero tipping. Polite thanks ("Gochisousama deshita") is proper appreciation.'
    };
  }

  // If guide has an accurate non-default code matching non-Japan destinations
  if (guideCurr?.code && guideCurr.code !== 'JPY') {
    return guideCurr;
  }

  // Exact mapping by destination name and country
  if (destLower.includes('croatia') || destLower.includes('dubrovnik') || destLower.includes('split')) {
    return {
      code: 'EUR',
      name: 'Euro (€)',
      symbol: '€',
      rateBenchmark: '1 EUR ≈ 1.09 USD · 1 EUR ≈ 0.86 GBP (HRK phased out 2023)',
      cardAcceptance: 'Universal card acceptance in restaurants, Old Town shops, and museums. Keep €20 cash for island ferries & fruit stalls.',
      tippingRules: 'Service charge not itemized. Rounding up to nearest Euro or leaving 10% is customary.'
    };
  }

  if (
    destLower.includes('spain') ||
    destLower.includes('madrid') ||
    destLower.includes('seville') ||
    destLower.includes('barcelona') ||
    destLower.includes('italy') ||
    destLower.includes('amalfi') ||
    destLower.includes('rome') ||
    destLower.includes('france') ||
    destLower.includes('paris') ||
    destLower.includes('germany') ||
    destLower.includes('greece') ||
    destLower.includes('portugal') ||
    destLower.includes('lisbon') ||
    destLower.includes('austria') ||
    destLower.includes('netherlands') ||
    destLower.includes('amsterdam')
  ) {
    return {
      code: 'EUR',
      name: 'Euro (€)',
      symbol: '€',
      rateBenchmark: '1 EUR ≈ 1.09 USD · 1 EUR ≈ 0.86 GBP',
      cardAcceptance: 'Contactless cards and Apple/Google Pay accepted universally from transport turnstiles to neighborhood cafes.',
      tippingRules: 'Service included by law. Rounding up or leaving small change is appreciated.'
    };
  }

  if (destLower.includes('mexico') || destLower.includes('oaxaca') || destLower.includes('cancun')) {
    return {
      code: 'MXN',
      name: 'Mexican Peso ($ / MXN)',
      symbol: '$',
      rateBenchmark: '1 USD ≈ 19.80 MXN · 1 EUR ≈ 21.50 MXN',
      cardAcceptance: 'Cash essential ($500–$1,000 MXN in small bills) for food markets, street tacos, artisan mezcal, and colectivos.',
      tippingRules: 'La propina: 10%–15% is standard for good table service in sit-down restaurants.'
    };
  }

  if (destLower.includes('uk') || destLower.includes('london') || destLower.includes('scotland') || destLower.includes('britain') || destLower.includes('england')) {
    return {
      code: 'GBP',
      name: 'British Pound (£)',
      symbol: '£',
      rateBenchmark: '1 GBP ≈ 1.30 USD · 1 GBP ≈ 1.18 EUR',
      cardAcceptance: 'Almost completely cashless; tap phone or contactless card on Tube, black cabs, and pubs.',
      tippingRules: 'Discretionary 12.5% service charge usually included on restaurant bills.'
    };
  }

  if (destLower.includes('swiss') || destLower.includes('switzerland') || destLower.includes('grindelwald') || destLower.includes('zurich')) {
    return {
      code: 'CHF',
      name: 'Swiss Franc (CHF / Fr.)',
      symbol: 'Fr.',
      rateBenchmark: '1 CHF ≈ 1.13 USD · 1 CHF ≈ 1.05 EUR',
      cardAcceptance: 'Cards and mobile pay accepted everywhere including alpine gondolas and mountain huts.',
      tippingRules: 'Service included by law. Rounding up to next 5 Francs on a meal is appreciated.'
    };
  }

  if (destLower.includes('china') || destLower.includes('shanghai') || destLower.includes('beijing')) {
    return {
      code: 'CNY',
      name: 'Chinese Yuan (¥ / RMB)',
      symbol: '¥',
      rateBenchmark: '1 USD ≈ ¥7.15 CNY · 1 EUR ≈ ¥7.80 CNY',
      cardAcceptance: 'Fully digital cashless: bind foreign credit card to Alipay or WeChat Pay before arrival.',
      tippingRules: 'Strictly no tipping.'
    };
  }

  if (destLower.includes('thailand') || destLower.includes('bangkok') || destLower.includes('chiang mai')) {
    return {
      code: 'THB',
      name: 'Thai Baht (฿ / THB)',
      symbol: '฿',
      rateBenchmark: '1 USD ≈ 34.5 THB · 1 EUR ≈ 37.5 THB',
      cardAcceptance: 'Cash is king for street night markets, songthaews, and island longtail boats. Cards accepted in malls and hotels.',
      tippingRules: 'Tipping is not customary; rounding up 20–50 Baht for pleasant table dining is appreciated.'
    };
  }

  if (destLower.includes('vietnam') || destLower.includes('hanoi') || destLower.includes('da nang')) {
    return {
      code: 'VND',
      name: 'Vietnamese Dong (₫ / VND)',
      symbol: '₫',
      rateBenchmark: '1 USD ≈ 25,400 VND · 1 EUR ≈ 27,500 VND',
      cardAcceptance: 'Cash essential for street pho stalls and cyclo rides. ATMs widely available in cities.',
      tippingRules: 'Not expected; small change left at cafes is appreciated.'
    };
  }

  if (destLower.includes('indonesia') || destLower.includes('bali')) {
    return {
      code: 'IDR',
      name: 'Indonesian Rupiah (Rp / IDR)',
      symbol: 'Rp',
      rateBenchmark: '1 USD ≈ 15,800 IDR · 1 EUR ≈ 17,200 IDR',
      cardAcceptance: 'Cash needed for warungs, temple sarong rentals, and scooter parking. Cards accepted in beach clubs.',
      tippingRules: '5-10% appreciated for good service if service charge is not on the bill.'
    };
  }

  if (destLower.includes('korea') || destLower.includes('seoul')) {
    return {
      code: 'KRW',
      name: 'South Korean Won (₩ / KRW)',
      symbol: '₩',
      rateBenchmark: '1 USD ≈ ₩1,380 KRW · 1 EUR ≈ ₩1,500 KRW',
      cardAcceptance: 'Almost cashless; credit cards and T-Money transport cards accepted universally.',
      tippingRules: 'Strictly no tipping.'
    };
  }

  if (destLower.includes('australia') || destLower.includes('sydney')) {
    return {
      code: 'AUD',
      name: 'Australian Dollar (A$ / AUD)',
      symbol: 'A$',
      rateBenchmark: '1 AUD ≈ 0.65 USD',
      cardAcceptance: 'Contactless cards and Apple/Google Pay accepted everywhere.',
      tippingRules: 'No tipping required or expected.'
    };
  }

  if (destLower.includes('canada') || destLower.includes('vancouver') || destLower.includes('toronto')) {
    return {
      code: 'CAD',
      name: 'Canadian Dollar (CA$ / CAD)',
      symbol: 'CA$',
      rateBenchmark: '1 CAD ≈ 0.72 USD',
      cardAcceptance: 'Tap to pay everywhere from taxis to coffee shops.',
      tippingRules: '15-18% standard tipping for table dining.'
    };
  }

  // Any other recognised country: use its own currency (never default to USD)
  const kbFallback = lookupCountryGuide(destLower);
  if (kbFallback.key !== 'generic') {
    return {
      code: kbFallback.currencyCode,
      name: `${kbFallback.currencyName} (${kbFallback.currencySymbol} / ${kbFallback.currencyCode})`,
      symbol: kbFallback.currencySymbol,
      rateBenchmark: '',
      cardAcceptance: cardAcceptanceForCountry(destLower),
      tippingRules: tippingForCountry(destLower)
    };
  }

  return {
    code: 'USD',
    name: 'US Dollar ($)',
    symbol: '$',
    rateBenchmark: '1 USD = $1.00 USD',
    cardAcceptance: 'Cards accepted at all major establishments.',
    tippingRules: '15%–20% standard table tipping in North America; check local destination customs.'
  };
}



/** Deterministic small hash for per-city weather variation on multi-city trips. */
const hashStr = (s: string): number => {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** Shift every °C value in a temperature string by delta degrees. */
const shiftCelsius = (s: string, delta: number): string =>
  s.replace(/(-?\d+)\s*°C/g, (_m, n) => `${Number(n) + delta}°C`);

const CITY_CONDITION_VARIANTS = [
  'Expect sunny intervals with pleasant afternoons.',
  'Mostly clear skies with a light local breeze.',
  'Passing clouds with mild, comfortable temperatures.',
  'Bright mornings giving way to cooler evenings.',
  'Occasional short showers possible — pack a light layer.'
];

interface TravelGuidePanelProps {
  itinerary: TravelItinerary;
  currentUser: SoloTraveler;
}

/**
 * The enriched Travel Guide — visa & entry, weather, packing checklist, currency,
 * apps, customs, greetings, cultural shocks and safety numbers. Lives on the trip
 * page as its own tab (taken out of the itinerary timeline).
 */
/** Live weather trend for the guide's City Weather card — real Open-Meteo
    forecast for trips ≤16 days out, climate-trend projection for later trips. */
const WeatherTrendBlock: React.FC<{ itinerary: TravelItinerary }> = ({ itinerary }) => {
  const [trend, setTrend] = useState<WeatherTrend | null>(null);
  const city =
    itinerary.travelGuide?.destinationCity || itinerary.destination.split(',')[0]?.trim() || '';
  const country = itinerary.travelGuide?.destinationCountry || itinerary.country || '';

  useEffect(() => {
    let alive = true;
    setTrend(null);
    void fetchWeatherTrend(city, country, itinerary.startDate, itinerary.endDate).then((t) => {
      if (alive) setTrend(t);
    });
    return () => {
      alive = false;
    };
  }, [city, country, itinerary.startDate, itinerary.endDate]);

  if (!trend) return null;
  const hi = Math.max(...trend.days.map((d) => d.tMax));
  const lo = Math.min(...trend.days.map((d) => d.tMin));
  const span = Math.max(hi - lo, 1);

  return (
    <div className="bg-white/80 dark:bg-slate-800/70 border border-sky-100 dark:border-slate-700 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] flex items-center gap-1.5">
          <Droplets className="w-3 h-3 text-sky-500" />
          {getTranslation('weatherTrendTitle')}
        </span>
        <span className="font-mono tabular-nums text-[10px] font-bold text-slate-600 dark:text-slate-300">
          {formatTemperature(`${trend.avgLo}°C`)} – {formatTemperature(`${trend.avgHi}°C`)}
        </span>
      </div>
      <div className="space-y-1">
        {trend.days.slice(0, 7).map((d) => {
          const left = ((d.tMin - lo) / span) * 100;
          const width = Math.max(((d.tMax - d.tMin) / span) * 100, 6);
          const label = new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric'
          });
          return (
            <div key={d.date} className="flex items-center gap-2 text-[10px] font-mono">
              <span className="w-16 shrink-0 truncate text-slate-500 dark:text-slate-400">{label}</span>
              <span className="w-7 text-right text-indigo-500 dark:text-indigo-400 tabular-nums">
                {Math.round(d.tMin)}°
              </span>
              <span className="relative flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <span
                  className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </span>
              <span className="w-7 text-amber-600 dark:text-amber-400 tabular-nums">
                {Math.round(d.tMax)}°
              </span>
              {d.precipProb != null && (
                <span className="w-9 text-right text-sky-600 dark:text-sky-400 tabular-nums inline-flex items-center justify-end gap-0.5">
                  <Droplets className="w-2.5 h-2.5" />
                  {d.precipProb}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-400 dark:text-slate-500">
        {trend.source === 'forecast'
          ? getTranslation('weatherSrcForecast')
          : getTranslation('weatherSrcClimate')}
        {' · '}
        {getTranslation('weatherUpdated')}{' '}
        {new Date(trend.fetchedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
};

export const TravelGuidePanel: React.FC<TravelGuidePanelProps> = ({ itinerary, currentUser }) => {
  // Country knowledge overlay — keeps rules, customs, phrases & currency aligned
  // with the destination even for itineraries saved before the knowledge base existed.
  const guideKb = lookupCountryGuide(`${itinerary.destination} ${itinerary.country || ''}`);
  // Never assume a nationality (the old German default showed strangers' visa
  // rules). Empty means: ask the traveller to set their passport nationality.
  const guideNat = (itinerary.travelGuide?.travelerNationality || currentUser.country || '').trim();
  // Concrete apps locals actually use + emergency numbers for this destination
  const guideApps = travelAppsFor(`${itinerary.destination} ${itinerary.country || ''}`);
  const guideEmergency = emergencyNumbersFor(`${itinerary.country || ''} ${itinerary.destination}`);
  // Traveller nationality's home currency (for the dual exchange-rate display)
  const natCurrency = countryInfoFor(guideNat)?.currency || { code: 'EUR', symbol: '€', name: 'Euro' };
  const visaVerdict = visaVerdictFor(guideNat, `${itinerary.country || ''} ${itinerary.destination}`);
  // Localized chip label from the matrix status (never a guessed regime text)
  const visaDaysStr = visaVerdict.days ? tv('visaDaysShort', { n: visaVerdict.days }) : '';
  const visaChipLabel = visaVerdict.status === 'home'
    ? getTranslation('visaChipHome')
    : visaVerdict.status === 'free'
    ? `${getTranslation('visaChipFree')}${visaVerdict.days ? ` · ${visaDaysStr}` : ''}`
    : visaVerdict.status === 'eta'
    ? (visaVerdict.etaName || getTranslation('visaChipEta'))
    : visaVerdict.status === 'evisa'
    ? (visaVerdict.etaName || getTranslation('visaChipEvisa'))
    : visaVerdict.status === 'voa'
    ? `${getTranslation('visaChipVoa')}${visaVerdict.days ? ` · ${visaDaysStr}` : ''}`
    : visaVerdict.status === 'required'
    ? getTranslation('visaChipRequired')
    : getTranslation('visaChipCheck');

  // Visa details popup — full visa paragraph + entry customs, on demand
  const [visaPopupOpen, setVisaPopupOpen] = useState(false);

  // Tax-refund tips popup — the country name whose tax guide is open
  const [taxTipsCountry, setTaxTipsCountry] = useState<string | null>(null);

  // Live FX rates — refreshed from the API on mount, cached 6h, offline fallback estimates
  const [fx, setFx] = useState<FxState>(() => getFxRates());
  useEffect(() => {
    let alive = true;
    refreshFxRates().then((s) => {
      if (alive) setFx(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!itinerary.travelGuide) return null;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center font-bold text-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                {getTranslation('travelGuideLabel')} · {itinerary.travelGuide.destinationCity || itinerary.destination.split(',')[0]} ({itinerary.travelGuide.destinationCountry})
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {guideNat ? (
                  <>
                    {getTranslation('verifiedRun')}{' '}
                    <strong className="text-slate-800 dark:text-slate-200">{guideNat}</strong>
                  </>
                ) : (
                  getTranslation('visaNeedNatShort')
                )}
              </p>
            </div>
          </div>

          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md self-start sm:self-auto">
            {getTranslation('verifiedGuide')}
          </span>
        </div>

        {/* Visa & Entry — short verdict strip; details live in a popup */}
        <div className="p-4 sm:p-5 bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
              <Stamp className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {getTranslation('visaEntryLabel')} · {guideKb.name}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                {guideNat ? tv('forPassport', { nat: guideNat }) : getTranslation('visaNeedNatShort')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {!guideNat && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-stone-300/80 dark:border-stone-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{getTranslation('visaNeedNat')}</span>
              </span>
            )}
            {guideNat && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                visaVerdict.tone === 'free'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : visaVerdict.tone === 'online'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : visaVerdict.tone === 'embassy'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 border-stone-300/80 dark:border-stone-700'
              }`}
              title={visaVerdict.note || visaVerdict.verdict}
            >
              {visaVerdict.tone === 'free' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{visaChipLabel}</span>
            </span>
            )}
            {guideNat && visaVerdict.official && (
              <a
                href={visaVerdict.official}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {getTranslation('visaOfficialBtn')}
              </a>
            )}
            <button
              type="button"
              onClick={() => setVisaPopupOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
            >
              {getTranslation('moreDetails')}
            </button>
          </div>
        </div>

        {/* Top Highlights: City Weather Outlook & Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* City-Specific Weather Outlook (Microclimate & Period Trends) */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-sky-50 via-orange-50/60 to-amber-50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 border border-sky-100 dark:border-slate-700 rounded-xl space-y-2.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
              <CloudSun className="w-4 h-4 text-amber-600" />
              <span>{getTranslation('cityWeather')}</span>
            </div>

            {/* Real forecast trend — Open-Meteo, synced with the trip dates */}
            <WeatherTrendBlock itinerary={itinerary} />

            {/* Multi-city trips: one weather card per city */}
            {itinerary.cities && itinerary.cities.length > 1 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {itinerary.cities.map((cityName, cityIdx) => {
                  const base = itinerary.travelGuide!.weatherOutlook;
                  const shift = ((hashStr(cityName) % 5) - 2); // -2..+2 °C variation per city
                  const conditions = CITY_CONDITION_VARIANTS[hashStr(cityName) % CITY_CONDITION_VARIANTS.length];
                  return (
                    <div
                      key={cityName}
                      className="bg-white/80 dark:bg-slate-800/70 border border-sky-100 dark:border-slate-700 rounded-xl p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {cityName}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-slate-950 dark:text-slate-50 text-[11px]">
                          {formatTemperature(shiftCelsius(base?.temperatureRange || '14°C – 23°C', shift))}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                        <div className="bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
                          <span className="text-amber-700 dark:text-amber-400">{getTranslation('dayShort')}</span>{' '}
                          <span className="font-bold text-amber-900 dark:text-amber-200">{formatTemperature(shiftCelsius(base?.daytimeAvg || '20°C', shift))}</span>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800">
                          <span className="text-indigo-500 dark:text-indigo-400">{getTranslation('nightShort')}</span>{' '}
                          <span className="font-bold text-indigo-900 dark:text-indigo-200">{formatTemperature(shiftCelsius(base?.nighttimeAvg || '13°C', shift))}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {base?.conditions ? `${base.conditions} ` : ''}{conditions}
                      </p>
                      {cityIdx === 0 && base?.clothingAdvice && (
                        <p className="text-[10px] text-amber-800 dark:text-amber-300">
                          <strong>{getTranslation('clothingRoute')}</strong> {base.clothingAdvice}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
            <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
              <div>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{getTranslation('locationLabel')}</span>{' '}
                {itinerary.travelGuide.weatherOutlook?.cityName || itinerary.travelGuide.destinationCity || itinerary.destination}
              </div>
              <div className="grid grid-cols-2 gap-2 py-1 text-[11px] font-mono">
                <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-700 dark:text-amber-400 block">{getTranslation('daytimeHigh')}</span>
                  <span className="font-bold text-amber-900 dark:text-amber-200">{formatTemperature(itinerary.travelGuide.weatherOutlook?.daytimeAvg || '20°C')}</span>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded border border-indigo-200 dark:border-indigo-800">
                  <span className="text-indigo-500 dark:text-indigo-400 block">{getTranslation('nighttimeLow')}</span>
                  <span className="font-bold text-indigo-900 dark:text-indigo-200">{formatTemperature(itinerary.travelGuide.weatherOutlook?.nighttimeAvg || '13°C')}</span>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {itinerary.travelGuide.weatherOutlook?.conditions}
              </p>
              {itinerary.travelGuide.weatherOutlook?.clothingAdvice && (
                <div className="text-[11px] bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded border border-amber-200/60 text-amber-900 dark:text-amber-200">
                  <strong>{getTranslation('clothingAdvice')}</strong> {itinerary.travelGuide.weatherOutlook.clothingAdvice}
                </div>
              )}
            </div>
            )}
          </div>

        </div>

        {/* Specific Currency Section (Refined: Corresponds specifically to country) */}
        {(() => {
          const base = resolveDestinationCurrency(itinerary);
          const curr =
            guideKb.key !== 'generic'
              ? {
                  ...base,
                  code: guideKb.currencyCode,
                  name: `${guideKb.currencyName} (${guideKb.currencySymbol} / ${guideKb.currencyCode})`,
                  symbol: guideKb.currencySymbol
                }
              : base;
          return (
            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>{getTranslation('currencyTitle')}</span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded">
                  {curr.code} ({curr.symbol})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-slate-500 block">{getTranslation('exchangeRates')}</span>
                    <span
                      className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        fx.isLive
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          fx.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      {fx.isLive ? getTranslation('liveBadge') : getTranslation('estimatedBadge')}
                    </span>
                  </div>
                  {/* Each conversion gets two stacked rows: the currency pair on
                      the first row, its exchange rate on the row below */}
                  {(() => {
                    const tgt = curr.code;
                    const fmtRateN = (n: number) =>
                      n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
                      : n >= 10 ? n.toFixed(1)
                      : n.toFixed(2);
                    const same = tgt === 'USD';
                    const usdLine = same ? '—' : `1 USD ≈ ${curr.symbol}${fmtRateN(rateFor(tgt, fx))} ${tgt}`;
                    const natCode = natCurrency.code;
                    const natLine = natCode === tgt
                      ? '—'
                      : `1 ${natCode} ≈ ${curr.symbol}${fmtRateN(rateFor(tgt, fx) / rateFor(natCode, fx))} ${tgt}`;
                    return (
                      <div className="mt-1.5 space-y-2">
                        <div>
                          <div className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wide">USD → {tgt}</div>
                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums" title={same ? getTranslation('sameCurrency') : undefined}>{usdLine}</div>
                        </div>
                        {guideNat && (
                        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700">
                          <div className="text-slate-500 dark:text-slate-400 text-[10px] font-semibold uppercase tracking-wide">{natCode} ({guideNat}) → {tgt}</div>
                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums" title={natCode === tgt ? getTranslation('sameCurrency') : undefined}>{natLine}</div>
                        </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 sm:col-span-2">
                  <span className="text-[11px] text-slate-500 block">{getTranslation('cardCash')}</span>
                  <span className="text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                    {curr.cardAcceptance}
                  </span>
                  {/* Sales tax awareness — included/excluded in displayed prices + rate */}
                  {(() => {
                    const tax = taxInfoFor(`${itinerary.country || ''} ${itinerary.destination}`);
                    if (!tax) return null;
                    return (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-start justify-between gap-2">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          <strong className="text-slate-800 dark:text-slate-200">{getTranslation('taxLabel')}</strong>{' '}
                          <strong>{tax.included ? getTranslation('taxIncluded') : getTranslation('taxExcluded')}</strong> ({tax.rate})
                          — {getTranslation('unlessStore')}.
                        </span>
                        <button
                          type="button"
                          onClick={() => setTaxTipsCountry(countryNameFor(`${itinerary.country || ''} ${itinerary.destination}`))}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 transition-colors cursor-pointer shrink-0"
                          title={getTranslation('taxBack')}
                        >
                          {getTranslation('taxTips')}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                <strong className="text-slate-900 dark:text-slate-100">{getTranslation('tippingRules')}</strong>{' '}
                {tippingAdviceFor(guideNat, guideKb)}
              </div>
            </div>
          );
        })()}

        {/* Rules, Connectivity & Essential Apps (e.g. China VPN & Amap, Japan IC cards) */}
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>{getTranslation('connectivityTitle')}</span>
            </div>
            <span className="text-[10px] text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded font-medium">
              {getTranslation('criticalAdvice')}
            </span>
          </div>

          {/* Connectivity & VPN guidance */}
          {itinerary.travelGuide.arrivalRulesAndApps?.connectivityAdvice && (
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 rounded-lg text-slate-800 dark:text-slate-200">
              <div className="font-semibold text-blue-900 dark:text-blue-300 text-xs mb-0.5">
                {getTranslation('connectivityAdvice')}
              </div>
              <p className="leading-relaxed text-xs">
                {itinerary.travelGuide.arrivalRulesAndApps.connectivityAdvice}
              </p>
            </div>
          )}

          {/* Recommended Apps — concrete apps locals actually use */}
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-2">
              {tv('essentialAppsFor', { dest: guideKb.key !== 'generic' ? guideKb.name : itinerary.country || itinerary.destination })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {guideApps.map((app, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{app.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{app.purpose}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Local Customs & Cultural Etiquette */}
        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm pb-2 border-b border-slate-200 dark:border-slate-700 mb-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{getTranslation('customsTitle')}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(() => {
              const base = guideKb.key !== 'generic'
                ? guideKb.customs
                : itinerary.travelGuide!.culturalNorms || [];
              // Always present exactly six etiquette cards per destination
              const FILLER = [
                'Learn the local hand gestures and table manners before you go — what is friendly at home can be rude abroad.',
                'Haggling rules vary widely: bargain only where it is expected (markets), never in fixed-price shops.',
                'Keep your voice down in public transport and sacred spaces — loudness is the top tourist giveaway.',
                'Carry small change for tips, toilets and street vendors — cards are not universal outside cities.'
              ];
              const norms = [...base];
              let i = 0;
              while (norms.length < 6 && i < FILLER.length) {
                if (!norms.some((n) => n === FILLER[i])) norms.push(FILLER[i]);
                i++;
              }
              return norms.slice(0, 6).map((norm, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{norm}</span>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Basic Local Greetings & Cultural Expectations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Basic Greetings */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
              <Languages className="w-4 h-4 text-indigo-600" />
              <span>{getTranslation('greetingsTitle')}</span>
            </div>
            <div className="space-y-2 pt-1">
              {(guideKb.key !== 'generic'
                ? guideKb.phrases
                : itinerary.travelGuide!.basicGreetings || []
              ).map((g, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {g.phrase}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>{getTranslation('meaningLabel')} <em>{g.translation}</em></span>
                    <span className="font-mono text-indigo-700 dark:text-indigo-400 font-semibold">[{g.phonetic}]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cultural Shocks & Realities */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{getTranslation('shocksTitle')}</span>
            </div>
            <div className="space-y-2 pt-1">
              {itinerary.travelGuide.culturalShocks?.map((shock, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {shock.title}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {shock.description}
                  </p>
                  <div className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                    {getTranslation('tipLabel')} {shock.tip}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety & Meeting Point Guidelines */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-2">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {getTranslation('safetyTitle')}
          </div>

          {/* Emergency & police numbers for the destination country */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {guideEmergency.numbers.general && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 text-center">
                <div className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{getTranslation('emergencyLabel')} ({guideEmergency.country})</div>
                <div className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm tabular-nums">{guideEmergency.numbers.general}</div>
              </div>
            )}
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{getTranslation('policeLabel')}</div>
              <div className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm tabular-nums">{guideEmergency.numbers.police}</div>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{getTranslation('ambulanceLabel')}</div>
              <div className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm tabular-nums">{guideEmergency.numbers.ambulance}</div>
            </div>
            {guideEmergency.numbers.fire && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 text-center">
                <div className="text-[9px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">{getTranslation('fireLabel')}</div>
                <div className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm tabular-nums">{guideEmergency.numbers.fire}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {itinerary.travelGuide.soloSafetyAdvisories?.map((adv, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                {adv}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visa details popup — full visa paragraph on top, entry customs & regulations below */}
      {visaPopupOpen && (() => {
        const itin = itinerary;
        const kb = lookupCountryGuide(`${itin.destination} ${itin.country || ''}`);
        const nat = (itin.travelGuide?.travelerNationality || currentUser.country || '').trim();
        const rules = kb.key !== 'generic'
          ? kb.entryRules
          : itin.travelGuide?.arrivalRulesAndApps?.entryRegulations || [];
        return (
          <div
            className="wl-modal-overlay"
            onClick={() => setVisaPopupOpen(false)}
          >
            <div
              className="wl-modal-card max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                    {getTranslation('visaEntryLabel')} · {kb.name}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400 mt-0.5">
                    {nat ? tv('forPassport', { nat }) : getTranslation('visaNeedNatShort')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVisaPopupOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
                {nat ? visaAdviceFor(nat, kb) : getTranslation('visaNeedNatLong')}
              </p>

              {visaVerdict.official && (
                <a
                  href={visaVerdict.official}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-950/60 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {getTranslation('visaOfficialBtn')}
                </a>
              )}

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {getTranslation('entryCustoms')}
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {rules.map((reg, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-violet-400 font-bold">•</span>
                      <span>{reg}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tax tips popup — tourist tax-refund procedure for the destination */}
      {taxTipsCountry && (() => {
        const tax = taxInfoFor(taxTipsCountry);
        if (!tax) return null;
        return (
          <div
            className="wl-modal-overlay"
            onClick={() => setTaxTipsCountry(null)}
          >
            <div
              className="wl-modal-card max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                    {tv('taxIn', { country: taxTipsCountry })}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {tv(tax.included ? 'taxPopupSubInc' : 'taxPopupSubExc', { rate: tax.rate })} ({getTranslation('unlessStore')})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTaxTipsCountry(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="pt-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <div className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">{getTranslation('taxBack')}</div>
                {tax.refund ? (
                  <p>{tax.refund}</p>
                ) : (
                  <p>{tv('noRefund', { country: taxTipsCountry })}</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};
