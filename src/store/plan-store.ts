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
