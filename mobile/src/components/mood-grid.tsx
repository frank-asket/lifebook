import { Pressable, StyleSheet, Text, View } from 'react-native';

import { moods, type MoodId } from '@/lib/content';
import { colors, radius, spacing } from '@/lib/theme';

export function MoodGrid({ onSelect }: { onSelect: (mood: MoodId) => void }) {
  return (
    <View style={styles.grid}>
      {moods.map((mood) => (
        <Pressable
          key={mood.id}
          accessibilityRole="button"
          accessibilityLabel={`${mood.label} — ${mood.blurb}`}
          onPress={() => onSelect(mood.id)}
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
        >
          <Text style={styles.label}>{mood.label}</Text>
          <Text style={styles.blurb}>{mood.blurb}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tilePressed: { borderColor: colors.accent, backgroundColor: colors.surfaceRaised },
  label: { color: colors.text, fontSize: 16, fontWeight: '600' },
  blurb: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});
