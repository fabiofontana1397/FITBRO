import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Goal, Sport, UserProfile } from '@/lib/mock/types';
import { appJsonStorage } from '@/store/storage';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Fabio',
  goal: 'performance',
  sports: ['gym', 'running', 'tennis', 'cycling'],
  heightCm: 180,
  targetWeightKg: 78,
  dailyCalorieTarget: 2650,
  macroTargetsG: { protein: 175, carbs: 290, fats: 80 },
  hydrationTargetMl: 2800,
};

type UserState = UserProfile & {
  setGoalAndSports: (goal: Goal, sports: Sport[]) => void;
  setStartingStats: (heightCm: number, targetWeightKg: number) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE,
      setGoalAndSports: (goal, sports) => set({ goal, sports }),
      setStartingStats: (heightCm, targetWeightKg) => set({ heightCm, targetWeightKg }),
    }),
    { name: 'fitbro/user', storage: appJsonStorage }
  )
);
