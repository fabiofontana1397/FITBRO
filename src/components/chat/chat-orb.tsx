import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type Petal = { colors: [string, string, string]; duration: number; direction: 1 | -1; baseAngle: number };

// Three oversized, soft-edged "petals" at 0/120/240° like a flower, each
// its own hue, each spinning at its own speed/direction — the interference
// between them (not a single rotating image), then blurred by the BlurView
// on top, is what turns flat shapes into the soft glowing-plasma look of
// the reference photo rather than a flat graphic flower.
const PETALS: Petal[] = [
  { colors: ['#FF2D6B', '#FF6F91', 'transparent'], duration: 9000, direction: 1, baseAngle: 20 },
  { colors: ['#0FD9A8', '#10B981', 'transparent'], duration: 13000, direction: -1, baseAngle: 140 },
  { colors: ['#5B4FE3', '#8B6FFF', 'transparent'], duration: 17000, direction: 1, baseAngle: 260 },
];

/** A small "living" AI entity standing in for a literal chat-bubble icon:
 * a dark glass sphere with three colored petals swirling independently
 * behind a soft blur (which is what fuses flat shapes into a diffuse glow),
 * around a pulsing white core — never settling into a static image. */
export function ChatOrb({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#090a1a' }}>
      {PETALS.map((petal, i) => (
        <PetalLayer key={i} petal={petal} size={size} />
      ))}
      <BlurView
        intensity={Platform.OS === 'web' ? 28 : 45}
        tint="dark"
        style={StyleSheet.absoluteFill}
        blurMethod="dimezisBlurViewSdk31Plus"
      />
      <CoreGlow size={size} />
      <View pointerEvents="none" style={[styles.rim, { borderRadius: size / 2 }]} />
    </View>
  );
}

function PetalLayer({ petal, size }: { petal: Petal; size: number }) {
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: petal.duration, easing: Easing.linear }), -1, false);
  }, [spin, petal.duration]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${petal.baseAngle + petal.direction * spin.value * 360}deg` }],
  }));

  // Bigger than the container and offset toward one edge (not centered) so
  // rotating it sweeps the color around the sphere rather than just fading
  // a centered blob in place.
  const blobSize = size * 1.35;

  return (
    <Animated.View style={[styles.layer, style]}>
      <LinearGradient
        colors={petal.colors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          width: blobSize,
          height: blobSize,
          borderRadius: blobSize / 2,
          top: -blobSize * 0.32,
          opacity: 0.85,
        }}
      />
    </Animated.View>
  );
}

function CoreGlow({ size }: { size: number }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.8, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.88, 1.06]) }],
  }));

  const coreSize = size * 0.3;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.layer,
        style,
        {
          shadowColor: '#ffffff',
          shadowOpacity: 1,
          shadowRadius: coreSize,
          shadowOffset: { width: 0, height: 0 },
        },
        Platform.select({ web: { boxShadow: `0 0 ${coreSize * 1.4}px rgba(255,255,255,0.95)` } as object, default: null }),
      ]}>
      <View style={{ width: coreSize, height: coreSize, borderRadius: coreSize / 2, backgroundColor: '#ffffff' }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
});
