import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { searchFood, type FoodItem } from '@/lib/mock/food-database';
import { useNutritionStore, type MealSlot } from '@/store/nutrition-store';

export type FoodSearchModalProps = {
  visible: boolean;
  slot: MealSlot | null;
  date: string;
  onClose: () => void;
};

export function FoodSearchModal({ visible, slot, date, onClose }: FoodSearchModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const addEntry = useNutritionStore((s) => s.addEntry);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState('100');

  const results = useMemo(() => searchFood(query).slice(0, 30), [query]);

  const reset = () => {
    setQuery('');
    setSelected(null);
    setGrams('100');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePick = (food: FoodItem) => {
    setSelected(food);
    setGrams(String(food.defaultPortionG));
  };

  const handleAdd = () => {
    if (!slot || !selected) return;
    const gramsNum = parseFloat(grams.replace(',', '.'));
    if (!Number.isFinite(gramsNum) || gramsNum <= 0) return;
    addEntry(slot, selected.id, gramsNum, date);
    setSelected(null);
    setQuery('');
  };

  const ratio = selected ? parseFloat(grams.replace(',', '.')) / 100 || 0 : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <GlassSurface level="overlay" radius={Radius.xlarge} style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.four }]}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Aggiungi alimento</ThemedText>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Icon name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          <View style={[styles.searchRow, { backgroundColor: theme.backgroundElement }]}>
            <Icon name="search" size={18} color={theme.textTertiary} />
            <TextInput
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setSelected(null);
              }}
              placeholder="Cerca un alimento…"
              placeholderTextColor={theme.textTertiary}
              style={[styles.searchInput, { color: theme.text, backgroundColor: 'transparent' }]}
            />
          </View>

          {selected ? (
            <View style={styles.selectedCard}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="smallBold">{selected.name}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {Math.round(selected.kcal100 * ratio)} kcal · P {Math.round(selected.protein100 * ratio)}g · C{' '}
                  {Math.round(selected.carbs100 * ratio)}g · G {Math.round(selected.fats100 * ratio)}g
                </ThemedText>
              </View>
              <View style={styles.gramsRow}>
                <TextInput
                  value={grams}
                  onChangeText={setGrams}
                  keyboardType="decimal-pad"
                  style={[styles.gramsInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                />
                <ThemedText type="caption" themeColor="textSecondary">
                  g
                </ThemedText>
              </View>
              <PrimaryButton label="Aggiungi" icon="plus" onPress={handleAdd} />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable onPress={() => handlePick(item)} style={styles.resultRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="small">{item.name}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {item.kcal100} kcal /100g · P {item.protein100}g · C {item.carbs100}g · G {item.fats100}g
                    </ThemedText>
                  </View>
                  <Icon name="addCircle" size={22} color={theme.accent} />
                </Pressable>
              )}
              ListEmptyComponent={
                <ThemedText type="caption" themeColor="textTertiary" style={{ textAlign: 'center', marginTop: Spacing.four }}>
                  Nessun alimento trovato
                </ThemedText>
              }
            />
          )}
        </GlassSurface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '80%',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  list: {
    flexGrow: 0,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  selectedCard: {
    gap: Spacing.three,
  },
  gramsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  gramsInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    fontSize: 15,
  },
});
