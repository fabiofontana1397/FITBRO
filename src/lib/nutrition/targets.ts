import type { Goal, Sex } from '@/lib/mock/types';

const AGE_RANGE_MIDPOINT: Record<string, number> = {
  lt18: 17,
  '18-24': 21,
  '25-34': 29,
  '35-44': 39,
  '45-54': 49,
  '55+': 60,
};

const JOB_ACTIVITY_MULTIPLIER: Record<string, number> = {
  sedentary: 1.2,
  seatedMobile: 1.3,
  standing: 1.4,
  active: 1.6,
  veryHeavy: 1.8,
};

const FREQUENCY_DAYS: Record<string, number> = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6+': 6,
  variable: 3,
};

const GOAL_CALORIE_FACTOR: Record<Goal, number> = {
  loseFat: 0.8,
  gainMuscle: 1.12,
  recomposition: 1.0,
  maintainImprove: 1.0,
  gainStrength: 1.05,
  improveEndurance: 1.0,
  sportEvent: 1.0,
  generalHealth: 1.0,
};

const GOAL_PROTEIN_PER_KG: Record<Goal, number> = {
  loseFat: 2.2,
  gainMuscle: 2.0,
  recomposition: 2.0,
  maintainImprove: 1.8,
  gainStrength: 2.0,
  improveEndurance: 1.6,
  sportEvent: 1.8,
  generalHealth: 1.6,
};

export type NutritionTargetsInput = {
  sex: Sex;
  ageRange: string;
  heightCm: number;
  currentWeightKg: number;
  goal: Goal;
  jobActivity?: string;
  trainingFrequency?: string;
};

export type NutritionTargets = {
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  macroTargetsG: { protein: number; carbs: number; fats: number };
  hydrationTargetMl: number;
};

function bmrMifflinStJeor(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  return base - 78; // midpoint when unspecified
}

export function computeNutritionTargets(input: NutritionTargetsInput): NutritionTargets {
  const age = AGE_RANGE_MIDPOINT[input.ageRange] ?? 30;
  const bmr = bmrMifflinStJeor(input.sex, input.currentWeightKg, input.heightCm, age);

  const jobMultiplier = JOB_ACTIVITY_MULTIPLIER[input.jobActivity ?? 'sedentary'] ?? 1.2;
  const trainingDays = FREQUENCY_DAYS[input.trainingFrequency ?? '3'] ?? 3;
  const trainingBump = Math.min(trainingDays, 6) * 0.03;
  const tdee = bmr * (jobMultiplier + trainingBump);

  const dailyCalorieTarget = Math.round(tdee * GOAL_CALORIE_FACTOR[input.goal]);

  const proteinG = Math.round(GOAL_PROTEIN_PER_KG[input.goal] * input.currentWeightKg);
  const fatsG = Math.round((dailyCalorieTarget * 0.25) / 9);
  const carbsG = Math.max(Math.round((dailyCalorieTarget - proteinG * 4 - fatsG * 9) / 4), 0);

  const hydrationTargetMl = Math.round(input.currentWeightKg * 35 + (trainingDays >= 4 ? 350 : 0));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalorieTarget,
    macroTargetsG: { protein: proteinG, carbs: carbsG, fats: fatsG },
    hydrationTargetMl,
  };
}
