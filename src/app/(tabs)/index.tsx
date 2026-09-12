import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { InsightCard } from '@/components/ui/insight-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { insights, sportIcon, sportMeta, todaysMeals, totalsFor, currentUser, workouts } from '@/lib/mock';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function HomeScreen() {
  const theme = useTheme();
  const todaysWorkout = workouts.find((w) => w.planned && !w.completed) ?? workouts[0];
  const mealsTotals = totalsFor(todaysMeals);
  const nutritionProgress = Math.min(mealsTotals.calories / currentUser.dailyCalorieTarget, 1);
  const trainingProgress = todaysWorkout.completed ? 1 : 0.35;
  const readinessProgress = 0.82;
  const heroInsight = insights[0];

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow={`${greeting()}`} title={currentUser.name} />

      <View style={styles.ringsRow}>
        <RingStat
          label="Training"
          value={todaysWorkout.completed ? 'Fatto' : `${Math.round(trainingProgress * 100)}%`}
          progress={trainingProgress}
          icon="training"
          color={theme.accent}
        />
        <RingStat
          label="Nutrizione"
          value={`${Math.round(nutritionProgress * 100)}%`}
          progress={nutritionProgress}
          icon="nutrition"
          color={theme.success}
        />
        <RingStat
          label="Recovery"
          value={`${Math.round(readinessProgress * 100)}%`}
          progress={readinessProgress}
          icon="heart"
          color={theme.warning}
        />
      </View>

      <View>
        <SectionHeader title="Piano di oggi" action="Vedi training" onActionPress={() => router.push('/training')} />
        <GlassSurface level="card" radius={Radius.large}>
          <Pressable style={styles.planRow} onPress={() => router.push('/training')}>
            <View style={[styles.sportBadge, { backgroundColor: theme.accentSoft }]}>
              <Icon name={sportIcon[todaysWorkout.sport]} size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="smallBold">{todaysWorkout.title}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {sportMeta[todaysWorkout.sport].label} · {todaysWorkout.durationMin} min ·{' '}
                {todaysWorkout.completed ? 'Completato' : 'Pianificato'}
              </ThemedText>
            </View>
            <Icon name="chevronRight" size={18} color={theme.textTertiary} />
          </Pressable>
        </GlassSurface>
      </View>

      <View>
        <SectionHeader title="Nutrizione di oggi" action="Dettagli" onActionPress={() => router.push('/nutrition')} />
        <View style={styles.statsRow}>
          <StatTile
            label="Calorie"
            value={`${mealsTotals.calories}`}
            unit={`/ ${currentUser.dailyCalorieTarget} kcal`}
          />
          <StatTile label="Proteine" value={`${mealsTotals.proteinG}`} unit={`/ ${currentUser.macroTargetsG.protein} g`} />
        </View>
      </View>

      <View>
        <SectionHeader title="Insight" />
        <InsightCard tone={heroInsight.tone} headline={heroInsight.headline} body={heroInsight.body} />
      </View>

      <PrimaryButton label="Registra un allenamento" icon="plus" onPress={() => router.push('/training')} />
    </ScreenScroll>
  );
}

function RingStat({
  label,
  value,
  progress,
  icon,
  color,
}: {
  label: string;
  value: string;
  progress: number;
  icon: Parameters<typeof Icon>[0]['name'];
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.ringCol}>
      <ProgressRing size={76} strokeWidth={8} progress={progress} color={color} trackColor={theme.backgroundElement}>
        <Icon name={icon} size={20} color={color} />
      </ProgressRing>
      <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ringCol: {
    alignItems: 'center',
    flex: 1,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  sportBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
});
