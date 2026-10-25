import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api, useApp } from '../lib/app';
import { ErrorLine } from '../components/ui';
import { versionFor } from '../../web/lib/bible-versions';

type Book = { id: string; name: string };
type Chapter = { id: string; number: string };

/** Choose a book, then a chapter. Opens as a sheet and returns to the reader. */
export default function Books() {
  const { c, t, prefs, setPrefs, bibleLocale } = useApp();
  const version = versionFor(bibleLocale, prefs.bibleVersions).id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const available = Math.min(720, width - insets.left - insets.right);
  const columns = Math.max(2, Math.min(5, Math.floor((available - 32) / Math.max(58, 48 * fontScale))));
  const cellWidth = (available - 32 - 10 * (columns - 1)) / columns;
  const [books, setBooks] = useState<Book[] | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const current = (prefs.chapterId ?? 'JHN.1').split('.')[0];
  useEffect(() => {
    if (book) return;
    let active = true; setError(''); setBooks(null);
    api<{ data: Book[] }>(`/bible-content/books?locale=${bibleLocale}&version=${version}`).then(r => { if (active) setBooks(r.data); }).catch(() => { if (active) setError(t.bible.error); });
    return () => { active = false; };
  }, [book, bibleLocale, version, attempt, t.bible.error]);
  useEffect(() => {
    if (!book) return;
    let active = true; setChapters(null); setError('');
    api<{ data: Chapter[] }>(`/bible-content/books/${encodeURIComponent(book.id)}/chapters?locale=${bibleLocale}&version=${version}`)
      .then(r => { if (active) setChapters(r.data.filter(x => /^\d+$/.test(x.number))); }).catch(() => { if (active) setError(t.bible.error); });
    return () => { active = false; };
  }, [book, bibleLocale, version, attempt, t.bible.error]);

  const header = <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}>
    {book ? <Pressable accessibilityRole="button" accessibilityLabel={t.bible.books} onPress={() => setBook(null)} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6 }}><Ionicons name="chevron-back" size={20} color={c.accent} /><Text style={{ color: c.accent, fontSize: 16 }}>{t.bible.books}</Text></Pressable> : <View />}
    <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 17, fontWeight: '700', flexShrink: 1 }}>{book ? book.name : t.bible.books}</Text>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 48, minWidth: 80, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 6 }}><Text style={{ color: c.accent, fontSize: 16 }}>{t.bible.cancel}</Text></Pressable>
  </View>;

  return <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
    <View style={{ flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
    {header}
    {error ? <View style={{ padding: 20 }}><ErrorLine message={error} onRetry={() => setAttempt(n => n + 1)} /></View>
      : book ? (chapters ? <FlatList key={columns} data={chapters} keyExtractor={x => x.id} numColumns={columns} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 10 }} columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${t.bible.chapter} ${item.number}`} accessibilityState={{ selected: item.id === prefs.chapterId }} onPress={() => { setPrefs({ chapterId: item.id }); router.back(); }}
            style={({ pressed }) => ({ width: cellWidth, minHeight: Math.max(48, 48 * fontScale), paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: item.id === prefs.chapterId ? c.accent : c.paper, borderWidth: 1, borderColor: c.line, opacity: pressed ? 0.72 : 1 })}>
            <Text style={{ color: item.id === prefs.chapterId ? c.accentInk : c.ink, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{item.number}</Text>
          </Pressable>} />
        : <ActivityIndicator accessibilityLabel={t.bible.loading} style={{ marginTop: 40 }} color={c.accent} />)
      : books ? <FlatList data={books} keyExtractor={x => x.id} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={item.name} accessibilityState={{ selected: item.id === current }} onPress={() => setBook(item)} style={({ pressed }) => ({ minHeight: 52, paddingVertical: 12, paddingHorizontal: 20, gap: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: pressed ? c.soft : 'transparent', borderBottomWidth: 1, borderBottomColor: c.line })}>
            <Text style={{ color: item.id === current ? c.accent : c.ink, fontSize: 17, fontWeight: item.id === current ? '700' : '400', flex: 1 }}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={16} color={c.muted} />
          </Pressable>} />
      : <ActivityIndicator accessibilityLabel={t.bible.loading} style={{ marginTop: 40 }} color={c.accent} />}
    </View>
  </View>;
}
