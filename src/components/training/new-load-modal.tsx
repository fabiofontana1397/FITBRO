import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SHEET_MAX_WIDTH = 440;

export type NewLoadModalProps = {
  visible: boolean;
  exerciseName: string;
  defaultReps: string;
  defaultWeightKg: string;
  onClose: () => void;
  onSave: (reps: number, weightKg: number) => void;
};

/** Bottom-sheet quick-entry for logging an updated load on an exercise —
 * the single way to record progress now that the always-open per-set
 * inputs have been replaced by one deliberate "nuovo carico" action. */
export function NewLoadModal({ visible, exerciseName, defaultReps, defaultWeightKg, onClose, onSave }: NewLoadModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <GlassSurface
          level="overlay"
          radius={Radius.xlarge}
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.four }]}>
          {/* Keyed on open/closed so each opening starts from fresh defaults
              without mirroring props into state via an effect. */}
          <NewLoadForm
            key={visible ? 'open' : 'closed'}
            theme={theme}
            exerciseName={exerciseName}
            defaultReps={defaultReps}
            defaultWeightKg={defaultWeightKg}
            onClose={onClose}
            onSave={onSave}
          />
        </GlassSurface>
      </View>
    </Modal>
  );
}

function NewLoadForm({
  theme,
  exerciseName,
  defaultReps,
  defaultWeightKg,
  onClose,
  onSave,
}: {
  theme: ReturnType<typeof useTheme>;
  exerciseName: string;
  defaultReps: string;
  defaultWeightKg: string;
  onClose: () => void;
  onSave: (reps: number, weightKg: number) => void;
}) {
  const [reps, setReps] = useState(defaultReps);
  const [weight, setWeight] = useState(defaultWeightKg);

  const handleSave = () => {
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight.replace(',', '.'));
    if (!Number.isFinite(repsNum) || repsNum <= 0) return;
    onSave(repsNum, Number.isFinite(weightNum) ? weightNum : 0);
    onClose();
  };

  return (
    <>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText type="subtitle">Nuovo carico</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {exerciseName}
          </ThemedText>
        </View>
        <Pressable onPress={onClose} hitSlop={8}>
          <Icon name="close" size={22} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <ThemedText type="label" themeColor="textSecondary">
            Rep
          </ThemedText>
          <TextInput
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            autoFocus
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
            placeholderTextColor={theme.textTertiary}
          />
        </View>
        <View style={styles.inputGroup}>
          <ThemedText type="label" themeColor="textSecondary">
            Kg
          </ThemedText>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="0"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
            placeholderTextColor={theme.textTertiary}
          />
        </View>
      </View>

      <PrimaryButton label="Salva carico" icon="check" onPress={handleSave} style={{ marginTop: Spacing.four }} />
    </>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
});
