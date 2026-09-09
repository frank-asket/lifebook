import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { MeditationScreen } from './MeditationScreen';
import { addJournalEntry, addFavorite, flagContent } from '../api/client';

export interface GuidedSession {
  verseText: string;
  verseReference: string;
  reflectionPrompt: string;
  prayerText: string;
  sourceLabel: string;
  contentId?: string; // present for AI check-in content — enables favorite/flag
}

interface Props {
  deviceId: string;
  session: GuidedSession;
  onFinish: () => void; // called when the whole flow completes or the user exits early
  initialStep?: Step;
}

type Step = 'scripture' | 'reflect' | 'meditate-select' | 'meditate-run' | 'pray' | 'complete';
const DURATIONS = [2, 5, 10];

export function GuidedFlowScreen({ deviceId, session, onFinish, initialStep = 'scripture' }: Props) {
  const [step, setStep] = useState<Step>(initialStep);
  const [reflectionText, setReflectionText] = useState('');
  const [meditateMinutes, setMeditateMinutes] = useState(2);
  const [prayerChoice, setPrayerChoice] = useState<'guided' | 'write' | null>(null);
  const [writtenPrayer, setWrittenPrayer] = useState('');
  const [favorited, setFavorited] = useState(false);
  const [flagState, setFlagState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [startedAt] = useState(() => Date.now());

  async function saveReflection() {
    if (reflectionText.trim()) {
      await addJournalEntry(deviceId, reflectionText.trim(), session.contentId);
    }
    setStep('meditate-select');
  }

  async function saveWrittenPrayer() {
    if (writtenPrayer.trim()) {
      await addJournalEntry(deviceId, `Prayer: ${writtenPrayer.trim()}`, session.contentId);
    }
    setStep('complete');
  }

  async function handleFavorite() {
    if (!session.contentId) return;
    setFavorited(true);
    await addFavorite(deviceId, session.contentId, session.verseText, session.verseReference);
  }

  async function handleFlag() {
    if (!session.contentId) return;
    setFlagState('sending');
    await flagContent(session.contentId, deviceId);
    setFlagState('done');
  }

  const elapsedMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));

  if (step === 'meditate-run') {
    return (
      <MeditationScreen
        verseText={session.verseText}
        verseReference={session.verseReference}
        totalSeconds={meditateMinutes * 60}
        onDone={() => setStep('pray')}
      />
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sourceLabel}>{session.sourceLabel}</Text>
      <StepDots step={step} />

      {step === 'scripture' && (
        <>
          <Text style={styles.eyebrow}>SCRIPTURE</Text>
          <Text style={styles.verse}>"{session.verseText}"</Text>
          <Text style={styles.reference}>— {session.verseReference}</Text>
          {session.contentId && (
            <Pressable onPress={handleFavorite} disabled={favorited} style={{ marginTop: 14 }}>
              <Text style={styles.favoriteStar}>{favorited ? '\u2605 Saved to favorites' : '\u2606 Save this verse'}</Text>
            </Pressable>
          )}
          <PrimaryButton label="Continue" onPress={() => setStep('reflect')} />
        </>
      )}

      {step === 'reflect' && (
        <>
          <Text style={styles.eyebrow}>REFLECTION</Text>
          <Text style={styles.prompt}>{session.reflectionPrompt}</Text>
          <TextInput
            placeholder="Write as much or as little as you'd like…"
            placeholderTextColor="#8A7DAD"
            value={reflectionText}
            onChangeText={setReflectionText}
            multiline
            style={styles.textArea}
          />
          <PrimaryButton label="Continue" onPress={saveReflection} />
          <Pressable onPress={() => setStep('meditate-select')}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </>
      )}

      {step === 'meditate-select' && (
        <>
          <Text style={styles.eyebrow}>MEDITATION</Text>
          <Text style={styles.prompt}>Take a deep breath. Release today's worries. Focus on God's presence.</Text>
          <Text style={styles.subPrompt}>Choose a length:</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map(d => (
              <Pressable key={d} onPress={() => setMeditateMinutes(d)} style={[styles.durationChip, meditateMinutes === d && styles.durationChipActive]}>
                <Text style={[styles.durationText, meditateMinutes === d && styles.durationTextActive]}>{d} min</Text>
              </Pressable>
            ))}
          </View>
          <PrimaryButton label="Begin Meditation" onPress={() => setStep('meditate-run')} />
        </>
      )}

      {step === 'pray' && (
        <>
          <Text style={styles.eyebrow}>PRAYER</Text>
          <Text style={styles.prompt}>Would you like to pray?</Text>

          {prayerChoice === null && (
            <View style={{ gap: 10, marginTop: 16 }}>
              <PrayerOption icon="🙏" label="Guided Prayer" onPress={() => setPrayerChoice('guided')} />
              <PrayerOption icon="✍️" label="Write a Prayer" onPress={() => setPrayerChoice('write')} />
            </View>
          )}

          {prayerChoice === 'guided' && (
            <>
              <View style={styles.prayerCard}>
                <Text style={styles.prayerText}>{session.prayerText}</Text>
              </View>
              <PrimaryButton label="Continue" onPress={() => setStep('complete')} />
            </>
          )}

          {prayerChoice === 'write' && (
            <>
              <TextInput
                placeholder="Write your prayer…"
                placeholderTextColor="#8A7DAD"
                value={writtenPrayer}
                onChangeText={setWrittenPrayer}
                multiline
                style={styles.textArea}
              />
              <PrimaryButton label="Continue" onPress={saveWrittenPrayer} />
            </>
          )}
        </>
      )}

      {step === 'complete' && (
        <>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.completeTitle}>Reflection Completed</Text>
          <Text style={styles.completeSub}>
            You spent about {elapsedMinutes} minute{elapsedMinutes === 1 ? '' : 's'} with today's reflection.
          </Text>

          {session.contentId && (
            <View style={styles.reviewRow}>
              {flagState === 'done' ? (
                <Text style={styles.flagDone}>Flagged — a reviewer will take a look.</Text>
              ) : (
                <Pressable onPress={handleFlag} disabled={flagState === 'sending'}>
                  <Text style={styles.flagLink}>
                    {flagState === 'sending' ? 'Flagging…' : "This didn't feel right \u2014 flag for review"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <PrimaryButton label="Done" onPress={onFinish} />
        </>
      )}
    </ScrollView>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.primaryBtn}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

function PrayerOption({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.prayerOption}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={styles.prayerOptionText}>{label}</Text>
    </Pressable>
  );
}

const STEP_ORDER: Step[] = ['scripture', 'reflect', 'meditate-select', 'pray', 'complete'];
function StepDots({ step }: { step: Step }) {
  const normalized = step === 'meditate-run' ? 'meditate-select' : step;
  const activeIndex = STEP_ORDER.indexOf(normalized);
  return (
    <View style={styles.dotsRow}>
      {STEP_ORDER.map((s, i) => (
        <View key={s} style={[styles.dot, i <= activeIndex && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: 20, paddingTop: 50, paddingBottom: 60, alignItems: 'stretch' },
  sourceLabel: { color: '#8A7DAD', fontSize: 11, textAlign: 'center', marginBottom: 10 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { backgroundColor: colors.teal },
  eyebrow: { color: '#B8823A', fontSize: 11, letterSpacing: 1.4, textAlign: 'center', marginBottom: 14 },
  verse: { color: colors.white, fontSize: 19, fontStyle: 'italic', textAlign: 'center', lineHeight: 27 },
  reference: { color: '#C9BEE0', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  favoriteStar: { color: '#E3B15E', fontSize: 13, textAlign: 'center' },
  prompt: { color: colors.white, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 8 },
  subPrompt: { color: '#B6ABCF', fontSize: 12.5, textAlign: 'center', marginTop: 14, marginBottom: 10 },
  textArea: { backgroundColor: 'rgba(255,255,255,0.07)', color: colors.white, borderRadius: 14, padding: 14, minHeight: 100, textAlignVertical: 'top', fontSize: 14, marginTop: 12 },
  skipText: { color: '#8A7DAD', fontSize: 12.5, textAlign: 'center', marginTop: 14 },
  durationRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  durationChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  durationChipActive: { backgroundColor: colors.teal },
  durationText: { color: '#D8CFEC', fontSize: 13, fontWeight: '600' },
  durationTextActive: { color: colors.bgDeep },
  prayerOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 },
  prayerOptionText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  prayerCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 18, marginTop: 12, marginBottom: 8 },
  prayerText: { color: colors.ink, fontSize: 14.5, lineHeight: 21 },
  checkmark: { color: colors.teal, fontSize: 40, textAlign: 'center', marginBottom: 10 },
  completeTitle: { color: colors.white, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  completeSub: { color: '#B6ABCF', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  reviewRow: { alignItems: 'center', marginBottom: 20 },
  flagLink: { color: '#8A7DAD', fontSize: 11.5, textDecorationLine: 'underline' },
  flagDone: { color: '#B8823A', fontSize: 11.5 },
  primaryBtn: { backgroundColor: colors.teal, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { color: colors.bgDeep, fontWeight: '700', fontSize: 14.5 },
});
