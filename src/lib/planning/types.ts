import type { Goal } from '@/lib/mock/types';

export type PlanPhaseKind = 'adattamento' | 'progressione' | 'consolidamento';

export type PlanMealItemSubstitute = { name: string; grams: number };

export type PlanMealItem = {
  name: string;
  grams: number;
  kcal: number;
  /** Same nutritional role (protein/carb/fat/veg/fruit), swappable 1-for-1. */
  substitutes?: PlanMealItemSubstitute[];
};

export type PlanMeal = {
  slotId: string;
  label: string;
  time: string;
  items: PlanMealItem[];
  totalKcal: number;
};

export type DietDayPlan = {
  weekday: string;
  meals: PlanMeal[];
};

export type DietMonthPlan = {
  monthIndex: number;
  phase: PlanPhaseKind;
  title: string;
  focusNote: string;
  calorieTarget: number;
  macroTargetsG: { protein: number; carbs: number; fats: number };
  weeklySplit: DietDayPlan[];
};

export type DietPlan = {
  generatedAt: string;
  durationMonths: number;
  goal: Goal;
  months: DietMonthPlan[];
};

export type TrainingExerciseEntry = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSec: number;
  /** Conservative starting point in kg, or null for bodyweight/band exercises with no load to suggest. */
  suggestedKg: number | null;
  /** Execution cadence in seconds as "eccentric-isometric-concentric", e.g. "3-0-1". */
  tempo: string;
};

export type TrainingDayPlan = {
  weekday: string;
  type: 'workout' | 'cardio' | 'rest';
  title: string;
  exercises?: TrainingExerciseEntry[];
  note?: string;
};

export type TrainingMonthPlan = {
  monthIndex: number;
  phase: PlanPhaseKind;
  title: string;
  focusNote: string;
  weeklySplit: TrainingDayPlan[];
};

export type TrainingPlan = {
  generatedAt: string;
  durationMonths: number;
  months: TrainingMonthPlan[];
};
