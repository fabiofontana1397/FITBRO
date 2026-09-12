import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { StatTile } from '@/components/ui/stat-tile';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDayMonth, isToday, sportIcon, sportMeta, trainingLoadSeries, workouts } from '@/lib/mock';
import type { Sport } from '@/lib/mock/types';

const FILTERS: { value: Sport | 'all'; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'gym', label: 'Pesi' },
  { value: 'functional', label: 'Functional' },
  { value: 'running', label: 'Corsa' },
  { value: 'swimming', label: 'Nuoto' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'cycling', label: 'Ciclismo' },
];

export default function TrainingScreen() {
  const theme = useTheme();
  const [filter, setFilter] = useState<Sport | 'all'>('all');

  const filtered = useMemo(
    () => workouts.filter((w) => filter === 'all' || w.sport === filter),
    [filter]
  );
  const loadSeries = useMemo(() => trainingLoadSeries(7), []);
  const completedThisWeek = workouts.filter((w) => w.completed).length;
  const totalMinutes = workouts.filter((w) => w.completed).reduce((a, w) => a + w.durationMin, 0);

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Multi-sport" title="Training" />

      <View style={styles.statsRow}>
        <StatTile label="Sessioni" value={`${completedThisWeek}`} unit="ultimi 14gg" icon="check" />
        <StatTile
          label="Carico settimanale"
          value={`${totalMinutes}`}
          unit="min"
          sparkline={loadSeries}
        />
      </View>

      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} scrollable />

      <View>
        <SectionHeader title={filter === 'all' ? 'Sessioni recenti' : sportMeta[filter].label} />
        <View style={{ gap: Spacing.three }}>
          {filtered.map((workout) => (
            <GlassSurface key={workout.id} level="card" radius={Radius.large}>
              <View style={styles.workoutRow}>
                <View style={[styles.sportBadge, { backgroundColor: theme.accentSoft }]}>
                  <Icon name={sportIcon[workout.sport]} size={20} color={theme.accent} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="smallBold">{workout.title}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {isToday(workout.date) ? 'Oggi' : formatDayMonth(workout.date)} · {workout.durationMin} min
                    {workout.metrics.distanceKm ? ` · ${workout.metrics.distanceKm} km` : ''}
                    {workout.metrics.volumeKg ? ` · ${workout.metrics.volumeKg} kg volume` : ''}
                  </ThemedText>
                </View>
                <StatusPill completed={workout.completed} planned={workout.planned} />
              </View>
            </GlassSurface>
          ))}
        </View>
      </View>
    </ScreenScroll>
  );
}

function StatusPill({ completed, planned }: { completed: boolean; planned: boolean }) {
  const theme = useTheme();
  const label = completed ? 'Fatto' : planned ? 'In programma' : 'Extra';
  const color = completed ? theme.success : planned ? theme.accent : theme.textTertiary;

  return (
    <View style={[styles.pill, { backgroundColor: `${color}1A` }]}>
      <ThemedText type="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  sportBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
});
