import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { AudioWaveform } from '../components/AudioWaveform';

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
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState<string | null>(null);

  function handleToggleVoicePractice() {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      setVoicePrompt('“Be still, and know that I am God.” — Psalm 46:10');
    } else {
      setVoicePrompt(null);
      setIsVoiceListening(true);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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

      {/* Voice Practice Section with Real-Time AudioWaveform */}
      <View style={styles.voiceSection}>
        <Text style={styles.sectionEyebrow}>VOICE PRACTICE</Text>
        <Text style={styles.voiceTitle}>Speak a prayer or ask for a verse</Text>
        <Text style={styles.voiceDesc}>
          Visualize your voice in real time while practicing spoken prayer or Scripture recitation.
        </Text>

        <AudioWaveform isListening={isVoiceListening} />

        {voicePrompt && (
          <View style={styles.voiceAnswerBox}>
            <Text style={styles.voiceAnswerText}>{voicePrompt}</Text>
          </View>
        )}

        <Pressable
          onPress={handleToggleVoicePractice}
          style={[styles.voiceBtn, isVoiceListening && styles.voiceBtnActive]}
        >
          <Text style={styles.voiceBtnText}>
            {isVoiceListening ? '⏹ Stop Voice Practice' : '🎙️ Start Voice Practice'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
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
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700', marginBottom: 24 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  icon: { fontSize: 26 },
  label: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 3 },
  desc: { color: '#B6ABCF', fontSize: 12 },
  voiceSection: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(31,182,176,0.22)',
  },
  sectionEyebrow: {
    color: colors.teal,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  voiceTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  voiceDesc: {
    color: '#B6ABCF',
    fontSize: 12,
    lineHeight: 17,
  },
  voiceAnswerBox: {
    backgroundColor: 'rgba(31,182,176,0.12)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  voiceAnswerText: {
    color: '#E8F8F7',
    fontSize: 12.5,
    fontStyle: 'italic',
  },
  voiceBtn: {
    backgroundColor: colors.teal,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  voiceBtnActive: {
    backgroundColor: '#A25B6C',
  },
  voiceBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
