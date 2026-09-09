import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { StreakRecord } from '../api/client';

export function StreakBadge({ streak }: { streak: StreakRecord | null }) {
  if (!streak || streak.history.length === 0) return null;

  const seen = new Set(streak.history.map(h => h.date));
  const dots = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return seen.has(key);
  });

  return (
    <View style={styles.row}>
      <View style={styles.chip}>
        <Text style={styles.chipText}>
          {streak.current === 1 ? '1 day streak' : `${streak.current} day streak`}
        </Text>
      </View>
      <View style={styles.dots}>
        {dots.map((filled, i) => (
          <View key={i} style={[styles.dot, filled && styles.dotFilled]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  chip: {
    backgroundColor: 'rgba(227,177,94,0.14)',
    borderColor: 'rgba(227,177,94,0.32)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { color: '#E3B15E', fontSize: 12, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotFilled: { backgroundColor: colors.teal },
});
