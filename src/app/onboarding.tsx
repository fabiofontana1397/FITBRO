import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sportIcon, sportMeta } from '@/lib/mock';
import type { Goal, Sport } from '@/lib/mock/types';
import { useAppStore } from '@/store/app-store';

const GOALS: { value: Goal; label: string; description: string; icon: IconName }[] = [
  { value: 'muscle', label: 'Massa muscolare', description: 'Costruisci forza e volume', icon: 'gym' },
  { value: 'lean', label: 'Definizione', description: 'Riduci massa grassa mantenendo muscolo', icon: 'target' },
  { value: 'performance', label: 'Performance', description: 'Migliora nei tuoi sport', icon: 'bolt' },
  { value: 'endurance', label: 'Endurance', description: 'Resistenza cardio a lungo termine', icon: 'running' },
  { value: 'health', label: 'Salute generale', description: 'Benessere e costanza', icon: 'heart' },
];

const SPORTS: Sport[] = ['gym', 'functional', 'running', 'swimming', 'tennis', 'cycling', 'other'];

export default function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [sports, setSports] = useState<Sport[]>(['gym', 'running']);

  const toggleSport = (sport: Sport) =>
    setSports((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));

  const canContinue = step === 0 ? goal != null : step === 1 ? sports.length > 0 : true;

  const onPrimaryPress = () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    completeOnboarding(goal ?? 'health', sports);
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
            {[0, 1, 2].map((i) => (
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
                      style={[styles.optionRow, selected && { borderColor: theme.accent } as any]}>
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
                      style={[styles.sportCard, selected && { borderColor: theme.accent } as any]}>
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
              <ThemedText type="display">Tutto pronto</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Ecco il tuo profilo iniziale. Potrai modificarlo in qualsiasi momento.
              </ThemedText>
            </View>
            <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.three, gap: Spacing.three }}>
              <SummaryRow label="Obiettivo" value={GOALS.find((g) => g.value === goal)?.label ?? '—'} />
              <SummaryRow label="Sport" value={sports.map((s) => sportMeta[s].label).join(', ')} />
            </GlassSurface>
          </View>
        )}
      </View>

      <PrimaryButton
        label={step < 2 ? 'Continua' : 'Inizia il tuo percorso'}
        onPress={onPrimaryPress}
        disabled={!canContinue}
        style={{ marginTop: Spacing.five }}
      />
    </ScreenScroll>
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
});
