import { daysAgoISO, mondayIndex } from '@/lib/mock/dates';
import { useBodyStore } from '@/store/body-store';
import { useNutritionStore, type MealFoodEntry, type MealSlot } from '@/store/nutrition-store';
import { usePlanStore } from '@/store/plan-store';
import { useTrainingProgressStore, type CompletedExercise, type LoggedSet } from '@/store/training-progress-store';
import { useUserStore } from '@/store/user-store';

const DAYS = 30;

function jitter(spread: number) {
  return (Math.random() * 2 - 1) * spread;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

// A handful of realistic-looking Italian daily meal templates, cycled
// across the month rather than repeating the exact same day — plain
// variety, not an attempt to hit an exact calorie target.
const MEAL_TEMPLATES: { slot: MealSlot; foodId: string; grams: number }[][] = [
  [
    { slot: 'colazione', foodId: 'oats', grams: 70 },
    { slot: 'colazione', foodId: 'greek-yogurt', grams: 150 },
    { slot: 'pranzo', foodId: 'chicken-breast', grams: 180 },
    { slot: 'pranzo', foodId: 'rice-basmati', grams: 200 },
    { slot: 'cena', foodId: 'salmon', grams: 160 },
    { slot: 'cena', foodId: 'sweet-potato', grams: 200 },
  ],
  [
    { slot: 'colazione', foodId: 'eggs', grams: 120 },
    { slot: 'colazione', foodId: 'bread-wholegrain', grams: 60 },
    { slot: 'pranzo', foodId: 'pasta', grams: 200 },
    { slot: 'pranzo', foodId: 'beef-lean', grams: 150 },
    { slot: 'cena', foodId: 'tofu', grams: 150 },
    { slot: 'cena', foodId: 'quinoa', grams: 150 },
  ],
  [
    { slot: 'colazione', foodId: 'whey-protein', grams: 30 },
    { slot: 'colazione', foodId: 'oats', grams: 60 },
    { slot: 'pranzo', foodId: 'turkey-breast', grams: 180 },
    { slot: 'pranzo', foodId: 'couscous', grams: 180 },
    { slot: 'cena', foodId: 'tuna-canned', grams: 120 },
    { slot: 'cena', foodId: 'potato', grams: 220 },
  ],
  [
    { slot: 'colazione', foodId: 'cottage-cheese', grams: 150 },
    { slot: 'colazione', foodId: 'bread-white', grams: 50 },
    { slot: 'pranzo', foodId: 'salmon', grams: 150 },
    { slot: 'pranzo', foodId: 'rice-basmati', grams: 180 },
    { slot: 'cena', foodId: 'beef-lean', grams: 150 },
    { slot: 'cena', foodId: 'potato', grams: 200 },
  ],
];

/**
 * Backfills a plausible month of history — body weight, meals, and (when a
 * real training plan already exists) logged sets/completions against that
 * plan's actual weekly split — so the new charts on Home have something
 * real to show. Meant purely for local testing: overwrites whatever is
 * currently in these three stores on THIS device. Never touches
 * plan-store itself, so it can't invent a fake plan out of thin air.
 */
export function seedOneMonthOfTestData() {
  const user = useUserStore.getState();

  // 1. Body weight/measurements: 30 daily entries, trending from a bit
  // above target down toward it, with plausible day-to-day noise rather
  // than a perfectly straight line.
  const endWeight = user.targetWeightKg + 0.6;
  const startWeight = endWeight + 4.6;
  const bodyEntries = Array.from({ length: DAYS }, (_, i) => {
    const t = i / (DAYS - 1);
    const trendWeight = startWeight + (endWeight - startWeight) * t;
    return {
      date: daysAgoISO(DAYS - 1 - i),
      weightKg: round1(trendWeight + jitter(0.25)),
      bodyFatPct: round1(22 - 5 * t + jitter(0.3)),
      muscleMassKg: round1(60 + 3 * t + jitter(0.2)),
      shouldersCm: round1(110 + 2 * t + jitter(0.2)),
      chestCm: round1(100 + 3 * t + jitter(0.2)),
      bicepsCm: round1(32 + 2 * t + jitter(0.15)),
      waistCm: round1(92 - 8 * t + jitter(0.3)),
      hipsCm: round1(100 - 3 * t + jitter(0.2)),
      thighCm: round1(55 + 1.5 * t + jitter(0.2)),
      restingHeartRate: Math.round(64 - 6 * t + jitter(1)),
      sleepHours: round1(7 + jitter(0.6)),
    };
  });
  useBodyStore.setState({ entries: bodyEntries });

  // 2. Nutrition: colazione/pranzo/cena every day from a rotating set of
  // templates, using real food-database ids so macros/kcal compute for
  // real instead of showing zero.
  const nutritionEntries: MealFoodEntry[] = [];
  for (let i = 0; i < DAYS; i++) {
    const date = daysAgoISO(DAYS - 1 - i);
    const template = MEAL_TEMPLATES[i % MEAL_TEMPLATES.length];
    template.forEach((item, idx) => {
      nutritionEntries.push({ id: `seed-${date}-${idx}`, date, slot: item.slot, foodId: item.foodId, grams: item.grams });
    });
  }
  useNutritionStore.setState({ entries: nutritionEntries });

  // 3. Training progress — only against whatever plan is ALREADY on this
  // device, so logged sets/completions land on days that plan actually
  // scheduled a workout, not invented dates/exercises.
  const trainingPlan = usePlanStore.getState().trainingPlan;
  if (trainingPlan) {
    const month = trainingPlan.months.find((m) => m.monthIndex === 1) ?? trainingPlan.months[0];
    const split = month?.weeklySplit ?? [];
    const sets: LoggedSet[] = [];
    const completed: CompletedExercise[] = [];

    for (let i = 0; i < DAYS; i++) {
      const date = daysAgoISO(DAYS - 1 - i);
      const progressFrac = i / (DAYS - 1); // 0 a month ago -> 1 today: a gentle strength progression
      const dayPlan = split[mondayIndex(new Date(date))];
      if (dayPlan?.type !== 'workout') continue;

      for (const ex of dayPlan.exercises ?? []) {
        if (Math.random() < 0.12) continue; // the occasional missed exercise, not perfect adherence
        if (ex.suggestedKg != null) {
          const weightKg = Math.round((ex.suggestedKg * (0.9 + 0.15 * progressFrac) + jitter(ex.suggestedKg * 0.03)) * 2) / 2;
          const reps = Math.max(5, 8 + Math.round(jitter(1.5)));
          sets.push({ id: `seed-${date}-${ex.id}`, exerciseId: ex.id, exerciseName: ex.name, date, reps, weightKg });
        }
        if (Math.random() > 0.15) completed.push({ exerciseId: ex.id, date });
      }
    }
    useTrainingProgressStore.setState({ sets, completed });
  }
}
