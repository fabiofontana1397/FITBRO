import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sportIcon, sportMeta } from '@/lib/mock';
import { daysAgoISO } from '@/lib/mock/dates';
import type { Goal, Sport } from '@/lib/mock/types';
import { useAppStore } from '@/store/app-store';
import { useBodyStore } from '@/store/body-store';
import { useUserStore } from '@/store/user-store';

const GOALS: { value: Goal; label: string; description: string; icon: IconName }[] = [
  { value: 'muscle', label: 'Massa muscolare', description: 'Costruisci forza e volume', icon: 'gym' },
  { value: 'lean', label: 'Definizione', description: 'Riduci massa grassa mantenendo muscolo', icon: 'target' },
  { value: 'performance', label: 'Performance', description: 'Migliora nei tuoi sport', icon: 'bolt' },
  { value: 'endurance', label: 'Endurance', description: 'Resistenza cardio a lungo termine', icon: 'running' },
  { value: 'health', label: 'Salute generale', description: 'Benessere e costanza', icon: 'heart' },
];

const SPORTS: Sport[] = ['gym', 'functional', 'running', 'swimming', 'tennis', 'cycling', 'other'];

const STEP_COUNT = 4;

export default function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setGoalAndSports = useUserStore((s) => s.setGoalAndSports);
  const setStartingStats = useUserStore((s) => s.setStartingStats);
  const resetStartingWeight = useBodyStore((s) => s.resetStartingWeight);

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [sports, setSports] = useState<Sport[]>(['gym', 'running']);
  const [heightCm, setHeightCm] = useState('180');
  const [currentWeightKg, setCurrentWeightKg] = useState('80');
  const [targetWeightKg, setTargetWeightKg] = useState('75');

  const toggleSport = (sport: Sport) =>
    setSports((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));

  const statsValid =
    Number(heightCm) > 0 && Number(currentWeightKg) > 0 && Number(targetWeightKg) > 0;

  const canContinue = step === 0 ? goal != null : step === 1 ? sports.length > 0 : step === 2 ? statsValid : true;

  const onPrimaryPress = () => {
    if (step < STEP_COUNT - 1) {
      setStep(step + 1);
      return;
    }
    setGoalAndSports(goal ?? 'health', sports);
    setStartingStats(Number(heightCm), Number(targetWeightKg));
    resetStartingWeight(Number(currentWeightKg), daysAgoISO(0));
    completeOnboarding();
    router.replace('/');
  };

  return (
    <ScreenScroll contentContainerStyle={{ justifyContent: 'space-between', flex: 1 }}>
      <View style={{ gap: Spacing.five }}>
        <View style={styles.topRow}>
          {step > 0 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={8}>
              <Icon name="arrowBack" size={22} color={theme.text} />
            </Pressable>
          ) : (
            <View style={{ width: 22 }} />
          )}
          <View style={styles.dots}>
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === step ? theme.accent : theme.backgroundElement, width: i === step ? 22 : 8 },
                ]}
              />
            ))}
          </View>
          <View style={{ width: 22 }} />
        </View>

        {step === 0 && (
          <View style={{ gap: Spacing.four }}>
            <View style={{ gap: Spacing.one }}>
              <ThemedText type="display">Qual è il tuo obiettivo?</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Personalizziamo training e nutrizione in base a questo.
              </ThemedText>
            </View>
            <View style={{ gap: Spacing.three }}>
              {GOALS.map((option) => {
                const selected = goal === option.value;
                return (
                  <Pressable key={option.value} onPress={() => setGoal(option.value)}>
                    <GlassSurface
                      level={selected ? 'raised' : 'card'}
                      radius={Radius.large}
                      style={[styles.optionRow, selected && ({ borderColor: theme.accent } as any)]}>
                      <View style={styles.optionInner}>
                        <View style={[styles.optionIcon, { backgroundColor: theme.accentSoft }]}>
                          <Icon name={option.icon} size={20} color={theme.accent} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <ThemedText type="smallBold">{option.label}</ThemedText>
                          <ThemedText type="caption" themeColor="textSecondary">
                            {option.description}
                          </ThemedText>
                        </View>
                        {selected ? <Icon name="checkCircle" size={20} color={theme.accent} /> : null}
                      </View>
                    </GlassSurface>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={{ gap: Spacing.four }}>
            <View style={{ gap: Spacing.one }}>
              <ThemedText type="display">Che sport pratichi?</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Puoi selezionarne più di uno, aggiungerne altri in seguito.
              </ThemedText>
            </View>
            <View style={styles.sportsGrid}>
              {SPORTS.map((sport) => {
                const selected = sports.includes(sport);
                return (
                  <Pressable key={sport} onPress={() => toggleSport(sport)} style={styles.sportCell}>
                    <GlassSurface
                      level={selected ? 'raised' : 'card'}
                      radius={Radius.large}
                      style={[styles.sportCard, selected && ({ borderColor: theme.accent } as any)]}>
                      <View style={styles.sportCardInner}>
                        <Icon name={sportIcon[sport]} size={26} color={selected ? theme.accent : theme.textSecondary} />
                        <ThemedText type="caption" style={{ textAlign: 'center' }}>
                          {sportMeta[sport].label}
                        </ThemedText>
                      </View>
                    </GlassSurface>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ gap: Spacing.four }}>
            <View style={{ gap: Spacing.one }}>
              <ThemedText type="display">Da dove parti?</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Usiamo questi dati per calcolare i tuoi progressi verso l’obiettivo.
              </ThemedText>
            </View>
            <View style={{ gap: Spacing.three }}>
              <StatInput
                label="Altezza"
                unit="cm"
                value={heightCm}
                onChangeText={setHeightCm}
                theme={theme}
              />
              <StatInput
                label="Peso attuale"
                unit="kg"
                value={currentWeightKg}
                onChangeText={setCurrentWeightKg}
                theme={theme}
              />
              <StatInput
                label="Peso obiettivo"
                unit="kg"
                value={targetWeightKg}
                onChangeText={setTargetWeightKg}
                theme={theme}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={{ gap: Spacing.four }}>
            <View style={{ gap: Spacing.one }}>
              <ThemedText type="display">Tutto pronto</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Ecco il tuo profilo iniziale. Potrai modificarlo in qualsiasi momento.
              </ThemedText>
            </View>
            <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.three, gap: Spacing.three }}>
              <SummaryRow label="Obiettivo" value={GOALS.find((g) => g.value === goal)?.label ?? '—'} />
              <SummaryRow label="Sport" value={sports.map((s) => sportMeta[s].label).join(', ')} />
              <SummaryRow label="Altezza" value={`${heightCm} cm`} />
              <SummaryRow label="Peso attuale → obiettivo" value={`${currentWeightKg} kg → ${targetWeightKg} kg`} />
            </GlassSurface>
          </View>
        )}
      </View>

      <PrimaryButton
        label={step < STEP_COUNT - 1 ? 'Continua' : 'Inizia il tuo percorso'}
        onPress={onPrimaryPress}
        disabled={!canContinue}
        style={{ marginTop: Spacing.five }}
      />
    </ScreenScroll>
  );
}

function StatInput({
  label,
  unit,
  value,
  onChangeText,
  theme,
}: {
  label: string;
  unit: string;
  value: string;
  onChangeText: (text: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <GlassSurface level="card" radius={Radius.large}>
      <View style={styles.statInputRow}>
        <ThemedText type="small" style={{ flex: 1 }}>
          {label}
        </ThemedText>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          style={[styles.statInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        <ThemedText type="caption" themeColor="textSecondary">
          {unit}
        </ThemedText>
      </View>
    </GlassSurface>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
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
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  sportCell: {
    width: '30%',
  },
  sportCard: {
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sportCardInner: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  statInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  statInput: {
    width: 72,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    fontSize: 15,
    textAlign: 'right',
  },
});
