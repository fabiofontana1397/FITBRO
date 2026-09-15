import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { generatePhotoDetailInsight } from '@/lib/assistant/photo-insight';
import type { BodyMetricSnapshot } from '@/lib/mock/types';
import { formatFullDay } from '@/lib/mock/dates';
import { POSE_LABELS, type BodyPhoto } from '@/store/body-store';

export type PhotoDetailModalProps = {
  photo: BodyPhoto | null;
  allPhotos: BodyPhoto[];
  entries: BodyMetricSnapshot[];
  onClose: () => void;
};

/** Opened by tapping a progress photo: the shot at full size, with the AI
 * coach's feedback on shot quality and — the part that actually matters —
 * a data-grounded comparison against the previous photo in the same pose. */
export function PhotoDetailModal({ photo, allPhotos, entries, onClose }: PhotoDetailModalProps) {
  const theme = useTheme();
  if (!photo) return null;

  const insight = generatePhotoDetailInsight(photo, allPhotos, entries);

  return (
    <Modal visible={photo != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <GlassSurface level="overlay" radius={Radius.xlarge} style={styles.card}>
            <View style={styles.header}>
              <View>
                <ThemedText type="subtitle">{POSE_LABELS[photo.pose] ?? 'Foto'}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatFullDay(photo.date)}
                </ThemedText>
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <Icon name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="cover" />

            <ScrollView style={styles.insightScroll}>
              <View style={styles.insightRow}>
                <Icon name="sparkle" size={16} color={theme.accent} />
                <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
                  {insight}
                </ThemedText>
              </View>
            </ScrollView>
          </GlassSurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Spacing.four,
  },
  card: {
    width: 320,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  image: {
    width: '100%',
    height: 340,
    borderRadius: Radius.medium,
  },
  insightScroll: {
    maxHeight: 140,
  },
  insightRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
});
