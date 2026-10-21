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
  tokyo: <>{P('M12 3 L8 20 M12 3 L16 20 M9 14 H15 M9.7 10 H14.3 M10.5 6.5 H13.5')}{P('M7 20 H17')}</>, // Tokyo Tower
  kyoto: <>{P('M5 6 H19 M5 6 C5 8 7 9 7 9 M19 6 C19 8 17 9 17 9')}{P('M7 9 V20 M17 9 V20 M4 20 H20')}{P('M5 5 H19', { strokeWidth: 1.8 })}</>, // torii gate
  osaka: <>{P('M6 20 V10 L12 6 L18 10 V20 M6 20 H18 M12 6 V4 M9 12 H15 M10 15 H14')}</>, // castle
  beijing: <>{P('M12 5 L7 9 H17 Z M7 9 V12 M17 9 V12 M5 12 H19 M7 12 V16 M17 12 V16 M4 16 H20 M6 16 V20 H18 V16')}</>, // Temple of Heaven
  shanghai: <>{C(12, 7, 2.2)}{C(12, 13, 3)}{P('M12 2 V4.8 M12 16 V21 M9.5 21 H14.5')}</>, // Oriental Pearl
  seoul: <>{P('M4 10 C7 7 17 7 20 10 M6 10 V18 M18 10 V18 M6 18 H18 M10 13 H14 V18 H10 Z')}</>, // Gyeongbokgung gate
  bangkok: <>{P('M12 3 L14 8 L12 7 L10 8 Z M8 20 V12 L12 9 L16 12 V20 M8 14 H16 M5 20 H19')}</>, // wat spire
  bali: <>{P('M5 20 V8 L9 5 M19 20 V8 L15 5 M9 5 V12 M15 5 V12 M9 12 H15 M4 20 H20')}</>, // split gate
  singapore: <>{P('M7 20 V9 M12 20 V9 M17 20 V9 M5 8 H19 C19 8 17 6 12 6 C7 6 5 8 5 8 Z')}</>, // Marina Bay Sands
  'hong kong': <>{P('M4 18 L9 8 L14 18 M8 12 L16 12 M16 18 V10 M19 18 V7 M4 20 H20')}</>, // skyline
  taipei: <>{P('M12 3 L12 6 M9 8 H15 L14 10 H10 Z M8 12 H16 L15 14 H9 Z M7 16 H17 L16 20 H8 Z')}</>, // Taipei 101
  // ── Europe ──
  paris: <>{P('M7 20 L12 4 L17 20 M9 13 H15 M8.2 16.5 H15.8 M5.5 20 H18.5')}</>, // Eiffel Tower
  london: <>{P('M10 20 V7 M14 20 V7 M10 7 L12 3 L14 7 M10 20 H14')}{C(12, 9.5, 1.6)}</>, // Big Ben
  berlin: <>{P('M4 9 H20 M5 9 V18 M9 9 V18 M15 9 V18 M19 9 V18 M4 18 H20 M3 9 L12 5 L21 9 M12 2 V5')}</>, // Brandenburg Gate
  rome: <>{P('M5 20 V10 C5 7 8 5 12 5 C16 5 19 7 19 10 V20 M5 12 H19 M5 16 H19 M8 20 V12 M12 20 V12 M16 20 V12')}</>, // Colosseum
  barcelona: <>{P('M8 20 V8 L10 4 L12 8 V20 M13 20 V10 L15 6 L17 10 V20 M6 20 H18')}{C(10, 9, 0.6)}{C(15, 11, 0.6)}</>, // Sagrada Família
  madrid: <>{P('M5 20 V12 C5 9 8 8 12 8 C16 8 19 9 19 12 V20 M8 20 V13 C8 11.5 9.5 10.5 12 10.5 C14.5 10.5 16 11.5 16 13 V20 M4 20 H20 M12 8 V5 M10 5 H14')}</>, // Puerta de Alcalá
  seville: <>{P('M9 20 V8 H15 V20 M9 8 L10 5 H14 L15 8 M9 12 H15 M9 16 H15 M7 20 H17 M11 10 H13')}</>, // Giralda
  venice: <>{P('M6 20 V12 H10 V20 M14 20 V12 H18 V20 M6 12 C6 9 8 7 10 7 M14 12 C14 9 16 7 18 7 M12 4 V8 M11 6 H13')}{P('M3 21 C7 19.5 17 19.5 21 21')}</>, // domes + canal
  amalfi: <>{P('M4 20 V14 H8 V20 M8 14 V10 H13 V14 M13 10 V6 H17 V10 M17 10 V20 M3 20 H20')}{C(15, 8, 0.8)}</>, // cliff houses
  lisbon: <>{P('M8 20 V9 L10 6 H14 L16 9 V20 M8 20 H16 M9 12 H15 M10 15 H14 M6 20 H18')}</>, // Belém tower
  athens: <>{P('M5 8 H19 M6 8 V17 M10 8 V17 M14 8 V17 M18 8 V17 M4 17 H20 M4 8 L12 4 L20 8')}</>, // Parthenon
  istanbul: <>{P('M6 20 V12 C6 9 9 7 12 7 C15 7 18 9 18 12 V20 M6 20 H18 M12 4 V7 M4 20 V9 M3 9 L4 7 L5 9 M20 20 V9 M19 9 L20 7 L21 9')}</>, // Blue Mosque
  prague: <>{P('M7 20 V10 H11 V20 M13 20 V8 H17 V20 M13 8 L15 4 L17 8 M5 20 H19')}</>, // bridge towers
  vienna: <>{P('M9 20 V10 L12 3 L15 10 V20 M9 20 H15 M10.5 13 H13.5 M5 20 H19')}</>, // Stephansdom
  budapest: <>{P('M6 20 V11 H18 V20 M9 11 C9 8 10.5 6 12 6 C13.5 6 15 8 15 11 M12 6 V4 M6 20 H18 M8 14 H10 M14 14 H16')}</>, // Parliament
  reykjavik: <>{P('M6 20 L12 5 L18 20 M9 20 V14 M15 20 V14 M12 20 V11 M4 20 H20')}</>, // Hallgrímskirkja
  santorini: <>{P('M5 20 V13 H19 V20 M8 13 C8 10 10 8 12 8 C14 8 16 10 16 13 M12 8 V5 M11 6 H13')}</>, // blue dome
  // ── Americas ──
  'new york': <>{P('M5 20 V10 H9 V20 M9 20 V6 H13 V20 M13 20 V12 H17 V20 M17 20 V15 H20 V20 M11 6 V3')}</>, // skyline
  'san francisco': <>{P('M4 20 V12 M20 20 V12 M4 12 H20 M6 12 C6 8 18 8 18 12 M8 12 C8 9.5 16 9.5 16 12 M2 20 H22')}</>, // Golden Gate
  'mexico city': <>{P('M6 20 H18 M8 20 V15 H16 V20 M10 15 V11 H14 V15 M11 11 V8 H13 V11 M12 8 V5')}</>, // cathedral
  oaxaca: <>{P('M5 20 V11 C5 9 6 8 7.5 8 C9 8 10 9 10 11 M14 11 C14 9 15 8 16.5 8 C18 8 19 9 19 11 V20 M10 20 V11 H14 V20 M12 8 V5 M11 6.5 H13')}</>, // Santo Domingo
  havana: <>{P('M6 20 V12 H18 V20 M9 12 C9 9 10 7 12 7 C14 7 15 9 15 12 M12 7 V4 M6 20 H18')}</>, // Capitolio
  rio: <>{P('M12 4 V9 M7 6 H17 M12 9 C9 12 8 16 7 20 M12 9 C15 12 16 16 17 20 M5 20 H19')}</>, // Christ the Redeemer
  cusco: <>{P('M5 20 L9 10 L12 14 L15 8 L19 20 M5 20 H19')}</>, // Andes peaks
  // ── Oceania / Africa / Middle East ──
  sydney: <>{P('M4 18 C4 12 8 8 10 8 C10 12 9 15 8 18 M10 18 C10 11 14 7 17 7 C17 12 15 15 14 18 M3 20 H21 M6 20 V18 M18 20 V18')}</>, // Opera House
  melbourne: <>{P('M6 20 V9 H10 V20 M12 20 V5 H16 V20 M18 20 V12 H21 V20 M14 5 V3')}</>, // skyline
  cairo: <>{P('M3 20 L10 8 L17 20 M12 20 L17 12 L21 20 M3 20 H21')}</>, // pyramids
  marrakech: <>{P('M9 20 V8 H15 V20 M9 8 L10 5 H14 L15 8 M12 5 V3 M11 11 H13 M11 14 H13 M6 20 H18')}</>, // Koutoubia
  dubai: <>{P('M10 20 L11 10 L12 3 L13 10 L14 20 M8 20 H16 M10.5 14 H13.5')}</>, // Burj Khalifa
  // ── Nordic / misc ──
  dubrovnik: <>{P('M4 20 V13 M8 20 V11 M12 20 V13 M16 20 V10 M20 20 V13 M4 13 H20 M16 10 V7 M15 7 H17 M3 20 H21')}</>, // fortress walls
  copenhagen: <>{P('M6 20 V10 H18 V20 M9 10 C9 7 10.5 5 12 5 C13.5 5 15 7 15 10 M12 5 V3 M6 20 H18')}</>, // Round Tower dome
  stockholm: <>{P('M5 20 V9 H9 V20 M11 20 V6 H15 V20 M17 20 V11 H20 V20 M13 6 V4')}</>,
  edinburgh: <>{P('M6 20 V11 H18 V20 M6 11 L8 8 H10 V11 M14 11 V8 H16 L18 11 M10 20 V15 H14 V20')}</>, // castle
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

/** The actual SVG for one stamp — combines up to 3 cities' landmarks side by side. */
export const StampArt: React.FC<{ cities: string[]; className?: string }> = ({ cities, className }) => {
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
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {picks.map((city, i) => (
        <g
          key={city + i}
          transform={`translate(12, 13) scale(${slots[i].s}) translate(${slots[i].x / slots[i].s - 12}, -13)`}
        >
          {landmarkArtFor(city)}
        </g>
      ))}
    </svg>
  );
};
