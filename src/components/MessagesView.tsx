import React, { useState, useEffect, useRef } from 'react';
import { SoloTraveler, TravelTrip, ChatMessage } from '../types/travel';
import {
  MessageSquare,
  Send,
  Star,
  Users,
  Calendar,
  MapPin,
  Sparkles,
  Search,
  CheckCheck,
  Plus,
  Check,
  HeartHandshake
} from 'lucide-react';
import { playAudioAlert, getTranslation } from '../utils/i18n';
import { getAppSettings } from '../utils/settings';

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
}

const QUICK_STARTERS = [
  'Hey! Are you free to meet up near the central train station?',
  'Would you be interested in splitting a taxi or car rental?',
  'What days are you planning to be in town?',
  'Looking for a dinner companion to try local specialties!'
];

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
  onConfirmBuddy
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // All other travelers (excluding current user)
  const otherTravelers = travelers.filter((t) => t.id !== currentUser.id);

  // Get active thread travelers: travelers who either have chat history or are currently selected
  const activeConversationTravelerIds = Array.from(
    new Set([
      ...Object.keys(chats).filter((key) => otherTravelers.some((t) => t.id === key)),
      ...(activeTravelerId ? [activeTravelerId] : [])
    ])
  );

  // Default to first conversation if none selected
  const selectedTraveler =
    travelers.find((t) => t.id === activeTravelerId) ||
    travelers.find((t) => t.id === activeConversationTravelerIds[0]) ||
    otherTravelers[0];

  useEffect(() => {
    if (selectedTraveler && activeTravelerId !== selectedTraveler.id) {
      onSelectTraveler(selectedTraveler.id);
    }
  }, [selectedTraveler, activeTravelerId, onSelectTraveler]);

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

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            {getTranslation('messagesTitle')}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {getTranslation('messagesSub')}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilterStarredOnly(!filterStarredOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              filterStarredOnly
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filterStarredOnly ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
            <span>Starred Only</span>
          </button>
        </div>
      </div>

      {/* Main Chat Container: 2-column layout */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
        {/* Left Column: Companion Conversations List */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
          {/* Search bar inside left column */}
          <div className="p-3.5 border-b border-slate-200 bg-white space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search companions or destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTravelers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
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
                    onClick={() => onSelectTraveler(traveler.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
                      isSelected
                        ? 'bg-white border-l-3 border-l-slate-900 shadow-xs'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={traveler.avatar}
                        alt={traveler.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-semibold text-slate-900 truncate">
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

                      <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {traveler.currentDestination}
                      </div>

                      <p className="text-[11px] text-slate-600 truncate mt-1">
                        {lastMsg ? lastMsg.text : 'No messages yet. Tap to start chatting!'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Pane */}
        {selectedTraveler ? (
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-[640px] bg-white">
            {/* Companion Header Bar */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/70">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={selectedTraveler.avatar}
                  alt={selectedTraveler.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">
                      {selectedTraveler.name}
                    </h3>
                    <span className="text-xs text-slate-500">
                      ({selectedTraveler.country})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Confirmed Buddy 🤝</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleProposeBuddy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                    title="Send a mutual companion buddy confirmation"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                    <span>Confirm Buddy</span>
                  </button>
                )}

                <button
                  onClick={() => onToggleStarTraveler(selectedTraveler.id)}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    selectedTraveler.isStarred
                      ? 'bg-amber-50 text-amber-600 border-amber-300'
                      : 'bg-white text-slate-400 border-slate-200 hover:text-amber-500'
                  }`}
                  title={selectedTraveler.isStarred ? 'Unstar companion' : 'Star companion'}
                >
                  <Star className={`w-4 h-4 ${selectedTraveler.isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                </button>

                {selectedTrip && (
                  <button
                    onClick={() => onGoToItinerary(selectedTrip.destination)}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span>Trip Itinerary</span>
                  </button>
                )}
              </div>
            </div>

            {/* Safety & Meeting Advice Banner */}
            <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span>
                💡 Public daylight meetups recommended. Coordinate excursions and cost-splits safely.
              </span>
              <span className="font-mono text-emerald-800 font-semibold">
                {selectedTraveler.isConfirmedBuddy ? 'Official Companion Buddy' : 'Verified Solo Traveler'}
              </span>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/20">
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Start a conversation with {selectedTraveler.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
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
                      <div key={msg.id} className="w-full my-2 flex justify-center">
                        <div className="max-w-md w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-3.5 rounded-xl shadow-xs text-xs space-y-2">
                          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                            <HeartHandshake className="w-4 h-4 text-amber-600" />
                            <span>Two-Sided Companion Buddy Proposal</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed text-[11px]">
                            {msg.text}
                          </p>
                          <div className="text-[10px] text-amber-700 font-medium">
                            • Once accepted, {selectedTraveler.name} is added to your confirmed split expense payer names.
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (isAccepted) {
                    return (
                      <div key={msg.id} className="w-full my-2 flex justify-center">
                        <div className="max-w-md w-full bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl shadow-xs text-xs space-y-1.5">
                          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Official Companion Buddy Confirmed!</span>
                          </div>
                          <p className="text-emerald-800 leading-relaxed text-[11px]">
                            {msg.text}
                          </p>
                          <div className="text-[10px] text-emerald-600 font-mono font-medium">
                            ✓ Synced to Trip Cost Split Ledger & Payer dropdown
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] text-slate-500 font-medium">
                          {isMe ? 'You' : selectedTraveler.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>

                      <div
                        className={`max-w-md px-3.5 py-2.5 rounded-xl text-xs leading-relaxed shadow-xs ${
                          isMe
                            ? 'bg-slate-900 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>{selectedTraveler.name} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starters / Suggested Prompts */}
            <div className="px-4 py-2 border-t border-slate-100 bg-white overflow-x-auto flex items-center gap-1.5 scrollbar-none">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick:
              </span>
              {QUICK_STARTERS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Text Input Bar */}
            <div className="p-3.5 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Message ${selectedTraveler.name.split(' ')[0]}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="md:col-span-7 lg:col-span-8 flex flex-col items-center justify-center text-center p-12 bg-white">
            <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-900">No companion selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Select a traveler from the left to view messages or start a new conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
