import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StepProgressProps = {
  stepIndex: number; // 0-based
  stepCount: number;
  stepTitle: string;
  onBack?: () => void;
};

export function StepProgress({ stepIndex, stepCount, stepTitle, onBack }: StepProgressProps) {
  const theme = useTheme();
  const progress = (stepIndex + 1) / stepCount;

  return (
    <View style={{ gap: Spacing.two }}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8}>
            <Icon name="arrowBack" size={20} color={theme.text} />
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
        <ThemedText type="label" themeColor="textSecondary">
          {stepTitle} · {stepIndex + 1}/{stepCount}
        </ThemedText>
        <View style={{ width: 20 }} />
      </View>
      <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  track: {
    height: 5,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
