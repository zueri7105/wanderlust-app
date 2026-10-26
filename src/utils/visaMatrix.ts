/**
 * Passport-specific visa rules — built from official government sources
 * (EU Home Affairs, GOV.UK, US State Dept, Canada.ca, AU Home Affairs,
 *  Immigration NZ, Japan MOFA, China NIA, Thai MFA/e-Visa, ICA Singapore…),
 * snapshot October 2026.
 *
 * THE RULE OF THIS FILE: never guess. If a (passport → destination) pair is
 * not covered by an encoded rule, the answer is 'check' with a link to the
 * destination's official government visa page — not an assumption.
 */

export type VisaStatus = 'home' | 'free' | 'eta' | 'evisa' | 'voa' | 'required' | 'check';

export interface VisaRuleHit {
  status: VisaStatus;
  days?: number;        // allowed stay in days, when known
  etaName?: string;     // ESTA / UK ETA / eTA / NZeTA / K-ETA / ETA-IL…
  note?: string;        // extra conditions worth knowing
}

export interface VisaVerdict extends VisaRuleHit {
  tone: 'free' | 'online' | 'embassy' | 'check';
  destName: string;
  official: string | null; // official government visa page for the destination
}

/* ── Passport groups (canonical COUNTRY_INFO names) ──────────────────────── */

const EU27 = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark',
  'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland',
  'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
  'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
];
const EFTA = ['Iceland', 'Norway', 'Switzerland', 'Liechtenstein'];
const EEA_UK_MICRO = [...EU27, ...EFTA, 'United Kingdom', 'Monaco', 'San Marino', 'Andorra', 'Vatican City'];
const GCC = ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'];
const ASEAN = ['Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia', 'Myanmar', 'Philippines', 'Singapore', 'Thailand', 'Vietnam'];

/** Schengen Annex II — visa-free non-EU passports (90/180 rule). */
const SCHENGEN_FREE = [
  'Albania', 'Andorra', 'Antigua and Barbuda', 'Argentina', 'Australia',
  'Bahamas', 'Barbados', 'Bosnia and Herzegovina', 'Brazil', 'Brunei',
  'Canada', 'Chile', 'Colombia', 'Costa Rica', 'Dominica', 'El Salvador',
  'Georgia', 'Grenada', 'Guatemala', 'Honduras', 'Hong Kong', 'Israel',
  'Japan', 'Kiribati', 'Kosovo', 'Malaysia', 'Marshall Islands', 'Mauritius',
  'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Montenegro', 'New Zealand',
  'Nicaragua', 'North Macedonia', 'Palau', 'Panama', 'Paraguay', 'Peru',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Serbia', 'Seychelles', 'Singapore',
  'Solomon Islands', 'South Korea', 'Taiwan', 'Timor-Leste', 'Tonga',
  'Trinidad and Tobago', 'Tuvalu', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Vanuatu', 'Vatican City',
  'Venezuela'
];

/** US Visa Waiver Program (ESTA). */
const VWP = [
  'Andorra', 'Australia', 'Austria', 'Belgium', 'Brunei', 'Chile', 'Croatia',
  'Czechia', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
  'Hungary', 'Iceland', 'Ireland', 'Israel', 'Italy', 'Japan', 'Latvia',
  'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Monaco',
  'Netherlands', 'New Zealand', 'Norway', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'San Marino', 'Singapore', 'Slovakia', 'Slovenia',
  'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'United Kingdom'
];

/** Canada eTA-eligible (visa-exempt) passports. */
const CA_ETA = [
  ...EU27, ...EFTA, 'United Kingdom', 'Australia', 'New Zealand', 'Japan',
  'South Korea', 'Singapore', 'Hong Kong', 'Taiwan', 'Israel', 'Chile',
  'Brazil', 'Argentina', 'Mexico', 'Andorra', 'Monaco', 'San Marino',
  'Vatican City', 'Bahamas', 'Barbados', 'Antigua and Barbuda', 'Dominica',
  'Grenada', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Mauritius', 'Seychelles'
];

/** UK ETA nationalities (non-visa nationals, ~90 passports). */
const UK_ETA = [
  ...EEA_UK_MICRO,
  'United States', 'Canada', 'Australia', 'New Zealand', 'Japan',
  'South Korea', 'Singapore', 'Malaysia', 'Brunei', 'Hong Kong', 'Taiwan',
  'Israel', 'United Arab Emirates', 'Qatar', 'Saudi Arabia', 'Kuwait',
  'Bahrain', 'Oman', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Uruguay',
  'Paraguay', 'Peru', 'Colombia', 'Costa Rica', 'Panama', 'Nicaragua',
  'El Salvador', 'Guatemala', 'Honduras', 'Dominican Republic', 'Bahamas',
  'Barbados', 'Antigua and Barbuda', 'Dominica', 'Grenada',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Trinidad and Tobago', 'Mauritius', 'Seychelles', 'South Africa', 'Tonga',
  'Samoa', 'Fiji', 'Kiribati', 'Palau', 'Tuvalu', 'Vanuatu',
  'Solomon Islands', 'Micronesia', 'Marshall Islands', 'Nauru'
];
/** Major UK visa nationals (must get a Standard Visitor visa). */
const UK_VISA = [
  'China', 'India', 'Russia', 'Turkey', 'Philippines', 'Vietnam',
  'Indonesia', 'Thailand', 'Sri Lanka', 'Nepal', 'Pakistan', 'Bangladesh',
  'Nigeria', 'Kenya', 'Ghana', 'Egypt', 'Morocco', 'Algeria', 'Tunisia',
  'Myanmar', 'Cambodia', 'Laos', 'Mongolia', 'Kazakhstan', 'Uzbekistan',
  'Armenia', 'Azerbaijan', 'Belarus', 'Georgia', 'Ukraine', 'Moldova',
  'Serbia', 'Albania', 'Bosnia and Herzegovina', 'Montenegro',
  'North Macedonia', 'Kosovo', 'Iran', 'Iraq', 'Jordan', 'Lebanon',
  'Syria', 'Yemen', 'Libya', 'Sudan', 'Ethiopia', 'Tanzania', 'Uganda',
  'Zimbabwe', 'Zambia', 'Cuba', 'Jamaica', 'Haiti', 'Venezuela', 'Bolivia',
  'Ecuador', 'Afghanistan', 'Cameroon', 'Senegal', "Côte d'Ivoire"
];

/** Australia: eVisitor (651) — European passports, free via ImmiAccount. */
const AU_EVISITOR = [...EEA_UK_MICRO];
/** Australia: ETA (601) — via the official Australian ETA app. */
const AU_ETA = [
  'United States', 'Canada', 'Japan', 'South Korea', 'Singapore',
  'Malaysia', 'Hong Kong', 'Taiwan', 'Brunei'
];

/** New Zealand visa-waiver passports (need NZeTA + IVL). */
const NZ_WAIVER = [
  ...EEA_UK_MICRO, 'United States', 'Canada', 'Japan', 'South Korea',
  'Singapore', 'Malaysia', 'Hong Kong', 'Taiwan', 'Brunei', 'Israel',
  'United Arab Emirates', 'Qatar', 'Saudi Arabia', 'Kuwait', 'Bahrain',
  'Oman', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Uruguay', 'Mauritius',
  'Seychelles'
];

/** Japan visa-exemption passports (MOFA list). */
const JP_FREE = [
  ...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand',
  'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Hong Kong', 'Taiwan',
  'Israel', 'United Arab Emirates', 'Qatar', 'Turkey', 'Tunisia',
  'Mauritius', 'Lesotho', 'Mexico', 'Brazil', 'Argentina', 'Chile',
  'Uruguay', 'Suriname', 'Costa Rica', 'Panama', 'Guatemala', 'Honduras',
  'El Salvador', 'Bahamas', 'Barbados', 'Dominican Republic', 'Serbia',
  'North Macedonia'
];

/** China unilateral/bilateral visa-free (30 days), as of Oct 2026. */
const CN_FREE = [
  // Unilateral European list (35)
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece',
  'Hungary', 'Iceland', 'Ireland', 'Italy', 'Latvia', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Malta', 'Monaco', 'Montenegro',
  'Netherlands', 'North Macedonia', 'Norway', 'Poland', 'Portugal',
  'Romania', 'Russia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
  'Switzerland', 'United Kingdom',
  // Unilateral Asia-Pacific
  'Australia', 'New Zealand', 'Japan', 'South Korea', 'Brunei',
  // Bilateral mutual exemptions
  'Singapore', 'Thailand', 'Malaysia', 'Kazakhstan', 'Georgia', 'Armenia',
  'United Arab Emirates', 'Qatar'
];
/** LatAm five under the unilateral trial — flag it as time-limited. */
const CN_FREE_TRIAL = ['Brazil', 'Argentina', 'Chile', 'Peru', 'Uruguay'];

/** South Korea visa-free passports (K-ETA applies unless temporarily waived). */
const KR_FREE = [
  ...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand',
  'Japan', 'Singapore', 'Hong Kong', 'Taiwan', 'Thailand', 'Malaysia',
  'Brunei', 'Israel', 'United Arab Emirates', 'Qatar', 'Saudi Arabia',
  'Russia', 'Kazakhstan', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Peru',
  'Colombia', 'Costa Rica', 'Panama', 'Uruguay', 'Paraguay'
];

/** Thailand rules as of 15 Sep 2026 (Royal Gazette). */
const TH_30 = [
  'Austria', 'Australia', 'Bahrain', 'Belgium', 'Bhutan', 'Brunei',
  'Bulgaria', 'Canada', 'Croatia', 'Cyprus', 'Czechia', 'Denmark',
  'Estonia', 'Fiji', 'Finland', 'France', 'Georgia', 'Germany', 'Greece',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy',
  'Japan', 'Jordan', 'Kuwait', 'Kyrgyzstan', 'Latvia', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Malaysia', 'Maldives', 'Malta',
  'Netherlands', 'New Zealand', 'Norway', 'Oman', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Saudi Arabia', 'Singapore', 'Slovakia',
  'Slovenia', 'South Africa', 'Spain', 'Sweden', 'Switzerland', 'Taiwan',
  'Turkey', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States'
];
const TH_BIL90 = ['Argentina', 'Brazil', 'Chile', 'Peru', 'South Korea'];
const TH_BIL30 = [
  'China', 'Hong Kong', 'Kazakhstan', 'Laos', 'Mongolia', 'Russia',
  'Timor-Leste', 'Vietnam'
];
const TH_VOA = ['Azerbaijan', 'Belarus', 'Serbia'];

/** Singapore visa-required passports (ICA Assessment Level I & II). */
const SG_VISA = [
  'Afghanistan', 'Algeria', 'Armenia', 'Azerbaijan', 'Bangladesh',
  'Belarus', 'Cuba', 'Egypt', 'Ethiopia', 'Georgia', 'Ghana',
  'India', 'Iran', 'Iraq', 'Jordan', 'Kazakhstan', 'Kenya', 'Kyrgyzstan',
  'Lebanon', 'Libya', 'Mali', 'Moldova', 'Morocco', 'Myanmar', 'Nepal',
  'Nigeria', 'North Korea', 'Pakistan', 'Russia', 'Saudi Arabia',
  'Somalia', 'Sri Lanka', 'Sudan', 'Syria', 'Tajikistan', 'Tunisia',
  'Turkmenistan', 'Ukraine', 'Uzbekistan', 'Yemen'
];
// Note: China was removed from SG_VISA — the China–Singapore mutual 30-day
// visa exemption has been in force since 9 Feb 2024.

/** Malaysia: 90-day visa-free passports. */
const MY_FREE90 = [...EEA_UK_MICRO, 'United States', 'Japan', 'South Korea', 'Australia', 'New Zealand', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Turkey'];

/** Indonesia: VOA / e-VOA passports (~97). */
const ID_VOA = [
  ...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand',
  'Japan', 'South Korea', 'China', 'India', 'Taiwan', 'Hong Kong',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Russia', 'Turkey',
  'Brazil', 'Argentina', 'Chile', 'Mexico', 'Colombia', 'South Africa'
];

/** Vietnam: 45-day unilateral visa-free passports. */
const VN_FREE45 = [
  'Belarus', 'Denmark', 'Finland', 'France', 'Germany', 'Italy', 'Japan',
  'Norway', 'Russia', 'South Korea', 'Spain', 'Sweden', 'United Kingdom'
];

/** Philippines: 30-day visa-free passports. */
const PH_FREE = [
  ...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand',
  'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam',
  'Indonesia', 'Brunei', 'Cambodia', 'Laos', 'Myanmar',
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Brazil', 'Argentina',
  'Chile', 'Mexico', 'Peru', 'Colombia', 'South Africa', 'Turkey',
  'Kazakhstan', 'Russia'
];

/** Russia visa-free passports (CIS + bilateral agreements). */
const RU_FREE = [
  'Armenia', 'Azerbaijan', 'Belarus', 'Kazakhstan', 'Kyrgyzstan',
  'Moldova', 'Tajikistan', 'Uzbekistan', 'Argentina', 'Bolivia', 'Brazil',
  'Chile', 'Colombia', 'Cuba', 'Ecuador', 'Israel', 'Montenegro',
  'Nicaragua', 'Peru', 'Paraguay', 'Serbia', 'Thailand', 'Uruguay',
  'Venezuela', 'South Korea', 'Hong Kong', 'Mongolia', 'South Africa',
  'Mexico', 'Singapore'
];
/** Russia unified e-Visa passports (~55, includes the whole EU). */
const RU_EVISA = [
  ...EU27, 'China', 'India', 'Japan', 'Turkey', 'Saudi Arabia', 'Vietnam',
  'Indonesia', 'Iran', 'Kuwait', 'Bahrain', 'Oman', 'Malaysia', 'Myanmar',
  'Philippines', 'Cambodia', 'Taiwan', 'North Korea'
];

/** Turkey visa-free passports. */
const TR_FREE = [
  ...EEA_UK_MICRO, 'United States', 'Canada', 'Japan', 'South Korea',
  'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines',
  'Russia', 'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Ukraine', 'Georgia',
  'Azerbaijan', 'Belarus', 'Moldova', 'Serbia', 'Albania',
  'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Kosovo',
  'Qatar', 'United Arab Emirates', 'Bahrain', 'Oman', 'Saudi Arabia',
  'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Mexico', 'Uruguay',
  'Paraguay', 'Bolivia', 'Ecuador', 'Venezuela', 'Hong Kong', 'Israel',
  'Jordan', 'Kuwait', 'Morocco', 'Tunisia', 'South Africa', 'New Zealand'
];

/** Mexico visa-free passports (others need a visa unless holding US/CA/JP/UK/Schengen visa or residence). */
const MX_FREE = [
  ...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand',
  'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Argentina', 'Chile',
  'Peru', 'Colombia', 'Uruguay', 'Israel'
];

/** Brazil visa-free passports (90 days). */
const BR_FREE = [
  ...EEA_UK_MICRO, 'Japan', 'South Korea', 'Singapore', 'Malaysia',
  'Russia', 'South Africa', 'Israel', 'Mexico', 'Thailand', 'Philippines',
  'Turkey', 'New Zealand', 'Ukraine', 'Georgia', 'United Arab Emirates',
  'Qatar', 'Hong Kong'
];
const MERCOSUR = ['Argentina', 'Bolivia', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Peru', 'Uruguay', 'Venezuela', 'Guyana', 'Suriname'];

/** UAE visa-on-arrival passports. */
const AE_VOA90 = [...EU27, ...EFTA, 'United Kingdom', 'Russia', 'Ukraine', 'Kazakhstan', 'Uzbekistan'];
const AE_VOA30 = [
  'United States', 'Canada', 'Australia', 'New Zealand', 'Japan',
  'South Korea', 'Singapore', 'China', 'Hong Kong', 'Taiwan', 'Brazil',
  'Argentina', 'Chile', 'Peru', 'Uruguay', 'Mexico', 'Malaysia', 'Thailand'
];

/** Schengen member states (Romania & Bulgaria full members since 1 Jan 2025). */
const SCHENGEN_DESTS = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Czechia', 'Denmark',
  'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
  'Iceland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Malta', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania',
  'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland'
];

/* ── Rule table ──────────────────────────────────────────────────────────── */

interface Rule {
  who: string[] | 'ALL';
  status: Exclude<VisaStatus, 'home'>;
  days?: number;
  etaName?: string;
  note?: string;
}
interface DestRule {
  dests: string[];
  rules: Rule[];
  fallback: Exclude<VisaStatus, 'home'>;
  fallbackNote?: string;
  official: string;
}

const SCHENGEN_NOTE =
  '90 days within any 180. EES biometric registration is live at the border; ETIAS pre-authorisation is NOT in operation yet (no date announced as of Oct 2026).';

const DEST_RULES: DestRule[] = [
  {
    dests: SCHENGEN_DESTS,
    official: 'https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en',
    rules: [
      { who: [...EEA_UK_MICRO.filter((c) => c !== 'United Kingdom')], status: 'free', note: 'EU/EEA/Swiss citizens: free movement — a national ID card is enough.' },
      { who: SCHENGEN_FREE, status: 'free', days: 90, note: SCHENGEN_NOTE }
    ],
    fallback: 'required',
    fallbackNote: 'A Schengen short-stay visa (type C) is needed — apply at the consulate of your main destination, allow ~15 days.'
  },
  {
    dests: ['United Kingdom'],
    official: 'https://www.gov.uk/check-uk-visa',
    rules: [
      { who: ['Ireland'], status: 'free', note: 'Common Travel Area — no visa or ETA needed.' },
      { who: UK_ETA, status: 'eta', etaName: 'UK ETA', note: '£20, valid 2 years, multiple entries up to 6 months each. Apply on GOV.UK or the UK ETA app before travel — carriers check it at boarding.' },
      { who: UK_VISA, status: 'required', note: 'Standard Visitor visa (~£135, up to 6 months) — apply on GOV.UK well in advance.' }
    ],
    fallback: 'check'
  },
  {
    dests: ['Ireland'],
    official: 'https://www.irishimmigration.ie',
    rules: [
      { who: [...EU27, ...EFTA], status: 'free', note: 'EU/EEA/Swiss free movement.' },
      { who: ['United Kingdom'], status: 'free', note: 'Common Travel Area — no passport control on the land border.' },
      { who: ['United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Brunei', 'Hong Kong', 'Taiwan', 'Israel', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Uruguay', 'South Africa'], status: 'free', days: 90 }
    ],
    fallback: 'required',
    fallbackNote: 'Chinese and Indian passport holders may use the British–Irish Visa Scheme (BIVS) with an endorsed UK visa.'
  },
  {
    dests: ['United States'],
    official: 'https://travel.state.gov/content/travel/en/us-visas.html',
    rules: [
      { who: ['Canada'], status: 'free', note: 'Canadian citizens generally need no visa for tourism.' },
      { who: VWP, status: 'eta', days: 90, etaName: 'ESTA', note: 'Apply at least 72h before flying (esta.cbp.dhs.gov, ~$40). An approved ESTA is mandatory at boarding.' }
    ],
    fallback: 'required',
    fallbackNote: 'B1/B2 visitor visa from a US embassy or consulate — book the interview early, waits can run months.'
  },
  {
    dests: ['Canada'],
    official: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html',
    rules: [
      { who: ['United States'], status: 'free', note: 'US citizens need neither visa nor eTA.' },
      { who: CA_ETA, status: 'eta', etaName: 'Canada eTA', note: 'CAD 7 online, usually approved in minutes — mandatory for air arrivals.' }
    ],
    fallback: 'required',
    fallbackNote: 'Visitor visa (TRV) via IRCC. Some passports qualify for eTA if they held a Canadian visa in the last 10 years or hold a valid US visa — check the IRCC tool.'
  },
  {
    dests: ['Australia'],
    official: 'https://immi.homeaffairs.gov.au',
    rules: [
      { who: ['New Zealand'], status: 'voa', note: 'Special Category Visa (444) granted on arrival.' },
      { who: AU_EVISITOR, status: 'evisa', days: 90, etaName: 'eVisitor 651', note: 'Free, apply online via ImmiAccount — usually granted within a day. Must be arranged BEFORE departure.' },
      { who: AU_ETA, status: 'eta', days: 90, etaName: 'Australia ETA 601', note: 'AUD 20 service charge via the official Australian ETA app — must be arranged BEFORE departure.' }
    ],
    fallback: 'required',
    fallbackNote: 'Visitor visa (subclass 600, ~AUD 210+) via ImmiAccount before travel — no visa on arrival exists.'
  },
  {
    dests: ['New Zealand'],
    official: 'https://www.immigration.govt.nz',
    rules: [
      { who: ['Australia'], status: 'free', note: 'Australian citizens are granted a resident visa on arrival.' },
      { who: NZ_WAIVER, status: 'eta', days: 90, etaName: 'NZeTA', note: 'NZeTA + IVL tourist levy before flying (official INZ app or site).' }
    ],
    fallback: 'required',
    fallbackNote: 'Visitor visa via Immigration New Zealand before travel.'
  },
  {
    dests: ['Japan'],
    official: 'https://www.mofa.go.jp/j_info/visit/visa/index.html',
    rules: [
      { who: JP_FREE, status: 'free', days: 90, note: 'Visa exemption on the MOFA list (15–90 days depending on passport). Keep proof of onward travel handy.' }
    ],
    fallback: 'required',
    fallbackNote: 'Temporary Visitor visa via a Japanese embassy/consulate — Chinese residents apply through designated agencies (eVISA available); Indian residents can use eVISA.'
  },
  {
    dests: ['South Korea'],
    official: 'https://www.k-eta.go.kr',
    rules: [
      { who: KR_FREE, status: 'free', days: 90, etaName: 'K-ETA', note: 'Visa-free; K-ETA normally required online, but waived through 31 Dec 2026 for 22 passports (US, CA, JP, TW, HK, SG, MO, AU, NZ and 13 European ones). Some passports get 30 days.' }
    ],
    fallback: 'required',
    fallbackNote: 'Tourist visa (C-3) via a Korean embassy/consulate. Jeju island allows 30 days visa-free for many passports on direct arrival.'
  },
  {
    dests: ['China'],
    official: 'https://en.nia.gov.cn',
    rules: [
      { who: CN_FREE, status: 'free', days: 30, note: 'Unilateral/bilateral visa-free, 30 days. The unilateral policy is announced through 31 Dec 2026 — reconfirm at en.nia.gov.cn before booking.' },
      { who: CN_FREE_TRIAL, status: 'free', days: 30, note: 'Time-limited unilateral trial (30 days) — verify it is still in force at en.nia.gov.cn.' }
    ],
    fallback: 'required',
    fallbackNote: 'L tourist visa via a Chinese embassy/consulate or visa centre. 240-hour transit visa-free exists for 50+ passports when transiting to a third country.'
  },
  {
    dests: ['Hong Kong'],
    official: 'https://www.immd.gov.hk',
    rules: [
      { who: ['India'], status: 'eta', days: 14, etaName: 'Pre-Arrival Registration (PAR)', note: 'Free online PAR before travel.' },
      { who: ['China'], status: 'check', note: 'Mainland residents need an Exit-Entry Permit with a Hong Kong endorsement.' },
      { who: 'ALL', status: 'free', days: 90, note: 'Most passports get 7–180 days visa-free (US/EU 90, UK 180, ASEAN 14–30).' }
    ],
    fallback: 'free'
  },
  {
    dests: ['Taiwan'],
    official: 'https://www.boca.gov.tw',
    rules: [
      { who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Israel'], status: 'free', days: 90 },
      { who: ['Thailand', 'Philippines', 'Brunei'], status: 'free', days: 14, note: 'Trial visa-free programme — reconfirm it has been extended before travel.' },
      { who: ['China'], status: 'check', note: 'Mainland Chinese travellers need a Taiwan Entry Permit — rules change with cross-strait policy.' }
    ],
    fallback: 'evisa',
    fallbackNote: 'e-Visa via BOCA or a visa at a Taipei representative office.'
  },
  {
    dests: ['Thailand'],
    official: 'https://www.thaievisa.go.th',
    rules: [
      { who: TH_BIL90, status: 'free', days: 90, note: 'Bilateral exemption agreement.' },
      { who: TH_BIL30, status: 'free', days: 30, note: 'Bilateral exemption agreement.' },
      { who: TH_30, status: 'free', days: 30, note: 'Since 15 Sep 2026: 30-day exemption (was 60). Land-border entries capped at 2 per year; TDAC arrival card online within 72h before flying.' },
      { who: ['Mauritius', 'Seychelles'], status: 'free', days: 15 },
      { who: TH_VOA, status: 'voa', days: 15, note: 'Visa on arrival now only for Azerbaijan, Belarus and Serbia.' }
    ],
    fallback: 'required',
    fallbackNote: 'Tourist visa via thaievisa.go.th or a Thai embassy/consulate before travel.'
  },
  {
    dests: ['Singapore'],
    official: 'https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements',
    rules: [
      { who: SG_VISA, status: 'required', note: 'Assessment Level I/II passport — apply for a visa via ICA or a local contact before travel.' },
      { who: 'ALL', status: 'free', days: 30, note: 'Most passports get 30 days (90 for some, incl. EU). Fill in the SG Arrival Card within 3 days before arrival.' }
    ],
    fallback: 'free'
  },
  {
    dests: ['Malaysia'],
    official: 'https://www.imi.gov.my',
    rules: [
      { who: MY_FREE90, status: 'free', days: 90 },
      { who: [...ASEAN, 'Hong Kong', 'Taiwan', 'Kazakhstan', 'Uzbekistan'], status: 'free', days: 30 },
      { who: ['China', 'India'], status: 'free', days: 30, note: 'Visa-free arrangement announced through Dec 2026 — reconfirm on imi.gov.my. MDAC arrival card required online.' }
    ],
    fallback: 'required'
  },
  {
    dests: ['Indonesia'],
    official: 'https://evisa.imigrasi.go.id',
    rules: [
      { who: ASEAN.filter((c) => c !== 'Indonesia'), status: 'free', days: 30, note: 'ASEAN exemption, non-extendable.' },
      { who: ID_VOA, status: 'voa', days: 30, note: 'VOA at the airport (IDR 500k) or e-VOA online before departure; extendable once 30 days.' }
    ],
    fallback: 'required'
  },
  {
    dests: ['Vietnam'],
    official: 'https://evisa.gov.vn',
    rules: [
      { who: VN_FREE45, status: 'free', days: 45 },
      { who: ASEAN.filter((c) => c !== 'Vietnam'), status: 'free', days: 30 }
    ],
    fallback: 'evisa',
    fallbackNote: 'e-Visa open to all nationalities — 90 days, single or multiple entry, via evisa.gov.vn.'
  },
  {
    dests: ['Philippines'],
    official: 'https://evisa.gov.ph',
    rules: [
      { who: PH_FREE, status: 'free', days: 30 },
      { who: ['India', 'China'], status: 'required', note: 'Visa required — unless holding a valid US/JP/AU/CA/Schengen/UK visa or residence (AJACS), which grants a short visa-free stay.' }
    ],
    fallback: 'check'
  },
  {
    dests: ['Cambodia'],
    official: 'https://www.evisa.gov.kh',
    rules: [{ who: ASEAN.filter((c) => c !== 'Cambodia'), status: 'free', days: 14 }],
    fallback: 'voa',
    fallbackNote: 'Visa on arrival (US$30) or e-Visa (US$36) — open to most passports.'
  },
  {
    dests: ['Laos'],
    official: 'https://laoevisa.gov.la',
    rules: [
      { who: ASEAN.filter((c) => c !== 'Laos'), status: 'free', days: 30 },
      { who: ['Russia'], status: 'free', days: 30 }
    ],
    fallback: 'voa',
    fallbackNote: 'Visa on arrival (~US$42) or e-Visa before travel.'
  },
  {
    dests: ['Myanmar'],
    official: 'https://evisa.moip.gov.mm',
    rules: [{ who: ['Singapore', 'Vietnam', 'Thailand', 'Indonesia', 'Philippines', 'Brunei', 'Cambodia', 'Laos'], status: 'free', days: 14 }],
    fallback: 'evisa',
    fallbackNote: 'Tourist e-Visa (28 days) online before travel.'
  },
  {
    dests: ['India'],
    official: 'https://indianvisaonline.gov.in/evisa/tvoa.html',
    rules: [
      { who: ['Bhutan', 'Nepal'], status: 'free', note: 'Free movement — a national ID is enough.' },
      { who: ['China', 'Pakistan'], status: 'required', note: 'Regular visa via an Indian mission — not eligible for the e-Visa.' }
    ],
    fallback: 'evisa',
    fallbackNote: 'e-Tourist Visa (30 days) online for ~170 passports — apply at least 4 days before travel.'
  },
  {
    dests: ['Sri Lanka'],
    official: 'https://www.eta.gov.lk',
    rules: [{ who: ['Singapore', 'Maldives', 'Seychelles'], status: 'free', days: 30 }],
    fallback: 'eta',
    fallbackNote: 'ETA online (eta.gov.lk) before departure.'
  },
  {
    dests: ['Nepal'],
    official: 'https://www.immigration.gov.np',
    rules: [{ who: ['India'], status: 'free', note: 'Open border — Indian citizens need no visa.' }],
    fallback: 'voa',
    fallbackNote: 'Visa on arrival at Kathmandu and land borders (free for SAARC first visit in a year; free fee for Chinese passports).'
  },
  {
    dests: ['Maldives'],
    official: 'https://immigration.gov.mv',
    rules: [{ who: 'ALL', status: 'free', days: 30, note: 'Free 30-day tourist visa on arrival for every nationality; hotel booking + IMUGA traveller declaration required.' }],
    fallback: 'free'
  },
  {
    dests: ['United Arab Emirates'],
    official: 'https://u.ae/en/information-and-services/visa-and-emirates-id',
    rules: [
      { who: GCC.filter((c) => c !== 'United Arab Emirates'), status: 'free', note: 'GCC citizens: free movement with a national ID.' },
      { who: AE_VOA90, status: 'voa', days: 90 },
      { who: AE_VOA30, status: 'voa', days: 30 },
      { who: ['India'], status: 'voa', days: 14, note: 'VOA only with a valid US/UK/EU visa or residence; otherwise arrange a visa before travel.' }
    ],
    fallback: 'required',
    fallbackNote: 'Pre-arranged tourist visa via a UAE airline, hotel or sponsor.'
  },
  {
    dests: ['Qatar'],
    official: 'https://www.moi.gov.qa',
    rules: [
      { who: GCC.filter((c) => c !== 'Qatar'), status: 'free' },
      { who: 'ALL', status: 'voa', days: 30, note: 'Visa-free entry on arrival for ~100 passports (30 or 90 days depending on passport); hotel booking via Discover Qatar may apply.' }
    ],
    fallback: 'voa'
  },
  {
    dests: ['Saudi Arabia'],
    official: 'https://visa.visitsaudi.com',
    rules: [
      { who: GCC.filter((c) => c !== 'Saudi Arabia'), status: 'free' },
      { who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'China', 'India', 'Malaysia', 'Thailand', 'Russia', 'Turkey', 'South Africa', 'Brazil', 'Argentina', 'Chile', 'Mexico', 'Kazakhstan', 'Uzbekistan'], status: 'evisa', note: 'Tourist e-Visa (1 year, multiple entry, 90 days) online; VOA also exists for holders of valid US/UK/Schengen visas.' }
    ],
    fallback: 'required'
  },
  {
    dests: ['Bahrain'],
    official: 'https://www.evisa.gov.bh',
    rules: [{ who: GCC.filter((c) => c !== 'Bahrain'), status: 'free' }],
    fallback: 'voa',
    fallbackNote: 'VOA or eVisa for ~70 passports — check eligibility on evisa.gov.bh.'
  },
  {
    dests: ['Oman'],
    official: 'https://evisa.rop.gov.om',
    rules: [
      { who: GCC.filter((c) => c !== 'Oman'), status: 'free' },
      { who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'China', 'India', 'Russia', 'Malaysia', 'Thailand', 'Brazil', 'Argentina', 'Turkey'], status: 'free', days: 14, note: '14-day visa-free entry (confirmed hotel, insurance and onward ticket required); e-Visa for longer stays.' }
    ],
    fallback: 'evisa'
  },
  {
    dests: ['Kuwait'],
    official: 'https://evisa.moi.gov.kw',
    rules: [
      { who: GCC.filter((c) => c !== 'Kuwait'), status: 'free' },
      { who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia'], status: 'evisa', note: 'e-Visa or visa on arrival, 90 days.' }
    ],
    fallback: 'required'
  },
  {
    dests: ['Israel'],
    official: 'https://israel-entry.piba.gov.il',
    rules: [{ who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Brazil', 'Argentina', 'Chile', 'Mexico', 'Russia', 'Ukraine', 'Georgia'], status: 'eta', days: 90, etaName: 'ETA-IL', note: 'ETA-IL online authorisation mandatory before travel since 2025.' }],
    fallback: 'required'
  },
  {
    dests: ['Jordan'],
    official: 'https://moi.gov.jo',
    rules: [{ who: [...GCC, 'Egypt', 'Lebanon'], status: 'free', days: 30 }],
    fallback: 'voa',
    fallbackNote: 'Visa on arrival (JOD 40) for most passports — waived with a pre-bought Jordan Pass. Some passports (e.g. Indian) should arrange in advance.'
  },
  {
    dests: ['Turkey'],
    official: 'https://www.evisa.gov.tr',
    rules: [
      { who: TR_FREE, status: 'free', days: 90, note: 'Visa-free (30–90 days depending on passport).' },
      { who: ['China', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Afghanistan'], status: 'evisa', note: 'Conditional e-Visa — only with a valid US/UK/Schengen/Ireland visa or residence; otherwise a sticker visa at a Turkish mission.' }
    ],
    fallback: 'check'
  },
  {
    dests: ['Egypt'],
    official: 'https://visa2egypt.gov.eg',
    rules: [
      { who: [...GCC, 'Malaysia', 'Hong Kong'], status: 'free', days: 90 },
      { who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Russia', 'Ukraine', 'Georgia'], status: 'voa', days: 30, note: 'Visa on arrival (US$25) or e-Visa online before travel.' }
    ],
    fallback: 'required'
  },
  {
    dests: ['Morocco'],
    official: 'https://www.acces-maroc.ma',
    rules: [{ who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'China', 'Russia', 'United Arab Emirates', 'Qatar', 'Saudi Arabia', 'Turkey', 'Brazil', 'Argentina', 'Chile', 'Mexico', 'Peru', 'Hong Kong'], status: 'free', days: 90 }],
    fallback: 'check',
    fallbackNote: 'Some passports can use the Moroccan e-Visa — check acces-maroc.ma.'
  },
  {
    dests: ['Tunisia'],
    official: 'https://www.diplomatie.gov.tn',
    rules: [{ who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Japan', 'South Korea', 'Malaysia', 'Russia', 'Turkey', 'Brazil', 'Argentina'], status: 'free', days: 90 }],
    fallback: 'check'
  },
  {
    dests: ['Kenya'],
    official: 'https://www.etakenya.go.ke',
    rules: [{ who: 'ALL', status: 'eta', days: 90, etaName: 'Kenya eTA', note: 'Kenya is “visa-free” but the eTA is MANDATORY for every visitor — apply online before travel.' }],
    fallback: 'eta'
  },
  {
    dests: ['Tanzania'],
    official: 'https://visa.immigration.go.tz',
    rules: [{ who: ['Kenya', 'Uganda', 'Rwanda', 'Burundi', 'South Africa', 'Zimbabwe', 'Zambia', 'Namibia', 'Botswana', 'Malaysia', 'Singapore', 'Hong Kong'], status: 'free', days: 90 }],
    fallback: 'voa',
    fallbackNote: 'Visa on arrival (US$50) or e-Visa online.'
  },
  {
    dests: ['South Africa'],
    official: 'https://www.dha.gov.za',
    rules: [
      { who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Brazil', 'Argentina', 'Chile', 'Paraguay', 'Uruguay', 'Russia', 'Malaysia', 'Thailand', 'Hong Kong'], status: 'free', days: 90 },
      { who: ['China', 'India'], status: 'evisa', note: 'e-Visa online via the Department of Home Affairs.' }
    ],
    fallback: 'required'
  },
  {
    dests: ['Russia'],
    official: 'https://evisa.kdmid.ru',
    rules: [
      { who: RU_FREE, status: 'free', days: 90, note: 'Bilateral/CIS visa-free (30–90 days depending on passport).' },
      { who: RU_EVISA, status: 'evisa', days: 16, note: 'Unified e-Visa (~US$50, 16 days, single entry) via evisa.kdmid.ru.' }
    ],
    fallback: 'required',
    fallbackNote: 'Tourist visa with invitation/voucher via a Russian consulate — US/UK/CA/AU/NZ passports are not eligible for the e-Visa.'
  },
  {
    dests: ['Kazakhstan'],
    official: 'https://www.mfa.gov.kz',
    rules: [{ who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'United Arab Emirates', 'Qatar', 'China', 'Russia', 'Turkey', 'Argentina', 'Brazil', 'Chile', 'Mexico', 'Uzbekistan', 'Kyrgyzstan'], status: 'free', days: 30 }],
    fallback: 'evisa'
  },
  {
    dests: ['Uzbekistan'],
    official: 'https://e-visa.gov.uz',
    rules: [{ who: [...EEA_UK_MICRO, 'Russia', 'China', 'Japan', 'South Korea', 'United Arab Emirates', 'Kazakhstan', 'Kyrgyzstan', 'Turkey', 'Malaysia', 'Singapore', 'Israel'], status: 'free', days: 30 }],
    fallback: 'evisa',
    fallbackNote: 'e-Visa (US$20) via e-visa.gov.uz.'
  },
  {
    dests: ['Georgia'],
    official: 'https://www.evisa.gov.ge',
    rules: [
      { who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Israel', 'Russia', 'Kazakhstan', 'Uzbekistan', 'Turkey', 'United Arab Emirates', 'Qatar', 'Saudi Arabia', 'Brazil', 'Argentina', 'Chile', 'Mexico', 'Thailand', 'Malaysia'], status: 'free', days: 365 },
      { who: ['China'], status: 'free', days: 30, note: 'Mutual 30-day visa exemption.' }
    ],
    fallback: 'evisa'
  },
  {
    dests: ['Armenia'],
    official: 'https://www.mfa.am/en/visa/',
    rules: [{ who: [...EEA_UK_MICRO, 'Russia', 'China', 'Georgia', 'Kazakhstan', 'Uzbekistan', 'Qatar', 'United Arab Emirates', 'Singapore'], status: 'free', days: 180 }],
    fallback: 'voa',
    fallbackNote: 'e-Visa or visa on arrival for most passports.'
  },
  {
    dests: ['Azerbaijan'],
    official: 'https://evisa.gov.az',
    rules: [{ who: ['Belarus', 'Georgia', 'Kazakhstan', 'Kyrgyzstan', 'Moldova', 'Russia', 'Tajikistan', 'Uzbekistan', 'Ukraine'], status: 'free', days: 90 }],
    fallback: 'evisa',
    fallbackNote: 'ASAN e-Visa (US$20) online, issued within 3 working days.'
  },
  {
    dests: ['Brazil'],
    official: 'https://www.gov.br/mre/en',
    rules: [
      { who: MERCOSUR, status: 'free', days: 90, note: 'South American neighbours can enter with a national ID card.' },
      { who: BR_FREE, status: 'free', days: 90 },
      { who: ['United States', 'Canada', 'Australia'], status: 'evisa', days: 90, note: 'e-Visa mandatory since 10 Apr 2025 (~US$81) — apply online before travel.' }
    ],
    fallback: 'required',
    fallbackNote: 'Visitor visa via a Brazilian consulate (China: 10-year visa agreement applies).'
  },
  {
    dests: ['Argentina'],
    official: 'https://www.migraciones.gov.ar',
    rules: [
      { who: MERCOSUR, status: 'free', days: 90, note: 'Mercosur — national ID card accepted.' },
      { who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Hong Kong', 'Israel', 'Russia', 'Turkey', 'South Africa', 'Mexico'], status: 'free', days: 90 }
    ],
    fallback: 'required',
    fallbackNote: 'AVE electronic authorisation available for holders of a valid US B2 or Schengen visa; otherwise a consular visa.'
  },
  {
    dests: ['Chile'],
    official: 'https://serviciomigraciones.cl',
    rules: [
      { who: MERCOSUR, status: 'free', days: 90, note: 'National ID card accepted.' },
      { who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Hong Kong', 'Israel', 'Mexico', 'Peru', 'Colombia', 'Uruguay'], status: 'free', days: 90 }
    ],
    fallback: 'required',
    fallbackNote: 'Chinese and Indian passports: visa-free with a valid US visa (6+ months); otherwise a consular visa.'
  },
  {
    dests: ['Peru'],
    official: 'https://www.migraciones.gob.pe',
    rules: [{ who: [...EEA_UK_MICRO, ...MERCOSUR, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines', 'Russia', 'Mexico'], status: 'free', days: 90 }],
    fallback: 'required',
    fallbackNote: 'Chinese and Indian passports: visa-free with a valid US/CA/UK/AU/Schengen visa or residence (6+ months); otherwise a consular visa.'
  },
  {
    dests: ['Colombia'],
    official: 'https://www.cancilleria.gov.co/tramites_servicios/visa',
    rules: [{ who: [...EEA_UK_MICRO, ...MERCOSUR, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Mexico', 'Russia'], status: 'free', days: 90 }],
    fallback: 'required',
    fallbackNote: 'Chinese and Indian passports: visa-free with a valid US or Schengen visa/residence; otherwise an e-Visa via Cancillería.'
  },
  {
    dests: ['Mexico'],
    official: 'https://www.inm.gob.mx',
    rules: [{ who: MX_FREE, status: 'free', days: 180, note: 'Up to 180 days; FMM tourist form on arrival.' }],
    fallback: 'required',
    fallbackNote: 'Visa-free entry with a valid US/CA/JP/UK/Schengen visa or permanent residence; otherwise a consular visa.'
  },
  {
    dests: ['Cuba'],
    official: 'https://evisacuba.cu',
    rules: [],
    fallback: 'evisa',
    fallbackNote: 'Tourist e-Visa / tourist card required for nearly all passports — buy online or via the airline.'
  },
  {
    dests: ['Costa Rica'],
    official: 'https://www.migracion.go.cr',
    rules: [{ who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Japan', 'South Korea', 'Singapore', 'Argentina', 'Chile', 'Mexico', 'Panama', 'Brazil'], status: 'free', days: 90 }],
    fallback: 'check',
    fallbackNote: 'Many passports enter visa-free with a valid US/Schengen visa or residence.'
  },
  {
    dests: ['Panama'],
    official: 'https://www.migracion.gob.pa',
    rules: [{ who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Argentina', 'Chile', 'Brazil', 'Mexico'], status: 'free', days: 90 }],
    fallback: 'check'
  },
  {
    dests: ['Fiji'],
    official: 'https://www.immigration.gov.fj',
    rules: [{ who: [...EEA_UK_MICRO, 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'China', 'India', 'Thailand'], status: 'free', days: 120 }],
    fallback: 'voa'
  },
  {
    dests: ['Bhutan'],
    official: 'https://www.mfa.gov.bt',
    rules: [
      { who: ['India'], status: 'free', note: 'Free movement — a passport or voter ID is enough, but the daily Sustainable Development Fee still applies.' },
      { who: ['Bangladesh', 'Maldives'], status: 'voa', days: 14 }
    ],
    fallback: 'required',
    fallbackNote: 'Visa arranged through a licensed Bhutanese tour operator plus the daily SDF (US$100).'
  },
  {
    dests: ['Cyprus'],
    official: 'https://www.mfa.gov.cy',
    rules: [
      { who: [...EU27, ...EFTA], status: 'free', note: 'EU free movement (Cyprus is not yet in Schengen).' },
      { who: ['United Kingdom', 'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Israel', 'United Arab Emirates', 'Russia'], status: 'free', days: 90 }
    ],
    fallback: 'check',
    fallbackNote: 'Cyprus applies its own national visa policy — a Schengen visa is NOT valid here.'
  }
];

/* ── Nationality normalisation ───────────────────────────────────────────── */

const NORM = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const NAT_ALIASES: Record<string, string> = {
  us: 'United States', usa: 'United States', 'u s': 'United States', 'u s a': 'United States',
  american: 'United States', 'united states': 'United States', 'united states of america': 'United States',
  uk: 'United Kingdom', british: 'United Kingdom', britain: 'United Kingdom', 'great britain': 'United Kingdom',
  england: 'United Kingdom', scottish: 'United Kingdom', welsh: 'United Kingdom', english: 'United Kingdom',
  german: 'Germany', french: 'France', spanish: 'Spain', italian: 'Italy', dutch: 'Netherlands',
  swiss: 'Switzerland', swedish: 'Sweden', polish: 'Poland', portuguese: 'Portugal', austrian: 'Austria',
  belgian: 'Belgium', danish: 'Denmark', finnish: 'Finland', greek: 'Greece', hungarian: 'Hungary',
  norwegian: 'Norway', romanian: 'Romania', bulgarian: 'Bulgaria', croatian: 'Croatia', czech: 'Czechia',
  slovak: 'Slovakia', slovenian: 'Slovenia', estonian: 'Estonia', latvian: 'Latvia', lithuanian: 'Lithuania',
  luxembourgish: 'Luxembourg', luxembourger: 'Luxembourg', maltese: 'Malta', cypriot: 'Cyprus',
  icelandic: 'Iceland', irish: 'Ireland', ukrainian: 'Ukraine', serbian: 'Serbia', albanian: 'Albania',
  georgian: 'Georgia', armenian: 'Armenia', azerbaijani: 'Azerbaijan', kazakh: 'Kazakhstan',
  kazakhstani: 'Kazakhstan', uzbek: 'Uzbekistan', russian: 'Russia', turkish: 'Turkey', turk: 'Turkey',
  chinese: 'China', indian: 'India', indonesian: 'Indonesia', thai: 'Thailand', vietnamese: 'Vietnam',
  filipino: 'Philippines', filipina: 'Philippines', malaysian: 'Malaysia', singaporean: 'Singapore',
  japanese: 'Japan', korean: 'South Korea', 'south korean': 'South Korea', brazilian: 'Brazil',
  argentinian: 'Argentina', argentine: 'Argentina', chilean: 'Chile', mexican: 'Mexico',
  peruvian: 'Peru', colombian: 'Colombia', canadian: 'Canada', australian: 'Australia', aussie: 'Australia',
  kiwi: 'New Zealand', 'new zealander': 'New Zealand', emirati: 'United Arab Emirates', saudi: 'Saudi Arabia',
  'saudi arabian': 'Saudi Arabia', qatari: 'Qatar', israeli: 'Israel', egyptian: 'Egypt',
  moroccan: 'Morocco', kenyan: 'Kenya', tanzanian: 'Tanzania', 'south african': 'South Africa',
  nigerian: 'Nigeria', nepali: 'Nepal', nepalese: 'Nepal', bhutanese: 'Bhutan', 'sri lankan': 'Sri Lanka',
  maldivian: 'Maldives', cambodian: 'Cambodia', khmer: 'Cambodia', lao: 'Laos', laotian: 'Laos',
  burmese: 'Myanmar', mongolian: 'Mongolia', 'hong kong': 'Hong Kong', hongkonger: 'Hong Kong',
  'hong konger': 'Hong Kong', taiwanese: 'Taiwan', pakistani: 'Pakistan', bangladeshi: 'Bangladesh',
  afghan: 'Afghanistan', iranian: 'Iran', iraqi: 'Iraq', jordanian: 'Jordan', lebanese: 'Lebanon',
  kuwaiti: 'Kuwait', bahraini: 'Bahrain', omani: 'Oman', yemeni: 'Yemen', syrian: 'Syria',
  tunisian: 'Tunisia', algerian: 'Algeria', libyan: 'Libya', sudanese: 'Sudan', ethiopian: 'Ethiopia',
  ghanaian: 'Ghana', ugandan: 'Uganda', rwandan: 'Rwanda', senegalese: 'Senegal', cuban: 'Cuba',
  jamaican: 'Jamaica', dominican: 'Dominican Republic', 'costa rican': 'Costa Rica', panamanian: 'Panama',
  guatemalan: 'Guatemala', ecuadorian: 'Ecuador', bolivian: 'Bolivia', paraguayan: 'Paraguay',
  uruguayan: 'Uruguay', venezuelan: 'Venezuela', fijian: 'Fiji'
};

/** Canonical destination-name aliases (how users type it → COUNTRY_INFO name). */
const DEST_ALIASES: Record<string, string> = {
  usa: 'United States', us: 'United States', america: 'United States',
  uk: 'United Kingdom', britain: 'United Kingdom', england: 'United Kingdom',
  'south korea': 'South Korea', korea: 'South Korea', 'czech republic': 'Czechia',
  uae: 'United Arab Emirates', 'hong kong': 'Hong Kong', 'hong kong sar': 'Hong Kong'
};

/* ── Lookup ──────────────────────────────────────────────────────────────── */

let infoNames: string[] = [];
/** Wire in the full COUNTRY_INFO name list so any of the 197 countries resolves. */
export function registerVisaCountryNames(names: string[]) {
  infoNames = names;
}

export function natCountry(raw: string): string | null {
  const n = NORM(raw || '');
  if (!n) return null;
  if (NAT_ALIASES[n]) return NAT_ALIASES[n];
  const hit = infoNames.find((c) => NORM(c) === n);
  return hit || null;
}

export function destCountry(raw: string): string | null {
  const n = NORM(raw || '');
  if (!n) return null;
  if (DEST_ALIASES[n]) return DEST_ALIASES[n];
  // exact or contained match against registered country names
  const exact = infoNames.find((c) => NORM(c) === n);
  if (exact) return exact;
  const contained = infoNames.find((c) => {
    const cn = NORM(c);
    return n.includes(cn) || cn.includes(n);
  });
  if (contained) return contained;
  return null;
}

const has = (list: string[], country: string) => list.some((c) => NORM(c) === NORM(country));

/* Knowledge-base fallback, injected by countryInfo (which owns the per-country
   regime data): lets less-well-known destinations still get a concrete
   verdict instead of a bare "check the official source". */
type VisaKbFallback = (nat: string | null, dest: string) => VisaVerdict | null;
let visaKbFallback: VisaKbFallback | null = null;
export const registerVisaKbFallback = (fn: VisaKbFallback): void => {
  visaKbFallback = fn;
};

export function visaRuleFor(nationality: string, destinationText: string): VisaVerdict {
  const nat = natCountry(nationality);
  const dest = destCountry(destinationText);

  const toneOf = (s: VisaStatus): VisaVerdict['tone'] =>
    s === 'home' || s === 'free' ? 'free'
    : s === 'eta' || s === 'evisa' || s === 'voa' ? 'online'
    : s === 'required' ? 'embassy'
    : 'check';

  if (nat && dest && NORM(nat) === NORM(dest)) {
    return { status: 'home', tone: 'free', destName: dest, official: null };
  }

  const rule = dest ? DEST_RULES.find((r) => r.dests.some((d) => NORM(d) === NORM(dest))) : null;

  if (rule && nat) {
    for (const r of rule.rules) {
      if (r.who === 'ALL' || has(r.who, nat)) {
        return {
          status: r.status,
          tone: toneOf(r.status),
          days: r.days,
          etaName: r.etaName,
          note: r.note,
          destName: dest!,
          official: rule.official
        };
      }
    }
    return {
      status: rule.fallback,
      tone: toneOf(rule.fallback),
      note: rule.fallbackNote,
      destName: dest!,
      official: rule.official
    };
  }

  // No encoded pair rule — ask the country knowledge base first: it carries a
  // visa regime for EVERY country, so tiny or less-well-known destinations
  // still get a concrete verdict (never a bare "check" when we actually know
  // the regime). Only truly unknown countries fall through to 'check'.
  if (visaKbFallback && dest) {
    const kb = visaKbFallback(nat, dest);
    if (kb) return kb;
  }

  // Unknown destination — honest answer, never a guess
  return {
    status: 'check',
    tone: 'check',
    destName: dest || destinationText.trim(),
    official: null
  };
}

/** Full advisory passage for the guide popup — passport-specific, with the
 *  official source always named. */
export function visaPassage(verdict: VisaVerdict, nat: string): string {
  const n = (nat || 'your').trim();
  const d = verdict.destName;
  const confirm = verdict.official
    ? ` Confirm on the official ${d} government visa page before booking — rules change without notice.`
    : ` Check the official ${d} government or consulate page before booking — rules change without notice.`;
  switch (verdict.status) {
    case 'home':
      return `${d} is your home country — no visa or border formalities apply. Carry your national ID or passport for flights and hotel check-ins.`;
    case 'free':
      return `Good news: a ${n} passport gets visa-free entry to ${d}${verdict.days ? ` for up to ${verdict.days} days` : ''}.${verdict.note ? ` ${verdict.note}.` : ''} Carry a passport valid for at least 6 months plus proof of onward travel and accommodation.${confirm}`;
    case 'eta':
      return `No visa needed for a ${n} passport, but ${d} requires the ${verdict.etaName || 'online travel authorisation'} BEFORE departure${verdict.days ? ` — then you can stay up to ${verdict.days} days` : ''}.${verdict.note ? ` ${verdict.note}.` : ''}${confirm}`;
    case 'evisa':
      return `A ${n} passport needs an e-Visa for ${d} — apply online well before departure${verdict.days ? `; it allows up to ${verdict.days} days` : ''}.${verdict.note ? ` ${verdict.note}.` : ''}${confirm}`;
    case 'voa':
      return `A ${n} passport gets a visa on arrival in ${d}${verdict.days ? ` (up to ${verdict.days} days)` : ''} — applying online in advance (where offered) saves the queue.${verdict.note ? ` ${verdict.note}.` : ''}${confirm}`;
    case 'required':
      return `A ${n} passport needs a visa arranged BEFORE travelling to ${d} — apply through the official ${d} embassy/consulate or visa portal.${verdict.note ? ` ${verdict.note}.` : ''} Start early and don't rely on visa on arrival.${confirm}`;
    default:
      return `Entry rules for ${d} depend heavily on the exact passport, and we don't have a verified rule for a ${n} passport here — so we won't guess.${confirm}`;
  }
}
