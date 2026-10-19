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
  Link2
} from 'lucide-react';
import { PresenceBadge } from './MessagesView';
import { presenceForTraveler } from '../utils/settings';

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
      instagram: instagram.replace(/^@/, '').trim(),
      website: website.trim()
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            {getTranslation('profileTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {getTranslation('profileSub')}
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
              Edit Personal Traveller Details
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-lg text-xs font-semibold cursor-pointer hover:brightness-105 transition-colors shadow-2xs"
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

            {/* Social links — Instagram & personal site */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-fuchsia-50 via-pink-50 to-orange-50 dark:from-fuchsia-950/30 dark:via-pink-950/20 dark:to-orange-950/20 border border-pink-200/70 dark:border-pink-900/40 space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-pink-700 dark:text-pink-300 uppercase tracking-wider">
                <Instagram className="w-3.5 h-3.5" />
                <span>Show off your adventures</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Instagram Handle <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">@</span>
                    <input
                      type="text"
                      placeholder="wander.anya"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Appears as a tappable Instagram chip on your profile banner.
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Blog / Website <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. anyatravels.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Your travel blog, portfolio or YouTube — anywhere companions can see more of you.
                  </p>
                </div>
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
                className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-md hover:brightness-105"
              >
                Save Profile
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Vibrant traveler hero banner */}
            <div className="relative -m-6 mb-0 rounded-t-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-orange-400 to-amber-400" />
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1.5px, transparent 1.5px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px), radial-gradient(circle at 45% 80%, white 1.2px, transparent 1.2px)', backgroundSize: '90px 90px, 60px 60px, 120px 120px' }} />
              <div className="relative px-6 pt-6 pb-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-20 h-20 rounded-2xl object-cover border-[3px] border-white/80 shadow-lg"
                    />
                    <PresenceBadge status={presenceForTraveler(currentUser.id, currentUser.id)} />
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

                  <div className="text-white">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-2xl drop-shadow-sm">
                        {currentUser.name}
                      </h3>
                      <span className="text-xs text-white/85 font-mono">
                        {currentUser.age} yrs
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/90 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>From {currentUser.homeCity}, {currentUser.country}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {currentUser.gender === 'female' && (
                        <span className="text-[10px] bg-white/20 backdrop-blur-xs border border-white/30 text-white px-2 py-0.5 rounded-full font-semibold">
                          Female Solo Traveller
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/20 backdrop-blur-xs border border-white/30 text-white px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Solo Explorer</span>
                      </span>
                      {instagramHandle && (
                        <a
                          href={`https://instagram.com/${instagramHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 shadow-sm hover:brightness-110 transition-all"
                          title="Open Instagram profile"
                        >
                          <Instagram className="w-3 h-3" />
                          <span>@{instagramHandle}</span>
                        </a>
                      )}
                      {websiteUrl && (
                        <a
                          href={websiteHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/20 backdrop-blur-xs border border-white/30 text-white px-2 py-0.5 rounded-full hover:bg-white/30 transition-colors"
                          title="Open personal website"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>{websiteLabel}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyLink}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md ${
                    copiedLink
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Profile Link Copied!' : 'Share My Profile'}</span>
                </button>
              </div>
            </div>

            {/* Stat chips overlapping the banner */}
            <div className="grid grid-cols-3 gap-3 -mt-8 relative z-10 px-1">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md text-center">
                <Compass className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                <div className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                  {currentUser.soloTripsCount}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Solo Journeys</div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md text-center">
                <HeartHandshake className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                <div className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                  {currentUser.vouchedByCount}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Community Vouches</div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <div className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                  ★ {currentUser.safetyRating}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Companion Rating</div>
              </div>
            </div>

            {/* Bio */}
            <div className="pt-5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                About {currentUser.name.split(' ')[0]}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {currentUser.bio}
              </p>
            </div>

            {/* Travel style chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-semibold">
                <Compass className="w-3.5 h-3.5" />
                <span>Pace: {currentUser.travelPace}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 font-semibold font-mono">
                <span>Budget: {currentUser.budgetTier}</span>
              </span>
            </div>

            {/* Languages & Interests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/30 border border-sky-200/70 dark:border-sky-900/50">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Languages</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.languages.map((lang) => (
                    <span key={lang} className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 rounded-md text-slate-800 dark:text-slate-200 font-medium text-[11px]">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/30 border border-violet-200/70 dark:border-violet-900/50">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider mb-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Interests</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.interests.map((interest) => (
                    <span key={interest} className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800 rounded-md text-slate-800 dark:text-slate-200 font-medium text-[11px]">
                      {interest}
                    </span>
                  ))}
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg hover:brightness-105 cursor-pointer shadow-xs"
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

                    {/* Relationship to the NOC (optional, free text) */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Relationship to the NOC / Traveller <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        list={`rel_list_${idx}`}
                        placeholder="e.g. Brother, Mother, Best Friend — or leave blank"
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-md hover:brightness-105 flex items-center gap-1 shadow-xs"
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
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {contact.name || 'Emergency Contact'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 rounded">
                        {contact.relationship || 'Next of Kin'}
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
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:brightness-105 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            {justPinged ? 'Check-in Recorded ✓' : 'Send "I am Safe" Check-in'}
          </button>
        </div>
      </div>
    </div>
  );
};
