import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { BlurView } from 'expo-blur';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

type Petal = { colors: [string, string, string]; spinDuration: number; direction: 1 | -1; baseAngle: number; pulseDuration: number; pulseDelay: number };

// Five oversized, soft-edged "petals" at 72° apart like a flower, each its
// own shade of warm color (from deep burnt orange through gold), each
// spinning AND breathing (scale+opacity) at its own speed/phase — the
// interference between them (not a single rotating image), then blurred
// by the BlurView on top, is what turns flat shapes into the soft
// glowing-plasma look rather than a flat graphic flower. Each petal is
// concentric rings of the SAME hue shading from a rich color at the edge
// to a pale warm cream at the center (never pure white) — a real radial
// gradient rather than a linear one, so it reads as soft light regardless
// of the angle it's currently rotated to.
const PETALS: Petal[] = [
  { colors: ['#FF7A33', '#FFC79B', '#FFE3C4'], spinDuration: 3400, direction: 1, baseAngle: 0, pulseDuration: 2000, pulseDelay: 0 },
  { colors: ['#FF5A1F', '#FFA35C', '#FFD9B0'], spinDuration: 4600, direction: -1, baseAngle: 72, pulseDuration: 2600, pulseDelay: 200 },
  { colors: ['#E6480F', '#FF8A46', '#FFE0BE'], spinDuration: 5800, direction: 1, baseAngle: 144, pulseDuration: 2300, pulseDelay: 500 },
  { colors: ['#FFB020', '#FFD98A', '#FFF3D6'], spinDuration: 4100, direction: -1, baseAngle: 216, pulseDuration: 2900, pulseDelay: 300 },
  { colors: ['#D93A0F', '#FF7A47', '#FFDCC2'], spinDuration: 6600, direction: 1, baseAngle: 288, pulseDuration: 2100, pulseDelay: 700 },
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
const TILT_RANGE = 14;

/** A small "living" AI entity standing in for a literal chat-bubble icon:
 * a warm glass sphere with five shades of orange-to-gold, each spinning
 * and breathing independently behind a soft blur (which is what fuses
 * flat shapes into a diffuse glow) — never settling into a static image,
 * and drifting toward whichever way the phone is tilted. */
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
  const pulse = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: petal.spinDuration, easing: Easing.linear }), -1, false);
    pulse.value = withDelay(
      petal.pulseDelay,
      withRepeat(withTiming(1, { duration: petal.pulseDuration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [spin, pulse, petal.spinDuration, petal.pulseDuration, petal.pulseDelay]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.7, 1]),
    transform: [
      { rotate: `${petal.baseAngle + petal.direction * spin.value * 360}deg` },
      { scale: interpolate(pulse.value, [0, 1], [0.85, 1.15]) },
    ],
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
