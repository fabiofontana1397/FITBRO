import { create } from 'zustand';

import type { Goal, Sport } from '@/lib/mock/types';

export type AppearanceMode = 'system' | 'light' | 'dark';

type AppState = {
  hasOnboarded: boolean;
  appearance: AppearanceMode;
  selectedGoal: Goal | null;
  selectedSports: Sport[];
  completeOnboarding: (goal: Goal, sports: Sport[]) => void;
  setAppearance: (mode: AppearanceMode) => void;
  toggleSport: (sport: Sport) => void;
};

export const useAppStore = create<AppState>((set) => ({
  hasOnboarded: false,
  appearance: 'system',
  selectedGoal: null,
  selectedSports: [],
  completeOnboarding: (goal, sports) =>
    set({ hasOnboarded: true, selectedGoal: goal, selectedSports: sports }),
  setAppearance: (mode) => set({ appearance: mode }),
  toggleSport: (sport) =>
    set((state) => ({
      selectedSports: state.selectedSports.includes(sport)
        ? state.selectedSports.filter((s) => s !== sport)
        : [...state.selectedSports, sport],
    })),
}));
