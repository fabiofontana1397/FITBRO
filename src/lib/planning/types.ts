import type { Goal } from '@/lib/mock/types';

export type PlanPhaseKind = 'adattamento' | 'progressione' | 'consolidamento';

export type PlanMealItem = { name: string; grams: number; kcal: number };

export type PlanMeal = {
  slotId: string;
  label: string;
  time: string;
  items: PlanMealItem[];
  totalKcal: number;
};

export type DietMonthPlan = {
  monthIndex: number;
  phase: PlanPhaseKind;
  title: string;
  focusNote: string;
  calorieTarget: number;
  macroTargetsG: { protein: number; carbs: number; fats: number };
  sampleDay: PlanMeal[];
};

export type DietPlan = {
  generatedAt: string;
  durationMonths: number;
  goal: Goal;
  months: DietMonthPlan[];
};

export type TrainingExerciseEntry = { name: string; sets: number; reps: string; restSec: number };

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
