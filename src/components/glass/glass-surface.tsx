import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type GlassLevel = 'subtle' | 'card' | 'raised' | 'overlay';

const LEVEL_INTENSITY: Record<GlassLevel, number> = {
  subtle: 26,
  card: 42,
  raised: 60,
  overlay: 82,
};

const LEVEL_SHADOW: Record<GlassLevel, { opacity: number; radius: number; offsetY: number }> = {
  subtle: { opacity: 0.08, radius: 10, offsetY: 3 },
  card: { opacity: 0.16, radius: 18, offsetY: 7 },
  raised: { opacity: 0.22, radius: 26, offsetY: 11 },
  overlay: { opacity: 0.32, radius: 36, offsetY: 16 },
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

  // A brighter specular band along the top edge fading into a soft wash,
  // the way light catches the top of a curved glass surface.
  const gradientColors = isDark
    ? (['rgba(255,255,255,0.24)', 'rgba(255,255,255,0.07)', 'rgba(255,255,255,0.02)'] as const)
    : (['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0.18)'] as const);
  const gradientLocations = [0, 0.18, 1] as const;

  const shadow = LEVEL_SHADOW[level];

  return (
    <View
      style={[
        { borderRadius: radius, overflow: 'hidden' },
        Platform.select({
          // On web box-shadow isn't clipped by this same element's overflow,
          // so the shadow, blur-clip and border-radius can all live on one node.
          web: { boxShadow: `0px ${shadow.offsetY}px ${shadow.radius}px rgba(0,0,0,${shadow.opacity})` },
          default: null,
        }),
        style,
      ]}>
      <BlurView
        intensity={LEVEL_INTENSITY[level]}
        tint={isDark ? 'dark' : 'light'}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={gradientColors}
        locations={gradientLocations}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {bordered ? (
        // An absolute overlay (not a padded child) so the hairline always
        // traces the surface's true outer edge, even when `style` adds
        // padding — a padded sibling would otherwise shrink the border
        // inward, leaving a floating rectangle inside the card.
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderWidth: StyleSheet.hairlineWidth * 1.5,
              borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(14,14,17,0.10)',
              borderTopColor: isDark ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.9)',
            },
          ]}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
