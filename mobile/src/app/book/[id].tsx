import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body, Card, Eyebrow, GhostButton, PrimaryButton, Screen, Title } from '@/components/ui';
import { track } from '@/lib/analytics';
import { books } from '@/lib/content';
import { useStore } from '@/lib/store';
import { colors, radius, spacing } from '@/lib/theme';

export default function BookDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, setBookState } = useStore();
  const book = books.find((item) => item.id === id);

  useEffect(() => {
    void track('screen_view', 'book_detail', { bookId: id ?? '' });
  }, [id]);

  if (!book) {
    return (
      <Screen>
        <Title>Not found</Title>
        <GhostButton label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  const progress = state.books[book.id]?.progress ?? 0;
  const bookmarked = state.books[book.id]?.bookmarked ?? false;

  return (
    <Screen>
      <Eyebrow>{`${book.minutes} min · ${book.author}`}</Eyebrow>
      <Title>{book.title}</Title>
      <Body muted>{book.summary}</Body>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      {book.excerpt ? (
        <Card>
          <Body style={styles.excerpt}>{book.excerpt}</Body>
        </Card>
      ) : (
        <Card>
          <Body muted>
            The full text of this title is not in the app yet — it is a licensing conversation, not
            an engineering one. The summary above is ours.
          </Body>
        </Card>
      )}

      <PrimaryButton
        label={progress >= 1 ? 'Read again' : progress > 0 ? 'Continue reading' : 'Start reading'}
        onPress={() => {
          const next = progress >= 1 ? 0.25 : Math.min(1, progress + 0.25);
          setBookState(book.id, { progress: next });
          void track('book_progress', 'book_detail', { bookId: book.id, progress: next });
        }}
      />
      <GhostButton
        label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        onPress={() => setBookState(book.id, { bookmarked: !bookmarked })}
      />
      <GhostButton label="Back to library" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.accent },
  excerpt: { fontSize: 16, lineHeight: 26, marginBottom: spacing.xs, color: colors.text },
});
