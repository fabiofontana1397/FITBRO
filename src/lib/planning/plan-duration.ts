import type { Goal } from '@/lib/mock/types';

/**
 * How many months the generated plan should span, so diet and training
 * share one coherent timeline. Based on safe, sustainable rates of change
 * (~0.5-0.6%/week bodyweight for fat loss, ~0.3-0.4%/week for a lean bulk —
 * faster rates trade off muscle retention or fat gain) rather than the
 * user's stated deadline, then clamped to a realistic re-assessment window:
 * shorter than 2 months is too little to show real progress, longer than
 * 6 months and the plan should be recalibrated from fresh data anyway.
 */
export function computePlanDurationMonths(answers: Record<string, unknown>): number {
  const currentWeightKg = Number(answers.currentWeightKg) || 0;
  const targetWeightKg = Number(answers.targetWeightKg) || 0;
  const goal = answers.goal as Goal | undefined;
  const deltaKg = Math.abs(targetWeightKg - currentWeightKg);

  const weeklyRatePct = goal === 'loseFat' ? 0.006 : goal === 'gainMuscle' || goal === 'gainStrength' ? 0.0035 : 0;

  let weeks = 8;
  if (weeklyRatePct > 0 && currentWeightKg > 0 && deltaKg > 0.5) {
    weeks = deltaKg / (currentWeightKg * weeklyRatePct);
  }

  const months = Math.ceil(weeks / 4.345);
  return Math.min(Math.max(months, 2), 6);
}
