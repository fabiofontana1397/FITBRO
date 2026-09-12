import type { IconName } from '@/components/ui/icon';

import type { Sport } from './types';

export const sportMeta: Record<Sport, { label: string; unit: string }> = {
  gym: { label: 'Sala pesi', unit: 'kg' },
  functional: { label: 'Functional', unit: 'min' },
  running: { label: 'Corsa', unit: 'km' },
  swimming: { label: 'Nuoto', unit: 'm' },
  tennis: { label: 'Tennis', unit: 'min' },
  cycling: { label: 'Ciclismo', unit: 'km' },
  other: { label: 'Altro', unit: 'min' },
};

export const sportIcon: Record<Sport, IconName> = {
  gym: 'gym',
  functional: 'functional',
  running: 'running',
  swimming: 'swimming',
  tennis: 'tennis',
  cycling: 'cycling',
  other: 'otherSport',
};
