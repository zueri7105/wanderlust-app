import React from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

export type NavTab =
  | 'explore'
  | 'itinerary'
  | 'matcher'
  | 'map'
  | 'stories'
  | 'messages'
  | 'activities'
  | 'costs'
  | 'profile'
  | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenCreateTrip: () => void;
  onOpenSOS: () => void;
  openActivitiesCount: number;
  starredCompanionsCount?: number;
  totalConversationsCount?: number;
  selectedDestination?: string;
  onClearDestination?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenSOS,
  openActivitiesCount,
  starredCompanionsCount = 0,
  totalConversationsCount = 0,
  selectedDestination,
  onClearDestination
}) => {
  const isFiltered = selectedDestination && selectedDestination !== 'All Destinations';

  // Merged hubs: Messages lives inside Companions, Stories inside Activities —
  // so the top bar stays lean.
  const hl = (tab: NavTab) =>
    activeTab === tab ||
    (tab === 'matcher' && activeTab === 'messages') ||
    (tab === 'activities' && activeTab === 'stories');

  const desktopBtn = (tab: NavTab) =>
    `whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
      hl(tab)
        ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
    }`;

  const mobileBtn = (tab: NavTab) =>
    `px-2.5 py-1.5 rounded whitespace-nowrap cursor-pointer ${
      hl(tab)
        ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
        : 'text-slate-600 dark:text-slate-400'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Brand */}
          <button
            onClick={() => onSelectTab('explore')}
            className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 dark:from-rose-400 dark:to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-xs tracking-tight">
              W
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-slate-950 dark:text-slate-50 tracking-tight leading-none group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                WanderLust
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                {getTranslation('soloGroupTravel')}
              </span>
            </div>
          </button>

          {/* Desktop links */}
          <nav className="hidden xl:flex items-center gap-5 text-sm font-medium">
            <button onClick={() => onSelectTab('explore')} className={desktopBtn('explore')}>
              {getTranslation('explore')}
            </button>
            <button onClick={() => onSelectTab('itinerary')} className={desktopBtn('itinerary')}>
              {getTranslation('itinerary')}
            </button>
            <button onClick={() => onSelectTab('costs')} className={desktopBtn('costs')}>
              {getTranslation('costs')}
            </button>
            <button onClick={() => onSelectTab('matcher')} className={`${desktopBtn('matcher')} flex items-center gap-1.5`}>
              <span>{getTranslation('matcher')}</span>
              {starredCompanionsCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 rounded-full font-mono font-medium">
                  ★{starredCompanionsCount}
                </span>
              )}
              {totalConversationsCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800 rounded-full font-mono font-medium">
                  {totalConversationsCount}
                </span>
              )}
            </button>
            <button onClick={() => onSelectTab('map')} className={desktopBtn('map')}>
              {getTranslation('map')}
            </button>
            <button onClick={() => onSelectTab('activities')} className={desktopBtn('activities')}>
              {getTranslation('activities')}
              {openActivitiesCount > 0 && (
                <span className="ml-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  ({openActivitiesCount})
                </span>
              )}
            </button>
            <button onClick={() => onSelectTab('profile')} className={desktopBtn('profile')}>
              {getTranslation('profile')}
            </button>
          </nav>

          {/* SOS */}
          <div className="flex items-center gap-3 shrink-0">
            {isFiltered && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300">
                <span className="text-slate-400">Filtered:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedDestination.split(',')[0]}</span>
                {onClearDestination && (
                  <button
                    onClick={onClearDestination}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-0.5 p-0.5 rounded cursor-pointer"
                    title="Clear destination filter to view all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            <button
              onClick={onOpenSOS}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors rounded-lg shadow-sm whitespace-nowrap shrink-0 cursor-pointer ring-2 ring-red-600/30"
              title="Emergency SOS GPS Tracking & Consular Assistance"
            >
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>{getTranslation('sosHelp')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile strip */}
      <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-medium scrollbar-none">
        <button onClick={() => onSelectTab('explore')} className={mobileBtn('explore')}>
          {getTranslation('explore')}
        </button>
        <button onClick={() => onSelectTab('itinerary')} className={mobileBtn('itinerary')}>
          {getTranslation('itinerary')}
        </button>
        <button onClick={() => onSelectTab('costs')} className={mobileBtn('costs')}>
          {getTranslation('costs')}
        </button>
        <button onClick={() => onSelectTab('matcher')} className={mobileBtn('matcher')}>
          {getTranslation('matcher')}
          {totalConversationsCount > 0 && <span> ({totalConversationsCount})</span>}
        </button>
        <button onClick={() => onSelectTab('map')} className={mobileBtn('map')}>
          {getTranslation('map')}
        </button>
        <button onClick={() => onSelectTab('activities')} className={mobileBtn('activities')}>
          {getTranslation('activities')} ({openActivitiesCount})
        </button>
        <button onClick={() => onSelectTab('profile')} className={mobileBtn('profile')}>
          {getTranslation('profile')}
        </button>
      </div>
    </header>
  );
};
