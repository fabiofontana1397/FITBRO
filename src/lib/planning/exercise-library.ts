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

export const GYM_EXERCISES: Record<SplitLabel, string[]> = {
  'Full Body': ['Back squat', 'Panca piana', 'Rematore con bilanciere', 'Plank'],
  Upper: ['Panca piana', 'Trazioni alla sbarra', 'Military press', 'Curl bicipiti'],
  Lower: ['Back squat', 'Romanian deadlift', 'Leg press', 'Affondi'],
  Push: ['Panca piana', 'Military press', 'Dip alle parallele', 'Alzate laterali'],
  Pull: ['Stacco da terra', 'Trazioni zavorrate', 'Rematore con bilanciere', 'Curl bicipiti'],
  Legs: ['Back squat', 'Romanian deadlift', 'Leg press', 'Affondi'],
};

export const HOME_EXERCISES: Record<SplitLabel, string[]> = {
  'Full Body': ['Squat a corpo libero/manubri', 'Push-up', 'Rematore con manubrio', 'Plank'],
  Upper: ['Push-up', 'Rematore con elastico', 'Shoulder press con manubri', 'Curl con manubri'],
  Lower: ['Squat con manubri', 'Affondi', 'Hip thrust', 'Polpacci in piedi'],
  Push: ['Push-up', 'Shoulder press con manubri', 'Dip su sedia', 'Alzate laterali con manubri'],
  Pull: ['Rematore con manubrio', 'Trazioni o lat pulldown con elastico', 'Face pull con elastico', 'Curl con manubri'],
  Legs: ['Squat con manubri', 'Affondi', 'Hip thrust', 'Stacco rumeno con manubri'],
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
