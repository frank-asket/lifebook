import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body, Card, Eyebrow, Heading, Screen, Title } from '@/components/ui';
import { track } from '@/lib/analytics';
import { books } from '@/lib/content';
import { useStore } from '@/lib/store';
import { colors, radius, spacing } from '@/lib/theme';

export default function Explore() {
  const router = useRouter();
  const { state } = useStore();

  useEffect(() => {
    void track('screen_view', 'explore');
  }, []);

  return (
    <Screen>
      <Title>Library</Title>
      <Body muted>Short readings that keep your place. Two are written in house; the rest are pending licensing.</Body>

      {books.map((book) => {
        const progress = state.books[book.id]?.progress ?? 0;
        return (
          <Card key={book.id} onPress={() => router.push({ pathname: '/book/[id]', params: { id: book.id } })}>
            <Eyebrow>{`${book.minutes} min · ${book.author}`}</Eyebrow>
            <Heading>{book.title}</Heading>
            <Body muted>{book.summary}</Body>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Body muted style={styles.meta}>
              {state.books[book.id]?.bookmarked ? 'Bookmarked · ' : ''}
              {progress > 0 ? `${Math.round(progress * 100)}% read` : book.excerpt ? 'Not started' : 'Text pending licensing'}
            </Body>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.accent },
  meta: { fontSize: 12, marginTop: spacing.xs },
});
