import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { appJsonStorage } from '@/store/storage';

export type AnswerValue = string | string[] | number | undefined;

type OnboardingAnswersState = {
  answers: Record<string, AnswerValue>;
  setAnswer: (id: string, value: AnswerValue) => void;
  reset: () => void;
};

/**
 * Free-form store for the long-tail questionnaire (schema.ts). Answers are
 * kept as an untyped id → value map rather than exploding UserProfile with
 * 70+ fields; only the handful that actually drive app behaviour (goal,
 * sports, height, weight targets, calorie/macro targets) get promoted into
 * `user-store.ts` when onboarding finishes.
 */
export const useOnboardingStore = create<OnboardingAnswersState>()(
  persist(
    (set) => ({
      answers: {},
      setAnswer: (id, value) => set((state) => ({ answers: { ...state.answers, [id]: value } })),
      reset: () => set({ answers: {} }),
    }),
    { name: 'fitbro/onboarding-answers', storage: appJsonStorage }
  )
);
