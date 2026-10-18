import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, useApp } from '../lib/app';
import { ErrorLine } from '../components/ui';

type Book = { id: string; name: string };
type Chapter = { id: string; number: string };

/** Choose a book, then a chapter. Opens as a sheet and returns to the reader. */
export default function Books() {
  const { c, t, prefs, setPrefs, bibleLocale } = useApp();
  const router = useRouter();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const current = (prefs.chapterId ?? 'JHN.1').split('.')[0];
  useEffect(() => {
    let active = true; setError('');
    api<{ data: Book[] }>(`/bible-content/books?locale=${bibleLocale}`).then(r => { if (active) setBooks(r.data); }).catch(() => { if (active) setError(t.bible.error); });
    return () => { active = false; };
  }, [bibleLocale, attempt, t.bible.error]);
  useEffect(() => {
    if (!book) return;
    let active = true; setChapters(null);
    api<{ data: Chapter[] }>(`/bible-content/books/${encodeURIComponent(book.id)}/chapters?locale=${bibleLocale}`)
      .then(r => { if (active) setChapters(r.data.filter(x => /^\d+$/.test(x.number))); }).catch(() => { if (active) setError(t.bible.error); });
    return () => { active = false; };
  }, [book, bibleLocale, t.bible.error]);

  const header = <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}>
    {book ? <Pressable accessibilityRole="button" accessibilityLabel={t.bible.books} onPress={() => setBook(null)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6 }}><Ionicons name="chevron-back" size={20} color={c.accent} /><Text style={{ color: c.accent, fontSize: 16 }}>{t.bible.books}</Text></Pressable> : <View style={{ width: 80 }} />}
    <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 17, fontWeight: '700' }}>{book ? book.name : t.bible.books}</Text>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 44, minWidth: 80, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 6 }}><Text style={{ color: c.accent, fontSize: 16 }}>{t.bible.cancel}</Text></Pressable>
  </View>;

  return <View style={{ flex: 1, backgroundColor: c.bg }}>
    {header}
    {error ? <View style={{ padding: 20 }}><ErrorLine message={error} onRetry={() => setAttempt(n => n + 1)} /></View>
      : book ? (chapters ? <FlatList data={chapters} keyExtractor={x => x.id} numColumns={5} contentContainerStyle={{ padding: 16, gap: 10 }} columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${t.bible.chapter} ${item.number}`} onPress={() => { setPrefs({ chapterId: item.id }); router.back(); }}
            style={({ pressed }) => ({ flex: 1, maxWidth: '18%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: item.id === prefs.chapterId ? c.accent : c.paper, borderWidth: 1, borderColor: c.line, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
            <Text style={{ color: item.id === prefs.chapterId ? c.accentInk : c.ink, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{item.number}</Text>
          </Pressable>} />
        : <ActivityIndicator style={{ marginTop: 40 }} color={c.accent} />)
      : books ? <FlatList data={books} keyExtractor={x => x.id} contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => setBook(item)} style={({ pressed }) => ({ minHeight: 50, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: pressed ? c.soft : 'transparent', borderBottomWidth: 1, borderBottomColor: c.line })}>
            <Text style={{ color: item.id === current ? c.accent : c.ink, fontSize: 17, fontWeight: item.id === current ? '700' : '400' }}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={16} color={c.muted} />
          </Pressable>} />
      : <ActivityIndicator style={{ marginTop: 40 }} color={c.accent} />}
  </View>;
}
