import type { Insight } from './types';

export const insights: Insight[] = [
  {
    id: 'i-1',
    tone: 'positive',
    headline: 'Sei 3 giorni avanti sul target proteine',
    body: 'Nelle ultime 2 settimane hai superato l’obiettivo proteico in 9 giorni su 14. Continua così per sostenere la crescita muscolare.',
  },
  {
    id: 'i-2',
    tone: 'warning',
    headline: 'Il sonno sta calando',
    body: 'Media di 6h50 nelle ultime 3 notti, sotto il tuo standard di 7h30. Potrebbe rallentare il recupero prima del prossimo leg day.',
  },
  {
    id: 'i-3',
    tone: 'positive',
    headline: 'Passo in miglioramento nella corsa lunga',
    body: 'Il tuo passo medio sulle uscite lunghe è sceso di 12″/km nelle ultime 4 settimane, a parità di frequenza cardiaca.',
  },
  {
    id: 'i-4',
    tone: 'neutral',
    headline: 'Volume sala pesi stabile',
    body: 'Il volume settimanale su push/pull/leg è costante da 3 settimane: puoi iniziare a introdurre un piccolo sovraccarico progressivo.',
  },
];

export const correlationNote =
  'Nelle settimane con ≥ 7h di sonno medio, il volume di allenamento settimanale è stato in media il 14% più alto.';
