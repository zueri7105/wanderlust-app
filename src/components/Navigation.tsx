import React from 'react';
import {
  Compass,
  Users,
  Calendar,
  MessageSquare,
  Calculator,
  User,
  Plus,
  X,
  ShieldAlert,
  Settings,
  MapPin,
  BookOpen
} from 'lucide-react';
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
  onOpenCreateTrip,
  onOpenSOS,
  openActivitiesCount,
  starredCompanionsCount = 0,
  totalConversationsCount = 0,
  selectedDestination,
  onClearDestination
}) => {
  const isFiltered = selectedDestination && selectedDestination !== 'All Destinations';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand Wordmark (WanderLust) */}
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

          {/* Zone 2: Concise Navigation Links */}
          <nav className="hidden xl:flex items-center gap-5 text-sm font-medium">
            <button
              onClick={() => onSelectTab('explore')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                activeTab === 'explore'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              {getTranslation('explore')}
            </button>

            <button
              onClick={() => onSelectTab('itinerary')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                activeTab === 'itinerary'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              {getTranslation('itinerary')}
            </button>

            <button
              onClick={() => onSelectTab('matcher')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matcher'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              <span>{getTranslation('matcher')}</span>
              <span className="text-[11px] px-1.5 py-0.2 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 rounded-full font-mono font-medium">
                ★{starredCompanionsCount}
              </span>
            </button>

            {/* Travel Map & Memories Panel */}
            <button
              onClick={() => onSelectTab('map')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{getTranslation('map')}</span>
            </button>

            {/* Stories & Knowledge Hub */}
            <button
              onClick={() => onSelectTab('stories')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'stories'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>{getTranslation('stories')}</span>
            </button>

            {/* Chatbox between Companions and Activities */}
            <button
              onClick={() => onSelectTab('messages')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'messages'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>{getTranslation('messages')}</span>
              {totalConversationsCount > 0 && (
                <span className="text-xs text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                  ({totalConversationsCount})
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('activities')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 relative cursor-pointer flex items-center ${
                activeTab === 'activities'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              <span>{getTranslation('activities')}</span>
              <span className="ml-1 text-xs text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                ({openActivitiesCount})
              </span>
            </button>

            <button
              onClick={() => onSelectTab('costs')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                activeTab === 'costs'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              {getTranslation('costs')}
            </button>

            <button
              onClick={() => onSelectTab('profile')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                activeTab === 'profile'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              {getTranslation('profile')}
            </button>

            {/* Settings Tab beside Profile */}
            <button
              onClick={() => onSelectTab('settings')}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'text-rose-600 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-400 -mb-0.5'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{getTranslation('settings')}</span>
            </button>
          </nav>

          {/* Zone 3: Red SOS Help button in top right corner */}
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

            {/* Red SOS Help Button in top right corner */}
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

      {/* Mobile / Tablet Navigation Strip */}
      <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto text-xs font-medium scrollbar-none">
        <button
          onClick={() => onSelectTab('explore')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'explore'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {getTranslation('explore')}
        </button>
        <button
          onClick={() => onSelectTab('itinerary')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'itinerary'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {getTranslation('itinerary')}
        </button>
        <button
          onClick={() => onSelectTab('matcher')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'matcher'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {getTranslation('matcher')} (★{starredCompanionsCount})
        </button>
        <button
          onClick={() => onSelectTab('map')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeTab === 'map'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <MapPin className="w-3 h-3 text-rose-500" />
          <span>{getTranslation('map')}</span>
        </button>
        <button
          onClick={() => onSelectTab('stories')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeTab === 'stories'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-3 h-3 text-indigo-500" />
          <span>{getTranslation('stories')}</span>
        </button>
        <button
          onClick={() => onSelectTab('messages')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'messages'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {getTranslation('messages')}
        </button>
        <button
          onClick={() => onSelectTab('activities')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'activities'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {getTranslation('activities')} ({openActivitiesCount})
        </button>
        <button
          onClick={() => onSelectTab('costs')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'costs'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {getTranslation('costs')}
        </button>
        <button
          onClick={() => onSelectTab('profile')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {getTranslation('profile')}
        </button>
        <button
          onClick={() => onSelectTab('settings')}
          className={`px-2.5 py-1.5 rounded whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Settings className="w-3 h-3" />
          <span>{getTranslation('settings')}</span>
        </button>
      </div>
    </header>
  );
};
