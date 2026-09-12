import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Goal, Sex, Sport, UserProfile } from '@/lib/mock/types';
import { appJsonStorage } from '@/store/storage';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Fabio',
  sex: 'unspecified',
  ageRange: '25-34',
  goal: 'generalHealth',
  sports: ['gym', 'running', 'tennis', 'cycling'],
  heightCm: 180,
  targetWeightKg: 78,
  dailyCalorieTarget: 2650,
  macroTargetsG: { protein: 175, carbs: 290, fats: 80 },
  hydrationTargetMl: 2800,
};

export type FinalizeOnboardingInput = {
  goal: Goal;
  sports: Sport[];
  sex: Sex;
  ageRange: string;
  heightCm: number;
  targetWeightKg: number;
  dailyCalorieTarget: number;
  macroTargetsG: { protein: number; carbs: number; fats: number };
  hydrationTargetMl: number;
};

type UserState = UserProfile & {
  finalizeOnboarding: (input: FinalizeOnboardingInput) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE,
      finalizeOnboarding: (input) => set(input),
      updateProfile: (partial) => set(partial),
    }),
    { name: 'fitbro/user', storage: appJsonStorage }
  )
);
