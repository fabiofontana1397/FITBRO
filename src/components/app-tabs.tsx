import type { Href } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ChatFab } from '@/components/chat/chat-fab';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { SpringSnappy } from '@/constants/motion';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TAB_ITEMS: { name: string; href: Href; label: string; icon: IconName }[] = [
  { name: 'index', href: '/', label: 'Oggi', icon: 'home' },
  { name: 'training', href: '/training', label: 'Training', icon: 'training' },
  { name: 'nutrition', href: '/nutrition', label: 'Nutrizione', icon: 'nutrition' },
  { name: 'body', href: '/body', label: 'Corpo', icon: 'body' },
];

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <FloatingTabBar>
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

function FloatingTabBar({ children }: { children?: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.floatWrapper,
        { paddingBottom: Platform.select({ web: Spacing.four, default: insets.bottom || Spacing.three }) },
        { pointerEvents: 'box-none' },
      ]}>
      <View style={styles.row}>
        <GlassSurface level="raised" radius={Radius.xlarge} style={styles.bar}>
          <View style={styles.barRow}>{children}</View>
        </GlassSurface>
        <ChatFab />
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
    gap: Spacing.two,
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
