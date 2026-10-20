import React, { useState, useEffect, useRef } from 'react';
import { SoloTraveler, TravelTrip, ChatMessage, TravelItinerary } from '../types/travel';
import {
  MessageSquare,
  Send,
  Star,
  MapPin,
  Sparkles,
  Search,
  Check,
  HeartHandshake,
  ShieldCheck,
  Smile,
  Languages,
  Loader2,
  Moon,
  ChevronLeft
} from 'lucide-react';
import { TravelerProfilePopup } from './TravelerProfilePopup';
import { playAudioAlert, getTranslation } from '../utils/i18n';
import { getAppSettings, getTranslateTarget, presenceForTraveler, PresenceStatus } from '../utils/settings';

/** Presence badge on avatars: green dot = online, moon = do not disturb, orange = offline, none = tracking off */
export const PresenceBadge: React.FC<{ status: PresenceStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  if (status === 'hidden') return null;
  const pos = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';
  if (status === 'dnd') {
    return (
      <span
        className={`absolute -bottom-0.5 -right-0.5 ${pos} bg-indigo-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center`}
        title="Do Not Disturb"
      >
        <Moon className={size === 'sm' ? 'w-1.5 h-1.5 text-white' : 'w-2 h-2 text-white'} />
      </span>
    );
  }
  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 ${pos} border-2 border-white dark:border-slate-900 rounded-full ${
        status === 'online' ? 'bg-emerald-500' : 'bg-orange-500'
      }`}
      title={status === 'online' ? 'Online' : 'Offline'}
    />
  );
};

interface MessagesViewProps {
  chats: Record<string, ChatMessage[]>;
  travelers: SoloTraveler[];
  currentUser: SoloTraveler;
  trips: TravelTrip[];
  activeTravelerId: string | null;
  onSelectTraveler: (travelerId: string) => void;
  onSendMessage: (threadId: string, text: string) => void;
  onToggleStarTraveler: (travelerId: string) => void;
  onGoToItinerary: (destination: string) => void;
  onConfirmBuddy?: (travelerId: string) => void;
  itineraries?: TravelItinerary[];
}

const QUICK_STARTERS = [
  'Hey! Are you free to meet up near the central train station?',
  'Would you be interested in splitting a taxi or car rental?',
  'What days are you planning to be in town?',
  'Looking for a dinner companion to try local specialties!'
];

const AVATAR_GRADIENTS = [
  'from-rose-500 to-orange-400',
  'from-violet-500 to-fuchsia-400',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-yellow-400',
  'from-indigo-500 to-blue-400'
];

const avatarGradient = (name: string) => AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

export const MessagesView: React.FC<MessagesViewProps> = ({
  chats,
  travelers,
  currentUser,
  trips,
  activeTravelerId,
  onSelectTraveler,
  onSendMessage,
  onToggleStarTraveler,
  onGoToItinerary,
  onConfirmBuddy,
  itineraries = []
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Avatar-tap profile popup (bio + public trips)
  const [profilePopupTravelerId, setProfilePopupTravelerId] = useState<string | null>(null);

  // Message translation state: per message id, translated text + visibility (+ target used, so a
  // language change in Settings re-translates instead of showing a stale language)
  const [translations, setTranslations] = useState<Record<string, { status: 'loading' | 'done' | 'error'; text?: string; target?: string }>>({});
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});

  // Translate a received message into the chosen translation language (defaults to the app language)
  const handleTranslateMessage = async (msg: ChatMessage) => {
    const target = getTranslateTarget();
    const existing = translations[msg.id];
    if (existing?.status === 'done' && existing.target === target) {
      setShowTranslation((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }));
      return;
    }
    if (existing?.status === 'loading') return;
    setTranslations((prev) => ({ ...prev, [msg.id]: { status: 'loading', target } }));
    try {
      let translated = '';
      // Primary: Google Translate free endpoint (auto source detection)
      try {
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(msg.text)}`
        );
        if (res.ok) {
          const data = await res.json();
          translated = (data?.[0] || []).map((seg: any[]) => seg?.[0] || '').join('');
        }
      } catch {
        /* fall through to backup */
      }
      // Backup: MyMemory free API
      if (!translated) {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(msg.text)}&langpair=Autodetect|${encodeURIComponent(target)}`
        );
        if (res.ok) {
          const data = await res.json();
          translated = data?.responseData?.translatedText || '';
        }
      }
      if (translated && translated.trim() && translated.trim().toLowerCase() !== msg.text.trim().toLowerCase()) {
        setTranslations((prev) => ({ ...prev, [msg.id]: { status: 'done', text: translated, target } }));
        setShowTranslation((prev) => ({ ...prev, [msg.id]: true }));
      } else if (translated) {
        // Same-language message — nothing to translate
        setTranslations((prev) => ({ ...prev, [msg.id]: { status: 'done', text: '(Already in your language)', target } }));
        setShowTranslation((prev) => ({ ...prev, [msg.id]: true }));
      } else {
        throw new Error('empty translation');
      }
    } catch {
      setTranslations((prev) => ({ ...prev, [msg.id]: { status: 'error' } }));
    }
  };

  // All other travelers (excluding current user)
  const otherTravelers = travelers.filter((t) => t.id !== currentUser.id);

  // Which chat is open. null = show the conversations list (a traveller always remains tappable,
  // and the back button / tapping elsewhere returns you to the list — chats can never get "stuck").
  const [openChatId, setOpenChatId] = useState<string | null>(null);

  const selectedTraveler = openChatId ? travelers.find((t) => t.id === openChatId) || null : null;

  // Requests to open a chat from elsewhere (map, companions, trip cards...) always win
  useEffect(() => {
    if (activeTravelerId) {
      setOpenChatId(activeTravelerId);
    }
  }, [activeTravelerId]);

  const openChat = (travelerId: string) => {
    setOpenChatId(travelerId);
    onSelectTraveler(travelerId);
  };
  const closeChat = () => setOpenChatId(null);

  // Get active thread travelers: travelers who either have chat history or are currently selected
  const activeConversationTravelerIds = Array.from(
    new Set([
      ...Object.keys(chats).filter((key) => otherTravelers.some((t) => t.id === key)),
      ...(openChatId ? [openChatId] : [])
    ])
  );

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, selectedTraveler?.id, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !selectedTraveler) return;

    onSendMessage(selectedTraveler.id, text);
    setInputText('');

    // Simulate realistic companion typing & reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const companionDest = selectedTraveler.currentDestination?.split(',')[0] || 'the trip';
      const replies = [
        `Sounds great, ${currentUser.name.split(' ')[0]}! I would love to connect for ${companionDest}. That fits my schedule!`,
        `Perfect! Let's meet at a bright public spot in ${companionDest}. Splitting costs and sharing the plan is a great idea.`,
        `Awesome! I checked out your itinerary notes and our travel pace matches really well. Looking forward to it!`,
        `That works for me! What time of day works best for you? Morning or afternoon?`
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      if (getAppSettings().chatSounds) playAudioAlert();
      onSendMessage(selectedTraveler.id, randomReply);
    }, 1500);
  };

  const handleProposeBuddy = () => {
    if (!selectedTraveler) return;
    const dest = selectedTraveler.currentDestination?.split(',')[0] || 'our trip';
    const proposalText = `🤝 Companion Buddy Confirmation Proposal: Let's officially confirm as travel companion buddies for ${dest}! This links our shared split-cost expenses and confirmed itinerary.`;

    onSendMessage(selectedTraveler.id, proposalText);

    // Companion automatically accepts within 1.5 seconds to complete two-sided confirmation!
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const acceptText = `🎉 Companion Buddy Confirmation Accepted! We are officially travel buddies for ${dest}. Our names are now synced for shared expenses and split costs!`;
      if (getAppSettings().chatSounds) playAudioAlert();
      onSendMessage(selectedTraveler.id, acceptText);
      if (onConfirmBuddy) {
        onConfirmBuddy(selectedTraveler.id);
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Filter conversations for left pane
  const filteredTravelers = otherTravelers.filter((t) => {
    if (filterStarredOnly && !t.isStarred) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchDest = (t.currentDestination || '').toLowerCase().includes(q);
      const matchCity = t.homeCity.toLowerCase().includes(q);
      if (!matchName && !matchDest && !matchCity) return false;
    }
    return true;
  });

  const currentMessages = selectedTraveler ? chats[selectedTraveler.id] || [] : [];
  const selectedTrip = selectedTraveler
    ? trips.find((tr) => tr.travelerId === selectedTraveler.id)
    : undefined;

  const activeChatCount = Object.keys(chats).filter((k) => (chats[k] || []).length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header — minimal */}
      <div className="pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              {getTranslation('directMessaging')}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              {getTranslation('messagesTitle')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              {getTranslation('messagesSub')}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeChatCount} {getTranslation('activeChats')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="w-3 h-3" />
                {getTranslation('verifiedSoloTravelers')}
              </span>
            </div>
          </div>

          <button
            onClick={() => setFilterStarredOnly(!filterStarredOnly)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer self-start sm:self-auto ${
              filterStarredOnly
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterStarredOnly ? 'fill-amber-400 text-amber-500' : ''}`} />
            <span>{getTranslation('starredOnly')}</span>
          </button>
        </div>
      </div>

      {/* Main Chat Container: 2-column layout (list left, chat right) — chat stays glued in view
          with a sticky offset under the nav, so no scrolling the page to reach messages.
          On mobile it switches to a single pane: list ⇄ chat with a back button. */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-10rem)] md:h-[calc(100vh-11rem)] md:sticky md:top-20 min-h-[480px]">
        {/* Left Column: Companion Conversations List (hidden on mobile while a chat is open) */}
        <div className={`md:col-span-5 lg:col-span-4 border-r border-slate-200 dark:border-slate-800 flex-col bg-slate-50/60 dark:bg-slate-950/40 min-h-0 ${selectedTraveler ? 'hidden md:flex' : 'flex'}`}>
          {/* Search bar inside left column */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={getTranslation('searchCompanionsChat')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-full bg-slate-100 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-slate-100 transition-colors"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTravelers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No companions found matching your criteria.
              </div>
            ) : (
              filteredTravelers.map((traveler) => {
                const threadMessages = chats[traveler.id] || [];
                const lastMsg = threadMessages[threadMessages.length - 1];
                const isSelected = selectedTraveler?.id === traveler.id;

                return (
                  <div
                    key={traveler.id}
                    onClick={() => openChat(traveler.id)}
                    className={`p-3 flex items-start gap-3 cursor-pointer rounded-xl transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30 border border-rose-200 dark:border-rose-900/60 shadow-xs'
                        : 'hover:bg-white dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfilePopupTravelerId(traveler.id);
                        }}
                        className="cursor-pointer rounded-full hover:scale-105 transition-transform block"
                        title={`View ${traveler.name.split(' ')[0]}'s profile`}
                      >
                        <img
                          src={traveler.avatar}
                          alt={traveler.name}
                          referrerPolicy="no-referrer"
                          className={`w-11 h-11 rounded-full object-cover ring-2 ${isSelected ? 'ring-rose-300 dark:ring-rose-800' : 'ring-white dark:ring-slate-800'} shadow-sm`}
                        />
                      </button>
                      <PresenceBadge status={presenceForTraveler(traveler.id, currentUser.id)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {traveler.name}
                          </span>
                          {traveler.isStarred && (
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                          )}
                        </div>
                        {lastMsg && (
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {lastMsg.timestamp.includes('Today') ? 'Today' : lastMsg.timestamp.split('at')[0]}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {traveler.currentDestination}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                        {lastMsg ? lastMsg.text : 'No messages yet. Tap to start chatting!'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Pane (hidden on mobile until a chat is picked) */}
        {selectedTraveler ? (
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full min-h-0 bg-slate-50/40 dark:bg-slate-950/20 max-md:col-span-1">
            {/* Companion Header Bar */}
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Mobile back-to-list */}
                <button
                  type="button"
                  onClick={closeChat}
                  className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                  title={getTranslation('backToChats')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setProfilePopupTravelerId(selectedTraveler.id)}
                  className="relative shrink-0 cursor-pointer rounded-full hover:scale-105 transition-transform"
                  title={`View ${selectedTraveler.name.split(' ')[0]}'s profile`}
                >
                  <img
                    src={selectedTraveler.avatar}
                    alt={selectedTraveler.name}
                    referrerPolicy="no-referrer"
                    className={`w-11 h-11 rounded-full object-cover ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-rose-300 dark:ring-rose-800`}
                  />
                  <PresenceBadge status={presenceForTraveler(selectedTraveler.id, currentUser.id)} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {selectedTraveler.name}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({selectedTraveler.country})
                    </span>
                    {(() => {
                      const st = presenceForTraveler(selectedTraveler.id, currentUser.id);
                      const labels: Record<PresenceStatus, string> = {
                        online: 'Online now',
                        dnd: 'Do not disturb',
                        offline: 'Offline',
                        hidden: ''
                      };
                      if (st === 'hidden') return null;
                      return (
                        <span
                          className={`text-[10px] font-semibold ${
                            st === 'online' ? 'text-emerald-600 dark:text-emerald-400' : st === 'dnd' ? 'text-indigo-500' : 'text-orange-500'
                          }`}
                        >
                          · {labels[st]}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{selectedTraveler.currentDestination}</span>
                    {selectedTrip && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-[11px]">
                          {selectedTrip.startDate} – {selectedTrip.endDate}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {selectedTraveler.isConfirmedBuddy ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-full shadow-2xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>Buddy 🤝</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleProposeBuddy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 rounded-full hover:brightness-105 hover:shadow-md transition-all shadow-2xs cursor-pointer"
                    title="Send a mutual companion buddy confirmation"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>Confirm Buddy</span>
                  </button>
                )}

                <button
                  onClick={() => onToggleStarTraveler(selectedTraveler.id)}
                  className={`p-2 rounded-full border transition-all cursor-pointer hover:scale-110 ${
                    selectedTraveler.isStarred
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                  }`}
                  title={selectedTraveler.isStarred ? 'Unstar companion' : 'Star companion'}
                >
                  <Star className={`w-4 h-4 ${selectedTraveler.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                </button>

                {selectedTrip && (
                  <button
                    onClick={() => onGoToItinerary(selectedTrip.destination)}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:border-rose-300 dark:hover:border-rose-800 transition-colors cursor-pointer"
                  >
                    <span>Trip Itinerary</span>
                  </button>
                )}
              </div>
            </div>

            {/* Safety & Meeting Advice Banner */}
            <div className="px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-b border-amber-100 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>
                💡 Meet in public, in daylight. Split costs safely.
              </span>
              <span className="font-mono font-semibold hidden sm:inline">
                {selectedTraveler.isConfirmedBuddy ? 'Official Companion Buddy' : 'Verified Solo Traveller'}
              </span>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-rose-500/30">
                    <Smile className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Start a conversation with {selectedTraveler.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Say hello, compare dates for {selectedTraveler.currentDestination}, or suggest splitting an activity.
                  </p>
                </div>
              ) : (
                currentMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const isProposal = msg.text.includes('Companion Buddy Confirmation Proposal');
                  const isAccepted = msg.text.includes('Companion Buddy Confirmation Accepted');

                  if (isProposal) {
                    return (
                      <div key={msg.id} className="w-full my-3 flex justify-center">
                        <div className="max-w-md w-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/60 p-4 rounded-2xl shadow-xs text-xs space-y-2">
                          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                            <HeartHandshake className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span>Two-Sided Companion Buddy Proposal</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                            {msg.text}
                          </p>
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                            • Once accepted, {selectedTraveler.name} is added to your confirmed split expense payer names.
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (isAccepted) {
                    return (
                      <div key={msg.id} className="w-full my-3 flex justify-center">
                        <div className="max-w-md w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-2xl shadow-xs text-xs space-y-1.5">
                          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>Official Companion Buddy Confirmed!</span>
                          </div>
                          <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed text-[11px]">
                            {msg.text}
                          </p>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                            ✓ Synced to Trip Cost Split Ledger & Payer dropdown
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isMe && (
                        <img
                          src={selectedTraveler.avatar}
                          alt={selectedTraveler.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0 mb-4"
                        />
                      )}
                      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-rose-600 text-white rounded-2xl rounded-br-md'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl rounded-bl-md'
                          }`}
                        >
                          {msg.text}
                        </div>
                        {/* Translation panel (received messages only) */}
                        {!isMe && showTranslation[msg.id] && translations[msg.id]?.status === 'done' && (
                          <div className="mt-1 px-3 py-2 max-w-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/50 rounded-xl text-[11px] leading-relaxed text-indigo-900 dark:text-indigo-200 italic">
                            {translations[msg.id]?.text}
                          </div>
                        )}
                        {!isMe && translations[msg.id]?.status === 'error' && (
                          <div className="mt-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] text-slate-500 dark:text-slate-400">
                            Translation unavailable right now — check your connection and try again.
                          </div>
                        )}
                        <div className={`flex items-center gap-2 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {msg.timestamp}
                          </span>
                          {!isMe && (
                            <button
                              type="button"
                              onClick={() => handleTranslateMessage(msg)}
                              className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                              title={showTranslation[msg.id] ? 'Hide translation' : 'Translate this message'}
                            >
                              {translations[msg.id]?.status === 'loading' ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Translating…</span>
                                </>
                              ) : (
                                <>
                                  <Languages className="w-3 h-3" />
                                  <span>{showTranslation[msg.id] && translations[msg.id]?.status === 'done' ? 'Hide translation' : 'Translate'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2 mb-3">
                  <img
                    src={selectedTraveler.avatar}
                    alt={selectedTraveler.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-xs">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starters / Suggested Prompts */}
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick:
              </span>
              {QUICK_STARTERS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/60 rounded-full whitespace-nowrap transition-all cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Text Input Bar */}
            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Message ${selectedTraveler.name.split(' ')[0]}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-2.5 text-xs border border-slate-300 dark:border-slate-700 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-full text-white bg-rose-600 hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/30 disabled:opacity-40 disabled:hover:shadow-none transition-all cursor-pointer shrink-0 flex items-center justify-center"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex md:col-span-7 lg:col-span-8 flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white mb-3 shadow-lg shadow-rose-500/30">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{getTranslation('noCompanionSelected')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              {getTranslation('selectTravelerHint')}
            </p>
          </div>
        )}

        {/* Avatar-tap profile popup — bio + trips shared publicly */}
        {profilePopupTravelerId && (
          <TravelerProfilePopup
            traveler={travelers.find((t) => t.id === profilePopupTravelerId) || travelers[0]}
            currentUserId={currentUser.id}
            itineraries={itineraries}
            onClose={() => setProfilePopupTravelerId(null)}
            onOpenChat={(t) => {
              openChat(t.id);
              setProfilePopupTravelerId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
