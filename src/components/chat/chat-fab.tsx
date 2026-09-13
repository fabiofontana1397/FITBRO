import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The AI-coach entry point. Kept as an independent overlay (not nested
 * inside AppTabs' <TabList>) — expo-router/ui resolves any tap within a
 * TabList's asChild subtree to "nearest known tab route", so a tab-bar-
 * internal chat button silently navigated to a tab instead of opening chat.
 * Its bottom offset matches the floating tab bar's own (see app-tabs.tsx's
 * floatWrapper), so it still docks visually at the same level, to its
 * right, without sharing its surface or its tap-resolution subtree. */
export function ChatFab() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.select({ web: Spacing.four, default: insets.bottom || Spacing.three });

  return (
    <Pressable
      onPress={() => router.push('/chat')}
      style={[styles.wrapper, { bottom: bottomOffset }]}
      hitSlop={8}>
      <GlassSurface level="raised" radius={Radius.pill} style={styles.button} bordered={false}>
        <Icon name="chatBubble" size={22} color={theme.accent} />
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: Spacing.three,
    zIndex: 10,
  },
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
