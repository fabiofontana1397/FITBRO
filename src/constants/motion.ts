import { WithSpringConfig, WithTimingConfig, Easing } from 'react-native-reanimated';

export const SpringSnappy: WithSpringConfig = {
  damping: 18,
  mass: 0.6,
  stiffness: 220,
};

export const SpringSoft: WithSpringConfig = {
  damping: 20,
  mass: 0.9,
  stiffness: 140,
};

export const TimingQuick: WithTimingConfig = {
  duration: 220,
  easing: Easing.out(Easing.cubic),
};

export const TimingSlow: WithTimingConfig = {
  duration: 520,
  easing: Easing.out(Easing.cubic),
};
