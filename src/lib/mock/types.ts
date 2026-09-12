export type Sport = 'gym' | 'functional' | 'running' | 'swimming' | 'tennis' | 'cycling' | 'other';

export type Goal = 'muscle' | 'lean' | 'performance' | 'endurance' | 'health';

export type UserProfile = {
  name: string;
  goal: Goal;
  sports: Sport[];
  heightCm: number;
  targetWeightKg: number;
  dailyCalorieTarget: number;
  macroTargetsG: { protein: number; carbs: number; fats: number };
  hydrationTargetMl: number;
};

export type SetEntry = { reps: number; weightKg: number };

export type ExerciseEntry = {
  name: string;
  sets: SetEntry[];
};

export type WorkoutMetrics = {
  distanceKm?: number;
  paceMinPerKm?: number;
  avgHeartRate?: number;
  elevationM?: number;
  laps?: number;
  volumeKg?: number;
  sets?: number;
};

export type Workout = {
  id: string;
  sport: Sport;
  title: string;
  date: string; // ISO date
  durationMin: number;
  completed: boolean;
  planned: boolean;
  intensity: 'low' | 'moderate' | 'high';
  metrics: WorkoutMetrics;
  exercises?: ExerciseEntry[];
  caloriesBurned: number;
};

export type Meal = {
  id: string;
  date: string;
  time: string;
  name: string;
  items: string[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
};

export type BodyMetricSnapshot = {
  date: string;
  weightKg: number;
  bodyFatPct: number;
  muscleMassKg: number;
  waistCm: number;
  chestCm: number;
  hipsCm: number;
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

export type GoalProgress = {
  label: string;
  progress: number; // 0..1
  detail: string;
};
