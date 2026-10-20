// Country name → international dialling code.
// Used by the emergency-contact editor so users can type a country name
// (e.g. "Germany") and have the country code ("+49") filled in automatically.

export interface CountryDialCode {
  name: string;
  code: string;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { name: 'Argentina', code: '+54' },
  { name: 'Australia', code: '+61' },
  { name: 'Austria', code: '+43' },
  { name: 'Belgium', code: '+32' },
  { name: 'Brazil', code: '+55' },
  { name: 'Bulgaria', code: '+359' },
  { name: 'Cambodia', code: '+855' },
  { name: 'Canada', code: '+1' },
  { name: 'Chile', code: '+56' },
  { name: 'China', code: '+86' },
  { name: 'Colombia', code: '+57' },
  { name: 'Costa Rica', code: '+506' },
  { name: 'Croatia', code: '+385' },
  { name: 'Czech Republic', code: '+420' },
  { name: 'Denmark', code: '+45' },
  { name: 'Egypt', code: '+20' },
  { name: 'Estonia', code: '+372' },
  { name: 'Finland', code: '+358' },
  { name: 'France', code: '+33' },
  { name: 'Germany', code: '+49' },
  { name: 'Greece', code: '+30' },
  { name: 'Hong Kong', code: '+852' },
  { name: 'Hungary', code: '+36' },
  { name: 'Iceland', code: '+354' },
  { name: 'India', code: '+91' },
  { name: 'Indonesia', code: '+62' },
  { name: 'Ireland', code: '+353' },
  { name: 'Israel', code: '+972' },
  { name: 'Italy', code: '+39' },
  { name: 'Japan', code: '+81' },
  { name: 'Kenya', code: '+254' },
  { name: 'Laos', code: '+856' },
  { name: 'Latvia', code: '+371' },
  { name: 'Lithuania', code: '+370' },
  { name: 'Malaysia', code: '+60' },
  { name: 'Mexico', code: '+52' },
  { name: 'Morocco', code: '+212' },
  { name: 'Nepal', code: '+977' },
  { name: 'Netherlands', code: '+31' },
  { name: 'New Zealand', code: '+64' },
  { name: 'Norway', code: '+47' },
  { name: 'Peru', code: '+51' },
  { name: 'Philippines', code: '+63' },
  { name: 'Poland', code: '+48' },
  { name: 'Portugal', code: '+351' },
  { name: 'Romania', code: '+40' },
  { name: 'Singapore', code: '+65' },
  { name: 'Slovakia', code: '+421' },
  { name: 'Slovenia', code: '+386' },
  { name: 'South Africa', code: '+27' },
  { name: 'South Korea', code: '+82' },
  { name: 'Spain', code: '+34' },
  { name: 'Sri Lanka', code: '+94' },
  { name: 'Sweden', code: '+46' },
  { name: 'Switzerland', code: '+41' },
  { name: 'Taiwan', code: '+886' },
  { name: 'Thailand', code: '+66' },
  { name: 'Turkey', code: '+90' },
  { name: 'Ukraine', code: '+380' },
  { name: 'United Arab Emirates', code: '+971' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'United States', code: '+1' },
  { name: 'Vietnam', code: '+84' }
];

// Resolve free-typed text (country name or already a +code) to a dial code.
// Returns null when nothing matches so the raw value can be kept.
export function resolveDialCode(input: string): string | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  if (/^\+\d{1,4}$/.test(t)) return t;
  const exact = COUNTRY_DIAL_CODES.find((c) => c.name.toLowerCase() === t);
  if (exact) return exact.code;
  const partial = COUNTRY_DIAL_CODES.filter((c) => c.name.toLowerCase().startsWith(t));
  return partial.length === 1 ? partial[0].code : null;
}
