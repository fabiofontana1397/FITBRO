import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { findFood, searchFood, type FoodItem } from '@/lib/mock/food-database';
import { useNutritionStore, type MealSlot } from '@/store/nutrition-store';

export type FoodSearchModalProps = {
  visible: boolean;
  slot: MealSlot | null;
  date: string;
  /** When set, the modal opens pre-filled with this logged entry (food +
   * grams) so the user edits it in place instead of adding a new one. */
  editEntry?: { id: string; foodId: string; grams: number } | null;
  onClose: () => void;
};

/** Wraps the actual form so it can be given a `key` that changes every time
 * the modal opens (see below) — remounting it is what resets query/selected
 * /grams back to defaults (or to the entry being edited) on each open,
 * without syncing that reset through an effect. */
export function FoodSearchModal({ visible, slot, date, editEntry, onClose }: FoodSearchModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <FoodSearchModalForm
        key={visible ? (editEntry?.id ?? 'add') : 'closed'}
        slot={slot}
        date={date}
        editEntry={editEntry}
        onClose={onClose}
      />
    </Modal>
  );
}

function FoodSearchModalForm({ slot, date, editEntry, onClose }: Omit<FoodSearchModalProps, 'visible'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const addEntry = useNutritionStore((s) => s.addEntry);
  const updateEntry = useNutritionStore((s) => s.updateEntry);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(() => (editEntry ? (findFood(editEntry.foodId) ?? null) : null));
  const [grams, setGrams] = useState(() => (editEntry ? String(editEntry.grams) : '100'));

  const results = useMemo(() => searchFood(query).slice(0, 30), [query]);

  const handleClose = () => {
    onClose();
  };

  const handlePick = (food: FoodItem) => {
    setSelected(food);
    setGrams(String(food.defaultPortionG));
  };

  const handleSave = () => {
    if (!slot || !selected) return;
    const gramsNum = parseFloat(grams.replace(',', '.'));
    if (!Number.isFinite(gramsNum) || gramsNum <= 0) return;
    if (editEntry) {
      updateEntry(editEntry.id, selected.id, gramsNum);
    } else {
      addEntry(slot, selected.id, gramsNum, date);
    }
    handleClose();
  };

  const ratio = selected ? parseFloat(grams.replace(',', '.')) / 100 || 0 : 0;

  return (
    <View style={styles.backdrop}>
      <GlassSurface level="overlay" radius={Radius.xlarge} style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={styles.header}>
          <ThemedText type="subtitle">{editEntry ? 'Modifica alimento' : 'Aggiungi alimento'}</ThemedText>
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
            <PrimaryButton label={editEntry ? 'Salva' : 'Aggiungi'} icon={editEntry ? 'check' : 'plus'} onPress={handleSave} />
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
