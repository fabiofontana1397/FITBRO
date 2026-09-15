export type Sport = 'gym' | 'functional' | 'running' | 'swimming' | 'tennis' | 'cycling' | 'other';

export type Goal = 'loseFat' | 'gainMuscle' | 'maintainImprove' | 'gainStrength' | 'improveEndurance' | 'generalHealth';

export type Sex = 'male' | 'female' | 'unspecified';

export type UserProfile = {
  name: string;
  sex: Sex;
  ageRange: string;
  goal: Goal;
  sports: Sport[];
  heightCm: number;
  targetWeightKg: number;
  dailyCalorieTarget: number;
  macroTargetsG: { protein: number; carbs: number; fats: number };
  hydrationTargetMl: number;
};

export type BodyMetricSnapshot = {
  date: string;
  weightKg: number;
  bodyFatPct: number;
  muscleMassKg: number;
  shouldersCm: number;
  chestCm: number;
  bicepsCm: number;
  waistCm: number;
  hipsCm: number;
  thighCm: number;
  restingHeartRate: number;
  sleepHours: number;
};

export type InsightTone = 'positive' | 'warning' | 'neutral';

export type Insight = {
  id: string;
  tone: InsightTone;
  headline: string;
  body: string;
};
