import React, { useState, useEffect, useRef } from 'react';
import { getTranslation } from '../utils/i18n';
import { ExpenseItem, SoloPersonalExpense, SoloTraveler, TravelItinerary, TravelTrip } from '../types/travel';
import { WORLD_CURRENCIES } from '../data/currencies';
import { searchCities } from '../data/cityIndex';
import { WORLD_COUNTRIES } from './DestinationSelector';
import { getFxRates, refreshFxRates, rateFor, type FxState } from '../utils/currency';
import {
  Calculator,
  Plus,
  Check,
  Receipt,
  CreditCard,
  PieChart,
  TrendingDown,
  Sparkles,
  ArrowRightLeft,
  Trash2,
  X,
  Search,
  Edit3,
  MapPin,
  Globe,
  ChevronDown
} from 'lucide-react';

export interface CurrencyDef {
  code: string;
  name: string;
  symbol: string;
  rate: number; // units per 1 USD
}

// Row 1 of the currency basket — 6 major travel currencies (USD, EUR, CNY, JPY, GBP, CHF)
export const TOP_5_CURRENCIES: CurrencyDef[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.15 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 152.0 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.86 }
];

// ─── Searchable Destination Combobox ────────────────────────────────────────
// Shows the user's itinerary/trip destinations first, but also lets them search
// ANY city or country in the world (or type a fully custom destination).
interface DestinationComboboxProps {
  value: string;
  onChange: (dest: string) => void;
  suggestions: string[];
  allowAll?: boolean;
  compact?: boolean;
}

const DestinationCombobox: React.FC<DestinationComboboxProps> = ({
  value,
  onChange,
  suggestions,
  allowAll = false,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const trimmed = query.trim();
  const displayValue = value === 'All' ? 'All Destinations' : value;
  const suggestionMatches = trimmed
    ? suggestions.filter((d) => d.toLowerCase().includes(trimmed.toLowerCase()))
    : suggestions;
  const cityMatches = trimmed.length >= 2 ? searchCities(trimmed, 6) : [];
  const countryMatches =
    trimmed.length >= 2
      ? WORLD_COUNTRIES.filter((c) => c.country.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 4)
      : [];
  const exactCovered = [...suggestionMatches, ...cityMatches.map((c) => `${c.city}, ${c.country}`), ...countryMatches.map((c) => c.country)]
    .some((d) => d.toLowerCase() === trimmed.toLowerCase());

  const pick = (dest: string) => {
    onChange(dest);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapRef} className={`relative ${compact ? '' : 'w-full'}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium cursor-pointer ${
          compact ? 'px-3 py-1.5 text-xs min-w-44' : 'w-full px-3 py-2 text-sm'
        }`}
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-56">{displayValue}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden right-0">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any city or country…"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1 text-xs">
            {allowAll && (
              <button
                type="button"
                onClick={() => pick('All')}
                className={`w-full text-left px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer inline-flex items-center gap-2 ${
                  value === 'All' ? 'text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>All Destinations</span>
              </button>
            )}

            {suggestionMatches.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Your Itinerary Destinations
                </div>
                {suggestionMatches.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => pick(d)}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer inline-flex items-center gap-2 ${
                      value === d ? 'font-semibold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="truncate">{d}</span>
                  </button>
                ))}
              </>
            )}

            {cityMatches.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cities
                </div>
                {cityMatches.map((c) => {
                  const full = `${c.city}, ${c.country}`;
                  return (
                    <button
                      key={full}
                      type="button"
                      onClick={() => pick(full)}
                      className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer inline-flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span className="truncate">{full}</span>
                    </button>
                  );
                })}
              </>
            )}

            {countryMatches.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Countries
                </div>
                {countryMatches.map((c) => (
                  <button
                    key={c.country}
                    type="button"
                    onClick={() => pick(c.country)}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer inline-flex items-center gap-2"
                  >
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span className="truncate">{c.country}</span>
                  </button>
                ))}
              </>
            )}

            {trimmed.length >= 2 && !exactCovered && (
              <button
                type="button"
                onClick={() => pick(trimmed)}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Use "<span className="font-semibold">{trimmed}</span>" as custom destination
              </button>
            )}

            {trimmed.length >= 2 && suggestionMatches.length === 0 && cityMatches.length === 0 && countryMatches.length === 0 && (
              <div className="px-3 py-2 text-slate-400">No matches — use the custom option above.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface TripCostViewProps {
  soloExpenses: SoloPersonalExpense[];
  sharedExpenses: ExpenseItem[];
  travelers: SoloTraveler[];
  currentUser: SoloTraveler;
  selectedDestination: string;
  itineraries?: TravelItinerary[];
  trips?: TravelTrip[];
  /** Pin the whole view to one trip's destination (trip detail page): hides the
      destination filter and locks the expense forms to this destination */
  lockedDestination?: string;
  onAddSoloExpense: (expense: Omit<SoloPersonalExpense, 'id'>) => void;
  onAddSharedExpense: (expense: Omit<ExpenseItem, 'id' | 'settled'>) => void;
  onToggleSharedSettled: (id: string) => void;
  onDeleteSoloExpense?: (id: string) => void;
  onDeleteSharedExpense?: (id: string) => void;
}

export const TripCostView: React.FC<TripCostViewProps> = ({
  soloExpenses,
  sharedExpenses,
  travelers,
  currentUser,
  selectedDestination,
  itineraries = [],
  trips = [],
  lockedDestination,
  onAddSoloExpense,
  onAddSharedExpense,
  onToggleSharedSettled,
  onDeleteSoloExpense,
  onDeleteSharedExpense
}) => {
  // Destination filter — locked to the trip's destination on the trip detail page
  const [filterDestination, setFilterDestination] = useState(
    lockedDestination || (selectedDestination !== 'All Destinations' ? selectedDestination : 'All')
  );

  // User-added custom currencies in Row 2 (max 6) — starts empty so first-time
  // users see just the 6 primary currencies until they add their own
  const [customCurrencies, setCustomCurrencies] = useState<CurrencyDef[]>(() => {
    const saved = localStorage.getItem('wanderlust_custom_currencies');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Save custom currencies
  useEffect(() => {
    localStorage.setItem('wanderlust_custom_currencies', JSON.stringify(customCurrencies));
  }, [customCurrencies]);

  // Active calculation currency
  const [activeCurrency, setActiveCurrency] = useState<string>(() => {
    const saved = localStorage.getItem('wanderlust_cost_currency');
    return saved || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('wanderlust_cost_currency', activeCurrency);
  }, [activeCurrency]);

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

  const fmtRate = (n: number): string =>
    n >= 100 ? Math.round(n).toLocaleString() : n >= 10 ? n.toFixed(1) : n.toFixed(2);

  const [isAddCurrencyModalOpen, setIsAddCurrencyModalOpen] = useState(false);
  const [customCodeInput, setCustomCodeInput] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');
  const [customSymbolInput, setCustomSymbolInput] = useState('');
  const [customRateInput, setCustomRateInput] = useState<number>(1.0);

  // All registered currencies
  const allKnownCurrencies: CurrencyDef[] = [...TOP_5_CURRENCIES, ...customCurrencies];
  const activeCurrencyDef =
    allKnownCurrencies.find((c) => c.code === activeCurrency) || TOP_5_CURRENCIES[0];

  const getCurrencyRate = (code: string): number => {
    const upper = (code || 'USD').toUpperCase();
    // Live/cached market rates take priority over any stored static rate
    if (fx.rates[upper]) return fx.rates[upper];
    const found = allKnownCurrencies.find((c) => c.code.toUpperCase() === upper);
    return found ? found.rate : rateFor(upper, fx);
  };

  const convertCurrency = (amount: number, from: string, to: string): number => {
    const rateFrom = getCurrencyRate(from || 'USD');
    const rateTo = getCurrencyRate(to || 'USD');
    const inUSD = amount / rateFrom;
    return inUSD * rateTo;
  };

  const formatMoney = (amount: number, currencyCode: string): string => {
    const cur = allKnownCurrencies.find((c) => c.code === currencyCode) || {
      code: currencyCode,
      symbol: '$'
    };
    const symbol = cur.symbol || currencyCode;
    if (currencyCode === 'JPY' || currencyCode === 'KRW') {
      return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    const isWhole = Math.round(amount * 100) % 100 === 0;
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: isWhole ? 0 : 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Add custom currency handler (max 6)
  const handleAddCustomCurrency = (cur: CurrencyDef) => {
    if (customCurrencies.length >= 6) {
      alert('You can have at most 6 custom currencies in the basket.');
      return;
    }
    if (allKnownCurrencies.some((c) => c.code === cur.code)) {
      alert(`Currency ${cur.code} is already in your basket.`);
      return;
    }
    const updated = [...customCurrencies, cur];
    setCustomCurrencies(updated);
    setActiveCurrency(cur.code);
    setIsAddCurrencyModalOpen(false);
  };

  const handleRemoveCustomCurrency = (code: string) => {
    const updated = customCurrencies.filter((c) => c.code !== code);
    setCustomCurrencies(updated);
    if (activeCurrency === code) {
      setActiveCurrency('USD');
    }
  };

  // User-defined target budget in USD
  const [targetBudgetUSD, setTargetBudgetUSD] = useState<number>(() => {
    const saved = localStorage.getItem('wanderlust_target_budget_usd');
    return saved ? Number(saved) : 2500;
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetEditInput, setBudgetEditInput] = useState(String(targetBudgetUSD));

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(budgetEditInput);
    if (val > 0) {
      setTargetBudgetUSD(val);
      localStorage.setItem('wanderlust_target_budget_usd', String(val));
    }
    setIsEditingBudget(false);
  };

  // Modals state
  const [isAddSoloModalOpen, setIsAddSoloModalOpen] = useState(false);
  const [isAddSharedModalOpen, setIsAddSharedModalOpen] = useState(false);

  // Search input for world currencies in Add Currency Modal
  const [currencySearch, setCurrencySearch] = useState('');

  // Destination choices follow the itineraries the user created (plus their own
  // trip posts & recorded expenses). Sample destinations only appear as a
  // fallback before the user has planned anything.
  const userDestinations = Array.from(
    new Set([
      ...itineraries.map((it) => it.destination),
      ...trips.filter((tr) => tr.travelerId === currentUser.id).map((tr) => tr.destination),
      ...soloExpenses.map((e) => e.destination),
      ...sharedExpenses.map((e) => e.destination)
    ].filter(Boolean))
  );
  const availableDestinations =
    userDestinations.length > 0 ? userDestinations : ['Kyoto, Japan', 'Dubrovnik, Croatia'];

  const defaultDest =
    lockedDestination ||
    availableDestinations[0] ||
    (selectedDestination !== 'All Destinations' ? selectedDestination : 'Kyoto, Japan');

  // Confirmed companion buddies
  const confirmedBuddies = travelers.filter((t) => t.isConfirmedBuddy && t.id !== currentUser.id);
  const eligibleSplitParticipants = [currentUser, ...confirmedBuddies];

  // Solo Financial Form State (blank new amountStr with NO leading 0!)
  const [soloTitle, setSoloTitle] = useState('');
  const [soloAmountStr, setSoloAmountStr] = useState('');
  const [soloCategory, setSoloCategory] = useState<SoloPersonalExpense['category']>('Daily Food & Cafes');
  const [soloCurrency, setSoloCurrency] = useState<string>(activeCurrency);
  const [soloDest, setSoloDest] = useState(defaultDest);
  const [soloNote, setSoloNote] = useState('');

  // Shared Expense Form State (blank new amountStr with NO leading 0!)
  const [sharedTitle, setSharedTitle] = useState('');
  const [sharedAmountStr, setSharedAmountStr] = useState('');
  const [sharedCurrency, setSharedCurrency] = useState<string>(activeCurrency);
  const [sharedCategory, setSharedCategory] = useState<ExpenseItem['category']>('Transport');
  // Paid upfront: free-text name box (no dropdown) — write whoever paid
  const [sharedPayer, setSharedPayer] = useState('');
  const [sharedDest, setSharedDest] = useState(defaultDest);
  const [sharedMembers, setSharedMembers] = useState<string[]>(() => [
    currentUser.id,
    ...(confirmedBuddies[0] ? [confirmedBuddies[0].id] : [])
  ]);
  const [sharedNote, setSharedNote] = useState('');

  // "Paid by" label — known traveller ids resolve to names; free-text names show as written
  const payerDisplayName = (payerId: string) => {
    const t = travelers.find((x) => x.id === payerId);
    if (t) return t.id === currentUser.id ? `${t.name} (You)` : t.name;
    return payerId;
  };

  // Resolve a typed payer name: own name / "me" → you; a traveller's name → their id;
  // anything else is kept as the typed name so the ledger shows it verbatim.
  const resolvePayerId = (name: string): string => {
    const n = name.trim().toLowerCase();
    if (!n) return currentUser.id;
    if (n === 'me' || n === 'you' || n === currentUser.name.trim().toLowerCase()) return currentUser.id;
    const t = travelers.find((x) => x.name.trim().toLowerCase() === n);
    return t ? t.id : name.trim();
  };

  // Filtered lists — in locked (trip detail) mode, match by destination prefix so
  // expenses recorded as "Kyoto, Japan" or "Kyoto" both land on the Kyoto trip
  const destMatch = (expDest: string): boolean => {
    if (filterDestination === 'All') return true;
    if (!lockedDestination) return expDest === filterDestination;
    const a = (expDest || '').toLowerCase().split(',')[0].trim();
    const b = (filterDestination || '').toLowerCase().split(',')[0].trim();
    return !!a && !!b && (a === b || a.includes(b) || b.includes(a));
  };
  const filteredSolo = soloExpenses.filter((exp) => destMatch(exp.destination));
  const filteredShared = sharedExpenses.filter((exp) => destMatch(exp.destination));

  // Sort shared receipts: UNSETTLED items at top, SETTLED items at bottom as requested!
  const sortedShared = [...filteredShared].sort((a, b) => {
    if (a.settled === b.settled) return 0;
    return a.settled ? 1 : -1;
  });

  // Calculate Solo Financials (all normalized to activeCurrency) using user-edited target budget!
  const targetSoloBudget = convertCurrency(targetBudgetUSD, 'USD', activeCurrency);
  const totalSoloSpent = filteredSolo.reduce(
    (acc, exp) => acc + convertCurrency(exp.amount, exp.currency || 'USD', activeCurrency),
    0
  );
  const budgetRemaining = Math.max(0, targetSoloBudget - totalSoloSpent);
  const budgetPercentUsed = Math.min(100, Math.round((totalSoloSpent / Math.max(1, targetSoloBudget)) * 100));

  // Calculate Shared Financials (all normalized to activeCurrency)
  let totalPaidUpfrontByMe = 0;
  let totalMyShare = 0;

  filteredShared.forEach((exp) => {
    const expAmountConverted = convertCurrency(exp.amount, exp.currency || 'USD', activeCurrency);
    const isPayer = exp.payerId === currentUser.id;
    const isSplit = exp.splitBetweenIds.includes(currentUser.id);
    const splitCount = Math.max(1, exp.splitBetweenIds.length);
    const share = expAmountConverted / splitCount;

    if (isPayer && !exp.settled) {
      totalPaidUpfrontByMe += expAmountConverted;
    }
    if (isSplit && !exp.settled) {
      totalMyShare += share;
    }
  });

  const netBalance = totalPaidUpfrontByMe - totalMyShare;

  const handleSoloSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(soloAmountStr);
    if (!soloTitle || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddSoloExpense({
      destination: soloDest,
      title: soloTitle,
      category: soloCategory,
      amount: parsedAmount,
      currency: soloCurrency,
      date: new Date().toISOString().split('T')[0],
      note: soloNote
    });

    setIsAddSoloModalOpen(false);
    setSoloTitle('');
    setSoloAmountStr('');
    setSoloNote('');
  };

  const handleSharedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(sharedAmountStr);
    if (!sharedTitle || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddSharedExpense({
      destination: sharedDest,
      title: sharedTitle,
      payerId: resolvePayerId(sharedPayer),
      amount: parsedAmount,
      currency: sharedCurrency,
      splitBetweenIds: sharedMembers.length > 0 ? sharedMembers : [currentUser.id],
      category: sharedCategory,
      date: new Date().toISOString().split('T')[0],
      receiptNote: sharedNote
    });

    setIsAddSharedModalOpen(false);
    setSharedTitle('');
    setSharedAmountStr('');
    setSharedNote('');
  };

  return (
    <div className="space-y-10">
      {/* Top Controls: Currency Basket Box & Destination Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              {lockedDestination ? getTranslation('tripCostsTitle') : getTranslation('costsTitle')}
            </h2>
            {lockedDestination && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {lockedDestination}
              </p>
            )}
          </div>

          {/* Destination Filter — hidden when the view is locked to one trip */}
          {!lockedDestination && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Destination:</span>
              <DestinationCombobox
                value={filterDestination}
                onChange={setFilterDestination}
                suggestions={availableDestinations}
                allowAll
                compact
              />
            </div>
          )}
        </div>

        {/* Currency Basket Box: 2 rows of 6 currencies as requested */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                ¥
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Currency Basket Box</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                    Active: {activeCurrency} ({activeCurrencyDef.symbol})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
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
                {fx.isLive ? 'Live exchange rates' : 'Estimated rates (offline)'}
              </span>
              <span>
                1 USD ≈ €{fmtRate(rateFor('EUR', fx))} ≈ ¥{fmtRate(rateFor('CNY', fx))} (CNY) ≈ ¥
                {fmtRate(rateFor('JPY', fx))} (JPY) ≈ £{fmtRate(rateFor('GBP', fx))}
              </span>
            </div>
          </div>

          {/* Row 1: 6 Primary Currencies (USD, EUR, CNY, JPY, GBP, CHF) */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {TOP_5_CURRENCIES.map((c) => {
                const isActive = activeCurrency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setActiveCurrency(c.code);
                      setSoloCurrency(c.code);
                      setSharedCurrency(c.code);
                    }}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-between shadow-xs ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold ring-2 ring-slate-900/20'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono">{c.symbol} {c.code}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: User Added Currencies (max 6) + Add Currency Button */}
          <div className="space-y-1 pt-2 border-t border-slate-200/70 dark:border-slate-700">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {customCurrencies.map((c) => {
                const isActive = activeCurrency === c.code;
                return (
                  <div
                    key={c.code}
                    className={`relative group rounded-lg transition-all flex items-center justify-between border ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold border-slate-900 dark:border-slate-100 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCurrency(c.code);
                        setSoloCurrency(c.code);
                        setSharedCurrency(c.code);
                      }}
                      className="px-3 py-2 text-xs flex-1 text-left cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-mono">{c.symbol} {c.code}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomCurrency(c.code);
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer mr-1"
                      title={`Remove ${c.code}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* Slot placeholder / Add Currency button in Row 2 */}
              {customCurrencies.length < 6 && (
                <button
                  type="button"
                  onClick={() => setIsAddCurrencyModalOpen(true)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-900 dark:hover:border-slate-200 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white/50 dark:bg-slate-900/50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Currency</span>
                </button>
              )}

              {/* Empty slot indicators if fewer than 6 */}
              {Array.from({ length: Math.max(0, 5 - customCurrencies.length) }).map((_, i) => (
                <div
                  key={`empty_${i}`}
                  className="hidden sm:flex px-3 py-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400 items-center justify-center font-mono"
                >
                  Empty Slot
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PART 1: YOUR OWN FINANCIALS FOR YOUR SOLO TRIP */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              Solo Financials
            </div>
            <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50 mt-0.5">
              Personal Solo Trip Budget ({activeCurrency})
            </h3>
          </div>

          <button
            onClick={() => setIsAddSoloModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:brightness-105 transition-colors shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Personal Expense</span>
          </button>
        </div>

        {/* Solo Financial Metric Cards with Editable Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Editable Total Trip Budget */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <span>Total Budget</span>
                <button
                  type="button"
                  onClick={() => {
                    setBudgetEditInput(String(targetBudgetUSD));
                    setIsEditingBudget(!isEditingBudget);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {isEditingBudget ? (
                <form onSubmit={handleSaveBudget} className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 font-mono">$</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={budgetEditInput}
                      onChange={(e) => setBudgetEditInput(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                      placeholder="USD budget..."
                    />
                  </div>
                  <div className="flex items-center gap-1 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingBudget(false)}
                      className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2 py-0.5 text-[10px] bg-slate-900 text-white rounded font-semibold cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatMoney(targetSoloBudget, activeCurrency)}
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Base: ${targetBudgetUSD.toLocaleString()} USD
            </div>
          </div>

          {/* 2. Total Solo Spent */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Solo Spent
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatMoney(totalSoloSpent, activeCurrency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {budgetPercentUsed}% of {formatMoney(targetSoloBudget, activeCurrency)} budget
            </div>
          </div>

          {/* 3. Budget Remaining */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Budget Remaining
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {formatMoney(budgetRemaining, activeCurrency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Available in {activeCurrency}
            </div>
          </div>

          {/* 4. Recorded Items */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recorded Items
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {filteredSolo.length} expenses
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              In {filterDestination === 'All' ? 'all destinations' : filterDestination.split(',')[0]}
            </div>
          </div>
        </div>

        {/* Solo Personal Expenses List with Swipe Left to Delete */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Solo Expense Breakdown</span>
          </div>

          {filteredSolo.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500">
              No personal expenses recorded for this destination yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {filteredSolo.map((exp) => {
                const converted = convertCurrency(exp.amount, exp.currency || 'USD', activeCurrency);

                return (
                  <div
                    key={exp.id}
                    className="relative overflow-hidden group bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:brightness-105/50 transition-colors"
                  >
                    <div className="p-3.5 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {exp.title}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>{exp.destination}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{exp.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{exp.date}</span>
                          {exp.note && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="italic text-slate-400">"{exp.note}"</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {formatMoney(converted, activeCurrency)}
                          </div>
                          {(exp.currency || 'USD').toUpperCase() !== activeCurrency && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Original: {exp.currency} {exp.amount.toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Delete Button (On Hover or Swipe) */}
                        <button
                          type="button"
                          onClick={() => onDeleteSoloExpense && onDeleteSoloExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Delete expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* PART 2: COMPANION SPLIT COST LEDGER */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Companion Splitting Ledger
            </div>
            <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50 mt-0.5">
              Shared Activity & Transport Receipts
            </h3>
          </div>

          <button
            onClick={() => setIsAddSharedModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:brightness-105 transition-colors shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Split New Expense</span>
          </button>
        </div>

        {/* Shared Financial Metrics in Unified Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Paid Upfront By You (Pending)
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatMoney(totalPaidUpfrontByMe, activeCurrency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              To be collected from companions
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Your Share of Group Costs
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {formatMoney(totalMyShare, activeCurrency)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Your portion of group receipts
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Net Balance
            </div>
            <div
              className={`mt-1 font-mono text-xl font-bold tabular-nums ${
                netBalance > 0.5
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : netBalance < -0.5
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {netBalance > 0.5
                ? `+${formatMoney(netBalance, activeCurrency)} (Owed to you)`
                : netBalance < -0.5
                ? `-${formatMoney(Math.abs(netBalance), activeCurrency)} (You owe)`
                : 'All Settled'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Equalized among companions
            </div>
          </div>
        </div>

        {/* Shared Expenses Table with Strike-Through for Settled & Swipe to Delete */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Recorded Shared Receipts</span>
          </div>

          {sortedShared.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500">
              No shared receipts recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedShared.map((exp) => {
                const payerName = payerDisplayName(exp.payerId);
                const splitCount = Math.max(1, exp.splitBetweenIds.length);
                const convertedTotal = convertCurrency(exp.amount, exp.currency || 'USD', activeCurrency);
                const convertedPerPerson = convertedTotal / splitCount;
                const amISplit = exp.splitBetweenIds.includes(currentUser.id);
                const isDifferentCurrency = (exp.currency || 'USD').toUpperCase() !== activeCurrency;

                return (
                  <div
                    key={exp.id}
                    className={`relative overflow-hidden group transition-colors rounded-xl border ${
                      exp.settled
                        ? 'bg-slate-50/80 dark:bg-slate-900/40 opacity-70 border-slate-200 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xs hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="p-3.5 sm:p-4">
                      {/* Top: title + meta chips on the left, amount on the right */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className={`font-semibold text-[13px] leading-snug break-words ${
                              exp.settled
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {exp.title}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {exp.destination}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                              {exp.category}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                              {exp.date}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-mono tabular-nums font-bold text-base ${
                              exp.settled ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {formatMoney(convertedTotal, activeCurrency)}
                          </div>
                          <div
                            className={`text-[11px] font-mono tabular-nums font-medium ${
                              amISplit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            {amISplit
                              ? `Your part: ${formatMoney(convertedPerPerson, activeCurrency)}`
                              : 'Not in split'}
                          </div>
                          {isDifferentCurrency && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Original: {exp.currency} {exp.amount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Receipt note gets its own full-width strip so nothing is cramped */}
                      {exp.receiptNote && (
                        <div className="mt-2 text-[11px] italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg px-2.5 py-1.5 break-words">
                          "{exp.receiptNote}"
                        </div>
                      )}

                      {/* Bottom: paid-by line + roomy action buttons (stack full-width on phones) */}
                      <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          Paid by <strong>{payerName}</strong> · Split {splitCount} ways (
                          {formatMoney(convertedPerPerson, activeCurrency)}/person)
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onToggleSharedSettled(exp.id)}
                            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer text-center ${
                              exp.settled
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {exp.settled ? 'Settled ✓' : 'Mark Settled'}
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteSharedExpense && onDeleteSharedExpense(exp.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Delete shared receipt"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Add Custom Currency Modal (Row 2 Picker) */}
      {isAddCurrencyModalOpen && (
        <div className="wl-modal-overlay">
          <div className="wl-modal-card max-w-md p-6 relative text-xs space-y-4">
            <button
              onClick={() => setIsAddCurrencyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-display font-bold text-base text-slate-950 dark:text-slate-50">
              Add Currency to Row 2 Basket (Max 6)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose from popular world travel currencies or enter a custom currency.
            </p>

            {/* Alphabetical World Currencies with Search Bar on top */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                  All World Currencies (Alphabetical · Search Code, Name, or Country):
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {WORLD_CURRENCIES.length} Currencies
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search currency code (e.g. JPY, EUR), name, or country (e.g. Japan, Mexico, Switzerland)..."
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-800/40">
                {WORLD_CURRENCIES.filter((c) => {
                  if (!currencySearch.trim()) return true;
                  const q = currencySearch.toLowerCase();
                  return (
                    c.code.toLowerCase().includes(q) ||
                    c.name.toLowerCase().includes(q) ||
                    c.country.toLowerCase().includes(q)
                  );
                }).map((cur) => {
                  const alreadyIn = allKnownCurrencies.some((c) => c.code === cur.code);
                  return (
                    <button
                      key={cur.code}
                      type="button"
                      disabled={alreadyIn}
                      onClick={() =>
                        handleAddCustomCurrency({
                          code: cur.code,
                          name: cur.name,
                          symbol: cur.symbol,
                          rate: cur.rate
                        })
                      }
                      className={`w-full p-2 rounded-lg text-left flex items-center justify-between text-xs transition-colors ${
                        alreadyIn
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800'
                          : 'hover:bg-white dark:hover:brightness-105 bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="font-bold font-mono text-slate-900 dark:text-slate-100 shrink-0">
                          {cur.code} ({cur.symbol})
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                          {cur.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          · {cur.country}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {alreadyIn ? 'In Basket' : '+ Add'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                Or Define Custom Currency:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Code (3-letter)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. CHF"
                    value={customCodeInput}
                    onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. Fr."
                    value={customSymbolInput}
                    onChange={(e) => setCustomSymbolInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Rate / 1 USD</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customRateInput}
                    onChange={(e) => setCustomRateInput(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!customCodeInput) return;
                  handleAddCustomCurrency({
                    code: customCodeInput,
                    name: customCodeInput,
                    symbol: customSymbolInput || customCodeInput,
                    rate: customRateInput || 1.0
                  });
                  setCustomCodeInput('');
                  setCustomSymbolInput('');
                }}
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:brightness-105 cursor-pointer"
              >
                Add Custom Currency to Row 2
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Solo Expense Modal */}
      {isAddSoloModalOpen && (
        <div className="wl-modal-overlay">
          <div className="wl-modal-card max-w-md p-6 relative">
            <button
              onClick={() => setIsAddSoloModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
              Add Personal Solo Expense
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Record individual flight, hotel, transit, or daily food expense for your solo trip.
            </p>

            <form onSubmit={handleSoloSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Return Flight or Hotel Reservation"
                  value={soloTitle}
                  onChange={(e) => setSoloTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={soloAmountStr}
                    onChange={(e) => setSoloAmountStr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={soloCurrency}
                    onChange={(e) => setSoloCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    {allKnownCurrencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={soloCategory}
                    onChange={(e) => setSoloCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Flights & Rail">Flights & Rail</option>
                    <option value="Lodging / Hotel">Lodging / Hotel</option>
                    <option value="Daily Food & Cafes">Daily Food & Cafes</option>
                    <option value="Local Transit">Local Transit</option>
                    <option value="Sightseeing & Passes">Sightseeing & Passes</option>
                    <option value="Gear & Misc">Gear & Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination
                  </label>
                  {lockedDestination ? (
                    <div className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {lockedDestination}
                    </div>
                  ) : (
                    <DestinationCombobox
                      value={soloDest}
                      onChange={setSoloDest}
                      suggestions={availableDestinations}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Booked via airline website or local booking"
                  value={soloNote}
                  onChange={(e) => setSoloNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddSoloModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:brightness-105 cursor-pointer shadow-xs"
                >
                  Save Personal Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Shared Expense Modal */}
      {isAddSharedModalOpen && (
        <div className="wl-modal-overlay">
          <div className="wl-modal-card max-w-md p-6 relative">
            <button
              onClick={() => setIsAddSharedModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
              Split Shared Companion Expense
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Record a taxi ride, shared tour, meal, or boat rental to split equally with companions.
            </p>

            <form onSubmit={handleSharedSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Shared Expense Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taxi to Otagi Shrine or Private Boat Rental"
                  value={sharedTitle}
                  onChange={(e) => setSharedTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={sharedAmountStr}
                    onChange={(e) => setSharedAmountStr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Currency
                  </label>
                  <select
                    value={sharedCurrency}
                    onChange={(e) => setSharedCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    {allKnownCurrencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paid Upfront By
                  </label>
                  <input
                    type="text"
                    value={sharedPayer}
                    onChange={(e) => setSharedPayer(e.target.value)}
                    placeholder="Write a name (e.g. Elena)"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Leave blank if you paid — or write any name.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={sharedCategory}
                    onChange={(e) => setSharedCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="Transport">Transport</option>
                    <option value="Tour / Guide">Tour / Guide</option>
                    <option value="Rental & Fuel">Rental & Fuel</option>
                    <option value="Shared Meal">Shared Meal</option>
                    <option value="Tickets & Passes">Tickets & Passes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination
                </label>
                {lockedDestination ? (
                  <div className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {lockedDestination}
                  </div>
                ) : (
                  <DestinationCombobox
                    value={sharedDest}
                    onChange={setSharedDest}
                    suggestions={availableDestinations}
                  />
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddSharedModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:brightness-105 cursor-pointer shadow-xs"
                >
                  Record Shared Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
