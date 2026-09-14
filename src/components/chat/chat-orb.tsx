import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type Petal = { colors: [string, string, string]; duration: number; direction: 1 | -1; baseAngle: number };

// Three oversized, soft-edged "petals" at 0/120/240° like a flower, each
// its own hue, each spinning at its own speed/direction — the interference
// between them (not a single rotating image), then blurred by the BlurView
// on top, is what turns flat shapes into the soft glowing-plasma look of
// the reference photo rather than a flat graphic flower. Each petal is
// concentric rings of the SAME hue shading from dim at the edge to a
// bright near-white core, not a flat fill — a real radial gradient rather
// than a linear one, so it reads as soft light regardless of the angle
// it's currently rotated to.
const PETALS: Petal[] = [
  { colors: ['#FF2D6B', '#FF9FB8', '#FFE3EC'], duration: 9000, direction: 1, baseAngle: 20 },
  { colors: ['#0BA37A', '#5EEFC7', '#E3FFF6'], duration: 13000, direction: -1, baseAngle: 140 },
  { colors: ['#4B3FD9', '#B39BFF', '#F0EBFF'], duration: 17000, direction: 1, baseAngle: 260 },
];

// Ring sizes (fraction of the blob) and opacities shared by every petal —
// biggest/dimmest ring outermost, smallest/brightest innermost, so each
// blob reads as a soft radial glow rather than a flat-filled oval.
const RING_SCALES = [1, 0.72, 0.42];
const RING_OPACITIES = [0.32, 0.58, 0.85];

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
      <View style={{ position: 'absolute', width: blobSize, height: blobSize, top: -blobSize * 0.32, alignItems: 'center', justifyContent: 'center' }}>
        {RING_SCALES.map((scale, i) => {
          const ringSize = blobSize * scale;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: ringSize,
                height: ringSize,
                borderRadius: ringSize / 2,
                backgroundColor: petal.colors[i],
                opacity: RING_OPACITIES[i],
              }}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

// Same dim-edge/bright-core ring trick as the petals, in white, with more
// steps for an especially smooth falloff — this is the sphere's one crisp
// focal point, so it needs to read as gradual light, not a flat disc.
const CORE_RING_SCALES = [1, 0.8, 0.62, 0.44, 0.26];
const CORE_RING_OPACITIES = [0.1, 0.22, 0.4, 0.65, 1];

function CoreGlow({ size }: { size: number }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.8, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.88, 1.06]) }],
  }));

  const coreSize = size * 0.52;

  return (
    <Animated.View pointerEvents="none" style={[styles.layer, style]}>
      {CORE_RING_SCALES.map((scale, i) => {
        const ringSize = coreSize * scale;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              backgroundColor: '#ffffff',
              opacity: CORE_RING_OPACITIES[i],
            }}
          />
        );
      })}
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
