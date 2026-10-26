import React, { useState } from 'react';
import { TravelActivity, SoloTraveler, ChatMessage } from '../types/travel';
import { Users, Clock, MapPin, Plus, MessageSquare, CheckCircle, Sparkles, Check, XCircle, Lock, Send, Trash2, EyeOff, Eye, CalendarDays, ArrowRight, X, Globe2, ChevronRight } from 'lucide-react';
import { getTranslation } from '../utils/i18n';
import { WORLD_CURRENCIES } from '../data/currencies';

interface SharedActivitiesViewProps {
  activities: TravelActivity[];
  travelers: SoloTraveler[];
  currentUser: SoloTraveler;
  selectedDestination: string;
  onJoinActivity: (activityId: string) => void;
  onLeaveActivity: (activityId: string) => void;
  onOpenActivityChat: (activityId: string) => void;
  onCreateNewActivity: (newAct: Omit<TravelActivity, 'id' | 'participantIds' | 'status'>) => void;
  onDeleteActivity?: (activityId: string) => void;
  /** Pending join requests per activity (traveler ids awaiting host approval) */
  requests?: Record<string, string[]>;
  onRequestJoin?: (activityId: string) => void;
  onCancelRequest?: (activityId: string) => void;
  onApproveJoiner?: (activityId: string, travelerId: string) => void;
  onDeclineRequest?: (activityId: string, travelerId: string) => void;
  /** Chat threads keyed by activity id — feeds the post detail discussion */
  messagesByThread?: Record<string, ChatMessage[]>;
  onSendMessage?: (threadId: string, text: string) => void;
}

/** Distinct look per activity type so posts are scannable at a glance. */
const CATEGORY_STYLE: Record<string, { chip: string; dot: string }> = {
  'Adventure': { chip: 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800', dot: 'bg-orange-500' },
  'Transport & Roadtrip': { chip: 'bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800', dot: 'bg-sky-500' },
  'Culture & Sights': { chip: 'bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-800', dot: 'bg-violet-500' },
  'Food & Drink': { chip: 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800', dot: 'bg-rose-500' },
  'Nightlife': { chip: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800', dot: 'bg-indigo-500' },
  'Street Food Crawl': { chip: 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800', dot: 'bg-amber-500' },
  'Sunrise & Sunset Spots': { chip: 'bg-pink-100 dark:bg-pink-950/50 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-800', dot: 'bg-pink-500' },
  'Photography Walk': { chip: 'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800', dot: 'bg-cyan-500' },
  'Hiking & Trail Safety': { chip: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500' },
  'Museums & Art': { chip: 'bg-fuchsia-100 dark:bg-fuchsia-950/50 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-800', dot: 'bg-fuchsia-500' },
  'Boat & Water Sports': { chip: 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800', dot: 'bg-teal-500' },
  'Night Markets & Shopping': { chip: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800', dot: 'bg-yellow-500' },
  'Coffee & Co-working': { chip: 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-300 border-stone-400 dark:border-stone-600', dot: 'bg-stone-500' },
  'Language & Cultural Exchange': { chip: 'bg-lime-100 dark:bg-lime-950/50 text-lime-800 dark:text-lime-300 border-lime-300 dark:border-lime-800', dot: 'bg-lime-500' },
  'Cooking Class & Workshops': { chip: 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800', dot: 'bg-red-500' },
  'Wellness & Yoga': { chip: 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800', dot: 'bg-green-500' }
};
const categoryStyle = (cat: string) =>
  CATEGORY_STYLE[cat] ?? { chip: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600', dot: 'bg-stone-400' };

const ACTIVITY_CATEGORY_OPTIONS = [
  'Adventure',
  'Transport & Roadtrip',
  'Culture & Sights',
  'Food & Drink',
  'Nightlife',
  'Street Food Crawl',
  'Sunrise & Sunset Spots',
  'Photography Walk',
  'Hiking & Trail Safety',
  'Museums & Art',
  'Boat & Water Sports',
  'Night Markets & Shopping',
  'Coffee & Co-working',
  'Language & Cultural Exchange',
  'Cooking Class & Workshops',
  'Wellness & Yoga'
];

const CATEGORIES = ['All Categories', ...ACTIVITY_CATEGORY_OPTIONS];

export const SharedActivitiesView: React.FC<SharedActivitiesViewProps> = ({
  activities,
  travelers,
  currentUser,
  selectedDestination,
  onJoinActivity,
  onLeaveActivity,
  onOpenActivityChat,
  onCreateNewActivity,
  onDeleteActivity,
  requests = {},
  onRequestJoin,
  onCancelRequest,
  onApproveJoiner,
  onDeclineRequest,
  messagesByThread = {},
  onSendMessage
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [freeOnlyFilter, setFreeOnlyFilter] = useState(false);
  // Hidden activity posts (this device)
  const [hiddenActivities, setHiddenActivities] = useState<string[]>(() => {
    const saved = localStorage.getItem('wanderlust_hidden_activities');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleHideActivity = (id: string) => {
    const updated = [...hiddenActivities, id];
    setHiddenActivities(updated);
    localStorage.setItem('wanderlust_hidden_activities', JSON.stringify(updated));
  };

  // Unhide — restore a previously hidden activity to the feed
  const handleUnhideActivity = (id: string) => {
    const updated = hiddenActivities.filter((a) => a !== id);
    setHiddenActivities(updated);
    localStorage.setItem('wanderlust_hidden_activities', JSON.stringify(updated));
  };
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Post detail page — the "second page" of a post: full details plus the
  // discussion section, which stays locked until the host accepts you.
  const [detailActivityId, setDetailActivityId] = useState<string | null>(null);
  const detailActivity = detailActivityId
    ? activities.find((a) => a.id === detailActivityId) ?? null
    : null;
  const detailJoined = detailActivity
    ? detailActivity.participantIds.includes(currentUser.id)
    : false;
  const detailIsHost = detailActivity ? detailActivity.hostId === currentUser.id : false;
  const detailUnlocked = detailJoined || detailIsHost;
  const [detailDraft, setDetailDraft] = useState('');

  // Form state
  const [formDest, setFormDest] = useState(selectedDestination !== 'All Destinations' ? selectedDestination : 'Kyoto, Japan');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Adventure');
  const [formDate, setFormDate] = useState('2026-10-21');
  const [formEndDate, setFormEndDate] = useState(''); // optional — multi-day activities
  // Time picker via scroll rows (hour / minute / AM-PM)
  const [formHour, setFormHour] = useState('07');
  const [formMinute, setFormMinute] = useState('00');
  const [formAmPm, setFormAmPm] = useState<'AM' | 'PM'>('AM');
  const [formLoc, setFormLoc] = useState('');
  const [formMeet, setFormMeet] = useState('');
  const [formMax, setFormMax] = useState(4);
  // Blank by default so the user types their own value (no forced "0")
  const [formCost, setFormCost] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formCostNote, setFormCostNote] = useState('Split equally among participants');
  const [formDesc, setFormDesc] = useState('');

  const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const MINUTE_OPTIONS = ['00', '15', '30', '45'];

  const getTraveler = (id: string) => travelers.find((t) => t.id === id) || travelers[0];
  const hasRequested = (activityId: string) =>
    (requests[activityId] ?? []).includes(currentUser.id);

  const filteredActivities = activities.filter((act) => {
    // Hidden posts live under the dedicated "Hidden" category tab
    if (selectedCategory === 'Hidden') return hiddenActivities.includes(act.id);
    if (hiddenActivities.includes(act.id)) return false;
    if (selectedDestination !== 'All Destinations') {
      const sel = selectedDestination.toLowerCase().split(',')[0].trim();
      const actDest = act.destination.toLowerCase();
      const actPrefix = actDest.split(',')[0].trim();
      const cityMatch = (act.cities || []).some((c) => c.toLowerCase().includes(sel) || sel.includes(c.toLowerCase()));
      if (!actDest.includes(sel) && !selectedDestination.toLowerCase().includes(actPrefix) && !cityMatch) {
        return false;
      }
    }
    if (selectedCategory !== 'All Categories' && act.category !== selectedCategory) {
      return false;
    }
    // Filter out free activities to join
    if (freeOnlyFilter && act.estimatedCostTotal > 0) {
      return false;
    }
    return true;
  });


  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formLoc) return;

    // Multi-city support: "Kyoto, Osaka, Japan" → cities [Kyoto, Osaka] (last part = country)
    const destParts = formDest.split(',').map((s) => s.trim()).filter(Boolean);
    const cities = destParts.length > 1 ? destParts.slice(0, -1) : [];
    const formTime = `${formHour}:${formMinute} ${formAmPm}`;

    onCreateNewActivity({
      destination: formDest.trim(),
      ...(cities.length > 0 ? { cities } : {}),
      title: formTitle,
      category: formCategory,
      date: formDate,
      ...(formEndDate && formEndDate > formDate ? { endDate: formEndDate } : {}),
      time: formTime,
      locationName: formLoc,
      meetPointPublic: formMeet || `${formLoc} main entrance public gate`,
      hostId: currentUser.id,
      maxCapacity: Number(formMax),
      estimatedCostTotal: formCost.trim() === '' ? 0 : Math.max(0, Number(formCost) || 0),
      currency: formCurrency,
      costSplitNote: formCostNote,
      description: formDesc
    });

    setIsCreateModalOpen(false);
    setFormTitle('');
    setFormLoc('');
    setFormDesc('');
    setFormEndDate('');
    setFormCost('');
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
            {getTranslation('activitiesTitle')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {getTranslation('activitiesSub')}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:brightness-105 transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Propose Activity</span>
        </button>
      </div>

      {/* Filter Tabs & Free Activity Filter Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat, idx) => (
            <React.Fragment key={cat}>
              {idx === 1 && (
                /* Hidden tab — pinned right behind "All Categories" so it's always easy to find */
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Hidden')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    selectedCategory === 'Hidden'
                      ? 'bg-gradient-to-r from-stone-600 to-stone-800 text-white font-semibold shadow-xs'
                      : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
                  title="Activities you hid from your feed"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Hidden</span>
                  <span className="font-mono text-[10px] opacity-80">({hiddenActivities.length})</span>
                </button>
              )}
              <button
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 font-semibold shadow-xs'
                    : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {cat}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Free Activities Filter Toggle as requested */}
        <button
          type="button"
          onClick={() => setFreeOnlyFilter(!freeOnlyFilter)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
            freeOnlyFilter
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
          }`}
          title="Filter to show free activities only"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Free Activities to Join Only ($0)</span>
          {freeOnlyFilter && <Check className="w-3.5 h-3.5 ml-0.5" />}
        </button>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl space-y-3">
          <Users className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            {freeOnlyFilter ? 'No free activities currently found' : 'No shared activities found'}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            {freeOnlyFilter
              ? 'Try turning off the "Free Activities Only" filter or propose a free sunrise meetup yourself!'
              : 'Be the first solo traveller to propose an activity or road trip in this destination!'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {freeOnlyFilter && (
              <button
                onClick={() => setFreeOnlyFilter(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 cursor-pointer"
              >
                Clear Free Filter
              </button>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:brightness-105 cursor-pointer"
            >
              Propose First Activity
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredActivities.map((act) => {
            const host = getTraveler(act.hostId);
            const isJoined = act.participantIds.includes(currentUser.id);
            const isFull = act.participantIds.length >= act.maxCapacity && !isJoined;
            const participants = act.participantIds.map(getTraveler);
            const costPerPerson =
              act.estimatedCostTotal > 0 && act.participantIds.length > 0
                ? Math.round(act.estimatedCostTotal / Math.max(1, act.participantIds.length))
                : 0;

            return (
              <div
                key={act.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 hover:border-stone-300 dark:hover:border-stone-700 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Distinctive post header — country banner above the title,
                      colour-coded activity type chip, capacity on the right */}
                  <div className="flex items-start justify-between gap-3 -mt-1 mb-3">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-950 dark:bg-violet-400 text-white dark:text-stone-950 shadow-xs">
                        <Globe2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-display font-extrabold text-[13px] tracking-tight truncate">
                          {act.destination}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryStyle(act.category).chip}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle(act.category).dot}`} />
                          {act.category}
                        </span>
                        {act.estimatedCostTotal === 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                            FREE
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono tabular-nums text-[11px] font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-lg">
                      {act.participantIds.length}/{act.maxCapacity}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display font-bold text-base text-stone-950 dark:text-stone-50 leading-snug">
                    {act.title}
                  </h3>

                  {/* Multi-city route chips */}
                  {act.cities && act.cities.length > 1 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                      {act.cities.map((city, i) => (
                        <React.Fragment key={city}>
                          {i > 0 && <ArrowRight className="w-2.5 h-2.5 text-stone-400" />}
                          <span className="text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-1.5 py-0.5 rounded">
                            {city}
                          </span>
                        </React.Fragment>
                      ))}
                      <span className="text-[10px] text-stone-400 italic">multi-city meetup</span>
                    </div>
                  )}

                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                    {act.description}
                  </p>

                  {/* Logistics: Time & Safe Public Meetup */}
                  <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="font-mono tabular-nums">
                        {act.date}
                        {act.endDate && act.endDate !== act.date && (
                          <>
                            <span className="text-stone-400"> → </span>
                            {act.endDate}
                            <span className="ml-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded">
                              multi-day
                            </span>
                          </>
                        )}
                        <span className="text-stone-400"> at </span>
                        {act.time}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-stone-700 dark:text-stone-300">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-stone-900 dark:text-stone-100">{act.locationName}</div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          Public Meeting Spot: {act.meetPointPublic}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Split Details */}
                  <div className="mt-3 flex items-center justify-between text-xs border-t border-stone-100 dark:border-stone-800 pt-3">
                    <div className="text-stone-500 dark:text-stone-400">
                      {act.estimatedCostTotal > 0 ? (
                        <span>
                          Total: <strong className="font-mono tabular-nums text-stone-800 dark:text-stone-200">{act.currency} {act.estimatedCostTotal}</strong> (~{act.currency} {costPerPerson}/person)
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Free to join / Individual self-pay for food</span>
                      )}
                    </div>
                  </div>

                  {/* Joined Members Avatars & Host */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {participants.map((p) => (
                          <img
                            key={p.id}
                            src={p.avatar}
                            alt={p.name}
                            title={`${p.name} (${p.homeCity})`}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-stone-500">
                        Organised by {host.name.split(' ')[0]}
                      </span>
                    </div>

                    {isJoined && (
                      <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> You're Going
                      </span>
                    )}

                    {/* Hide / Unhide post (anyone) / Delete post (host only) */}
                    <div className="flex items-center gap-1">
                      {selectedCategory === 'Hidden' ? (
                        <button
                          type="button"
                          onClick={() => handleUnhideActivity(act.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                          title="Restore this activity to your feed"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Unhide</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleHideActivity(act.id)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
                          title="Hide this post (find it again under the Hidden tab)"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {act.hostId === currentUser.id && onDeleteActivity && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete your activity "${act.title}"? This cannot be undone.`)) {
                              onDeleteActivity(act.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer"
                          title="Delete your activity post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Host approval queue — the host sees join requests with
                    approve / decline; accepted travellers join the pod */}
                {act.hostId === currentUser.id && (requests[act.id]?.length ?? 0) > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
                    <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      Join Requests ({requests[act.id]!.length})
                    </div>
                    {requests[act.id]!.map((travelerId) => {
                      const requester = getTraveler(travelerId);
                      return (
                        <div key={travelerId} className="flex items-center gap-2">
                          <img
                            src={requester.avatar}
                            alt={requester.name}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full object-cover border border-amber-200 dark:border-amber-800"
                          />
                          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex-1 truncate">
                            {requester.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => onApproveJoiner?.(act.id, travelerId)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeclineRequest?.(act.id, travelerId)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-stone-600 bg-stone-100 dark:bg-stone-800 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            Decline
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action Row */}
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setDetailActivityId(act.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-50 cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {isJoined ? (
                      <button
                        onClick={() => onOpenActivityChat(act.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Discussion</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500" title="Discussion unlocks once the host accepts you">
                        <Lock className="w-3 h-3" />
                        Discussion locked
                      </span>
                    )}
                  </div>

                  <div>
                    {isJoined ? (
                      <button
                        onClick={() => onLeaveActivity(act.id)}
                        className="px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 rounded-md hover:bg-stone-200 transition-colors cursor-pointer"
                      >
                        Leave Activity
                      </button>
                    ) : hasRequested(act.id) ? (
                      <button
                        onClick={() => onCancelRequest?.(act.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                        title="Tap to withdraw your request"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Awaiting Approval
                      </button>
                    ) : (
                      <button
                        onClick={() => onRequestJoin?.(act.id)}
                        disabled={isFull}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          isFull
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            : 'bg-stone-900 text-white hover:brightness-105'
                        }`}
                      >
                        {isFull ? 'Activity Full' : 'Request to Join'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Post detail page — the "second page" of a post: everything about
             the activity, plus the discussion, which stays locked until the
             host accepts the traveller into the group ── */}
      {detailActivity && (() => {
        const act = detailActivity;
        const host = getTraveler(act.hostId);
        const thread = messagesByThread[act.id] || [];
        const style = categoryStyle(act.category);
        return (
          <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-stretch sm:items-center justify-center">
            <div className="bg-white dark:bg-stone-900 w-full sm:max-w-2xl sm:rounded-2xl sm:border sm:border-stone-200 dark:sm:border-stone-800 h-full sm:h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header — country banner + type chip + title */}
              <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-950 dark:bg-violet-400 text-white dark:text-stone-950 shadow-xs self-start">
                    <Globe2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-display font-extrabold text-[13px] tracking-tight">{act.destination}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailActivityId(null)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {act.category}
                  </span>
                  {act.estimatedCostTotal === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      FREE
                    </span>
                  )}
                  <span className="font-mono tabular-nums text-[11px] font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                    {act.participantIds.length}/{act.maxCapacity} going
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-stone-950 dark:text-stone-50 mt-2 leading-snug">
                  {act.title}
                </h3>
              </div>

              {/* Body — details on top, discussion below */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-5 space-y-4">
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{act.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="font-mono tabular-nums">{act.date}{act.endDate && act.endDate !== act.date ? ` → ${act.endDate}` : ''} at {act.time}</span>
                      </div>
                      <div className="flex items-start gap-2 text-stone-700 dark:text-stone-300">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-stone-900 dark:text-stone-100">{act.locationName}</div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400">Public Meeting Spot: {act.meetPointPublic}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <img src={host.avatar} alt={host.name} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover border border-stone-200 dark:border-stone-700" />
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{host.name}</span>
                        <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-800">HOST</span>
                      </div>
                      <div className="text-stone-600 dark:text-stone-400">
                        {act.estimatedCostTotal > 0 ? (
                          <span>Total <strong className="font-mono text-stone-900 dark:text-stone-100">{act.currency} {act.estimatedCostTotal}</strong> · split between participants</span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Free to join / self-pay for food</span>
                        )}
                      </div>
                      {act.costSplitNote && <div className="text-[11px] text-stone-500 dark:text-stone-400">{act.costSplitNote}</div>}
                    </div>
                  </div>

                  {/* Members */}
                  <div>
                    <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Members ({act.participantIds.length})</div>
                    <div className="flex flex-wrap gap-2">
                      {act.participantIds.map((pid) => {
                        const member = getTraveler(pid);
                        return (
                          <div key={pid} className="flex items-center gap-1.5 p-1 pr-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full">
                            <img src={member.avatar} alt={member.name} referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover" />
                            <span className="text-[11px] font-semibold text-stone-900 dark:text-stone-100">{member.name.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Discussion — locked until accepted */}
                <div className="border-t border-stone-200 dark:border-stone-800">
                  <div className="px-4 sm:px-5 pt-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <h4 className="font-display font-bold text-sm text-stone-950 dark:text-stone-50">Group Discussion</h4>
                    {!detailUnlocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> Members only
                      </span>
                    )}
                  </div>

                  {detailUnlocked ? (
                    <div className="px-4 sm:px-5 pb-5 pt-3 space-y-3">
                      {thread.length === 0 && (
                        <div className="p-3 bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 rounded-xl text-center text-xs text-stone-500">
                          No messages yet — say hi and coordinate the meetup.
                        </div>
                      )}
                      {thread.map((msg) => {
                        const sender = getTraveler(msg.senderId);
                        const isMe = msg.senderId === currentUser.id;
                        return (
                          <div key={msg.id} className={`flex gap-2.5 text-xs ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <img src={sender.avatar} alt={sender.name} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0 self-end" />
                            <div className={`max-w-[78%] rounded-xl p-2.5 ${isMe ? 'bg-stone-950 text-white rounded-br-xs' : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-xs'}`}>
                              <div className="flex items-center justify-between gap-2 mb-0.5 text-[10px] opacity-70">
                                <span className="font-semibold">{sender.name}</span>
                                <span className="font-mono tabular-nums">{msg.timestamp}</span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })}

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const text = detailDraft.trim();
                          if (!text || !onSendMessage) return;
                          onSendMessage(act.id, text);
                          setDetailDraft('');
                        }}
                        className="flex items-center gap-2 pt-1"
                      >
                        <input
                          type="text"
                          value={detailDraft}
                          onChange={(e) => setDetailDraft(e.target.value)}
                          placeholder="Message the group…"
                          className="flex-1 px-3 py-2 text-xs border border-stone-300 dark:border-stone-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-950 dark:focus:ring-violet-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                        />
                        <button
                          type="submit"
                          disabled={!detailDraft.trim()}
                          className="p-2 bg-stone-950 dark:bg-violet-400 text-white dark:text-stone-950 rounded-lg hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="px-4 sm:px-5 pb-5 pt-3">
                      <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-2">
                        <Lock className="w-5 h-5 text-stone-400 mx-auto" />
                        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                          Discussion is only visible once the host accepts you into the group.
                        </p>
                        {hasRequested(act.id) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            Request pending — awaiting host approval
                          </span>
                        ) : !detailJoined && act.hostId !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => onRequestJoin?.(act.id)}
                            disabled={act.participantIds.length >= act.maxCapacity}
                            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-stone-950 text-white hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                          >
                            Request to Join
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Propose Activity Modal */}
      {isCreateModalOpen && (
        <div className="wl-modal-overlay">
          <div className="wl-modal-card max-w-lg p-6 sm:p-7 relative">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="wl-modal-eyebrow">WanderLust Studio</div>
                <h3 className="wl-modal-title mt-1.5">
                  Propose a Shared Activity
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                  Invite other solo travelers in your destination to join a hike, boat trip, road trip, or food tasting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="wl-modal-close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Destination (multiple cities welcome)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto, Osaka, Japan — list cities separated by commas, country last"
                  value={formDest}
                  onChange={(e) => setFormDest(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Single city is fine too (e.g. "Lisbon, Portugal"). Multi-city routes show as connected chips on the card.
                </p>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunrise Boat Rental to Capri Grottos"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    {ACTIVITY_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Max Solo Participants
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={formMax}
                    onChange={(e) => setFormMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Date pickers: native <input type="date"> controls refuse to
                  shrink below their intrinsic width, so on phone widths two
                  side-by-side boxes overlap. Stack until the modal is wide
                  enough to host them comfortably. */}
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    End Date <span className="text-stone-400 font-normal">(optional — multi-day)</span>
                  </label>
                  <input
                    type="date"
                    min={formDate}
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full min-w-0 px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Meetup Time — scroll to choose
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={formHour}
                    onChange={(e) => setFormHour(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formMinute}
                    onChange={(e) => setFormMinute(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        :{m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formAmPm}
                    onChange={(e) => setFormAmPm(e.target.value as 'AM' | 'PM')}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Grande Pier 3"
                  value={formLoc}
                  onChange={(e) => setFormLoc(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Public Rendezvous Spot (Safe Meetup)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Outside Port Ticket Office in broad daylight"
                  value={formMeet}
                  onChange={(e) => setFormMeet(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Total Estimated Cost
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank if free"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    {WORLD_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Activity Details & Vibe
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the plan, what to bring, and why doing it together is great..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 rounded-md hover:bg-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-md hover:brightness-105 cursor-pointer"
                >
                  Publish Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
