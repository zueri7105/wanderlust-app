import { TravelGuideInfo } from '../types/travel';
import { lookupCountryGuide, visaAdviceFor, tippingAdviceFor } from './countryGuides';
import { travelAppsFor } from '../data/travelApps';
import { emergencyNumbersFor } from '../data/emergencyNumbers';
import { findPlaceGeo } from './placeGeo';
import { countryNameFor } from './countryInfo';

/**
 * Season-aware weather outlook derived from the destination's latitude and the
 * trip's start month — so a July trip to Zürich and a January trip to Bangkok
 * never share the same copy-paste forecast.
 */
const seasonalWeather = (destInput: string, country: string, startDate: string, endDate: string) => {
  const geo = findPlaceGeo(destInput) || findPlaceGeo(country);
  const lat = geo?.lat ?? 45;
  const absLat = Math.abs(lat);
  const month = startDate ? new Date(startDate).getMonth() : new Date().getMonth(); // 0-11
  // Northern-hemisphere season index; flipped south of the equator
  const nSeason = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0][month]; // 0 winter 1 spring 2 summer 3 autumn
  const season = lat < 0 ? (nSeason + 2) % 4 : nSeason;

  let day: number; let night: number; let rain: string; let conditions: string; let daylight: string;
  if (absLat < 23.5) {
    // Tropics — warm all year, wet/dry rhythm instead of four seasons
    const wet = (month >= 4 && month <= 9) !== lat < 0;
    day = 30; night = 24;
    rain = wet ? '50–70% — short heavy tropical showers, often late afternoon' : '10–25% — mostly dry days';
    conditions = wet ? 'Hot and humid with dramatic afternoon downpours.' : 'Warm, sunny and humid — classic dry-season weather.';
    daylight = 'Roughly 12 hours of daylight year-round.';
  } else if (absLat < 35) {
    // Subtropics
    [day, night] = [[16, 8], [22, 13], [31, 22], [24, 15]][season];
    rain = season === 2 ? '10–20% — long dry spells' : '25–40% — occasional showers';
    conditions = ['Mild days, crisp mornings.', 'Warm and bright, great walking weather.', 'Hot and sunny — plan shade breaks at midday.', 'Warm days cooling pleasantly at night.'][season];
    daylight = ['Approx. 10 hours daylight.', 'Approx. 12 hours daylight.', 'Approx. 14 hours daylight.', 'Approx. 11 hours daylight.'][season];
  } else if (absLat < 55) {
    // Temperate (most of Europe, northern US, Japan…)
    [day, night] = [[5, -1], [13, 5], [25, 15], [15, 7]][season];
    rain = season === 2 ? '20–30% — brief summer showers or storms' : '35–50% — pack a light rain layer';
    conditions = [
      'Cold, short days; possible frost or snow.',
      'Fresh and changeable — sunshine between showers.',
      'Warm, long days; occasional thunderstorms.',
      'Crisp air and golden light; cooler toward evening.'
    ][season];
    daylight = ['Approx. 8–9 hours daylight.', 'Approx. 12 hours daylight.', 'Approx. 15–16 hours daylight.', 'Approx. 10–11 hours daylight.'][season];
  } else {
    // Subpolar
    [day, night] = [[-2, -8], [8, 1], [18, 9], [6, 0]][season];
    rain = '30–45% — conditions change quickly';
    conditions = ['Very cold with limited daylight.', 'Cool and brightening fast.', 'Mild with very long evenings.', 'Chilly; first snow possible.'][season];
    daylight = ['Very short days — plan sights early.', 'Daylight stretches quickly.', 'Extremely long days (near-midnight sun).', 'Days shorten quickly.'][season];
  }

  const monthName = startDate
    ? new Date(startDate).toLocaleString('en', { month: 'long' })
    : 'your travel dates';
  const lo = Math.min(day, night);
  const hi = Math.max(day, night);
  return {
    cityName: `${destInput.split(',')[0].trim()} ${['Winter', 'Spring', 'Summer', 'Autumn'][season]} Outlook`,
    seasonPeriod: startDate && endDate ? `${startDate} to ${endDate}` : monthName,
    temperatureRange: `${lo}°C – ${hi}°C (${Math.round(lo * 1.8 + 32)}°F – ${Math.round(hi * 1.8 + 32)}°F)`,
    daytimeAvg: `${day}°C`,
    nighttimeAvg: `${night}°C`,
    rainProbability: rain,
    conditions,
    daylightSummary: daylight,
    clothingAdvice:
      season === 0
        ? 'Warm layers, a proper coat, waterproof shoes — and something windproof for exposed viewpoints.'
        : season === 2
        ? 'Light breathable layers, sunscreen, sunglasses and a hat; a thin layer for air-conditioned interiors.'
        : 'Layers you can add or shed through the day, comfortable walking shoes, and a packable rain jacket.'
  };
};

/**
 * Synchronous, offline-only travel guide builder — same knowledge base as the
 * full buildTravelGuide in ItineraryView (which may additionally call Gemini),
 * but guaranteed to resolve instantly with no network. Used by onboarding and
 * any flow that must create a complete itinerary in a single tick.
 */
export const buildBasicGuide = (
  destInput: string,
  countryInput: string,
  firstCity: string | undefined,
  nationality: string,
  startDate: string,
  endDate: string
): TravelGuideInfo => {
  const kb = lookupCountryGuide(destInput);
  // Never invent a nationality — an empty passport means visa/currency sections
  // must ask for the traveller's nationality instead of assuming one.
  const nat = (nationality || '').trim();
  const country =
    countryInput.trim() ||
    countryNameFor(destInput) ||
    (kb.key !== 'generic' ? kb.name : '');
  const city = firstCity || destInput.split(',')[0].trim();
  const tippingText = tippingAdviceFor(nat, kb);

  const emergency = emergencyNumbersFor(`${destInput} ${country}`);
  const emergencyAdvisory =
    `Emergency numbers in ${emergency.country}: ` +
    (emergency.numbers.general ? `General ${emergency.numbers.general} · ` : '') +
    `Police ${emergency.numbers.police} · Ambulance ${emergency.numbers.ambulance}` +
    (emergency.numbers.fire ? ` · Fire ${emergency.numbers.fire}` : '') +
    '. Save them offline before you arrive.';

  return {
    travelerNationality: nat,
    destinationCity: city,
    destinationCountry: country || destInput,
    visaRequirements: visaAdviceFor(nat, kb),
    specificCurrency: {
      code: kb.currencyCode,
      name: kb.currencyName,
      symbol: kb.currencySymbol,
      rateBenchmark: '',
      cardAcceptance:
        'Cards are widely accepted in cities; carry some cash for markets, taxis, and small towns.',
      tippingRules: tippingText
    },
    weatherOutlook: seasonalWeather(destInput, country, startDate, endDate),
    recommendedToBring: [
      'Comfortable walking shoes',
      'Power bank for full-day photo exploration',
      'Universal power plug adapter',
      'Lightweight packable rain jacket'
    ],
    arrivalRulesAndApps: {
      connectivityAdvice: 'Download offline maps before leaving airport.',
      recommendedApps: travelAppsFor(`${destInput} ${country}`),
      entryRegulations: kb.entryRules
    },
    culturalNorms: kb.customs,
    basicGreetings: kb.phrases,
    culturalShocks: [
      {
        title: 'Local Etiquette',
        description: 'Be respectful of local traditions and rhythms.',
        tip: 'Observe locals and follow their lead.'
      }
    ],
    soloSafetyAdvisories: [
      emergencyAdvisory,
      'Meet potential travel companions in busy public places and share your live location with someone you trust.'
    ]
  };
};
