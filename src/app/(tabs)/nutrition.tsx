import { StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionHeader } from '@/components/ui/section-header';
import { TrendChart } from '@/components/ui/trend-chart';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentUser, todaysMeals, totalsFor, weeklyCalorieSeries, weeklyProteinSeries } from '@/lib/mock';

export default function NutritionScreen() {
  const theme = useTheme();
  const totals = totalsFor(todaysMeals);
  const calorieProgress = totals.calories / currentUser.dailyCalorieTarget;

  const macros: { key: 'proteinG' | 'carbsG' | 'fatsG'; label: string; icon: IconName; color: string; target: number }[] = [
    { key: 'proteinG', label: 'Proteine', icon: 'protein', color: theme.accent, target: currentUser.macroTargetsG.protein },
    { key: 'carbsG', label: 'Carboidrati', icon: 'carbs', color: theme.success, target: currentUser.macroTargetsG.carbs },
    { key: 'fatsG', label: 'Grassi', icon: 'fats', color: theme.warning, target: currentUser.macroTargetsG.fats },
  ];

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Bilancio energetico" title="Nutrizione" />

      <GlassSurface level="card" radius={Radius.large} style={styles.calorieCard}>
        <View style={styles.calorieRow}>
          <ProgressRing size={104} strokeWidth={10} progress={calorieProgress} color={theme.accent} trackColor={theme.backgroundElement}>
            <ThemedText type="title">{totals.calories}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              / {currentUser.dailyCalorieTarget} kcal
            </ThemedText>
          </ProgressRing>
          <View style={{ flex: 1, gap: Spacing.two }}>
            {macros.map((macro) => {
              const value = totals[macro.key];
              const progress = Math.min(value / macro.target, 1);
              return (
                <View key={macro.key} style={styles.macroRow}>
                  <Icon name={macro.icon} size={16} color={macro.color} />
                  <ThemedText type="caption" style={{ width: 88 }}>
                    {macro.label}
                  </ThemedText>
                  <View style={[styles.macroTrack, { backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.macroFill, { width: `${progress * 100}%`, backgroundColor: macro.color }]} />
                  </View>
                  <ThemedText type="caption" themeColor="textSecondary" style={{ width: 64, textAlign: 'right' }}>
                    {value}/{macro.target}g
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>
      </GlassSurface>

      <View>
        <SectionHeader title="Pasti di oggi" />
        <View style={{ gap: Spacing.three }}>
          {todaysMeals.map((meal) => (
            <GlassSurface key={meal.id} level="card" radius={Radius.large}>
              <View style={styles.mealRow}>
                <View style={{ width: 52 }}>
                  <ThemedText type="smallBold">{meal.time}</ThemedText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="smallBold">{meal.name}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {meal.items.join(', ')}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  {meal.calories}
                  <ThemedText type="caption" themeColor="textSecondary">
                    {' '}
                    kcal
                  </ThemedText>
                </ThemedText>
              </View>
            </GlassSurface>
          ))}
        </View>
      </View>

      <View>
        <SectionHeader title="Trend settimanale" />
        <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.three }}>
          <View style={styles.trendRow}>
            <View style={{ gap: 4 }}>
              <ThemedText type="caption" themeColor="textSecondary">
                Calorie medie
              </ThemedText>
              <ThemedText type="subtitle">
                {Math.round(weeklyCalorieSeries.reduce((a, b) => a + b, 0) / weeklyCalorieSeries.length)}
              </ThemedText>
            </View>
            <TrendChart data={weeklyCalorieSeries} width={150} height={48} color={theme.accent} />
          </View>
          <View style={[styles.trendRow, { marginTop: Spacing.three }]}>
            <View style={{ gap: 4 }}>
              <ThemedText type="caption" themeColor="textSecondary">
                Proteine medie
              </ThemedText>
              <ThemedText type="subtitle">
                {Math.round(weeklyProteinSeries.reduce((a, b) => a + b, 0) / weeklyProteinSeries.length)} g
              </ThemedText>
            </View>
            <TrendChart data={weeklyProteinSeries} width={150} height={48} color={theme.success} />
          </View>
        </GlassSurface>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  calorieCard: {
    padding: Spacing.three,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  macroTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
