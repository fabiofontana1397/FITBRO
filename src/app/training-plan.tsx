import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { PlanTimeline } from '@/components/training/plan-timeline';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getExerciseMedia } from '@/lib/exercise-media/exercise-media';
import { exportTrainingPlanPdf, type TrainingPlanPdfRow } from '@/lib/planning/pdf-export';
import { currentMonthIndex } from '@/lib/planning/plan-progress';
import { findQuestion, labelFor } from '@/lib/questionnaire/schema';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePlanStore } from '@/store/plan-store';
import { latestWeightForExercise, useTrainingProgressStore } from '@/store/training-progress-store';
import { useUserStore } from '@/store/user-store';

type DayItem = { key: string; exerciseId?: string; name: string; subtitle: string; carico: string | null };
type DayGroup = { weekday: string; title: string; icon: 'gym' | 'running'; items: DayItem[] };

export default function TrainingPlanScreen() {
  const theme = useTheme();
  const plan = usePlanStore((s) => s.trainingPlan);
  const answers = useOnboardingStore((s) => s.answers);
  const currentUser = useUserStore();
  const progressSets = useTrainingProgressStore((s) => s.sets);
  const [exporting, setExporting] = useState(false);

  const currentMonthIdx = plan ? currentMonthIndex(plan) : 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);
  const selectedMonthData = plan?.months.find((m) => m.monthIndex === selectedMonth);
  const isUnlocked = selectedMonth <= currentMonthIdx;

  const dayGroups: DayGroup[] = useMemo(() => {
    if (!selectedMonthData) return [];
    return selectedMonthData.weeklySplit
      .filter((day) => day.type !== 'rest')
      .map((day): DayGroup => {
        if (day.type === 'workout') {
          return {
            weekday: day.weekday,
            title: day.title,
            icon: 'gym',
            items: (day.exercises ?? []).map((ex) => {
              const logged = latestWeightForExercise(progressSets, ex.id);
              const carico = logged != null ? `${logged} kg` : ex.suggestedKg != null ? `~${ex.suggestedKg} kg` : null;
              const rest = ex.restSec < 60 ? `${ex.restSec}s` : `${Math.round(ex.restSec / 60)} min`;
              return { key: ex.id, exerciseId: ex.id, name: ex.name, subtitle: `${ex.sets}×${ex.reps} · recupero ${rest}`, carico };
            }),
          };
        }
        return {
          weekday: day.weekday,
          title: day.title,
          icon: 'running',
          items: [{ key: day.weekday, name: day.title, subtitle: day.note ?? '', carico: null }],
        };
      });
  }, [selectedMonthData, progressSets]);

  const goalLabel = labelFor(findQuestion('goal'), answers.goal) ?? '';

  const handleExport = async () => {
    if (!plan || !selectedMonthData) return;
    setExporting(true);
    try {
      const rows: TrainingPlanPdfRow[] = selectedMonthData.weeklySplit.flatMap((day): TrainingPlanPdfRow[] => {
        if (day.type === 'workout') {
          return (day.exercises ?? []).map((ex) => {
            const logged = latestWeightForExercise(progressSets, ex.id);
            const carico = logged != null ? `${logged} kg` : ex.suggestedKg != null ? `~${ex.suggestedKg} kg` : null;
            return {
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
          return [{ weekday: day.weekday, dayTitle: day.title, name: day.note ?? 'Corsa', sets: null, reps: null, rest: null, carico: null }];
        }
        return [];
      });
      await exportTrainingPlanPdf({
        userName: currentUser.name,
        goalNote: `Obiettivo: ${goalLabel}`,
        totalMonths: plan.durationMonths,
        monthIndex: selectedMonth,
        monthTitle: selectedMonthData.title,
        monthFocus: selectedMonthData.focusNote,
        rows,
      });
    } catch {
      Alert.alert('Non riesco a generare il PDF', 'Riprova tra qualche istante.');
    } finally {
      setExporting(false);
    }
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

      {!plan ? (
        <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four, gap: Spacing.two }}>
          <ThemedText type="smallBold">Nessun programma generato</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Hai completato il questionario in modalità “solo dieta”, oppure non hai selezionato sala pesi o corsa tra
            le attività. Rifai il questionario per generare qui il tuo programma.
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
              <ThemedText type="subtitle">{selectedMonthData.title}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {selectedMonthData.focusNote}
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
                Si sblocca al termine del Mese {selectedMonth - 1}. I dettagli si adatteranno ai tuoi progressi fino a
                quel momento.
              </ThemedText>
            </GlassSurface>
          ) : (
            <>
              <Pressable onPress={handleExport} disabled={exporting} style={styles.exportLink} hitSlop={8}>
                <Icon name="download" size={15} color={theme.textSecondary} />
                <ThemedText type="caption" themeColor="textSecondary">
                  {exporting ? 'Preparazione…' : 'Scarica PDF'}
                </ThemedText>
              </Pressable>

              <View style={{ gap: Spacing.four }}>
                {dayGroups.map((group) => (
                  <View key={group.weekday} style={{ gap: Spacing.two }}>
                    <View style={styles.dayHeadingRow}>
                      <Icon name={group.icon} size={14} color={theme.textSecondary} />
                      <ThemedText type="label" themeColor="textSecondary">
                        {group.weekday} · {group.title}
                      </ThemedText>
                    </View>
                    <View style={{ gap: Spacing.two }}>
                      {group.items.map((item) => (
                        <ExerciseSummaryCard key={item.key} item={item} />
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              <ThemedText type="caption" themeColor="textTertiary">
                ~ = carico consigliato per iniziare. Registra le tue serie nel piano per sostituirlo con il carico
                reale.
              </ThemedText>
            </>
          )}
        </>
      )}
    </ScreenScroll>
  );
}

function ExerciseSummaryCard({ item }: { item: DayItem }) {
  const theme = useTheme();
  const media = item.exerciseId ? getExerciseMedia(item.exerciseId) : undefined;

  return (
    <GlassSurface level="card" radius={Radius.large} style={styles.exerciseCard}>
      {media ? (
        <Image source={{ uri: media.gifUrl }} style={[styles.thumb, { backgroundColor: theme.backgroundElement }]} />
      ) : (
        <View style={[styles.thumb, { backgroundColor: theme.backgroundElement }]} />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="smallBold">{item.name}</ThemedText>
        {item.subtitle ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {item.subtitle}
          </ThemedText>
        ) : null}
      </View>
      {item.carico ? (
        <View style={[styles.caricoBadge, { backgroundColor: theme.accentSoft }]}>
          <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
            {item.carico}
          </ThemedText>
        </View>
      ) : null}
    </GlassSurface>
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
  exportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
  },
  dayHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
  },
  caricoBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
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
});
