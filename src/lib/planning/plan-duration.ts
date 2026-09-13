/**
 * How many months the generated plan should span, so diet and training
 * share one coherent timeline. Fixed at 6 — long enough for a full
 * adattamento → progressione (x4) → consolidamento arc regardless of
 * goal, and a familiar "6-month program" framing users already expect
 * from fitness apps. Kept as a function (not a bare constant) so the
 * rest of the planning code doesn't care whether this is fixed or
 * computed from the user's answers.
 */
export function computePlanDurationMonths(_answers: Record<string, unknown>): number {
  return 6;
}
