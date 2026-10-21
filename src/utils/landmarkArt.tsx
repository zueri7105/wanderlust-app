import React from 'react';

/**
 * Minimal line-art landmarks for passport stamps — one per famous city.
 * All drawn in a 24×24 viewBox with stroke="currentColor" so they take the
 * stamp's ink colour. Unknown cities fall back to a generic skyline.
 */

const P = (d: string, extra: React.SVGProps<SVGPathElement> = {}) => (
  <path d={d} fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...extra} />
);
const C = (cx: number, cy: number, r: number) => (
  <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={1.2} />
);

// Each art is a small fragment placed inside a <g transform> by the stamp.
const CITY_ART: Record<string, React.ReactNode> = {
  // ── Asia ──
  tokyo: <>{P('M12 3 L7 20 M12 3 L17 20 M8.5 14 H15.5 M10 9 H14 M5 20 H19 M12 3 V1.5')}</>,
  kyoto: <>{P('M5 6 H19 M5 6 C5 8 7 9 7 9 M19 6 C19 8 17 9 17 9')}{P('M7 9 V20 M17 9 V20 M4 20 H20')}{P('M5 5 H19', { strokeWidth: 1.8 })}</>, // torii gate
  osaka: <>{P('M6 20 V10 L12 6 L18 10 V20 M6 20 H18 M12 6 V4 M9 12 H15 M10 15 H14')}</>, // castle
  beijing: <>{P('M12 3 V5 M8 7 H16 M6.5 10 H17.5 M8 7 L6.5 10 M16 7 L17.5 10 M5 13.5 H19 M8.5 10 L5 13.5 M15.5 10 L19 13.5 M7 13.5 V20 M17 13.5 V20 M7 17 H17 M5 20 H19')}</>,
  shanghai: <>{C(12, 7, 2.2)}{C(12, 13, 3)}{P('M12 2 V4.8 M12 16 V21 M9.5 21 H14.5')}</>, // Oriental Pearl
  seoul: <>{P('M3 10 C7 6.5 17 6.5 21 10 M5.5 10 V20 M18.5 10 V20 M5.5 15 H18.5 M10 15 V20 H14 V15')}</>,
  bangkok: <>{P('M12 2 V4 M12 4 L10 8 H14 Z M9 8 L8 12 H16 L15 8 M8 12 L7 20 M16 12 L17 20 M5 20 H19 M10.5 16 H13.5')}</>,
  bali: <>{P('M5 20 V8 L9 5 M19 20 V8 L15 5 M9 5 V12 M15 5 V12 M9 12 H15 M4 20 H20')}</>, // split gate
  singapore: <>{P('M7 20 V9 M12 20 V9 M17 20 V9 M5 8 H19 C19 8 17 6 12 6 C7 6 5 8 5 8 Z')}</>, // Marina Bay Sands
  'hong kong': <>{P('M4 20 V11 H8 V20 M9 20 V7 H13 V20 M14 20 V13 H17 V20 M18 20 V9 H21 V20 M3 20 H21 M11 7 V4')}</>,
  taipei: <>{P('M12 3 L12 6 M9 8 H15 L14 10 H10 Z M8 12 H16 L15 14 H9 Z M7 16 H17 L16 20 H8 Z')}</>, // Taipei 101
  // ── Europe ──
  paris: <>{P('M7 20 L12 4 L17 20 M9 13 H15 M8.2 16.5 H15.8 M5.5 20 H18.5')}</>, // Eiffel Tower
  london: <>{P('M10 20 V7 M14 20 V7 M10 7 L12 3 L14 7 M10 20 H14')}{C(12, 9.5, 1.6)}</>, // Big Ben
  berlin: <>{P('M4 9 H20 M5 9 V18 M9 9 V18 M15 9 V18 M19 9 V18 M4 18 H20 M3 9 L12 5 L21 9 M12 2 V5')}</>, // Brandenburg Gate
  rome: <>{P('M5 20 V10 C5 7 8 5 12 5 C16 5 19 7 19 10 V20 M5 12 H19 M5 16 H19 M8 20 V12 M12 20 V12 M16 20 V12')}</>, // Colosseum
  barcelona: <>{P('M8 20 L8.6 8 L9.4 8 L10 20 M9 8 V5 M14 20 L14.6 6 L15.4 6 L16 20 M15 6 V3 M13 3 H17 M7 3 H11 M5 20 H19')}</>,
  madrid: <>{P('M4 20 V10 H20 V20 M4 10 H20 M6.5 20 V14 C6.5 12.5 8 12 9 12 C10 12 11.5 12.5 11.5 14 M12.5 20 V14 C12.5 12.5 14 12 15 12 C16 12 17.5 12.5 17.5 14 V20 M10 10 V7 H14 V10')}</>,
  seville: <>{P('M9 20 V8 H15 V20 M9 8 L10 5 H14 L15 8 M9 12 H15 M9 16 H15 M7 20 H17 M11 10 H13')}</>, // Giralda
  venice: <>{P('M7 16 V11 C7 8.5 9 7 12 7 C15 7 17 8.5 17 11 V16 M12 7 V4 M11 5 H13 M5 16 H19')}{P('M3 19.5 C6 18 9 21 12 19.5 C15 18 18 21 21 19.5')}</>,
  amalfi: <>{P('M4 20 V15 H9 V20 M9 15 V11 H14 V20 M14 11 V7 H19 V20 M3 20 H21')}{C(17, 5, 1.4)}</>,
  lisbon: <>{P('M8 20 V9 H16 V20 M8 9 V7 H10 V9 M12 9 V7 H14 V9 M10 13 H14 M10 16 H14 M6 20 H18 M12 7 V4')}</>,
  athens: <>{P('M4 9 H20 M4 9 L12 4.5 L20 9 M6 9 V17 M10 9 V17 M14 9 V17 M18 9 V17 M4 17 H20 M4 20 H20')}</>,
  istanbul: <>{P('M7 20 V12 C7 8.5 9.2 6.5 12 6.5 C14.8 6.5 17 8.5 17 12 V20 M7 20 H17 M12 6.5 V4 M4 20 L4.5 8 M3.5 8 H5.5 M4.2 8 L4 5 M20 20 L19.5 8 M18.5 8 H20.5 M19.8 8 L20 5')}</>,
  prague: <>{P('M6 20 V11 H10 V20 M6 11 L8 7 L10 11 M14 20 V9 H18 V20 M14 9 L16 4.5 L18 9 M4 20 H20 M10 15 H14')}</>,
  vienna: <>{P('M12 2 V5 M12 5 L8 12 H16 Z M8 12 L6 20 M16 12 L18 20 M4 20 H20 M9.5 15 H14.5')}</>,
  budapest: <>{P('M5 20 V12 H19 V20 M9 12 C9 8.5 10.3 7 12 7 C13.7 7 15 8.5 15 12 M12 7 V4 M5 20 H19 M7 15 H9 M15 15 H17')}</>,
  reykjavik: <>{P('M6 20 L12 5 L18 20 M9 20 V14 M15 20 V14 M12 20 V11 M4 20 H20')}</>, // Hallgrímskirkja
  santorini: <>{P('M5 20 V13 H13 V20 M5 13 C5 9.5 7 8 9 8 C11 8 13 9.5 13 13 M9 8 V5 M8 6 H10 M15 20 V12 H19 V20 M16 12 V10 H18 V12')}</>,
  // ── Americas ──
  'new york': <>{P('M4 20 V12 H8 V20 M9 20 V6 H13 V20 M11 6 V2 M14 20 V10 H18 V20 M19 20 V14 H21 V20 M3 20 H21')}</>,
  'san francisco': <>{P('M4 20 V12 M20 20 V12 M4 12 H20 M6 12 C6 8 18 8 18 12 M8 12 C8 9.5 16 9.5 16 12 M2 20 H22')}</>, // Golden Gate
  'mexico city': <>{P('M6 20 H18 M8 20 V15 H16 V20 M10 15 V11 H14 V15 M11 11 V8 H13 V11 M12 8 V5')}</>, // cathedral
  oaxaca: <>{P('M5 20 V11 C5 9 6 8 7.5 8 C9 8 10 9 10 11 M14 11 C14 9 15 8 16.5 8 C18 8 19 9 19 11 V20 M10 20 V11 H14 V20 M12 8 V5 M11 6.5 H13')}</>, // Santo Domingo
  havana: <>{P('M6 20 V12 H18 V20 M9 12 C9 9 10 7 12 7 C14 7 15 9 15 12 M12 7 V4 M6 20 H18')}</>, // Capitolio
  rio: <>{P('M12 3 V10 M4 6.5 H20 M12 10 L9 20 M12 10 L15 20 M7 20 H17')}</>,
  cusco: <>{P('M3 20 L8 9 L11 13 L14 6 L21 20 M3 20 H21 M7 17 H13 M9 14.5 H12')}</>,
  // ── Oceania / Africa / Middle East ──
  sydney: <>{P('M4 18 C4 12 8 8 10 8 C10 12 9 15 8 18 M10 18 C10 11 14 7 17 7 C17 12 15 15 14 18 M3 20 H21 M6 20 V18 M18 20 V18')}</>, // Opera House
  melbourne: <>{P('M6 20 V9 H10 V20 M12 20 V5 H16 V20 M18 20 V12 H21 V20 M14 5 V3')}</>, // skyline
  cairo: <>{P('M3 20 L10 8 L17 20 M12 20 L17 12 L21 20 M3 20 H21')}</>, // pyramids
  marrakech: <>{P('M9 20 V8 H15 V20 M10 8 V6 H14 V8 M12 6 V3')}{C(12, 3, 1)}{P('M10.5 12 H13.5 M10.5 16 H13.5 M7 20 H17')}</>,
  dubai: <>{P('M10 20 L11 10 L12 3 L13 10 L14 20 M8 20 H16 M10.5 14 H13.5')}</>, // Burj Khalifa
  // ── Nordic / misc ──
  dubrovnik: <>{P('M4 20 V13 M8 20 V11 M12 20 V13 M16 20 V10 M20 20 V13 M4 13 H20 M16 10 V7 M15 7 H17 M3 20 H21')}</>, // fortress walls
  copenhagen: <>{P('M6 20 V10 H18 V20 M9 10 C9 7 10.5 5 12 5 C13.5 5 15 7 15 10 M12 5 V3 M6 20 H18')}</>, // Round Tower dome
  stockholm: <>{P('M5 20 V9 H9 V20 M11 20 V6 H15 V20 M17 20 V11 H20 V20 M13 6 V4')}</>,
  edinburgh: <>{P('M5 20 V12 H19 V20 M5 12 V9 H8 V12 M16 12 V9 H19 V12 M11 12 V8 H13 V12 M12 8 V5 M10 20 V15 H14 V20')}</>,
};

/** Generic skyline for cities without bespoke art. */
const GENERIC_ART = (
  <>{P('M5 20 V12 H9 V20 M9 20 V8 H13 V20 M13 20 V14 H17 V20 M17 20 V16 H20 V20 M11 8 V5 M4 20 H21')}</>
);

/** Look up a city's landmark art (case/space-insensitive, matches "City, Country" too). */
export const landmarkArtFor = (city: string): React.ReactNode => {
  const key = city.trim().toLowerCase().split(',')[0].trim();
  if (CITY_ART[key]) return CITY_ART[key];
  // try loose contains match, longest key first
  const hit = Object.keys(CITY_ART)
    .sort((a, b) => b.length - a.length)
    .find((k) => key.includes(k) || k.includes(key));
  return hit ? CITY_ART[hit] : GENERIC_ART;
};

/** Bare <g> content — combines up to 3 cities' landmarks side by side in a 24×24 space. */
export const StampArtContent: React.FC<{ cities: string[] }> = ({ cities }) => {
  const picks = cities.slice(0, 3);
  const n = picks.length;
  // mini-art slots inside the 24x24 canvas
  const slots: Array<{ x: number; s: number }> =
    n === 1
      ? [{ x: 0, s: 1 }]
      : n === 2
        ? [{ x: -5.5, s: 0.62 }, { x: 5.5, s: 0.62 }]
        : [{ x: -7, s: 0.5 }, { x: 0, s: 0.58 }, { x: 7, s: 0.5 }];
  return (
    <>
      {picks.map((city, i) => (
        <g
          key={city + i}
          transform={`translate(12, 13) scale(${slots[i].s}) translate(${slots[i].x / slots[i].s - 12}, -13)`}
        >
          {landmarkArtFor(city)}
        </g>
      ))}
    </>
  );
};

/** The actual SVG for one stamp — combines up to 3 cities' landmarks side by side. */
export const StampArt: React.FC<{ cities: string[]; className?: string }> = ({ cities, className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <StampArtContent cities={cities} />
  </svg>
);


/** Full circular passport stamp as one SVG: arced country name along the top,
 * landmark art in the middle, full city names stacked below (never truncated),
 * year at the bottom flanked by tiny stars. Ink colour comes from currentColor. */
export const PassportStamp: React.FC<{ country: string; year: string; cities: string[]; className?: string; bottomText?: string }> = ({
  country,
  year,
  cities,
  className,
  bottomText
}) => {
  const uid = React.useId().replace(/:/g, '');
  const arcId = `stamp-arc-${uid}`;
  const arcBotId = `stamp-arc-bot-${uid}`;
  const names = cities.map((c) => c.split(',')[0].trim()).filter(Boolean);
  const shown = names.slice(0, 3);
  const extra = names.length - shown.length;
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <defs>
        <path id={arcId} d="M 60 60 m -44 0 a 44 44 0 1 1 88 0 a 44 44 0 1 1 -88 0" fill="none" />
        <path id={arcBotId} d="M 16 60 a 44 44 0 0 0 88 0" fill="none" />
      </defs>
      {/* rings */}
      <circle cx="60" cy="60" r="57" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="4 3.5" opacity="0.9" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
      {/* country around the top arc */}
      <text
        fontSize="10"
        fontWeight="800"
        letterSpacing="3"
        fill="currentColor"
        style={{ textTransform: 'uppercase', fontFamily: 'inherit' }}
      >
        <textPath href={`#${arcId}`} startOffset="25%" textAnchor="middle">
          {country.toUpperCase()}
        </textPath>
      </text>
      {/* landmark art — nested 24x24 canvas centred */}
      <g transform="translate(38, 30) scale(1.85)" opacity="0.85">
        <StampArtContent cities={cities} />
      </g>
      {/* city names — full names, one per line, italic serif */}
      {shown.map((c, i) => (
        <text
          key={c + i}
          x="60"
          y={76 + i * 9}
          textAnchor="middle"
          fontSize="7.5"
          fontStyle="italic"
          letterSpacing="0.6"
          fill="currentColor"
          opacity="0.9"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {c}
        </text>
      ))}
      {extra > 0 && (
        <text x="60" y={76 + shown.length * 9} textAnchor="middle" fontSize="6.5" fill="currentColor" opacity="0.6" fontStyle="italic">
          +{extra} more
        </text>
      )}
      {/* bottom arc overprint, e.g. IMMIGRATION CLEARED */}
      {bottomText && (
        <text fontSize="6.4" fontWeight="800" letterSpacing="2.2" fill="currentColor" opacity="0.95">
          <textPath href={`#${arcBotId}`} startOffset="50%" textAnchor="middle">
            {bottomText.toUpperCase()}
          </textPath>
        </text>
      )}
      {/* year flanked by tiny stars */}
      <text x="48" y="105.5" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.8">✦</text>
      <text x="72" y="105.5" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.8">✦</text>
      <text
        x="60"
        y="106"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="700"
        letterSpacing="2"
        fill="currentColor"
        style={{ fontFamily: 'ui-monospace, monospace' }}
      >
        {year}
      </text>
    </svg>
  );
};
