import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  hasActiveContent: boolean;
  onReadScripture: () => void;
  onMeditate: () => void;
  onPray: () => void;
  onReflect: () => void;
}

// This screen is intentionally a shortcuts menu, not a new guided step-by-step
// flow (Scripture → Reflect → Meditate → Pray as separate screens each with
// their own transitions) — that deeper interaction redesign is real future
// scope, not something folded quietly into this pass. What's here routes
// into the flows that already exist and work.
export function PracticeScreen({ hasActiveContent, onReadScripture, onMeditate, onPray, onReflect }: Props) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>What would you like to do?</Text>

      <PracticeOption icon="📖" label="Read Scripture" desc="Check in with a mood and get today's verse" onPress={onReadScripture} />
      <PracticeOption
        icon="🧘"
        label="Meditate"
        desc={hasActiveContent ? "Continue with today's verse" : "Check in first to unlock a guided session"}
        onPress={onMeditate}
      />
      <PracticeOption
        icon="🙏"
        label="Pray"
        desc={hasActiveContent ? "Revisit today's prayer" : "Check in first to get a prayer"}
        onPress={onPray}
      />
      <PracticeOption icon="✍️" label="Reflect" desc="Write a journal entry" onPress={onReflect} />
    </View>
  );
}

function PracticeOption({ icon, label, desc, onPress }: { icon: string; label: string; desc: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.desc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep, padding: 20, paddingTop: 60 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700', marginBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  icon: { fontSize: 26 },
  label: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 3 },
  desc: { color: '#B6ABCF', fontSize: 12 },
});
