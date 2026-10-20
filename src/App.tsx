import React, { useState, useEffect } from 'react';
import {
  SoloTraveler,
  TravelTrip,
  TravelActivity,
  ExpenseItem,
  SoloPersonalExpense,
  TravelItinerary,
  ChatMessage,
  SafeCheckinRecord,
  CompanionReview
} from './types/travel';
import {
  CURRENT_USER,
  INITIAL_TRAVELERS,
  INITIAL_TRIPS,
  INITIAL_ACTIVITIES,
  INITIAL_EXPENSES,
  INITIAL_SOLO_EXPENSES,
  INITIAL_ITINERARIES,
  INITIAL_CHATS,
  INITIAL_SAFETY_CHECKIN
} from './data/mockData';
import { Navigation, NavTab } from './components/Navigation';
import { ItineraryView } from './components/ItineraryView';
import { MyProfileView } from './components/MyProfileView';
import { TripChatModal } from './components/TripChatModal';
import { CreateTripModal } from './components/CreateTripModal';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { SettingsView } from './components/SettingsView';
import { TravelMapMemoriesView } from './components/TravelMapMemoriesView';
import { TravelStoriesHubView } from './components/TravelStoriesHubView';
import { playAudioAlert, getTranslation } from './utils/i18n';
import { getAppSettings } from './utils/settings';
import { BellRing, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('itinerary');
  const [selectedDestination, setSelectedDestination] = useState<string>('All Destinations');
  const [selectedInterest, setSelectedInterest] = useState<string>('All Interests');
  const [selectedScope, setSelectedScope] = useState<string>('All Trips');
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);

  // Persistence in localStorage
  const [currentUser, setCurrentUser] = useState<SoloTraveler>(() => {
    const saved = localStorage.getItem('roamtogether_current_user');
    return saved ? JSON.parse(saved) : CURRENT_USER;
  });

  const [travelers, setTravelers] = useState<SoloTraveler[]>(() => {
    const saved = localStorage.getItem('roamtogether_travelers');
    return saved ? JSON.parse(saved) : INITIAL_TRAVELERS;
  });

  const [trips, setTrips] = useState<TravelTrip[]>(() => {
    const saved = localStorage.getItem('roamtogether_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [itineraries, setItineraries] = useState<TravelItinerary[]>(() => {
    const saved = localStorage.getItem('roamtogether_itineraries');
    return saved ? JSON.parse(saved) : INITIAL_ITINERARIES;
  });

  const [activities, setActivities] = useState<TravelActivity[]>(() => {
    const saved = localStorage.getItem('roamtogether_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  const [soloExpenses, setSoloExpenses] = useState<SoloPersonalExpense[]>(() => {
    const saved = localStorage.getItem('roamtogether_solo_expenses');
    return saved ? JSON.parse(saved) : INITIAL_SOLO_EXPENSES;
  });

  const [sharedExpenses, setSharedExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('roamtogether_shared_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('roamtogether_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  const [safetyRecord, setSafetyRecord] = useState<SafeCheckinRecord>(() => {
    const saved = localStorage.getItem('roamtogether_safety');
    return saved ? JSON.parse(saved) : INITIAL_SAFETY_CHECKIN;
  });

  // Active Companion Chat Thread
  const [activeCompanionChatId, setActiveCompanionChatId] = useState<string | null>(null);

  // Modals
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [activeChatActivityId, setActiveChatActivityId] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('roamtogether_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('roamtogether_travelers', JSON.stringify(travelers));
  }, [travelers]);

  useEffect(() => {
    localStorage.setItem('roamtogether_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('roamtogether_itineraries', JSON.stringify(itineraries));
  }, [itineraries]);

  useEffect(() => {
    localStorage.setItem('roamtogether_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('roamtogether_solo_expenses', JSON.stringify(soloExpenses));
  }, [soloExpenses]);

  useEffect(() => {
    localStorage.setItem('roamtogether_shared_expenses', JSON.stringify(sharedExpenses));
  }, [sharedExpenses]);

  useEffect(() => {
    localStorage.setItem('roamtogether_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('roamtogether_safety', JSON.stringify(safetyRecord));
  }, [safetyRecord]);

  // Apply saved display theme (light / dark / system) on startup and whenever
  // Settings broadcasts a change; also force a re-render so interface language
  // switches propagate to Navigation and other translated labels.
  const [, forceRender] = useState(0);
  useEffect(() => {
    const applyTheme = () => {
      try {
        const saved = localStorage.getItem('wanderlust_app_settings');
        const theme = saved ? JSON.parse(saved).theme : 'light';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);
      } catch {
        document.documentElement.classList.remove('dark');
      }
      // Right-to-left layout for Arabic
      const lang = localStorage.getItem('wanderlust_app_lang') || 'en';
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    };
    const onSettingsChanged = () => {
      applyTheme();
      forceRender((n) => n + 1);
    };
    applyTheme();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', applyTheme);
    window.addEventListener('wanderlust-settings-changed', onSettingsChanged);
    return () => {
      media.removeEventListener('change', applyTheme);
      window.removeEventListener('wanderlust-settings-changed', onSettingsChanged);
    };
  }, []);

  // Morning itinerary reminder toast — honours Settings → "Morning daily
  // itinerary schedule notifications". Shows once per day, auto-dismisses.
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  useEffect(() => {
    const settings = getAppSettings();
    if (!settings.tripReminders) return;
    const todayKey = new Date().toISOString().split('T')[0];
    if (localStorage.getItem('wanderlust_last_reminder') === todayKey) return;
    const upcoming = itineraries[0];
    const firstDayPlan = upcoming?.days?.[0];
    const todayPlan = firstDayPlan
      ? `${firstDayPlan.title} — ${firstDayPlan.morningActivity}`
      : upcoming?.notes;
    const text = upcoming
      ? `Good morning, ${CURRENT_USER.name.split(' ')[0]}! Today on your ${upcoming.destination} plan: ${todayPlan}`
      : `Good morning, ${CURRENT_USER.name.split(' ')[0]}! Ready to plan today's adventure?`;
    const showTimer = setTimeout(() => {
      setReminderToast(text);
      localStorage.setItem('wanderlust_last_reminder', todayKey);
      if (getAppSettings().chatSounds) playAudioAlert();
    }, 2500);
    const hideTimer = setTimeout(() => setReminderToast(null), 12500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Star / Favorite Companion Handler
  const handleToggleStarTraveler = (travelerId: string) => {
    setTravelers((prev) =>
      prev.map((t) => (t.id === travelerId ? { ...t, isStarred: !t.isStarred } : t))
    );
  };

  // Persist a 5-star companion review onto the traveler's profile
  const handleAddCompanionReview = (travelerId: string, review: CompanionReview) => {
    setTravelers((prev) =>
      prev.map((t) => {
        if (t.id !== travelerId) return t;
        const updatedReviews = [review, ...(t.reviews || [])];
        const newAvgRating = Number(
          (updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(2)
        );
        return {
          ...t,
          reviews: updatedReviews,
          safetyRating: newAvgRating,
          vouchedByCount: (t.vouchedByCount || 0) + 1
        };
      })
    );
  };

  // Direct Companion Messaging Handler
  const handleOpenDirectChatWithTraveler = (traveler: SoloTraveler, destination?: string) => {
    setActiveCompanionChatId(traveler.id);
    if (!chats[traveler.id] || chats[traveler.id].length === 0) {
      const destText = destination || traveler.currentDestination || 'the trip';
      setChats((prev) => ({
        ...prev,
        [traveler.id]: [
          {
            id: `msg_init_${Date.now()}`,
            threadId: traveler.id,
            senderId: traveler.id,
            text: `Hey ${currentUser.name.split(' ')[0]}! Great connecting with you for ${destText.split(',')[0]}. Let's coordinate our schedule and activities!`,
            timestamp: 'Just now'
          }
        ]
      }));
    }
    setActiveTab('messages');
  };

  const handleSendDirectMessage = (threadId: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      threadId,
      senderId: currentUser.id,
      text,
      timestamp: 'Just now'
    };

    setChats((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), newMsg]
    }));
  };

  const handleAddItinerary = (itinerary: TravelItinerary) => {
    setItineraries((prev) => [itinerary, ...prev]);
  };

  const handleUpdateItinerary = (updatedItin: TravelItinerary) => {
    setItineraries((prev) =>
      prev.map((it) => (it.id === updatedItin.id ? updatedItin : it))
    );
  };

  const handleDeleteItinerary = (id: string) => {
    setItineraries((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAddSoloExpense = (expense: Omit<SoloPersonalExpense, 'id'>) => {
    const newExpense: SoloPersonalExpense = {
      ...expense,
      id: `solo_exp_${Date.now()}`
    };
    setSoloExpenses((prev) => [newExpense, ...prev]);
  };

  const handleDeleteSoloExpense = (id: string) => {
    setSoloExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDeleteSharedExpense = (id: string) => {
    setSharedExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddSharedExpense = (expenseData: Omit<ExpenseItem, 'id' | 'settled'>) => {
    const newExpense: ExpenseItem = {
      ...expenseData,
      id: `exp_${Date.now()}`,
      settled: false
    };
    setSharedExpenses((prev) => [newExpense, ...prev]);
  };

  const handleToggleSharedSettled = (id: string) => {
    setSharedExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, settled: !exp.settled } : exp))
    );
  };

  const handleJoinActivity = (activityId: string) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id === activityId && !act.participantIds.includes(currentUser.id)) {
          return {
            ...act,
            participantIds: [...act.participantIds, currentUser.id]
          };
        }
        return act;
      })
    );

    const newMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      threadId: activityId,
      senderId: currentUser.id,
      text: `${currentUser.name} joined this activity!`,
      timestamp: 'Just now',
      isSystem: true
    };
    setChats((prev) => ({
      ...prev,
      [activityId]: [...(prev[activityId] || []), newMsg]
    }));
  };

  const handleLeaveActivity = (activityId: string) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id === activityId) {
          return {
            ...act,
            participantIds: act.participantIds.filter((id) => id !== currentUser.id)
          };
        }
        return act;
      })
    );
  };

  const handleCreateNewActivity = (
    newActData: Omit<TravelActivity, 'id' | 'participantIds' | 'status'>
  ) => {
    const id = `act_${Date.now()}`;
    const newAct: TravelActivity = {
      ...newActData,
      id,
      participantIds: [currentUser.id],
      status: 'open'
    };

    setActivities((prev) => [newAct, ...prev]);

    setChats((prev) => ({
      ...prev,
      [id]: [
        {
          id: `msg_${Date.now()}`,
          threadId: id,
          senderId: currentUser.id,
          text: `Welcome! I posted this activity for ${newAct.title}. Looking forward to coordinating meetup time and exploring together!`,
          timestamp: 'Just now'
        }
      ]
    }));

    setActiveTab('activities');
    setActiveChatActivityId(id);
  };

  const handleSendActivityMessage = (threadId: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      threadId,
      senderId: currentUser.id,
      text,
      timestamp: 'Just now'
    };

    setChats((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), newMsg]
    }));

    const activity = activities.find((a) => a.id === threadId);
    if (activity && activity.hostId !== currentUser.id) {
      setTimeout(() => {
        const host = travelers.find((t) => t.id === activity.hostId);
        if (host) {
          if (getAppSettings().chatSounds) playAudioAlert();
          const replyMsg: ChatMessage = {
            id: `msg_reply_${Date.now()}`,
            threadId,
            senderId: host.id,
            text: `Thanks for reaching out ${currentUser.name.split(' ')[0]}! Looking forward to traveling together. See you at ${activity.meetPointPublic}.`,
            timestamp: 'Just now'
          };
          setChats((prev) => ({
            ...prev,
            [threadId]: [...(prev[threadId] || []), replyMsg]
          }));
        }
      }, 1400);
    }
  };

  const handleSaveNewTrip = (tripData: Omit<TravelTrip, 'id' | 'travelerId'>) => {
    const newTrip: TravelTrip = {
      ...tripData,
      id: `trip_${Date.now()}`,
      travelerId: currentUser.id
    };
    setTrips((prev) => [newTrip, ...prev]);
    setSelectedDestination(newTrip.destination);
    setActiveTab('itinerary');
  };

  const handleUpdateProfile = (updated: Partial<SoloTraveler>) => {
    setCurrentUser((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateSafetyRecord = (partial: Partial<SafeCheckinRecord>) => {
    setSafetyRecord((prev) => ({ ...prev, ...partial }));
  };

  const activeChatActivity = activities.find((a) => a.id === activeChatActivityId);
  const myTrips = trips.filter((t) => t.travelerId === currentUser.id);

  // Helper to check if destination matches current filter
  const isMatchingDestination = (dest: string | undefined, filter: string) => {
    if (!filter || filter === 'All Destinations') return true;
    if (!dest) return false;
    const prefix = filter.toLowerCase().split(',')[0].trim();
    return dest.toLowerCase().includes(prefix);
  };

  // Open activities matching selected destination
  const filteredOpenActivities = activities.filter(
    (a) => a.status === 'open' && isMatchingDestination(a.destination, selectedDestination)
  );

  // Starred companions matching selected destination
  const filteredStarredCompanions = travelers.filter((t) => {
    if (!t.isStarred || t.id === currentUser.id) return false;
    if (selectedDestination === 'All Destinations') return true;
    const hasMatchingTrip = trips.some(
      (tr) => tr.travelerId === t.id && isMatchingDestination(tr.destination, selectedDestination)
    );
    return hasMatchingTrip || isMatchingDestination(t.currentDestination, selectedDestination);
  });

  const openActivitiesCount = filteredOpenActivities.length;
  const starredCompanionsCount = filteredStarredCompanions.length;

  const directConversationsCount = Object.keys(chats).filter((k) =>
    travelers.some((t) => t.id === k && t.id !== currentUser.id)
  ).length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#090D16] flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCreateTrip={() => setIsCreateTripOpen(true)}
        onOpenSOS={() => setIsSOSModalOpen(true)}
        openActivitiesCount={openActivitiesCount}
        starredCompanionsCount={starredCompanionsCount}
        totalConversationsCount={directConversationsCount}
        selectedDestination={selectedDestination}
        onClearDestination={() => setSelectedDestination('All Destinations')}
        currentUser={currentUser}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'itinerary' && (
          <ItineraryView
            itineraries={itineraries}
            currentUser={currentUser}
            onAddItinerary={handleAddItinerary}
            onUpdateItinerary={handleUpdateItinerary}
            onDeleteItinerary={handleDeleteItinerary}
          />
        )}

        {/* Inspiration — travel guides worth copying */}
        {activeTab === 'stories' && (
          <TravelStoriesHubView
            currentUser={currentUser}
            onGoToDestination={(dest) => {
              setSelectedDestination(dest);
              setActiveTab('itinerary');
            }}
          />
        )}

        {/* Footprints — travel map & memories */}
        {activeTab === 'map' && (
          <TravelMapMemoriesView
            currentUser={currentUser}
            travelers={travelers}
            itineraries={itineraries}
            onOpenChatWithTraveler={handleOpenDirectChatWithTraveler}
            onGoToItinerary={(dest) => {
              setSelectedDestination(dest);
              setActiveTab('itinerary');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <MyProfileView
            currentUser={currentUser}
            safetyRecord={safetyRecord}
            onUpdateProfile={handleUpdateProfile}
            onUpdateSafetyRecord={handleUpdateSafetyRecord}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {/* Settings lives inside Profile — reached via the gear button on the profile page */}
        {activeTab === 'settings' && (
          <SettingsView userGender={currentUser.gender} onBack={() => setActiveTab('profile')} />
        )}
      </main>

      {/* Active Trip Activity Chat Modal (For Activity Pods) */}
      {activeChatActivity && (
        <TripChatModal
          activity={activeChatActivity}
          travelers={travelers}
          currentUser={currentUser}
          messages={chats[activeChatActivity.id] || []}
          onSendMessage={handleSendActivityMessage}
          onClose={() => setActiveChatActivityId(null)}
        />
      )}

      {/* Post Trip Modal */}
      <CreateTripModal
        currentUser={currentUser}
        isOpen={isCreateTripOpen}
        onClose={() => setIsCreateTripOpen(false)}
        onSaveTrip={handleSaveNewTrip}
      />

      {/* Emergency SOS Help Modal */}
      <EmergencySOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        currentUser={currentUser}
        activeDestination={selectedDestination}
        emergencyContacts={safetyRecord.emergencyContacts || []}
      />

      {/* Morning Itinerary Reminder Toast (Settings → trip reminders) */}
      {reminderToast && (
        <div className="fixed bottom-5 right-4 sm:right-5 z-50 max-w-sm bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 shadow-xl rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <BellRing className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Daily Itinerary Reminder</div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{reminderToast}</p>
          </div>
          <button
            onClick={() => setReminderToast(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
            aria-label="Dismiss reminder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clean Modern Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">WanderLust</span>
            <span aria-hidden="true">·</span>
            <span>Craft a premium day-by-day itinerary in one minute</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 flex-wrap">
            <span>1-Minute Trip Creation</span>
            <span aria-hidden="true">·</span>
            <span>Guide Link Parsing</span>
            <span aria-hidden="true">·</span>
            <span>Smart Route Maps</span>
            <span aria-hidden="true">·</span>
            <span>Field-Tested Travel Guides</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
