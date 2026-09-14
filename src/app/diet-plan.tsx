import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { PlanTimeline } from '@/components/training/plan-timeline';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { MonthProgressBar } from '@/components/ui/month-progress-bar';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { exportDietPlanPdf } from '@/lib/planning/pdf-export';
import { currentMonthIndex, monthProgress } from '@/lib/planning/plan-progress';
import type { PlanMeal, PlanPhaseKind } from '@/lib/planning/types';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePlanStore } from '@/store/plan-store';
import { useUserStore } from '@/store/user-store';

const PHASE_LABEL: Record<PlanPhaseKind, string> = {
  adattamento: 'Adattamento',
  progressione: 'Progressione',
  consolidamento: 'Consolidamento',
};

export default function DietPlanScreen() {
  const theme = useTheme();
  const plan = usePlanStore((s) => s.dietPlan);
  const generatePlans = usePlanStore((s) => s.generatePlans);
  const answers = useOnboardingStore((s) => s.answers);
  const currentUser = useUserStore();
  const [exporting, setExporting] = useState(false);

  const currentMonthIdx = plan ? currentMonthIndex(plan) : 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);
  const selectedMonthData = plan?.months.find((m) => m.monthIndex === selectedMonth);
  const isUnlocked = selectedMonth <= currentMonthIdx;
  const progress = plan ? monthProgress(plan, selectedMonth) : null;

  const handleExport = async () => {
    if (!plan) return;
    setExporting(true);
    try {
      await exportDietPlanPdf(plan, currentUser.name);
    } catch {
      Alert.alert('Non riesco a generare il PDF', 'Riprova tra qualche istante.');
    } finally {
      setExporting(false);
    }
  };

  const handleRegenerate = () => {
    generatePlans(answers, { dailyCalorieTarget: currentUser.dailyCalorieTarget, macroTargetsG: currentUser.macroTargetsG });
  };

  return (
    <ScreenScroll>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText type="title">Piano alimentare</ThemedText>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <GlassSurface level="card" radius={Radius.pill} style={styles.closeButton}>
            <View style={styles.closeInner}>
              <Icon name="close" size={18} color={theme.text} />
            </View>
          </GlassSurface>
        </Pressable>
      </View>

      {!plan ? (
        <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four, gap: Spacing.two }}>
          <ThemedText type="smallBold">Nessun piano alimentare</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Hai completato il questionario in modalità “solo allenamento”. Rifallo scegliendo “Piano alimentare” o
            “Entrambi” per generare qui il tuo piano.
          </ThemedText>
        </GlassSurface>
      ) : (
        <>
          <View style={styles.planMetaRow}>
            <View style={{ gap: 2 }}>
              <ThemedText type="caption" themeColor="textSecondary">
                Durata piano totale
              </ThemedText>
              <ThemedText type="smallBold">{plan.durationMonths} mesi</ThemedText>
            </View>
            <View style={{ gap: 2 }}>
              <ThemedText type="caption" themeColor="textSecondary">
                Durata scheda
              </ThemedText>
              <ThemedText type="smallBold">1 mese</ThemedText>
            </View>
          </View>

          <PlanTimeline
            totalMonths={plan.durationMonths}
            currentMonth={currentMonthIdx}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />

          {selectedMonthData ? (
            <View style={{ gap: Spacing.one }}>
              <View style={[styles.phaseTag, { backgroundColor: theme.accentSoft, alignSelf: 'flex-start' }]}>
                <ThemedText
                  type="caption"
                  style={{ color: selectedMonthData.phase === 'consolidamento' ? theme.success : theme.accent, fontWeight: '700' }}>
                  {PHASE_LABEL[selectedMonthData.phase]}
                </ThemedText>
              </View>
              <ThemedText type="subtitle">{selectedMonthData.title}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {selectedMonthData.focusNote}
              </ThemedText>
            </View>
          ) : null}

          {isUnlocked && progress ? (
            <View style={{ gap: Spacing.two }}>
              <MonthProgressBar fraction={progress.fraction} />
              <ThemedText type="caption" themeColor="textSecondary">
                Giorno {progress.dayInMonth} di 30
              </ThemedText>
            </View>
          ) : null}

          {!isUnlocked ? (
            <GlassSurface level="card" radius={Radius.large} style={styles.lockedCard}>
              <View style={[styles.lockedIcon, { backgroundColor: theme.backgroundElement }]}>
                <Icon name="lock" size={22} color={theme.textTertiary} />
              </View>
              <ThemedText type="smallBold">Scheda ancora da sbloccare</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                Si sblocca al termine del Mese {selectedMonth - 1}. I target si adatteranno ai tuoi progressi fino a
                quel momento.
              </ThemedText>
            </GlassSurface>
          ) : selectedMonthData ? (
            <>
              <View style={styles.linksRow}>
                <Pressable onPress={handleExport} disabled={exporting} style={styles.exportLink} hitSlop={8}>
                  <Icon name="download" size={15} color={theme.textSecondary} />
                  <ThemedText type="caption" themeColor="textSecondary">
                    {exporting ? 'Preparazione…' : 'Scarica PDF'}
                  </ThemedText>
                </Pressable>
                <Pressable onPress={handleRegenerate} style={styles.exportLink} hitSlop={8}>
                  <Icon name="refresh" size={15} color={theme.textSecondary} />
                  <ThemedText type="caption" themeColor="textSecondary">
                    Rigenera
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.targetsRow}>
                <Target label="Calorie" value={`${selectedMonthData.calorieTarget}`} unit="kcal" />
                <Target label="Proteine" value={`${selectedMonthData.macroTargetsG.protein}`} unit="g" />
                <Target label="Carbo" value={`${selectedMonthData.macroTargetsG.carbs}`} unit="g" />
                <Target label="Grassi" value={`${selectedMonthData.macroTargetsG.fats}`} unit="g" />
              </View>

              <View style={{ gap: Spacing.two }}>
                <ThemedText type="label" themeColor="textSecondary">
                  Esempio di giornata
                </ThemedText>
                <View style={{ gap: Spacing.two }}>
                  {selectedMonthData.sampleDay.map((meal) => (
                    <MealCard key={meal.slotId} meal={meal} />
                  ))}
                </View>
              </View>
            </>
          ) : null}
        </>
      )}
    </ScreenScroll>
  );
}

function MealCard({ meal }: { meal: PlanMeal }) {
  return (
    <GlassSurface level="card" radius={Radius.large} style={styles.mealCard}>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="caption" themeColor="textSecondary">
          {meal.time} · {meal.label}
        </ThemedText>
        <ThemedText type="small">{meal.items.map((i) => `${i.name} (${i.grams}g)`).join(', ')}</ThemedText>
      </View>
      <ThemedText type="caption" themeColor="textSecondary">
        {meal.totalKcal} kcal
      </ThemedText>
    </GlassSurface>
  );
}

function Target({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.target}>
      <ThemedText type="smallBold">
        {value}
        <ThemedText type="caption" themeColor="textSecondary">
          {' '}
          {unit}
        </ThemedText>
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
  },
  closeInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planMetaRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  phaseTag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  lockedCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.five,
  },
  lockedIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
  },
  exportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  target: {
    alignItems: 'center',
    gap: 2,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
});
