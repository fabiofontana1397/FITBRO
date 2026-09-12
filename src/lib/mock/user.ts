import type { UserProfile } from './types';

export const currentUser: UserProfile = {
  name: 'Fabio',
  goal: 'performance',
  sports: ['gym', 'running', 'tennis', 'cycling'],
  heightCm: 180,
  targetWeightKg: 78,
  dailyCalorieTarget: 2650,
  macroTargetsG: { protein: 175, carbs: 290, fats: 80 },
  hydrationTargetMl: 2800,
};
