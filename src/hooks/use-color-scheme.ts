import { useColorScheme as useRNColorScheme } from 'react-native';

import { useAppStore } from '@/store/app-store';

export function useColorScheme() {
  const appearance = useAppStore((s) => s.appearance);
  const system = useRNColorScheme();

  if (appearance === 'system') {
    return system ?? 'light';
  }
  return appearance;
}
