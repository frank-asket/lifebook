import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { MoodGrid } from '@/components/mood-grid';
import { Body, Card, CrisisFooter, Eyebrow, Heading, Screen, Title } from '@/components/ui';
import { track } from '@/lib/analytics';
import { recommendJourney, useStore } from '@/lib/store';

export default function Practice() {
  const router = useRouter();
  const { state } = useStore();
  const { journey, progress } = recommendJourney(state);
  const lastMood = state.checkins[0]?.mood;

  useEffect(() => {
    void track('screen_view', 'practice');
  }, []);

  return (
    <Screen>
      <Title>Practice</Title>
      <Body muted>Everything that takes ten minutes or fewer, in one place.</Body>

      <Heading>Start a check-in</Heading>
      <MoodGrid
        onSelect={(mood) => {
          void track('checkin_started', 'practice', { mood });
          router.push({ pathname: '/flow', params: { mood } });
        }}
      />

      {lastMood ? (
        <Card onPress={() => router.push({ pathname: '/flow', params: { mood: lastMood } })}>
          <Eyebrow>Same as yesterday</Eyebrow>
          <Body>Run the flow again as {lastMood}.</Body>
        </Card>
      ) : null}

      <Card onPress={() => router.push({ pathname: '/flow', params: { journeyId: journey.id } })}>
        <Eyebrow>{progress ? `Day ${progress.currentDay} of ${journey.days.length}` : 'Journey'}</Eyebrow>
        <Body>{journey.title}</Body>
        <Body muted>{journey.subtitle}</Body>
      </Card>

      <Card onPress={() => router.push('/progress')}>
        <Eyebrow>Journal</Eyebrow>
        <Body>{state.journal.length ? `${state.journal.length} saved reflections` : 'Nothing saved yet'}</Body>
      </Card>

      <CrisisFooter />
    </Screen>
  );
}
