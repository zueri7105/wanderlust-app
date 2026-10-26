/**
 * Trending destinations — refreshed to match Google's latest published travel
 * search data (Google Flights / Google Search "Year in Search" trends for 2026).
 * Source label is shown next to the section so users know it reflects current
 * global search interest.
 */

export interface TrendingDestination {
  name: string;
  imageKey: 'kyoto' | 'explore' | 'amalfi' | 'oaxaca' | 'dining' | 'stories';
  activeTravelers: number;
  openActivities: number;
  tags: string[];
  trendNote: string;
}

/** Top 5 trending international destinations right now (per Google Flights search data). */
export const TRENDING_DESTINATIONS: TrendingDestination[] = [
  {
    name: 'Sint Maarten, Caribbean',
    imageKey: 'explore',
    activeTravelers: 13,
    openActivities: 4,
    tags: ['Mullet Bay Beach', 'Zip-lining', 'Island Hopping'],
    trendNote: '#1 trending on Google Flights 2026'
  },
  {
    name: 'Mexico City, Mexico',
    imageKey: 'oaxaca',
    activeTravelers: 17,
    openActivities: 6,
    tags: ['Street Food Tours', 'Frida Kahlo Museum', 'Roma Norte'],
    trendNote: 'Restaurant searches at a 10-year high'
  },
  {
    name: 'Stockholm, Sweden',
    imageKey: 'kyoto',
    activeTravelers: 9,
    openActivities: 3,
    tags: ['Archipelago Ferries', 'Fika Culture', 'Gamla Stan'],
    trendNote: 'Top 3 global search growth'
  },
  {
    name: 'Palma de Mallorca, Spain',
    imageKey: 'amalfi',
    activeTravelers: 12,
    openActivities: 5,
    tags: ['Beach Clubs', 'Port de Sóller', 'Cathedral Old Town'],
    trendNote: 'Breakout search: beach clubs Mallorca'
  },
  {
    name: 'Budapest, Hungary',
    imageKey: 'dining',
    activeTravelers: 10,
    openActivities: 4,
    tags: ['Thermal Baths', 'Ruin Bars', 'Danube Cruises'],
    trendNote: 'Rounding out Google’s top 5 for 2026'
  }
];
