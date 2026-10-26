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
import { AccountView } from './components/AccountView';
import { usePingCollector } from './hooks/usePingCollector';
import { TravelMapMemoriesView } from './components/TravelMapMemoriesView';
import { PassportView } from './components/PassportView';
import { ExploreView } from './components/ExploreView';
import { TripDetailView } from './components/TripDetailView';
import { OnboardingView, OnboardingAnswers } from './components/OnboardingView';
import { buildBasicGuide } from './utils/guideBuilder';
import { suggestPlacesFor } from './utils/placeGeo';
import { resolveDestination } from './utils/resolveDestination';
import { playAudioAlert, getTranslation } from './utils/i18n';
import { getAppSettings } from './utils/settings';
import { upsertMemoryFromItinerary, removeMemoryForItinerary } from './utils/journalSync';
import { BellRing, X } from 'lucide-react';

export default function App() {
  // Crash-test hook (harmless): ?__crash_test=1 throws during render so the
  // error boundary's recovery screen can be verified end-to-end.
  if (new URLSearchParams(window.location.search).has('__crash_test')) {
    throw new Error('intentional crash test');
  }
  const [activeTab, setActiveTab] = useState<NavTab>('itinerary');
  // Server-side GPS ping collection — runs app-wide (consent-gated, signed-in only)
  usePingCollector();
  // Trip detail page — set when a trip card is tapped; cleared by "Back to trips"
  const [detailTripId, setDetailTripId] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string>('All Destinations');
  const [selectedInterest, setSelectedInterest] = useState<string>('All Interests');
  const [selectedScope, setSelectedScope] = useState<string>('All Trips');
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);

  // First-run onboarding wizard — shown once to a brand-new (blank) profile
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      const saved = localStorage.getItem('roamtogether_current_user');
      const u = saved ? JSON.parse(saved) : CURRENT_USER;
      // Nationality is mandatory (visa rules must never be guessed) — a profile
      // without a passport country goes through the wizard, even if it skipped
      // or finished it before this rule existed.
      if (!u.country) return true;
      return !localStorage.getItem('wanderlust_onboarded_v1');
    } catch {
      return false;
    }
  });

  // "Traveler since" on the passport = the year this account was created here
  useEffect(() => {
    if (!localStorage.getItem('wanderlust_registered_at')) {
      localStorage.setItem('wanderlust_registered_at', new Date().toISOString());
    }
  }, []);

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
        // One-time migration: sessions that never chose a theme land on the
        // new Daybreak (bright) default. Anyone who explicitly picked Galaxy
        // (dark) keeps it.
        if (!localStorage.getItem('wanderlust_galaxy_v1')) {
          localStorage.setItem('wanderlust_galaxy_v1', '1');
          const prev = saved ? JSON.parse(saved) : {};
          if (!prev.theme) {
            localStorage.setItem('wanderlust_app_settings', JSON.stringify({ ...prev, theme: 'light' }));
          }
        }
        const fresh = localStorage.getItem('wanderlust_app_settings');
        // Daybreak is the default: a missing theme value means the traveller
        // never chose one, so fall back to bright (getAppSettings agrees).
        const theme = fresh ? JSON.parse(fresh).theme || 'light' : 'light';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);
      } catch {
        // Corrupted storage — open in the default bright theme rather than dark.
        document.documentElement.classList.remove('dark');
      }
      // Right-to-left layout for Arabic + Persian; sync the standalone
      // language key from settings so getTranslation() sees it on boot,
      // even before the Settings screen has ever been opened.
      let lang = localStorage.getItem('wanderlust_app_lang') || 'en';
      try {
        const s = JSON.parse(localStorage.getItem('wanderlust_app_settings') || '{}');
        if (s.language && s.language !== lang) {
          lang = s.language;
          localStorage.setItem('wanderlust_app_lang', lang);
        }
      } catch {
        /* keep the standalone key as-is */
      }
      document.documentElement.dir = lang === 'ar' || lang === 'fa' ? 'rtl' : 'ltr';
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
    upsertMemoryFromItinerary(itinerary); // pin the trip onto My Journal automatically
  };

  const handleUpdateItinerary = (updatedItin: TravelItinerary) => {
    setItineraries((prev) =>
      prev.map((it) => (it.id === updatedItin.id ? updatedItin : it))
    );
    upsertMemoryFromItinerary(updatedItin); // keep the linked journal memory in step
  };

  const handleDeleteItinerary = (id: string) => {
    setItineraries((prev) => prev.filter((it) => it.id !== id));
    removeMemoryForItinerary(id); // its journal memory goes with it
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

  /**
   * Onboarding finished — the answers become:
   *  1) the travel passport (name, nationality, home city, age, languages,
   *     hobbies, motto as bio),
   *  2) the first auto-planned itinerary (route map ready from day one), and
   *  3) the linked journal memory (via handleAddItinerary → journalSync).
   */
  const handleOnboardingComplete = (a: OnboardingAnswers) => {
    const dob = a.birthday ? new Date(a.birthday).getTime() : NaN;
    const age =
      Number.isFinite(dob) && dob < Date.now()
        ? Math.max(1, Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000)))
        : currentUser.age;

    // Resolve "zürich" → "Zürich, Switzerland", "japan" → "Japan" — the card
    // always shows the canonical city + country (or just the country).
    const resolved = resolveDestination(a.destination);
    const display = resolved.display || a.destination.trim();

    handleUpdateProfile({
      ...(a.name ? { name: a.name } : {}),
      country: a.nationality,
      homeCity: a.homeCity,
      age,
      ...(a.gender ? { gender: a.gender as SoloTraveler['gender'] } : {}),
      languages: a.languages,
      interests: a.hobbies,
      bio: a.motto,
      travelGoals: a.motto ? [a.motto] : currentUser.travelGoals,
      currentDestination: display // journal "You" pin + share card follow the trip
    });

    // Auto-plan the first trip: real sights near the destination fill the
    // day slots so the route map renders the moment the trip exists. The
    // dates come straight from the onboarding question (fallback: in 2 weeks).
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const fallbackStart = new Date();
    fallbackStart.setDate(fallbackStart.getDate() + 14);
    const startDate = a.startDate || iso(fallbackStart);
    const dayCount = (() => {
      if (a.endDate && a.endDate >= startDate) {
        const n =
          Math.round(
            (new Date(`${a.endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) / 86400000
          ) + 1;
        return Math.max(1, Math.min(60, n));
      }
      return a.dayCount;
    })();
    const endDate = a.endDate && a.endDate >= startDate ? a.endDate : (() => {
      const e = new Date(`${startDate}T00:00:00`);
      e.setDate(e.getDate() + dayCount - 1);
      return iso(e);
    })();

    const guide = buildBasicGuide(
      display,
      resolved.country,
      resolved.city || undefined,
      a.nationality,
      startDate,
      endDate
    );
    const anchor = resolved.city || resolved.country || display;
    const suggestions = suggestPlacesFor(anchor, dayCount * 3);
    const dayPlans = Array.from({ length: dayCount }, (_, i) => {
      const picks = suggestions.slice(i * 3, i * 3 + 3);
      return {
        dayNumber: i + 1,
        title: '',
        morningActivity: picks[0]
          ? `Visit ${picks[0].name}`
          : 'Free morning to explore at your own pace.',
        afternoonActivity: picks[1]
          ? `Explore ${picks[1].name}`
          : 'Free afternoon — wander, taste, discover.',
        eveningActivity: picks[2]
          ? `Evening at ${picks[2].name}`
          : 'Evening at leisure — dinner somewhere local.'
      };
    });

    const newItinerary: TravelItinerary = {
      id: `itin_${Date.now()}`,
      travelerId: currentUser.id,
      destination: display,
      country: resolved.country || guide.destinationCountry,
      startDate,
      endDate,
      companionPurpose: ['Solo Exploration'],
      notes: '', // trip notes are penned on the trip page — never the motto
      days: dayPlans,
      travelGuide: guide,
      visibility: 'public'
    };

    handleAddItinerary(newItinerary); // also pins it onto My Journal
    localStorage.setItem('wanderlust_onboarded_v1', '1');
    setShowOnboarding(false);
    setActiveTab('itinerary');
    setDetailTripId(newItinerary.id); // land on the new trip's journey board
  };

  // (no skip handler — onboarding is mandatory so nationality is always known)

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
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors md:pl-[76px]">
      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setDetailTripId(null);
          setActiveTab(tab);
        }}
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
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-28 md:pb-10">
        {activeTab === 'itinerary' &&
          (() => {
            const detailTrip = detailTripId
              ? itineraries.find((it) => it.id === detailTripId)
              : undefined;
            return detailTrip ? (
              <TripDetailView
                itinerary={detailTrip}
                currentUser={currentUser}
                travelers={travelers}
                soloExpenses={soloExpenses}
                sharedExpenses={sharedExpenses}
                trips={trips}
                itineraries={itineraries}
                onBack={() => setDetailTripId(null)}
                onAddItinerary={handleAddItinerary}
                onUpdateItinerary={handleUpdateItinerary}
                onDeleteItinerary={handleDeleteItinerary}
                onAddSoloExpense={handleAddSoloExpense}
                onAddSharedExpense={handleAddSharedExpense}
                onToggleSharedSettled={handleToggleSharedSettled}
                onDeleteSoloExpense={handleDeleteSoloExpense}
                onDeleteSharedExpense={handleDeleteSharedExpense}
              />
            ) : (
              <ItineraryView
                itineraries={itineraries}
                currentUser={currentUser}
                soloExpenses={soloExpenses}
                sharedExpenses={sharedExpenses}
                onAddItinerary={handleAddItinerary}
                onUpdateItinerary={handleUpdateItinerary}
                onDeleteItinerary={handleDeleteItinerary}
                onOpenTripDetail={(it) => setDetailTripId(it.id)}
              />
            );
          })()}

        {/* Explore — shared activities + travel tips */}
        {activeTab === 'stories' && (
          <ExploreView
            activities={activities}
            travelers={travelers}
            currentUser={currentUser}
            selectedDestination={selectedDestination}
            onJoinActivity={handleJoinActivity}
            onLeaveActivity={handleLeaveActivity}
            onOpenActivityChat={setActiveChatActivityId}
            onCreateNewActivity={handleCreateNewActivity}
            onDeleteActivity={(id) => setActivities((prev) => prev.filter((a) => a.id !== id))}
            onGoToDestination={(dest) => {
              setSelectedDestination(dest);
              setActiveTab('itinerary');
            }}
          />
        )}

        {/* Passport — travel passport, entry stamps & the traveller's profile */}
        {activeTab === 'map' && (
          <div className="space-y-8">
            <PassportView
              currentUser={currentUser}
              itineraries={itineraries}
              soloExpenses={soloExpenses}
              sharedExpenses={sharedExpenses}
              onUpdateProfile={handleUpdateProfile}
            />
            <MyProfileView
              embedded
              currentUser={currentUser}
              safetyRecord={safetyRecord}
              onUpdateProfile={handleUpdateProfile}
              onUpdateSafetyRecord={handleUpdateSafetyRecord}
              onOpenSettings={() => setActiveTab('settings')}
              onOpenAccount={() => setActiveTab('account')}
            />
          </div>
        )}

        {/* My Journal — footprints map + memories timeline */}
        {activeTab === 'journal' && (
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

        {/* Settings lives inside the Passport panel — reached via its gear button */}
        {activeTab === 'settings' && (
          <SettingsView userGender={currentUser.gender} onBack={() => setActiveTab('map')} />
        )}

        {/* Account — sign-in, linked providers, server-side location pings */}
        {activeTab === 'account' && (
          <AccountView onBack={() => setActiveTab('map')} />
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

      {/* First-run onboarding wizard */}
      {showOnboarding && (
        <OnboardingView onComplete={handleOnboardingComplete} />
      )}

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
