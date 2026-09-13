import { findFood } from '@/lib/mock/food-database';
import type { Goal } from '@/lib/mock/types';
import { MEAL_SLOTS } from '@/store/nutrition-store';

import { buildFoodPools, pick } from './food-pools';
import { computePlanDurationMonths } from './plan-duration';
import type { DietMonthPlan, DietPlan, PlanMeal, PlanMealItem, PlanPhaseKind } from './types';

export type DietPlanInput = {
  answers: Record<string, unknown>;
  dailyCalorieTarget: number;
  macroTargetsG: { protein: number; carbs: number; fats: number };
};

function phaseForMonth(monthIndex: number, totalMonths: number): PlanPhaseKind {
  if (monthIndex === 1) return 'adattamento';
  if (monthIndex === totalMonths) return 'consolidamento';
  return 'progressione';
}

function phaseTitle(phase: PlanPhaseKind, goal: Goal): string {
  if (phase === 'adattamento') return 'Adattamento';
  if (phase === 'consolidamento') return 'Consolidamento';
  if (goal === 'loseFat') return 'Deficit progressivo';
  if (goal === 'gainMuscle' || goal === 'gainStrength') return 'Surplus progressivo';
  return 'Aggiustamenti mirati';
}

function phaseNote(phase: PlanPhaseKind, goal: Goal): string {
  if (phase === 'adattamento') {
    return 'Calorie vicine al tuo mantenimento per abituare corpo e abitudini al nuovo piano, senza cali di energia improvvisi.';
  }
  if (phase === 'consolidamento') {
    return 'I target si stabilizzano: da qui il piano si mantiene e si ricalibra ogni mese in base ai tuoi progressi reali.';
  }
  if (goal === 'loseFat') {
    return 'Il deficit calorico è pienamente attivo: la priorità è preservare la massa muscolare mentre il peso scende.';
  }
  if (goal === 'gainMuscle' || goal === 'gainStrength') {
    return 'Il surplus calorico è pienamente attivo per sostenere la crescita muscolare, con un ritmo di aumento controllato.';
  }
  return 'Piccoli aggiustamenti su calorie e macro, guidati dai tuoi progressi reali in energia e performance.';
}

function monthCalorieTarget(phase: PlanPhaseKind, finalTarget: number, goal: Goal): number {
  if (phase !== 'adattamento') return finalTarget;
  const nudge = goal === 'loseFat' ? 150 : goal === 'gainMuscle' || goal === 'gainStrength' ? -150 : 0;
  return Math.round(finalTarget + nudge);
}

function monthMacros(
  calorieTarget: number,
  finalTarget: number,
  finalMacros: { protein: number; carbs: number; fats: number }
): { protein: number; carbs: number; fats: number } {
  const ratio = finalTarget ? calorieTarget / finalTarget : 1;
  return {
    protein: Math.round(finalMacros.protein * Math.max(ratio, 0.92)),
    carbs: Math.round(finalMacros.carbs * ratio),
    fats: Math.round(finalMacros.fats * ratio),
  };
}

function round5(n: number): number {
  return Math.max(5, Math.round(n / 5) * 5);
}

function buildSampleDay(seed: number, calorieTarget: number, pools: ReturnType<typeof buildFoodPools>): PlanMeal[] {
  return MEAL_SLOTS.map((slot, slotIdx) => {
    const slotKcal = calorieTarget * slot.sharePct;
    const isMain = slot.sharePct >= 0.2;
    const proteinFood = findFood(pick(pools.protein, seed + slotIdx))!;
    const carbFood = findFood(pick(pools.carbs, seed + slotIdx + 1))!;

    const items: PlanMealItem[] = [];

    const proteinGrams = round5((slotKcal * 0.4) / proteinFood.kcal100 * 100);
    items.push({ name: proteinFood.name, grams: proteinGrams, kcal: Math.round((proteinFood.kcal100 * proteinGrams) / 100) });

    const carbGrams = round5((slotKcal * 0.35) / carbFood.kcal100 * 100);
    items.push({ name: carbFood.name, grams: carbGrams, kcal: Math.round((carbFood.kcal100 * carbGrams) / 100) });

    if (isMain) {
      const fatFood = findFood(pick(pools.fats, seed + slotIdx))!;
      const fatGrams = round5((slotKcal * 0.25) / fatFood.kcal100 * 100);
      items.push({ name: fatFood.name, grams: fatGrams, kcal: Math.round((fatFood.kcal100 * fatGrams) / 100) });

      const veg = findFood(pick(pools.vegetables, seed + slotIdx))!;
      items.push({ name: veg.name, grams: 150, kcal: Math.round((veg.kcal100 * 150) / 100) });
    } else {
      const fruit = findFood(pick(pools.fruit, seed + slotIdx))!;
      items.push({ name: fruit.name, grams: fruit.defaultPortionG, kcal: Math.round((fruit.kcal100 * fruit.defaultPortionG) / 100) });
    }

    const totalKcal = items.reduce((sum, item) => sum + item.kcal, 0);
    return { slotId: slot.id, label: slot.label, time: slot.time, items, totalKcal };
  });
}

export function generateDietPlan(input: DietPlanInput): DietPlan {
  const { answers, dailyCalorieTarget, macroTargetsG } = input;
  const goal = (answers.goal as Goal) ?? 'generalHealth';
  const durationMonths = computePlanDurationMonths(answers);
  const pools = buildFoodPools(answers);

  const months: DietMonthPlan[] = [];
  for (let monthIndex = 1; monthIndex <= durationMonths; monthIndex++) {
    const phase = phaseForMonth(monthIndex, durationMonths);
    const calorieTarget = monthCalorieTarget(phase, dailyCalorieTarget, goal);
    const macros = monthMacros(calorieTarget, dailyCalorieTarget, macroTargetsG);

    months.push({
      monthIndex,
      phase,
      title: `Mese ${monthIndex} · ${phaseTitle(phase, goal)}`,
      focusNote: phaseNote(phase, goal),
      calorieTarget,
      macroTargetsG: macros,
      sampleDay: buildSampleDay(monthIndex, calorieTarget, pools),
    });
  }

  return { generatedAt: new Date().toISOString(), durationMonths, goal, months };
}
