import React, { useEffect, useRef, useState } from 'react';
import { Flag, Map, MapPin } from 'lucide-react';
import { searchPlaces, startWorldGeoLoad, worldGeoLoaded, WorldGeoHit } from '../utils/worldGeo';

interface PlaceTypeaheadProps {
  value: string;
  onChange: (v: string) => void;
  /** Called when the traveller picks a suggestion (value is already set). */
  onPick?: (hit: WorldGeoHit) => void;
  /** Enter with no dropdown open (or on the highlighted row) — e.g. advance. */
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
  /** Classes for the outer wrapper (flex-1 etc. when the box sits in a row). */
  wrapperClassName?: string;
  autoFocus?: boolean;
}

const KindIcon: React.FC<{ kind: WorldGeoHit['kind'] }> = ({ kind }) =>
  kind === 'country' ? (
    <Flag className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
  ) : kind === 'region' ? (
    <Map className="w-3.5 h-3.5 shrink-0 text-sky-500" />
  ) : (
    <MapPin className="w-3.5 h-3.5 shrink-0 text-violet-500" />
  );

/**
 * Destination text box with real place suggestions from the offline world
 * gazetteer: type "bucha" and pick "Bucharest, Romania" so the guide, the
 * map and the weather all anchor to the exact right place — no more typing a
 * name the app can't find. Keyboard: ↑/↓ to move, Enter to take the pick.
 */
export const PlaceTypeahead: React.FC<PlaceTypeaheadProps> = ({
  value,
  onChange,
  onPick,
  onEnter,
  placeholder,
  className,
  wrapperClassName,
  autoFocus
}) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WorldGeoHit[]>([]);
  const [active, setActive] = useState(-1);
  const [readyTick, setReadyTick] = useState(0);
  const debounceRef = useRef<number | null>(null);
  const skipNextSearch = useRef(false);

  // The gazetteer loads lazily — re-run the search once it lands.
  useEffect(() => {
    if (worldGeoLoaded()) return;
    let alive = true;
    void startWorldGeoLoad().then(() => {
      if (alive) setReadyTick((v) => v + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => {
      const hits = searchPlaces(q, 8);
      setItems(hits);
      setActive(-1);
      setOpen(hits.length > 0);
    }, 160);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, readyTick]);

  const pick = (hit: WorldGeoHit) => {
    skipNextSearch.current = true;
    const label = hit.kind === 'country' ? hit.name : `${hit.name}, ${hit.countryName}`;
    onChange(label);
    setOpen(false);
    setItems([]);
    onPick?.(hit);
  };

  return (
    <div className={`relative ${wrapperClassName || ''}`}>
      <input
        autoFocus={autoFocus}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && open) {
            e.preventDefault();
            setActive((a) => Math.min(items.length - 1, a + 1));
          } else if (e.key === 'ArrowUp' && open) {
            e.preventDefault();
            setActive((a) => Math.max(-1, a - 1));
          } else if (e.key === 'Enter') {
            if (open && active >= 0 && items[active]) {
              e.preventDefault();
              pick(items[active]);
            } else {
              setOpen(false);
              onEnter?.();
            }
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className={className}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {items.map((hit, i) => (
            <button
              key={`${hit.kind}|${hit.name}|${hit.cc}|${i}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(hit);
              }}
              onMouseEnter={() => setActive(i)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                i === active ? 'bg-violet-50 dark:bg-violet-950/40' : 'hover:bg-stone-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <KindIcon kind={hit.kind} />
              <span className="flex-1 min-w-0 text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                {hit.name}
                {hit.kind !== 'country' && (
                  <span className="font-medium text-stone-400 dark:text-stone-500"> · {hit.countryName}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceTypeahead;
