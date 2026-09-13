import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { daysAgoISO } from '@/lib/mock/dates';
import { appJsonStorage } from '@/store/storage';

export type LoggedSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  date: string;
  reps: number;
  weightKg: number;
};

type TrainingProgressState = {
  sets: LoggedSet[];
  logSet: (exerciseId: string, exerciseName: string, reps: number, weightKg: number, date?: string) => void;
  removeSet: (id: string) => void;
};

/**
 * Actual logged sets against the *generated* training plan's exercises
 * (see lib/planning/training-planner.ts) — kept separate from
 * training-store.ts, which still backs the older static Push/Pull/Legs
 * templates used by the dashboard's "Piano di oggi". This is what proves
 * real progressive overload over the life of the generated plan.
 */
export const useTrainingProgressStore = create<TrainingProgressState>()(
  persist(
    (set) => ({
      sets: [],
      logSet: (exerciseId, exerciseName, reps, weightKg, date = daysAgoISO(0)) =>
        set((state) => ({
          sets: [
            ...state.sets,
            { id: `${exerciseId}-${Date.now()}`, exerciseId, exerciseName, date, reps, weightKg },
          ],
        })),
      removeSet: (id) => set((state) => ({ sets: state.sets.filter((s) => s.id !== id) })),
    }),
    { name: 'fitbro/training-progress', storage: appJsonStorage }
  )
);

export function setsForExerciseOnDate(sets: LoggedSet[], exerciseId: string, date: string): LoggedSet[] {
  return sets.filter((s) => s.exerciseId === exerciseId && s.date === date);
}

/** Top (max weight) logged set per date for one exercise, chronological — feeds the mini progression chart. */
export function historyForExercise(sets: LoggedSet[], exerciseId: string): { date: string; weightKg: number }[] {
  const byDate = new Map<string, number>();
  for (const s of sets) {
    if (s.exerciseId !== exerciseId) continue;
    byDate.set(s.date, Math.max(byDate.get(s.date) ?? 0, s.weightKg));
  }
  return [...byDate.entries()]
    .map(([date, weightKg]) => ({ date, weightKg }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Most recently logged weight for an exercise, across all dates — used to prefill the next set. */
export function latestWeightForExercise(sets: LoggedSet[], exerciseId: string): number | null {
  const history = historyForExercise(sets, exerciseId);
  return history.length > 0 ? history[history.length - 1].weightKg : null;
}
