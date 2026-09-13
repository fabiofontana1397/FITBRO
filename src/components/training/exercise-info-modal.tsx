import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ExerciseMedia } from '@/lib/exercise-media/exercise-media';

const SHEET_MAX_WIDTH = 440;

export type ExerciseInfoModalProps = {
  visible: boolean;
  exerciseName: string;
  media: ExerciseMedia | undefined;
  onClose: () => void;
};

export function ExerciseInfoModal({ visible, exerciseName, media, onClose }: ExerciseInfoModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <GlassSurface
          level="overlay"
          radius={Radius.xlarge}
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.four }]}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={{ flex: 1 }}>
              {exerciseName}
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {media ? (
              <>
                <Image source={{ uri: media.gifUrl }} style={[styles.gif, { backgroundColor: theme.backgroundElement }]} resizeMode="cover" />

                <View style={[styles.targetChip, { backgroundColor: theme.accentSoft }]}>
                  <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
                    {media.target}
                  </ThemedText>
                </View>

                <ThemedText type="smallBold" style={{ marginTop: Spacing.four }}>
                  Come si esegue
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
                  {media.instructions}
                </ThemedText>

                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.success }]}>
                  Cosa fare
                </ThemedText>
                {media.doTips.map((tip) => (
                  <TipRow key={tip} icon="checkCircle" color={theme.success} text={tip} />
                ))}

                <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.danger }]}>
                  Cosa evitare
                </ThemedText>
                {media.dontTips.map((tip) => (
                  <TipRow key={tip} icon="close" color={theme.danger} text={tip} />
                ))}

                <ThemedText type="caption" themeColor="textTertiary" style={{ marginTop: Spacing.four }}>
                  {media.attribution}
                </ThemedText>
              </>
            ) : (
              <ThemedText type="caption" themeColor="textSecondary" style={{ marginTop: Spacing.three }}>
                Descrizione non ancora disponibile per questo esercizio.
              </ThemedText>
            )}
          </ScrollView>
        </GlassSurface>
      </View>
    </Modal>
  );
}

function TipRow({ icon, color, text }: { icon: 'checkCircle' | 'close'; color: string; text: string }) {
  return (
    <View style={styles.tipRow}>
      <Icon name={icon} size={14} color={color} />
      <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    width: '100%',
    maxWidth: SHEET_MAX_WIDTH,
    maxHeight: '85%',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  gif: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.large,
  },
  targetChip: {
    alignSelf: 'flex-start',
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  sectionTitle: {
    marginTop: Spacing.four,
    marginBottom: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: 3,
  },
});
