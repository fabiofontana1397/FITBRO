import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { daysAgoISO } from '@/lib/mock/dates';
import { findFood } from '@/lib/mock/food-database';
import { currentUser } from '@/lib/mock/user';
import { appJsonStorage } from '@/store/storage';

export type MealSlot =
  | 'colazione'
  | 'spuntinoMattina'
  | 'pranzo'
  | 'spuntinoPomeriggio'
  | 'cena'
  | 'spuntinoSera';

export const MEAL_SLOTS: { id: MealSlot; label: string; time: string; sharePct: number }[] = [
  { id: 'colazione', label: 'Colazione', time: '07:30', sharePct: 0.22 },
  { id: 'spuntinoMattina', label: 'Spuntino mattina', time: '10:30', sharePct: 0.08 },
  { id: 'pranzo', label: 'Pranzo', time: '13:15', sharePct: 0.3 },
  { id: 'spuntinoPomeriggio', label: 'Spuntino pomeriggio', time: '17:00', sharePct: 0.1 },
  { id: 'cena', label: 'Cena', time: '20:00', sharePct: 0.25 },
  { id: 'spuntinoSera', label: 'Spuntino sera', time: '22:00', sharePct: 0.05 },
];

export type MealFoodEntry = {
  id: string;
  date: string;
  slot: MealSlot;
  foodId: string;
  grams: number;
};

export type Macros = { kcal: number; protein: number; carbs: number; fats: number };

function seedEntries(): MealFoodEntry[] {
  const today = daysAgoISO(0);
  const rows: [MealSlot, string, number][] = [
    ['colazione', 'oats', 60],
    ['colazione', 'greek-yogurt', 170],
    ['colazione', 'blueberries', 100],
    ['colazione', 'honey', 15],
    ['spuntinoMattina', 'whey-protein', 30],
    ['spuntinoMattina', 'banana', 120],
    ['pranzo', 'chicken-breast', 150],
    ['pranzo', 'rice-basmati', 200],
    ['pranzo', 'broccoli', 200],
    ['pranzo', 'olive-oil', 10],
    ['spuntinoPomeriggio', 'puffed-rice', 30],
    ['spuntinoPomeriggio', 'jam', 20],
  ];
  return rows.map(([slot, foodId, grams], i) => ({
    id: `seed-${i}`,
    date: today,
    slot,
    foodId,
    grams,
  }));
}

type NutritionState = {
  entries: MealFoodEntry[];
  addEntry: (slot: MealSlot, foodId: string, grams: number, date?: string) => void;
  removeEntry: (id: string) => void;
};

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set) => ({
      entries: seedEntries(),
      addEntry: (slot, foodId, grams, date = daysAgoISO(0)) =>
        set((state) => ({
          entries: [...state.entries, { id: `${foodId}-${Date.now()}`, date, slot, foodId, grams }],
        })),
      removeEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
    }),
    { name: 'fitbro/nutrition', storage: appJsonStorage }
  )
);

export function macrosForEntry(entry: MealFoodEntry): Macros {
  const food = findFood(entry.foodId);
  if (!food) return { kcal: 0, protein: 0, carbs: 0, fats: 0 };
  const ratio = entry.grams / 100;
  return {
    kcal: food.kcal100 * ratio,
    protein: food.protein100 * ratio,
    carbs: food.carbs100 * ratio,
    fats: food.fats100 * ratio,
  };
}

export function sumMacros(entries: MealFoodEntry[]): Macros {
  return entries.reduce(
    (acc, entry) => {
      const m = macrosForEntry(entry);
      return { kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fats: acc.fats + m.fats };
    },
    { kcal: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

export function entriesForSlot(entries: MealFoodEntry[], slot: MealSlot, date: string): MealFoodEntry[] {
  return entries.filter((e) => e.slot === slot && e.date === date);
}

export function targetsForSlot(slot: MealSlot): Macros {
  const meta = MEAL_SLOTS.find((s) => s.id === slot)!;
  return {
    kcal: currentUser.dailyCalorieTarget * meta.sharePct,
    protein: currentUser.macroTargetsG.protein * meta.sharePct,
    carbs: currentUser.macroTargetsG.carbs * meta.sharePct,
    fats: currentUser.macroTargetsG.fats * meta.sharePct,
  };
}
