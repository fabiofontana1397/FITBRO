import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { generateDietPlan } from '@/lib/planning/diet-planner';
import { generateTrainingPlan } from '@/lib/planning/training-planner';
import type { DietPlan, TrainingPlan } from '@/lib/planning/types';
import { appJsonStorage } from '@/store/storage';

type PlanState = {
  dietPlan: DietPlan | null;
  trainingPlan: TrainingPlan | null;
  generatePlans: (
    answers: Record<string, unknown>,
    targets: { dailyCalorieTarget: number; macroTargetsG: { protein: number; carbs: number; fats: number } }
  ) => void;
};

/**
 * Holds the generated multi-month diet/training plans. Kept separate from
 * the day-to-day logging stores (nutrition-store, training-store) — this is
 * a prospective plan to view/export, not a log of what actually happened.
 */
export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      dietPlan: null,
      trainingPlan: null,
      generatePlans: (answers, targets) => {
        const mode = answers.mode as string | undefined;
        set({
          dietPlan: mode === 'training' ? null : generateDietPlan({ answers, ...targets }),
          trainingPlan: mode === 'diet' ? null : generateTrainingPlan({ answers }),
        });
      },
    }),
    { name: 'fitbro/plans', storage: appJsonStorage }
  )
);

/**
 * True if every workout exercise in the plan has the fields the current
 * code expects (`id`, `suggestedKg`). Plans generated before those fields
 * existed persist forever otherwise — zustand's persist `version`/`migrate`
 * can't catch this retroactively, since it only fires when the *stored*
 * blob already carries a numeric version to compare against (every plan
 * saved before versioning existed has none at all). Callers should treat
 * an invalid plan the same as a missing one and regenerate it.
 */
export function isValidTrainingPlan(plan: TrainingPlan | null): boolean {
  if (!plan) return false;
  return plan.months.every((month) =>
    month.weeklySplit.every(
      (day) =>
        day.type !== 'workout' ||
        (day.exercises ?? []).every(
          (ex) => typeof ex.id === 'string' && ex.id.length > 0 && typeof ex.tempo === 'string' && ex.tempo.length > 0
        )
    )
  );
}

/**
 * Same idea as isValidTrainingPlan, for the diet plan: months generated
 * before it moved from one repeated "sample day" to a real day-by-day
 * weeklySplit only have the old `sampleDay` field, and would throw
 * ("weeklySplit is undefined") the moment a screen renders them. Callers
 * should treat an invalid plan the same as a missing one and regenerate it.
 */
export function isValidDietPlan(plan: DietPlan | null): boolean {
  if (!plan) return false;
  return plan.months.every((month) => Array.isArray(month.weeklySplit) && month.weeklySplit.length > 0);
}
