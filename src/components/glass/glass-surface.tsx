import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type GlassLevel = 'subtle' | 'card' | 'raised' | 'overlay';

const LEVEL_INTENSITY: Record<GlassLevel, number> = {
  subtle: 22,
  card: 38,
  raised: 55,
  overlay: 78,
};

export type GlassSurfaceProps = {
  level?: GlassLevel;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  bordered?: boolean;
};

/**
 * The app's Liquid-Glass building block: a blurred, gradient-lit, hairline
 * -bordered surface used for cards, sheets, tab bars and modals. Depth is
 * expressed through `level`, not through ad-hoc opacity tweaks, so every
 * glass surface in the app reads as one coherent material.
 */
export function GlassSurface({
  level = 'card',
  radius = Radius.large,
  style,
  children,
  bordered = true,
}: GlassSurfaceProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const gradientColors = isDark
    ? (['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)'] as const)
    : (['rgba(255,255,255,0.65)', 'rgba(255,255,255,0.20)'] as const);

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <BlurView
        intensity={LEVEL_INTENSITY[level]}
        tint={isDark ? 'dark' : 'light'}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.content,
          bordered && {
            borderRadius: radius,
            borderWidth: StyleSheet.hairlineWidth * 1.5,
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(14,14,17,0.10)',
          },
        ]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
