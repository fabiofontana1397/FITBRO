import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { Icon } from '@/components/ui/icon';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ChatFab() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.select({ web: Spacing.four, default: insets.bottom || Spacing.three }) + BottomTabInset + 64;

  return (
    <Pressable
      onPress={() => router.push('/chat')}
      style={[styles.wrapper, { bottom: bottomOffset }]}
      hitSlop={8}>
      <GlassSurface level="raised" radius={Radius.pill} style={styles.button} bordered={false}>
        <Icon name="chatBubble" size={26} color={theme.accent} />
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: Spacing.four,
    zIndex: 10,
  },
  button: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
