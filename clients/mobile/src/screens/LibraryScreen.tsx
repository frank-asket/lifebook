import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { fetchLibrary, toggleBookmark, LibraryBook } from '../api/client';

export function LibraryScreen({ deviceId, onUpgradePress, onOpenBook }: { deviceId: string; onUpgradePress: () => void; onOpenBook: (book: LibraryBook) => void }) {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetchLibrary(deviceId).then(r => setBooks(r.books)).finally(() => setLoading(false));
  }
  useEffect(load, [deviceId]);

  async function handleBookmark(bookId: string) {
    await toggleBookmark(deviceId, bookId);
    load();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Library</Text>
      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: 30 }} />
      ) : (
        books.map(b => (
          <Pressable key={b.id} onPress={() => onOpenBook(b)} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.bookTitle}>{b.title}</Text>
              {b.isPremium && (
                <Text style={styles.premiumTag}>{b.locked ? 'PREMIUM \u2022 LOCKED' : 'PREMIUM'}</Text>
              )}
            </View>
            <Text style={styles.author}>{b.author} · {b.category} · {b.spiritualLevel}</Text>
            <Text style={styles.summary}>{b.summary}</Text>
            <View style={styles.footerRow}>
              <Pressable onPress={() => handleBookmark(b.id)}>
                <Text style={styles.bookmark}>{b.bookmarked ? '\u2605 Bookmarked' : '\u2606 Bookmark'}</Text>
              </Pressable>
              {b.locked && (
                <Pressable onPress={onUpgradePress}>
                  <Text style={styles.unlockLink}>Unlock with Premium</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700', marginBottom: 18 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookTitle: { color: colors.white, fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 },
  premiumTag: { color: '#E3B15E', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  author: { color: '#8A7DAD', fontSize: 11.5, marginTop: 4, marginBottom: 8 },
  summary: { color: '#D8CFEC', fontSize: 13, lineHeight: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  bookmark: { color: '#E3B15E', fontSize: 12 },
  unlockLink: { color: colors.teal, fontSize: 12, fontWeight: '600' },
});
