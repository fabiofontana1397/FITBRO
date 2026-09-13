import * as Print from 'expo-print';

import { findQuestion, labelFor } from '@/lib/questionnaire/schema';

import type { DietPlan } from './types';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const BASE_STYLE = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #16171b; padding: 28px; }
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
<style>${BASE_STYLE}</style>
</head>
<body>
  <h1>FITBRO — ${escapeHtml(title)}</h1>
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
  const html = htmlShell('Piano alimentare', userName, `${plan.durationMonths} mesi · Obiettivo: ${goalLabel}`, monthsHtml);

  await Print.printAsync({ html });
}

export type TrainingPlanPdfRow = {
  weekday: string;
  dayTitle: string;
  name: string;
  sets: number | null;
  reps: string | null;
  rest: string | null;
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

const TRAINING_STYLE = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #16171b; padding: 28px; }
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
          ? `<tr><td class="day" colspan="5">${escapeHtml(row.weekday)} · ${escapeHtml(row.dayTitle)}</td></tr>`
          : '';
      lastDay = row.weekday;
      return `${dayHeading}
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td>${row.sets ?? '—'}</td>
          <td>${row.reps ? escapeHtml(row.reps) : '—'}</td>
          <td>${row.rest ? escapeHtml(row.rest) : '—'}</td>
          <td>${row.carico ? escapeHtml(row.carico) : '—'}</td>
        </tr>`;
    })
    .join('');

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>${TRAINING_STYLE}</style>
</head>
<body>
  <h1>FITBRO — Piano di allenamento</h1>
  <div class="meta">${escapeHtml(input.userName)} · Piano di ${input.totalMonths} mesi · Scheda: Mese ${input.monthIndex} di ${input.totalMonths}</div>
  <div class="goal">${escapeHtml(input.goalNote)}</div>
  <h2>${escapeHtml(input.monthTitle)}</h2>
  <p class="phase-note">${escapeHtml(input.monthFocus)}</p>
  <table>
    <thead><tr><th>Esercizio</th><th>Serie</th><th>Ripetizioni</th><th>Recupero</th><th>Carico</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">~ = carico consigliato per iniziare, sostituito dal carico reale una volta registrato in app.</div>
</body>
</html>`;

  await Print.printAsync({ html });
}
