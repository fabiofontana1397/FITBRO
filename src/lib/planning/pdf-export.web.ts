// Metro doesn't honor jsPDF's package.json "browser" export condition on
// web and resolves the bare specifier to its Node build instead, which
// uses an AMD-style `require(["html2canvas"], ...)` call Metro's static
// analyzer can't parse (`Invalid call` bundling error). Importing the
// ES module build by its explicit subpath sidesteps that resolution
// entirely.
import jsPDF from 'jspdf/dist/jspdf.es.min.js';
import autoTable from 'jspdf-autotable';

import { findQuestion, labelFor } from '@/lib/questionnaire/schema';

import type { DietPlan, PlanMealItem } from './types';

// Web build of pdf-export — resolved automatically instead of pdf-export.ts
// by Metro/TS on web. expo-print's web shim ignores the `html` it's given
// and just calls window.print() on the live app (so "Scarica PDF" printed a
// screenshot of the screen, not the plan). Building a real PDF client-side
// with jsPDF sidesteps that entirely and downloads an actual .pdf file,
// which is also far more reliable on mobile browsers than a print dialog.

const ORANGE: [number, number, number] = [255, 90, 31];
const INK: [number, number, number] = [22, 23, 27];
const MUTED: [number, number, number] = [102, 102, 102];
const BODY: [number, number, number] = [51, 51, 51];
const MARGIN = 40;

function drawLetterhead(doc: jsPDF, pageWidth: number): number {
  let y = 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text('FIT', MARGIN, y);
  const fitWidth = doc.getTextWidth('FIT');
  doc.setTextColor(...ORANGE);
  doc.text('BRO', MARGIN + fitWidth, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(153, 153, 153);
  doc.text('IL TUO COACH PERSONALE', pageWidth - MARGIN, y, { align: 'right' });

  y += 10;
  doc.setDrawColor(230, 230, 230);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
  return y + 26;
}

/** "Petto di pollo (150g)" plus, when the plan offers same-role swaps,
 * a second line "in alternativa: Tonno (150g), Uova (180g)" — autoTable
 * renders \n as separate lines within a cell. */
function formatItem(item: PlanMealItem): string {
  const base = `${item.name} (${item.grams}g)`;
  if (!item.substitutes?.length) return base;
  const subs = item.substitutes.map((s) => `${s.name} (${s.grams}g)`).join(', ');
  return `${base}\nin alternativa: ${subs}`;
}

function drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(153, 153, 153);
  doc.text(
    'Generato da FITBRO. Il piano si aggiorna nel tempo in base ai tuoi progressi reali.',
    MARGIN,
    pageHeight - 24
  );
  doc.text(String(doc.getNumberOfPages()), pageWidth - MARGIN, pageHeight - 24, { align: 'right' });
}

export async function exportDietPlanPdf(plan: DietPlan, userName: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = drawLetterhead(doc, pageWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(`Piano alimentare di ${userName}`, MARGIN, y);
  y += 18;

  const goalLabel = labelFor(findQuestion('goal'), plan.goal) ?? plan.goal;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`Durata piano totale: ${plan.durationMonths} mesi · Obiettivo: ${goalLabel}`, MARGIN, y);
  y += 24;

  plan.months.forEach((month, index) => {
    if (index > 0) {
      doc.addPage();
      y = drawLetterhead(doc, pageWidth);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...INK);
    doc.text(month.title, MARGIN, y);
    y += 16;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...BODY);
    const focusLines = doc.splitTextToSize(month.focusNote, pageWidth - MARGIN * 2);
    doc.text(focusLines, MARGIN, y);
    y += focusLines.length * 12 + 6;

    doc.text(
      `${month.calorieTarget} kcal/giorno · Proteine ${month.macroTargetsG.protein}g · Carboidrati ${month.macroTargetsG.carbs}g · Grassi ${month.macroTargetsG.fats}g`,
      MARGIN,
      y
    );
    y += 16;

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Giorno', 'Pasto', 'Alimenti', 'Totale']],
      body: month.weeklySplit.flatMap((day) =>
        day.meals.map((meal) => [
          day.weekday,
          `${meal.time}\n${meal.label}`,
          meal.items.map((i) => formatItem(i)).join('\n'),
          `${meal.totalKcal} kcal`,
        ])
      ),
      styles: { fontSize: 9, cellPadding: 6, textColor: BODY, valign: 'top' },
      headStyles: { fillColor: ORANGE, textColor: 255 },
      alternateRowStyles: { fillColor: [247, 247, 248] },
      columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 70 }, 3: { cellWidth: 55 } },
    });
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, pageWidth, doc.internal.pageSize.getHeight());
  }

  doc.save(`piano-alimentare-${userName}.pdf`);
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

/** "3-0-1" -> "3-0-1 (3s negativa, 0s isometria, 1s spinta)" — same cadence
 * notation shown in the app's exercise cards. */
function describeTempo(tempo: string): string {
  const parts = tempo.split('-');
  if (parts.length !== 3) return tempo;
  const detail = parts.map((seconds, i) => `${seconds}s ${TEMPO_PHASE_LABELS[i]}`).join(', ');
  return `${tempo} (${detail})`;
}

export async function exportTrainingPlanPdf(input: TrainingPlanPdfInput) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = drawLetterhead(doc, pageWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(`Piano di allenamento di ${input.userName}`, MARGIN, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`Durata piano totale: ${input.totalMonths} mesi`, MARGIN, y);
  y += 14;
  doc.setTextColor(...BODY);
  doc.text(input.goalNote, MARGIN, y);
  y += 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text(input.monthTitle, MARGIN, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...BODY);
  const focusLines = doc.splitTextToSize(input.monthFocus, pageWidth - MARGIN * 2);
  doc.text(focusLines, MARGIN, y);
  y += focusLines.length * 12 + 12;

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Giorno', 'Esercizio', 'Serie', 'Rip.', 'Recupero', 'Descrizione', 'Carico']],
    body: input.rows.map((row) => [
      `${row.weekday} · ${row.dayTitle}`,
      row.name,
      row.sets != null ? String(row.sets) : '—',
      row.reps ?? '—',
      row.rest ?? '—',
      row.tempo ? describeTempo(row.tempo) : '—',
      row.carico ?? '—',
    ]),
    styles: { fontSize: 8, cellPadding: 6, textColor: BODY },
    headStyles: { fillColor: ORANGE, textColor: 255 },
    alternateRowStyles: { fillColor: [247, 247, 248] },
    columnStyles: { 1: { cellWidth: 90 }, 5: { cellWidth: 130 } },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    drawFooter(doc, pageWidth, doc.internal.pageSize.getHeight());
  }

  doc.save(`piano-allenamento-${input.userName}.pdf`);
}
