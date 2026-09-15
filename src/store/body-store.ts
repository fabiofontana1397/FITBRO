import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { bodyHistorySeed } from '@/lib/mock/body';
import { daysAgoISO } from '@/lib/mock/dates';
import type { BodyMetricSnapshot } from '@/lib/mock/types';
import { appJsonStorage } from '@/store/storage';

// The fixed shot list a progress-photo session should cover — see the
// instructions card on the Corpo screen. Front/back get a relaxed AND a
// flexed shot; sides are relaxed only.
export type BodyPhotoPose = 'frontRelaxed' | 'sideRightRelaxed' | 'sideLeftRelaxed' | 'backRelaxed' | 'frontFlexed' | 'backFlexed';

export type BodyPhoto = {
  id: string;
  uri: string;
  date: string;
  pose: BodyPhotoPose;
};

export const POSE_LABELS: Record<BodyPhotoPose, string> = {
  frontRelaxed: 'Frontale',
  sideRightRelaxed: 'Laterale dx',
  sideLeftRelaxed: 'Laterale sx',
  backRelaxed: 'Posteriore',
  frontFlexed: 'Frontale flesso',
  backFlexed: 'Posteriore flesso',
};

export const POSE_ORDER: BodyPhotoPose[] = ['frontRelaxed', 'sideRightRelaxed', 'sideLeftRelaxed', 'backRelaxed', 'frontFlexed', 'backFlexed'];

type BodyState = {
  entries: BodyMetricSnapshot[];
  photos: BodyPhoto[];
  addWeightEntry: (weightKg: number, date?: string) => void;
  resetStartingWeight: (weightKg: number, date?: string) => void;
  addMeasurement: (partial: Partial<Omit<BodyMetricSnapshot, 'date'>>, date?: string) => void;
  addPhoto: (uri: string, pose: BodyPhotoPose, date?: string) => void;
  removePhoto: (id: string) => void;
};

export const useBodyStore = create<BodyState>()(
  persist(
    (set) => ({
      entries: bodyHistorySeed,
      photos: [],
      addWeightEntry: (weightKg, date = daysAgoISO(0)) =>
        set((state) => {
          const last = state.entries[state.entries.length - 1];
          const existingIndex = state.entries.findIndex((e) => e.date === date);
          const nextEntry: BodyMetricSnapshot = { ...last, date, weightKg };
          if (existingIndex >= 0) {
            const entries = [...state.entries];
            entries[existingIndex] = { ...entries[existingIndex], weightKg };
            return { entries };
          }
          return { entries: [...state.entries, nextEntry] };
        }),
      // Called from onboarding: a real first-time user has no history yet, so this
      // replaces the seeded demo history with a single fresh entry instead of
      // grafting a user-entered weight onto an unrelated canned trend.
      resetStartingWeight: (weightKg, date = daysAgoISO(0)) =>
        set((state) => {
          const template = state.entries[state.entries.length - 1];
          return { entries: [{ ...template, date, weightKg }] };
        }),
      addMeasurement: (partial, date = daysAgoISO(0)) =>
        set((state) => {
          const last = state.entries[state.entries.length - 1];
          const existingIndex = state.entries.findIndex((e) => e.date === date);
          if (existingIndex >= 0) {
            const entries = [...state.entries];
            entries[existingIndex] = { ...entries[existingIndex], ...partial };
            return { entries };
          }
          return { entries: [...state.entries, { ...last, ...partial, date }] };
        }),
      addPhoto: (uri, pose, date = daysAgoISO(0)) =>
        set((state) => ({
          photos: [...state.photos, { id: `photo-${Date.now()}`, uri, date, pose }],
        })),
      removePhoto: (id) => set((state) => ({ photos: state.photos.filter((p) => p.id !== id) })),
    }),
    { name: 'fitbro/body', storage: appJsonStorage }
  )
);
