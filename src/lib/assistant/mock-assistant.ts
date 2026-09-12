import { dailyStepsTarget, stepsHistory } from '@/lib/mock/activity';
import { daysAgoISO } from '@/lib/mock/dates';
import { useBodyStore } from '@/store/body-store';
import { useNutritionStore, sumMacros } from '@/store/nutrition-store';
import { useTrainingStore } from '@/store/training-store';
import { useUserStore } from '@/store/user-store';

function matches(text: string, ...keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function weightReply(): string {
  const { entries } = useBodyStore.getState();
  const currentUser = useUserStore.getState();
  const latest = entries[entries.length - 1];
  const prev = entries[entries.length - 2];
  const delta = prev ? latest.weightKg - prev.weightKg : 0;
  const toGoal = latest.weightKg - currentUser.targetWeightKg;
  const trendWord = delta < 0 ? 'in calo' : delta > 0 ? 'in salita' : 'stabile';
  return `Il tuo peso attuale è ${latest.weightKg.toFixed(1)} kg, ${trendWord} rispetto all'ultima rilevazione (${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg). Ti mancano circa ${Math.max(toGoal, 0).toFixed(1)} kg per raggiungere il tuo obiettivo di ${currentUser.targetWeightKg} kg. Continua così!`;
}

function nutritionReply(): string {
  const today = daysAgoISO(0);
  const { entries } = useNutritionStore.getState();
  const currentUser = useUserStore.getState();
  const todaysEntries = entries.filter((e) => e.date === today);
  const totals = sumMacros(todaysEntries);
  const remainingKcal = Math.max(currentUser.dailyCalorieTarget - totals.kcal, 0);
  const remainingProtein = Math.max(currentUser.macroTargetsG.protein - totals.protein, 0);
  return `Oggi hai registrato ${Math.round(totals.kcal)} kcal su ${currentUser.dailyCalorieTarget} (ti restano ${Math.round(remainingKcal)} kcal) e ${Math.round(totals.protein)}g di proteine su ${currentUser.macroTargetsG.protein}g (mancano ${Math.round(remainingProtein)}g). Se hai ancora margine, un pasto ricco di proteine magre ti aiuta a chiudere bene la giornata.`;
}

function trainingReply(): string {
  const { plan, templates, logs } = useTrainingStore.getState();
  const today = new Date();
  const planIndex = (today.getDay() + 6) % 7;
  const planDay = plan[planIndex];
  const todayIso = daysAgoISO(0);

  if (planDay.type === 'rest') {
    return 'Oggi il piano prevede riposo. Ne approfitto per ricordarti che il recupero è parte dell’allenamento tanto quanto le serie in palestra: dormi bene e idratati.';
  }
  if (planDay.type === 'cardio') {
    return `Oggi hai in programma "${planDay.label}" (${planDay.sport}) per circa ${planDay.durationMin} minuti. Punta a un ritmo che ti permetta di parlare a frasi brevi: è il modo migliore per costruire endurance senza accumulare fatica eccessiva.`;
  }
  const template = templates.find((t) => t.id === planDay.templateId);
  const done = logs.some((l) => l.templateId === planDay.templateId && l.date === todayIso);
  if (!template) return 'Non trovo il dettaglio dell’allenamento di oggi, ma puoi controllarlo nella scheda Training.';
  const exerciseList = template.exercises.map((e) => `${e.name} (${e.targetSets}x${e.targetReps})`).join(', ');
  return done
    ? `Hai già segnato "${template.title}" per oggi, ottimo lavoro! Se vuoi, controlla nella scheda Training i tuoi progressi di carico su ogni esercizio.`
    : `Oggi tocca a "${template.title}": ${exerciseList}. Ricordati un buon riscaldamento prima delle serie pesanti.`;
}

function measurementsReply(): string {
  const { entries } = useBodyStore.getState();
  const latest = entries[entries.length - 1];
  return `Le tue ultime misure: vita ${latest.waistCm} cm, petto ${latest.chestCm} cm, fianchi ${latest.hipsCm} cm, massa grassa ${latest.bodyFatPct}%. Le trovi sempre aggiornate nella scheda Corpo, con la guida su come misurarle correttamente.`;
}

function stepsReply(): string {
  const today = stepsHistory[stepsHistory.length - 1];
  const diff = today.steps - dailyStepsTarget;
  return diff >= 0
    ? `Oggi hai fatto ${today.steps.toLocaleString('it-IT')} passi, sopra il tuo target di ${dailyStepsTarget.toLocaleString('it-IT')}. Ottimo movimento extra oltre agli allenamenti strutturati!`
    : `Oggi sei a ${today.steps.toLocaleString('it-IT')} passi, un po' sotto il target di ${dailyStepsTarget.toLocaleString('it-IT')}. Una passeggiata serale potrebbe aiutarti a chiuderlo.`;
}

function goalReply(): string {
  const { entries } = useBodyStore.getState();
  const currentUser = useUserStore.getState();
  const latest = entries[entries.length - 1];
  const start = entries[0];
  const totalToLose = start.weightKg - currentUser.targetWeightKg;
  const doneSoFar = start.weightKg - latest.weightKg;
  const pct = totalToLose > 0 ? Math.min((doneSoFar / totalToLose) * 100, 100) : 100;
  return `Sei al ${pct.toFixed(0)}% del tuo percorso verso l’obiettivo di ${currentUser.targetWeightKg} kg (partito da ${start.weightKg.toFixed(1)} kg, ora sei a ${latest.weightKg.toFixed(1)} kg). Se vuoi, possiamo rivedere insieme dieta o allenamento per accelerare senza strafare.`;
}

const FALLBACK =
  'Posso aiutarti con peso e obiettivi, allenamento di oggi, alimentazione e macro, misure corporee o passi giornalieri. Chiedimi pure, ad esempio: "come va il mio peso?" oppure "cosa mi tocca allenare oggi?".';

export function generateAssistantReply(message: string): string {
  if (matches(message, 'ciao', 'salve', 'hey', 'buongiorno', 'buonasera')) {
    return `Ciao ${useUserStore.getState().name}! Sono il tuo coach FITBRO. Come posso aiutarti oggi — allenamento, dieta o obiettivi?`;
  }
  if (matches(message, 'obiettivo', 'goal', 'target', 'quanto manca')) return goalReply();
  if (matches(message, 'peso', 'pesare', 'bilancia')) return weightReply();
  if (matches(message, 'misura', 'circonferenz', 'vita', 'girovita', 'petto', 'fianch')) return measurementsReply();
  if (matches(message, 'pass', 'cammin', 'steps')) return stepsReply();
  if (matches(message, 'allenamento', 'training', 'palestra', 'scheda', 'esercizi', 'oggi devo')) return trainingReply();
  if (matches(message, 'dieta', 'nutrizione', 'calori', 'macro', 'proteine', 'mangiat')) return nutritionReply();

  return FALLBACK;
}

export const SUGGESTED_PROMPTS = [
  'Come va il mio peso?',
  'Cosa devo allenare oggi?',
  'Quanto manca al mio obiettivo?',
  'Come vanno le mie calorie oggi?',
];
