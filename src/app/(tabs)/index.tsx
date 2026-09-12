import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { InsightCard } from '@/components/ui/insight-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Icon, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysAgoISO, mondayIndex } from '@/lib/mock/dates';
import { sportIcon, sportMeta } from '@/lib/mock/training';
import { currentUser } from '@/lib/mock/user';
import { insights } from '@/lib/mock/progress';
import { sumMacros, useNutritionStore } from '@/store/nutrition-store';
import { isTemplateLoggedOnDate, templateById, useTrainingStore } from '@/store/training-store';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function HomeScreen() {
  const theme = useTheme();
  const today = daysAgoISO(0);
  const { plan, templates, logs } = useTrainingStore();
  const nutritionEntries = useNutritionStore((s) => s.entries);

  const planIndex = mondayIndex(new Date());
  const planDay = plan[planIndex];
  const template = planDay.type === 'workout' ? templateById(templates, planDay.templateId) : undefined;
  const workoutDone = planDay.type === 'workout' && isTemplateLoggedOnDate(logs, planDay.templateId, today);

  const todaysTotals = sumMacros(nutritionEntries.filter((e) => e.date === today));
  const nutritionProgress = Math.min(todaysTotals.kcal / currentUser.dailyCalorieTarget, 1);
  const trainingProgress = planDay.type === 'rest' ? 1 : workoutDone ? 1 : 0.25;
  const readinessProgress = 0.82;
  const heroInsight = insights[0];

  const planIcon: IconName = planDay.type === 'workout' ? 'gym' : planDay.type === 'cardio' ? sportIcon[planDay.sport] : 'moon';
  const planTitle = planDay.type === 'workout' ? template?.title ?? 'Allenamento' : planDay.type === 'cardio' ? planDay.label : 'Giorno di riposo';
  const planSubtitle =
    planDay.type === 'workout'
      ? `${sportMeta.gym.label} · ${workoutDone ? 'Completato' : 'Pianificato'}`
      : planDay.type === 'cardio'
        ? `${sportMeta[planDay.sport].label} · ${planDay.durationMin} min`
        : 'Recupero attivo';

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow={`${greeting()}`} title={currentUser.name} />

      <View style={styles.ringsRow}>
        <RingStat
          label="Training"
          value={trainingProgress >= 1 ? 'Fatto' : `${Math.round(trainingProgress * 100)}%`}
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
              <Icon name={planIcon} size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="smallBold">{planTitle}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {planSubtitle}
              </ThemedText>
            </View>
            <Icon name="chevronRight" size={18} color={theme.textTertiary} />
          </Pressable>
        </GlassSurface>
      </View>

      <View>
        <SectionHeader title="Nutrizione di oggi" action="Dettagli" onActionPress={() => router.push('/nutrition')} />
        <View style={styles.statsRow}>
          <StatTile label="Calorie" value={`${Math.round(todaysTotals.kcal)}`} unit={`/ ${currentUser.dailyCalorieTarget} kcal`} />
          <StatTile label="Proteine" value={`${Math.round(todaysTotals.protein)}`} unit={`/ ${currentUser.macroTargetsG.protein} g`} />
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
  icon: IconName;
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
