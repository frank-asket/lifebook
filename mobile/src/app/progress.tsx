import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body, Card, Eyebrow, GhostButton, Heading, Pill, Screen, Title } from '@/components/ui';
import { track } from '@/lib/analytics';
import { moodLabel, moods } from '@/lib/content';
import { useStore } from '@/lib/store';
import { colors, radius, spacing } from '@/lib/theme';

export default function Progress() {
  const router = useRouter();
  const { state, toggleFavorite } = useStore();
  const [favouritesOnly, setFavouritesOnly] = useState(false);

  useEffect(() => {
    void track('screen_view', 'progress');
  }, []);

  const entries = favouritesOnly ? state.journal.filter((entry) => entry.favorite) : state.journal;
  const counts = moods.map((mood) => ({
    mood,
    count: state.checkins.filter((checkin) => checkin.mood === mood.id).length,
  }));
  const maxCount = Math.max(1, ...counts.map((item) => item.count));

  return (
    <Screen>
      <Title>Progress</Title>
      <Card>
        <Eyebrow>Streak</Eyebrow>
        <Body>{`${state.streak.current} days now · ${state.streak.longest} days at your longest`}</Body>
      </Card>

      <Heading>How you have been arriving</Heading>
      <Card>
        {counts.map(({ mood, count }) => (
          <View key={mood.id} style={styles.barRow}>
            <Body muted style={styles.barLabel}>
              {mood.label}
            </Body>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(count / maxCount) * 100}%` }]} />
            </View>
            <Body muted style={styles.barCount}>
              {count}
            </Body>
          </View>
        ))}
      </Card>

      <Heading>Journal</Heading>
      <View style={styles.filters}>
        <Pill label="All" active={!favouritesOnly} onPress={() => setFavouritesOnly(false)} />
        <Pill label="Favourites" active={favouritesOnly} onPress={() => setFavouritesOnly(true)} />
      </View>

      {entries.length === 0 ? (
        <Body muted>Nothing saved yet. Reflections you write during a flow land here.</Body>
      ) : (
        entries.map((entry) => (
          <Card key={entry.id}>
            <Eyebrow>{`${moodLabel(entry.mood)} · ${entry.verseReference} · ${new Date(entry.createdAt).toLocaleDateString()}`}</Eyebrow>
            <Body>{entry.text}</Body>
            <GhostButton
              label={entry.favorite ? 'Remove favourite' : 'Save as favourite'}
              onPress={() => toggleFavorite(entry.id)}
            />
          </Card>
        ))
      )}

      <GhostButton label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 82, fontSize: 13 },
  barTrack: { flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.accent },
  barCount: { width: 20, textAlign: 'right', fontSize: 13 },
  filters: { flexDirection: 'row', gap: spacing.sm },
});
