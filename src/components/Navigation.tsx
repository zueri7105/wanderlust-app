import React from 'react';
import { ShieldAlert, ChevronDown } from 'lucide-react';
import { getTranslation } from '../utils/i18n';
import { SoloTraveler } from '../types/travel';

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
  currentUser?: SoloTraveler;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenSOS,
  currentUser
}) => {
  // Premium-planner nav: only three destinations. Trips is the home/base.
  const hl = (tab: NavTab) =>
    activeTab === tab || (tab === 'itinerary' && (activeTab === 'explore' || activeTab === 'costs'));

  const desktopBtn = (tab: NavTab) =>
    `whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
      hl(tab)
        ? 'text-sky-600 dark:text-sky-400 font-bold border-b-2 border-sky-500 dark:border-sky-400 -mb-0.5'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
    }`;

  const mobileBtn = (tab: NavTab) =>
    `px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer ${
      hl(tab)
        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800'
        : 'text-slate-600 dark:text-slate-400'
    }`;

  const initials = (currentUser?.name || 'W')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/85 backdrop-blur-lg border-b border-sky-100/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Brand */}
          <button
            onClick={() => onSelectTab('itinerary')}
            className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 focus:outline-none rounded cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-xs shadow-sky-500/30 tracking-tight">
              W
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-slate-950 dark:text-slate-50 tracking-tight leading-none group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                WanderLust
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                {getTranslation('soloGroupTravel')}
              </span>
            </div>
          </button>

          {/* Desktop links — three lean tabs */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => onSelectTab('itinerary')} className={desktopBtn('itinerary')}>
              {getTranslation('navTrips')}
            </button>
            <button onClick={() => onSelectTab('stories')} className={desktopBtn('stories')}>
              {getTranslation('navInspiration')}
            </button>
            <button onClick={() => onSelectTab('map')} className={desktopBtn('map')}>
              {getTranslation('navFootprints')}
            </button>
          </nav>

          {/* SOS + profile avatar */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenSOS}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors rounded-lg shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              title="Emergency SOS"
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">{getTranslation('sosHelp')}</span>
            </button>
            <button
              onClick={() => onSelectTab('profile')}
              className={`flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-all cursor-pointer ${
                activeTab === 'profile' || activeTab === 'settings'
                  ? 'ring-2 ring-sky-400 bg-sky-50 dark:bg-sky-950/50'
                  : 'hover:ring-2 hover:ring-sky-200 dark:hover:ring-sky-800'
              }`}
              title={getTranslation('profile')}
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-white flex items-center justify-center text-[11px] font-bold border border-sky-200">
                  {initials}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile strip */}
      <div className="md:hidden border-t border-sky-100/80 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-medium scrollbar-none">
        <button onClick={() => onSelectTab('itinerary')} className={mobileBtn('itinerary')}>
          {getTranslation('navTrips')}
        </button>
        <button onClick={() => onSelectTab('stories')} className={mobileBtn('stories')}>
          {getTranslation('navInspiration')}
        </button>
        <button onClick={() => onSelectTab('map')} className={mobileBtn('map')}>
          {getTranslation('navFootprints')}
        </button>
      </div>
    </header>
  );
};
