import { TravelGuideInfo } from '../types/travel';
import { lookupCountryGuide, visaAdviceFor, tippingAdviceFor } from './countryGuides';
import { travelAppsFor } from '../data/travelApps';
import { emergencyNumbersFor } from '../data/emergencyNumbers';

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
  const nat = nationality || 'Germany';
  const country = countryInput.trim() || (kb.key !== 'generic' ? kb.name : destInput);
  const city = firstCity || destInput;
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
    destinationCountry: country,
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
    weatherOutlook: {
      cityName: `${city} City Outlook`,
      seasonPeriod: `${startDate} to ${endDate}`,
      temperatureRange: '16°C – 24°C',
      daytimeAvg: '22°C',
      nighttimeAvg: '15°C',
      rainProbability: '20%',
      conditions: 'Mild pleasant weather expected for the season.',
      daylightSummary: 'Approx. 11 hours daylight.',
      clothingAdvice: 'Light layers, good walking sneakers, sunglasses.'
    },
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
