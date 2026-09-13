/**
 * Maps the fixed-option questionnaire answers (preferredProteins/Carbs/Fats,
 * dietaryPattern — see lib/questionnaire/schema.ts) onto concrete
 * lib/mock/food-database ids, so the diet planner can build a believable
 * sample day instead of picking foods at random.
 */

const PROTEIN_SOURCES: Record<string, string[]> = {
  chicken: ['chicken-breast'],
  turkey: ['turkey-breast'],
  beef: ['beef-lean'],
  eggs: ['eggs'],
  fish: ['salmon', 'tuna-canned'],
  legumes: ['chickpeas', 'lentils', 'black-beans'],
  dairy: ['cottage-cheese', 'ricotta'],
  yogurt: ['greek-yogurt'],
  proteinPowder: ['whey-protein'],
  tofu: ['tofu'],
};

const CARB_SOURCES: Record<string, string[]> = {
  rice: ['rice-basmati'],
  pasta: ['pasta'],
  potatoes: ['potato', 'sweet-potato'],
  bread: ['bread-wholegrain'],
  oats: ['oats'],
  cereals: ['quinoa', 'couscous'],
  legumes: ['chickpeas', 'lentils'],
  fruit: ['banana', 'apple', 'orange'],
};

const FAT_SOURCES: Record<string, string[]> = {
  oliveOil: ['olive-oil'],
  nuts: ['almonds', 'walnuts'],
  avocado: ['avocado'],
  eggs: ['eggs'],
  fattyFish: ['salmon'],
  butter: ['olive-oil'],
};

const DEFAULT_PROTEIN_POOL = ['chicken-breast', 'turkey-breast', 'eggs', 'greek-yogurt', 'tuna-canned', 'tofu'];
const DEFAULT_CARB_POOL = ['rice-basmati', 'oats', 'potato', 'pasta', 'sweet-potato'];
const DEFAULT_FAT_POOL = ['olive-oil', 'almonds', 'avocado'];
const VEGETABLE_POOL = ['broccoli', 'spinach', 'zucchini', 'mixed-salad', 'green-beans', 'carrot'];
const FRUIT_POOL = ['banana', 'apple', 'orange', 'blueberries', 'kiwi'];

const MEAT_IDS = new Set(['chicken-breast', 'turkey-breast', 'beef-lean', 'prosciutto-crudo', 'bresaola']);
const FISH_IDS = new Set(['salmon', 'tuna-canned']);
const ANIMAL_DERIVED_IDS = new Set([
  'eggs',
  'egg-whites',
  'greek-yogurt',
  'cottage-cheese',
  'mozzarella',
  'parmesan',
  'ricotta',
  'skyr',
  'milk-semi',
  'honey',
  'whey-protein',
]);

function poolFromAnswer(answer: unknown, sourceMap: Record<string, string[]>, fallback: string[]): string[] {
  const values = Array.isArray(answer) ? (answer as string[]) : [];
  const ids = values.flatMap((v) => sourceMap[v] ?? []);
  return ids.length > 0 ? [...new Set(ids)] : fallback;
}

/** Removes foods incompatible with a vegetarian/vegan/pescetarian pattern. */
function filterByDietaryPattern(ids: string[], pattern: unknown): string[] {
  let excluded: Set<string> | null = null;
  if (pattern === 'vegan') excluded = new Set([...MEAT_IDS, ...FISH_IDS, ...ANIMAL_DERIVED_IDS]);
  else if (pattern === 'vegetarian') excluded = new Set([...MEAT_IDS, ...FISH_IDS]);
  else if (pattern === 'pescetarian') excluded = new Set(MEAT_IDS);
  if (!excluded) return ids;
  const filtered = ids.filter((id) => !excluded!.has(id));
  return filtered.length > 0 ? filtered : ids.filter((id) => !MEAT_IDS.has(id) && !FISH_IDS.has(id));
}

export function buildFoodPools(answers: Record<string, unknown>) {
  const pattern = answers.dietaryPattern;
  const protein = filterByDietaryPattern(poolFromAnswer(answers.preferredProteins, PROTEIN_SOURCES, DEFAULT_PROTEIN_POOL), pattern);
  const carbs = poolFromAnswer(answers.preferredCarbs, CARB_SOURCES, DEFAULT_CARB_POOL);
  const fats = filterByDietaryPattern(poolFromAnswer(answers.preferredFats, FAT_SOURCES, DEFAULT_FAT_POOL), pattern);

  return {
    protein: protein.length > 0 ? protein : filterByDietaryPattern(DEFAULT_PROTEIN_POOL, pattern),
    carbs,
    fats,
    vegetables: VEGETABLE_POOL,
    fruit: FRUIT_POOL,
  };
}

export function pick<T>(pool: T[], index: number): T {
  return pool[index % pool.length];
}
