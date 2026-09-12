import { daysAgoISO } from './dates';
import type { Meal } from './types';

export const todaysMeals: Meal[] = [
  {
    id: 'm-1',
    date: daysAgoISO(0),
    time: '07:30',
    name: 'Colazione',
    items: ['Fiocchi d’avena', 'Yogurt greco', 'Mirtilli', 'Miele'],
    calories: 520,
    proteinG: 32,
    carbsG: 68,
    fatsG: 12,
  },
  {
    id: 'm-2',
    date: daysAgoISO(0),
    time: '10:30',
    name: 'Spuntino',
    items: ['Frullato proteico', 'Banana'],
    calories: 260,
    proteinG: 28,
    carbsG: 30,
    fatsG: 3,
  },
  {
    id: 'm-3',
    date: daysAgoISO(0),
    time: '13:15',
    name: 'Pranzo',
    items: ['Petto di pollo', 'Riso basmati', 'Broccoli', 'Olio EVO'],
    calories: 680,
    proteinG: 52,
    carbsG: 70,
    fatsG: 16,
  },
  {
    id: 'm-4',
    date: daysAgoISO(0),
    time: '17:00',
    name: 'Pre-workout',
    items: ['Riso soffiato', 'Marmellata'],
    calories: 190,
    proteinG: 3,
    carbsG: 42,
    fatsG: 1,
  },
];

export const weeklyCalorieSeries = [2410, 2580, 2690, 2510, 2720, 2340, 2470];
export const weeklyProteinSeries = [162, 171, 180, 158, 176, 149, 168];

export function totalsFor(meals: Meal[]) {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      proteinG: acc.proteinG + meal.proteinG,
      carbsG: acc.carbsG + meal.carbsG,
      fatsG: acc.fatsG + meal.fatsG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 }
  );
}
