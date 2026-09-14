import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Petal = {
  /** Color stops the petal cycles through, first === last so the loop
   * wraps with no visible seam. The hue itself animates continuously —
   * this is what guarantees visible color movement no matter how the
   * blur/compositing behaves on a given platform, since earlier versions
   * relied on blurred shapes merely translating past each other, which on
   * some devices barely read as motion at all. */
  palette: string[];
  cycleDuration: number;
  cycleDelay: number;
  driftDuration: number;
  driftDirection: 1 | -1;
  driftPhase: number;
  driftFreqRatio: number;
};

const PETALS: Petal[] = [
  {
    palette: ['#4A1704', '#B23D0E', '#FF7A2E', '#FFC98A', '#B23D0E', '#4A1704'],
    cycleDuration: 5200,
    cycleDelay: 0,
    driftDuration: 3100,
    driftDirection: 1,
    driftPhase: 0,
    driftFreqRatio: 1.3,
  },
  {
    palette: ['#7A2E0A', '#FF5A1F', '#FFD9B0', '#FF5A1F', '#7A2E0A'],
    cycleDuration: 4400,
    cycleDelay: 1100,
    driftDuration: 3800,
    driftDirection: -1,
    driftPhase: 1.7,
    driftFreqRatio: 0.75,
  },
  {
    palette: ['#5C1F06', '#E6480F', '#FFB37A', '#E6480F', '#5C1F06'],
    cycleDuration: 6000,
    cycleDelay: 2200,
    driftDuration: 2600,
    driftDirection: 1,
    driftPhase: 3.1,
    driftFreqRatio: 1.6,
  },
  {
    palette: ['#8A2E00', '#FFB020', '#FFF3D6', '#FFB020', '#8A2E00'],
    cycleDuration: 5000,
    cycleDelay: 3300,
    driftDuration: 3400,
    driftDirection: -1,
    driftPhase: 4.4,
    driftFreqRatio: 0.9,
  },
];

// Two concentric rings (dim/wide outer, bright/small inner) sharing the
// SAME animated hue per petal — reads as a soft radial glow rather than a
// flat-filled circle.
const RING_SCALES = [1, 0.6];
const RING_OPACITIES = [0.55, 0.95];

// How far (px) the whole petal group drifts toward the phone's tilt — a
// liquid-in-a-ball feel, on top of (not instead of) each petal's own hue
// cycling. Silently stays at rest wherever the accelerometer isn't
// available (web without permission, desktop, etc).
const TILT_RANGE = 14;

function colorInputRange(paletteLength: number) {
  return Array.from({ length: paletteLength }, (_, i) => i / (paletteLength - 1));
}

/** A small "living" AI entity standing in for a literal chat-bubble icon: a
 * warm glass sphere whose four soft blobs each continuously cycle through
 * their own dark-orange-to-cream palette (out of phase with each other)
 * while drifting a private wandering path — colors visibly mixing and
 * recombining like liquid, and drifting toward whichever way the phone is
 * tilted. */
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
        intensity={Platform.OS === 'web' ? 4 : 8}
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
        // device) — the orb just keeps its base motion, no tilt drift.
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
  const drift = useSharedValue(0);
  const colorProgress = useSharedValue(0);
  const colorInputRangeRef = useRef(colorInputRange(petal.palette.length));

  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: petal.driftDuration, easing: Easing.linear }), -1, false);
    colorProgress.value = withDelay(
      petal.cycleDelay,
      withRepeat(withTiming(1, { duration: petal.cycleDuration, easing: Easing.linear }), -1, false)
    );
  }, [drift, colorProgress, petal.driftDuration, petal.cycleDuration, petal.cycleDelay]);

  // How far the blob's own center wanders from the sphere's center — a
  // true Lissajous path (different X/Y frequency), not a fixed-radius
  // circular orbit, so it drifts and mixes rather than just spinning.
  const driftRadius = size * 0.3;

  const positionStyle = useAnimatedStyle(() => {
    const angle = drift.value * Math.PI * 2 * petal.driftDirection + petal.driftPhase;
    const x = Math.cos(angle) * driftRadius;
    const y = Math.sin(angle * petal.driftFreqRatio) * driftRadius;
    const breathe = interpolate(Math.sin(angle * 1.7), [-1, 1], [0.85, 1.25]);
    return {
      transform: [{ translateX: x }, { translateY: y }, { scale: breathe }],
    };
  });

  const colorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorProgress.value, colorInputRangeRef.current, petal.palette),
  }));

  const blobSize = size * 0.68;

  return (
    <Animated.View style={[styles.layer, positionStyle]}>
      <View style={{ position: 'absolute', width: blobSize, height: blobSize, alignItems: 'center', justifyContent: 'center' }}>
        {RING_SCALES.map((scale, i) => {
          const ringSize = blobSize * scale;
          return (
            <Animated.View
              key={i}
              style={[
                {
                  position: 'absolute',
                  width: ringSize,
                  height: ringSize,
                  borderRadius: ringSize / 2,
                  opacity: RING_OPACITIES[i],
                },
                colorStyle,
              ]}
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
