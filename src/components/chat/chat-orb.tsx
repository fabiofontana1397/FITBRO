import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

type Petal = {
  colors: [string, string, string];
  orbitDuration: number;
  direction: 1 | -1;
  phase: number;
  /** How much faster the vertical wander is than the horizontal one — a
   * Lissajous curve rather than a plain circle, so the path never quite
   * repeats the same way twice and reads as liquid wandering, not a
   * mechanical orbit. */
  freqRatio: number;
  pulseDuration: number;
  pulseDelay: number;
};

// Five oversized, soft-edged "petals" — two of them genuinely dark
// (near-maroon burnt orange, not just a mid-tone) for real contrast — each
// wandering along its own Lissajous path (translate, not just rotate) at
// its own speed/phase, plus breathing (scale+opacity).
const PETALS: Petal[] = [
  { colors: ['#7A2E0A', '#C24E12', '#FFB37A'], orbitDuration: 2600, direction: 1, phase: 0, freqRatio: 1.3, pulseDuration: 1000, pulseDelay: 0 },
  { colors: ['#FF5A1F', '#FFA35C', '#FFD9B0'], orbitDuration: 3400, direction: -1, phase: 1.2, freqRatio: 0.7, pulseDuration: 1300, pulseDelay: 150 },
  { colors: ['#5C1F06', '#B33D0F', '#FF8A46'], orbitDuration: 3000, direction: 1, phase: 2.4, freqRatio: 1.6, pulseDuration: 1150, pulseDelay: 400 },
  { colors: ['#FFB020', '#FFD98A', '#FFF3D6'], orbitDuration: 3900, direction: -1, phase: 3.6, freqRatio: 0.85, pulseDuration: 1400, pulseDelay: 250 },
  { colors: ['#E6480F', '#FF8A46', '#FFE0BE'], orbitDuration: 2200, direction: 1, phase: 4.8, freqRatio: 1.15, pulseDuration: 1050, pulseDelay: 550 },
];

// Gradient stops shared by every petal's radial fill — bright center
// easing through the mid tone and fading all the way to transparent at
// the rim, so petals blend into the sphere and into each other with no
// hard edge. The falloff is spread across the WHOLE radius (not mostly
// solid until the last stretch) so each petal reads as a soft glow bleeding
// into its neighbors rather than a clean-edged disc that merely happens to
// drift — several of these heavily overlap at all times (see blobSize
// below), which is what actually sells "liquid mixing" instead of "balls
// moving around". A real SVG radialGradient does the falloff itself
// natively — still just plain pixels being painted, so there's no separate
// compositing pass that can go stale on-device the way BlurView's did.
// colorIndex picks which of the petal's 3 colors [edge, mid, center] each
// stop uses; opacity fades to 0 by the last stop.
const GRADIENT_STOPS = [
  { offset: '0%', colorIndex: 2, opacity: 1 },
  { offset: '30%', colorIndex: 1, opacity: 0.75 },
  { offset: '60%', colorIndex: 0, opacity: 0.35 },
  { offset: '100%', colorIndex: 0, opacity: 0 },
];

// How far (px) the whole petal group drifts toward the phone's tilt — a
// liquid-in-a-ball feel, on top of (not instead of) the petals' own
// constant wandering. Silently stays at rest wherever the accelerometer
// isn't available (web without permission, desktop, etc).
const TILT_RANGE = 14;

/** A small "living" AI entity standing in for a literal chat-bubble icon:
 * a warm glass sphere with five shades of orange (two of them deep,
 * near-maroon), each wandering a private Lissajous path and breathing
 * independently — colors visibly mixing and recombining like liquid
 * rather than settling into a static image, and drifting toward whichever
 * way the phone is tilted. */
export function ChatOrb({ size }: { size: number }) {
  const { tiltX, tiltY } = useTiltShift();

  const tiltStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tiltX.value }, { translateY: tiltY.value }],
  }));

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#FF5A1F' }}>
      <Animated.View style={[styles.layer, tiltStyle]}>
        {PETALS.map((petal, i) => (
          <PetalLayer key={i} petal={petal} size={size} index={i} />
        ))}
      </Animated.View>
      {/* A static (non-animated) glass sheen — never needs to be
          re-sampled every frame, so it can't ever freeze on its own. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
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

function PetalLayer({ petal, size, index }: { petal: Petal; size: number; index: number }) {
  const orbit = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    orbit.value = withRepeat(withTiming(1, { duration: petal.orbitDuration, easing: Easing.linear }), -1, false);
    pulse.value = withDelay(
      petal.pulseDelay,
      withRepeat(withTiming(1, { duration: petal.pulseDuration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [orbit, pulse, petal.orbitDuration, petal.pulseDuration, petal.pulseDelay]);

  // How far the blob's own center wanders from the sphere's center — a
  // true Lissajous path (different X/Y frequency), not a fixed-radius
  // circular orbit, so it drifts and mixes rather than just spinning.
  const orbitRadius = size * 0.42;

  const style = useAnimatedStyle(() => {
    const angle = orbit.value * Math.PI * 2 * petal.direction + petal.phase;
    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle * petal.freqRatio) * orbitRadius;
    return {
      opacity: interpolate(pulse.value, [0, 1], [0.55, 1]),
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: interpolate(pulse.value, [0, 1], [0.75, 1.4]) },
      ],
    };
  });

  // Big enough that several petals overlap almost everywhere in the
  // sphere at all times — that constant overlap, not any single petal's
  // own shape, is what reads as color continuously blending rather than
  // distinct spheres sliding past each other.
  const blobSize = size * 0.88;
  const gradientId = `chatOrbPetal${index}`;

  return (
    <Animated.View style={[styles.layer, style]}>
      <Svg width={blobSize} height={blobSize} style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            {GRADIENT_STOPS.map((stop, i) => (
              <Stop key={i} offset={stop.offset} stopColor={petal.colors[stop.colorIndex]} stopOpacity={stop.opacity} />
            ))}
          </RadialGradient>
        </Defs>
        <Circle cx={blobSize / 2} cy={blobSize / 2} r={blobSize / 2} fill={`url(#${gradientId})`} />
      </Svg>
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
