import React, { useState, useRef } from 'react';
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
  X
} from 'lucide-react';

interface MyProfileViewProps {
  currentUser: SoloTraveler;
  safetyRecord: SafeCheckinRecord;
  onUpdateProfile: (updated: Partial<SoloTraveler>) => void;
  onUpdateSafetyRecord: (updated: Partial<SafeCheckinRecord>) => void;
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
  onUpdateSafetyRecord
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
            relationship: 'Brother / Next of Kin',
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

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(
      `https://wanderlust.app/profile/token_${currentUser.id}_live`
    );
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
      interests: interestsStr.split(',').map((s) => s.trim()).filter(Boolean)
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            My Solo Traveler Profile
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal travel identity, verified avatar, emergency contacts, and preferences.
          </p>
        </div>

        <button
          onClick={() => setIsEditingProfile(!isEditingProfile)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditingProfile ? 'Cancel Editing' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
            <h3 className="font-display font-bold text-base text-slate-950 dark:text-slate-50 pb-2 border-b border-slate-100 dark:border-slate-800">
              Edit Personal Traveler Details
            </h3>

            {/* Profile Picture Upload Section as requested */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={avatar || currentUser.avatar}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-300 dark:border-slate-600 shadow-xs"
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
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Profile Picture
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Your Own Photo</span>
                  </button>

                  <span className="text-[11px] text-slate-400">JPG, PNG, WebP supported</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
                <input
                  type="number"
                  required
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Home City</label>
                <input
                  type="text"
                  required
                  value={homeCity}
                  onChange={(e) => setHomeCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nationality / Country
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Travel Pace</label>
                <select
                  value={travelPace}
                  onChange={(e) => setTravelPace(e.target.value as TravelPace)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {PACE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Budget Tier</label>
                <select
                  value={budgetTier}
                  onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {BUDGET_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Solo Travel Bio</label>
              <textarea
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Languages (comma separated)
                </label>
                <input
                  type="text"
                  value={languagesStr}
                  onChange={(e) => setLanguagesStr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Interests (comma separated)
                </label>
                <input
                  type="text"
                  value={interestsStr}
                  onChange={(e) => setInterestsStr(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-950 rounded-md hover:bg-slate-800"
              >
                Save Profile
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                  <button
                    onClick={() => {
                      setIsEditingProfile(true);
                      setTimeout(() => fileInputRef.current?.click(), 100);
                    }}
                    className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Change profile picture"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-xl text-slate-950 dark:text-slate-50">
                      {currentUser.name}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {currentUser.age} yrs
                    </span>
                    {currentUser.gender === 'female' && (
                      <span className="text-[10px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded font-semibold">
                        Female Solo Traveler
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Solo Explorer</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>From {currentUser.homeCity}, {currentUser.country}</span>
                    </span>
                    <span>·</span>
                    <span>Pace: {currentUser.travelPace}</span>
                    <span>·</span>
                    <span className="font-mono">Tier: {currentUser.budgetTier}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Link Copied!' : 'Share Live Safety Link'}</span>
                </button>
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                About Elena
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {currentUser.bio}
              </p>
            </div>

            {/* Languages & Interests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Languages
                </div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">
                  {currentUser.languages.join(' · ')}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Interests
                </div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">
                  {currentUser.interests.join(' · ')}
                </div>
              </div>
            </div>

            {/* Travel Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-400">Completed Solo Journeys</div>
                <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  {currentUser.soloTripsCount} trips
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-400">Community Vouches</div>
                <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  {currentUser.vouchedByCount} vouches
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <div className="text-slate-500 dark:text-slate-400">Companion Rating</div>
                <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  ★ {currentUser.safetyRating} / 5.0
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Safety & Emergency Contacts Section (Refinery work on emergency contacts as requested) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-display font-bold text-base text-slate-950 dark:text-slate-50">
              Emergency Contacts & Next of Kin (NOC)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Notified automatically if an emergency SOS is triggered or if a check-in is overdue.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEditingContacts ? (
              <button
                type="button"
                onClick={() => setIsEditingContacts(true)}
                className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Contacts</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddMoreEmergencyContact}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer shadow-xs"
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
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      Emergency Contact #{idx + 1}
                    </span>
                    {contactsDraft.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmergencyContact(idx)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    {/* Name of Emergency Contact */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Name of Emergency Contact
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Markus Rostova"
                        value={contact.name}
                        onChange={(e) => handleUpdateContactDraft(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    {/* Relationship to the NOC */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Relationship to the NOC / Traveler
                      </label>
                      <input
                        type="text"
                        list={`rel_list_${idx}`}
                        required
                        placeholder="e.g. Brother, Mother, Spouse"
                        value={contact.relationship}
                        onChange={(e) => handleUpdateContactDraft(idx, 'relationship', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <datalist id={`rel_list_${idx}`}>
                        {RELATIONSHIP_OPTIONS.map((r) => (
                          <option key={r} value={r} />
                        ))}
                      </datalist>
                    </div>

                    {/* Country Code */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Country Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+49 or +1"
                        value={contact.countryCode}
                        onChange={(e) => handleUpdateContactDraft(idx, 'countryCode', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                      />
                    </div>

                    {/* Number */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="170 555 4912"
                        value={contact.phone}
                        onChange={(e) => handleUpdateContactDraft(idx, 'phone', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleAddMoreEmergencyContact}
                className="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add More Emergency Contact</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingContacts(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-950 rounded-md hover:bg-slate-800 flex items-center gap-1 shadow-xs"
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
                  className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {contact.name || 'Emergency Contact'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                        {contact.relationship}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 font-mono font-medium text-xs mt-0.5">
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
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Emergency Contact</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Check-in Broadcaster */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              Active Trip Safety Ping:
            </div>
            <div className="text-slate-600 dark:text-slate-300 mt-0.5">
              Current Destination: <strong>{safetyRecord.activeDestination}</strong>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              Last Ping: {safetyRecord.lastCheckinTime}
            </div>
          </div>

          <button
            onClick={handleSendPing}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-950 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            {justPinged ? 'Check-in Recorded ✓' : 'Send "I am Safe" Check-in'}
          </button>
        </div>
      </div>
    </div>
  );
};
