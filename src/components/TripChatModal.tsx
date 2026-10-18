import React, { useState } from 'react';
import { TravelActivity, SoloTraveler, ChatMessage } from '../types/travel';
import { Send, MapPin, Calendar, Users, Sparkles, ShieldCheck } from 'lucide-react';
import { generateCompanionIcebreakers } from '../services/geminiService';

interface TripChatModalProps {
  activity: TravelActivity;
  travelers: SoloTraveler[];
  currentUser: SoloTraveler;
  messages: ChatMessage[];
  onSendMessage: (threadId: string, text: string) => void;
  onClose: () => void;
}

export const TripChatModal: React.FC<TripChatModalProps> = ({
  activity,
  travelers,
  currentUser,
  messages,
  onSendMessage,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);

  const getTraveler = (id: string) => travelers.find((t) => t.id === id) || travelers[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(activity.id, inputText.trim());
    setInputText('');
  };

  const handleUseAiPrompt = async () => {
    setIsGeneratingIdea(true);
    const host = getTraveler(activity.hostId);
    try {
      const suggestions = await generateCompanionIcebreakers(
        currentUser,
        host,
        activity.destination,
        [activity.category, 'Photography', 'Food']
      );
      if (suggestions.length > 0) {
        setInputText(suggestions[0]);
      }
    } catch {
      setInputText(`Looking forward to ${activity.title}! Should we grab a quick coffee near the meeting point beforehand?`);
    } finally {
      setIsGeneratingIdea(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header with Activity Details */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-900">{activity.destination}</span>
              <span aria-hidden="true">·</span>
              <span>{activity.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{activity.participantIds.length} Going</span>
            </div>

            <h3 className="font-display font-bold text-base text-slate-950 mt-0.5">
              {activity.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono tabular-nums">{activity.date} at {activity.time}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Rendezvous: {activity.meetPointPublic}</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center text-xs text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Solo Traveler Coordination Space
            </div>
            <p>
              Coordinate meeting logistics and travel plans. Keep conversations respectful, confirm your daylight meetup spot, and check in with your safety contact.
            </p>
          </div>

          {messages.map((msg) => {
            const sender = getTraveler(msg.senderId);
            const isMe = msg.senderId === currentUser.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <img
                  src={sender.avatar}
                  alt={sender.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 self-end"
                />

                <div
                  className={`max-w-[75%] rounded-xl p-3 ${
                    isMe
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-900 rounded-bl-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1 text-[11px] opacity-75">
                    <span className="font-medium">{sender.name}</span>
                    <span className="font-mono tabular-nums">{msg.timestamp}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Quick Prompt Generator */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-900" />
            Travel Logistics & Icebreaker Assistant:
          </span>
          <button
            onClick={handleUseAiPrompt}
            disabled={isGeneratingIdea}
            className="text-xs font-medium text-slate-900 hover:underline cursor-pointer disabled:opacity-50"
          >
            {isGeneratingIdea ? 'Thinking...' : 'Insert suggested coordination prompt'}
          </button>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to coordinate rendezvous and details..."
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-900"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
