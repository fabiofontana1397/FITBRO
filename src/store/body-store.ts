import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { bodyHistorySeed } from '@/lib/mock/body';
import { daysAgoISO } from '@/lib/mock/dates';
import type { BodyMetricSnapshot } from '@/lib/mock/types';
import { appJsonStorage } from '@/store/storage';

export type BodyPhoto = {
  id: string;
  uri: string;
  date: string;
};

type BodyState = {
  entries: BodyMetricSnapshot[];
  photos: BodyPhoto[];
  addWeightEntry: (weightKg: number, date?: string) => void;
  addMeasurement: (partial: Partial<Omit<BodyMetricSnapshot, 'date'>>, date?: string) => void;
  addPhoto: (uri: string, date?: string) => void;
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
      addPhoto: (uri, date = daysAgoISO(0)) =>
        set((state) => ({
          photos: [...state.photos, { id: `photo-${Date.now()}`, uri, date }],
        })),
      removePhoto: (id) => set((state) => ({ photos: state.photos.filter((p) => p.id !== id) })),
    }),
    { name: 'fitbro/body', storage: appJsonStorage }
  )
);
