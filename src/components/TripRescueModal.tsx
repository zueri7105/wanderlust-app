import React, { useMemo, useState } from 'react';
import { X, Sparkles, Star, Check, MapPin, Navigation, Lightbulb } from 'lucide-react';
import { ItineraryDay } from '../types/travel';
import {
  RescueLegMode,
  RescueMode,
  fmtTime,
  planRescue,
  rescueStopsOf,
  slotForStart
} from '../utils/tripRescue';

interface Props {
  day: ItineraryDay;
  dayDateLabel: string;
  geoContext: string;
  importance: Record<string, 1 | 2>;
  onToggleImportance: (label: string) => void;
  onApply: (slots: string[][]) => void;
  onClose: () => void;
}

const TIME_OPTIONS: number[] = [];
for (let m = 6 * 60; m <= 23 * 60 + 30; m += 30) TIME_OPTIONS.push(m);

const fmtDur = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const CAT_DOT: Record<string, string> = {
  sights: 'bg-emerald-400',
  food: 'bg-amber-400',
  lodging: 'bg-violet-400',
  transport: 'bg-sky-400',
  other: 'bg-stone-400'
};

const nowRounded = (): number => {
  const d = new Date();
  const m = d.getHours() * 60 + d.getMinutes();
  return Math.min(TIME_OPTIONS[TIME_OPTIONS.length - 1], Math.ceil(m / 30) * 30);
};

const fieldCls =
  'w-full min-w-0 px-2.5 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white text-stone-900 font-mono tabular-nums text-xs focus:outline-none focus:ring-2 focus:ring-violet-500';

const TripRescueModal: React.FC<Props> = ({
  day,
  dayDateLabel,
  geoContext,
  importance,
  onToggleImportance,
  onApply,
  onClose
}) => {
  const [mode, setMode] = useState<RescueMode>('rescue');
  const [startMin, setStartMin] = useState<number>(nowRounded);
  const [endMin, setEndMin] = useState<number>(21 * 60);
  const [legMode, setLegMode] = useState<RescueLegMode>('transit');

  const stops = useMemo(() => {
    const base = rescueStopsOf(day, geoContext);
    return base.map((s) => ({ ...s, importance: importance[s.label] === 2 ? (2 as const) : (1 as const) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, geoContext, importance]);

  const plan = useMemo(
    () =>
      planRescue(stops, {
        mode,
        startMin,
        endMin: Math.max(endMin, startMin + 60),
        legMode
      }),
    [stops, mode, startMin, endMin, legMode]
  );

  const appliedSlots = (): string[][] => {
    const slots: string[][] = [[], [], []];
    plan.planned.forEach((p) => {
      const slot = slotForStart(p.startMin);
      slots[slot === 'morningActivity' ? 0 : slot === 'afternoonActivity' ? 1 : 2].push(p.label);
    });
    return slots;
  };

  const timeSel = (value: number, onChange: (v: number) => void, aria: string) => (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={fieldCls} aria-label={aria}>
      {TIME_OPTIONS.map((m) => (
        <option key={m} value={m}>
          {fmtTime(m)}
        </option>
      ))}
    </select>
  );

  const doneBy = plan.planned.length ? plan.planned[plan.planned.length - 1].startMin + plan.planned[plan.planned.length - 1].durationMin : startMin;

  return (
    <div className="wl-modal-overlay" onClick={onClose}>
      <div
        className="wl-modal-card w-full max-w-lg p-5 sm:p-6 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Trip Rescue"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="wl-modal-eyebrow flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> WanderLust AI
            </div>
            <h3 className="wl-modal-title mt-1.5 text-lg">Trip Rescue</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {day.title || `Day ${day.dayNumber}`} · {dayDateLabel} — behind schedule? The planner picks the best of
              what's left, orders it for least travel, and lays out an honest timeline. Runs on your device.
            </p>
          </div>
          <button type="button" onClick={onClose} className="wl-modal-close shrink-0" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode switch */}
        <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/60">
          {(
            [
              { id: 'rescue' as RescueMode, label: 'Rescue my day', hint: 'Pick what still fits' },
              { id: 'route' as RescueMode, label: 'Optimize route', hint: 'Keep all, less travel' }
            ]
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                mode === m.id
                  ? 'bg-white dark:bg-stone-900 shadow-sm text-stone-950 dark:text-stone-50'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <span className="block text-xs font-bold">{m.label}</span>
              <span className="block text-[10px] opacity-70">{m.hint}</span>
            </button>
          ))}
        </div>

        {/* Situation controls — stacked on phone so the boxes never collide */}
        {mode === 'rescue' && (
          <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">It's now</span>
              {timeSel(startMin, setStartMin, 'Current time')}
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Day ends</span>
              {timeSel(endMin, setEndMin, 'Day end')}
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Getting around</span>
              <select
                value={legMode}
                onChange={(e) => setLegMode(e.target.value as RescueLegMode)}
                className={fieldCls}
                aria-label="Travel mode"
              >
                <option value="walk">Walking</option>
                <option value="transit">Transit</option>
                <option value="drive">Driving</option>
                <option value="taxi">Taxi</option>
              </select>
            </label>
          </div>
        )}
        {mode === 'route' && (
          <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
            <label className="block min-[480px]:col-span-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Getting around</span>
              <select
                value={legMode}
                onChange={(e) => setLegMode(e.target.value as RescueLegMode)}
                className={fieldCls}
                aria-label="Travel mode"
              >
                <option value="walk">Walking</option>
                <option value="transit">Transit</option>
                <option value="drive">Driving</option>
                <option value="taxi">Taxi</option>
              </select>
            </label>
          </div>
        )}

        {/* Stops with must-see stars */}
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
            Star your must-sees — rescue mode never drops them
          </p>
          <div className="space-y-1.5">
            {stops.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900/60"
              >
                <button
                  type="button"
                  onClick={() => onToggleImportance(s.label)}
                  className="shrink-0 cursor-pointer"
                  title={importance[s.label] === 2 ? 'Must-see — tap to unstar' : 'Mark as must-see'}
                  aria-label={`Must-see ${s.label}`}
                >
                  <Star
                    className={`w-4 h-4 transition-colors ${
                      importance[s.label] === 2 ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-600'
                    }`}
                  />
                </button>
                <span className={`w-2 h-2 rounded-full shrink-0 ${CAT_DOT[s.category] || 'bg-stone-400'}`} aria-hidden />
                <span className="flex-1 min-w-0 text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                  {s.label}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-stone-400 shrink-0">~{s.durationMin}m</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan result */}
        <div className="mt-5 rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50/60 dark:bg-violet-950/30 p-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            {mode === 'rescue' ? (
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {plan.feasible ? (
                  <>
                    Covers {plan.planned.length} of {stops.length} stops · done by {fmtTime(doneBy)} ·{' '}
                    {fmtDur(plan.travelMin)} travel
                    {plan.dropped.length > 0 ? ` · ${plan.dropped.length} cut` : ''}
                  </>
                ) : (
                  <>Even your must-sees don't fit — drop a star or extend the day.</>
                )}
              </p>
            ) : (
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Travel {fmtDur(plan.originalTravelMin)} → {fmtDur(plan.travelMin)} · all {stops.length} stops kept
                {plan.originalTravelMin - plan.travelMin > 0 &&
                  ` · saves ${fmtDur(plan.originalTravelMin - plan.travelMin)}`}
              </p>
            )}
          </div>

          {plan.planned.length > 0 && (
            <ol className="mt-3 space-y-2">
              {plan.planned.map((p, i) => (
                <li key={p.label} className="flex items-start gap-2.5">
                  <span className="w-14 shrink-0 text-[10px] font-mono tabular-nums font-bold text-violet-600 dark:text-violet-300 pt-0.5">
                    {fmtTime(p.startMin)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                        {p.label}
                        {importance[p.label] === 2 && <Star className="inline w-3 h-3 ml-1 fill-amber-400 text-amber-400" />}
                      </span>
                    </span>
                    <span className="block text-[10px] text-stone-400 pl-4.5">
                      {fmtDur(p.durationMin)} visit
                      {i > 0 && p.legKm != null && ` · ${p.legKm.toFixed(1)} km before this`}
                    </span>
                  </span>
                  {i > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono tabular-nums text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-full px-2 py-0.5">
                      <Navigation className="w-2.5 h-2.5" />
                      {fmtDur(p.legInMin)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}

          {plan.dropped.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed border-violet-200 dark:border-violet-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">Won't fit today</p>
              <div className="flex flex-wrap gap-1.5">
                {plan.dropped.map((d) => (
                  <span
                    key={d.label}
                    className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 line-through decoration-stone-300"
                  >
                    {d.label}
                  </span>
                ))}
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
                <Lightbulb className="w-3 h-3 shrink-0 mt-px" />
                Move these to another day by dragging them in your trip plan, or star the ones you can't miss and let
                the planner re-cut.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onApply(appliedSlots())}
            disabled={plan.planned.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-900/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Apply plan to Day {day.dayNumber}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Keep original
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripRescueModal;
