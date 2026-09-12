import { daysAgoISO } from './dates';

export const dailyStepsTarget = 9000;

export const stepsHistory: { date: string; steps: number }[] = [
  { date: daysAgoISO(13), steps: 8200 },
  { date: daysAgoISO(12), steps: 6100 },
  { date: daysAgoISO(11), steps: 10400 },
  { date: daysAgoISO(10), steps: 9800 },
  { date: daysAgoISO(9), steps: 7300 },
  { date: daysAgoISO(8), steps: 11200 },
  { date: daysAgoISO(7), steps: 9100 },
  { date: daysAgoISO(6), steps: 8700 },
  { date: daysAgoISO(5), steps: 12300 },
  { date: daysAgoISO(4), steps: 9600 },
  { date: daysAgoISO(3), steps: 7800 },
  { date: daysAgoISO(2), steps: 10100 },
  { date: daysAgoISO(1), steps: 9950 },
  { date: daysAgoISO(0), steps: 6400 },
];

export function daysAboveStepTarget(): number {
  return stepsHistory.filter((d) => d.steps >= dailyStepsTarget).length;
}

export function stepsSeries(): number[] {
  return stepsHistory.map((d) => d.steps);
}
