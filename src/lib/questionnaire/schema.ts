export type QuestionType = 'single' | 'multi' | 'scale' | 'number' | 'text' | 'longtext';

export type QuestionOption = { value: string; label: string };

export type Question = {
  id: string;
  type: QuestionType;
  label: string;
  helper?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  unit?: string;
  placeholder?: string;
  optional?: boolean;
};

export type OnboardingStep = {
  id: string;
  title: string;
  subtitle?: string;
  banner?: string;
  questions: Question[];
};

/**
 * Options for question `activitiesPracticed`. Values are distinct (so
 * multi-select toggling works), but several map onto the app's core
 * `Sport` enum via ACTIVITY_TO_SPORT (see lib/mock/training.ts) so this
 * answer can double as the user's `sports` profile field.
 */
const ACTIVITY_OPTIONS: QuestionOption[] = [
  { value: 'gym', label: 'Pesi' },
  { value: 'running', label: 'Corsa' },
  { value: 'cycling', label: 'Ciclismo' },
  { value: 'swimming', label: 'Nuoto' },
  { value: 'tennis', label: 'Tennis/padel' },
  { value: 'functional', label: 'CrossFit / Functional' },
  { value: 'calcio', label: 'Calcio' },
  { value: 'artiMarziali', label: 'Arti marziali' },
  { value: 'camminata', label: 'Camminata' },
  { value: 'escursionismo', label: 'Escursionismo' },
  { value: 'altro', label: 'Altro' },
];

/** Maps `activitiesPracticed` answer values onto the app's Sport enum. */
export const ACTIVITY_TO_SPORT: Record<string, 'gym' | 'functional' | 'running' | 'swimming' | 'tennis' | 'cycling' | 'other'> = {
  gym: 'gym',
  running: 'running',
  cycling: 'cycling',
  swimming: 'swimming',
  tennis: 'tennis',
  functional: 'functional',
  calcio: 'other',
  artiMarziali: 'other',
  camminata: 'other',
  escursionismo: 'other',
  altro: 'other',
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'goal',
    title: 'Obiettivo',
    subtitle: 'Cosa vuoi ottenere con FITBRO?',
    questions: [
      {
        id: 'goal',
        type: 'single',
        label: 'Qual è il tuo obiettivo principale?',
        options: [
          { value: 'loseFat', label: 'Perdere grasso' },
          { value: 'gainMuscle', label: 'Aumentare massa muscolare' },
          { value: 'recomposition', label: 'Ricomposizione corporea' },
          { value: 'maintainImprove', label: 'Mantenere il peso e migliorare la forma fisica' },
          { value: 'gainStrength', label: 'Aumentare forza' },
          { value: 'improveEndurance', label: 'Migliorare resistenza' },
          { value: 'sportEvent', label: 'Prepararmi per uno sport/evento' },
          { value: 'generalHealth', label: 'Migliorare salute e benessere generale' },
        ],
      },
      {
        id: 'urgency',
        type: 'scale',
        label: 'Quanto è importante raggiungere questo obiettivo rapidamente?',
        helper: '1 = nessuna fretta · 5 = il più rapidamente possibile',
        min: 1,
        max: 5,
      },
      {
        id: 'hasDeadline',
        type: 'single',
        label: 'Hai una scadenza o un evento specifico?',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Sì' },
        ],
      },
      { id: 'deadlineDate', type: 'text', label: 'Se sì, data', placeholder: 'gg/mm/aaaa', optional: true },
      { id: 'targetEvent', type: 'text', label: 'Se sì, evento', placeholder: 'es. maratona, gara, matrimonio…', optional: true },
      { id: 'successWeightKg', type: 'number', label: 'Peso che consideri un successo', unit: 'kg', optional: true },
      { id: 'successWaistCm', type: 'number', label: 'Girovita che consideri un successo', unit: 'cm', optional: true },
      {
        id: 'successOther',
        type: 'text',
        label: 'Altro (massa muscolare, performance, ecc.)',
        placeholder: 'Descrivi il tuo traguardo',
        optional: true,
      },
    ],
  },
  {
    id: 'physical',
    title: 'Profilo fisico',
    questions: [
      {
        id: 'ageRange',
        type: 'single',
        label: 'Età',
        options: [
          { value: 'lt18', label: 'Meno di 18' },
          { value: '18-24', label: '18–24' },
          { value: '25-34', label: '25–34' },
          { value: '35-44', label: '35–44' },
          { value: '45-54', label: '45–54' },
          { value: '55+', label: '55+' },
        ],
      },
      {
        id: 'sex',
        type: 'single',
        label: 'Sesso',
        options: [
          { value: 'male', label: 'Uomo' },
          { value: 'female', label: 'Donna' },
          { value: 'unspecified', label: 'Preferisco non specificarlo' },
        ],
      },
      { id: 'heightCm', type: 'number', label: 'Altezza', unit: 'cm' },
      { id: 'currentWeightKg', type: 'number', label: 'Peso attuale', unit: 'kg' },
      { id: 'targetWeightKg', type: 'number', label: 'Peso desiderato', unit: 'kg' },
      { id: 'maxWeight12mo', type: 'number', label: 'Peso massimo raggiunto negli ultimi 12 mesi', unit: 'kg', optional: true },
      { id: 'minWeight12mo', type: 'number', label: 'Peso minimo raggiunto negli ultimi 12 mesi', unit: 'kg', optional: true },
      { id: 'bodyFatPct', type: 'number', label: 'Percentuale di massa grassa, se disponibile', unit: '%', optional: true },
    ],
  },
  {
    id: 'daily',
    title: 'Attività quotidiana',
    questions: [
      {
        id: 'jobActivity',
        type: 'single',
        label: 'Che tipo di lavoro fai?',
        options: [
          { value: 'sedentary', label: 'Prevalentemente sedentario' },
          { value: 'seatedMobile', label: 'Seduto ma con frequenti spostamenti' },
          { value: 'standing', label: 'In piedi per gran parte della giornata' },
          { value: 'active', label: 'Lavoro fisicamente attivo' },
          { value: 'veryHeavy', label: 'Lavoro molto pesante/fisico' },
        ],
      },
      {
        id: 'dailySteps',
        type: 'single',
        label: 'Quanti passi fai mediamente al giorno?',
        options: [
          { value: 'lt3000', label: '<3.000' },
          { value: '3000-5000', label: '3.000–5.000' },
          { value: '5000-8000', label: '5.000–8.000' },
          { value: '8000-12000', label: '8.000–12.000' },
          { value: 'gt12000', label: '>12.000' },
          { value: 'unknown', label: 'Non lo so' },
        ],
      },
      {
        id: 'sleepHoursRange',
        type: 'single',
        label: 'Quanto dormi mediamente?',
        options: [
          { value: 'lt5', label: '<5 ore' },
          { value: '5-6', label: '5–6 ore' },
          { value: '6-7', label: '6–7 ore' },
          { value: '7-8', label: '7–8 ore' },
          { value: 'gt8', label: '>8 ore' },
        ],
      },
      { id: 'sleepQuality', type: 'scale', label: 'Come valuteresti la qualità del tuo sonno?', min: 1, max: 5 },
      { id: 'stressLevel', type: 'scale', label: 'Quanto stress percepisci mediamente?', min: 1, max: 5 },
    ],
  },
  {
    id: 'eatingHabits',
    title: 'Alimentazione',
    questions: [
      {
        id: 'dietHistory',
        type: 'single',
        label: 'Hai seguito una dieta strutturata in passato?',
        options: [
          { value: 'never', label: 'Mai' },
          { value: 'occasionally', label: 'Sì, occasionalmente' },
          { value: 'months', label: 'Sì, per diversi mesi' },
          { value: 'years', label: 'Sì, per diversi anni' },
        ],
      },
      {
        id: 'dietApproach',
        type: 'single',
        label: 'Quale approccio hai seguito?',
        options: [
          { value: 'caloriesMacros', label: 'Calorie/macronutrienti' },
          { value: 'mediterranean', label: 'Dieta mediterranea' },
          { value: 'lowCarb', label: 'Low carb' },
          { value: 'keto', label: 'Keto' },
          { value: 'intermittentFasting', label: 'Intermittent fasting' },
          { value: 'vegetarian', label: 'Dieta vegetariana' },
          { value: 'other', label: 'Altro' },
        ],
        optional: true,
      },
      { id: 'whatWorked', type: 'longtext', label: 'Cosa ha funzionato meglio per te?', optional: true },
      { id: 'whatDidntWork', type: 'longtext', label: 'Cosa NON ha funzionato?', optional: true },
      {
        id: 'dietStrictness',
        type: 'single',
        label: 'Quanto vuoi essere preciso nel seguire la dieta?',
        options: [
          { value: 'veryFlexible', label: 'Molto flessibile' },
          { value: 'flexible', label: 'Abbastanza flessibile' },
          { value: 'precise', label: 'Voglio seguire un piano preciso' },
          { value: 'strict', label: 'Voglio pesare gli alimenti e monitorare tutto' },
        ],
      },
      {
        id: 'mealsPerDay',
        type: 'single',
        label: 'Quanti pasti preferisci fare?',
        options: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6+', label: '6+' },
        ],
      },
      { id: 'breakfastTime', type: 'text', label: 'A che ora fai normalmente colazione?', placeholder: '07:30' },
      { id: 'lunchTime', type: 'text', label: 'A che ora pranzi?', placeholder: '13:00' },
      { id: 'dinnerTime', type: 'text', label: 'A che ora ceni?', placeholder: '20:00' },
      {
        id: 'snacks',
        type: 'single',
        label: 'Fai spuntini?',
        options: [
          { value: 'no', label: 'No' },
          { value: 'morning', label: 'Mattina' },
          { value: 'afternoon', label: 'Pomeriggio' },
          { value: 'evening', label: 'Sera' },
          { value: 'multiple', label: 'Più di uno' },
        ],
      },
      {
        id: 'eatingOut',
        type: 'single',
        label: 'Mangi normalmente fuori casa?',
        options: [
          { value: 'rarely', label: 'Quasi mai' },
          { value: '1-2week', label: '1–2 volte/settimana' },
          { value: '3-5week', label: '3–5 volte/settimana' },
          { value: 'daily', label: 'Quasi tutti i giorni' },
        ],
      },
      {
        id: 'cookingTime',
        type: 'single',
        label: 'Quanto tempo hai mediamente per cucinare?',
        options: [
          { value: 'lt10', label: '<10 min' },
          { value: '10-20', label: '10–20 min' },
          { value: '20-30', label: '20–30 min' },
          { value: '30-60', label: '30–60 min' },
          { value: 'gt60', label: '>60 min' },
        ],
      },
      {
        id: 'groceryBudget',
        type: 'single',
        label: 'Quanto vuoi spendere per la spesa alimentare?',
        options: [
          { value: 'low', label: 'Basso' },
          { value: 'medium', label: 'Medio' },
          { value: 'high', label: 'Alto' },
          { value: 'noLimit', label: 'Nessun limite particolare' },
        ],
      },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferenze alimentari',
    questions: [
      {
        id: 'dietaryPattern',
        type: 'single',
        label: "Segui un'alimentazione particolare?",
        options: [
          { value: 'none', label: 'Nessuna' },
          { value: 'vegetarian', label: 'Vegetariana' },
          { value: 'vegan', label: 'Vegana' },
          { value: 'pescetarian', label: 'Pescetariana' },
          { value: 'mediterranean', label: 'Mediterranea' },
          { value: 'lowCarb', label: 'Low carb' },
          { value: 'other', label: 'Altro' },
        ],
      },
      { id: 'allergies', type: 'text', label: 'Hai allergie alimentari?', placeholder: 'No, oppure elenca quali', optional: true },
      { id: 'intolerances', type: 'text', label: 'Hai intolleranze o alimenti che digerisci male?', placeholder: 'No, oppure elenca quali', optional: true },
      { id: 'excludedFoods', type: 'longtext', label: 'Quali alimenti NON vuoi nella tua dieta?', optional: true },
      { id: 'includedFoods', type: 'longtext', label: 'Quali alimenti vuoi assolutamente includere?', optional: true },
      {
        id: 'preferredProteins',
        type: 'multi',
        label: 'Quali sono le tue fonti proteiche preferite?',
        options: [
          { value: 'chicken', label: 'Pollo' },
          { value: 'turkey', label: 'Tacchino' },
          { value: 'beef', label: 'Manzo' },
          { value: 'eggs', label: 'Uova' },
          { value: 'fish', label: 'Pesce' },
          { value: 'legumes', label: 'Legumi' },
          { value: 'dairy', label: 'Latticini' },
          { value: 'yogurt', label: 'Yogurt' },
          { value: 'proteinPowder', label: 'Proteine in polvere' },
          { value: 'tofu', label: 'Tofu/alternative vegetali' },
          { value: 'other', label: 'Altro' },
        ],
      },
      {
        id: 'preferredCarbs',
        type: 'multi',
        label: 'Quali carboidrati preferisci?',
        options: [
          { value: 'rice', label: 'Riso' },
          { value: 'pasta', label: 'Pasta' },
          { value: 'potatoes', label: 'Patate' },
          { value: 'bread', label: 'Pane' },
          { value: 'oats', label: 'Avena' },
          { value: 'cereals', label: 'Cereali' },
          { value: 'legumes', label: 'Legumi' },
          { value: 'fruit', label: 'Frutta' },
          { value: 'other', label: 'Altro' },
        ],
      },
      {
        id: 'preferredFats',
        type: 'multi',
        label: 'Quali grassi preferisci?',
        options: [
          { value: 'oliveOil', label: 'Olio EVO' },
          { value: 'nuts', label: 'Frutta secca' },
          { value: 'avocado', label: 'Avocado' },
          { value: 'eggs', label: 'Uova' },
          { value: 'fattyFish', label: 'Pesce grasso' },
          { value: 'butter', label: 'Burro' },
          { value: 'other', label: 'Altro' },
        ],
      },
      {
        id: 'hungerLevel',
        type: 'single',
        label: 'Quanto spesso hai fame durante la giornata?',
        options: [
          { value: 'rarely', label: 'Quasi mai' },
          { value: 'little', label: 'Poco' },
          { value: 'moderate', label: 'Moderatamente' },
          { value: 'much', label: 'Molto' },
          { value: 'constant', label: 'Quasi continuamente' },
        ],
      },
      {
        id: 'hungerTiming',
        type: 'multi',
        label: 'Quando senti più fame?',
        options: [
          { value: 'morning', label: 'Mattina' },
          { value: 'lunch', label: 'Pranzo' },
          { value: 'afternoon', label: 'Pomeriggio' },
          { value: 'evening', label: 'Sera' },
          { value: 'postWorkout', label: "Dopo l'allenamento" },
        ],
      },
      { id: 'cravings', type: 'scale', label: 'Hai spesso voglia di dolci/snack?', min: 1, max: 5 },
      {
        id: 'emotionalEating',
        type: 'single',
        label: 'Quanto ti capita di mangiare per fame emotiva/noia/stress?',
        options: [
          { value: 'never', label: 'Mai' },
          { value: 'rarely', label: 'Raramente' },
          { value: 'sometimes', label: 'A volte' },
          { value: 'often', label: 'Spesso' },
          { value: 'veryOften', label: 'Molto spesso' },
        ],
      },
      {
        id: 'cheatMeal',
        type: 'single',
        label: 'Quanto vuoi mantenere pasti liberi/cheat meal?',
        options: [
          { value: 'none', label: 'Nessuno' },
          { value: 'oneWeek', label: '1 a settimana' },
          { value: 'twoWeek', label: '2 a settimana' },
          { value: 'free', label: 'Voglio poter mangiare liberamente occasionalmente' },
        ],
      },
      {
        id: 'waterIntake',
        type: 'single',
        label: 'Quanta acqua bevi mediamente?',
        options: [
          { value: 'lt1', label: '<1 L' },
          { value: '1-1.5', label: '1–1,5 L' },
          { value: '1.5-2', label: '1,5–2 L' },
          { value: '2-3', label: '2–3 L' },
          { value: 'gt3', label: '>3 L' },
        ],
      },
      {
        id: 'coffeeIntake',
        type: 'single',
        label: 'Quanto caffè bevi?',
        options: [
          { value: '0', label: 'Nessuno' },
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4+', label: '4+' },
        ],
      },
      {
        id: 'alcoholIntake',
        type: 'single',
        label: 'Consumi alcol?',
        options: [
          { value: 'never', label: 'Mai' },
          { value: 'occasionally', label: 'Occasionalmente' },
          { value: '1-2week', label: '1–2 volte/settimana' },
          { value: '3+week', label: '3+ volte/settimana' },
        ],
      },
      {
        id: 'supplements',
        type: 'multi',
        label: 'Integratori utilizzati',
        options: [
          { value: 'protein', label: 'Proteine' },
          { value: 'creatine', label: 'Creatina' },
          { value: 'omega3', label: 'Omega-3' },
          { value: 'vitaminD', label: 'Vitamina D' },
          { value: 'multivitamin', label: 'Multivitaminico' },
          { value: 'magnesium', label: 'Magnesio' },
          { value: 'electrolytes', label: 'Elettroliti' },
          { value: 'preworkout', label: 'Caffeina/pre-workout' },
          { value: 'none', label: 'Nessuno' },
          { value: 'other', label: 'Altro' },
        ],
      },
    ],
  },
  {
    id: 'training',
    title: 'Allenamento',
    questions: [
      {
        id: 'currentlyTraining',
        type: 'single',
        label: 'Ti alleni attualmente?',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Sì' },
        ],
      },
      {
        id: 'trainingSince',
        type: 'single',
        label: 'Da quanto tempo ti alleni?',
        options: [
          { value: 'never', label: 'Mai' },
          { value: 'lt3m', label: '<3 mesi' },
          { value: '3-12m', label: '3–12 mesi' },
          { value: '1-3y', label: '1–3 anni' },
          { value: 'gt3y', label: '>3 anni' },
        ],
      },
      { id: 'activitiesPracticed', type: 'multi', label: 'Quali attività pratichi?', options: ACTIVITY_OPTIONS },
      {
        id: 'currentFrequency',
        type: 'single',
        label: 'Quante volte ti alleni attualmente?',
        options: [
          { value: '0', label: '0' },
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6+', label: '6+' },
          { value: 'variable', label: 'Variabile' },
        ],
      },
      {
        id: 'trainingStyle',
        type: 'single',
        label: 'Quale tipo di allenamento preferisci?',
        options: [
          { value: 'weights', label: 'Pesi' },
          { value: 'cardio', label: 'Cardio' },
          { value: 'hiit', label: 'HIIT' },
          { value: 'circuit', label: 'Circuit training' },
          { value: 'bodyweight', label: 'Corpo libero' },
          { value: 'sport', label: 'Sport' },
          { value: 'mix', label: 'Mix' },
        ],
      },
      { id: 'likedExercises', type: 'longtext', label: 'Quali esercizi/attività ti piacciono?', optional: true },
      { id: 'dislikedExercises', type: 'longtext', label: 'Quali esercizi/attività NON ti piacciono?', optional: true },
      { id: 'trainingIntensity', type: 'scale', label: "Quanto vuoi che l'allenamento sia impegnativo?", min: 1, max: 5 },
      {
        id: 'sessionStyle',
        type: 'single',
        label: 'Preferisci:',
        options: [
          { value: 'shortIntense', label: 'Allenamenti brevi e intensi' },
          { value: 'longModerate', label: 'Allenamenti più lunghi e moderati' },
          { value: 'mix', label: 'Un mix' },
        ],
      },
      { id: 'squatKg', type: 'number', label: 'Squat', unit: 'kg', optional: true },
      { id: 'squatReps', type: 'number', label: 'Squat — ripetizioni', unit: 'reps', optional: true },
      { id: 'benchKg', type: 'number', label: 'Panca', unit: 'kg', optional: true },
      { id: 'benchReps', type: 'number', label: 'Panca — ripetizioni', unit: 'reps', optional: true },
      { id: 'deadliftKg', type: 'number', label: 'Stacco', unit: 'kg', optional: true },
      { id: 'deadliftReps', type: 'number', label: 'Stacco — ripetizioni', unit: 'reps', optional: true },
      { id: 'pullupsReps', type: 'number', label: 'Trazioni', unit: 'reps', optional: true },
      { id: 'runDistanceKm', type: 'number', label: 'Corsa — distanza abituale', unit: 'km', optional: true },
      { id: 'runTime', type: 'text', label: 'Corsa — tempo medio', placeholder: 'es. 50 min', optional: true },
      { id: 'runFrequency', type: 'text', label: 'Corsa — frequenza settimanale', placeholder: 'es. 3 volte', optional: true },
      {
        id: 'focusArea',
        type: 'single',
        label: 'Quale aspetto vuoi migliorare maggiormente?',
        options: [
          { value: 'strength', label: 'Forza' },
          { value: 'muscle', label: 'Massa muscolare' },
          { value: 'endurance', label: 'Resistenza' },
          { value: 'speed', label: 'Velocità' },
          { value: 'mobility', label: 'Mobilità' },
          { value: 'technique', label: 'Tecnica' },
          { value: 'sportPerformance', label: 'Performance sportiva' },
          { value: 'aesthetics', label: 'Estetica' },
        ],
      },
    ],
  },
  {
    id: 'availability',
    title: 'Disponibilità',
    questions: [
      {
        id: 'availableDays',
        type: 'single',
        label: 'Quanti giorni alla settimana puoi allenarti realisticamente?',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6+', label: '6+' },
          { value: 'variable', label: 'Variabile' },
        ],
      },
      {
        id: 'sessionDuration',
        type: 'single',
        label: 'Quanto tempo hai per ogni allenamento?',
        options: [
          { value: 'lt30', label: '<30 min' },
          { value: '30-45', label: '30–45 min' },
          { value: '45-60', label: '45–60 min' },
          { value: '60-90', label: '60–90 min' },
          { value: 'gt90', label: '>90 min' },
        ],
      },
      {
        id: 'trainingLocation',
        type: 'single',
        label: 'Dove ti alleni principalmente?',
        options: [
          { value: 'gym', label: 'Palestra' },
          { value: 'home', label: 'Casa' },
          { value: 'outdoor', label: "All'aperto" },
          { value: 'mixed', label: 'Misto' },
        ],
      },
      {
        id: 'equipment',
        type: 'multi',
        label: 'Quale attrezzatura hai?',
        options: [
          { value: 'none', label: 'Nessuna' },
          { value: 'dumbbells', label: 'Manubri' },
          { value: 'barbell', label: 'Bilanciere' },
          { value: 'rack', label: 'Rack' },
          { value: 'bench', label: 'Panca' },
          { value: 'machines', label: 'Macchine' },
          { value: 'cables', label: 'Cavi' },
          { value: 'kettlebell', label: 'Kettlebell' },
          { value: 'bands', label: 'Elastici' },
          { value: 'cardioMachine', label: 'Cardio machine' },
          { value: 'other', label: 'Altro' },
        ],
      },
    ],
  },
  {
    id: 'limitations',
    title: 'Limitazioni fisiche',
    banner:
      "Se segnali dolore, un infortunio o una condizione medica rilevante, evitiamo di generare esercizi potenzialmente rischiosi e ti consigliamo di confrontarti con un professionista sanitario.",
    questions: [
      {
        id: 'hasPain',
        type: 'single',
        label: 'Hai attualmente dolori o limitazioni che possono influenzare l’allenamento?',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Sì' },
        ],
      },
      { id: 'painDetails', type: 'longtext', label: 'Se sì, descrivi', optional: true },
      {
        id: 'cannotDoExercises',
        type: 'single',
        label: 'Ci sono esercizi che non puoi eseguire?',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Sì' },
        ],
      },
      { id: 'cannotDoDetails', type: 'longtext', label: 'Se sì, quali', optional: true },
      {
        id: 'recentInjuries',
        type: 'single',
        label: 'Hai avuto infortuni recenti che dovremmo considerare?',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes', label: 'Sì' },
        ],
      },
      { id: 'recentInjuriesDetails', type: 'longtext', label: 'Se sì, quali', optional: true },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoraggio',
    questions: [
      {
        id: 'planFlexibility',
        type: 'single',
        label: 'Quanto vuoi che il piano sia flessibile?',
        options: [
          { value: 'exact', label: 'Voglio seguire esattamente il piano' },
          { value: 'swapFood', label: 'Voglio poter sostituire gli alimenti' },
          { value: 'swapWorkouts', label: 'Voglio poter sostituire gli allenamenti' },
          { value: 'fullFlexibility', label: 'Voglio completa flessibilità' },
        ],
      },
      {
        id: 'planDelivery',
        type: 'single',
        label: 'Preferisci ricevere:',
        options: [
          { value: 'exactMenu', label: 'Un menu preciso giorno per giorno' },
          { value: 'structureWithAlternatives', label: 'Una struttura alimentare con alternative' },
          { value: 'targetsOnly', label: 'Obiettivi calorici e macro da gestire autonomamente' },
          { value: 'mix', label: 'Un mix' },
        ],
      },
      {
        id: 'autoAdapt',
        type: 'single',
        label: "Vuoi che l'app adatti automaticamente il piano in base ai tuoi progressi?",
        options: [
          { value: 'yes', label: 'Sì' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'reviewFrequency',
        type: 'single',
        label: 'Ogni quanto vuoi essere valutato?',
        options: [
          { value: 'daily', label: 'Ogni giorno' },
          { value: 'weekly', label: 'Ogni settimana' },
          { value: 'biweekly', label: 'Ogni 2 settimane' },
          { value: 'monthly', label: 'Ogni mese' },
        ],
      },
      {
        id: 'weighInFrequency',
        type: 'single',
        label: 'Sei disposto a pesarti regolarmente?',
        options: [
          { value: 'daily', label: 'Ogni giorno' },
          { value: '2-3week', label: '2–3 volte/settimana' },
          { value: 'weekly', label: '1 volta/settimana' },
          { value: 'lessOften', label: 'Meno frequentemente' },
        ],
      },
      {
        id: 'measureWaist',
        type: 'single',
        label: 'Sei disposto a misurare il girovita?',
        options: [
          { value: 'yes', label: 'Sì' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'uploadPhotos',
        type: 'single',
        label: 'Vuoi caricare foto dei progressi?',
        options: [
          { value: 'yes', label: 'Sì' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'wearables',
        type: 'multi',
        label: 'Vuoi collegare dispositivi/app per importare automaticamente i dati?',
        options: [
          { value: 'appleHealth', label: 'Apple Health' },
          { value: 'googleHealthConnect', label: 'Google Health Connect' },
          { value: 'garmin', label: 'Garmin' },
          { value: 'fitbit', label: 'Fitbit' },
          { value: 'oura', label: 'Oura' },
          { value: 'other', label: 'Altri' },
          { value: 'none', label: 'Nessuno' },
        ],
      },
      {
        id: 'mainObstacle',
        type: 'single',
        label: 'Qual è la difficoltà principale che incontri nel raggiungere i tuoi obiettivi?',
        options: [
          { value: 'consistency', label: 'Costanza' },
          { value: 'hunger', label: 'Fame' },
          { value: 'timeShortage', label: 'Mancanza di tempo' },
          { value: 'motivation', label: 'Motivazione' },
          { value: 'organization', label: 'Organizzazione' },
          { value: 'eatingOut', label: 'Alimentazione fuori casa' },
          { value: 'training', label: 'Allenamento' },
          { value: 'recoverySleep', label: 'Recupero/sonno' },
          { value: 'dontKnow', label: 'Non so cosa fare' },
          { value: 'other', label: 'Altro' },
        ],
      },
      { id: 'motivationLevel', type: 'scale', label: 'Quanto sei motivato a raggiungere il tuo obiettivo?', min: 1, max: 10 },
      { id: 'expectations', type: 'longtext', label: "Cosa ti aspetti dall'app?", optional: true },
    ],
  },
];
