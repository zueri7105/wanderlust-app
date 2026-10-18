export type TravelPace = 'Chill & Scenic' | 'Moderate Explorer' | 'Brisk & Fast-Paced';
export type BudgetTier = '$' | '$$' | '$$$';
export type TripScope = 'Full Trip' | 'Part of Trip' | 'Flexible (Full or Part)';
export type TravelerGender = 'female' | 'male' | 'non-binary' | 'prefer-not-to-say';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string; // Relationship to the NOC (Next of Kin / traveler) e.g. Mother, Spouse, Sibling, Friend
  countryCode: string; // e.g. +49, +1, +81, +44, +86
  phone: string; // e.g. 170 555 4912
}

export interface SoloTraveler {
  id: string;
  name: string;
  avatar: string;
  age: number;
  gender?: TravelerGender;
  homeCity: string;
  country: string; // Nationality
  bio: string;
  languages: string[];
  travelPace: TravelPace;
  budgetTier: BudgetTier;
  interests: string[];
  emergencyContactLinked: boolean;
  soloTripsCount: number;
  safetyRating: number;
  vouchedByCount: number;
  currentDestination?: string;
  isStarred?: boolean;
  reviews?: CompanionReview[];
  isConfirmedBuddy?: boolean;
}

export interface TravelTrip {
  id: string;
  travelerId: string;
  destination: string;
  country: string;
  region: string;
  coverImage: string;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;   // ISO date YYYY-MM-DD
  flexibilityDays: number; // 0, 1, 2, 3
  tripScope: TripScope; // Full trip vs Part of trip
  desiredPace: TravelPace;
  budgetTier: BudgetTier;
  interests: string[];
  headline: string;
  description: string;
  plannedActivities: string[];
}

export type ActivityCategory =
  | 'Adventure'
  | 'Food & Drink'
  | 'Culture & Sights'
  | 'Transport & Roadtrip'
  | 'Nightlife'
  | 'Street Food Crawl'
  | 'Sunrise & Sunset Spots'
  | 'Photography Walk'
  | 'Hiking & Trail Safety'
  | 'Culture & Temples'
  | 'Museums & Art'
  | 'Boat & Water Sports'
  | 'Night Markets & Shopping'
  | 'Coffee & Co-working'
  | 'Language & Cultural Exchange'
  | 'Cooking Class & Workshops'
  | 'Wellness & Yoga'
  | string;

export interface TravelActivity {
  id: string;
  destination: string;
  title: string;
  category: ActivityCategory;
  date: string;
  time: string;
  locationName: string;
  meetPointPublic: string;
  hostId: string;
  participantIds: string[];
  maxCapacity: number;
  estimatedCostTotal: number;
  currency: string;
  costSplitNote: string;
  description: string;
  status: 'open' | 'confirmed' | 'completed';
}

export interface ExpenseItem {
  id: string;
  activityId?: string;
  destination: string;
  title: string;
  payerId: string;
  amount: number;
  currency: string;
  splitBetweenIds: string[];
  category: 'Transport' | 'Tour / Guide' | 'Rental & Fuel' | 'Shared Meal' | 'Tickets & Passes';
  date: string;
  settled: boolean;
  receiptNote?: string;
}

export interface SoloPersonalExpense {
  id: string;
  destination: string;
  title: string;
  category: 'Flights & Rail' | 'Lodging / Hotel' | 'Daily Food & Cafes' | 'Local Transit' | 'Sightseeing & Passes' | 'Gear & Misc';
  amount: number;
  currency: string;
  date: string;
  note?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  date?: string;
  title: string;
  morningActivity: string;
  afternoonActivity: string;
  eveningActivity: string;
  companionGoal?: string;
}

export interface CityWeatherOutlook {
  cityName: string;
  seasonPeriod: string;
  temperatureRange: string;
  daytimeAvg: string;
  nighttimeAvg: string;
  rainProbability: string;
  conditions: string;
  daylightSummary: string;
  clothingAdvice: string;
}

export interface LocalGreeting {
  phrase: string;
  translation: string;
  phonetic: string;
}

export interface CulturalShockItem {
  title: string;
  description: string;
  tip: string;
}

export interface TravelGuideInfo {
  travelerNationality: string;
  destinationCity: string;
  destinationCountry: string;
  visaRequirements: string;
  specificCurrency: {
    code: string;
    name: string;
    symbol: string;
    rateBenchmark: string;
    cardAcceptance: string;
    tippingRules: string;
  };
  weatherOutlook: CityWeatherOutlook;
  recommendedToBring: string[];
  arrivalRulesAndApps: {
    connectivityAdvice: string; // e.g. VPN, eSIM, Roaming
    recommendedApps: { name: string; purpose: string }[];
    entryRegulations: string[];
  };
  culturalNorms: string[];
  basicGreetings: LocalGreeting[];
  culturalShocks: CulturalShockItem[];
  soloSafetyAdvisories: string[];
}

export interface TravelItinerary {
  id: string;
  travelerId: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  companionPurpose: string[];
  notes: string;
  days: ItineraryDay[];
  travelGuide: TravelGuideInfo;
  tripScope?: TripScope;
  dateFlexibility?: 'Exact Dates' | '±1 Day' | '±2 Days' | '±3 Days';
  visibility?: 'public' | 'companions_only' | 'private';
}

export interface ChatMessage {
  id: string;
  threadId: string; // activity id or direct traveler id
  senderId: string;
  recipientId?: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  type?: 'text' | 'buddy_proposal' | 'buddy_accepted';
  buddyStatus?: 'pending' | 'accepted' | 'declined';
}

export interface CompanionReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  travelerId: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  destinationVisited: string;
}

export interface TravelMemory {
  id: string;
  destination: string;
  country: string;
  coordinates: { x: number; y: number }; // Percentage on map canvas
  date: string;
  photos: string[];
  memoryNote: string;
  companionsTagged: string[];
  status: 'Visited' | 'Current Location' | 'Dream Next';
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'Culture & Traditions' | 'Solo Female Safety' | 'Local Dining Etiquette' | 'Transit & Digital Hacks' | 'Hidden Gems';
  destination: string;
  authorName: string;
  authorAvatar: string;
  authorCity: string;
  date: string;
  readTime: string;
  summary: string;
  content: string[];
  tags: string[];
  likesCount: number;
  isUserCustom?: boolean;
}

export interface SafeCheckinRecord {
  emergencyContacts: EmergencyContact[];
  activeDestination: string;
  lastCheckinTime: string;
  shareLiveStatus: boolean;
  safePledgeSigned: boolean;
}

