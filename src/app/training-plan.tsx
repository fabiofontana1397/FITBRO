import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { PlanTimeline } from '@/components/training/plan-timeline';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { exportTrainingPlanPdf, type TrainingPlanPdfRow } from '@/lib/planning/pdf-export';
import { currentMonthIndex } from '@/lib/planning/plan-progress';
import { findQuestion, labelFor } from '@/lib/questionnaire/schema';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePlanStore } from '@/store/plan-store';
import { latestWeightForExercise, useTrainingProgressStore } from '@/store/training-progress-store';
import { useUserStore } from '@/store/user-store';

const PHASE_LABEL: Record<string, string> = {
  adattamento: 'Adattamento',
  progressione: 'Progressione',
  consolidamento: 'Consolidamento',
};

type Row = TrainingPlanPdfRow & { key: string; note?: string };

export default function TrainingPlanScreen() {
  const theme = useTheme();
  const plan = usePlanStore((s) => s.trainingPlan);
  const generatePlans = usePlanStore((s) => s.generatePlans);
  const answers = useOnboardingStore((s) => s.answers);
  const currentUser = useUserStore();
  const progressSets = useTrainingProgressStore((s) => s.sets);
  const [exporting, setExporting] = useState(false);

  const monthIndex = plan ? currentMonthIndex(plan) : 1;
  const currentMonth = plan?.months.find((m) => m.monthIndex === monthIndex);

  const rows: Row[] = useMemo(() => {
    if (!currentMonth) return [];
    return currentMonth.weeklySplit.flatMap((day): Row[] => {
      if (day.type === 'workout') {
        return (day.exercises ?? []).map((ex) => {
          const logged = latestWeightForExercise(progressSets, ex.id);
          const carico = logged != null ? `${logged} kg` : ex.suggestedKg != null ? `~${ex.suggestedKg} kg` : '—';
          return {
            key: `${day.weekday}-${ex.id}`,
            weekday: day.weekday,
            dayTitle: day.title,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest: ex.restSec < 60 ? `${ex.restSec}s` : `${Math.round(ex.restSec / 60)} min`,
            carico,
          };
        });
      }
      if (day.type === 'cardio') {
        return [
          {
            key: day.weekday,
            weekday: day.weekday,
            dayTitle: day.title,
            name: day.note ?? 'Corsa',
            sets: null,
            reps: null,
            rest: null,
            carico: null,
          },
        ];
      }
      return [];
    });
  }, [currentMonth, progressSets]);

  const goalLabel = labelFor(findQuestion('goal'), answers.goal) ?? '';

  const handleExport = async () => {
    if (!plan || !currentMonth) return;
    setExporting(true);
    try {
      await exportTrainingPlanPdf({
        userName: currentUser.name,
        goalNote: `Obiettivo: ${goalLabel}`,
        totalMonths: plan.durationMonths,
        monthIndex,
        monthTitle: currentMonth.title,
        monthFocus: currentMonth.focusNote,
        rows,
      });
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
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <GlassSurface level="card" radius={Radius.pill} style={styles.closeButton}>
            <View style={styles.closeInner}>
              <Icon name="close" size={18} color={theme.text} />
            </View>
          </GlassSurface>
        </Pressable>
      </View>

      {!plan || !currentMonth ? (
        <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four, gap: Spacing.two }}>
          <ThemedText type="smallBold">Nessun programma generato</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Hai completato il questionario in modalità “solo dieta”, oppure non hai selezionato sala pesi o corsa tra
            le attività. Rifai il questionario per generare qui il tuo programma.
          </ThemedText>
        </GlassSurface>
      ) : (
        <>
          <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four }}>
            <PlanTimeline
              totalMonths={plan.durationMonths}
              currentMonth={monthIndex}
              currentLabel={`Mese ${monthIndex} · ${PHASE_LABEL[currentMonth.phase]}`}
            />
          </GlassSurface>

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

          <View style={{ gap: Spacing.one }}>
            <ThemedText type="subtitle">{currentMonth.title}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {currentMonth.focusNote}
            </ThemedText>
          </View>

          <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.three }}>
            <View style={styles.tableHeaderRow}>
              <ThemedText type="label" themeColor="textSecondary" style={styles.colExercise}>
                Esercizio
              </ThemedText>
              <ThemedText type="label" themeColor="textSecondary" style={styles.colSmall}>
                Serie
              </ThemedText>
              <ThemedText type="label" themeColor="textSecondary" style={styles.colSmall}>
                Rip
              </ThemedText>
              <ThemedText type="label" themeColor="textSecondary" style={styles.colMedium}>
                Recupero
              </ThemedText>
              <ThemedText type="label" themeColor="textSecondary" style={styles.colMedium}>
                Carico
              </ThemedText>
            </View>
            {rows.map((row, i) => {
              const showDay = i === 0 || rows[i - 1].weekday !== row.weekday;
              return (
                <View key={row.key}>
                  {showDay ? (
                    <View style={[styles.dayHeadingRow, { backgroundColor: theme.backgroundElement }]}>
                      <ThemedText type="caption" style={{ fontWeight: '700' }}>
                        {row.weekday} · {row.dayTitle}
                      </ThemedText>
                    </View>
                  ) : null}
                  <View style={[styles.tableRow, { borderTopColor: theme.border }]}>
                    <ThemedText type="small" style={styles.colExercise}>
                      {row.name}
                    </ThemedText>
                    <ThemedText type="small" style={styles.colSmall}>
                      {row.sets ?? '—'}
                    </ThemedText>
                    <ThemedText type="small" style={styles.colSmall}>
                      {row.reps ?? '—'}
                    </ThemedText>
                    <ThemedText type="small" style={styles.colMedium}>
                      {row.rest ?? '—'}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.colMedium, { color: theme.accent, fontWeight: '700' }]}>
                      {row.carico ?? '—'}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </GlassSurface>

          <ThemedText type="caption" themeColor="textTertiary">
            ~ = carico consigliato per iniziare. Registra le tue serie per sostituirlo con il carico reale.
          </ThemedText>
        </>
      )}
    </ScreenScroll>
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
  tableHeaderRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
  },
  dayHeadingRow: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
    marginTop: Spacing.two,
  },
  tableRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  colExercise: { flex: 1, paddingRight: 4 },
  colSmall: { width: 38 },
  colMedium: { width: 72 },
});
