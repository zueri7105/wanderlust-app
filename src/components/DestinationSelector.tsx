import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Globe, Check, ChevronDown } from 'lucide-react';

export interface DestinationCountry {
  country: string;
  continent: 'Asia' | 'Europe' | 'North America' | 'South America' | 'Africa & Middle East' | 'Oceania';
  popular?: boolean;
}

// Full list of destination countries categorized into continents, sorted alphabetically
export const WORLD_COUNTRIES: DestinationCountry[] = [
  // Asia
  { country: 'Cambodia', continent: 'Asia' },
  { country: 'China', continent: 'Asia', popular: true },
  { country: 'India', continent: 'Asia', popular: true },
  { country: 'Indonesia', continent: 'Asia', popular: true },
  { country: 'Japan', continent: 'Asia', popular: true },
  { country: 'Laos', continent: 'Asia' },
  { country: 'Malaysia', continent: 'Asia' },
  { country: 'Maldives', continent: 'Asia' },
  { country: 'Nepal', continent: 'Asia' },
  { country: 'Philippines', continent: 'Asia' },
  { country: 'Singapore', continent: 'Asia', popular: true },
  { country: 'South Korea', continent: 'Asia', popular: true },
  { country: 'Sri Lanka', continent: 'Asia' },
  { country: 'Taiwan', continent: 'Asia' },
  { country: 'Thailand', continent: 'Asia', popular: true },
  { country: 'Vietnam', continent: 'Asia', popular: true },

  // Europe
  { country: 'Austria', continent: 'Europe' },
  { country: 'Belgium', continent: 'Europe' },
  { country: 'Croatia', continent: 'Europe', popular: true },
  { country: 'Czech Republic', continent: 'Europe' },
  { country: 'Denmark', continent: 'Europe' },
  { country: 'Finland', continent: 'Europe' },
  { country: 'France', continent: 'Europe', popular: true },
  { country: 'Germany', continent: 'Europe', popular: true },
  { country: 'Greece', continent: 'Europe', popular: true },
  { country: 'Hungary', continent: 'Europe' },
  { country: 'Iceland', continent: 'Europe', popular: true },
  { country: 'Ireland', continent: 'Europe' },
  { country: 'Italy', continent: 'Europe', popular: true },
  { country: 'Netherlands', continent: 'Europe' },
  { country: 'Norway', continent: 'Europe' },
  { country: 'Poland', continent: 'Europe' },
  { country: 'Portugal', continent: 'Europe', popular: true },
  { country: 'Spain', continent: 'Europe', popular: true },
  { country: 'Sweden', continent: 'Europe' },
  { country: 'Switzerland', continent: 'Europe', popular: true },
  { country: 'United Kingdom', continent: 'Europe', popular: true },

  // North America
  { country: 'Canada', continent: 'North America', popular: true },
  { country: 'Costa Rica', continent: 'North America', popular: true },
  { country: 'Cuba', continent: 'North America' },
  { country: 'Dominican Republic', continent: 'North America' },
  { country: 'Guatemala', continent: 'North America' },
  { country: 'Jamaica', continent: 'North America' },
  { country: 'Mexico', continent: 'North America', popular: true },
  { country: 'Panama', continent: 'North America' },
  { country: 'United States', continent: 'North America', popular: true },

  // South America
  { country: 'Argentina', continent: 'South America', popular: true },
  { country: 'Bolivia', continent: 'South America' },
  { country: 'Brazil', continent: 'South America', popular: true },
  { country: 'Chile', continent: 'South America', popular: true },
  { country: 'Colombia', continent: 'South America', popular: true },
  { country: 'Ecuador', continent: 'South America' },
  { country: 'Peru', continent: 'South America', popular: true },
  { country: 'Uruguay', continent: 'South America' },

  // Africa & Middle East
  { country: 'Egypt', continent: 'Africa & Middle East', popular: true },
  { country: 'Jordan', continent: 'Africa & Middle East' },
  { country: 'Kenya', continent: 'Africa & Middle East', popular: true },
  { country: 'Morocco', continent: 'Africa & Middle East', popular: true },
  { country: 'South Africa', continent: 'Africa & Middle East', popular: true },
  { country: 'Tanzania', continent: 'Africa & Middle East' },
  { country: 'Tunisia', continent: 'Africa & Middle East' },
  { country: 'Turkey / Türkiye', continent: 'Africa & Middle East', popular: true },
  { country: 'United Arab Emirates', continent: 'Africa & Middle East', popular: true },

  // Oceania
  { country: 'Australia', continent: 'Oceania', popular: true },
  { country: 'Fiji', continent: 'Oceania' },
  { country: 'New Zealand', continent: 'Oceania', popular: true },
  { country: 'Samoa', continent: 'Oceania' }
];

export const CONTINENTS = [
  'All Continents',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Africa & Middle East',
  'Oceania'
] as const;

interface DestinationSelectorProps {
  value: string;
  onChange: (country: string) => void;
  className?: string;
  placeholder?: string;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Search country or continent...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('All Continents');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter countries based on search term and continent
  const filteredCountries = WORLD_COUNTRIES.filter((item) => {
    const matchesContinent =
      selectedContinent === 'All Continents' || item.continent === selectedContinent;

    if (!matchesContinent) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    return item.country.toLowerCase().includes(term) || item.continent.toLowerCase().includes(term);
  });

  // Group by continent
  const countriesByContinent: Record<string, DestinationCountry[]> = {};
  filteredCountries.forEach((p) => {
    if (!countriesByContinent[p.continent]) {
      countriesByContinent[p.continent] = [];
    }
    countriesByContinent[p.continent].push(p);
  });

  // Sort countries alphabetically within each continent
  Object.keys(countriesByContinent).forEach((cont) => {
    countriesByContinent[cont].sort((a, b) => a.country.localeCompare(b.country));
  });

  const handleSelect = (countryName: string) => {
    onChange(countryName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const isAllDestinations = !value || value === 'All Destinations';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-2xs font-medium cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2 truncate">
          <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="truncate">
            {isAllDestinations ? 'All Destinations' : value}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[380px] mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Small Search Bar on Top as requested */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Continent Pills */}
            <div className="flex gap-1 overflow-x-auto pt-2 scrollbar-none pb-0.5 text-[11px]">
              {CONTINENTS.map((cont) => (
                <button
                  key={cont}
                  type="button"
                  onClick={() => setSelectedContinent(cont)}
                  className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer font-medium ${
                    selectedContinent === cont
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {cont}
                </button>
              ))}
            </div>
          </div>

          {/* List of Countries Categorized into Continents */}
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
            {/* All Destinations Option */}
            <div className="pb-1.5">
              <button
                type="button"
                onClick={() => handleSelect('All Destinations')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                  isAllDestinations
                    ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-950 dark:text-slate-50'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:brightness-105/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>All Destinations (Global)</span>
                </div>
                {isAllDestinations && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            </div>

            {/* Categorized Continents with Alphabetical Countries */}
            {Object.keys(countriesByContinent).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No countries match "{searchTerm}"
              </div>
            ) : (
              Object.entries(countriesByContinent).map(([continent, countryList]) => (
                <div key={continent} className="pt-2">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {continent} ({countryList.length})
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {countryList.map((item) => {
                      const isSelected = value === item.country;
                      return (
                        <button
                          key={item.country}
                          type="button"
                          onClick={() => handleSelect(item.country)}
                          className={`flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left ${
                            isSelected
                              ? 'bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold'
                              : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:brightness-105'
                          }`}
                        >
                          <span className="truncate">{item.country}</span>
                          {isSelected && <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-600 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
