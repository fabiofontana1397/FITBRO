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

/** How far the user has progressed through the *current* month, so the
 * plan card can show a live "day X of 30" rather than just the month name. */
export function currentMonthProgress(plan: { generatedAt: string; durationMonths: number }): {
  dayInMonth: number;
  fraction: number;
} {
  const daysSinceStart = (Date.now() - new Date(plan.generatedAt).getTime()) / 86_400_000;
  const monthIndex = currentMonthIndex(plan);
  const isFinalMonth = monthIndex === plan.durationMonths;
  const daysIntoMonth = daysSinceStart - (monthIndex - 1) * 30;
  const clampedDays = isFinalMonth ? Math.min(daysIntoMonth, 30) : daysIntoMonth;
  return {
    dayInMonth: Math.min(30, Math.max(1, Math.floor(clampedDays) + 1)),
    fraction: Math.min(1, Math.max(0, clampedDays / 30)),
  };
}
