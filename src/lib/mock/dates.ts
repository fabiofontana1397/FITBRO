export function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

export function daysAgoISO(n: number): string {
  return daysAgo(n).toISOString().slice(0, 10);
}

export function formatShortDay(iso: string, locale = 'it-IT'): string {
  return new Date(iso).toLocaleDateString(locale, { weekday: 'short' });
}

export function formatDayMonth(iso: string, locale = 'it-IT'): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function isToday(iso: string): boolean {
  return iso === daysAgoISO(0);
}

/** 0 = Monday ... 6 = Sunday (Italian week convention). */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - mondayIndex(d));
  return d;
}

/** The 7 ISO dates (Mon..Sun) of the week containing `date`. */
export function currentWeekDates(date: Date = new Date()): string[] {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function weekdayShort(iso: string, locale = 'it-IT'): string {
  return new Date(iso).toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
}

export function dayOfMonth(iso: string): number {
  return new Date(iso).getDate();
}
