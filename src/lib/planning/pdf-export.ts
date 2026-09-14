import * as Print from 'expo-print';
import { Platform } from 'react-native';

import { findQuestion, labelFor } from '@/lib/questionnaire/schema';

import type { DietPlan } from './types';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** expo-print's web shim ignores the `html` it's given entirely and just
 * calls `window.print()` on the current page — so on web a caller would
 * silently get a screenshot of the live app instead of the generated
 * document. Open the document in its own window and print *that* instead. */
async function printHtmlDocument(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Impossibile aprire la finestra di stampa (popup bloccato).');
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Give the new document a moment to lay out before invoking print —
    // calling it synchronously can print a still-blank page in some browsers.
    setTimeout(() => printWindow.print(), 250);
    return;
  }
  await Print.printAsync({ html });
}

const BRAND_STYLE = `
  .brand { display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px; }
  .brand-mark { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #16171b; }
  .brand-mark .accent { color: #FF5A1F; }
  .brand-tagline { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
`;

const BRAND_HTML = `
  <div class="brand">
    <span class="brand-mark">FIT<span class="accent">BRO</span></span>
    <span class="brand-tagline">Il tuo coach personale</span>
  </div>
`;

const BASE_STYLE = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #16171b; padding: 28px; }
  ${BRAND_STYLE}
  h1 { font-size: 22px; margin: 0 0 2px; }
  h2 { font-size: 16px; margin: 26px 0 8px; border-bottom: 2px solid #FF5A1F; padding-bottom: 6px; page-break-after: avoid; }
  h3 { font-size: 13px; margin: 14px 0 4px; page-break-after: avoid; }
  p { font-size: 12px; line-height: 1.5; color: #333; margin: 2px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  .meta { font-size: 11px; color: #666; margin-bottom: 18px; }
  .tag { display: inline-block; background: #fff1ea; color: #c23d0d; border-radius: 999px; padding: 2px 10px; font-size: 11px; font-weight: 600; margin-bottom: 4px; }
  .month { page-break-inside: avoid; margin-bottom: 22px; }
  .footer { margin-top: 24px; font-size: 10px; color: #999; }
`;

function htmlShell(title: string, userName: string, meta: string, body: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${BASE_STYLE}</style>
</head>
<body>
  ${BRAND_HTML}
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">${escapeHtml(userName)} · ${escapeHtml(meta)}</div>
  ${body}
  <div class="footer">Generato da FITBRO. Il piano si aggiorna nel tempo in base ai tuoi progressi reali.</div>
</body>
</html>`;
}

export async function exportDietPlanPdf(plan: DietPlan, userName: string) {
  const monthsHtml = plan.months
    .map((month) => {
      const rows = month.sampleDay
        .map(
          (meal) => `
        <tr>
          <td>${escapeHtml(meal.time)} · ${escapeHtml(meal.label)}</td>
          <td>${meal.items.map((i) => escapeHtml(`${i.name} (${i.grams}g)`)).join(', ')}</td>
          <td>${meal.totalKcal} kcal</td>
        </tr>`
        )
        .join('');

      return `
      <div class="month">
        <h2>${escapeHtml(month.title)}</h2>
        <p>${escapeHtml(month.focusNote)}</p>
        <p><strong>${month.calorieTarget} kcal/giorno</strong> · Proteine ${month.macroTargetsG.protein}g · Carboidrati ${month.macroTargetsG.carbs}g · Grassi ${month.macroTargetsG.fats}g</p>
        <h3>Esempio di giornata</h3>
        <table>
          <thead><tr><th>Pasto</th><th>Alimenti</th><th>Totale</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    })
    .join('');

  const goalLabel = labelFor(findQuestion('goal'), plan.goal) ?? plan.goal;
  const html = htmlShell(
    `Piano alimentare di ${userName}`,
    userName,
    `${plan.durationMonths} mesi · Obiettivo: ${goalLabel}`,
    monthsHtml
  );

  await printHtmlDocument(html);
}

export type TrainingPlanPdfRow = {
  weekday: string;
  dayTitle: string;
  name: string;
  sets: number | null;
  reps: string | null;
  rest: string | null;
  tempo: string | null;
  carico: string | null;
};

export type TrainingPlanPdfInput = {
  userName: string;
  goalNote: string;
  totalMonths: number;
  monthIndex: number;
  monthTitle: string;
  monthFocus: string;
  rows: TrainingPlanPdfRow[];
};

const TEMPO_PHASE_LABELS = ['negativa', 'isometria', 'spinta'];

/** "3-0-1" -> "3-0-1 (3s negativa, 0s isometria, 1s spinta)" for the PDF's
 * description column — same cadence notation shown in the app's exercise cards. */
function describeTempo(tempo: string): string {
  const parts = tempo.split('-');
  if (parts.length !== 3) return tempo;
  const detail = parts.map((seconds, i) => `${seconds}s ${TEMPO_PHASE_LABELS[i]}`).join(', ');
  return `${tempo} (${detail})`;
}

const TRAINING_STYLE = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #16171b; padding: 28px; }
  ${BRAND_STYLE}
  h1 { font-size: 22px; margin: 0 0 2px; }
  .meta { font-size: 11px; color: #666; margin-bottom: 4px; }
  .goal { font-size: 12px; color: #333; margin-bottom: 18px; }
  h2 { font-size: 15px; margin: 0 0 4px; }
  .phase-note { font-size: 12px; color: #333; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  td.day { font-weight: 700; background: #fff8f5; }
  .footer { margin-top: 20px; font-size: 10px; color: #999; }
`;

export async function exportTrainingPlanPdf(input: TrainingPlanPdfInput) {
  let lastDay = '';
  const rows = input.rows
    .map((row) => {
      const dayHeading =
        row.weekday !== lastDay
          ? `<tr><td class="day" colspan="6">${escapeHtml(row.weekday)} · ${escapeHtml(row.dayTitle)}</td></tr>`
          : '';
      lastDay = row.weekday;
      return `${dayHeading}
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td>${row.sets ?? '—'}</td>
          <td>${row.reps ? escapeHtml(row.reps) : '—'}</td>
          <td>${row.rest ? escapeHtml(row.rest) : '—'}</td>
          <td>${row.tempo ? escapeHtml(describeTempo(row.tempo)) : '—'}</td>
          <td>${row.carico ? escapeHtml(row.carico) : '—'}</td>
        </tr>`;
    })
    .join('');

  const title = `Piano di allenamento di ${input.userName}`;
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${TRAINING_STYLE}</style>
</head>
<body>
  ${BRAND_HTML}
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">Durata piano totale: ${input.totalMonths} mesi</div>
  <div class="goal">${escapeHtml(input.goalNote)}</div>
  <h2>${escapeHtml(input.monthTitle)}</h2>
  <p class="phase-note">${escapeHtml(input.monthFocus)}</p>
  <table>
    <thead><tr><th>Esercizio</th><th>Serie</th><th>Ripetizioni</th><th>Recupero</th><th>Descrizione</th><th>Carico</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Generato da FITBRO. Il piano si aggiorna nel tempo in base ai tuoi progressi reali.</div>
</body>
</html>`;

  await printHtmlDocument(html);
}
