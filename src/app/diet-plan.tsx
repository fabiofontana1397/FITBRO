import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { exportDietPlanPdf } from '@/lib/planning/pdf-export';
import type { DietMonthPlan, PlanPhaseKind } from '@/lib/planning/types';
import { findQuestion, labelFor } from '@/lib/questionnaire/schema';
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
  const [expandedMonth, setExpandedMonth] = useState(1);
  const [exporting, setExporting] = useState(false);

  const goalLabel = labelFor(findQuestion('goal'), answers.goal) ?? '';

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
          {plan ? (
            <ThemedText type="caption" themeColor="textSecondary">
              {plan.durationMonths} mesi · Obiettivo: {goalLabel}
            </ThemedText>
          ) : null}
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
          <View style={styles.actionsRow}>
            <PrimaryButton
              label={exporting ? 'Preparazione…' : 'Scarica PDF'}
              icon="download"
              onPress={handleExport}
              disabled={exporting}
              style={{ flex: 1 }}
            />
            <PrimaryButton variant="ghost" label="Rigenera" icon="refresh" onPress={handleRegenerate} style={{ flex: 1 }} />
          </View>

          <View style={{ gap: Spacing.three }}>
            {plan.months.map((month) => (
              <MonthCard
                key={month.monthIndex}
                month={month}
                expanded={expandedMonth === month.monthIndex}
                onToggle={() => setExpandedMonth(expandedMonth === month.monthIndex ? -1 : month.monthIndex)}
              />
            ))}
          </View>
        </>
      )}
    </ScreenScroll>
  );
}

function MonthCard({ month, expanded, onToggle }: { month: DietMonthPlan; expanded: boolean; onToggle: () => void }) {
  const theme = useTheme();
  const phaseColor = month.phase === 'consolidamento' ? theme.success : theme.accent;

  return (
    <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four, gap: Spacing.three }}>
      <Pressable onPress={onToggle} style={styles.monthHeader}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={[styles.phaseTag, { backgroundColor: theme.accentSoft }]}>
            <ThemedText type="caption" style={{ color: phaseColor, fontWeight: '700' }}>
              {PHASE_LABEL[month.phase]}
            </ThemedText>
          </View>
          <ThemedText type="smallBold">{month.title}</ThemedText>
        </View>
        <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size={18} color={theme.textTertiary} />
      </Pressable>

      <ThemedText type="caption" themeColor="textSecondary">
        {month.focusNote}
      </ThemedText>

      <View style={styles.targetsRow}>
        <Target label="Calorie" value={`${month.calorieTarget}`} unit="kcal" />
        <Target label="Proteine" value={`${month.macroTargetsG.protein}`} unit="g" />
        <Target label="Carbo" value={`${month.macroTargetsG.carbs}`} unit="g" />
        <Target label="Grassi" value={`${month.macroTargetsG.fats}`} unit="g" />
      </View>

      {expanded ? (
        <View style={{ gap: Spacing.two }}>
          <ThemedText type="label" themeColor="textSecondary">
            Esempio di giornata
          </ThemedText>
          {month.sampleDay.map((meal) => (
            <View key={meal.slotId} style={[styles.mealRow, { borderColor: theme.border }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="caption" themeColor="textSecondary">
                  {meal.time} · {meal.label}
                </ThemedText>
                <ThemedText type="small">{meal.items.map((i) => `${i.name} (${i.grams}g)`).join(', ')}</ThemedText>
              </View>
              <ThemedText type="caption" themeColor="textSecondary">
                {meal.totalKcal} kcal
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}
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
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  phaseTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  targetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  target: {
    alignItems: 'center',
    gap: 2,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
