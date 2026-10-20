import React, { useEffect, useState } from 'react';
import { SoloTraveler, TravelItinerary } from '../types/travel';
import { MapPin, Globe, Compass, ShieldCheck, MessageCircle, X, Calendar, Instagram } from 'lucide-react';
import { presenceForTraveler } from '../utils/settings';
import { PresenceBadge } from './MessagesView';

interface TravelerProfilePopupProps {
  traveler: SoloTraveler;
  currentUserId: string;
  /** All itineraries — we show this traveller's PUBLIC trips only. */
  itineraries: TravelItinerary[];
  onClose: () => void;
  onOpenChat?: (traveler: SoloTraveler) => void;
}

/**
 * Floating profile card shown when tapping a traveller's avatar (map pins, companion
 * cards, message threads). Shows their bio + the trips they've shared publicly.
 */
export const TravelerProfilePopup: React.FC<TravelerProfilePopupProps> = ({
  traveler,
  currentUserId,
  itineraries,
  onClose,
  onOpenChat
}) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const isMe = traveler.id === currentUserId;
  const publicTrips = itineraries.filter(
    (t) => t.travelerId === traveler.id && (t.visibility || 'public') === 'public'
  );
  const igHandle = (traveler.instagram || '').replace(/^@/, '').trim();
  const presence = presenceForTraveler(traveler.id, currentUserId);

  return (
    <div
      className="fixed inset-0 z-[300] bg-slate-950/45 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden transition-all duration-200 max-h-[85vh] flex flex-col ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Gradient hero */}
        <div className="relative shrink-0">
          <div className="h-20 bg-gradient-to-br from-rose-500 via-orange-400 to-amber-400" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Close profile"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute -bottom-9 left-5">
            <div className="relative inline-block">
              <img
                src={traveler.avatar}
                alt={traveler.name}
                className="w-20 h-20 rounded-2xl object-cover border-[3px] border-white dark:border-slate-900 shadow-lg"
              />
              <PresenceBadge status={presence} />
            </div>
          </div>
        </div>

        <div className="pt-12 px-5 pb-5 space-y-4 overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-lg text-slate-950 dark:text-slate-50">
                {traveler.name}
              </h3>
              <span className="text-xs text-slate-400 font-mono">{traveler.age} yrs</span>
              {traveler.isConfirmedBuddy && (
                <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                  Confirmed companion
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>From {traveler.homeCity}, {traveler.country}</span>
              {traveler.currentDestination && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  · Now in {traveler.currentDestination}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {traveler.bio && (
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
              {traveler.bio}
            </p>
          )}

          {/* Travel goals — what they'd love to share or find on the road */}
          {traveler.travelGoals && traveler.travelGoals.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Looking to share
              </div>
              <div className="flex flex-wrap gap-1.5">
                {traveler.travelGoals.map((goal) => (
                  <span
                    key={goal}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-900/50 rounded-full"
                  >
                    <Compass className="w-3 h-3" />
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50">
              <Compass className="w-3 h-3" /> {traveler.soloTripsCount} solo journeys
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50">
              <ShieldCheck className="w-3 h-3" /> ★ {traveler.safetyRating}/5
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-900/50">
              <Globe className="w-3 h-3" /> {traveler.languages.join(', ')}
            </span>
            {igHandle && (
              <a
                href={`https://instagram.com/${igHandle}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 font-bold"
              >
                <Instagram className="w-3 h-3" /> @{igHandle}
              </a>
            )}
          </div>

          {/* Public trips */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Trips shared publicly ({publicTrips.length})</span>
            </div>
            {publicTrips.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                {isMe
                  ? 'Your trips are currently private — make one public from the Itinerary tab to share it here.'
                  : `${traveler.name.split(' ')[0]} hasn't shared any public trips yet.`}
              </p>
            ) : (
              <div className="space-y-1.5">
                {publicTrips.slice(0, 4).map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-200/50 dark:border-rose-900/40 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {trip.destination}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {trip.startDate} – {trip.endDate} · {trip.days.length} day{trip.days.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    {trip.tripScope && (
                      <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 bg-white/70 dark:bg-slate-900/60 px-1.5 py-0.5 rounded border border-rose-200/60 dark:border-rose-900/50 shrink-0">
                        {trip.tripScope}
                      </span>
                    )}
                  </div>
                ))}
                {publicTrips.length > 4 && (
                  <div className="text-[10px] text-slate-400 text-center">
                    +{publicTrips.length - 4} more trips
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {!isMe && onOpenChat && (
            <button
              type="button"
              onClick={() => {
                onOpenChat(traveler);
                onClose();
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 rounded-xl hover:brightness-105 cursor-pointer shadow-md shadow-orange-500/25"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Message {traveler.name.split(' ')[0]}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
