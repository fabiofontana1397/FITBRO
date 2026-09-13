import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { TrendChart } from '@/components/ui/trend-chart';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TrainingExerciseEntry } from '@/lib/planning/types';
import type { LoggedSet } from '@/store/training-progress-store';

export type PlanExerciseRowProps = {
  exercise: TrainingExerciseEntry;
  setsToday: LoggedSet[];
  history: { date: string; weightKg: number }[];
  latestWeightKg: number | null;
  onAddSet: (reps: number, weightKg: number) => void;
  onRemoveSet: (id: string) => void;
};

export function PlanExerciseRow({ exercise, setsToday, history, latestWeightKg, onAddSet, onRemoveSet }: PlanExerciseRowProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const startingReps = (exercise.reps.match(/\d+/) ?? ['8'])[0];
  const [reps, setReps] = useState(startingReps);
  const [weight, setWeight] = useState(
    latestWeightKg != null ? String(latestWeightKg) : exercise.suggestedKg != null ? String(exercise.suggestedKg) : ''
  );

  const handleAdd = () => {
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight.replace(',', '.'));
    if (!Number.isFinite(repsNum) || repsNum <= 0) return;
    if (exercise.suggestedKg != null && !Number.isFinite(weightNum)) return;
    onAddSet(repsNum, Number.isFinite(weightNum) ? weightNum : 0);
  };

  const isBodyweight = exercise.suggestedKg == null && latestWeightKg == null;
  const bestToday = setsToday.length ? Math.max(...setsToday.map((s) => s.weightKg)) : undefined;

  return (
    <GlassSurface level="card" radius={Radius.large}>
      <Pressable onPress={() => setExpanded((e) => !e)} style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText type="smallBold">{exercise.name}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {exercise.sets}×{exercise.reps} · recupero {exercise.restSec < 60 ? `${exercise.restSec}s` : `${Math.round(exercise.restSec / 60)} min`}
          </ThemedText>
        </View>
        {bestToday != null ? (
          <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
            <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
              {bestToday}kg
            </ThemedText>
          </View>
        ) : null}
        <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={18} color={theme.textTertiary} />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {history.length >= 2 ? (
            <View style={styles.chartRow}>
              <ThemedText type="caption" themeColor="textSecondary" style={{ flex: 1 }}>
                Progressione carico
              </ThemedText>
              <TrendChart data={history.map((h) => h.weightKg)} width={120} height={36} color={theme.accent} />
            </View>
          ) : !isBodyweight ? (
            <ThemedText type="caption" themeColor="textSecondary">
              Carico consigliato per iniziare: {exercise.suggestedKg}kg. Aggiornalo man mano che progredisci.
            </ThemedText>
          ) : (
            <ThemedText type="caption" themeColor="textSecondary">
              Esercizio a corpo libero — traccia solo le ripetizioni, o aggiungi un carico se lo appesantisci.
            </ThemedText>
          )}

          {setsToday.length > 0 ? (
            <View style={{ gap: 4 }}>
              {setsToday.map((set, i) => (
                <View key={set.id} style={styles.setRow}>
                  <ThemedText type="caption" themeColor="textSecondary" style={{ flex: 1 }}>
                    Serie {i + 1}: {set.reps} rep{set.weightKg > 0 ? ` × ${set.weightKg} kg` : ''}
                  </ThemedText>
                  <Pressable onPress={() => onRemoveSet(set.id)} hitSlop={8}>
                    <Icon name="close" size={14} color={theme.textTertiary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <ThemedText type="label" themeColor="textSecondary">
                Rep
              </ThemedText>
              <TextInput
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                placeholderTextColor={theme.textTertiary}
              />
            </View>
            <View style={styles.inputGroup}>
              <ThemedText type="label" themeColor="textSecondary">
                Kg
              </ThemedText>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0"
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                placeholderTextColor={theme.textTertiary}
              />
            </View>
            <Pressable onPress={handleAdd} style={[styles.addButton, { backgroundColor: theme.accent }]}>
              <Icon name="plus" size={18} color={theme.onAccent} />
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                Serie
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  body: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  inputGroup: {
    gap: 4,
  },
  input: {
    width: 64,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    marginLeft: 'auto',
  },
});
