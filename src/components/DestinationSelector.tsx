import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Globe, Check, ChevronDown } from 'lucide-react';
import { searchCities } from '../data/cityIndex';

export interface DestinationCountry {
  country: string;
  continent: 'Asia' | 'Europe' | 'North America' | 'South America' | 'Africa & Middle East' | 'Oceania';
  popular?: boolean;
}

// Full list of destination countries categorized into continents, sorted alphabetically
export const WORLD_COUNTRIES: DestinationCountry[] = [
  // Asia (33)
  { country: 'Afghanistan', continent: 'Asia' },
  { country: 'Armenia', continent: 'Asia' },
  { country: 'Azerbaijan', continent: 'Asia' },
  { country: 'Bangladesh', continent: 'Asia' },
  { country: 'Bhutan', continent: 'Asia' },
  { country: 'Brunei', continent: 'Asia' },
  { country: 'Cambodia', continent: 'Asia' },
  { country: 'China', continent: 'Asia', popular: true },
  { country: 'Georgia', continent: 'Asia' },
  { country: 'India', continent: 'Asia', popular: true },
  { country: 'Indonesia', continent: 'Asia', popular: true },
  { country: 'Japan', continent: 'Asia', popular: true },
  { country: 'Kazakhstan', continent: 'Asia' },
  { country: 'Kyrgyzstan', continent: 'Asia' },
  { country: 'Laos', continent: 'Asia' },
  { country: 'Malaysia', continent: 'Asia', popular: true },
  { country: 'Maldives', continent: 'Asia' },
  { country: 'Mongolia', continent: 'Asia' },
  { country: 'Myanmar', continent: 'Asia' },
  { country: 'Nepal', continent: 'Asia', popular: true },
  { country: 'North Korea', continent: 'Asia' },
  { country: 'Pakistan', continent: 'Asia' },
  { country: 'Philippines', continent: 'Asia', popular: true },
  { country: 'Singapore', continent: 'Asia', popular: true },
  { country: 'South Korea', continent: 'Asia', popular: true },
  { country: 'Sri Lanka', continent: 'Asia' },
  { country: 'Taiwan', continent: 'Asia' },
  { country: 'Tajikistan', continent: 'Asia' },
  { country: 'Thailand', continent: 'Asia', popular: true },
  { country: 'Timor-Leste', continent: 'Asia' },
  { country: 'Turkmenistan', continent: 'Asia' },
  { country: 'Uzbekistan', continent: 'Asia' },
  { country: 'Vietnam', continent: 'Asia', popular: true },
  // Europe (47)
  { country: 'Albania', continent: 'Europe' },
  { country: 'Andorra', continent: 'Europe' },
  { country: 'Austria', continent: 'Europe', popular: true },
  { country: 'Belarus', continent: 'Europe' },
  { country: 'Belgium', continent: 'Europe' },
  { country: 'Bosnia and Herzegovina', continent: 'Europe' },
  { country: 'Bulgaria', continent: 'Europe' },
  { country: 'Croatia', continent: 'Europe', popular: true },
  { country: 'Cyprus', continent: 'Europe' },
  { country: 'Czechia', continent: 'Europe', popular: true },
  { country: 'Denmark', continent: 'Europe' },
  { country: 'Estonia', continent: 'Europe' },
  { country: 'Finland', continent: 'Europe' },
  { country: 'France', continent: 'Europe', popular: true },
  { country: 'Germany', continent: 'Europe', popular: true },
  { country: 'Greece', continent: 'Europe', popular: true },
  { country: 'Hungary', continent: 'Europe' },
  { country: 'Iceland', continent: 'Europe', popular: true },
  { country: 'Ireland', continent: 'Europe' },
  { country: 'Italy', continent: 'Europe', popular: true },
  { country: 'Kosovo', continent: 'Europe' },
  { country: 'Latvia', continent: 'Europe' },
  { country: 'Liechtenstein', continent: 'Europe' },
  { country: 'Lithuania', continent: 'Europe' },
  { country: 'Luxembourg', continent: 'Europe' },
  { country: 'Malta', continent: 'Europe' },
  { country: 'Moldova', continent: 'Europe' },
  { country: 'Monaco', continent: 'Europe' },
  { country: 'Montenegro', continent: 'Europe' },
  { country: 'Netherlands', continent: 'Europe', popular: true },
  { country: 'North Macedonia', continent: 'Europe' },
  { country: 'Norway', continent: 'Europe', popular: true },
  { country: 'Poland', continent: 'Europe' },
  { country: 'Portugal', continent: 'Europe', popular: true },
  { country: 'Romania', continent: 'Europe' },
  { country: 'Russia', continent: 'Europe' },
  { country: 'San Marino', continent: 'Europe' },
  { country: 'Serbia', continent: 'Europe' },
  { country: 'Slovakia', continent: 'Europe' },
  { country: 'Slovenia', continent: 'Europe' },
  { country: 'Spain', continent: 'Europe', popular: true },
  { country: 'Sweden', continent: 'Europe' },
  { country: 'Switzerland', continent: 'Europe', popular: true },
  { country: 'Turkey', continent: 'Europe' },
  { country: 'Ukraine', continent: 'Europe' },
  { country: 'United Kingdom', continent: 'Europe', popular: true },
  { country: 'Vatican City', continent: 'Europe' },
  // North America (23)
  { country: 'Antigua and Barbuda', continent: 'North America' },
  { country: 'Bahamas', continent: 'North America' },
  { country: 'Barbados', continent: 'North America' },
  { country: 'Belize', continent: 'North America' },
  { country: 'Canada', continent: 'North America', popular: true },
  { country: 'Costa Rica', continent: 'North America', popular: true },
  { country: 'Cuba', continent: 'North America', popular: true },
  { country: 'Dominica', continent: 'North America' },
  { country: 'Dominican Republic', continent: 'North America' },
  { country: 'El Salvador', continent: 'North America' },
  { country: 'Grenada', continent: 'North America' },
  { country: 'Guatemala', continent: 'North America' },
  { country: 'Haiti', continent: 'North America' },
  { country: 'Honduras', continent: 'North America' },
  { country: 'Jamaica', continent: 'North America', popular: true },
  { country: 'Mexico', continent: 'North America', popular: true },
  { country: 'Nicaragua', continent: 'North America' },
  { country: 'Panama', continent: 'North America' },
  { country: 'Saint Kitts and Nevis', continent: 'North America' },
  { country: 'Saint Lucia', continent: 'North America' },
  { country: 'Saint Vincent and the Grenadines', continent: 'North America' },
  { country: 'Trinidad and Tobago', continent: 'North America' },
  { country: 'United States', continent: 'North America', popular: true },
  // South America (12)
  { country: 'Argentina', continent: 'South America', popular: true },
  { country: 'Bolivia', continent: 'South America' },
  { country: 'Brazil', continent: 'South America', popular: true },
  { country: 'Chile', continent: 'South America', popular: true },
  { country: 'Colombia', continent: 'South America', popular: true },
  { country: 'Ecuador', continent: 'South America' },
  { country: 'Guyana', continent: 'South America' },
  { country: 'Paraguay', continent: 'South America' },
  { country: 'Peru', continent: 'South America', popular: true },
  { country: 'Suriname', continent: 'South America' },
  { country: 'Uruguay', continent: 'South America' },
  { country: 'Venezuela', continent: 'South America' },
  // Africa & Middle East (68)
  { country: 'Algeria', continent: 'Africa & Middle East' },
  { country: 'Angola', continent: 'Africa & Middle East' },
  { country: 'Bahrain', continent: 'Africa & Middle East' },
  { country: 'Benin', continent: 'Africa & Middle East' },
  { country: 'Botswana', continent: 'Africa & Middle East' },
  { country: 'Burkina Faso', continent: 'Africa & Middle East' },
  { country: 'Burundi', continent: 'Africa & Middle East' },
  { country: 'Cabo Verde', continent: 'Africa & Middle East' },
  { country: 'Cameroon', continent: 'Africa & Middle East' },
  { country: 'Central African Republic', continent: 'Africa & Middle East' },
  { country: 'Chad', continent: 'Africa & Middle East' },
  { country: 'Comoros', continent: 'Africa & Middle East' },
  { country: "Côte d'Ivoire", continent: 'Africa & Middle East' },
  { country: 'Democratic Republic of the Congo', continent: 'Africa & Middle East' },
  { country: 'Djibouti', continent: 'Africa & Middle East' },
  { country: 'Egypt', continent: 'Africa & Middle East', popular: true },
  { country: 'Equatorial Guinea', continent: 'Africa & Middle East' },
  { country: 'Eritrea', continent: 'Africa & Middle East' },
  { country: 'Eswatini', continent: 'Africa & Middle East' },
  { country: 'Ethiopia', continent: 'Africa & Middle East' },
  { country: 'Gabon', continent: 'Africa & Middle East' },
  { country: 'Gambia', continent: 'Africa & Middle East' },
  { country: 'Ghana', continent: 'Africa & Middle East' },
  { country: 'Guinea', continent: 'Africa & Middle East' },
  { country: 'Guinea-Bissau', continent: 'Africa & Middle East' },
  { country: 'Iran', continent: 'Africa & Middle East' },
  { country: 'Iraq', continent: 'Africa & Middle East' },
  { country: 'Israel', continent: 'Africa & Middle East', popular: true },
  { country: 'Jordan', continent: 'Africa & Middle East', popular: true },
  { country: 'Kenya', continent: 'Africa & Middle East', popular: true },
  { country: 'Kuwait', continent: 'Africa & Middle East' },
  { country: 'Lebanon', continent: 'Africa & Middle East' },
  { country: 'Lesotho', continent: 'Africa & Middle East' },
  { country: 'Liberia', continent: 'Africa & Middle East' },
  { country: 'Libya', continent: 'Africa & Middle East' },
  { country: 'Madagascar', continent: 'Africa & Middle East' },
  { country: 'Malawi', continent: 'Africa & Middle East' },
  { country: 'Mali', continent: 'Africa & Middle East' },
  { country: 'Mauritania', continent: 'Africa & Middle East' },
  { country: 'Mauritius', continent: 'Africa & Middle East' },
  { country: 'Morocco', continent: 'Africa & Middle East', popular: true },
  { country: 'Mozambique', continent: 'Africa & Middle East' },
  { country: 'Namibia', continent: 'Africa & Middle East' },
  { country: 'Niger', continent: 'Africa & Middle East' },
  { country: 'Nigeria', continent: 'Africa & Middle East' },
  { country: 'Oman', continent: 'Africa & Middle East' },
  { country: 'Palestine', continent: 'Africa & Middle East' },
  { country: 'Qatar', continent: 'Africa & Middle East' },
  { country: 'Republic of the Congo', continent: 'Africa & Middle East' },
  { country: 'Rwanda', continent: 'Africa & Middle East' },
  { country: 'Saudi Arabia', continent: 'Africa & Middle East' },
  { country: 'Senegal', continent: 'Africa & Middle East' },
  { country: 'Seychelles', continent: 'Africa & Middle East' },
  { country: 'Sierra Leone', continent: 'Africa & Middle East' },
  { country: 'Somalia', continent: 'Africa & Middle East' },
  { country: 'South Africa', continent: 'Africa & Middle East', popular: true },
  { country: 'South Sudan', continent: 'Africa & Middle East' },
  { country: 'Sudan', continent: 'Africa & Middle East' },
  { country: 'Syria', continent: 'Africa & Middle East' },
  { country: 'São Tomé and Príncipe', continent: 'Africa & Middle East' },
  { country: 'Tanzania', continent: 'Africa & Middle East', popular: true },
  { country: 'Togo', continent: 'Africa & Middle East' },
  { country: 'Tunisia', continent: 'Africa & Middle East' },
  { country: 'Uganda', continent: 'Africa & Middle East' },
  { country: 'United Arab Emirates', continent: 'Africa & Middle East', popular: true },
  { country: 'Yemen', continent: 'Africa & Middle East' },
  { country: 'Zambia', continent: 'Africa & Middle East' },
  { country: 'Zimbabwe', continent: 'Africa & Middle East' },
  // Oceania (14)
  { country: 'Australia', continent: 'Oceania', popular: true },
  { country: 'Fiji', continent: 'Oceania', popular: true },
  { country: 'Kiribati', continent: 'Oceania' },
  { country: 'Marshall Islands', continent: 'Oceania' },
  { country: 'Micronesia', continent: 'Oceania' },
  { country: 'Nauru', continent: 'Oceania' },
  { country: 'New Zealand', continent: 'Oceania', popular: true },
  { country: 'Palau', continent: 'Oceania' },
  { country: 'Papua New Guinea', continent: 'Oceania' },
  { country: 'Samoa', continent: 'Oceania' },
  { country: 'Solomon Islands', continent: 'Oceania' },
  { country: 'Tonga', continent: 'Oceania' },
  { country: 'Tuvalu', continent: 'Oceania' },
  { country: 'Vanuatu', continent: 'Oceania' },
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Portal dropdown position — fixed to the trigger's viewport rect so the
  // dropdown is NEVER clipped by overflow-hidden/rounded parent containers.
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number; width: number }>({
    left: 0,
    top: 0,
    width: 320
  });

  const updateDropdownPos = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const width = Math.min(Math.max(rect.width, 320), vw - 16, 400);
    const left = Math.max(8, Math.min(rect.left, vw - width - 8));
    setDropdownPos({ left, top: rect.bottom + 6, width });
  };

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPos();
    window.addEventListener('scroll', updateDropdownPos, true);
    window.addEventListener('resize', updateDropdownPos);
    return () => {
      window.removeEventListener('scroll', updateDropdownPos, true);
      window.removeEventListener('resize', updateDropdownPos);
    };
  }, [isOpen]);

  // Close on outside click (dropdown is portaled to <body>, so check both refs)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
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

  // City search (hidden city index): "barcelon" → "Barcelona, Spain"
  const cityMatches = searchTerm.trim().length >= 2 ? searchCities(searchTerm, 6) : [];

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

      {/* Dropdown Menu — portaled to <body> so overflow-hidden parents can't clip it */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ left: dropdownPos.left, top: dropdownPos.top, width: dropdownPos.width }}
            className="fixed z-[1000] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          >
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
                      ? 'bg-rose-600 text-white font-semibold'
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

            {/* Matching cities (hidden city index) — shown above countries while typing */}
            {cityMatches.length > 0 && (
              <div className="pb-1.5">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Cities
                </div>
                {cityMatches.map((cm) => {
                  const label = `${cm.city}, ${cm.country}`;
                  const isSelected = value === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSelect(label)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white font-bold'
                          : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:brightness-105'
                      }`}
                    >
                      <span className="truncate">
                        <span className="font-bold">{cm.city}</span>
                        <span className="text-slate-500 dark:text-slate-400">, {cm.country}</span>
                      </span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Categorized Continents with Alphabetical Countries */}
            {Object.keys(countriesByContinent).length === 0 && cityMatches.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No countries or cities match "{searchTerm}"
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
                              ? 'bg-rose-600 text-white font-bold'
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
          </div>,
          document.body
        )}
    </div>
  );
};
