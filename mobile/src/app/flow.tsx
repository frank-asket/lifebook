import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Body, Card, Eyebrow, GhostButton, Heading, Pill, PrimaryButton, Screen, Title } from '@/components/ui';
import { track } from '@/lib/analytics';
import { journeys, moodLabel, MOOD_IDS, type MoodId } from '@/lib/content';
import { detectDistress, generateContent } from '@/lib/orchestrator';
import { useStore } from '@/lib/store';
import { colors, radius, spacing } from '@/lib/theme';

const STEP_NAMES = ['Scripture', 'Reflect', 'Meditate', 'Pray', 'Complete'] as const;
const DURATIONS = [2, 5, 10];

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function GuidedFlow() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mood?: string; journeyId?: string }>();
  const { state, completeFlow } = useStore();

  const journey = params.journeyId ? journeys.find((item) => item.id === params.journeyId) : undefined;
  const journeyProgress = journey
    ? state.journeyProgress.find((entry) => entry.journeyId === journey.id && !entry.completedAt)
    : undefined;
  const journeyDay = journey ? journey.days[(journeyProgress?.currentDay ?? 1) - 1] : undefined;

  const mood: MoodId = useMemo(() => {
    const fromParams = MOOD_IDS.find((item) => item === params.mood);
    if (fromParams) return fromParams;
    return journey?.recommendedMoods[0] ?? state.checkins[0]?.mood ?? 'seeking';
  }, [params.mood, journey, state.checkins]);

  const [step, setStep] = useState(0);
  const [reflection, setReflection] = useState('');
  const [minutes, setMinutes] = useState(DURATIONS[0]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [ownPrayer, setOwnPrayer] = useState('');
  const [writingPrayer, setWritingPrayer] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const content = useMemo(() => generateContent(mood, undefined, journeyDay?.verseId), [mood, journeyDay]);
  const supportSuggested = detectDistress(`${reflection} ${ownPrayer}`);

  useEffect(() => {
    void track('flow_step_viewed', 'flow', { step: STEP_NAMES[step], mood });
  }, [step, mood]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function startTimer() {
    if (timer.current) clearInterval(timer.current);
    setRemaining(minutes * 60);
    timer.current = setInterval(() => {
      setRemaining((value) => {
        if (value === null) return null;
        if (value <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }

  function advance() {
    void track('flow_step_completed', 'flow', { step: STEP_NAMES[step], mood });
    if (step < STEP_NAMES.length - 1) {
      setStep(step + 1);
      return;
    }
    completeFlow({
      mood,
      note: reflection.trim() || null,
      verseReference: content.verse.reference,
      reflection: reflection.trim() || null,
      journeyId: journey?.id,
    });
    void track('flow_completed', 'flow', { mood, journeyId: journey?.id ?? '' });
    router.back();
  }

  function abandon() {
    void track('flow_abandoned', 'flow', { step: STEP_NAMES[step], mood });
    router.back();
  }

  return (
    <Screen>
      <View style={styles.progressRow}>
        {STEP_NAMES.map((name, index) => (
          <View key={name} style={[styles.progressBar, index <= step && styles.progressBarActive]} />
        ))}
      </View>
      <Eyebrow>
        {journey
          ? `${journey.title} · Day ${journeyProgress?.currentDay ?? 1} · ${STEP_NAMES[step]}`
          : `Arriving ${moodLabel(mood).toLowerCase()} · ${STEP_NAMES[step]}`}
      </Eyebrow>

      {step === 0 && (
        <>
          <Title style={styles.verse}>{`“${content.verse.text}”`}</Title>
          <Body muted>{content.verse.reference}</Body>
          <Card>
            <Eyebrow>Why this verse</Eyebrow>
            <Body>{content.whyThisVerse}</Body>
          </Card>
          {journeyDay ? (
            <Card>
              <Eyebrow>{`Day ${journeyDay.day} — ${journeyDay.title}`}</Eyebrow>
              <Body muted>{journeyDay.focus}</Body>
            </Card>
          ) : null}
        </>
      )}

      {step === 1 && (
        <>
          <Heading>{content.reflectionQuestion}</Heading>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            placeholder="Optional. Saved privately to your journal."
            placeholderTextColor={colors.muted}
            multiline
            style={styles.textArea}
          />
          <Body muted>Skipping is fine. Plenty of days do not have words in them.</Body>
        </>
      )}

      {step === 2 && (
        <>
          <Heading>Sit with it</Heading>
          <Body muted>{content.meditation}</Body>
          <View style={styles.row}>
            {DURATIONS.map((value) => (
              <Pill
                key={value}
                label={`${value} min`}
                active={minutes === value}
                onPress={() => {
                  setMinutes(value);
                  setRemaining(null);
                  if (timer.current) clearInterval(timer.current);
                }}
              />
            ))}
          </View>
          <Card style={styles.timerCard}>
            <Title style={styles.timer}>{formatClock(remaining ?? minutes * 60)}</Title>
            <GhostButton
              label={remaining === null ? 'Begin' : remaining === 0 ? 'Done' : 'Restart'}
              onPress={startTimer}
            />
          </Card>
        </>
      )}

      {step === 3 && (
        <>
          <Heading>{writingPrayer ? 'Your words' : 'A prayer for today'}</Heading>
          {writingPrayer ? (
            <TextInput
              value={ownPrayer}
              onChangeText={setOwnPrayer}
              placeholder="Write your own."
              placeholderTextColor={colors.muted}
              multiline
              style={styles.textArea}
            />
          ) : (
            <Card>
              <Body style={styles.prayer}>{content.prayer}</Body>
            </Card>
          )}
          <GhostButton
            label={writingPrayer ? 'Use the guided prayer' : 'Write my own instead'}
            onPress={() => setWritingPrayer(!writingPrayer)}
          />
        </>
      )}

      {step === 4 && (
        <>
          <Title>Done for today.</Title>
          <Card>
            <Eyebrow>One small thing</Eyebrow>
            <Body>{content.actionStep}</Body>
          </Card>
          <Card>
            <Eyebrow>Streak</Eyebrow>
            <Body>
              {state.streak.lastCompletedOn === new Date().toISOString().slice(0, 10)
                ? `${state.streak.current} days — already counted today.`
                : `${state.streak.current + 1} days after this one.`}
            </Body>
          </Card>
          {supportSuggested ? (
            <Card style={styles.support}>
              <Body>
                Some of what you wrote sounded heavy. If you want a person right now: call or text
                988 (US), or text HOME to 741741.
              </Body>
            </Card>
          ) : null}
        </>
      )}

      <View style={styles.actions}>
        <PrimaryButton
          label={step === STEP_NAMES.length - 1 ? 'Finish' : step === 1 && !reflection.trim() ? 'Skip' : 'Continue'}
          onPress={advance}
        />
        <GhostButton label="Close" onPress={abandon} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', gap: spacing.xs },
  progressBar: { flex: 1, height: 3, borderRadius: radius.pill, backgroundColor: colors.border },
  progressBarActive: { backgroundColor: colors.accent },
  verse: { fontSize: 24, lineHeight: 34, fontWeight: '500' },
  textArea: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 140,
    color: colors.text,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  timerCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  timer: { fontSize: 48, fontVariant: ['tabular-nums'] },
  prayer: { fontSize: 17, lineHeight: 27 },
  support: { borderColor: colors.danger },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
