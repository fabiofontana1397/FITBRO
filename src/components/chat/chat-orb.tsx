import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** A small "living" AI entity — two gradient layers drifting and rotating
 * against each other inside a circular mask, standing in for a literal
 * chat-bubble icon on the coach FAB. Continuous and seamless (each loop
 * drives a full 360° turn, so there's no jump cut), never settling into a
 * static image. */
export function ChatOrb({ size }: { size: number }) {
  const spinA = useSharedValue(0);
  const spinB = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    spinA.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.linear }), -1, false);
    spinB.value = withRepeat(withTiming(1, { duration: 11000, easing: Easing.linear }), -1, false);
    breathe.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [spinA, spinB, breathe]);

  const layerAStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${spinA.value * 360}deg` },
      { translateX: interpolate(breathe.value, [0, 1], [-size * 0.06, size * 0.06]) },
    ],
  }));
  const layerBStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.7, 1]),
    transform: [
      { rotate: `${-spinB.value * 360}deg` },
      { translateY: interpolate(breathe.value, [0, 1], [size * 0.05, -size * 0.05]) },
    ],
  }));
  const highlightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.18, 0.32]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.94, 1.04]) }],
  }));

  const layerSize = size * 1.7;
  const layerOffset = -(layerSize - size) / 2;

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <Animated.View style={[styles.layer, layerAStyle]}>
        <LinearGradient
          colors={['#FF8A3D', '#FF5A1F', '#B23BFF']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ width: layerSize, height: layerSize, marginLeft: layerOffset, marginTop: layerOffset, borderRadius: layerSize / 2 }}
        />
      </Animated.View>
      <Animated.View style={[styles.layer, layerBStyle]}>
        <LinearGradient
          colors={['#3DD6FF', '#FF5A1F', '#FFD23D']}
          start={{ x: 1, y: 0.1 }}
          end={{ x: 0, y: 0.9 }}
          style={{ width: layerSize * 0.9, height: layerSize * 0.9, marginLeft: layerOffset, marginTop: layerOffset, borderRadius: layerSize / 2 }}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.highlight, { width: size, height: size, borderRadius: size / 2 }, highlightStyle]} />
    </View>
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
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#ffffff',
  },
});
