import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { LibraryBook, toggleBookmark } from '../api/client';

interface Props {
  deviceId: string;
  book: LibraryBook;
  onBack: () => void;
  onUpgradePress: () => void;
}

export function BookDetailScreen({ deviceId, book, onBack, onUpgradePress }: Props) {
  const [bookmarked, setBookmarked] = useState(book.bookmarked);
  const [progress, setProgress] = useState(book.locked ? 0 : 12);

  async function handleBookmark() {
    setBookmarked(!bookmarked);
    await toggleBookmark(deviceId, book.id);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>{'\u2190'} Library</Text>
      </Pressable>

      <View style={styles.cover}>
        <Text style={styles.coverInitial}>{book.title[0]}</Text>
      </View>

      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author} · {book.category} · {book.spiritualLevel}</Text>

      {book.isPremium && (
        <Text style={styles.premiumTag}>{book.locked ? 'PREMIUM \u2014 LOCKED' : 'PREMIUM \u2014 UNLOCKED'}</Text>
      )}

      <Text style={styles.summary}>{book.summary}</Text>

      {book.locked ? (
        <Pressable onPress={onUpgradePress} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Unlock with Premium</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{progress}% read</Text>

          <Pressable onPress={() => setProgress(Math.min(100, progress + 10))} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Continue reading</Text>
          </Pressable>
          <Text style={styles.note}>
            This tracks reading progress only — the actual book text isn't included here. A real build
            needs licensed full text (or a public-domain source) loaded per book before this is a real reader.
          </Text>
        </>
      )}

      <Pressable onPress={handleBookmark} style={styles.bookmarkRow}>
        <Text style={styles.bookmarkText}>{bookmarked ? '\u2605 Bookmarked' : '\u2606 Bookmark this book'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  back: { color: '#C9BEE0', fontSize: 14, marginBottom: 20 },
  cover: {
    width: 90, height: 120, borderRadius: 10, backgroundColor: colors.purple,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  coverInitial: { color: colors.white, fontSize: 36, fontWeight: '800' },
  title: { color: colors.white, fontSize: 21, fontWeight: '700', marginBottom: 4 },
  author: { color: '#B6ABCF', fontSize: 12.5, marginBottom: 8 },
  premiumTag: { color: '#E3B15E', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 14 },
  summary: { color: '#D8CFEC', fontSize: 14, lineHeight: 21, marginBottom: 22 },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: colors.teal },
  progressLabel: { color: '#8A7DAD', fontSize: 11, marginBottom: 16 },
  primaryBtn: { backgroundColor: colors.teal, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: colors.bgDeep, fontWeight: '700', fontSize: 14 },
  note: { color: '#6A6180', fontSize: 10.5, lineHeight: 14, marginBottom: 16 },
  bookmarkRow: { marginTop: 8 },
  bookmarkText: { color: '#E3B15E', fontSize: 13 },
});
