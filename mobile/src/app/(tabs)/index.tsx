import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { MoodGrid } from '@/components/mood-grid';
import { Body, Card, CrisisFooter, Eyebrow, Heading, Screen, Title } from '@/components/ui';
import { track } from '@/lib/analytics';
import { type MoodId } from '@/lib/content';
import { recommendJourney, useStore } from '@/lib/store';
import { colors, spacing } from '@/lib/theme';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const router = useRouter();
  const { state } = useStore();
  const { journey, progress, reason } = recommendJourney(state);

  useEffect(() => {
    void track('screen_view', 'home');
  }, []);

  function startCheckin(mood: MoodId) {
    void track('checkin_started', 'home', { mood });
    router.push({ pathname: '/flow', params: { mood } });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Eyebrow>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Eyebrow>
          <Title>{`${greeting()}${state.profile.displayName ? `, ${state.profile.displayName}` : ''}`}</Title>
        </View>
        <View style={styles.streak}>
          <Body style={styles.streakNumber}>{state.streak.current}</Body>
          <Body muted style={styles.streakLabel}>
            day streak
          </Body>
        </View>
      </View>

      <Heading>How did you arrive today?</Heading>
      <MoodGrid onSelect={startCheckin} />

      <Card
        onPress={() => {
          if (progress) {
            router.push({ pathname: '/flow', params: { journeyId: journey.id } });
          } else {
            router.push('/journeys');
          }
        }}
      >
        <Eyebrow>{progress ? 'Continue your journey' : 'Suggested journey'}</Eyebrow>
        <Heading>{journey.title}</Heading>
        <Body muted>
          {progress
            ? `Day ${progress.currentDay} of ${journey.days.length} · ${journey.days[progress.currentDay - 1].title}`
            : journey.subtitle}
        </Body>
        {reason ? <Body muted style={styles.reason}>{reason}</Body> : null}
      </Card>

      <Heading>Explore</Heading>
      <View style={styles.quickRow}>
        <Card style={styles.quick} onPress={() => router.push('/journeys')}>
          <Body>Journeys</Body>
          <Body muted>Five-day paths</Body>
        </Card>
        <Card style={styles.quick} onPress={() => router.push('/(tabs)/explore')}>
          <Body>Library</Body>
          <Body muted>Short readings</Body>
        </Card>
        <Card style={styles.quick} onPress={() => router.push('/progress')}>
          <Body>Progress</Body>
          <Body muted>Streak & journal</Body>
        </Card>
        <Card style={styles.quick} onPress={() => router.push('/(tabs)/community')}>
          <Body>Community</Body>
          <Body muted>Prayer & groups</Body>
        </Card>
      </View>

      <CrisisFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  streak: { alignItems: 'center' },
  streakNumber: { fontSize: 28, fontWeight: '700', color: colors.accent },
  streakLabel: { fontSize: 11 },
  reason: { fontStyle: 'italic' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quick: { flexGrow: 1, flexBasis: '45%' },
});
