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

  const rhythmSteps = [
    {
      icon: '📖',
      label: 'Read',
      time: '1 min',
      desc: 'Begin with a grounded Scripture passage.',
      action: onReadScripture,
    },
    {
      icon: '✍️',
      label: 'Reflect',
      time: '2 min',
      desc: 'Respond to a brief prompt and journal your thoughts.',
      action: onReflect,
    },
    {
      icon: '🙏',
      label: 'Pray',
      time: '2 min',
      desc: 'Close with a private prayer and quiet attention.',
      action: onPray,
    },
  ];

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
      <Text style={styles.title}>Daily rhythm</Text>
      <Text style={styles.subtitle}>A calm, guided practice for today — short enough to keep, deep enough to matter.</Text>

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>5-MINUTE SANCTUARY</Text>
        <Text style={styles.heroTitle}>Read • Reflect • Pray</Text>
        <Text style={styles.heroBody}>
          Start with Scripture, slow your thoughts, and finish with a brief prayer that settles you for the day.
        </Text>
        <Pressable style={styles.primaryButton} onPress={onReadScripture}>
          <Text style={styles.primaryButtonText}>Start today&apos;s session</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionEyebrow}>TODAY&apos;S RHYTHM</Text>
      <View style={styles.rhythmList}>
        {rhythmSteps.map(step => (
          <Pressable key={step.label} style={styles.stepCard} onPress={step.action}>
            <View style={styles.stepIconWrap}>
              <Text style={styles.stepIcon}>{step.icon}</Text>
            </View>
            <View style={styles.stepTextWrap}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepTime}>{step.time}</Text>
              </View>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.secondaryActions}>
        <PracticeOption
          icon="🧘"
          label="Meditate"
          desc={hasActiveContent ? "Continue with today's verse" : "Check in first to unlock a guided session"}
          onPress={onMeditate}
        />
      </View>

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
  title: { color: colors.white, fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#B6ABCF', fontSize: 13, lineHeight: 18, marginBottom: 18 },
  heroCard: {
    backgroundColor: 'rgba(107, 91, 145, 0.22)',
    borderColor: 'rgba(154, 130, 204, 0.3)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  heroEyebrow: { color: '#D8CFEC', fontSize: 10, fontWeight: '700', letterSpacing: 1.3, marginBottom: 5 },
  heroTitle: { color: colors.white, fontSize: 24, fontWeight: '700', marginBottom: 6 },
  heroBody: { color: '#D9D0EF', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  primaryButton: {
    backgroundColor: colors.teal,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#102726', fontWeight: '700', fontSize: 14 },
  rhythmList: { gap: 10, marginBottom: 18 },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(31,182,176,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: { fontSize: 20 },
  stepTextWrap: { flex: 1 },
  stepHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  stepLabel: { color: colors.white, fontSize: 14, fontWeight: '700' },
  stepTime: { color: '#9FE3D3', fontSize: 11, fontWeight: '700' },
  stepDesc: { color: '#B6ABCF', fontSize: 12, lineHeight: 17 },
  secondaryActions: { marginBottom: 12 },
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
    marginBottom: 10,
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
