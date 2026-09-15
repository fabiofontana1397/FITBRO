import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { MeasurementInfoModal } from '@/components/body/measurement-info-modal';
import { MeasurementTrendModal } from '@/components/body/measurement-trend-modal';
import { PhotoDetailModal } from '@/components/body/photo-detail-modal';
import { PosePickerSheet } from '@/components/body/pose-picker-sheet';
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
import { formatFullDay } from '@/lib/mock/dates';
import { deltaFromPrevious, latestSnapshot, seriesOf } from '@/lib/mock/body';
import { generatePhotoInsight } from '@/lib/assistant/photo-insight';
import { POSE_LABELS, type BodyPhoto, type BodyPhotoPose } from '@/store/body-store';
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
  const [posePickerOpen, setPosePickerOpen] = useState(false);
  const [detailPhoto, setDetailPhoto] = useState<BodyPhoto | null>(null);
  const [weightRange, setWeightRange] = useState<WeightRange>('settimana');
  const weightSeries = useWeightSeries(entries, weightRange);

  const latest = latestSnapshot(entries);
  const weightDelta = deltaFromPrevious(entries, 'weightKg');
  const toGoal = latest.weightKg - currentUser.targetWeightKg;
  const photoInsight = generatePhotoInsight(photos, entries);

  // Every photo taken on the same day grouped into its own box, most recent
  // session first — a full pose set from one sitting reads as one unit
  // instead of blending into a single long scroll.
  const photosByDay = useMemo(() => {
    const map = new Map<string, BodyPhoto[]>();
    for (const p of photos) map.set(p.date, [...(map.get(p.date) ?? []), p]);
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [photos]);

  const pickPhoto = async (pose: BodyPhotoPose) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      addPhoto(result.assets[0].uri, pose);
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
          {MEASUREMENTS.map((m) => {
            // Entries logged before this zone existed (or the user simply
            // hasn't recorded it yet) carry no value for it — filter those
            // out rather than let a missing number reach the chart as NaN.
            const series = seriesOf(entries, m.zone).filter((v) => Number.isFinite(v));
            const latestValue = latest[m.zone];
            const hasValue = Number.isFinite(latestValue);
            // A single logged value has no line to draw — the sparkline
            // (and the "andamento" popup it opens) only earns its place
            // once there are at least two measurements to connect.
            const hasTrend = series.length >= 2;
            return (
              <GlassSurface key={m.zone} level="card" radius={Radius.large}>
                <View style={styles.measureRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="small">{m.label}</ThemedText>
                    <ThemedText type="smallBold">{hasValue ? `${latestValue} cm` : 'Non ancora misurato'}</ThemedText>
                  </View>
                  {hasTrend ? (
                    <Pressable onPress={() => setTrendMeasurement(m)} hitSlop={8}>
                      <TrendChart data={series} width={56} height={28} color={theme.accent} />
                    </Pressable>
                  ) : (
                    <View style={{ width: 56, height: 28 }} />
                  )}
                  <Pressable onPress={() => setAddMeasurementZone(m)} hitSlop={8} style={[styles.infoButton, { backgroundColor: theme.accentSoft }]}>
                    <Icon name="plus" size={16} color={theme.accent} />
                  </Pressable>
                  <Pressable onPress={() => setInfoZone(m.zone)} hitSlop={8} style={[styles.infoButton, { backgroundColor: theme.backgroundElement }]}>
                    <Icon name="info" size={16} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </GlassSurface>
            );
          })}
        </View>
      </View>

      <View style={{ gap: Spacing.three }}>
        <SectionHeader title="Foto progressi" />

        <InsightCard
          icon="camera"
          tone="neutral"
          headline="Come scattare le foto"
          body={
            'Scegli un posto ben illuminato, con luce uniforme.\n' +
            'Scatta 6 foto a corpo intero: frontale, laterale destro, laterale sinistro e posteriore rilassato, poi frontale e posteriore flettendo i muscoli.\n' +
            'Sempre alla stessa ora — idealmente al mattino, a digiuno e dopo essere andato in bagno.\n' +
            'Ripeti l’intera sequenza una volta al mese.'
          }
        />

        <Pressable onPress={() => setPosePickerOpen(true)} style={[styles.addPhotoRow, { borderColor: theme.border }]}>
          <Icon name="camera" size={20} color={theme.accent} />
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            Aggiungi foto
          </ThemedText>
        </Pressable>

        {photosByDay.length === 0 ? (
          <ThemedText type="caption" themeColor="textTertiary" style={{ textAlign: 'center' }}>
            Non hai ancora scattato foto di progresso.
          </ThemedText>
        ) : (
          photosByDay.map(([date, dayPhotos]) => (
            <GlassSurface key={date} level="card" radius={Radius.large} style={styles.photoDayCard}>
              <ThemedText type="smallBold">{formatFullDay(date)}</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
                {dayPhotos.map((photo) => (
                  <Pressable key={photo.id} onPress={() => setDetailPhoto(photo)}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                    <ThemedText type="caption" themeColor="textSecondary" style={styles.photoThumbLabel} numberOfLines={1}>
                      {POSE_LABELS[photo.pose] ?? 'Foto'}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </GlassSurface>
          ))
        )}
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
        currentValueCm={addMeasurementZone && Number.isFinite(latest[addMeasurementZone.zone]) ? Number(latest[addMeasurementZone.zone]) : 0}
        onClose={() => setAddMeasurementZone(null)}
        onSave={(valueCm) => {
          if (addMeasurementZone) addMeasurement({ [addMeasurementZone.zone]: valueCm });
        }}
      />
      <PosePickerSheet
        visible={posePickerOpen}
        onClose={() => setPosePickerOpen(false)}
        onSelect={(pose) => {
          setPosePickerOpen(false);
          pickPhoto(pose);
        }}
      />
      <PhotoDetailModal photo={detailPhoto} allPhotos={photos} entries={entries} onClose={() => setDetailPhoto(null)} />
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
  photoDayCard: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  photoThumb: {
    width: 84,
    height: 112,
    borderRadius: Radius.medium,
  },
  photoThumbLabel: {
    width: 84,
    textAlign: 'center',
    marginTop: 4,
  },
  addPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});
