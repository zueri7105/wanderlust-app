import React, { useState, useEffect } from 'react';
import { TravelItinerary, SoloTraveler, ItineraryDay, TravelGuideInfo, TripScope } from '../types/travel';
import {
  Calendar,
  MapPin,
  Users,
  Compass,
  Plus,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  DollarSign,
  CloudSun,
  Luggage,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckSquare,
  Square,
  MessageSquare,
  FileText,
  X,
  Edit2,
  Check,
  Languages,
  Smartphone,
  AlertTriangle,
  Globe,
  Stamp
} from 'lucide-react';
import { generateDestinationTravelGuide } from '../services/geminiService';
import { formatTemperature } from '../utils/units';
import { lookupCountryGuide, visaAdviceFor, tippingAdviceFor } from '../utils/countryGuides';
import { getFxRates, refreshFxRates, benchmarkString, type FxState } from '../utils/currency';
import { getTranslation } from '../utils/i18n';
import { WORLD_COUNTRIES } from './DestinationSelector';

interface ItineraryViewProps {
  itineraries: TravelItinerary[];
  currentUser: SoloTraveler;
  onAddItinerary: (itinerary: TravelItinerary) => void;
  onUpdateItinerary?: (itinerary: TravelItinerary) => void;
  onDeleteItinerary?: (id: string) => void;
  onGoToCompanions: (destination: string) => void;
  onGoToExploreTrips: (destination: string) => void;
  onGoToActivities: (destination: string) => void;
  onOpenChatWithCompanion?: (travelerId: string) => void;
}

const COMMON_PURPOSES = [
  'Split Car Rental & Fuel',
  'Split Taxi to Outlying Sights',
  'Shared Dining / Tapas & Feast Partner',
  'Dawn Photography Walk',
  'Hiking Safety Partner',
  'Full Trip Travel Buddy',
  'Explore Local Markets Together'
];

interface FormDayItem {
  name: string; // activity heading box
  detail: string; // fill-in detail box
}

interface FormDayDraft {
  title: string;
  items: FormDayItem[];
  companionGoal: string;
}

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

  return {
    code: 'USD',
    name: 'US Dollar ($)',
    symbol: '$',
    rateBenchmark: '1 USD = $1.00 USD',
    cardAcceptance: 'Cards accepted at all major establishments.',
    tippingRules: '15%–20% standard table tipping in North America; check local destination customs.'
  };
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  itineraries,
  currentUser,
  onAddItinerary,
  onUpdateItinerary,
  onDeleteItinerary,
  onGoToCompanions,
  onGoToExploreTrips,
  onGoToActivities
}) => {
  // Sort itineraries top to bottom by earlier start date
  const sortedItineraries = [...itineraries].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Do not automatically expand any trip box on open; only expand when tapped as requested
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Track checked packing items per itinerary
  const [checkedPackingItems, setCheckedPackingItems] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('wanderlust_checked_packing');
    return saved ? JSON.parse(saved) : {};
  });

  const togglePackingCheck = (key: string) => {
    setCheckedPackingItems((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('wanderlust_checked_packing', JSON.stringify(next));
      return next;
    });
  };

  // Editable custom checklist items per itinerary
  const [checklistByItin, setChecklistByItin] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('wanderlust_custom_checklists');
    return saved ? JSON.parse(saved) : {};
  });

  const [newChecklistText, setNewChecklistText] = useState<Record<string, string>>({});

  // Editable personal travel notes per itinerary
  const [notesByItin, setNotesByItin] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('wanderlust_custom_notes');
    return saved ? JSON.parse(saved) : {};
  });

  // Day Editing State
  const [editingDayKey, setEditingDayKey] = useState<string | null>(null); // e.g. `${itin.id}_${day.dayNumber}`
  const [editTitle, setEditTitle] = useState('');
  const [editMorning, setEditMorning] = useState('');
  const [editAfternoon, setEditAfternoon] = useState('');
  const [editEvening, setEditEvening] = useState('');
  const [editGoal, setEditGoal] = useState('');

  const handleStartEditDay = (itinId: string, day: ItineraryDay) => {
    setEditingDayKey(`${itinId}_${day.dayNumber}`);
    setEditTitle(day.title);
    setEditMorning(day.morningActivity);
    setEditAfternoon(day.afternoonActivity);
    setEditEvening(day.eveningActivity);
    setEditGoal(day.companionGoal || '');
  };

  const handleSaveDayEdit = (itin: TravelItinerary, dayNumber: number) => {
    const updatedDays = itin.days.map((d) => {
      if (d.dayNumber === dayNumber) {
        return {
          ...d,
          title: editTitle,
          morningActivity: editMorning,
          afternoonActivity: editAfternoon,
          eveningActivity: editEvening,
          companionGoal: editGoal
        };
      }
      return d;
    });

    const updatedItin: TravelItinerary = {
      ...itin,
      days: updatedDays
    };

    if (onUpdateItinerary) {
      onUpdateItinerary(updatedItin);
    }
    setEditingDayKey(null);
  };

  const handleAddNewDayToSchedule = (itin: TravelItinerary) => {
    const nextDayNum = itin.days.length + 1;
    const newDay: ItineraryDay = {
      dayNumber: nextDayNum,
      title: `Day ${nextDayNum} Exploration`,
      morningActivity: 'Morning activity and local neighborhood walk.',
      afternoonActivity: 'Visit cultural sight, scenic viewpoint, or local market.',
      eveningActivity: 'Dinner at authentic local restaurant.',
      companionGoal: 'Companion to share dinner or day sightseeing'
    };

    const updatedItin: TravelItinerary = {
      ...itin,
      days: [...itin.days, newDay]
    };

    if (onUpdateItinerary) {
      onUpdateItinerary(updatedItin);
    }

    // Automatically open edit for the new day
    handleStartEditDay(itin.id, newDay);
  };

  const handleAddChecklistItem = (itinId: string, defaultItems: string[]) => {
    const text = (newChecklistText[itinId] || '').trim();
    if (!text) return;
    const currentList = checklistByItin[itinId] || defaultItems || [];
    const updated = [...currentList, text];
    const newMap = { ...checklistByItin, [itinId]: updated };
    setChecklistByItin(newMap);
    localStorage.setItem('wanderlust_custom_checklists', JSON.stringify(newMap));
    setNewChecklistText((prev) => ({ ...prev, [itinId]: '' }));
  };

  const handleRemoveChecklistItem = (itinId: string, idxToRemove: number, defaultItems: string[]) => {
    const currentList = checklistByItin[itinId] || defaultItems || [];
    const updated = currentList.filter((_, idx) => idx !== idxToRemove);
    const newMap = { ...checklistByItin, [itinId]: updated };
    setChecklistByItin(newMap);
    localStorage.setItem('wanderlust_custom_checklists', JSON.stringify(newMap));
  };

  const handleUpdateNotes = (itinId: string, notes: string) => {
    const newMap = { ...notesByItin, [itinId]: notes };
    setNotesByItin(newMap);
    localStorage.setItem('wanderlust_custom_notes', JSON.stringify(newMap));
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

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

  // Form state — destination split into Country box + City box
  const [formCountry, setFormCountry] = useState('Croatia');
  const [formCity, setFormCity] = useState('Dubrovnik');
  const formDest = formCity.trim() && formCountry.trim()
    ? `${formCity.trim()}, ${formCountry.trim()}`
    : (formCity.trim() || formCountry.trim());
  const [formStartDate, setFormStartDate] = useState('2026-11-01');
  const [formEndDate, setFormEndDate] = useState('2026-11-05');
  const [formNotes, setFormNotes] = useState('');
  const [formTripScope, setFormTripScope] = useState<TripScope>('Flexible (Full or Part)');
  const [formDateFlexibility, setFormDateFlexibility] = useState<'Exact Dates' | '±1 Day' | '±2 Days' | '±3 Days'>('Exact Dates');
  const [customGoalInput, setCustomGoalInput] = useState('');
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([
    'Shared Dining / Tapas & Feast Partner',
    'Split Car Rental & Fuel'
  ]);

  // Compute duration of stay automatically
  const computeStayDuration = (start: string, end: string) => {
    if (!start || !end) return { days: 1, nights: 0 };
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    if (isNaN(d1) || isNaN(d2) || d2 < d1) return { days: 1, nights: 0 };
    const nights = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
    const days = nights + 1;
    return { days, nights };
  };

  const syncDraftDaysCount = (targetDays: number) => {
    setFormDays((prev) => {
      if (prev.length === targetDays) return prev;
      if (prev.length < targetDays) {
        const added: FormDayDraft[] = [];
        for (let i = prev.length + 1; i <= targetDays; i++) {
          added.push({
            title: `Day ${i} Exploration`,
            items: [
              { name: 'Morning walk or local breakfast', detail: '' },
              { name: 'Afternoon excursion or landmark', detail: '' },
              { name: 'Dinner with travel companions', detail: '' }
            ],
            companionGoal: 'Companion for shared activities'
          });
        }
        return [...prev, ...added];
      }
      return prev.slice(0, targetDays);
    });
  };

  const handleStartDateChange = (val: string) => {
    setFormStartDate(val);
    const dur = computeStayDuration(val, formEndDate);
    syncDraftDaysCount(dur.days);
  };

  const handleEndDateChange = (val: string) => {
    setFormEndDate(val);
    const dur = computeStayDuration(formStartDate, val);
    syncDraftDaysCount(dur.days);
  };

  // Dynamic multi-day draft list (destination-neutral templates, fully editable)
  const [formDays, setFormDays] = useState<FormDayDraft[]>([
    {
      title: 'Arrival & Old Town First Walk',
      items: [
        { name: 'Arrive & check in', detail: 'Airport arrival, transfer to accommodation, settle in.' },
        { name: 'Historic square stroll', detail: 'Explore the central historic square, local cafe stop.' },
        { name: 'Welcome dinner', detail: 'Casual dinner at a neighborhood tavern / bistro bar.' }
      ],
      companionGoal: 'Open for dinner companion to celebrate first evening'
    },
    {
      title: 'Iconic Architecture & Viewpoints',
      items: [
        { name: 'Landmark walk', detail: 'Early morning walk past the main landmarks before heat and crowds.' },
        { name: 'Market & viewpoint', detail: 'Artisan market crawl and a scenic city viewpoint.' },
        { name: 'Sunset dinner', detail: 'Sunset viewpoint walk and local dinner.' }
      ],
      companionGoal: 'Companion for viewpoint photos and dinner'
    },
    {
      title: 'Day Excursion & Outdoor Adventure',
      items: [
        { name: 'Day trip out', detail: 'Nearby island, national park, or guided outdoor tour.' },
        { name: 'Nature highlights', detail: 'Explore scenic highlights and local nature spots.' },
        { name: 'Panoramic terrace', detail: 'Sunset drinks at a panoramic terrace.' }
      ],
      companionGoal: 'Split tour or transport costs for the excursion'
    },
    {
      title: 'Cultural Heritage & Sunset Walk',
      items: [
        { name: 'Palace / museum visit', detail: 'Visit the main palace, museum, or heritage monument.' },
        { name: 'Promenade coffee', detail: 'Artisan shopping and a relaxed coffee break on the main promenade.' },
        { name: 'Farewell dinner', detail: 'Farewell celebratory dinner at a local terrace.' }
      ],
      companionGoal: 'Shared multi-course dinner and travel stories'
    },
    {
      title: 'Morning Views & Departure',
      items: [
        { name: 'Farewell vista', detail: 'Cable car or viewpoint for a panoramic farewell vista.' },
        { name: 'Pack & transfer', detail: 'Pack and airport transfer.' },
        { name: 'Departure', detail: 'Departure flight.' }
      ],
      companionGoal: 'Split airport taxi'
    }
  ]);

  const togglePurpose = (p: string) => {
    if (selectedPurposes.includes(p)) {
      setSelectedPurposes(selectedPurposes.filter((item) => item !== p));
    } else {
      setSelectedPurposes([...selectedPurposes, p]);
    }
  };

  const handleAddCustomGoal = () => {
    const trimmed = customGoalInput.trim();
    if (!trimmed) return;
    if (!selectedPurposes.includes(trimmed)) {
      setSelectedPurposes([...selectedPurposes, trimmed]);
    }
    setCustomGoalInput('');
  };

  const handleAddDraftDay = () => {
    const nextNum = formDays.length + 1;
    setFormDays([
      ...formDays,
      {
        title: `Day ${nextNum} Exploration`,
        items: [
          { name: 'Morning walk and breakfast', detail: '' },
          { name: 'Afternoon excursion or museum', detail: '' },
          { name: 'Dinner with fellow travelers', detail: '' }
        ],
        companionGoal: 'Companion for shared activities'
      }
    ]);
  };

  const handleRemoveDraftDay = (index: number) => {
    if (formDays.length <= 1) return;
    setFormDays(formDays.filter((_, idx) => idx !== index));
  };

  const handleUpdateDraftDay = (index: number, field: 'title' | 'companionGoal', val: string) => {
    const next = [...formDays];
    next[index] = { ...next[index], [field]: val };
    setFormDays(next);
  };

  const handleUpdateDayItem = (dayIdx: number, itemIdx: number, field: keyof FormDayItem, val: string) => {
    setFormDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx
          ? { ...d, items: d.items.map((it, j) => (j === itemIdx ? { ...it, [field]: val } : it)) }
          : d
      )
    );
  };

  const handleAddDayItem = (dayIdx: number) => {
    setFormDays((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, items: [...d.items, { name: '', detail: '' }] } : d))
    );
  };

  const handleRemoveDayItem = (dayIdx: number, itemIdx: number) => {
    setFormDays((prev) =>
      prev.map((d, i) =>
        i === dayIdx && d.items.length > 1
          ? { ...d, items: d.items.filter((_, j) => j !== itemIdx) }
          : d
      )
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDest || !formStartDate || !formEndDate) return;

    setIsGeneratingGuide(true);

    // Country knowledge base: resolves bare cities ("Bangkok" → Thailand) and aligns
    // entry rules, customs, phrases and currency with whatever destination is typed.
    const kb = lookupCountryGuide(formDest);
    const nat = currentUser.country || 'Germany';
    const country = formCountry.trim() || (kb.key !== 'generic' ? kb.name : formDest);
    const city = formCity.trim() || formDest;
    const visaText = visaAdviceFor(nat, kb);
    const tippingText = tippingAdviceFor(nat, kb);
    const kbCurrency = {
      code: kb.currencyCode,
      name: kb.currencyName,
      symbol: kb.currencySymbol,
      rateBenchmark: '',
      cardAcceptance: 'Cards are widely accepted in cities; carry some cash for markets, taxis, and small towns.',
      tippingRules: tippingText
    };

    let guide: TravelGuideInfo;
    try {
      const generated = await generateDestinationTravelGuide(formDest, nat, formNotes);
      guide = {
        travelerNationality: nat,
        destinationCity: city,
        destinationCountry: country,
        visaRequirements: visaText,
        specificCurrency: {
          ...kbCurrency,
          cardAcceptance: generated.specificCurrency?.cardAcceptance || kbCurrency.cardAcceptance
        },
        weatherOutlook: generated.weatherOutlook || {
          cityName: `${city} Local Climate`,
          seasonPeriod: `${formStartDate} to ${formEndDate}`,
          temperatureRange: '14°C – 23°C (57°F – 73°F)',
          daytimeAvg: '21°C',
          nighttimeAvg: '14°C',
          rainProbability: '15% chance of light showers',
          conditions: 'Sunny, pleasant afternoons with cool evenings.',
          daylightSummary: 'Approx. 11 hours daylight.',
          clothingAdvice: 'Pack comfortable layers, walking shoes, and a light windbreaker.'
        },
        recommendedToBring: generated.recommendedToBring?.length
          ? generated.recommendedToBring
          : ['Walking shoes', 'Plug adapter', 'Light jacket'],
        arrivalRulesAndApps: {
          connectivityAdvice:
            generated.arrivalRulesAndApps?.connectivityAdvice ||
            'Purchase an international eSIM or check roaming coverage before departure.',
          recommendedApps: generated.arrivalRulesAndApps?.recommendedApps?.length
            ? generated.arrivalRulesAndApps.recommendedApps
            : [
                { name: 'Google Maps / Citymapper', purpose: 'Offline city navigation' },
                { name: 'Local Transit App', purpose: 'Bus and train timetable information' }
              ],
          entryRegulations: kb.entryRules
        },
        culturalNorms: kb.customs,
        basicGreetings: kb.phrases,
        culturalShocks: generated.culturalShocks || [
          {
            title: 'Dining Schedules & Local Pace',
            description: 'Restaurants and shops operate on local rhythms.',
            tip: 'Check opening hours for afternoon closures.'
          }
        ],
        soloSafetyAdvisories: generated.soloSafetyAdvisories?.length
          ? generated.soloSafetyAdvisories
          : ['Meet potential travel companions in public plazas.']
      };
    } catch {
      guide = {
        travelerNationality: nat,
        destinationCity: city,
        destinationCountry: country,
        visaRequirements: visaText,
        specificCurrency: kbCurrency,
        weatherOutlook: {
          cityName: `${city} City Outlook`,
          seasonPeriod: `${formStartDate} to ${formEndDate}`,
          temperatureRange: '16°C – 24°C',
          daytimeAvg: '22°C',
          nighttimeAvg: '15°C',
          rainProbability: '20%',
          conditions: 'Mild pleasant autumn weather.',
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
          recommendedApps: [{ name: 'Google Maps', purpose: 'Navigation' }],
          entryRegulations: kb.entryRules
        },
        culturalNorms: kb.customs,
        basicGreetings: kb.phrases,
        culturalShocks: [
          { title: 'Local Etiquette', description: 'Be respectful of local traditions.', tip: 'Observe locals.' }
        ],
        soloSafetyAdvisories: ['Save local emergency services: 112.']
      };
    } finally {
      setIsGeneratingGuide(false);
    }

    const newItinerary: TravelItinerary = {
      id: `itin_${Date.now()}`,
      travelerId: currentUser.id,
      destination: formDest,
      country: country,
      startDate: formStartDate,
      endDate: formEndDate,
      companionPurpose: selectedPurposes.length > 0 ? selectedPurposes : ['Solo Exploration'],
      notes: formNotes || `Solo trip to ${formDest}.`,
      days: formDays.map((d, idx) => {
        // Map the user's free-form activity boxes onto the structured day slots:
        // first 3 activities → morning / afternoon / evening, extras join the evening slot.
        const fmt = (it?: FormDayItem) =>
          it ? (it.detail.trim() ? `${it.name.trim() || 'Activity'} — ${it.detail.trim()}` : it.name.trim()) : '';
        const [m, a, ...rest] = d.items;
        const eveningParts = rest.map(fmt).filter(Boolean);
        return {
          dayNumber: idx + 1,
          title: d.title,
          morningActivity: fmt(m) || 'Free morning to explore at your own pace.',
          afternoonActivity: fmt(a) || 'Free afternoon for spontaneous plans.',
          eveningActivity: eveningParts.join(' · ') || 'Relaxed evening, dinner nearby.',
          companionGoal: d.companionGoal
        };
      }),
      travelGuide: guide,
      tripScope: formTripScope,
      dateFlexibility: formDateFlexibility,
      visibility: 'public'
    };

    onAddItinerary(newItinerary);
    setIsAddModalOpen(false);

    // Auto expand the new trip
    setExpandedIds((prev) => ({ ...prev, [newItinerary.id]: true }));
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 rounded-md mb-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Structured Trip Itineraries & Guides</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
            {getTranslation('itineraryTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            {getTranslation('itinerarySub')}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg hover:brightness-105 transition-colors shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{getTranslation('planNewItinerary')}</span>
        </button>
      </div>

      {/* Itinerary Boxes Stacked Top to Bottom Sorted by Earlier Start Date */}
      {sortedItineraries.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No itineraries yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Create your first detailed itinerary box with multi-day morning, afternoon, and evening schedules.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Itinerary Box</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedItineraries.map((itinerary) => {
            const isExpanded = !!expandedIds[itinerary.id];
            // Country knowledge overlay — keeps rules, customs, phrases & currency aligned
            // with the destination even for itineraries saved before the knowledge base existed.
            const guideKb = lookupCountryGuide(`${itinerary.destination} ${itinerary.country || ''}`);
            const guideNat = itinerary.travelGuide?.travelerNationality || currentUser.country || 'Germany';

            return (
              <div
                key={itinerary.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden transition-all"
              >
                {/* Trip Itinerary Box Header (Clickable to Expand / Collapse) */}
                <div
                  onClick={() =>
                    setExpandedIds((prev) => ({
                      ...prev,
                      [itinerary.id]: !prev[itinerary.id]
                    }))
                  }
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 dark:hover:brightness-105/40 transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-[10px] font-bold uppercase font-mono tracking-wider">
                        {itinerary.days.length}
                      </span>
                      <span className="text-[9px] uppercase tracking-tight opacity-80">
                        Days
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                          {itinerary.destination}
                        </h3>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {itinerary.startDate} – {itinerary.endDate}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 rounded">
                          Open to Public (Change in Settings)
                        </span>
                        {itinerary.tripScope && (
                          <span className="text-[10px] font-semibold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800 px-2 py-0.5 rounded">
                            {itinerary.tripScope}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                        {itinerary.notes}
                      </p>

                      {/* Companion Purpose Badges */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {itinerary.companionPurpose.slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded"
                          >
                            • {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {onDeleteItinerary && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete the itinerary for ${itinerary.destination}? This cannot be undone.`)) {
                            onDeleteItinerary(itinerary.id);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete this itinerary"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {isExpanded ? 'Hide Details' : 'Tap to View Detailed Solo Journey & Guide'}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Solo Journey, Day Schedule Editing & Travel Guide */}
                {isExpanded && (
                  <div className="p-6 space-y-8 bg-slate-50/40 dark:bg-slate-950/30">
                    {/* Action Links Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Companionship Opportunities for {itinerary.destination}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Find other solo travelers heading to {itinerary.destination.split(',')[0]} for part of the trip or full days.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onGoToCompanions(itinerary.destination)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg hover:brightness-105 cursor-pointer shadow-xs"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Find Matching Companions</span>
                        </button>

                        <button
                          onClick={() => onGoToActivities(itinerary.destination)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
                        >
                          <span>Shared Activities</span>
                        </button>
                      </div>
                    </div>

                    {/* Detailed Day-by-Day Schedule Grid with Edit Day functionality */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                            Detailed Solo Journey ({itinerary.days.length} Days Planned):
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Tap "Edit Day" on any day to customize times, activities, and companionship goals.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddNewDayToSchedule(itinerary)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors self-start sm:self-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Next Day (Day {itinerary.days.length + 1})</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {itinerary.days.map((day) => {
                          const isEditingThisDay = editingDayKey === `${itinerary.id}_${day.dayNumber}`;

                          if (isEditingThisDay) {
                            return (
                              <div
                                key={day.dayNumber}
                                className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 rounded-xl p-4 space-y-3 text-xs shadow-md"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                  <span className="font-bold text-slate-950 dark:text-slate-50 text-sm flex items-center gap-1.5">
                                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Editing Day {day.dayNumber} Schedule</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingDayKey(null)}
                                    className="text-slate-400 hover:text-slate-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Day Title / Highlight
                                  </label>
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Morning Activity
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editMorning}
                                    onChange={(e) => setEditMorning(e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Afternoon Activity
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editAfternoon}
                                    onChange={(e) => setEditAfternoon(e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Evening Activity
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={editEvening}
                                    onChange={(e) => setEditEvening(e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Companionship Goal
                                  </label>
                                  <input
                                    type="text"
                                    value={editGoal}
                                    onChange={(e) => setEditGoal(e.target.value)}
                                    placeholder="e.g. Companion for dinner crawl or splitting cab"
                                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                  />
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingDayKey(null)}
                                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveDayEdit(itinerary, day.dayNumber)}
                                    className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-md hover:brightness-105 flex items-center gap-1 shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Save Day {day.dayNumber}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={day.dayNumber}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5 text-xs shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                  <span className="font-bold text-slate-950 dark:text-slate-50 text-sm">
                                    Day {day.dayNumber}: {day.title}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {day.date && (
                                      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                                        {day.date}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditDay(itinerary.id, day)}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2 text-slate-700 dark:text-slate-300 pt-1">
                                  <div>
                                    <strong className="text-slate-900 dark:text-slate-100">Morning:</strong> {day.morningActivity}
                                  </div>
                                  <div>
                                    <strong className="text-slate-900 dark:text-slate-100">Afternoon:</strong> {day.afternoonActivity}
                                  </div>
                                  <div>
                                    <strong className="text-slate-900 dark:text-slate-100">Evening:</strong> {day.eveningActivity}
                                  </div>
                                </div>
                              </div>

                              {day.companionGoal && (
                                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-[11px] flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                                  <Users className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-emerald-900 dark:text-emerald-300">Companionship Goal:</strong>{' '}
                                    {day.companionGoal}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Enriched Travel Guide Box */}
                    {itinerary.travelGuide && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-7 space-y-6 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                                Travel Guide · {itinerary.travelGuide.destinationCity || itinerary.destination.split(',')[0]} ({itinerary.travelGuide.destinationCountry})
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Verified run-through for traveler nationality:{' '}
                                <strong className="text-slate-800 dark:text-slate-200">{itinerary.travelGuide.travelerNationality}</strong>
                              </p>
                            </div>
                          </div>

                          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-md self-start sm:self-auto">
                            Verified Destination Guide
                          </span>
                        </div>

                        {/* Top Highlights: City Weather Outlook & Checklist */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* City-Specific Weather Outlook (Microclimate & Period Trends) */}
                          <div className="p-4 sm:p-5 bg-gradient-to-br from-sky-50 via-orange-50/60 to-amber-50 dark:from-slate-800/60 dark:via-slate-800/40 dark:to-slate-800/60 border border-sky-100 dark:border-slate-700 rounded-xl space-y-2.5 text-xs">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <CloudSun className="w-4 h-4 text-amber-600" />
                                <span>City Weather Trend & Outlook</span>
                              </div>
                              <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 px-2 py-0.5 rounded font-mono font-medium">
                                City-Specific
                              </span>
                            </div>

                            <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">Location:</span>{' '}
                                {itinerary.travelGuide.weatherOutlook?.cityName || itinerary.travelGuide.destinationCity || itinerary.destination}
                              </div>
                              <div className="font-mono tabular-nums text-slate-950 dark:text-slate-50 font-bold text-sm">
                                Temp Range: {formatTemperature(itinerary.travelGuide.weatherOutlook?.temperatureRange || '14°C – 23°C')}
                              </div>
                              <div className="grid grid-cols-2 gap-2 py-1 text-[11px] font-mono">
                                <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                                  <span className="text-amber-700 dark:text-amber-400 block">Daytime High:</span>
                                  <span className="font-bold text-amber-900 dark:text-amber-200">{formatTemperature(itinerary.travelGuide.weatherOutlook?.daytimeAvg || '20°C')}</span>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded border border-indigo-200 dark:border-indigo-800">
                                  <span className="text-indigo-500 dark:text-indigo-400 block">Nighttime Low:</span>
                                  <span className="font-bold text-indigo-900 dark:text-indigo-200">{formatTemperature(itinerary.travelGuide.weatherOutlook?.nighttimeAvg || '13°C')}</span>
                                </div>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {itinerary.travelGuide.weatherOutlook?.conditions}
                              </p>
                              {itinerary.travelGuide.weatherOutlook?.clothingAdvice && (
                                <div className="text-[11px] bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded border border-amber-200/60 text-amber-900 dark:text-amber-200">
                                  <strong>Clothing Advice:</strong> {itinerary.travelGuide.weatherOutlook.clothingAdvice}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Checklist and Notes (Removed 'fully editable' badge as requested) */}
                          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3.5 text-xs">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Luggage className="w-4 h-4 text-emerald-700" />
                                <span>Checklist and Notes</span>
                              </div>
                            </div>

                            {/* Checklist Items */}
                            {(() => {
                              const defaultItems = itinerary.travelGuide.recommendedToBring || [];
                              const currentItems = checklistByItin[itinerary.id] || defaultItems;

                              return (
                                <div className="space-y-2">
                                  <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto pr-1">
                                    {currentItems.map((item, idx) => {
                                      const checkKey = `${itinerary.id}_pack_${item}_${idx}`;
                                      const isChecked = !!checkedPackingItems[checkKey];

                                      return (
                                        <li
                                          key={idx}
                                          className="flex items-center justify-between gap-2 group hover:bg-white dark:hover:brightness-105 p-1 rounded transition-colors"
                                        >
                                          <div
                                            onClick={() => togglePackingCheck(checkKey)}
                                            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                          >
                                            <span className="shrink-0 text-slate-600">
                                              {isChecked ? (
                                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                              ) : (
                                                <Square className="w-3.5 h-3.5 text-slate-400" />
                                              )}
                                            </span>
                                            <span className={`truncate text-xs ${isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                              {item}
                                            </span>
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => handleRemoveChecklistItem(itinerary.id, idx, defaultItems)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-opacity cursor-pointer rounded"
                                            title="Delete item"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>

                                  {/* Add New Checklist Item Input */}
                                  <div className="flex items-center gap-1.5 pt-1.5">
                                    <input
                                      type="text"
                                      value={newChecklistText[itinerary.id] || ''}
                                      onChange={(e) =>
                                        setNewChecklistText((prev) => ({
                                          ...prev,
                                          [itinerary.id]: e.target.value
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddChecklistItem(itinerary.id, defaultItems);
                                        }
                                      }}
                                      placeholder="Add personal packing item..."
                                      className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddChecklistItem(itinerary.id, defaultItems)}
                                      className="px-2.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-md hover:brightness-105 transition-colors cursor-pointer shrink-0"
                                    >
                                      Add
                                    </button>
                                  </div>

                                  {/* Editable Personal Notes Textarea */}
                                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                                    <label className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100 text-[11px]">
                                      <FileText className="w-3 h-3 text-slate-500" />
                                      <span>My Notes & Ideas:</span>
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={notesByItin[itinerary.id] ?? (itinerary.notes || '')}
                                      onChange={(e) => handleUpdateNotes(itinerary.id, e.target.value)}
                                      placeholder="Write down personal notes, tips, must-try cafes, or travel ideas here..."
                                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 leading-relaxed resize-y"
                                    />
                                  </div>
                                </div>
                              );
                            })()}
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
                                  <span>Specific Destination Currency & Payment Norms</span>
                                </div>
                                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded">
                                  {curr.code} ({curr.symbol})
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] text-slate-500 block">Exchange Rate:</span>
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
                                      {fx.isLive ? 'Live' : 'Estimated'}
                                    </span>
                                  </div>
                                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs mt-0.5 block">
                                    {benchmarkString(curr.code, curr.symbol, fx)}
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 sm:col-span-2">
                                  <span className="text-[11px] text-slate-500 block">Card & Cash Acceptance:</span>
                                  <span className="text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">
                                    {curr.cardAcceptance}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
                                <strong className="text-slate-900 dark:text-slate-100">Tipping Rules:</strong>{' '}
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
                              <span>Connectivity, Navigation Apps & Entry Regulations</span>
                            </div>
                            <span className="text-[10px] text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded font-medium">
                              Critical Solo Advice
                            </span>
                          </div>

                          {/* Connectivity & VPN guidance */}
                          {itinerary.travelGuide.arrivalRulesAndApps?.connectivityAdvice && (
                            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 rounded-lg text-slate-800 dark:text-slate-200">
                              <div className="font-semibold text-blue-900 dark:text-blue-300 text-xs mb-0.5">
                                Digital Connectivity & Map Navigation Advice:
                              </div>
                              <p className="leading-relaxed text-xs">
                                {itinerary.travelGuide.arrivalRulesAndApps.connectivityAdvice}
                              </p>
                            </div>
                          )}

                          {/* Recommended Apps */}
                          {itinerary.travelGuide.arrivalRulesAndApps?.recommendedApps?.length > 0 && (
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-2">
                                Essential Verified Travel Apps:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {itinerary.travelGuide.arrivalRulesAndApps.recommendedApps.map((app, idx) => (
                                  <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="font-bold text-slate-900 dark:text-slate-100">{app.name}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{app.purpose}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Entry regulations */}
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs mb-1">
                              Entry Customs & Regulations:
                            </div>
                            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                              {(guideKb.key !== 'generic'
                                ? guideKb.entryRules
                                : itinerary.travelGuide.arrivalRulesAndApps?.entryRegulations || []
                              ).map((reg, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-slate-400 font-bold">•</span>
                                  <span>{reg}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Visa & Entry — tailored to the traveler's nationality */}
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/20 border border-violet-200 dark:border-violet-800 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-md shadow-violet-500/30">
                              <Stamp className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                Visa & Entry Requirements
                              </div>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400 mt-0.5 mb-1.5">
                                {guideKb.name} · For a {guideNat} Passport
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {visaAdviceFor(guideNat, guideKb)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Local Customs & Cultural Etiquette */}
                        <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm pb-2 border-b border-slate-200 dark:border-slate-700 mb-2.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Local Customs & Cultural Etiquette</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(guideKb.key !== 'generic'
                              ? guideKb.customs
                              : itinerary.travelGuide.culturalNorms || []
                            ).map((norm, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{norm}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Basic Local Greetings & Cultural Expectations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                          {/* Basic Greetings */}
                          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                              <Languages className="w-4 h-4 text-indigo-600" />
                              <span>Basic Greetings in Local Language</span>
                            </div>
                            <div className="space-y-2 pt-1">
                              {(guideKb.key !== 'generic'
                                ? guideKb.phrases
                                : itinerary.travelGuide.basicGreetings || []
                              ).map((g, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                                  <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                    {g.phrase}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                                    <span>Meaning: <em>{g.translation}</em></span>
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
                              <span>Cultural Shocks & Traveler Realities</span>
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
                                    💡 Tip: {shock.tip}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Safety & Meeting Point Guidelines */}
                        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-2">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            Solo Safety Advisories & Recommended Public Meeting Points:
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Plan New Itinerary Modal with Dynamic Multi-Day Builder */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-display font-bold text-xl text-slate-950 dark:text-slate-50">
              Plan New Trip Itinerary & Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Build your day-by-day plan with morning, afternoon, and evening activities, plus companion goals. Add Day 2, Day 3, or as many days as your trip requires.
            </p>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      list="wl-country-list"
                      placeholder="Country (e.g. Croatia)"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <datalist id="wl-country-list">
                      {WORLD_COUNTRIES.map((c) => (
                        <option key={c.country} value={c.country} />
                      ))}
                    </datalist>
                    <span className="block text-[10px] text-slate-400 mt-1">Country</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="City (e.g. Dubrovnik)"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <span className="block text-[10px] text-slate-400 mt-1">City</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Automatically generated Duration of Stay */}
              {(() => {
                const dur = computeStayDuration(formStartDate, formEndDate);
                return (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-900 dark:text-rose-200">
                      Duration of stay:
                    </span>
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                      {dur.days} Days ({dur.nights} Nights)
                    </span>
                  </div>
                );
              })()}

              {/* Scope & Date Flexibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Travel Together Scope:
                  </label>
                  <select
                    value={formTripScope}
                    onChange={(e) => setFormTripScope(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  >
                    <option value="Flexible (Full or Part)">Flexible (Full or Part of Trip)</option>
                    <option value="Full Trip">Full Trip (Travel Together Throughout)</option>
                    <option value="Part of Trip">Part of Trip (Meet for Specific Days / Sights)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                    Date Flexibility:
                  </label>
                  <select
                    value={formDateFlexibility}
                    onChange={(e) => setFormDateFlexibility(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  >
                    <option value="Exact Dates">Exact Dates (Fixed schedule)</option>
                    <option value="±1 Day">±1 Day (Slightly flexible)</option>
                    <option value="±2 Days">±2 Days (Moderate flexibility)</option>
                    <option value="±3 Days">±3 Days (Highly flexible)</option>
                  </select>
                </div>
              </div>

              {/* Companionship Goals for This Trip (Optional with chips and custom write-in) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Companionship Goals for this trip <span className="text-slate-400 font-normal">(optional)</span>:
                  </label>
                  <span className="text-[10px] text-slate-400">Pick or type custom</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PURPOSES.map((p) => {
                    const active = selectedPurposes.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePurpose(p)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                          active
                            ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomGoal();
                      }
                    }}
                    placeholder="Add custom companionship goal (e.g. Split boat charter)..."
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomGoal}
                    className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-md text-xs font-semibold hover:brightness-105 cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Privacy Notice on Itinerary Visibility */}
              <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-800 dark:text-slate-200">Open to public:</strong> Dates, destination, flexibility, and general notes are viewable by public travelers to find companions. Detailed journey can be customized in Settings.
              </div>

              {/* Multi-Day Schedule Builder called Travel Planning */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    Travel Planning ({formDays.length} Days)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDraftDay}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Day</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formDays.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Day {idx + 1}</span>
                        {formDays.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftDay(idx)}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Day Title (e.g. Dawn Temple Photography)"
                        value={d.title}
                        onChange={(e) => handleUpdateDraftDay(idx, 'title', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold text-xs"
                      />

                      {/* Activity boxes: name (heading) + detail (fill-in) + add-more */}
                      <div className="space-y-2">
                        {d.items.map((it, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 shrink-0 w-4 text-center">
                                {itemIdx + 1}
                              </span>
                              <input
                                type="text"
                                placeholder={`Name of activity (e.g. Fushimi Inari at sunrise)`}
                                value={it.name}
                                onChange={(e) => handleUpdateDayItem(idx, itemIdx, 'name', e.target.value)}
                                className="flex-1 min-w-0 px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold"
                              />
                              {d.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDayItem(idx, itemIdx)}
                                  className="p-1 text-slate-400 hover:text-red-600 shrink-0 cursor-pointer"
                                  title="Remove activity"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Fill in details (time, place, bookings...)"
                              value={it.detail}
                              onChange={(e) => handleUpdateDayItem(idx, itemIdx, 'detail', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                            />
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddDayItem(idx)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-dashed border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add another activity to Day {idx + 1}
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Companionship goal (e.g. dinner companion or split taxi)..."
                        value={d.companionGoal}
                        onChange={(e) => handleUpdateDraftDay(idx, 'companionGoal', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trip Overview & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline key priorities, lodging style, or pace preferences..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingGuide}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg hover:brightness-105 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {isGeneratingGuide ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Travel Guide...</span>
                    </>
                  ) : (
                    <span>Save Itinerary Box</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
