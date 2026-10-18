import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, useApp, useSession } from '../../lib/app';
import { fonts } from '../../lib/theme';
import { ErrorLine } from '../../components/ui';
import { bookName, parseVerses } from '../../../web/lib/scripture';

type Chapter = { id: string; number: string };
type Content = { id: string; reference: string; content: string; copyright?: string };
type Translation = { name?: string; nameLocal?: string; abbreviation?: string };

const SIZES = { s: 17, m: 19, l: 22, xl: 25 } as const;

export default function Bible() {
  const { c, t, prefs, setPrefs, bibleLocale } = useApp();
  const session = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const chapterId = prefs.chapterId ?? 'JHN.1';
  const bookId = chapterId.split('.')[0];
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [content, setContent] = useState<Content | null>(null);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [placeFailed, setPlaceFailed] = useState(false);
  const [resumed, setResumed] = useState(false);

  // First open: pick up where the reader left off on any device.
  useEffect(() => {
    if (resumed || !session.isSignedIn) return;
    setResumed(true);
    if (prefs.chapterId) return;
    session.getToken().then(token => token ? api<{ locale: 'en' | 'fr'; chapterId: string } | null>('/bible-reading/continue', token) : null)
      .then(item => { if (item) setPrefs({ chapterId: item.chapterId, bibleLocale: item.locale }); }).catch(() => undefined);
  }, [session.isSignedIn, resumed, prefs.chapterId, session.getToken, setPrefs]);

  useEffect(() => {
    let active = true;
    setChapters([]);
    api<{ data: Chapter[] }>(`/bible-content/books/${encodeURIComponent(bookId)}/chapters?locale=${bibleLocale}`)
      .then(r => { if (active) setChapters(r.data.filter(x => /^\d+$/.test(x.number))); }).catch(() => undefined);
    api<{ data: Translation }>(`/bible-content/translation?locale=${bibleLocale}`).then(r => { if (active) setTranslation(r.data); }).catch(() => undefined);
    return () => { active = false; };
  }, [bookId, bibleLocale]);

  useEffect(() => {
    let active = true;
    setContent(null); setError(''); setPlaceFailed(false);
    api<{ data: Content }>(`/bible-content/chapters/${encodeURIComponent(chapterId)}?locale=${bibleLocale}`)
      .then(r => {
        if (!active) return;
        setContent(r.data);
        scroller.current?.scrollTo({ y: 0, animated: false });
        if (session.isSignedIn) session.getToken().then(token => api('/bible-reading/history', token, { method: 'PUT', body: JSON.stringify({ locale: bibleLocale, chapterId }) })).catch(() => { if (active) setPlaceFailed(true); });
      })
      .catch(() => { if (active) setError(t.bible.error); });
    return () => { active = false; };
  }, [chapterId, bibleLocale, attempt, session.isSignedIn, session.getToken, t.bible.error]);

  const index = chapters.findIndex(x => x.id === chapterId);
  const previous = index > 0 ? chapters[index - 1] : undefined;
  const next = index >= 0 ? chapters[index + 1] : undefined;
  const paragraphs = useMemo(() => content ? parseVerses(content.content) : [], [content]);
  const size = SIZES[prefs.reader.size];
  const leading = prefs.reader.spacing === 'relaxed' ? 2.2 : 1.8;
  const family = prefs.reader.font === 'sans' ? undefined : fonts.serif;
  const iconButton = (name: keyof typeof Ionicons.glyphMap, label: string, onPress: (() => void) | undefined) =>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !onPress }} disabled={!onPress} onPress={onPress} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, opacity: onPress ? 1 : 0.35, backgroundColor: pressed ? c.soft : 'transparent' })}>
      <Ionicons name={name} size={20} color={c.muted} />
    </Pressable>;
  const picker = (label: string, value: string, a11y: string, flex: boolean) =>
    <Pressable accessibilityRole="button" accessibilityLabel={`${a11y}: ${value}`} onPress={() => router.push('/books')} style={({ pressed }) => ({ flex: flex ? 1 : undefined, minWidth: flex ? undefined : 64, minHeight: 40, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      <Text numberOfLines={1} style={{ color: c.ink, fontSize: 15, fontWeight: '700' }}>{label}</Text>
      <Ionicons name="chevron-down" size={14} color={c.muted} />
    </Pressable>;

  return <View style={{ flex: 1, backgroundColor: c.bg }}>
    <View accessibilityLabel={t.bible.nav} style={{ paddingTop: insets.top + 4, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: c.bg }}>
      {iconButton('chevron-back', t.bible.prev, previous ? () => setPrefs({ chapterId: previous.id }) : undefined)}
      {picker(bookName(bookId, bibleLocale), bookName(bookId, bibleLocale), t.bible.book, true)}
      {picker(chapterId.split('.')[1], chapterId.split('.')[1], t.bible.chapter, false)}
      {iconButton('chevron-forward', t.bible.next, next ? () => setPrefs({ chapterId: next.id }) : undefined)}
      <Pressable accessibilityRole="button" accessibilityLabel={t.bible.settings} onPress={() => router.push('/reader-settings')} style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: pressed ? c.soft : 'transparent' })}>
        <Text style={{ color: c.accent, fontFamily: fonts.serif, fontSize: 18, fontWeight: '700' }}>Aa</Text>
      </Pressable>
    </View>
    <ScrollView ref={scroller} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
      {error ? <ErrorLine message={error} onRetry={() => setAttempt(n => n + 1)} />
        : !content ? <View accessible accessibilityLabel={t.bible.loading} style={{ paddingVertical: 60 }}><ActivityIndicator color={c.accent} /></View>
        : <>
          {placeFailed ? <Text accessibilityRole="alert" style={{ color: c.muted, fontSize: 13, marginBottom: 12 }}>{t.bible.placeNotSaved}</Text> : null}
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center', marginBottom: 22 }}>{content.reference}</Text>
          {paragraphs.map((p, i) => <Text key={i} style={{ color: c.ink, fontFamily: family, fontSize: size, lineHeight: Math.round(size * leading), marginBottom: size }}>
            {p.map((v, j) => <Text key={j}>{v.number ? <Text style={{ color: c.accent, fontSize: Math.round(size * 0.6), fontWeight: '700', fontFamily: 'System' }}>{v.number}{' '}</Text> : null}{v.text} </Text>)}
          </Text>)}
          <View style={{ marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.line, gap: 4 }}>
            <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>{translation?.nameLocal ?? translation?.name ?? 'API.Bible'}</Text>
            {content.copyright ? <Text style={{ color: c.muted, fontSize: 12 }}>{content.copyright}</Text> : null}
          </View>
        </>}
    </ScrollView>
  </View>;
}
