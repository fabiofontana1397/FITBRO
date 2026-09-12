import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { QuestionBlock } from '@/components/onboarding/question-block';
import { StepProgress } from '@/components/onboarding/step-progress';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ACTIVITY_TO_SPORT, ONBOARDING_STEPS } from '@/lib/questionnaire/schema';
import { computeNutritionTargets } from '@/lib/nutrition/targets';
import { daysAgoISO } from '@/lib/mock/dates';
import type { Goal, Sex, Sport } from '@/lib/mock/types';
import { useAppStore } from '@/store/app-store';
import { useBodyStore } from '@/store/body-store';
import { useOnboardingStore, type AnswerValue } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';

function isAnswered(value: AnswerValue): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

export default function OnboardingScreen() {
  const theme = useTheme();
  const answers = useOnboardingStore((s) => s.answers);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const finalizeOnboarding = useUserStore((s) => s.finalizeOnboarding);
  const resetStartingWeight = useBodyStore((s) => s.resetStartingWeight);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [screenIndex, setScreenIndex] = useState(0);
  const isResultsScreen = screenIndex === ONBOARDING_STEPS.length;
  const step = isResultsScreen ? null : ONBOARDING_STEPS[screenIndex];

  const canContinue = useMemo(() => {
    if (!step) return true;
    return step.questions.every((q) => q.optional || isAnswered(answers[q.id]));
  }, [step, answers]);

  const results = useMemo(() => {
    if (!isResultsScreen) return null;
    return computeNutritionTargets({
      sex: (answers.sex as Sex) ?? 'unspecified',
      ageRange: (answers.ageRange as string) ?? '25-34',
      heightCm: Number(answers.heightCm) || 180,
      currentWeightKg: Number(answers.currentWeightKg) || 80,
      goal: (answers.goal as Goal) ?? 'generalHealth',
      jobActivity: answers.jobActivity as string,
      trainingFrequency: answers.currentFrequency as string,
    });
  }, [isResultsScreen, answers]);

  const goNext = () => {
    if (screenIndex < ONBOARDING_STEPS.length) {
      setScreenIndex(screenIndex + 1);
    }
  };

  const goBack = () => {
    if (screenIndex > 0) setScreenIndex(screenIndex - 1);
  };

  const finish = () => {
    if (!results) return;
    const activitiesPracticed = (answers.activitiesPracticed as string[]) ?? [];
    const sports = [...new Set(activitiesPracticed.map((a) => ACTIVITY_TO_SPORT[a]).filter(Boolean))] as Sport[];

    finalizeOnboarding({
      goal: (answers.goal as Goal) ?? 'generalHealth',
      sports: sports.length > 0 ? sports : ['gym'],
      sex: (answers.sex as Sex) ?? 'unspecified',
      ageRange: (answers.ageRange as string) ?? '25-34',
      heightCm: Number(answers.heightCm) || 180,
      targetWeightKg: Number(answers.targetWeightKg) || 75,
      dailyCalorieTarget: results.dailyCalorieTarget,
      macroTargetsG: results.macroTargetsG,
      hydrationTargetMl: results.hydrationTargetMl,
    });
    resetStartingWeight(Number(answers.currentWeightKg) || 80, daysAgoISO(0));
    completeOnboarding();
    router.replace('/');
  };

  return (
    <ScreenScroll contentContainerStyle={{ justifyContent: 'space-between', flex: 1 }}>
      <View style={{ gap: Spacing.five }}>
        {!isResultsScreen && step ? (
          <>
            <StepProgress
              stepIndex={screenIndex}
              stepCount={ONBOARDING_STEPS.length}
              stepTitle={step.title}
              onBack={screenIndex > 0 ? goBack : undefined}
            />
            <View style={{ gap: Spacing.one }}>
              <ThemedText type="display">{step.title}</ThemedText>
              {step.subtitle ? (
                <ThemedText type="default" themeColor="textSecondary">
                  {step.subtitle}
                </ThemedText>
              ) : null}
            </View>
            {step.banner ? (
              <GlassSurface level="subtle" radius={Radius.large} style={styles.banner}>
                <Icon name="alert" size={18} color={theme.warning} />
                <ThemedText type="caption" style={{ flex: 1 }}>
                  {step.banner}
                </ThemedText>
              </GlassSurface>
            ) : null}
            <View style={{ gap: Spacing.four }}>
              {step.questions.map((question) => (
                <QuestionBlock
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={(value) => setAnswer(question.id, value)}
                />
              ))}
            </View>
          </>
        ) : results ? (
          <View style={{ gap: Spacing.four }}>
            <View style={{ gap: Spacing.one }}>
              <ThemedText type="label" themeColor="textSecondary">
                Piano personalizzato ✓
              </ThemedText>
              <ThemedText type="display">Ecco il tuo profilo</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Calcolato dalle tue risposte. Potrai affinarlo nel tempo in base ai tuoi progressi reali.
              </ThemedText>
            </View>
            <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four, gap: Spacing.three }}>
              <ResultRow label="Metabolismo basale (BMR)" value={`${results.bmr} kcal`} />
              <ResultRow label="Fabbisogno totale (TDEE)" value={`${results.tdee} kcal`} />
              <ResultRow label="Target calorico giornaliero" value={`${results.dailyCalorieTarget} kcal`} highlight />
              <ResultRow label="Proteine" value={`${results.macroTargetsG.protein} g`} />
              <ResultRow label="Carboidrati" value={`${results.macroTargetsG.carbs} g`} />
              <ResultRow label="Grassi" value={`${results.macroTargetsG.fats} g`} />
              <ResultRow label="Idratazione" value={`${(results.hydrationTargetMl / 1000).toFixed(1)} L`} />
            </GlassSurface>
          </View>
        ) : null}
      </View>

      <PrimaryButton
        label={isResultsScreen ? 'Vai alla dashboard' : 'Continua'}
        onPress={isResultsScreen ? finish : goNext}
        disabled={!canContinue}
        style={{ marginTop: Spacing.five }}
      />
    </ScreenScroll>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.resultRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type={highlight ? 'subtitle' : 'smallBold'} style={highlight ? { color: theme.accent } : undefined}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
});
