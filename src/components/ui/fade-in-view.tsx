import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { TimingSlow } from '@/constants/motion';

export type FadeInViewProps = {
  delay?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** Fades and slides content up on mount, staggered via `delay` (ms). */
export function FadeInView({ delay = 0, style, children }: FadeInViewProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(1, TimingSlow));
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
