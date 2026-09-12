import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { FoodSearchModal } from '@/components/nutrition/food-search-modal';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysAgoISO } from '@/lib/mock/dates';
import { findFood } from '@/lib/mock/food-database';
import { currentUser } from '@/lib/mock/user';
import {
  entriesForSlot,
  macrosForEntry,
  MEAL_SLOTS,
  sumMacros,
  targetsForSlot,
  useNutritionStore,
  type MealSlot,
} from '@/store/nutrition-store';

export default function NutritionScreen() {
  const theme = useTheme();
  const today = daysAgoISO(0);
  const entries = useNutritionStore((s) => s.entries);
  const removeEntry = useNutritionStore((s) => s.removeEntry);
  const [activeSlot, setActiveSlot] = useState<MealSlot | null>(null);

  const todaysEntries = entries.filter((e) => e.date === today);
  const totals = sumMacros(todaysEntries);
  const calorieProgress = totals.kcal / currentUser.dailyCalorieTarget;

  const macroRings: { key: 'protein' | 'carbs' | 'fats'; label: string; icon: 'protein' | 'carbs' | 'fats'; color: string; target: number }[] = [
    { key: 'protein', label: 'Proteine', icon: 'protein', color: theme.accent, target: currentUser.macroTargetsG.protein },
    { key: 'carbs', label: 'Carbo', icon: 'carbs', color: theme.success, target: currentUser.macroTargetsG.carbs },
    { key: 'fats', label: 'Grassi', icon: 'fats', color: theme.warning, target: currentUser.macroTargetsG.fats },
  ];

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Bilancio energetico" title="Nutrizione" />

      <GlassSurface level="card" radius={Radius.large} style={styles.heroCard}>
        <ProgressRing size={116} strokeWidth={11} progress={calorieProgress} color={theme.accent} trackColor={theme.backgroundElement}>
          <ThemedText type="title">{Math.round(totals.kcal)}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            / {currentUser.dailyCalorieTarget} kcal
          </ThemedText>
        </ProgressRing>
        <View style={styles.macroRingsRow}>
          {macroRings.map((macro) => {
            const value = totals[macro.key];
            const progress = Math.min(value / macro.target, 1);
            return (
              <View key={macro.key} style={styles.macroRingCol}>
                <ProgressRing size={56} strokeWidth={6} progress={progress} color={macro.color} trackColor={theme.backgroundElement}>
                  <Icon name={macro.icon} size={16} color={macro.color} />
                </ProgressRing>
                <ThemedText type="caption" style={{ marginTop: 4 }}>
                  {Math.round(value)}/{macro.target}g
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {macro.label}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </GlassSurface>

      <View>
        <SectionHeader title="I tuoi pasti" />
        <View style={{ gap: Spacing.three }}>
          {MEAL_SLOTS.map((meta) => {
            const slotEntries = entriesForSlot(entries, meta.id, today);
            const slotTotals = sumMacros(slotEntries);
            const target = targetsForSlot(meta.id);
            const progress = target.kcal ? Math.min(slotTotals.kcal / target.kcal, 1) : 0;

            return (
              <GlassSurface key={meta.id} level="card" radius={Radius.large} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="smallBold">{meta.label}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {meta.time} · {Math.round(slotTotals.kcal)}/{Math.round(target.kcal)} kcal
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => setActiveSlot(meta.id)} style={[styles.addButton, { backgroundColor: theme.accentSoft }]}>
                    <Icon name="plus" size={18} color={theme.accent} />
                  </Pressable>
                </View>

                <View style={[styles.macroTrack, { backgroundColor: theme.backgroundElement }]}>
                  <View style={[styles.macroFill, { width: `${progress * 100}%`, backgroundColor: theme.accent }]} />
                </View>

                {slotEntries.length > 0 ? (
                  <View style={{ gap: Spacing.one }}>
                    {slotEntries.map((entry) => {
                      const food = findFood(entry.foodId);
                      const m = macrosForEntry(entry);
                      return (
                        <View key={entry.id} style={styles.foodRow}>
                          <ThemedText type="caption" style={{ flex: 1 }}>
                            {food?.name ?? entry.foodId} · {entry.grams}g
                          </ThemedText>
                          <ThemedText type="caption" themeColor="textSecondary">
                            {Math.round(m.kcal)} kcal
                          </ThemedText>
                          <Pressable onPress={() => removeEntry(entry.id)} hitSlop={8}>
                            <Icon name="close" size={14} color={theme.textTertiary} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <ThemedText type="caption" themeColor="textTertiary">
                    Nessun alimento registrato
                  </ThemedText>
                )}
              </GlassSurface>
            );
          })}
        </View>
      </View>

      <FoodSearchModal visible={activeSlot != null} slot={activeSlot} date={today} onClose={() => setActiveSlot(null)} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.four,
  },
  macroRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  macroRingCol: {
    alignItems: 'center',
  },
  mealCard: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
