import type { Href } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { SpringSnappy } from '@/constants/motion';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Matches ChatFab's own DEFAULT_SIZE fallback, used before the bar's real
// height has been measured for the very first frame.
const DEFAULT_BAR_HEIGHT = 48;

const TAB_ITEMS: { name: string; href: Href; label: string; icon: IconName }[] = [
  { name: 'index', href: '/', label: 'Oggi', icon: 'home' },
  { name: 'training', href: '/training', label: 'Training', icon: 'training' },
  { name: 'nutrition', href: '/nutrition', label: 'Nutrizione', icon: 'nutrition' },
  { name: 'body', href: '/body', label: 'Corpo', icon: 'body' },
];

export default function AppTabs({ onBarHeightChange }: { onBarHeightChange?: (height: number) => void }) {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <FloatingTabBar onBarHeightChange={onBarHeightChange}>
          {TAB_ITEMS.map((item) => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <TabButton label={item.label} icon={item.icon} />
            </TabTrigger>
          ))}
        </FloatingTabBar>
      </TabList>
    </Tabs>
  );
}

function FloatingTabBar({
  children,
  onBarHeightChange,
}: {
  children?: React.ReactNode;
  onBarHeightChange?: (height: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [barHeight, setBarHeight] = useState<number | null>(null);

  return (
    <View
      style={[
        styles.floatWrapper,
        { paddingBottom: Platform.select({ web: Spacing.four, default: insets.bottom || Spacing.three }) },
        { pointerEvents: 'box-none' },
      ]}>
      <View style={styles.row}>
        <GlassSurface
          level="overlay"
          radius={Radius.xlarge}
          style={styles.bar}
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;
            setBarHeight(height);
            onBarHeightChange?.(height);
          }}>
          <View style={styles.barRow}>{children}</View>
        </GlassSurface>
        {/* Reserves the room ChatFab occupies (see _layout.tsx) — the FAB
            itself is a fully independent overlay painted on top of this gap,
            not a sibling here, so tapping it can't be misrouted by TabList's
            own tap-resolution (see chat-fab.tsx for why that matters). Sized
            to the FAB's own footprint (it matches this same bar height) plus
            a visible gap, so the two never crowd or overlap each other. */}
        <View style={{ width: (barHeight ?? DEFAULT_BAR_HEIGHT) + Spacing.two }} />
      </View>
    </View>
  );
}

function TabButton({ label, icon, isFocused, ...props }: TabTriggerSlotProps & { label: string; icon: IconName }) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textTertiary;
  const focus = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focus.value = withSpring(isFocused ? 1 : 0, SpringSnappy);
  }, [isFocused, focus]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    transform: [{ scale: 0.7 + focus.value * 0.3 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focus.value * 0.16 }, { translateY: focus.value * -1.5 }],
  }));

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Animated.View style={[styles.focusPill, { backgroundColor: theme.accentSoft }, pillStyle]} />
      <Animated.View style={iconStyle}>
        <Icon name={icon} size={19} color={color} />
      </Animated.View>
      <ThemedText type="caption" style={[styles.tabLabel, { color }]} numberOfLines={1}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floatWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  bar: {
    flex: 1,
  },
  barRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  pressed: {
    opacity: 0.6,
  },
  focusPill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 6,
    right: 6,
    borderRadius: Radius.medium,
  },
  tabLabel: {
    fontSize: 10,
  },
});
