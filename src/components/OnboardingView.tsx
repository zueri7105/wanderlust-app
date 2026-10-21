import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Cake, Globe2, Heart, MapPin, MessageCircle, Plus, Sparkles, Stamp, X } from 'lucide-react';
import { getTranslation, tv } from '../utils/i18n';

export interface OnboardingAnswers {
  name: string;
  destination: string;
  dayCount: number;
  nationality: string;
  homeCity: string;
  gender: string;
  birthday: string;
  languages: string[];
  hobbies: string[];
  motto: string;
}

interface OnboardingViewProps {
  onComplete: (answers: OnboardingAnswers) => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 7;

const LANG_CHIPS = [
  'English', '中文', 'Español', 'Français', 'Deutsch', '日本語',
  '한국어', 'Português', 'العربية', 'हिन्दी', 'Русский', 'Italiano'
];

const HOBBY_CHIPS = [
  'Photography', 'Hiking', 'Food hunting', 'Art & museums', 'Night markets', 'Beaches',
  'History', 'Café hopping', 'Shopping', 'Nature walks', 'Live music', 'Architecture'
];

const DAY_OPTIONS = [2, 3, 5, 7, 10, 14];

const GENDER_OPTIONS = [
  { value: 'female', key: 'genderFemale' },
  { value: 'male', key: 'genderMale' },
  { value: 'non-binary', key: 'genderNonBinary' },
  { value: 'prefer-not-to-say', key: 'genderPnts' }
];

const inputCls =
  'w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-400';

/**
 * First-run onboarding: welcome → dream destination → about you → birthday →
 * languages → hobbies → motto. The answers feed the travel passport, the first
 * auto-planned itinerary and the journal (wired up in App).
 */
export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete, onSkip }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [dayCount, setDayCount] = useState(3);
  const [nationality, setNationality] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [langDraft, setLangDraft] = useState('');
  const [hobbyDraft, setHobbyDraft] = useState('');
  const [motto, setMotto] = useState('');

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const addCustom = (
    draft: string,
    setDraft: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    const v = draft.trim();
    if (!v) return;
    if (!list.includes(v)) setList([...list, v]);
    setDraft('');
  };

  const isLast = step === TOTAL_STEPS - 1;
  const canNext =
    step === 1 ? destination.trim().length > 1 : step === 2 ? nationality.trim().length > 1 : true;

  const advance = () => {
    if (!canNext) return;
    if (isLast) {
      onComplete({
        name: name.trim(),
        destination: destination.trim(),
        dayCount,
        nationality: nationality.trim(),
        homeCity: homeCity.trim(),
        gender,
        birthday,
        languages,
        hobbies,
        motto: motto.trim()
      });
    } else {
      setStep((s) => s + 1);
    }
  };

  const chipCls = (active: boolean) =>
    `px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer ${
      active
        ? 'bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 border-stone-950 dark:border-violet-400 shadow-md'
        : 'bg-white dark:bg-slate-900 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-600'
    }`;

  const stepIcon = [Sparkles, MapPin, Globe2, Cake, MessageCircle, Heart, Stamp][step];

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-gradient-to-b from-stone-950 via-[#171224] to-violet-950">
      {/* ambient orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-rose-500/10 blur-3xl" />

      <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="wl-modal-card w-full max-w-lg p-6 sm:p-8 relative">
          <button
            type="button"
            onClick={onSkip}
            className="absolute top-4 right-4 inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400 hover:text-violet-500 transition-colors cursor-pointer"
          >
            {getTranslation('obSkipAll')}
            <X className="w-3.5 h-3.5" />
          </button>

          {/* progress */}
          <div className="flex items-center gap-1.5 mb-6 pr-24">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= step ? 'bg-violet-500 dark:bg-violet-400' : 'bg-stone-200 dark:bg-stone-700'
                } ${i === step ? 'w-6' : 'w-3'}`}
              />
            ))}
            <span className="ml-auto text-[10px] font-mono font-semibold text-stone-400">
              {tv('obStepOf', { a: step + 1, b: TOTAL_STEPS })}
            </span>
          </div>

          <div key={step}>
            <div className="w-12 h-12 rounded-2xl bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 flex items-center justify-center shadow-lg mb-4">
              {React.createElement(stepIcon, { className: 'w-5 h-5' })}
            </div>

            {/* Step 0 — Welcome + name */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                    {getTranslation('obWelcomeTitle')}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                    {getTranslation('obWelcomeSub')}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 mb-1.5">
                    {getTranslation('obNameLabel')}
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && advance()}
                    placeholder={getTranslation('obNamePh')}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Step 1 — Dream destination + day count */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                    {getTranslation('obDestTitle')}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                    {getTranslation('obDestSub')}
                  </p>
                </div>
                <input
                  autoFocus
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && advance()}
                  placeholder={getTranslation('obDestPh')}
                  className={inputCls}
                />
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 mb-1.5">
                    {getTranslation('obDaysQ')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setDayCount(n)}
                        className={chipCls(dayCount === n)}
                      >
                        {n} {getTranslation('days')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Nationality + home city (optional) */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                  {getTranslation('obNatTitle')}
                </h2>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 mb-1.5">
                    {getTranslation('obNatQ')}
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && advance()}
                    placeholder="Germany"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 mb-1.5">
                    {getTranslation('obCityQ')}
                    <span className="ml-1.5 font-medium text-stone-400">
                      · {getTranslation('obCityPh')}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={homeCity}
                    onChange={(e) => setHomeCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && advance()}
                    placeholder="Berlin"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 mb-1.5">
                    {getTranslation('obGenderQ')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map(({ value, key }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGender(gender === value ? '' : value)}
                        className={chipCls(gender === value)}
                      >
                        {getTranslation(key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Birthday */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                    {getTranslation('obBdayTitle')}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                    {getTranslation('obBdaySub')}
                  </p>
                </div>
                <input
                  autoFocus
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className={inputCls}
                />
              </div>
            )}

            {/* Step 4 — Languages */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                    {getTranslation('obLangTitle')}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                    {getTranslation('obLangSub')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LANG_CHIPS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggle(languages, setLanguages, l)}
                      className={chipCls(languages.includes(l))}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={langDraft}
                    onChange={(e) => setLangDraft(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && addCustom(langDraft, setLangDraft, languages, setLanguages)
                    }
                    placeholder={getTranslation('obCustomPh')}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => addCustom(langDraft, setLangDraft, languages, setLanguages)}
                    className="w-12 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center hover:border-violet-300 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5 — Hobbies */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                    {getTranslation('obHobbyTitle')}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                    {getTranslation('obHobbySub')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {HOBBY_CHIPS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => toggle(hobbies, setHobbies, h)}
                      className={chipCls(hobbies.includes(h))}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={hobbyDraft}
                    onChange={(e) => setHobbyDraft(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && addCustom(hobbyDraft, setHobbyDraft, hobbies, setHobbies)
                    }
                    placeholder={getTranslation('obCustomPh')}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => addCustom(hobbyDraft, setHobbyDraft, hobbies, setHobbies)}
                    className="w-12 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center hover:border-violet-300 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 6 — Motto */}
            {step === 6 && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                    {getTranslation('obMottoTitle')}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                    {getTranslation('obMottoSub')}
                  </p>
                </div>
                <textarea
                  autoFocus
                  rows={3}
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder={getTranslation('obMottoPh')}
                  className={`${inputCls} resize-none`}
                />
              </div>
            )}
          </div>

          {/* footer nav */}
          <div className="flex items-center justify-between gap-3 mt-7">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-stone-500 dark:text-stone-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{getTranslation('obBack')}</span>
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={advance}
              disabled={!canNext}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold bg-stone-950 dark:bg-violet-400 text-violet-300 dark:text-stone-950 rounded-2xl hover:scale-[1.03] transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:hover:scale-100"
            >
              <span>
                {isLast
                  ? getTranslation('obFinish')
                  : step === 0
                  ? getTranslation('obStart')
                  : getTranslation('nextPage')}
              </span>
              {!isLast && <ArrowRight className="w-4 h-4" />}
              {isLast && <Stamp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingView;
