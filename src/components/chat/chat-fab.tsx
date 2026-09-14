import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const DEFAULT_SIZE = 48;

/** The AI-coach entry point. Kept as an independent overlay (not nested
 * inside AppTabs' <TabList>) — expo-router/ui resolves any tap within a
 * TabList's asChild subtree to "nearest known tab route", so a tab-bar-
 * internal chat button silently navigated to a tab instead of opening chat.
 * Its bottom offset matches the floating tab bar's own (see app-tabs.tsx's
 * floatWrapper), so it still docks visually at the same level, to its
 * right, without sharing its surface or its tap-resolution subtree.
 *
 * `size` is the tab bar's own measured height (see _layout.tsx), so the
 * button always stands exactly as tall as the bar beside it — width tracks
 * height 1:1 (rather than a fixed 48) so it stays a perfect circle instead
 * of stretching into an oval whenever the bar's height changes. */
export function ChatFab({ size }: { size?: number | null }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.select({ web: Spacing.four, default: insets.bottom || Spacing.three });
  const buttonSize = size ?? DEFAULT_SIZE;
  const iconSize = Math.round(buttonSize * 0.46);

  return (
    <Pressable
      onPress={() => router.push('/chat')}
      style={[styles.wrapper, { bottom: bottomOffset }]}
      hitSlop={8}>
      <GlassSurface
        level="raised"
        radius={Radius.pill}
        style={[styles.button, { width: buttonSize, height: buttonSize }]}
        bordered={false}>
        <Icon name="chatBubble" size={iconSize} color={theme.accent} />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
