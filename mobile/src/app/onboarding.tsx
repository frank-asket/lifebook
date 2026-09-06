import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Body, Card, Eyebrow, GhostButton, Pill, PrimaryButton, Screen, Title } from '@/components/ui';
import { track } from '@/lib/analytics';
import { moods, type MoodId } from '@/lib/content';
import { groups, useStore } from '@/lib/store';
import { colors, radius, spacing } from '@/lib/theme';

const paths = ['New to faith', 'Returning after a while', 'Steady practice', 'Rebuilding after a hard season'];
const habitOptions = ['Morning quiet', 'Evening wind-down', 'Scripture reading', 'Journaling', 'Meditation', 'Praying for others'];
const times = ['06:30', '07:30', '12:30', '21:00'];

const TOTAL_STEPS = 7;

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useStore();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [spiritualPath, setSpiritualPath] = useState(paths[0]);
  const [dailyHabits, setDailyHabits] = useState<string[]>([]);
  const [preferredMoods, setPreferredMoods] = useState<MoodId[]>([]);
  const [notificationTime, setNotificationTime] = useState(times[1]);
  const [groupId, setGroupId] = useState<string | null>(null);

  function toggle<T>(list: T[], value: T, setter: (next: T[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  function next() {
    void track('onboarding_step_completed', 'onboarding', { step });
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    completeOnboarding({
      displayName: displayName.trim() || 'Friend',
      spiritualPath,
      dailyHabits,
      notificationTime,
      preferredMoods,
      groupId,
    });
    void track('onboarding_completed', 'onboarding');
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <View key={index} style={[styles.progressBar, index < step && styles.progressBarActive]} />
        ))}
      </View>
      <Eyebrow>{`Step ${step} of ${TOTAL_STEPS}`}</Eyebrow>

      {step === 1 && (
        <>
          <Title>LifeBook</Title>
          <Body muted>
            A short daily practice: name how you arrived, read what was chosen for it, and take ten
            quiet minutes. Seven quick questions and you are in.
          </Body>
          <Card>
            <Body>Nothing here is shared without you choosing to share it. Your journal stays on this device.</Body>
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          <Title>What should we call you?</Title>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="First name"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="words"
          />
          <Body muted>Only used to greet you. Leave it blank if you would rather not say.</Body>
        </>
      )}

      {step === 3 && (
        <>
          <Title>Where are you in this?</Title>
          <View style={styles.wrap}>
            {paths.map((path) => (
              <Pill key={path} label={path} active={spiritualPath === path} onPress={() => setSpiritualPath(path)} />
            ))}
          </View>
        </>
      )}

      {step === 4 && (
        <>
          <Title>What are you hoping to keep up?</Title>
          <View style={styles.wrap}>
            {habitOptions.map((habit) => (
              <Pill
                key={habit}
                label={habit}
                active={dailyHabits.includes(habit)}
                onPress={() => toggle(dailyHabits, habit, setDailyHabits)}
              />
            ))}
          </View>
          <Body muted>Pick as many or as few as you like.</Body>
        </>
      )}

      {step === 5 && (
        <>
          <Title>Which of these describe you lately?</Title>
          <View style={styles.wrap}>
            {moods.map((mood) => (
              <Pill
                key={mood.id}
                label={mood.label}
                active={preferredMoods.includes(mood.id)}
                onPress={() => toggle(preferredMoods, mood.id, setPreferredMoods)}
              />
            ))}
          </View>
          <Body muted>
            These are the same six words the app opens with each day. If any of them read oddly to
            you, that is useful — say so.
          </Body>
        </>
      )}

      {step === 6 && (
        <>
          <Title>A group to start in</Title>
          <Body muted>Optional. You can read without posting, and leave whenever.</Body>
          {groups.map((group) => (
            <Card key={group.id} onPress={() => setGroupId(groupId === group.id ? null : group.id)}>
              <Body style={groupId === group.id ? styles.selectedText : undefined}>{group.name}</Body>
              <Body muted>{group.blurb}</Body>
            </Card>
          ))}
        </>
      )}

      {step === 7 && (
        <>
          <Title>{`That's it${displayName.trim() ? `, ${displayName.trim()}` : ''}.`}</Title>
          <Card>
            <Body muted>Path</Body>
            <Body>{spiritualPath}</Body>
            <Body muted>Habits</Body>
            <Body>{dailyHabits.length ? dailyHabits.join(' · ') : 'None chosen'}</Body>
            <Body muted>Group</Body>
            <Body>{groups.find((group) => group.id === groupId)?.name ?? 'None for now'}</Body>
          </Card>
          <Body muted>A gentle reminder each day at</Body>
          <View style={styles.wrap}>
            {times.map((time) => (
              <Pill key={time} label={time} active={notificationTime === time} onPress={() => setNotificationTime(time)} />
            ))}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <PrimaryButton label={step === TOTAL_STEPS ? 'Enter LifeBook' : 'Continue'} onPress={next} />
        {step > 1 && <GhostButton label="Back" onPress={() => setStep(step - 1)} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', gap: spacing.xs },
  progressBar: { flex: 1, height: 3, borderRadius: radius.pill, backgroundColor: colors.border },
  progressBarActive: { backgroundColor: colors.accent },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  selectedText: { color: colors.accent, fontWeight: '600' },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
});
