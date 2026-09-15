import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { MeasurementInfoModal } from '@/components/body/measurement-info-modal';
import { MeasurementTrendModal } from '@/components/body/measurement-trend-modal';
import { QuickMeasurementSheet } from '@/components/body/quick-measurement-sheet';
import { QuickWeightSheet } from '@/components/body/quick-weight-sheet';
import type { MeasurementZone } from '@/components/body/body-silhouette';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { GoalTrendChart } from '@/components/ui/goal-trend-chart';
import { Icon } from '@/components/ui/icon';
import { InsightCard } from '@/components/ui/insight-card';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TrendChart } from '@/components/ui/trend-chart';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWeightSeries, weightDateGranularity, type WeightRange } from '@/hooks/use-weight-series';
import { deltaFromPrevious, latestSnapshot, seriesOf } from '@/lib/mock/body';
import { generatePhotoInsight } from '@/lib/assistant/photo-insight';
import { useBodyStore } from '@/store/body-store';
import { useUserStore } from '@/store/user-store';

// Top to bottom, roughly following the body itself.
const MEASUREMENTS: { zone: MeasurementZone; label: string }[] = [
  { zone: 'shouldersCm', label: 'Spalle' },
  { zone: 'chestCm', label: 'Petto' },
  { zone: 'bicepsCm', label: 'Bicipite' },
  { zone: 'waistCm', label: 'Vita' },
  { zone: 'hipsCm', label: 'Fianchi' },
  { zone: 'thighCm', label: 'Coscia' },
];

export default function BodyScreen() {
  const theme = useTheme();
  const currentUser = useUserStore();
  const entries = useBodyStore((s) => s.entries);
  const photos = useBodyStore((s) => s.photos);
  const addWeightEntry = useBodyStore((s) => s.addWeightEntry);
  const addMeasurement = useBodyStore((s) => s.addMeasurement);
  const addPhoto = useBodyStore((s) => s.addPhoto);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [infoZone, setInfoZone] = useState<MeasurementZone | null>(null);
  const [trendMeasurement, setTrendMeasurement] = useState<{ zone: MeasurementZone; label: string } | null>(null);
  const [addMeasurementZone, setAddMeasurementZone] = useState<{ zone: MeasurementZone; label: string } | null>(null);
  const [weightRange, setWeightRange] = useState<WeightRange>('settimana');
  const weightSeries = useWeightSeries(entries, weightRange);

  const latest = latestSnapshot(entries);
  const weightDelta = deltaFromPrevious(entries, 'weightKg');
  const toGoal = latest.weightKg - currentUser.targetWeightKg;
  const photoInsight = generatePhotoInsight(photos, entries);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      addPhoto(result.assets[0].uri);
    }
  };

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Composizione corporea" title="Corpo" />

      <GlassSurface level="card" radius={Radius.large} style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <View style={styles.heroWeightRow}>
              <ThemedText type="hero">{latest.weightKg.toFixed(1)}</ThemedText>
              <ThemedText type="subtitle" themeColor="textSecondary">
                kg
              </ThemedText>
            </View>
            <ThemedText type="caption" themeColor="textSecondary">
              {weightDelta === 0 ? 'stabile da ieri' : `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} kg da ieri`} ·{' '}
              {Math.abs(toGoal).toFixed(1)} kg {toGoal > 0 ? 'dall’obiettivo' : 'oltre l’obiettivo'}
            </ThemedText>
          </View>
          <Pressable onPress={() => setQuickAddOpen(true)} style={[styles.quickAddButton, { backgroundColor: theme.accent }]}>
            <Icon name="plus" size={20} color={theme.onAccent} />
          </Pressable>
        </View>
        <SegmentedControl
          options={[
            { value: 'settimana', label: 'Settimana' },
            { value: 'mese', label: 'Mese' },
            { value: 'anno', label: 'Anno' },
          ]}
          value={weightRange}
          onChange={(v) => setWeightRange(v as WeightRange)}
        />
        <GoalTrendChart
          points={weightSeries}
          target={currentUser.targetWeightKg}
          dateGranularity={weightDateGranularity(weightRange)}
          height={240}
          color={theme.accent}
          targetColor={theme.success}
          axisColor={theme.textTertiary}
          gridColor={theme.backgroundElement}
        />
      </GlassSurface>

      <View>
        <SectionHeader title="Misure" />
        <View style={{ gap: Spacing.three }}>
          {MEASUREMENTS.map((m) => (
            <GlassSurface key={m.zone} level="card" radius={Radius.large}>
              <View style={styles.measureRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="small">{m.label}</ThemedText>
                  <ThemedText type="smallBold">{latest[m.zone]} cm</ThemedText>
                </View>
                <Pressable onPress={() => setTrendMeasurement(m)} hitSlop={8}>
                  <TrendChart data={seriesOf(entries, m.zone)} width={56} height={28} color={theme.accent} />
                </Pressable>
                <Pressable onPress={() => setAddMeasurementZone(m)} hitSlop={8} style={[styles.infoButton, { backgroundColor: theme.accentSoft }]}>
                  <Icon name="plus" size={16} color={theme.accent} />
                </Pressable>
                <Pressable onPress={() => setInfoZone(m.zone)} hitSlop={8} style={[styles.infoButton, { backgroundColor: theme.backgroundElement }]}>
                  <Icon name="info" size={16} color={theme.textSecondary} />
                </Pressable>
              </View>
            </GlassSurface>
          ))}
        </View>
      </View>

      <View>
        <SectionHeader title="Foto progressi" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
          {photos.map((photo) => (
            <Image key={photo.id} source={{ uri: photo.uri }} style={styles.photoThumb} />
          ))}
          <Pressable onPress={pickPhoto} style={[styles.addPhotoTile, { borderColor: theme.border }]}>
            <Icon name="camera" size={24} color={theme.textSecondary} />
            <ThemedText type="caption" themeColor="textSecondary">
              Aggiungi
            </ThemedText>
          </Pressable>
        </ScrollView>
      </View>

      {photoInsight ? (
        <View>
          <SectionHeader title="Confronto AI" />
          <InsightCard icon="sparkle" tone="positive" headline="Cosa nota il coach AI" body={photoInsight} />
        </View>
      ) : photos.length === 0 ? (
        <ThemedText type="caption" themeColor="textTertiary" style={{ textAlign: 'center' }}>
          Aggiungi almeno 2 foto nel tempo per ricevere un confronto automatico dei tuoi progressi.
        </ThemedText>
      ) : null}

      <QuickWeightSheet
        visible={quickAddOpen}
        currentWeightKg={latest.weightKg}
        onClose={() => setQuickAddOpen(false)}
        onSave={(weightKg) => addWeightEntry(weightKg)}
      />
      <MeasurementInfoModal zone={infoZone} onClose={() => setInfoZone(null)} />
      <MeasurementTrendModal
        zone={trendMeasurement?.zone ?? null}
        label={trendMeasurement?.label ?? ''}
        entries={entries}
        color={theme.accent}
        onClose={() => setTrendMeasurement(null)}
      />
      <QuickMeasurementSheet
        visible={addMeasurementZone != null}
        label={addMeasurementZone?.label ?? ''}
        currentValueCm={addMeasurementZone ? Number(latest[addMeasurementZone.zone]) : 0}
        onClose={() => setAddMeasurementZone(null)}
        onSave={(valueCm) => {
          if (addMeasurementZone) addMeasurement({ [addMeasurementZone.zone]: valueCm });
        }}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  heroWeightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  quickAddButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumb: {
    width: 84,
    height: 112,
    borderRadius: Radius.medium,
  },
  addPhotoTile: {
    width: 84,
    height: 112,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
