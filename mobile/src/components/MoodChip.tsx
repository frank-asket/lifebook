import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  label: string;
  emoji: string;
  desc: string;
  accentColor: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}

export function MoodChip({ label, emoji, desc, accentColor, selected, disabled, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} — ${desc}`}
      style={[
        styles.card,
        selected && { ...styles.selected, borderColor: accentColor },
        disabled && !selected && styles.disabled,
      ]}
    >
      <View style={[styles.emojiCircle, { backgroundColor: `${accentColor}26` }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.desc}>{desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  selected: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5,
  },
  disabled: { opacity: 0.35 },
  emojiCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: { fontSize: 22 },
  label: { color: colors.white, fontWeight: '700', fontSize: 14 },
  desc: { color: '#B6ABCF', fontSize: 10.5, textAlign: 'center', marginTop: 3, paddingHorizontal: 6 },
});
