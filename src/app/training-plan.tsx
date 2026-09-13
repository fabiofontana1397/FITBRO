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
import { exportTrainingPlanPdf } from '@/lib/planning/pdf-export';
import type { PlanPhaseKind, TrainingDayPlan, TrainingMonthPlan } from '@/lib/planning/types';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePlanStore } from '@/store/plan-store';
import { useUserStore } from '@/store/user-store';

const PHASE_LABEL: Record<PlanPhaseKind, string> = {
  adattamento: 'Adattamento',
  progressione: 'Progressione',
  consolidamento: 'Consolidamento',
};

export default function TrainingPlanScreen() {
  const theme = useTheme();
  const plan = usePlanStore((s) => s.trainingPlan);
  const generatePlans = usePlanStore((s) => s.generatePlans);
  const answers = useOnboardingStore((s) => s.answers);
  const currentUser = useUserStore();
  const [expandedMonth, setExpandedMonth] = useState(1);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!plan) return;
    setExporting(true);
    try {
      await exportTrainingPlanPdf(plan, currentUser.name);
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
          <ThemedText type="title">Piano di allenamento</ThemedText>
          {plan ? (
            <ThemedText type="caption" themeColor="textSecondary">
              {plan.durationMonths} mesi
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
          <ThemedText type="smallBold">Nessun piano di allenamento</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Hai completato il questionario in modalità “solo dieta”, oppure non hai selezionato sala pesi o corsa tra
            le attività. Rifai il questionario per generare qui il tuo programma.
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

function MonthCard({ month, expanded, onToggle }: { month: TrainingMonthPlan; expanded: boolean; onToggle: () => void }) {
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

      {expanded ? (
        <View style={{ gap: Spacing.one }}>
          {month.weeklySplit.map((day) => (
            <DayRow key={day.weekday} day={day} />
          ))}
        </View>
      ) : null}
    </GlassSurface>
  );
}

function DayRow({ day }: { day: TrainingDayPlan }) {
  const theme = useTheme();
  const icon = day.type === 'workout' ? 'gym' : day.type === 'cardio' ? 'running' : 'moon';
  const iconColor = day.type === 'rest' ? theme.textTertiary : theme.accent;

  return (
    <View style={[styles.dayRow, { borderColor: theme.border }]}>
      <View style={[styles.dayIcon, { backgroundColor: theme.accentSoft }]}>
        <Icon name={icon} size={16} color={iconColor} />
      </View>
      <View style={{ width: 34 }}>
        <ThemedText type="caption" themeColor="textSecondary">
          {day.weekday}
        </ThemedText>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="small" style={{ fontWeight: '700' }}>
          {day.title}
        </ThemedText>
        {day.type === 'workout' ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {(day.exercises ?? []).map((e) => `${e.name} ${e.sets}×${e.reps}`).join(' · ')}
          </ThemedText>
        ) : day.type === 'cardio' ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {day.note}
          </ThemedText>
        ) : null}
      </View>
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
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dayIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
