import React from 'react';
import { ShieldAlert, Route, Compass, BookOpen } from 'lucide-react';
import { getTranslation } from '../utils/i18n';
import { SoloTraveler } from '../types/travel';

export type NavTab =
  | 'explore'
  | 'itinerary'
  | 'matcher'
  | 'map'
  | 'journal'
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


/** Passport-book nav icon with the word PROFILE on the cover. */
const PassportBookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="4.5" y="2.5" width="15" height="19" rx="2.2" />
    <line x1="8.2" y1="2.5" x2="8.2" y2="21.5" />
    <text x="13.6" y="13.2" textAnchor="middle" fontSize="4.1" fontWeight="800" letterSpacing="0.4" fill="currentColor" stroke="none" fontFamily="inherit">PROFILE</text>
  </svg>
);

const TABS: { tab: NavTab; labelKey: string; icon: React.FC<{ className?: string }> }[] = [
  { tab: 'itinerary', labelKey: 'navTrips', icon: Route },
  { tab: 'stories', labelKey: 'navExplore', icon: Compass },
  { tab: 'journal', labelKey: 'navJournal', icon: BookOpen },
  { tab: 'map', labelKey: 'navPassport', icon: PassportBookIcon }
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenSOS,
  currentUser
}) => {
  const hl = (tab: NavTab) =>
    activeTab === tab || (tab === 'itinerary' && (activeTab === 'explore' || activeTab === 'costs'));


  const SOSButton = (extra: string) => (
    <button
      onClick={onOpenSOS}
      className={`flex items-center justify-center rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors cursor-pointer ${extra}`}
      title="Emergency SOS"
    >
      <ShieldAlert className="w-5 h-5" />
    </button>
  );

  return (
    <>
      {/* ── Desktop: slim icon rail on the left ─────────────────────────── */}
      <nav className="hidden md:flex fixed inset-y-0 left-0 z-40 w-[76px] flex-col items-center py-5 bg-white/90 dark:bg-stone-950/90 backdrop-blur-lg border-r border-stone-200 dark:border-stone-800 transition-colors">
        {/* Brand mark */}
        <button
          onClick={() => onSelectTab('itinerary')}
          className="w-10 h-10 rounded-2xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center font-display font-extrabold text-base tracking-tight shadow-sm hover:scale-105 transition-transform cursor-pointer"
          title="WanderLust"
        >
          W
        </button>

        {/* Main tabs */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          {TABS.map(({ tab, labelKey, icon: Icon }) => {
            const active = hl(tab);
            return (
              <button
                key={tab}
                onClick={() => onSelectTab(tab)}
                className={`w-14 py-2 rounded-2xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  active
                    ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 shadow-md'
                    : 'text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                  {getTranslation(labelKey)}
                </span>
              </button>
            );
          })}
        </div>

        {/* SOS + avatar pinned to the bottom of the rail */}
        <div className="flex flex-col items-center gap-3">
          {SOSButton('w-10 h-10')}
        </div>
      </nav>

      {/* ── Mobile: floating bottom dock ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-stone-950/95 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-stretch justify-around px-2 py-1.5">
          {TABS.map(({ tab, labelKey, icon: Icon }) => {
            const active = hl(tab);
            return (
              <button
                key={tab}
                onClick={() => onSelectTab(tab)}
                className={`flex-1 max-w-[92px] py-1.5 rounded-2xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950'
                    : 'text-stone-400 dark:text-stone-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                  {getTranslation(labelKey)}
                </span>
              </button>
            );
          })}
          <div className="flex items-center gap-2 pl-1">
            {SOSButton('w-9 h-9')}
          </div>
        </div>
      </nav>
    </>
  );
};
