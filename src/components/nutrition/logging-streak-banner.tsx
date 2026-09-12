import { StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LoggingStreakInfo } from '@/store/nutrition-store';

export function LoggingStreakBanner({ streak, gapDays }: LoggingStreakInfo) {
  const theme = useTheme();

  if (streak > 0) {
    return (
      <GlassSurface level="subtle" radius={Radius.pill} style={styles.wrapper}>
        <View style={styles.row}>
          <Icon name="flame" size={16} color={theme.accent} />
          <ThemedText type="caption" style={{ flex: 1 }}>
            Serie di <ThemedText type="caption" style={{ fontWeight: '700', color: theme.accent }}>{streak}</ThemedText>{' '}
            {streak === 1 ? 'giorno' : 'giorni'} di fila con alimenti registrati
          </ThemedText>
        </View>
      </GlassSurface>
    );
  }

  if (gapDays > 0) {
    return (
      <GlassSurface level="subtle" radius={Radius.pill} style={styles.wrapper}>
        <View style={styles.row}>
          <Icon name="alert" size={16} color={theme.warning} />
          <ThemedText type="caption" style={{ flex: 1 }}>
            Sono passati <ThemedText type="caption" style={{ fontWeight: '700', color: theme.warning }}>{gapDays}</ThemedText>{' '}
            {gapDays === 1 ? 'giorno' : 'giorni'} dall’ultima registrazione
          </ThemedText>
          <Icon name="info" size={16} color={theme.textTertiary} />
        </View>
      </GlassSurface>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
