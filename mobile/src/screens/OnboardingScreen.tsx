import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, Image } from 'react-native';
import { colors, MOODS } from '../theme/colors';
import { savePreferences } from '../api/client';
import { trackEvent } from '../analytics/telemetry';

interface Props {
  deviceId: string;
  onComplete: () => void;
}

const PATHS = ['Peace Seeker', 'Bible Learner', 'Growing in Faith', 'New Believer'];
const HABITS = ['Daily verse', 'Prayer', 'Meditation', 'Journaling'];
const SUGGESTED_GROUP = { id: 'grp-new-believers', name: 'New Believers Table' };

export function OnboardingScreen({ deviceId, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [path, setPath] = useState<string | null>(null);
  const [habits, setHabits] = useState<string[]>([]);
  const [notificationTime, setNotificationTime] = useState('8:00 AM');
  const [favoriteMoods, setFavoriteMoods] = useState<string[]>([]);
  const [joinSuggested, setJoinSuggested] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const stepStartTime = useRef(Date.now());

  const TOTAL_STEPS = 7;

  useEffect(() => {
    trackEvent('onboarding_started', { totalSteps: TOTAL_STEPS }, deviceId);
  }, [deviceId]);

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  }

  async function finish() {
    setSaving(true);
    const dwellSeconds = Math.round((Date.now() - stepStartTime.current) / 1000);
    trackEvent('onboarding_completed', {
      displayName: displayName || undefined,
      spiritualPath: path || undefined,
      dailyHabits: habits,
      notificationTime,
      finalStepDwellSeconds: dwellSeconds,
    }, deviceId);

    try {
      await savePreferences(deviceId, {
        displayName: displayName || undefined,
        spiritualPath: path || undefined,
        dailyHabits: habits,
        notificationTime,
        onboardingCompletedAt: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
      onComplete();
    }
  }

  function next() {
    const dwellSeconds = Math.round((Date.now() - stepStartTime.current) / 1000);
    trackEvent('guided_step_completed', {
      flow: 'onboarding',
      stepIndex: step,
      dwellSeconds,
      pathChoice: path,
      habitsCount: habits.length,
    }, deviceId);

    stepStartTime.current = Date.now();

    if (step === TOTAL_STEPS - 1) {
      finish();
    } else {
      const nextStep = step + 1;
      setStep(nextStep);
      trackEvent('guided_step_viewed', {
        flow: 'onboarding',
        stepIndex: nextStep,
      }, deviceId);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 && (
          <StepShell title="Welcome to LifeBook" subtitle="A quiet moment with the Word, every day.">
            <Image source={require('../../assets/lifebook-logo.png')} style={styles.logo} />
            <Text style={styles.body}>
              "Be still, and know that I am God." — Psalm 46:10{'\n\n'}
              LifeBook meets you in how you actually feel and walks with you into scripture, prayer,
              and community from there.
            </Text>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title="What should we call you?" subtitle="Just for a personal touch — no account required yet.">
            <TextInput
              placeholder="Your first name"
              placeholderTextColor="#8A7DAD"
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.textInput}
            />
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="What brings you here today?" subtitle="Pick the path closest to where you are.">
            {PATHS.map(p => (
              <OptionRow key={p} label={p} selected={path === p} onPress={() => setPath(p)} />
            ))}
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Build a daily rhythm" subtitle="Which habits matter most to you? Pick as many as you like.">
            {HABITS.map(h => (
              <OptionRow key={h} label={h} selected={habits.includes(h)} onPress={() => toggle(habits, setHabits, h)} multi />
            ))}
            <Text style={[styles.body, { marginTop: 16 }]}>Preferred reminder time: {notificationTime}</Text>
            <View style={styles.timeRow}>
              {['7:00 AM', '8:00 AM', '9:00 PM'].map(t => (
                <Pressable key={t} onPress={() => setNotificationTime(t)} style={[styles.timeChip, notificationTime === t && styles.timeChipActive]}>
                  <Text style={[styles.timeChipText, notificationTime === t && styles.timeChipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="What moods matter most to you?" subtitle="This helps LifeBook know what to look out for.">
            {MOODS.map(m => (
              <OptionRow
                key={m.id}
                label={m.label}
                selected={favoriteMoods.includes(m.id)}
                onPress={() => toggle(favoriteMoods, setFavoriteMoods, m.id)}
                multi
              />
            ))}
          </StepShell>
        )}

        {step === 5 && (
          <StepShell title="Join a community?" subtitle="Based on your path, this group might be a good fit.">
            <View style={styles.groupCard}>
              <Text style={styles.groupName}>{SUGGESTED_GROUP.name}</Text>
              <Text style={styles.body}>No question too basic — a supportive space for people early in their faith.</Text>
            </View>
            <OptionRow label="Yes, suggest groups to me" selected={joinSuggested === true} onPress={() => setJoinSuggested(true)} />
            <OptionRow label="Not right now" selected={joinSuggested === false} onPress={() => setJoinSuggested(false)} />
          </StepShell>
        )}

        {step === 6 && (
          <StepShell title="You're all set" subtitle="Here's a quick look at what's next.">
            <Text style={styles.body}>
              • Home — check in with your mood and get today's verse{'\n'}
              • Community — groups, prayer requests, and discussion{'\n'}
              • Progress — streaks, badges, and your journal{'\n'}
              • Library — devotionals and theology to read{'\n\n'}
              You can change any of this later in Settings.
            </Text>
          </StepShell>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <Pressable onPress={() => setStep(step - 1)}>
            <Text style={styles.skipText}>Back</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }} />
        {step < TOTAL_STEPS - 1 && (
          <Pressable onPress={finish} style={{ marginRight: 20 }}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
        <Pressable onPress={next} disabled={saving} style={styles.nextBtn}>
          <Text style={styles.nextBtnText}>{step === TOTAL_STEPS - 1 ? (saving ? 'Saving…' : 'Get started') : 'Continue'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

function OptionRow({ label, selected, onPress, multi }: { label: string; selected: boolean; onPress: () => void; multi?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.optionRow, selected && styles.optionRowSelected]}>
      <View style={[multi ? styles.checkbox : styles.radio, selected && styles.optionMarkerSelected]} />
      <Text style={styles.optionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingTop: 54, paddingBottom: 10 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  progressDotActive: { backgroundColor: colors.teal },
  content: { padding: 20, paddingBottom: 40 },
  logo: { width: 64, height: 64, resizeMode: 'contain', alignSelf: 'center', marginVertical: 20 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#B6ABCF', fontSize: 13, marginBottom: 22 },
  body: { color: '#D8CFEC', fontSize: 14, lineHeight: 21 },
  textInput: { color: colors.white, fontSize: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10 },
  optionRowSelected: { backgroundColor: 'rgba(31,182,176,0.16)' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  optionMarkerSelected: { backgroundColor: colors.teal, borderColor: colors.teal },
  optionLabel: { color: colors.white, fontSize: 14, fontWeight: '600' },
  timeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  timeChipActive: { backgroundColor: colors.teal },
  timeChipText: { color: '#D8CFEC', fontSize: 12 },
  timeChipTextActive: { color: colors.bgDeep, fontWeight: '700' },
  groupCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 14 },
  groupName: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 6 },
  footer: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 30 },
  skipText: { color: '#8A7DAD', fontSize: 13 },
  nextBtn: { backgroundColor: colors.teal, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 12 },
  nextBtnText: { color: colors.bgDeep, fontWeight: '700', fontSize: 14 },
});
