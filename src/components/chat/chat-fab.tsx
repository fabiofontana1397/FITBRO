import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The AI-coach entry point, sitting outside the tab bar's own surface but
 * anchored in the same bottom row as it (see app-tabs.tsx) — external to
 * the bar, not one of its items, but still docked at its level. */
export function ChatFab() {
  const theme = useTheme();

  return (
    <Pressable onPress={() => router.push('/chat')} hitSlop={8}>
      <GlassSurface level="raised" radius={Radius.pill} style={styles.button} bordered={false}>
        <Icon name="chatBubble" size={22} color={theme.accent} />
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
