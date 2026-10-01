import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body, Card, Eyebrow, GhostButton, Heading, PrimaryButton, Screen, Title } from '@/components/ui';
import { track } from '@/lib/analytics';
import { journeys, moodLabel } from '@/lib/content';
import { useStore } from '@/lib/store';
import { colors, radius, spacing } from '@/lib/theme';

export default function Journeys() {
  const router = useRouter();
  const { state, startJourney } = useStore();

  useEffect(() => {
    void track('screen_view', 'journeys');
  }, []);

  return (
    <Screen>
      <Title>Journeys</Title>
      <Body muted>
        Five days each, one sitting per day, running through the same guided flow as a daily
        check-in.
      </Body>

      {journeys.map((journey) => {
        const progress = state.journeyProgress.find((entry) => entry.journeyId === journey.id);
        const done = Boolean(progress?.completedAt);
        return (
          <Card key={journey.id}>
            <Eyebrow>{journey.recommendedMoods.map(moodLabel).join(' · ')}</Eyebrow>
            <Heading>{journey.title}</Heading>
            <Body muted>{journey.subtitle}</Body>

            <View style={styles.dots}>
              {journey.days.map((day) => (
                <View
                  key={day.day}
                  style={[styles.dot, (progress?.completedDays.includes(day.day) ?? false) && styles.dotDone]}
                />
              ))}
            </View>

            {done ? (
              <Body muted>Completed {new Date(progress!.completedAt!).toLocaleDateString()}</Body>
            ) : progress ? (
              <PrimaryButton
                label={`Continue — day ${progress.currentDay}`}
                onPress={() => router.push({ pathname: '/flow', params: { journeyId: journey.id } })}
              />
            ) : (
              <GhostButton
                label="Start this journey"
                onPress={() => {
                  startJourney(journey.id);
                  void track('journey_started', 'journeys', { journeyId: journey.id });
                  router.push({ pathname: '/flow', params: { journeyId: journey.id } });
                }}
              />
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: spacing.xs },
  dot: { width: 28, height: 4, borderRadius: radius.pill, backgroundColor: colors.border },
  dotDone: { backgroundColor: colors.accent },
});
