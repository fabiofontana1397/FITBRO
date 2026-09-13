import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { ExerciseInfoModal } from '@/components/training/exercise-info-modal';
import { NewLoadModal } from '@/components/training/new-load-modal';
import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { TrendChart } from '@/components/ui/trend-chart';
import { SpringSnappy } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getExerciseMedia } from '@/lib/exercise-media/exercise-media';
import type { TrainingExerciseEntry } from '@/lib/planning/types';

export type PlanExerciseRowProps = {
  exercise: TrainingExerciseEntry;
  history: { date: string; weightKg: number }[];
  latestWeightKg: number | null;
  loggedTodayKg: number | null;
  completed: boolean;
  onToggleCompleted: () => void;
  onAddLoad: (reps: number, weightKg: number) => void;
};

export function PlanExerciseRow({
  exercise,
  history,
  latestWeightKg,
  loggedTodayKg,
  completed,
  onToggleCompleted,
  onAddLoad,
}: PlanExerciseRowProps) {
  const theme = useTheme();
  const [infoOpen, setInfoOpen] = useState(false);
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const media = getExerciseMedia(exercise.id);
  const startingReps = (exercise.reps.match(/\d+/) ?? ['8'])[0];

  const isBodyweight = exercise.suggestedKg == null && latestWeightKg == null;
  const isFirstTime = latestWeightKg == null;
  const referenceKg = latestWeightKg ?? exercise.suggestedKg;

  return (
    <GlassSurface level="card" radius={Radius.large} style={[styles.card, completed ? { opacity: 0.72 } : undefined]}>
      <View style={styles.header}>
        <CompletionToggle completed={completed} onToggle={onToggleCompleted} />

        {media ? (
          <Image source={{ uri: media.gifUrl }} style={[styles.thumb, { backgroundColor: theme.backgroundElement }]} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: theme.backgroundElement }]} />
        )}

        <View style={styles.infoColumn}>
          <ThemedText type="smallBold" style={completed ? { textDecorationLine: 'line-through' } : undefined}>
            {exercise.name}
          </ThemedText>
          <View style={styles.chipRow}>
            <View style={[styles.targetChip, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="caption" style={{ fontWeight: '700' }}>
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
          </View>
          <ThemedText type="caption" themeColor="textTertiary">
            recupero {exercise.restSec < 60 ? `${exercise.restSec}s` : `${Math.round(exercise.restSec / 60)} min`}
          </ThemedText>
        </View>

        <Pressable onPress={() => setInfoOpen(true)} hitSlop={8} style={styles.iconButton}>
          <Icon name="info" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {history.length >= 2 ? (
          <View style={styles.chartRow}>
            <ThemedText type="caption" themeColor="textSecondary" style={{ flex: 1 }}>
              Andamento carico ({history[0].weightKg}kg → {history[history.length - 1].weightKg}kg)
            </ThemedText>
            <TrendChart data={history.map((h) => h.weightKg)} width={110} height={36} color={theme.accent} />
          </View>
        ) : !isBodyweight ? (
          <ThemedText type="caption" themeColor="textSecondary">
            Carico consigliato per iniziare: {exercise.suggestedKg}kg. Registralo man mano che progredisci.
          </ThemedText>
        ) : (
          <ThemedText type="caption" themeColor="textSecondary">
            Esercizio a corpo libero — aggiungi un carico se lo appesantisci.
          </ThemedText>
        )}

        <View style={styles.footerRow}>
          {loggedTodayKg != null ? (
            <ThemedText type="caption" themeColor="textSecondary">
              Aggiornato oggi: {loggedTodayKg}kg
            </ThemedText>
          ) : (
            <View />
          )}
          <Pressable onPress={() => setLoadModalOpen(true)} style={[styles.newLoadButton, { backgroundColor: theme.accent }]}>
            <Icon name="addCircle" size={16} color={theme.onAccent} />
            <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
              Nuovo carico
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <ExerciseInfoModal
        visible={infoOpen}
        exerciseName={exercise.name}
        media={media}
        onClose={() => setInfoOpen(false)}
      />

      <NewLoadModal
        visible={loadModalOpen}
        exerciseName={exercise.name}
        defaultReps={startingReps}
        defaultWeightKg={referenceKg != null ? String(referenceKg) : ''}
        onClose={() => setLoadModalOpen(false)}
        onSave={onAddLoad}
      />
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
    <Pressable onPress={onToggle} hitSlop={8} style={styles.checkButton}>
      <Animated.View
        style={[
          styles.checkCircle,
          {
            backgroundColor: completed ? theme.accent : 'transparent',
            borderColor: completed ? theme.accent : theme.borderStrong,
          },
          animatedStyle,
        ]}>
        {completed ? <Icon name="check" size={18} color={theme.onAccent} /> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  checkButton: {
    paddingTop: 2,
  },
  checkCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
  },
  infoColumn: {
    flex: 1,
    gap: 6,
  },
  iconButton: {
    padding: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    gap: Spacing.two,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  newLoadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    marginLeft: 'auto',
  },
});
