import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { ExerciseInfoModal } from '@/components/training/exercise-info-modal';
import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { TrendChart } from '@/components/ui/trend-chart';
import { SpringSnappy } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getExerciseMedia } from '@/lib/exercise-media/exercise-media';
import type { TrainingExerciseEntry } from '@/lib/planning/types';
import type { LoggedSet } from '@/store/training-progress-store';

export type PlanExerciseRowProps = {
  exercise: TrainingExerciseEntry;
  setsToday: LoggedSet[];
  history: { date: string; weightKg: number }[];
  latestWeightKg: number | null;
  completed: boolean;
  onToggleCompleted: () => void;
  onAddSet: (reps: number, weightKg: number) => void;
  onRemoveSet: (id: string) => void;
};

export function PlanExerciseRow({
  exercise,
  setsToday,
  history,
  latestWeightKg,
  completed,
  onToggleCompleted,
  onAddSet,
  onRemoveSet,
}: PlanExerciseRowProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const media = getExerciseMedia(exercise.id);
  const startingReps = (exercise.reps.match(/\d+/) ?? ['8'])[0];
  const [reps, setReps] = useState(startingReps);
  const [weight, setWeight] = useState(
    latestWeightKg != null ? String(latestWeightKg) : exercise.suggestedKg != null ? String(exercise.suggestedKg) : ''
  );

  const isBodyweight = exercise.suggestedKg == null && latestWeightKg == null;
  const isFirstTime = latestWeightKg == null;
  const referenceKg = latestWeightKg ?? exercise.suggestedKg;
  const bestToday = setsToday.length ? Math.max(...setsToday.map((s) => s.weightKg)) : undefined;

  const weightNum = parseFloat(weight.replace(',', '.'));
  const isIncrement =
    !isBodyweight && Number.isFinite(weightNum) && referenceKg != null && weightNum > referenceKg;

  const handleAdd = () => {
    const repsNum = parseInt(reps, 10);
    if (!Number.isFinite(repsNum) || repsNum <= 0) return;
    if (exercise.suggestedKg != null && !Number.isFinite(weightNum)) return;
    onAddSet(repsNum, Number.isFinite(weightNum) ? weightNum : 0);
  };

  return (
    <GlassSurface level="card" radius={Radius.large} style={completed ? { opacity: 0.72 } : undefined}>
      <View style={styles.header}>
        <Pressable onPress={() => setExpanded((e) => !e)} style={styles.headerMain}>
          {media ? (
            <Image source={{ uri: media.gifUrl }} style={[styles.thumb, { backgroundColor: theme.backgroundElement }]} />
          ) : (
            <View style={[styles.thumb, { backgroundColor: theme.backgroundElement }]} />
          )}
          <View style={{ flex: 1, gap: 6 }}>
            <ThemedText type="smallBold" style={completed ? { textDecorationLine: 'line-through' } : undefined}>
              {exercise.name}
            </ThemedText>
            <View style={styles.targetRow}>
              <View style={[styles.targetChip, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">
                  {exercise.sets}×{exercise.reps}
                </ThemedText>
              </View>
              {!isBodyweight && referenceKg != null ? (
                <View style={[styles.loadChip, { backgroundColor: theme.accentSoft }]}>
                  <Icon name={isFirstTime ? 'sparkle' : 'scale'} size={12} color={theme.accent} />
                  <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
                    {referenceKg}kg{isFirstTime ? ' consigliato' : ''}
                  </ThemedText>
                </View>
              ) : isBodyweight ? (
                <View style={[styles.loadChip, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    corpo libero
                  </ThemedText>
                </View>
              ) : null}
              {history.length >= 2 ? (
                <TrendChart data={history.map((h) => h.weightKg)} width={56} height={24} color={theme.accent} fillTo={false} />
              ) : null}
            </View>
            <ThemedText type="caption" themeColor="textTertiary">
              recupero {exercise.restSec < 60 ? `${exercise.restSec}s` : `${Math.round(exercise.restSec / 60)} min`}
            </ThemedText>
          </View>
          {bestToday != null ? (
            <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
                {bestToday}kg
              </ThemedText>
            </View>
          ) : null}
        </Pressable>
        <CompletionToggle completed={completed} onToggle={onToggleCompleted} />
        <Pressable onPress={() => setInfoOpen(true)} hitSlop={8} style={styles.iconButton}>
          <Icon name="info" size={20} color={theme.textSecondary} />
        </Pressable>
        <Pressable onPress={() => setExpanded((e) => !e)} hitSlop={8} style={styles.iconButton}>
          <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={18} color={theme.textTertiary} />
        </Pressable>
      </View>

      <ExerciseInfoModal
        visible={infoOpen}
        exerciseName={exercise.name}
        media={media}
        onClose={() => setInfoOpen(false)}
      />

      {expanded ? (
        <View style={styles.body}>
          {history.length >= 2 ? (
            <View style={styles.chartRow}>
              <ThemedText type="caption" themeColor="textSecondary" style={{ flex: 1 }}>
                Andamento carico ({history[0].weightKg}kg → {history[history.length - 1].weightKg}kg)
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
              <Icon name={isIncrement ? 'trendUp' : 'plus'} size={18} color={theme.onAccent} />
              <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
                {isIncrement ? 'Aggiorna carico' : 'Serie'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}
    </GlassSurface>
  );
}

function CompletionToggle({ completed, onToggle }: { completed: boolean; onToggle: () => void }) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(withTiming(0.72, { duration: 90 }), withSpring(1, SpringSnappy));
    // Only animate in response to the completed flag actually flipping, not the initial mount value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onToggle} hitSlop={8} style={styles.iconButton}>
      <Animated.View
        style={[
          styles.checkCircle,
          {
            backgroundColor: completed ? theme.accent : 'transparent',
            borderColor: completed ? theme.accent : theme.border,
          },
          animatedStyle,
        ]}>
        {completed ? <Icon name="check" size={14} color={theme.onAccent} /> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
  },
  iconButton: {
    padding: 4,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  targetChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  loadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
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
