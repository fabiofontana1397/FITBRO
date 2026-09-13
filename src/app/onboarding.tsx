import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { QuestionBlock } from '@/components/onboarding/question-block';
import { StepProgress } from '@/components/onboarding/step-progress';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { FadeInView } from '@/components/ui/fade-in-view';
import { Icon, type IconName } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  ACTIVITY_TO_SPORT,
  buildActivityQuestions,
  isQuestionVisible,
  stepsForMode,
  type OnboardingMode,
  type OnboardingStep,
  type Question,
} from '@/lib/questionnaire/schema';
import { computeNutritionTargets, deriveWeeklyTrainingDays } from '@/lib/nutrition/targets';
import { daysAgoISO } from '@/lib/mock/dates';
import { sportIcon, sportMeta } from '@/lib/mock/training';
import type { Goal, Sex, Sport } from '@/lib/mock/types';
import { useBodyStore } from '@/store/body-store';
import { useOnboardingStore, type AnswerValue } from '@/store/onboarding-store';
import { useUserStore } from '@/store/user-store';

const MODE_OPTIONS: { value: OnboardingMode; label: string }[] = [
  { value: 'diet', label: 'Piano alimentare' },
  { value: 'training', label: 'Programma di allenamento' },
  { value: 'both', label: 'Entrambi' },
];

const AGE_LABEL: Record<string, string> = {
  lt18: 'Meno di 18',
  '18-24': '18–24',
  '25-34': '25–34',
  '35-44': '35–44',
  '45-54': '45–54',
  '55+': '55+',
};

const SEX_LABEL: Record<string, string> = {
  male: 'Uomo',
  female: 'Donna',
  unspecified: 'Non specificato',
};

const GOAL_LABEL: Record<Goal, string> = {
  loseFat: 'Perdere grasso',
  gainMuscle: 'Aumentare massa muscolare',
  maintainImprove: 'Mantenimento e forma fisica',
  gainStrength: 'Aumentare forza',
  improveEndurance: 'Migliorare resistenza',
  generalHealth: 'Salute generale',
};

function isAnswered(value: AnswerValue): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function getStepQuestions(step: OnboardingStep, answers: Record<string, AnswerValue>): Question[] {
  const questions =
    step.id === 'training'
      ? [...step.questions, ...buildActivityQuestions((answers.activitiesPracticed as string[]) ?? [])]
      : step.questions;
  return questions.filter((q) => isQuestionVisible(q, answers));
}

function sportsFromAnswers(answers: Record<string, AnswerValue>): Sport[] {
  const activitiesPracticed = (answers.activitiesPracticed as string[]) ?? [];
  return [...new Set(activitiesPracticed.map((a) => ACTIVITY_TO_SPORT[a]).filter(Boolean))] as Sport[];
}

export default function OnboardingScreen() {
  const theme = useTheme();
  const answers = useOnboardingStore((s) => s.answers);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const finalizeOnboarding = useUserStore((s) => s.finalizeOnboarding);
  const resetStartingWeight = useBodyStore((s) => s.resetStartingWeight);

  const [mode, setMode] = useState<OnboardingMode | null>((answers.mode as OnboardingMode) ?? null);
  const [screenIndex, setScreenIndex] = useState(0);

  const activeSteps = useMemo(() => (mode ? stepsForMode(mode) : []), [mode]);
  const isIntroScreen = screenIndex === 0;
  const isResultsScreen = mode != null && screenIndex === activeSteps.length + 1;
  const step = !isIntroScreen && !isResultsScreen ? activeSteps[screenIndex - 1] : null;
  const stepQuestions = useMemo(() => (step ? getStepQuestions(step, answers) : []), [step, answers]);
  const sports = useMemo(() => sportsFromAnswers(answers), [answers]);

  const canContinue = useMemo(() => {
    if (isIntroScreen) return mode != null;
    if (!step) return true;
    return stepQuestions.every((q) => q.optional || isAnswered(answers[q.id]));
  }, [isIntroScreen, mode, step, stepQuestions, answers]);

  const results = useMemo(() => {
    if (!isResultsScreen) return null;
    return computeNutritionTargets({
      sex: (answers.sex as Sex) ?? 'unspecified',
      ageRange: (answers.ageRange as string) ?? '25-34',
      heightCm: Number(answers.heightCm) || 180,
      currentWeightKg: Number(answers.currentWeightKg) || 80,
      goal: (answers.goal as Goal) ?? 'generalHealth',
      jobActivity: answers.jobActivity as string,
      weeklyTrainingDays: deriveWeeklyTrainingDays(answers),
    });
  }, [isResultsScreen, answers]);

  const selectMode = (value: OnboardingMode) => {
    setMode(value);
    setAnswer('mode', value);
  };

  const goNext = () => {
    if (isIntroScreen && mode == null) return;
    setScreenIndex(screenIndex + 1);
  };

  const goBack = () => {
    if (screenIndex > 0) setScreenIndex(screenIndex - 1);
  };

  const confirmProfile = () => {
    if (!results) return;

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
    router.push('/onboarding-created');
  };

  return (
    <ScreenScroll contentContainerStyle={{ justifyContent: 'space-between', flex: 1 }}>
      <View style={{ gap: Spacing.five }}>
        {isIntroScreen ? (
          <View style={{ gap: Spacing.four }}>
            <View style={{ gap: Spacing.two }}>
              <ThemedText type="display">Prima di iniziare</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Per costruirti un piano davvero su misura ti faremo qualche domanda sul tuo profilo, le tue abitudini e i
                tuoi obiettivi. Bastano pochi minuti e potrai rivedere le risposte in qualsiasi momento dal tuo profilo.
              </ThemedText>
            </View>
            <View style={{ gap: Spacing.two }}>
              <ThemedText type="smallBold">Cosa vuoi costruire con FITBRO?</ThemedText>
              <View style={{ gap: Spacing.three }}>
                {MODE_OPTIONS.map((option) => {
                  const selected = mode === option.value;
                  return (
                    <Pressable key={option.value} onPress={() => selectMode(option.value)}>
                      <GlassSurface
                        level={selected ? 'raised' : 'card'}
                        radius={Radius.large}
                        style={[styles.optionRow, selected && ({ borderColor: theme.accent } as any)]}>
                        <View style={styles.optionInner}>
                          <ThemedText type="smallBold" style={{ flex: 1 }}>
                            {option.label}
                          </ThemedText>
                          {selected ? <Icon name="checkCircle" size={20} color={theme.accent} /> : null}
                        </View>
                      </GlassSurface>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        ) : null}

        {step ? (
          <>
            <StepProgress
              stepIndex={screenIndex - 1}
              stepCount={activeSteps.length}
              stepTitle={step.title}
              onBack={goBack}
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
              {stepQuestions.map((question) => (
                <QuestionBlock
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={(value) => setAnswer(question.id, value)}
                />
              ))}
            </View>
          </>
        ) : null}

        {isResultsScreen && results ? (
          <View style={{ gap: Spacing.five }}>
            <View style={{ gap: Spacing.one }}>
              <ThemedText type="label" themeColor="textSecondary">
                Riepilogo
              </ThemedText>
              <ThemedText type="display">La tua scheda profilo</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Controlla i dati raccolti: sono la base su cui costruiamo il tuo piano su misura.
              </ThemedText>
            </View>

            <FadeInView delay={80}>
              <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four }}>
                <View style={styles.factsGrid}>
                  <FactTile
                    icon="target"
                    label="Obiettivo"
                    value={GOAL_LABEL[(answers.goal as Goal) ?? 'generalHealth']}
                  />
                  <FactTile
                    icon="scale"
                    label="Peso attuale → obiettivo"
                    value={`${answers.currentWeightKg ?? '–'} → ${answers.targetWeightKg ?? '–'} kg`}
                  />
                  <FactTile icon="ruler" label="Altezza" value={`${answers.heightCm ?? '–'} cm`} />
                  <FactTile
                    icon="calendar"
                    label="Età · Sesso"
                    value={`${AGE_LABEL[(answers.ageRange as string) ?? '25-34']} · ${SEX_LABEL[(answers.sex as string) ?? 'unspecified']}`}
                  />
                </View>
              </GlassSurface>
            </FadeInView>

            {sports.length > 0 ? (
              <FadeInView delay={160} style={{ gap: Spacing.two }}>
                <ThemedText type="smallBold">Attività</ThemedText>
                <View style={styles.sportsRow}>
                  {sports.map((sport) => (
                    <View key={sport} style={[styles.sportChip, { backgroundColor: theme.accentSoft }]}>
                      <Icon name={sportIcon[sport]} size={16} color={theme.accent} />
                      <ThemedText type="caption">{sportMeta[sport].label}</ThemedText>
                    </View>
                  ))}
                </View>
              </FadeInView>
            ) : null}

            <FadeInView delay={240}>
              <GlassSurface
                level="raised"
                radius={Radius.large}
                style={{ padding: Spacing.four, alignItems: 'center', gap: Spacing.four }}>
                <ProgressRing size={140} strokeWidth={12} progress={1} color={theme.accent} trackColor={theme.backgroundElement}>
                  <ThemedText type="title">{results.dailyCalorieTarget}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    kcal / giorno
                  </ThemedText>
                </ProgressRing>
                <View style={styles.macroRow}>
                  <MacroStat icon="protein" label="Proteine" value={results.macroTargetsG.protein} />
                  <MacroStat icon="carbs" label="Carboidrati" value={results.macroTargetsG.carbs} />
                  <MacroStat icon="fats" label="Grassi" value={results.macroTargetsG.fats} />
                </View>
                <ThemedText type="caption" themeColor="textSecondary">
                  Idratazione consigliata: {(results.hydrationTargetMl / 1000).toFixed(1)} L / giorno
                </ThemedText>
              </GlassSurface>
            </FadeInView>
          </View>
        ) : null}
      </View>

      <PrimaryButton
        label={isResultsScreen ? 'Conferma' : 'Continua'}
        onPress={isResultsScreen ? confirmProfile : goNext}
        disabled={!canContinue}
        style={{ marginTop: Spacing.five }}
      />
    </ScreenScroll>
  );
}

function FactTile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.factTile}>
      <View style={[styles.factIcon, { backgroundColor: theme.accentSoft }]}>
        <Icon name={icon} size={16} color={theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText type="caption" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="smallBold">{value}</ThemedText>
      </View>
    </View>
  );
}

function MacroStat({ icon, label, value }: { icon: IconName; label: string; value: number }) {
  const theme = useTheme();
  return (
    <View style={styles.macroStat}>
      <Icon name={icon} size={18} color={theme.accent} />
      <ThemedText type="smallBold">{value}g</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
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
  optionRow: {
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  factTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: '45%',
    flexGrow: 1,
  },
  factIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  macroStat: {
    alignItems: 'center',
    gap: 2,
  },
});
