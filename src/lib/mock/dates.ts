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
