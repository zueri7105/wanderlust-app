import React, { useState } from 'react';
import { Users, BookOpen } from 'lucide-react';
import { TravelActivity, SoloTraveler } from '../types/travel';
import { getTranslation } from '../utils/i18n';
import { SharedActivitiesView } from './SharedActivitiesView';
import { TravelStoriesHubView } from './TravelStoriesHubView';

interface ExploreViewProps {
  activities: TravelActivity[];
  travelers: SoloTraveler[];
  currentUser: SoloTraveler;
  selectedDestination: string;
  onJoinActivity: (activityId: string) => void;
  onLeaveActivity: (activityId: string) => void;
  onOpenActivityChat: (activityId: string) => void;
  onCreateNewActivity: (newAct: Omit<TravelActivity, 'id' | 'participantIds' | 'status'>) => void;
  onDeleteActivity?: (activityId: string) => void;
  onGoToDestination?: (dest: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = (props) => {
  const { currentUser, onGoToDestination } = props;
  const [tab, setTab] = useState<'activities' | 'tips'>('activities');

  const pill = (key: 'activities' | 'tips', labelKey: string, Icon: React.FC<{ className?: string }>) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
        tab === key
          ? 'bg-stone-950 dark:bg-lime-400 text-lime-300 dark:text-stone-950 shadow-md'
          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 dark:bg-stone-800'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{getTranslation(labelKey)}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Editorial header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-lime-600 dark:text-lime-400 mb-2">
            {getTranslation('navExplore')}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
            {getTranslation('navExplore')}
          </h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-xl">
            {getTranslation('exploreSub')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pill('activities', 'exploreActivitiesTab', Users)}
          {pill('tips', 'exploreTipsTab', BookOpen)}
        </div>
      </div>

      {tab === 'activities' ? (
        <SharedActivitiesView
          activities={props.activities}
          travelers={props.travelers}
          currentUser={currentUser}
          selectedDestination={props.selectedDestination}
          onJoinActivity={props.onJoinActivity}
          onLeaveActivity={props.onLeaveActivity}
          onOpenActivityChat={props.onOpenActivityChat}
          onCreateNewActivity={props.onCreateNewActivity}
          onDeleteActivity={props.onDeleteActivity}
        />
      ) : (
        <TravelStoriesHubView currentUser={currentUser} onGoToDestination={onGoToDestination} hideHero />
      )}
    </div>
  );
};
