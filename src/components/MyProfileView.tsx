import React, { useState, useRef } from 'react';
import { getTranslation } from '../utils/i18n';
import { SoloTraveler, SafeCheckinRecord, TravelPace, BudgetTier, EmergencyContact } from '../types/travel';
import {
  User,
  ShieldCheck,
  Share2,
  Phone,
  Edit3,
  HeartHandshake,
  MapPin,
  Globe,
  Compass,
  Check,
  Camera,
  Upload,
  Plus,
  Trash2,
  X,
  Instagram,
  Link2,
  Settings
} from 'lucide-react';
import { PresenceBadge } from './MessagesView';
import { presenceForTraveler } from '../utils/settings';
import { COUNTRY_DIAL_CODES, resolveDialCode } from '../utils/countryDialCodes';

interface MyProfileViewProps {
  currentUser: SoloTraveler;
  safetyRecord: SafeCheckinRecord;
  onUpdateProfile: (updated: Partial<SoloTraveler>) => void;
  onUpdateSafetyRecord: (updated: Partial<SafeCheckinRecord>) => void;
  onOpenSettings?: () => void;
  /** Render inside the Passport page — section header instead of a page header */
  embedded?: boolean;
}

const PACE_OPTIONS: TravelPace[] = ['Chill & Scenic', 'Moderate Explorer', 'Brisk & Fast-Paced'];
const BUDGET_OPTIONS: BudgetTier[] = ['$', '$$', '$$$'];

const RELATIONSHIP_OPTIONS = [
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Spouse / Partner',
  'Daughter',
  'Son',
  'Close Friend',
  'Legal Guardian'
];

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  currentUser,
  safetyRecord,
  onUpdateProfile,
  onUpdateSafetyRecord,
  onOpenSettings,
  embedded = false
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [justPinged, setJustPinged] = useState(false);

  // Edit Profile Form State
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [age, setAge] = useState(currentUser.age);
  const [gender, setGender] = useState<'female' | 'male' | 'non-binary' | 'prefer-not-to-say'>(currentUser.gender || 'female');
  const [homeCity, setHomeCity] = useState(currentUser.homeCity);
  const [country, setCountry] = useState(currentUser.country);
  const [bio, setBio] = useState(currentUser.bio);
  const [travelPace, setTravelPace] = useState<TravelPace>(currentUser.travelPace);
  const [budgetTier, setBudgetTier] = useState<BudgetTier>(currentUser.budgetTier);
  const [languagesStr, setLanguagesStr] = useState(currentUser.languages.join(', '));
  const [interestsStr, setInterestsStr] = useState(currentUser.interests.join(', '));
  const [goalsStr, setGoalsStr] = useState((currentUser.travelGoals || []).join(', '));
  const [instagram, setInstagram] = useState(currentUser.instagram || '');
  const [website, setWebsite] = useState(currentUser.website || '');

  // Normalised helpers so the social chips always render clean links
  const instagramHandle = (currentUser.instagram || '').replace(/^@/, '').trim();
  const websiteUrl = (currentUser.website || '').trim();
  const websiteHref = websiteUrl
    ? (/^https?:\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`)
    : '';
  const websiteLabel = websiteUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  // File input ref for photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emergency contacts state
  const [isEditingContacts, setIsEditingContacts] = useState(false);
  const [contactsDraft, setContactsDraft] = useState<EmergencyContact[]>(() => {
    return safetyRecord.emergencyContacts && safetyRecord.emergencyContacts.length > 0
      ? safetyRecord.emergencyContacts
      : [
          {
            id: 'em_1',
            name: 'Markus Rostova',
            relationship: 'Brother',
            countryCode: '+49',
            phone: '170 555 4912'
          }
        ];
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatar(dataUrl);
        onUpdateProfile({ avatar: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  // Share My Profile — copies a friendly public profile link + intro text
  const handleCopyLink = () => {
    const profileUrl = `https://wanderlust.app/traveler/${currentUser.id}`;
    const shareText = `Meet ${currentUser.name} on WanderLust! ${currentUser.age}-yr-old solo traveler from ${currentUser.homeCity}, ${currentUser.country} · ${currentUser.soloTripsCount} solo journeys · ★ ${currentUser.safetyRating}/5.0 companion rating. View profile: ${profileUrl}`;
    navigator.clipboard?.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendPing = () => {
    const now = new Date();
    const timeStr = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Nominal Status: OK)`;
    onUpdateSafetyRecord({ lastCheckinTime: timeStr });
    setJustPinged(true);
    setTimeout(() => setJustPinged(false), 3000);
  };

  const handleAddMoreEmergencyContact = () => {
    const newContact: EmergencyContact = {
      id: `em_${Date.now()}`,
      name: '',
      relationship: 'Mother',
      countryCode: '+1',
      phone: ''
    };
    setContactsDraft([...contactsDraft, newContact]);
  };

  const handleRemoveEmergencyContact = (idx: number) => {
    if (contactsDraft.length <= 1) return;
    setContactsDraft(contactsDraft.filter((_, i) => i !== idx));
  };

  const handleUpdateContactDraft = (idx: number, field: keyof EmergencyContact, val: string) => {
    const updated = [...contactsDraft];
    updated[idx] = { ...updated[idx], [field]: val };
    setContactsDraft(updated);
  };

  const handleSaveContacts = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSafetyRecord({
      emergencyContacts: contactsDraft
    });
    setIsEditingContacts(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      avatar,
      age: Number(age),
      gender,
      homeCity,
      country,
      bio,
      travelPace,
      budgetTier,
      languages: languagesStr.split(',').map((s) => s.trim()).filter(Boolean),
      interests: interestsStr.split(',').map((s) => s.trim()).filter(Boolean),
      travelGoals: goalsStr.split(',').map((s) => s.trim()).filter(Boolean),
      instagram: instagram.replace(/^@/, '').trim(),
      website: website.trim()
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Compact action row — profile details live on the passport above; editing opens a galaxy modal */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-600 dark:text-violet-400">
          {getTranslation('profileSafety')}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingProfile(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title={getTranslation('settingsTitle')}
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Safety & Emergency Contacts Section (Refinery work on emergency contacts as requested) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="font-display font-bold text-base text-stone-950 dark:text-stone-50">
              Emergency Contact
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Notified automatically if an emergency SOS is triggered or if a check-in is overdue.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingContacts ? (
              <button
                type="button"
                onClick={() => setIsEditingContacts(true)}
                className="text-xs font-semibold text-stone-900 dark:text-stone-100 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Contacts</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddMoreEmergencyContact}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:brightness-105 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Emergency Contact</span>
              </button>
            )}
          </div>
        </div>

        {isEditingContacts ? (
          <form onSubmit={handleSaveContacts} className="space-y-4 text-xs">
            <div className="space-y-3">
              {contactsDraft.map((contact, idx) => (
                <div
                  key={contact.id || idx}
                  className="p-3.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      Emergency Contact #{idx + 1}
                    </span>
                    {contactsDraft.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmergencyContact(idx)}
                        className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    {/* Name of Emergency Contact */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Name of Emergency Contact
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Markus Rostova"
                        value={contact.name}
                        onChange={(e) => handleUpdateContactDraft(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    {/* Relationship to the traveller (optional, free text) */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Relationship to traveller <span className="font-normal text-stone-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        list={`rel_list_${idx}`}
                        placeholder="e.g. Brother, Mother — or leave blank"
                        value={contact.relationship}
                        onChange={(e) => handleUpdateContactDraft(idx, 'relationship', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      />
                      <datalist id={`rel_list_${idx}`}>
                        {RELATIONSHIP_OPTIONS.map((r) => (
                          <option key={r} value={r} />
                        ))}
                      </datalist>
                    </div>

                    {/* Country Code — type a country name (e.g. Germany) to auto-fill +49 */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Country Code
                      </label>
                      <input
                        type="text"
                        required
                        list={`dial_list_${idx}`}
                        placeholder="+49 or Germany"
                        value={contact.countryCode}
                        onChange={(e) => {
                          const raw = e.target.value;
                          handleUpdateContactDraft(idx, 'countryCode', resolveDialCode(raw) ?? raw);
                        }}
                        className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                      />
                      <datalist id={`dial_list_${idx}`}>
                        {COUNTRY_DIAL_CODES.map((c) => (
                          <option key={c.name} value={c.name}>{c.code}</option>
                        ))}
                      </datalist>
                    </div>

                    {/* Number */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="170 555 4912"
                        value={contact.phone}
                        onChange={(e) => handleUpdateContactDraft(idx, 'phone', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={handleAddMoreEmergencyContact}
                className="text-xs font-semibold text-stone-900 dark:text-stone-100 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add More Emergency Contact</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingContacts(false)}
                  className="px-3.5 py-1.5 text-xs text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-md hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-xl hover:brightness-105 flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Emergency Contacts</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(safetyRecord.emergencyContacts && safetyRecord.emergencyContacts.length > 0
                ? safetyRecord.emergencyContacts
                : contactsDraft
              ).map((contact, idx) => (
                <div
                  key={contact.id || idx}
                  className="flex items-center gap-3 p-3.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 rounded-2xl text-xs"
                >
                  <div className="w-9 h-9 rounded-2xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                        {contact.name || 'Emergency Contact'}
                      </span>
                      {contact.relationship && (
                        <span className="text-[10px] text-stone-500 dark:text-stone-400 bg-stone-200/70 dark:bg-stone-700 px-1.5 py-0.2 rounded">
                          {contact.relationship}
                        </span>
                      )}
                    </div>
                    <div className="text-stone-600 dark:text-stone-300 font-mono font-medium text-xs mt-0.5">
                      ({contact.countryCode}) {contact.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-start">
              <button
                type="button"
                onClick={() => {
                  setIsEditingContacts(true);
                  handleAddMoreEmergencyContact();
                }}
                className="text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Emergency Contact</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Check-in Broadcaster */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-semibold text-stone-900 dark:text-stone-100">
              Active Trip Safety Ping:
            </div>
            <div className="text-stone-600 dark:text-stone-300 mt-0.5">
              Current Destination: <strong>{safetyRecord.activeDestination}</strong>
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-mono tabular-nums">
              Last Ping: {safetyRecord.lastCheckinTime}
            </div>
          </div>

          <button
            onClick={handleSendPing}
            className="px-4 py-2 text-xs font-semibold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 hover:scale-105 rounded-2xl transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            {justPinged ? 'Check-in Recorded ✓' : 'Send "I am Safe" Check-in'}
          </button>
        </div>
      </div>

      {/* Edit Profile — galaxy modal */}
      {isEditingProfile && (
        <div className="wl-modal-overlay" onClick={() => setIsEditingProfile(false)}>
          <div
            className="wl-modal-card w-full max-w-2xl mx-4 max-h-[88vh] overflow-y-auto p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="wl-modal-close"
              onClick={() => setIsEditingProfile(false)}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="wl-modal-eyebrow">WanderLust Studio</div>
            <h3 className="wl-modal-title mb-5">Edit Profile</h3>
          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
              {/* Profile Picture Upload Section as requested */}
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={avatar || currentUser.avatar}
                    alt={name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-stone-300 dark:border-stone-600 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Upload picture"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
                    Profile Picture
                  </div>
                  <p className="text-stone-500 dark:text-stone-400 text-xs">
                    Upload your own photo as your profile picture to help companions recognize you when meeting abroad.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl text-xs font-semibold cursor-pointer hover:brightness-105 transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Your Own Photo</span>
                    </button>

                    <span className="text-[11px] text-stone-400">JPG, PNG, WebP supported</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Home City</label>
                  <input
                    type="text"
                    required
                    value={homeCity}
                    onChange={(e) => setHomeCity(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Nationality / Country
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Travel Pace</label>
                  <select
                    value={travelPace}
                    onChange={(e) => setTravelPace(e.target.value as TravelPace)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    {PACE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Budget Tier</label>
                  <select
                    value={budgetTier}
                    onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    {BUDGET_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">Solo Travel Bio</label>
                <textarea
                  rows={3}
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Languages (comma separated)
                  </label>
                  <input
                    type="text"
                    value={languagesStr}
                    onChange={(e) => setLanguagesStr(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Interests (comma separated)
                  </label>
                  <input
                    type="text"
                    value={interestsStr}
                    onChange={(e) => setInterestsStr(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Travel Goals (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Shared local dinners, Split cabs to temples"
                  value={goalsStr}
                  onChange={(e) => setGoalsStr(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Shown on your profile so companions can see what you'd like to share on the road.
                </p>
              </div>

              {/* Social links — Instagram & personal site */}
              <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200/70 dark:border-violet-900/40 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Show off your adventures</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Instagram Handle <span className="font-normal text-stone-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -transtone-y-1/2 text-stone-400 font-semibold">@</span>
                      <input
                        type="text"
                        placeholder="wander.anya"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Appears as a tappable Instagram chip on your profile banner.
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                      Blog / Website <span className="font-normal text-stone-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. anyatravels.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Your travel blog, portfolio or YouTube — anywhere companions can see more of you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-md hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-xl hover:brightness-105"
                >
                  Save Profile
                </button>
              </div>
          </form>
          </div>
        </div>
      )}
    </div>
  );
};
