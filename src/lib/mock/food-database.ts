export type FoodItem = {
  id: string;
  name: string;
  category: 'proteine' | 'carboidrati' | 'grassi' | 'verdura' | 'frutta' | 'latticini' | 'legumi' | 'altro';
  kcal100: number;
  protein100: number;
  carbs100: number;
  fats100: number;
  defaultPortionG: number;
};

export const FOOD_DATABASE: FoodItem[] = [
  // Proteine
  { id: 'chicken-breast', name: 'Petto di pollo', category: 'proteine', kcal100: 165, protein100: 31, carbs100: 0, fats100: 3.6, defaultPortionG: 150 },
  { id: 'turkey-breast', name: 'Petto di tacchino', category: 'proteine', kcal100: 135, protein100: 29, carbs100: 0, fats100: 1.5, defaultPortionG: 150 },
  { id: 'beef-lean', name: 'Manzo magro', category: 'proteine', kcal100: 187, protein100: 27, carbs100: 0, fats100: 8, defaultPortionG: 150 },
  { id: 'salmon', name: 'Salmone', category: 'proteine', kcal100: 208, protein100: 20, carbs100: 0, fats100: 13, defaultPortionG: 150 },
  { id: 'tuna-canned', name: 'Tonno al naturale', category: 'proteine', kcal100: 116, protein100: 26, carbs100: 0, fats100: 1, defaultPortionG: 80 },
  { id: 'eggs', name: 'Uova intere', category: 'proteine', kcal100: 155, protein100: 13, carbs100: 1.1, fats100: 11, defaultPortionG: 100 },
  { id: 'egg-whites', name: 'Albume d’uovo', category: 'proteine', kcal100: 52, protein100: 11, carbs100: 0.7, fats100: 0.2, defaultPortionG: 100 },
  { id: 'greek-yogurt', name: 'Yogurt greco', category: 'proteine', kcal100: 97, protein100: 9, carbs100: 3.6, fats100: 5, defaultPortionG: 170 },
  { id: 'whey-protein', name: 'Proteine whey (polvere)', category: 'proteine', kcal100: 380, protein100: 75, carbs100: 8, fats100: 6, defaultPortionG: 30 },
  { id: 'tofu', name: 'Tofu', category: 'proteine', kcal100: 76, protein100: 8, carbs100: 1.9, fats100: 4.8, defaultPortionG: 100 },
  { id: 'cottage-cheese', name: 'Fiocchi di latte', category: 'proteine', kcal100: 98, protein100: 11, carbs100: 3.4, fats100: 4.3, defaultPortionG: 150 },
  { id: 'prosciutto-crudo', name: 'Prosciutto crudo', category: 'proteine', kcal100: 268, protein100: 25, carbs100: 0.3, fats100: 18, defaultPortionG: 50 },
  { id: 'bresaola', name: 'Bresaola', category: 'proteine', kcal100: 151, protein100: 32, carbs100: 0.5, fats100: 2.6, defaultPortionG: 80 },

  // Carboidrati
  { id: 'rice-basmati', name: 'Riso basmati (cotto)', category: 'carboidrati', kcal100: 121, protein100: 2.7, carbs100: 25, fats100: 0.4, defaultPortionG: 200 },
  { id: 'pasta', name: 'Pasta (cotta)', category: 'carboidrati', kcal100: 158, protein100: 5.8, carbs100: 31, fats100: 0.9, defaultPortionG: 200 },
  { id: 'oats', name: 'Fiocchi d’avena', category: 'carboidrati', kcal100: 389, protein100: 17, carbs100: 66, fats100: 7, defaultPortionG: 60 },
  { id: 'bread-wholegrain', name: 'Pane integrale', category: 'carboidrati', kcal100: 247, protein100: 13, carbs100: 41, fats100: 3.4, defaultPortionG: 60 },
  { id: 'potato', name: 'Patate (bollite)', category: 'carboidrati', kcal100: 87, protein100: 1.9, carbs100: 20, fats100: 0.1, defaultPortionG: 250 },
  { id: 'sweet-potato', name: 'Patate dolci', category: 'carboidrati', kcal100: 86, protein100: 1.6, carbs100: 20, fats100: 0.1, defaultPortionG: 250 },
  { id: 'quinoa', name: 'Quinoa (cotta)', category: 'carboidrati', kcal100: 120, protein100: 4.4, carbs100: 21, fats100: 1.9, defaultPortionG: 180 },
  { id: 'rice-cakes', name: 'Gallette di riso', category: 'carboidrati', kcal100: 387, protein100: 8.2, carbs100: 81, fats100: 2.8, defaultPortionG: 20 },
  { id: 'puffed-rice', name: 'Riso soffiato', category: 'carboidrati', kcal100: 380, protein100: 7, carbs100: 84, fats100: 1, defaultPortionG: 40 },
  { id: 'couscous', name: 'Couscous (cotto)', category: 'carboidrati', kcal100: 112, protein100: 3.8, carbs100: 23, fats100: 0.2, defaultPortionG: 180 },
  { id: 'bread-white', name: 'Pane bianco', category: 'carboidrati', kcal100: 265, protein100: 9, carbs100: 49, fats100: 3.2, defaultPortionG: 60 },
  { id: 'pizza-margherita', name: 'Pizza margherita', category: 'carboidrati', kcal100: 266, protein100: 11, carbs100: 33, fats100: 10, defaultPortionG: 250 },
  { id: 'focaccia', name: 'Focaccia', category: 'carboidrati', kcal100: 290, protein100: 7, carbs100: 45, fats100: 9, defaultPortionG: 100 },

  // Grassi
  { id: 'olive-oil', name: 'Olio EVO', category: 'grassi', kcal100: 884, protein100: 0, carbs100: 0, fats100: 100, defaultPortionG: 10 },
  { id: 'almonds', name: 'Mandorle', category: 'grassi', kcal100: 579, protein100: 21, carbs100: 22, fats100: 50, defaultPortionG: 30 },
  { id: 'walnuts', name: 'Noci', category: 'grassi', kcal100: 654, protein100: 15, carbs100: 14, fats100: 65, defaultPortionG: 30 },
  { id: 'peanut-butter', name: 'Burro di arachidi', category: 'grassi', kcal100: 588, protein100: 25, carbs100: 20, fats100: 50, defaultPortionG: 20 },
  { id: 'avocado', name: 'Avocado', category: 'grassi', kcal100: 160, protein100: 2, carbs100: 8.5, fats100: 15, defaultPortionG: 100 },

  // Verdura
  { id: 'broccoli', name: 'Broccoli', category: 'verdura', kcal100: 34, protein100: 2.8, carbs100: 7, fats100: 0.4, defaultPortionG: 200 },
  { id: 'spinach', name: 'Spinaci', category: 'verdura', kcal100: 23, protein100: 2.9, carbs100: 3.6, fats100: 0.4, defaultPortionG: 150 },
  { id: 'tomato', name: 'Pomodoro', category: 'verdura', kcal100: 18, protein100: 0.9, carbs100: 3.9, fats100: 0.2, defaultPortionG: 150 },
  { id: 'lettuce', name: 'Lattuga', category: 'verdura', kcal100: 15, protein100: 1.4, carbs100: 2.9, fats100: 0.2, defaultPortionG: 100 },
  { id: 'zucchini', name: 'Zucchine', category: 'verdura', kcal100: 17, protein100: 1.2, carbs100: 3.1, fats100: 0.3, defaultPortionG: 200 },
  { id: 'carrot', name: 'Carote', category: 'verdura', kcal100: 41, protein100: 0.9, carbs100: 10, fats100: 0.2, defaultPortionG: 100 },
  { id: 'green-beans', name: 'Fagiolini', category: 'verdura', kcal100: 31, protein100: 1.8, carbs100: 7, fats100: 0.1, defaultPortionG: 150 },
  { id: 'mixed-salad', name: 'Insalata mista', category: 'verdura', kcal100: 20, protein100: 1.5, carbs100: 3.5, fats100: 0.3, defaultPortionG: 100 },

  // Frutta
  { id: 'banana', name: 'Banana', category: 'frutta', kcal100: 89, protein100: 1.1, carbs100: 23, fats100: 0.3, defaultPortionG: 120 },
  { id: 'apple', name: 'Mela', category: 'frutta', kcal100: 52, protein100: 0.3, carbs100: 14, fats100: 0.2, defaultPortionG: 150 },
  { id: 'orange', name: 'Arancia', category: 'frutta', kcal100: 47, protein100: 0.9, carbs100: 12, fats100: 0.1, defaultPortionG: 150 },
  { id: 'blueberries', name: 'Mirtilli', category: 'frutta', kcal100: 57, protein100: 0.7, carbs100: 14, fats100: 0.3, defaultPortionG: 100 },
  { id: 'strawberries', name: 'Fragole', category: 'frutta', kcal100: 32, protein100: 0.7, carbs100: 7.7, fats100: 0.3, defaultPortionG: 150 },
  { id: 'kiwi', name: 'Kiwi', category: 'frutta', kcal100: 61, protein100: 1.1, carbs100: 15, fats100: 0.5, defaultPortionG: 100 },
  { id: 'pineapple', name: 'Ananas', category: 'frutta', kcal100: 50, protein100: 0.5, carbs100: 13, fats100: 0.1, defaultPortionG: 150 },
  { id: 'grapes', name: 'Uva', category: 'frutta', kcal100: 69, protein100: 0.7, carbs100: 18, fats100: 0.2, defaultPortionG: 100 },

  // Latticini
  { id: 'milk-semi', name: 'Latte parzialmente scremato', category: 'latticini', kcal100: 46, protein100: 3.3, carbs100: 4.9, fats100: 1.6, defaultPortionG: 200 },
  { id: 'mozzarella', name: 'Mozzarella', category: 'latticini', kcal100: 253, protein100: 18, carbs100: 2.2, fats100: 19, defaultPortionG: 100 },
  { id: 'parmesan', name: 'Parmigiano Reggiano', category: 'latticini', kcal100: 392, protein100: 33, carbs100: 0, fats100: 28, defaultPortionG: 20 },
  { id: 'ricotta', name: 'Ricotta', category: 'latticini', kcal100: 146, protein100: 8.8, carbs100: 3, fats100: 11, defaultPortionG: 100 },
  { id: 'skyr', name: 'Skyr', category: 'latticini', kcal100: 63, protein100: 11, carbs100: 4, fats100: 0.2, defaultPortionG: 170 },

  // Legumi
  { id: 'chickpeas', name: 'Ceci (cotti)', category: 'legumi', kcal100: 164, protein100: 8.9, carbs100: 27, fats100: 2.6, defaultPortionG: 150 },
  { id: 'lentils', name: 'Lenticchie (cotte)', category: 'legumi', kcal100: 116, protein100: 9, carbs100: 20, fats100: 0.4, defaultPortionG: 150 },
  { id: 'black-beans', name: 'Fagioli neri (cotti)', category: 'legumi', kcal100: 132, protein100: 8.9, carbs100: 24, fats100: 0.5, defaultPortionG: 150 },

  // Altro
  { id: 'honey', name: 'Miele', category: 'altro', kcal100: 304, protein100: 0.3, carbs100: 82, fats100: 0, defaultPortionG: 20 },
  { id: 'jam', name: 'Marmellata', category: 'altro', kcal100: 250, protein100: 0.4, carbs100: 61, fats100: 0.1, defaultPortionG: 20 },
  { id: 'dark-chocolate', name: 'Cioccolato fondente 70%', category: 'altro', kcal100: 598, protein100: 7.8, carbs100: 46, fats100: 43, defaultPortionG: 20 },
  { id: 'protein-bar', name: 'Barretta proteica', category: 'altro', kcal100: 375, protein100: 30, carbs100: 40, fats100: 12, defaultPortionG: 50 },
];

export function findFood(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find((f) => f.id === id);
}

export function searchFood(query: string): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOOD_DATABASE;
  return FOOD_DATABASE.filter((f) => f.name.toLowerCase().includes(q));
}
