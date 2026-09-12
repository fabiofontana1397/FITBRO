import type { IconName } from '@/components/ui/icon';

import { daysAgoISO } from './dates';
import type { Sport, Workout } from './types';

export const sportMeta: Record<Sport, { label: string; unit: string }> = {
  gym: { label: 'Sala pesi', unit: 'kg' },
  functional: { label: 'Functional', unit: 'min' },
  running: { label: 'Corsa', unit: 'km' },
  swimming: { label: 'Nuoto', unit: 'm' },
  tennis: { label: 'Tennis', unit: 'min' },
  cycling: { label: 'Ciclismo', unit: 'km' },
  other: { label: 'Altro', unit: 'min' },
};

export const sportIcon: Record<Sport, IconName> = {
  gym: 'gym',
  functional: 'functional',
  running: 'running',
  swimming: 'swimming',
  tennis: 'tennis',
  cycling: 'cycling',
  other: 'otherSport',
};

export const workouts: Workout[] = [
  {
    id: 'w-today',
    sport: 'gym',
    title: 'Push Day — Petto / Spalle / Tricipiti',
    date: daysAgoISO(0),
    durationMin: 70,
    completed: false,
    planned: true,
    intensity: 'high',
    metrics: { volumeKg: 6200, sets: 18 },
    exercises: [
      { name: 'Panca piana', sets: [{ reps: 6, weightKg: 90 }, { reps: 6, weightKg: 90 }, { reps: 5, weightKg: 95 }] },
      { name: 'Military press', sets: [{ reps: 8, weightKg: 50 }, { reps: 8, weightKg: 50 }, { reps: 6, weightKg: 55 }] },
      { name: 'Dip alle parallele', sets: [{ reps: 12, weightKg: 0 }, { reps: 10, weightKg: 10 }, { reps: 8, weightKg: 15 }] },
    ],
    caloriesBurned: 480,
  },
  {
    id: 'w-1',
    sport: 'running',
    title: 'Corsa lunga domenicale',
    date: daysAgoISO(1),
    durationMin: 52,
    completed: true,
    planned: true,
    intensity: 'moderate',
    metrics: { distanceKm: 11.4, paceMinPerKm: 4.57, avgHeartRate: 152, elevationM: 88 },
    caloriesBurned: 690,
  },
  {
    id: 'w-2',
    sport: 'gym',
    title: 'Leg Day',
    date: daysAgoISO(2),
    durationMin: 65,
    completed: true,
    planned: true,
    intensity: 'high',
    metrics: { volumeKg: 8100, sets: 20 },
    exercises: [
      { name: 'Back squat', sets: [{ reps: 5, weightKg: 120 }, { reps: 5, weightKg: 125 }, { reps: 4, weightKg: 130 }] },
      { name: 'Romanian deadlift', sets: [{ reps: 8, weightKg: 100 }, { reps: 8, weightKg: 100 }] },
    ],
    caloriesBurned: 520,
  },
  {
    id: 'w-3',
    sport: 'tennis',
    title: 'Partita singolare',
    date: daysAgoISO(3),
    durationMin: 90,
    completed: true,
    planned: false,
    intensity: 'high',
    metrics: { avgHeartRate: 148 },
    caloriesBurned: 610,
  },
  {
    id: 'w-4',
    sport: 'functional',
    title: 'HIIT Metcon',
    date: daysAgoISO(4),
    durationMin: 40,
    completed: true,
    planned: true,
    intensity: 'high',
    metrics: { avgHeartRate: 161 },
    caloriesBurned: 430,
  },
  {
    id: 'w-5',
    sport: 'cycling',
    title: 'Uscita su strada',
    date: daysAgoISO(5),
    durationMin: 95,
    completed: true,
    planned: true,
    intensity: 'moderate',
    metrics: { distanceKm: 42, elevationM: 410, avgHeartRate: 138 },
    caloriesBurned: 780,
  },
  {
    id: 'w-6',
    sport: 'gym',
    title: 'Pull Day — Schiena / Bicipiti',
    date: daysAgoISO(6),
    durationMin: 68,
    completed: true,
    planned: true,
    intensity: 'high',
    metrics: { volumeKg: 7400, sets: 19 },
    exercises: [
      { name: 'Stacco da terra', sets: [{ reps: 5, weightKg: 140 }, { reps: 5, weightKg: 145 }] },
      { name: 'Trazioni zavorrate', sets: [{ reps: 8, weightKg: 10 }, { reps: 6, weightKg: 15 }] },
    ],
    caloriesBurned: 500,
  },
  {
    id: 'w-7',
    sport: 'running',
    title: 'Ripetute 6x800m',
    date: daysAgoISO(7),
    durationMin: 45,
    completed: true,
    planned: true,
    intensity: 'high',
    metrics: { distanceKm: 9.2, paceMinPerKm: 3.95, avgHeartRate: 168 },
    caloriesBurned: 610,
  },
  {
    id: 'w-8',
    sport: 'swimming',
    title: 'Sessione tecnica stile libero',
    date: daysAgoISO(9),
    durationMin: 50,
    completed: true,
    planned: true,
    intensity: 'moderate',
    metrics: { distanceKm: 2.1, laps: 42, avgHeartRate: 132 },
    caloriesBurned: 460,
  },
  {
    id: 'w-9',
    sport: 'gym',
    title: 'Push Day — Petto / Spalle / Tricipiti',
    date: daysAgoISO(10),
    durationMin: 66,
    completed: true,
    planned: true,
    intensity: 'high',
    metrics: { volumeKg: 5900, sets: 18 },
    caloriesBurned: 470,
  },
  {
    id: 'w-10',
    sport: 'cycling',
    title: 'Recupero attivo',
    date: daysAgoISO(12),
    durationMin: 40,
    completed: true,
    planned: true,
    intensity: 'low',
    metrics: { distanceKm: 16, avgHeartRate: 110 },
    caloriesBurned: 260,
  },
];

export function trainingLoadSeries(days = 7): number[] {
  const buckets = new Array(days).fill(0);
  for (const workout of workouts) {
    for (let i = 0; i < days; i++) {
      if (workout.date === daysAgoISO(days - 1 - i) && workout.completed) {
        buckets[i] += workout.durationMin * (workout.intensity === 'high' ? 1.3 : workout.intensity === 'moderate' ? 1 : 0.7);
      }
    }
  }
  return buckets;
}

export function weeklyVolumeBySport(): Record<Sport, number> {
  const result: Record<Sport, number> = {
    gym: 0,
    functional: 0,
    running: 0,
    swimming: 0,
    tennis: 0,
    cycling: 0,
    other: 0,
  };
  for (const workout of workouts) {
    if (workout.completed) {
      result[workout.sport] += workout.durationMin;
    }
  }
  return result;
}
