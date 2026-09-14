import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { TimingSlow } from '@/constants/motion';
import { useTheme } from '@/hooks/use-theme';

/** A thin fill bar showing progress through the plan's current month —
 * shared by the training and nutrition plan cards. */
export function MonthProgressBar({ fraction }: { fraction: number }) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(150, withTiming(fraction, TimingSlow));
  }, [fraction, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
      <Animated.View style={[styles.fill, { backgroundColor: theme.accent }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
