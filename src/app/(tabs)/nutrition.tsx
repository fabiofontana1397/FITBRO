import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { GlassSurface } from '@/components/glass/glass-surface';
import { DayNavigator } from '@/components/nutrition/day-navigator';
import { FoodSearchModal } from '@/components/nutrition/food-search-modal';
import { LoggingStreakBanner } from '@/components/nutrition/logging-streak-banner';
import { NutritionWeekStrip } from '@/components/nutrition/nutrition-week-strip';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { TimingSlow } from '@/constants/motion';
import { useTheme } from '@/hooks/use-theme';
import { addDaysISO, currentWeekDates, daysAgoISO } from '@/lib/mock/dates';
import { findFood } from '@/lib/mock/food-database';
import {
  entriesForSlot,
  loggingStreakInfo,
  macrosForEntry,
  MEAL_SLOTS,
  sumMacros,
  targetsForSlot,
  useNutritionStore,
  type MealSlot,
} from '@/store/nutrition-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePlanStore } from '@/store/plan-store';
import { useUserStore } from '@/store/user-store';

export default function NutritionScreen() {
  const theme = useTheme();
  const currentUser = useUserStore();
  const entries = useNutritionStore((s) => s.entries);
  const removeEntry = useNutritionStore((s) => s.removeEntry);
  const dietPlan = usePlanStore((s) => s.dietPlan);
  const generatePlans = usePlanStore((s) => s.generatePlans);
  const onboardingAnswers = useOnboardingStore((s) => s.answers);
  const [activeSlot, setActiveSlot] = useState<MealSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState(daysAgoISO(0));

  useEffect(() => {
    if (dietPlan || onboardingAnswers.mode === 'training') return;
    generatePlans(onboardingAnswers, {
      dailyCalorieTarget: currentUser.dailyCalorieTarget,
      macroTargetsG: currentUser.macroTargetsG,
    });
    // Only needs to run once per missing-plan case, not on every keystroke of onboardingAnswers/currentUser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietPlan]);

  const weekDates = useMemo(() => currentWeekDates(new Date(selectedDate)), [selectedDate]);
  const loggedDates = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
  const streakInfo = useMemo(() => loggingStreakInfo(entries), [entries]);

  const dayEntries = entries.filter((e) => e.date === selectedDate);
  const totals = sumMacros(dayEntries);
  const calorieProgress = totals.kcal / currentUser.dailyCalorieTarget;

  const heroEntrance = useSharedValue(0);
  useEffect(() => {
    heroEntrance.value = 0;
    heroEntrance.value = withTiming(1, TimingSlow);
  }, [selectedDate, heroEntrance]);
  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroEntrance.value,
    transform: [{ translateY: (1 - heroEntrance.value) * 14 }, { scale: 0.97 + heroEntrance.value * 0.03 }],
  }));

  const macroRings: { key: 'protein' | 'carbs' | 'fats'; label: string; icon: 'protein' | 'carbs' | 'fats'; color: string; target: number }[] = [
    { key: 'protein', label: 'Proteine', icon: 'protein', color: theme.accent, target: currentUser.macroTargetsG.protein },
    { key: 'carbs', label: 'Carbo', icon: 'carbs', color: theme.success, target: currentUser.macroTargetsG.carbs },
    { key: 'fats', label: 'Grassi', icon: 'fats', color: theme.warning, target: currentUser.macroTargetsG.fats },
  ];

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Bilancio energetico" title="Nutrizione" />

      <Animated.View style={heroAnimatedStyle}>
        <GlassSurface level="raised" radius={Radius.xlarge} style={styles.overviewCard}>
          <DayNavigator
            date={selectedDate}
            onPrev={() => setSelectedDate((d) => addDaysISO(d, -1))}
            onNext={() => setSelectedDate((d) => addDaysISO(d, 1))}
          />
          <NutritionWeekStrip dates={weekDates} loggedDates={loggedDates} selectedDate={selectedDate} onSelect={setSelectedDate} />
          <LoggingStreakBanner streak={streakInfo.streak} gapDays={streakInfo.gapDays} />

          <View style={styles.heroDivider} />

          <View style={styles.heroRingsBlock}>
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
          </View>
        </GlassSurface>
      </Animated.View>

      <View>
        <SectionHeader title="Il tuo piano nutrizionale" />
        <GlassSurface level="card" radius={Radius.large} style={styles.planCard}>
          {dietPlan ? (
            <>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="smallBold">Piano di {dietPlan.durationMonths} mesi, {dietPlan.months.length} fasi</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {dietPlan.months[0].title}: {dietPlan.months[0].focusNote}
                </ThemedText>
              </View>
              <PrimaryButton label="Vedi piano" onPress={() => router.push('/diet-plan')} style={styles.planButton} />
            </>
          ) : (
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="smallBold">Nessun piano generato</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Rifai il questionario in modalità “Piano alimentare” o “Entrambi” per generarne uno.
              </ThemedText>
            </View>
          )}
        </GlassSurface>
      </View>

      <View>
        <SectionHeader title="I tuoi pasti" />
        <View style={{ gap: Spacing.three }}>
          {MEAL_SLOTS.map((meta) => {
            const slotEntries = entriesForSlot(entries, meta.id, selectedDate);
            const slotTotals = sumMacros(slotEntries);
            const target = targetsForSlot(meta.id, currentUser);
            const progress = target.kcal ? Math.min(slotTotals.kcal / target.kcal, 1) : 0;
            const gdaPct = currentUser.dailyCalorieTarget ? Math.round((slotTotals.kcal / currentUser.dailyCalorieTarget) * 100) : 0;

            return (
              <GlassSurface key={meta.id} level="card" radius={Radius.large} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={[styles.mealIcon, { backgroundColor: theme.accentSoft }]}>
                    <Icon name={meta.icon} size={18} color={theme.accent} />
                  </View>
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

                {slotTotals.kcal > 0 ? (
                  <View style={styles.macroBreakdownRow}>
                    <MacroStat label="Gras" value={slotTotals.fats} />
                    <MacroStat label="Carb" value={slotTotals.carbs} />
                    <MacroStat label="Prot" value={slotTotals.protein} />
                    <MacroStat label="GDA" value={gdaPct} suffix="%" />
                  </View>
                ) : null}

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

      <FoodSearchModal visible={activeSlot != null} slot={activeSlot} date={selectedDate} onClose={() => setActiveSlot(null)} />
    </ScreenScroll>
  );
}

function MacroStat({ label, value, suffix = 'g' }: { label: string; value: number; suffix?: string }) {
  return (
    <View style={styles.macroStat}>
      <ThemedText type="caption" themeColor="textSecondary" style={{ fontSize: 11 }}>
        {label}
      </ThemedText>
      <ThemedText type="caption" style={{ fontWeight: '700' }}>
        {Math.round(value)}
        {suffix}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  planButton: {
    flexShrink: 0,
  },
  overviewCard: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.25)',
  },
  heroRingsBlock: {
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
    gap: Spacing.two,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
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
  macroBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  macroStat: {
    alignItems: 'center',
    gap: 1,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
