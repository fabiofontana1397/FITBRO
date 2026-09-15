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

// A generic, rotating photography tip — we can't actually analyze the pixels,
// so this stays honestly generic (lighting/pose/consistency) rather than
// pretending to have looked at the image, picked deterministically per photo
// so it doesn't change on every re-render.
const PHOTO_QUALITY_TIPS = [
  'Illuminazione uniforme e frontale: evita luce laterale dura che crea ombre e nasconde i dettagli.',
  'Tieni la fotocamera sempre alla stessa altezza (circa all’ombelico) e alla stessa distanza dal soggetto.',
  'Usa lo stesso sfondo neutro e la stessa posizione nella stanza per ogni scatto, così i confronti sono più affidabili.',
  'Indossa capi aderenti o intimo: vestiti larghi nascondono i cambiamenti reali del corpo.',
  'Scatta sempre alla stessa ora del giorno, al mattino a digiuno, per ridurre le variazioni di gonfiore.',
];

function photoQualityTip(photoId: string): string {
  let hash = 0;
  for (let i = 0; i < photoId.length; i++) hash = (hash * 31 + photoId.charCodeAt(i)) >>> 0;
  return PHOTO_QUALITY_TIPS[hash % PHOTO_QUALITY_TIPS.length];
}

/** Full feedback for a single tapped photo: a generic (but honest, since no
 * real image analysis happens) tip on shot quality, plus a data-grounded
 * comparison against the most recent EARLIER photo in the same pose — so a
 * flexed front shot is only ever compared to another flexed front shot,
 * never to a different angle. */
export function generatePhotoDetailInsight(photo: BodyPhoto, allPhotos: BodyPhoto[], entries: BodyMetricSnapshot[]): string {
  const tip = photoQualityTip(photo.id);

  const samePoseSorted = allPhotos.filter((p) => p.pose === photo.pose).sort((a, b) => a.date.localeCompare(b.date));
  const indexInPose = samePoseSorted.findIndex((p) => p.id === photo.id);
  const previous = indexInPose > 0 ? samePoseSorted[indexInPose - 1] : undefined;

  if (!previous) {
    return `${tip}\n\nQuesta è la tua prima foto in questa posa: da qui in poi il coach AI potrà confrontarla con le prossime per mostrarti i progressi reali.`;
  }

  const prevEntry = closestEntry(entries, previous.date);
  const latestEntry = closestEntry(entries, photo.date);
  const days = daysBetween(previous.date, photo.date);

  if (!prevEntry || !latestEntry) {
    return `${tip}\n\nSono passati ${days} giorni dalla foto precedente in questa posa: continua a scattare con costanza per vedere l’evoluzione.`;
  }

  const fatDelta = latestEntry.bodyFatPct - prevEntry.bodyFatPct;
  const waistDelta = latestEntry.waistCm - prevEntry.waistCm;

  if (fatDelta <= -0.3 || waistDelta <= -0.5) {
    return `${tip}\n\nRispetto alla foto precedente in questa posa (${days} giorni fa), la massa grassa è scesa di ${Math.abs(fatDelta).toFixed(1)} punti% e il girovita di ${Math.abs(waistDelta).toFixed(1)} cm: il miglioramento si vede.`;
  }
  if (fatDelta >= 0.3 || waistDelta >= 0.5) {
    return `${tip}\n\nRispetto alla foto precedente in questa posa (${days} giorni fa), massa grassa e girovita sono leggermente aumentati. Rivedi il bilancio calorico se il tuo obiettivo è la definizione.`;
  }
  return `${tip}\n\nRispetto alla foto precedente in questa posa (${days} giorni fa) la composizione corporea è stabile — i cambiamenti visibili richiedono settimane, non giorni.`;
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
