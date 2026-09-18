import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { MeditationScreen } from './MeditationScreen';
import { addJournalEntry, addFavorite, flagContent } from '../api/client';
import { trackEvent } from '../analytics/telemetry';

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

  // Habit timer & telemetry tracking
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [stepElapsedSeconds, setStepElapsedSeconds] = useState(0);
  const habitAchievedFired = useRef(false);

  useEffect(() => {
    trackEvent('guided_flow_started', { initialStep, contentId: session.contentId }, deviceId);
    trackEvent('guided_step_viewed', { step: initialStep, estimatedSeconds: 60 }, deviceId);
  }, [deviceId, initialStep, session.contentId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalElapsedSeconds(prev => {
        const next = prev + 1;
        if (next >= 300 && !habitAchievedFired.current) {
          habitAchievedFired.current = true;
          trackEvent('habit_5min_achieved', { totalSeconds: next }, deviceId);
        }
        return next;
      });
      setStepElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [deviceId]);

  function transitionToStep(nextStep: Step) {
    trackEvent('guided_step_completed', {
      step,
      dwellSeconds: stepElapsedSeconds,
      totalElapsedSeconds,
    }, deviceId);

    trackEvent('guided_step_viewed', {
      step: nextStep,
    }, deviceId);

    setStepElapsedSeconds(0);
    setStep(nextStep);
  }

  async function saveReflection() {
    if (reflectionText.trim()) {
      await addJournalEntry(deviceId, reflectionText.trim(), session.contentId);
    }
    transitionToStep('meditate-select');
  }

  async function saveWrittenPrayer() {
    if (writtenPrayer.trim()) {
      await addJournalEntry(deviceId, `Prayer: ${writtenPrayer.trim()}`, session.contentId);
    }
    trackEvent('guided_flow_completed', {
      totalSeconds: totalElapsedSeconds,
      habit5MinAchieved: totalElapsedSeconds >= 300,
      contentId: session.contentId,
    }, deviceId);
    transitionToStep('complete');
  }

  async function handleFavorite() {
    if (!session.contentId) return;
    setFavorited(true);
    trackEvent('scripture_favorited', {
      contentId: session.contentId,
      verseReference: session.verseReference,
    }, deviceId);
    await addFavorite(deviceId, session.contentId, session.verseText, session.verseReference);
  }

  async function handleFlag() {
    if (!session.contentId) return;
    setFlagState('sending');
    trackEvent('content_flagged', { contentId: session.contentId }, deviceId);
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
        onDone={() => transitionToStep('pray')}
      />
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sourceLabel}>{session.sourceLabel}</Text>
      <StepDots step={step} />

      <SubtleProgressTimer
        step={step}
        stepSeconds={stepElapsedSeconds}
        totalSeconds={totalElapsedSeconds}
        meditateMinutes={meditateMinutes}
      />

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
          <PrimaryButton label="Continue" onPress={() => transitionToStep('reflect')} />
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
          <Pressable onPress={() => transitionToStep('meditate-select')}>
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
          <PrimaryButton label="Begin Meditation" onPress={() => transitionToStep('meditate-run')} />
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
              <PrimaryButton
                label="Continue"
                onPress={() => {
                  trackEvent('guided_flow_completed', {
                    totalSeconds: totalElapsedSeconds,
                    habit5MinAchieved: totalElapsedSeconds >= 300,
                    contentId: session.contentId,
                  }, deviceId);
                  transitionToStep('complete');
                }}
              />
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
            {totalElapsedSeconds >= 300 ? ' Daily 5-minute habit completed! 🌿' : ''}
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

interface SubtleTimerProps {
  step: Step;
  stepSeconds: number;
  totalSeconds: number;
  meditateMinutes: number;
}

function SubtleProgressTimer({ step, stepSeconds, totalSeconds, meditateMinutes }: SubtleTimerProps) {
  if (step === 'complete' || step === 'meditate-run') return null;

  let phaseLabel = 'Scripture Reading';
  let phaseTargetSec = 60; // 1 min target for thoughtful scripture reading

  if (step === 'reflect') {
    phaseLabel = 'Reflection & Journaling';
    phaseTargetSec = 90;
  } else if (step === 'meditate-select') {
    phaseLabel = 'Centering & Breathing';
    phaseTargetSec = meditateMinutes * 60;
  } else if (step === 'pray') {
    phaseLabel = 'Prayer & Committal';
    phaseTargetSec = 60;
  }

  const phaseProgress = Math.min(1, stepSeconds / phaseTargetSec);
  const habitProgress = Math.min(1, totalSeconds / 300); // 5 min goal (300s)

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const remainingInPhase = Math.max(0, phaseTargetSec - stepSeconds);

  return (
    <View style={styles.timerCard}>
      <View style={styles.timerRowTop}>
        <View style={styles.phaseIndicator}>
          <View style={styles.phaseDot} />
          <Text style={styles.phaseTitle}>
            {phaseLabel} <Text style={styles.phaseEst}>• ~{Math.ceil(phaseTargetSec / 60)} min pace</Text>
          </Text>
        </View>

        <Text style={styles.habitBadge}>
          {totalSeconds >= 300 ? '✨ 5-min habit reached' : `${formatSec(totalSeconds)} / 5:00 habit`}
        </Text>
      </View>

      {/* Scripture & phase micro progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(phaseProgress * 100)}%` }]} />
      </View>

      <View style={styles.timerRowBottom}>
        <Text style={styles.timerHint}>
          {step === 'scripture'
            ? remainingInPhase > 0
              ? `Estimated ~${remainingInPhase}s to read & absorb deeply`
              : 'Well contemplated • Continue whenever you are ready'
            : remainingInPhase > 0
            ? `Estimated ~${remainingInPhase}s for this phase`
            : 'Pace completed • Continue at your own rhythm'}
        </Text>
        <Text style={styles.timerHabitPercent}>{Math.round(habitProgress * 100)}% daily target</Text>
      </View>
    </View>
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
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { backgroundColor: colors.teal },

  // Subtle progress timer styles
  timerCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timerRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
  },
  phaseTitle: {
    color: '#E0D8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  phaseEst: {
    color: '#8A7DAD',
    fontSize: 11,
    fontWeight: '400',
  },
  habitBadge: {
    color: '#B8823A',
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 2,
  },
  timerRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerHint: {
    color: '#8A7DAD',
    fontSize: 10.5,
  },
  timerHabitPercent: {
    color: '#B6ABCF',
    fontSize: 10.5,
  },

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

