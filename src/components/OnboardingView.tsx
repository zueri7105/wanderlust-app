import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Cake, Globe2, Heart, MapPin, MessageCircle, Plus, Sparkles, Stamp, Users } from 'lucide-react';
import { getTranslation, tv } from '../utils/i18n';
import { COUNTRY_INFO } from '../utils/countryInfo';
import { PlaceTypeahead } from './PlaceTypeahead';

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
}

const TOTAL_STEPS = 8;

const LANG_CHIPS = [
  'English', '中文', 'Español', 'Français', 'Deutsch', '日本語',
  '한국어', 'Português', 'العربية', 'हिन्दी', 'Русский', 'Italiano'
];

const HOBBY_CHIPS = [
  'Photography', 'Hiking', 'Food hunting', 'Art & museums', 'Night markets', 'Beaches',
  'History', 'Café hopping', 'Shopping', 'Nature walks', 'Live music', 'Architecture'
];

const DAY_OPTIONS = [2, 3, 5, 7, 10, 14];

/** Every recognised country, alphabetically — feeds the nationality type-ahead. */
const ALL_COUNTRIES = Object.keys(COUNTRY_INFO).sort((a, b) => a.localeCompare(b));

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
 * gender → languages → hobbies → motto. The answers feed the travel passport,
 * the first auto-planned itinerary and the journal (wired up in App).
 */
export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [dayCount, setDayCount] = useState(2);
  const [nationality, setNationality] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [langDraft, setLangDraft] = useState('');
  const [hobbyDraft, setHobbyDraft] = useState('');
  const [motto, setMotto] = useState('');
  const [natOpen, setNatOpen] = useState(false);

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

  // Every question must be answered before the Next button does anything —
  // tapping it without an answer just shakes the missing field, no skip.
  const isLast = step === TOTAL_STEPS - 1;
  const canNext = (() => {
    switch (step) {
      case 0: return name.trim().length > 0;
      case 1: return destination.trim().length > 1;
      case 2: return nationality.trim().length > 1 && homeCity.trim().length > 1;
      case 3: return birthday.trim().length > 0;
      case 4: return gender.length > 0;
      case 5: return languages.length > 0;
      case 6: return hobbies.length > 0;
      case 7: return motto.trim().length > 0;
      default: return true;
    }
  })();

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

  const stepIcon = [Sparkles, MapPin, Globe2, Cake, Users, MessageCircle, Heart, Stamp][step];

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-gradient-to-b from-stone-950 via-[#171224] to-violet-950">
      {/* ambient orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-rose-500/10 blur-3xl" />

      <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="wl-modal-card w-full max-w-lg p-6 sm:p-8 relative">
          {/* No skip: a passport needs its nationality — the wizard must be
              completed so visa rules are never guessed. */}

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
                <PlaceTypeahead
                  autoFocus
                  value={destination}
                  onChange={setDestination}
                  onEnter={advance}
                  placeholder={getTranslation('obDestPh')}
                  className={inputCls}
                />
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 mb-1.5">
                    {getTranslation('obDaysQ')}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* type any number first — deleting it empties the box, it
                        never snaps back; preset boxes follow after it */}
                    <span className="inline-flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={dayCount === 0 ? '' : dayCount}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') {
                            setDayCount(0); // cleared — stays empty until a number is typed
                            return;
                          }
                          setDayCount(Math.max(1, Math.min(60, Number(v) || 1)));
                        }}
                        placeholder={getTranslation('obDaysCustom')}
                        className="w-24 px-3.5 py-2 rounded-2xl text-xs font-semibold border-2 border-violet-300 dark:border-violet-600 bg-white dark:bg-slate-900 text-stone-700 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                        {getTranslation('days')}
                      </span>
                    </span>
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
                <div className="relative">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 mb-1.5">
                    {getTranslation('obNatQ')}
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={nationality}
                    onChange={(e) => {
                      setNationality(e.target.value);
                      setNatOpen(true);
                    }}
                    onFocus={() => setNatOpen(true)}
                    onBlur={() => window.setTimeout(() => setNatOpen(false), 150)}
                    onKeyDown={(e) => e.key === 'Enter' && advance()}
                    placeholder={getTranslation('obNatPh')}
                    className={inputCls}
                  />
                  {/* type-ahead: "a" lists every country starting with A,
                      "al" narrows to Albania, Algeria… — alphabetical */}
                  {natOpen && nationality.trim() && (() => {
                    const q = nationality.trim().toLowerCase();
                    const hits = ALL_COUNTRIES.filter((c) => c.toLowerCase().startsWith(q));
                    const shown = (hits.length > 0 ? hits : ALL_COUNTRIES.filter((c) => c.toLowerCase().includes(q))).slice(0, 8);
                    if (shown.length === 0 || (shown.length === 1 && shown[0].toLowerCase() === q)) return null;
                    return (
                      <div className="absolute z-10 left-0 right-0 mt-1.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                        {shown.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault(); // keep focus; blur timer closes the list
                              setNationality(c);
                              setNatOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-stone-700 dark:text-stone-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-200 mb-1.5">
                    {getTranslation('obCityQ')}
                  </label>
                  <PlaceTypeahead
                    value={homeCity}
                    onChange={setHomeCity}
                    onEnter={advance}
                    placeholder="Berlin"
                    className={inputCls}
                  />
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

            {/* Step 4 — Gender (its own page, right after birthday) */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                    {getTranslation('obGenderQ')}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map(({ value, key }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGender(value)}
                      className={chipCls(gender === value)}
                    >
                      {getTranslation(key)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5 — Languages */}
            {step === 5 && (
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
                  {/* your own answers join the boxes at the very end */}
                  {languages
                    .filter((l) => !LANG_CHIPS.includes(l))
                    .map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggle(languages, setLanguages, l)}
                        className={chipCls(true)}
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

            {/* Step 6 — Hobbies */}
            {step === 6 && (
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
                  {/* your own answers join the boxes at the very end */}
                  {hobbies
                    .filter((h) => !HOBBY_CHIPS.includes(h))
                    .map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => toggle(hobbies, setHobbies, h)}
                        className={chipCls(true)}
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

            {/* Step 7 — Motto */}
            {step === 7 && (
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
