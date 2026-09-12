import type { BodyMetricSnapshot } from '@/lib/mock/types';
import type { BodyPhoto } from '@/store/body-store';

function closestEntry(entries: BodyMetricSnapshot[], date: string): BodyMetricSnapshot | undefined {
  return [...entries].sort(
    (a, b) => Math.abs(new Date(a.date).getTime() - new Date(date).getTime()) - Math.abs(new Date(b.date).getTime() - new Date(date).getTime())
  )[0];
}

function daysBetween(a: string, b: string): number {
  return Math.round(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

export function generatePhotoInsight(photos: BodyPhoto[], entries: BodyMetricSnapshot[]): string | null {
  if (photos.length < 2) return null;
  const sorted = [...photos].sort((a, b) => a.date.localeCompare(b.date));
  const previous = sorted[sorted.length - 2];
  const latest = sorted[sorted.length - 1];

  const prevEntry = closestEntry(entries, previous.date);
  const latestEntry = closestEntry(entries, latest.date);
  const days = daysBetween(previous.date, latest.date);

  if (!prevEntry || !latestEntry) {
    return `Hai aggiunto una nuova foto a ${days} giorni dalla precedente. Continua a scattare con costanza per vedere l’evoluzione nel tempo.`;
  }

  const fatDelta = latestEntry.bodyFatPct - prevEntry.bodyFatPct;
  const waistDelta = latestEntry.waistCm - prevEntry.waistCm;

  if (fatDelta <= -0.3 || waistDelta <= -0.5) {
    return `In ${days} giorni la tua massa grassa è scesa di ${Math.abs(fatDelta).toFixed(1)} punti% e il girovita di ${Math.abs(waistDelta).toFixed(1)} cm: si vede, la definizione sta migliorando. Continua così!`;
  }
  if (fatDelta >= 0.3 || waistDelta >= 0.5) {
    return `Tra queste due foto (${days} giorni) massa grassa e girovita sono leggermente aumentati. Se il tuo obiettivo è la definizione, rivedi insieme al coach AI il bilancio calorico degli ultimi giorni.`;
  }
  return `In ${days} giorni la tua composizione corporea è rimasta stabile: coerente con una fase di mantenimento. Se punti a un cambiamento più visibile, serve pazienza — i risultati fisici emergono su settimane, non giorni.`;
}
