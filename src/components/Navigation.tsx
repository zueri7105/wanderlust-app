import React from 'react';
import { ShieldAlert, Route, Compass, Stamp } from 'lucide-react';
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

const TABS: { tab: NavTab; labelKey: string; icon: React.FC<{ className?: string }> }[] = [
  { tab: 'itinerary', labelKey: 'navTrips', icon: Route },
  { tab: 'stories', labelKey: 'navExplore', icon: Compass },
  { tab: 'map', labelKey: 'navPassport', icon: Stamp }
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenSOS,
  currentUser
}) => {
  const hl = (tab: NavTab) =>
    activeTab === tab || (tab === 'itinerary' && (activeTab === 'explore' || activeTab === 'costs'));

  const initials = (currentUser?.name || 'W')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');

  const Avatar = (
    <button
      onClick={() => onSelectTab('profile')}
      className={`rounded-full transition-all cursor-pointer ${
        activeTab === 'profile' || activeTab === 'settings'
          ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-white dark:ring-offset-stone-950'
          : 'hover:ring-2 hover:ring-violet-300 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-stone-950'
      }`}
      title={getTranslation('profile')}
    >
      {currentUser?.avatar ? (
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-9 h-9 rounded-full object-cover border border-stone-200 dark:border-stone-700"
        />
      ) : (
        <span className="w-9 h-9 rounded-full bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center text-[11px] font-bold">
          {initials}
        </span>
      )}
    </button>
  );

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
          {Avatar}
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
            {Avatar}
          </div>
        </div>
      </nav>
    </>
  );
};
