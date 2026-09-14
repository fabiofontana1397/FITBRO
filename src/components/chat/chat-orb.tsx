import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { BlurView } from 'expo-blur';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type Petal = { colors: [string, string, string]; duration: number; direction: 1 | -1; baseAngle: number };

// Three oversized, soft-edged "petals" at 0/120/240° like a flower, each
// its own shade of orange, each spinning at its own speed/direction — the
// interference between them (not a single rotating image), then blurred
// by the BlurView on top, is what turns flat shapes into the soft
// glowing-plasma look rather than a flat graphic flower. Each petal is
// concentric rings of the SAME hue shading from a rich orange at the edge
// to a pale warm cream at the center (never pure white) — a real radial
// gradient rather than a linear one, so it reads as soft light regardless
// of the angle it's currently rotated to.
const PETALS: Petal[] = [
  { colors: ['#FF7A33', '#FFC79B', '#FFE3C4'], duration: 5200, direction: 1, baseAngle: 20 },
  { colors: ['#FF5A1F', '#FFA35C', '#FFD9B0'], duration: 7400, direction: -1, baseAngle: 140 },
  { colors: ['#E6480F', '#FF8A46', '#FFE0BE'], duration: 9200, direction: 1, baseAngle: 260 },
];

// Ring sizes (fraction of the blob) and opacities shared by every petal —
// biggest/dimmest ring outermost, smallest/brightest innermost, so each
// blob reads as a soft radial glow rather than a flat-filled oval.
const RING_SCALES = [1, 0.72, 0.42];
const RING_OPACITIES = [0.34, 0.6, 0.88];

// How far (px) the whole petal group drifts toward the phone's tilt — a
// liquid-in-a-ball feel, on top of (not instead of) the petals' own
// constant spinning. Silently stays at rest wherever the accelerometer
// isn't available (web without permission, desktop, etc).
const TILT_RANGE = 10;

/** A small "living" AI entity standing in for a literal chat-bubble icon:
 * a warm orange glass sphere with three shades of orange swirling
 * independently behind a soft blur (which is what fuses flat shapes into
 * a diffuse glow) — never settling into a static image, and drifting
 * toward whichever way the phone is tilted. */
export function ChatOrb({ size }: { size: number }) {
  const { tiltX, tiltY } = useTiltShift();

  const tiltStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tiltX.value }, { translateY: tiltY.value }],
  }));

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#FF5A1F' }}>
      <Animated.View style={[styles.layer, tiltStyle]}>
        {PETALS.map((petal, i) => (
          <PetalLayer key={i} petal={petal} size={size} />
        ))}
      </Animated.View>
      <BlurView
        intensity={Platform.OS === 'web' ? 28 : 45}
        tint="light"
        style={StyleSheet.absoluteFill}
        blurMethod="dimezisBlurViewSdk31Plus"
      />
      <View pointerEvents="none" style={[styles.rim, { borderRadius: size / 2 }]} />
    </View>
  );
}

/** Reads the accelerometer's gravity vector (x/y, in g) and eases two
 * shared values toward it scaled to a small pixel range — the offset the
 * whole petal group drifts by. Subscribes only while mounted; if the
 * sensor never reports (unsupported platform, permission refused), the
 * values simply stay at 0 and the orb reads exactly as it would without
 * this feature. */
function useTiltShift() {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Accelerometer.isAvailableAsync()
      .then((isAvailable) => {
        if (cancelled || !isAvailable) return;
        Accelerometer.setUpdateInterval(100);
        subscriptionRef.current = Accelerometer.addListener(({ x, y }) => {
          tiltX.value = withTiming(Math.max(-1, Math.min(1, x)) * TILT_RANGE, { duration: 220 });
          tiltY.value = withTiming(Math.max(-1, Math.min(1, y)) * -TILT_RANGE, { duration: 220 });
        });
      })
      .catch(() => {
        // No accelerometer access (web without permission, unsupported
        // device) — the orb just keeps its base spin, no tilt drift.
      });

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { tiltX, tiltY };
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
