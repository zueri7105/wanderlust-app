import React, { useState } from 'react';
import { TravelActivity, SoloTraveler } from '../types/travel';
import { Users, Clock, MapPin, Plus, MessageSquare, CheckCircle, ShieldAlert, Sparkles, Check, DollarSign, Trash2, EyeOff, CalendarDays, ArrowRight } from 'lucide-react';
import { generateSafeMeetingGuide } from '../services/geminiService';
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
}

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
  onDeleteActivity
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [safetyModalData, setSafetyModalData] = useState<{
    activity: TravelActivity;
    safePublicSpot: string;
    transitTip: string;
    soloTravelerPledge: string;
    loading: boolean;
  } | null>(null);

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

  const filteredActivities = activities.filter((act) => {
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

  const handleOpenSafetyGuide = async (act: TravelActivity) => {
    setSafetyModalData({
      activity: act,
      safePublicSpot: '',
      transitTip: '',
      soloTravelerPledge: '',
      loading: true
    });

    const guide = await generateSafeMeetingGuide(act.destination, act.title);
    setSafetyModalData({
      activity: act,
      ...guide,
      loading: false
    });
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            {getTranslation('activitiesTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {getTranslation('activitiesSub')}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-500 rounded-lg hover:brightness-105 transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Propose Activity</span>
        </button>
      </div>

      {/* Filter Tabs & Free Activity Filter Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
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
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {freeOnlyFilter ? 'No free activities currently found' : 'No shared activities found'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {freeOnlyFilter
              ? 'Try turning off the "Free Activities Only" filter or propose a free sunrise meetup yourself!'
              : 'Be the first solo traveler to propose an activity or road trip in this destination!'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {freeOnlyFilter && (
              <button
                onClick={() => setFreeOnlyFilter(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Clear Free Filter
              </button>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-cyan-500 rounded-lg hover:brightness-105 cursor-pointer"
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
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Top unboxed metadata line */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{act.destination}</span>
                      <span aria-hidden="true">·</span>
                      <span>{act.category}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      {act.estimatedCostTotal === 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          FREE
                        </span>
                      )}
                      <span className="text-slate-700 dark:text-slate-300">{act.participantIds.length}/{act.maxCapacity} spots</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display font-bold text-base text-slate-950 dark:text-slate-50 leading-snug">
                    {act.title}
                  </h3>

                  {/* Multi-city route chips */}
                  {act.cities && act.cities.length > 1 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                      {act.cities.map((city, i) => (
                        <React.Fragment key={city}>
                          {i > 0 && <ArrowRight className="w-2.5 h-2.5 text-slate-400" />}
                          <span className="text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-1.5 py-0.5 rounded">
                            {city}
                          </span>
                        </React.Fragment>
                      ))}
                      <span className="text-[10px] text-slate-400 italic">multi-city meetup</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {act.description}
                  </p>

                  {/* Logistics: Time & Safe Public Meetup */}
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono tabular-nums">
                        {act.date}
                        {act.endDate && act.endDate !== act.date && (
                          <>
                            <span className="text-slate-400"> → </span>
                            {act.endDate}
                            <span className="ml-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded">
                              multi-day
                            </span>
                          </>
                        )}
                        <span className="text-slate-400"> at </span>
                        {act.time}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">{act.locationName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Public Meeting Spot: {act.meetPointPublic}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Split Details */}
                  <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="text-slate-500 dark:text-slate-400">
                      {act.estimatedCostTotal > 0 ? (
                        <span>
                          Total: <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{act.currency} {act.estimatedCostTotal}</strong> (~{act.currency} {costPerPerson}/person)
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Free to join / Individual self-pay for food</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenSafetyGuide(act)}
                      className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 underline cursor-pointer"
                    >
                      Safe Meetup Guide
                    </button>
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
                      <span className="text-[11px] text-slate-500">
                        Organized by {host.name.split(' ')[0]}
                      </span>
                    </div>

                    {isJoined && (
                      <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> You're Going
                      </span>
                    )}

                    {/* Hide post (anyone) / Delete post (host only) */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleHideActivity(act.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                        title="Hide this post from your feed"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                      {act.hostId === currentUser.id && onDeleteActivity && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete your activity "${act.title}"? This cannot be undone.`)) {
                              onDeleteActivity(act.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer"
                          title="Delete your activity post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => onOpenActivityChat(act.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>Activity Discussion</span>
                  </button>

                  <div>
                    {isJoined ? (
                      <button
                        onClick={() => onLeaveActivity(act.id)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Leave Activity
                      </button>
                    ) : (
                      <button
                        onClick={() => onJoinActivity(act.id)}
                        disabled={isFull}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          isFull
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:brightness-105'
                        }`}
                      >
                        {isFull ? 'Activity Full' : 'Join Activity'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Meetup Guide Modal */}
      {safetyModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative">
            <button
              onClick={() => setSafetyModalData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2 text-slate-900">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display font-bold text-base">
                Safe Public Rendezvous Protocol
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              For solo travelers meeting for "{safetyModalData.activity.title}" in {safetyModalData.activity.destination}:
            </p>

            {safetyModalData.loading ? (
              <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 animate-pulse">
                Loading verified public rendezvous points and safety guidelines...
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-semibold text-slate-900">Recommended Public Point:</div>
                  <div className="text-slate-700 mt-0.5">{safetyModalData.safePublicSpot}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-semibold text-slate-900">Transit & Arrival Tip:</div>
                  <div className="text-slate-700 mt-0.5">{safetyModalData.transitTip}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="font-semibold text-slate-900">Solo Explorer Safety Rule:</div>
                  <div className="text-slate-700 mt-0.5">{safetyModalData.soloTravelerPledge}</div>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSafetyModalData(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:brightness-105 cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Activity Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>

            <h3 className="font-display font-bold text-lg text-slate-950">
              Propose a Shared Activity
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Invite other solo travelers in your destination to join a hike, boat trip, road trip, or food tasting.
            </p>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Destination (multiple cities welcome)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto, Osaka, Japan — list cities separated by commas, country last"
                  value={formDest}
                  onChange={(e) => setFormDest(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Single city is fine too (e.g. "Lisbon, Portugal"). Multi-city routes show as connected chips on the card.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Activity Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunrise Boat Rental to Capri Grottos"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {ACTIVITY_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Max Solo Participants
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={formMax}
                    onChange={(e) => setFormMax(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    End Date <span className="text-slate-400 font-normal">(optional — multi-day)</span>
                  </label>
                  <input
                    type="date"
                    min={formDate}
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Meetup Time — scroll to choose
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={formHour}
                    onChange={(e) => setFormHour(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Grande Pier 3"
                  value={formLoc}
                  onChange={(e) => setFormLoc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Public Rendezvous Spot (Safe Meetup)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Outside Port Ticket Office in broad daylight"
                  value={formMeet}
                  onChange={(e) => setFormMeet(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Total Estimated Cost
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank if free"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                <label className="block font-medium text-slate-700 mb-1">
                  Activity Details & Vibe
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the plan, what to bring, and why doing it together is great..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:brightness-105 cursor-pointer"
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
