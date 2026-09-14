import type { Href } from 'expo-router';
import { usePathname } from 'expo-router';
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
  const pathname = usePathname();
  const activeIndex = Math.max(
    TAB_ITEMS.findIndex((item) => item.href === pathname),
    0
  );

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <FloatingTabBar onBarHeightChange={onBarHeightChange} activeIndex={activeIndex}>
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
  activeIndex,
}: {
  children?: React.ReactNode;
  onBarHeightChange?: (height: number) => void;
  activeIndex: number;
}) {
  const insets = useSafeAreaInsets();
  const [barHeight, setBarHeight] = useState<number | null>(null);
  const [barWidth, setBarWidth] = useState<number | null>(null);

  return (
    <View
      style={[
        styles.floatWrapper,
        { paddingBottom: Platform.select({ web: Spacing.four, default: insets.bottom || Spacing.three }) },
        { pointerEvents: 'box-none' },
      ]}>
      <View style={styles.row}>
        {/* Unlike GlassSurface (which clips to its own rounded rect), this
            slot deliberately has no overflow:hidden — the glass "lens" for
            the selected tab needs to visibly poke above and below the bar's
            own edges, iOS Liquid-Glass style, not be trapped inside it. */}
        <View style={styles.barSlot}>
          <GlassSurface
            level="raised"
            radius={Radius.xlarge}
            style={StyleSheet.absoluteFill}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setBarHeight(height);
              setBarWidth(width);
              onBarHeightChange?.(height);
            }}
          />
          {barWidth != null && barHeight != null ? (
            <TabLens activeIndex={activeIndex} count={TAB_ITEMS.length} barWidth={barWidth} barHeight={barHeight} />
          ) : null}
          <View style={styles.barRow}>{children}</View>
        </View>
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

/** The selected tab's Liquid-Glass lens: a round glass bubble noticeably
 * taller than the bar itself, poking out above and below it — positioned
 * as a free-floating sibling (not clipped inside the bar's own rounded
 * rect) so it can actually overlap the bar's edge instead of being capped
 * at it, and sliding between tabs with a spring as the selection changes. */
function TabLens({ activeIndex, count, barWidth, barHeight }: { activeIndex: number; count: number; barWidth: number; barHeight: number }) {
  const lensSize = barHeight * 1.55;
  const targetX = ((activeIndex + 0.5) / count) * barWidth - lensSize / 2;
  const x = useSharedValue(targetX);

  useEffect(() => {
    x.value = withSpring(targetX, SpringSnappy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetX]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.lens,
        { width: lensSize, height: lensSize, borderRadius: lensSize / 2, top: (barHeight - lensSize) / 2 },
        style,
      ]}>
      <GlassSurface level="overlay" radius={lensSize / 2} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.lensSheen, { borderRadius: lensSize / 2 }]} />
    </Animated.View>
  );
}

function TabButton({ label, icon, isFocused, ...props }: TabTriggerSlotProps & { label: string; icon: IconName }) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textTertiary;
  const focus = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focus.value = withSpring(isFocused ? 1 : 0, SpringSnappy);
  }, [isFocused, focus]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focus.value * 0.2 }, { translateY: focus.value * -2 }],
  }));

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
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
  barSlot: {
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
  lens: {
    position: 'absolute',
    left: 0,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  lensSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  tabLabel: {
    fontSize: 10,
  },
});
