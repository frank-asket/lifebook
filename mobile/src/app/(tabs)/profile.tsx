import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';

import { Body, Card, CrisisFooter, Eyebrow, GhostButton, Heading, Screen, Title } from '@/components/ui';
import { clearEvents, readEvents, track, type AnalyticsEvent } from '@/lib/analytics';
import { computeBadges, groups, useStore } from '@/lib/store';
import { colors, spacing } from '@/lib/theme';

export default function Profile() {
  const router = useRouter();
  const { state, resetAll } = useStore();
  const [reminders, setReminders] = useState(true);
  const [events, setEvents] = useState<AnalyticsEvent[] | null>(null);
  const badges = computeBadges(state);

  useEffect(() => {
    void track('screen_view', 'profile');
  }, []);

  function confirmReset() {
    const wipe = () => {
      resetAll();
      void clearEvents();
      setEvents(null);
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      wipe();
      return;
    }
    Alert.alert('Erase everything?', 'Your journal, streak and progress are stored on this device only.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: wipe },
    ]);
  }

  return (
    <Screen>
      <Title>{state.profile.displayName || 'Friend'}</Title>
      <Body muted>{state.profile.spiritualPath}</Body>

      <Card onPress={() => router.push('/progress')}>
        <Eyebrow>Progress & journal</Eyebrow>
        <Body>
          {`${state.streak.current}-day streak · ${state.checkins.length} check-ins · ${state.journal.length} reflections`}
        </Body>
      </Card>

      <Heading>Badges</Heading>
      <View style={styles.badges}>
        {badges.map((badge) => (
          <Card key={badge.id} style={[styles.badge, !badge.earned && styles.badgeLocked]}>
            <Body style={badge.earned ? styles.badgeEarned : undefined}>{badge.label}</Body>
            <Body muted style={styles.badgeDetail}>
              {badge.detail}
            </Body>
          </Card>
        ))}
      </View>

      <Heading>Settings</Heading>
      <Card>
        <View style={styles.settingRow}>
          <Body>Daily reminder at {state.profile.notificationTime}</Body>
          <Switch
            value={reminders}
            onValueChange={setReminders}
            trackColor={{ true: colors.accentSoft, false: colors.border }}
            thumbColor={reminders ? colors.accent : colors.muted}
          />
        </View>
        <Body muted>Group: {groups.find((group) => group.id === state.profile.groupId)?.name ?? 'None'}</Body>
        <Body muted>Habits: {state.profile.dailyHabits.join(' · ') || 'None chosen'}</Body>
      </Card>

      <Heading>Instrumentation</Heading>
      <Card>
        <Body muted>
          Screen views and guided-flow steps are logged locally so drop-off is visible during the
          first user test. Nothing leaves this device.
        </Body>
        <GhostButton
          label={events ? 'Hide event log' : 'Show event log'}
          onPress={async () => setEvents(events ? null : await readEvents())}
        />
        {events?.slice(0, 25).map((event) => (
          <Body key={`${event.at}-${event.name}`} muted style={styles.event}>
            {`${new Date(event.at).toLocaleTimeString()} · ${event.name}${event.screen ? ` · ${event.screen}` : ''}`}
          </Body>
        ))}
      </Card>

      <GhostButton label="Erase all local data" onPress={confirmReset} />
      <CrisisFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: { flexGrow: 1, flexBasis: '45%' },
  badgeLocked: { opacity: 0.45 },
  badgeEarned: { color: colors.accent, fontWeight: '600' },
  badgeDetail: { fontSize: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  event: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
