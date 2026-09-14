import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type Petal = { colors: [string, string]; duration: number; direction: 1 | -1; baseAngle: number; width: number; height: number };

// Three overlapping "petals" at 0/120/240° like a flower, each its own hue,
// each spinning at its own speed/direction — the interference between them
// (not a single rotating image) is what reads as a living plasma sphere,
// closest to the reference photo's swirling multi-color core.
const PETALS: Petal[] = [
  { colors: ['#FF3B6E', '#FF9AA8'], duration: 9000, direction: 1, baseAngle: 0, width: 0.95, height: 0.56 },
  { colors: ['#18E0B8', '#0BA37A'], duration: 13000, direction: -1, baseAngle: 120, width: 0.95, height: 0.56 },
  { colors: ['#3D5AFE', '#9B4DFF'], duration: 16000, direction: 1, baseAngle: 240, width: 0.95, height: 0.56 },
];

/** A small "living" AI entity standing in for a literal chat-bubble icon:
 * a dark glass sphere with three colored petals swirling independently
 * around a pulsing white core, never settling into a static image. */
export function ChatOrb({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#0b0c1e' }}>
      {PETALS.map((petal, i) => (
        <PetalLayer key={i} petal={petal} size={size} />
      ))}
      <CoreGlow size={size} />
      <View
        pointerEvents="none"
        style={[styles.rim, { borderRadius: size / 2, borderColor: 'rgba(255,255,255,0.28)' }]}
      />
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

  return (
    <Animated.View style={[styles.layer, style]}>
      <LinearGradient
        colors={petal.colors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          width: size * petal.width,
          height: size * petal.height,
          borderRadius: (size * petal.height) / 2,
          opacity: 0.78,
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
    opacity: interpolate(pulse.value, [0, 1], [0.75, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.85, 1.05]) }],
  }));

  const coreSize = size * 0.42;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.layer,
        style,
        {
          shadowColor: '#ffffff',
          shadowOpacity: 0.9,
          shadowRadius: coreSize * 0.6,
          shadowOffset: { width: 0, height: 0 },
        },
        Platform.select({ web: { boxShadow: `0 0 ${coreSize * 0.7}px rgba(255,255,255,0.85)` } as object, default: null }),
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
  },
});
