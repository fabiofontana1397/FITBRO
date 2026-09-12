import type { Href } from 'expo-router';
import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
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
      <GlassSurface level="raised" radius={Radius.xlarge} style={styles.bar}>
        <View style={styles.barRow}>{children}</View>
      </GlassSurface>
    </View>
  );
}

function TabButton({ label, icon, isFocused, ...props }: TabTriggerSlotProps & { label: string; icon: IconName }) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textTertiary;

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <Icon name={icon} size={22} color={color} />
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
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  barRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 11,
  },
});
