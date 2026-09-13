export type SplitLabel = 'Full Body' | 'Upper' | 'Lower' | 'Push' | 'Pull' | 'Legs';

/** Split pattern (which day types, in order) for a given weekly gym frequency. */
export const SPLIT_BY_FREQUENCY: Record<number, SplitLabel[]> = {
  1: ['Full Body'],
  2: ['Upper', 'Lower'],
  3: ['Push', 'Pull', 'Legs'],
  4: ['Push', 'Pull', 'Legs', 'Upper'],
  5: ['Push', 'Pull', 'Legs', 'Upper', 'Lower'],
  6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
};

export type ExerciseDef = {
  id: string;
  name: string;
  /** Conservative starting-load heuristic as a multiple of bodyweight, or null for bodyweight/band exercises. */
  bwMultiplier: number | null;
};

export const GYM_EXERCISES: Record<SplitLabel, ExerciseDef[]> = {
  'Full Body': [
    { id: 'back-squat', name: 'Back squat', bwMultiplier: 0.75 },
    { id: 'panca-piana', name: 'Panca piana', bwMultiplier: 0.5 },
    { id: 'rematore-bilanciere', name: 'Rematore con bilanciere', bwMultiplier: 0.4 },
    { id: 'plank', name: 'Plank', bwMultiplier: null },
  ],
  Upper: [
    { id: 'panca-piana', name: 'Panca piana', bwMultiplier: 0.5 },
    { id: 'trazioni-sbarra', name: 'Trazioni alla sbarra', bwMultiplier: null },
    { id: 'military-press', name: 'Military press', bwMultiplier: 0.35 },
    { id: 'curl-bicipiti', name: 'Curl bicipiti', bwMultiplier: 0.15 },
  ],
  Lower: [
    { id: 'back-squat', name: 'Back squat', bwMultiplier: 0.75 },
    { id: 'romanian-deadlift', name: 'Romanian deadlift', bwMultiplier: 0.6 },
    { id: 'leg-press', name: 'Leg press', bwMultiplier: 1.0 },
    { id: 'affondi', name: 'Affondi', bwMultiplier: 0.15 },
  ],
  Push: [
    { id: 'panca-piana', name: 'Panca piana', bwMultiplier: 0.5 },
    { id: 'military-press', name: 'Military press', bwMultiplier: 0.35 },
    { id: 'dip-parallele', name: 'Dip alle parallele', bwMultiplier: null },
    { id: 'alzate-laterali', name: 'Alzate laterali', bwMultiplier: 0.05 },
  ],
  Pull: [
    { id: 'stacco-da-terra', name: 'Stacco da terra', bwMultiplier: 0.9 },
    { id: 'trazioni-zavorrate', name: 'Trazioni zavorrate', bwMultiplier: null },
    { id: 'rematore-bilanciere', name: 'Rematore con bilanciere', bwMultiplier: 0.4 },
    { id: 'curl-bicipiti', name: 'Curl bicipiti', bwMultiplier: 0.15 },
  ],
  Legs: [
    { id: 'back-squat', name: 'Back squat', bwMultiplier: 0.75 },
    { id: 'romanian-deadlift', name: 'Romanian deadlift', bwMultiplier: 0.6 },
    { id: 'leg-press', name: 'Leg press', bwMultiplier: 1.0 },
    { id: 'affondi', name: 'Affondi', bwMultiplier: 0.15 },
  ],
};

export const HOME_EXERCISES: Record<SplitLabel, ExerciseDef[]> = {
  'Full Body': [
    { id: 'squat-manubri', name: 'Squat con manubri', bwMultiplier: 0.15 },
    { id: 'push-up', name: 'Push-up', bwMultiplier: null },
    { id: 'rematore-manubrio', name: 'Rematore con manubrio', bwMultiplier: 0.12 },
    { id: 'plank', name: 'Plank', bwMultiplier: null },
  ],
  Upper: [
    { id: 'push-up', name: 'Push-up', bwMultiplier: null },
    { id: 'rematore-elastico', name: 'Rematore con elastico', bwMultiplier: null },
    { id: 'shoulder-press-manubri', name: 'Shoulder press con manubri', bwMultiplier: 0.08 },
    { id: 'curl-manubri', name: 'Curl con manubri', bwMultiplier: 0.06 },
  ],
  Lower: [
    { id: 'squat-manubri', name: 'Squat con manubri', bwMultiplier: 0.15 },
    { id: 'affondi-manubri', name: 'Affondi', bwMultiplier: 0.1 },
    { id: 'hip-thrust', name: 'Hip thrust', bwMultiplier: 0.3 },
    { id: 'polpacci-piedi', name: 'Polpacci in piedi', bwMultiplier: 0.1 },
  ],
  Push: [
    { id: 'push-up', name: 'Push-up', bwMultiplier: null },
    { id: 'shoulder-press-manubri', name: 'Shoulder press con manubri', bwMultiplier: 0.08 },
    { id: 'dip-sedia', name: 'Dip su sedia', bwMultiplier: null },
    { id: 'alzate-laterali-manubri', name: 'Alzate laterali con manubri', bwMultiplier: 0.03 },
  ],
  Pull: [
    { id: 'rematore-manubrio', name: 'Rematore con manubrio', bwMultiplier: 0.12 },
    { id: 'trazioni-lat-elastico', name: 'Trazioni o lat pulldown con elastico', bwMultiplier: null },
    { id: 'face-pull-elastico', name: 'Face pull con elastico', bwMultiplier: null },
    { id: 'curl-manubri', name: 'Curl con manubri', bwMultiplier: 0.06 },
  ],
  Legs: [
    { id: 'squat-manubri', name: 'Squat con manubri', bwMultiplier: 0.15 },
    { id: 'affondi-manubri', name: 'Affondi', bwMultiplier: 0.1 },
    { id: 'hip-thrust', name: 'Hip thrust', bwMultiplier: 0.3 },
    { id: 'stacco-rumeno-manubri', name: 'Stacco rumeno con manubri', bwMultiplier: 0.2 },
  ],
};

export type SetScheme = { sets: number; reps: string; restSec: number };

/** Sets/reps/rest per gym focus goal, adattamento vs. later phases (progressione/consolidamento share one scheme). */
export const FOCUS_SCHEME: Record<string, { adattamento: SetScheme; later: SetScheme }> = {
  strength: { adattamento: { sets: 3, reps: '10-12', restSec: 90 }, later: { sets: 5, reps: '3-5', restSec: 180 } },
  hypertrophy: { adattamento: { sets: 3, reps: '12', restSec: 75 }, later: { sets: 4, reps: '8-12', restSec: 90 } },
  fatLoss: { adattamento: { sets: 3, reps: '15', restSec: 45 }, later: { sets: 3, reps: '12-15', restSec: 45 } },
  muscularEndurance: { adattamento: { sets: 3, reps: '15', restSec: 45 }, later: { sets: 4, reps: '15-20', restSec: 45 } },
  technique: { adattamento: { sets: 3, reps: '10', restSec: 90 }, later: { sets: 3, reps: '10', restSec: 90 } },
};

/** Weekly running session types per focus goal, adattamento vs. later phases. Cycled if there are more run days than entries. */
export const RUNNING_SESSIONS: Record<string, { adattamento: string[]; later: string[] }> = {
  endurance: {
    adattamento: ['Corsa facile 30 min', 'Corsa facile 35 min', 'Lungo lento 45 min'],
    later: ['Corsa facile 35-40 min', 'Corsa a ritmo medio 30 min', 'Lungo lento 60-70 min'],
  },
  speed: {
    adattamento: ['Corsa facile 30 min + allunghi', 'Corsa facile 30 min'],
    later: ['Ripetute 6-8×400m rec. 90s', 'Corsa facile 30 min', 'Corsa a ritmo medio 25 min'],
  },
  raceTime: {
    adattamento: ['Corsa facile 30 min', 'Corsa a ritmo medio 25 min'],
    later: ['Ripetute 5×1000m rec. 2 min', 'Corsa a ritmo gara 20 min', 'Lungo 50 min'],
  },
  fatLoss: {
    adattamento: ['Corsa facile 30 min', 'Corsa facile 35 min'],
    later: ['Corsa facile 35 min', 'Corsa a ritmo medio 30 min', 'Lungo lento 50 min'],
  },
  raceReady: {
    adattamento: ['Corsa facile 30 min', 'Corsa a ritmo medio 25 min'],
    later: ['Variazioni di ritmo 35 min', 'Corsa facile 30 min', 'Lungo specifico 60-90 min'],
  },
};

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/** Reasonably spaced weekday indices (0=Mon) for a given number of active days/week. */
export const WEEKDAY_PATTERN: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

/** Rounds a suggested load to a plate/dumbbell-friendly step. */
export function roundLoad(raw: number): number {
  const step = raw >= 20 ? 2.5 : raw >= 5 ? 1 : 0.5;
  return Math.round(raw / step) * step;
}

export function suggestedLoadFor(exercise: ExerciseDef, bodyweightKg: number, isAdattamento: boolean): number | null {
  if (exercise.bwMultiplier == null) return null;
  const raw = bodyweightKg * exercise.bwMultiplier * (isAdattamento ? 0.85 : 1);
  return roundLoad(raw);
}
