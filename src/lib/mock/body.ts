import { daysAgoISO } from './dates';
import type { BodyMetricSnapshot } from './types';

export const bodyHistorySeed: BodyMetricSnapshot[] = [
  { date: daysAgoISO(84), weightKg: 83.4, bodyFatPct: 19.8, muscleMassKg: 63.1, waistCm: 88.5, chestCm: 103, hipsCm: 99, restingHeartRate: 61, sleepHours: 6.8 },
  { date: daysAgoISO(70), weightKg: 82.6, bodyFatPct: 19.1, muscleMassKg: 63.6, waistCm: 87.6, chestCm: 103.2, hipsCm: 98.5, restingHeartRate: 60, sleepHours: 7.0 },
  { date: daysAgoISO(56), weightKg: 81.9, bodyFatPct: 18.4, muscleMassKg: 64.1, waistCm: 86.8, chestCm: 103.6, hipsCm: 98, restingHeartRate: 59, sleepHours: 7.1 },
  { date: daysAgoISO(42), weightKg: 81.2, bodyFatPct: 17.7, muscleMassKg: 64.6, waistCm: 86, chestCm: 104, hipsCm: 97.6, restingHeartRate: 58, sleepHours: 7.2 },
  { date: daysAgoISO(28), weightKg: 80.3, bodyFatPct: 17.1, muscleMassKg: 65, waistCm: 85.1, chestCm: 104.3, hipsCm: 97.1, restingHeartRate: 57, sleepHours: 7.3 },
  { date: daysAgoISO(21), weightKg: 79.9, bodyFatPct: 16.8, muscleMassKg: 65.2, waistCm: 84.7, chestCm: 104.4, hipsCm: 97, restingHeartRate: 56, sleepHours: 7.3 },
  { date: daysAgoISO(14), weightKg: 79.6, bodyFatPct: 16.5, muscleMassKg: 65.5, waistCm: 84.3, chestCm: 104.6, hipsCm: 96.8, restingHeartRate: 56, sleepHours: 7.4 },
  { date: daysAgoISO(10), weightKg: 79.3, bodyFatPct: 16.3, muscleMassKg: 65.6, waistCm: 84, chestCm: 104.7, hipsCm: 96.6, restingHeartRate: 55, sleepHours: 7.4 },
  { date: daysAgoISO(7), weightKg: 79.1, bodyFatPct: 16.1, muscleMassKg: 65.8, waistCm: 83.8, chestCm: 104.8, hipsCm: 96.5, restingHeartRate: 55, sleepHours: 7.5 },
  { date: daysAgoISO(4), weightKg: 78.9, bodyFatPct: 15.9, muscleMassKg: 66, waistCm: 83.5, chestCm: 104.9, hipsCm: 96.4, restingHeartRate: 54, sleepHours: 7.5 },
  { date: daysAgoISO(2), weightKg: 78.7, bodyFatPct: 15.8, muscleMassKg: 66.1, waistCm: 83.3, chestCm: 105, hipsCm: 96.3, restingHeartRate: 54, sleepHours: 7.6 },
  { date: daysAgoISO(1), weightKg: 78.6, bodyFatPct: 15.7, muscleMassKg: 66.2, waistCm: 83.2, chestCm: 105, hipsCm: 96.2, restingHeartRate: 54, sleepHours: 7.6 },
];

export function latestSnapshot(entries: BodyMetricSnapshot[]): BodyMetricSnapshot {
  return entries[entries.length - 1];
}

export function seriesOf(entries: BodyMetricSnapshot[], key: keyof BodyMetricSnapshot): number[] {
  return entries.map((s) => Number(s[key]));
}

export function percentChange(entries: BodyMetricSnapshot[], key: keyof BodyMetricSnapshot, spanFromEnd = 4): number {
  const series = seriesOf(entries, key);
  const start = series[Math.max(0, series.length - 1 - spanFromEnd)];
  const end = series[series.length - 1];
  if (!start) return 0;
  return ((end - start) / start) * 100;
}

export function deltaFromPrevious(entries: BodyMetricSnapshot[], key: keyof BodyMetricSnapshot): number {
  if (entries.length < 2) return 0;
  const end = Number(entries[entries.length - 1][key]);
  const prev = Number(entries[entries.length - 2][key]);
  return end - prev;
}
