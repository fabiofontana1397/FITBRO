/**
 * Maps calendar time onto the generated plan's months: the plan's N months
 * are all pre-computed for determinism, but the UI only ever exposes the
 * "current" one as active — the rest stay greyed out/locked, unlocking one
 * at a time as real time passes (see diet-plan.tsx / training-plan.tsx).
 */
export function currentMonthIndex(plan: { generatedAt: string; durationMonths: number }): number {
  const daysSinceStart = (Date.now() - new Date(plan.generatedAt).getTime()) / 86_400_000;
  const idx = 1 + Math.floor(daysSinceStart / 30);
  return Math.min(Math.max(idx, 1), plan.durationMonths);
}
