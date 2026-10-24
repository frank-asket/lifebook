import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, useApp, useSession } from '../../lib/app';
import { reportScripture } from '../../lib/scripture-usage';
import { fonts } from '../../lib/theme';
import { Button, ErrorLine } from '../../components/ui';
import { AnnotationEditor } from '../../components/annotation-editor';
import { annotationAt, highlightColors, validVerseRange, type Annotation } from '../../lib/annotations';
import { requireToken } from '../../lib/api';
import { bookName, parseVerses } from '../../../web/lib/scripture';
import { readerText } from '../../lib/reader-style';

type Chapter = { id: string; number: string };
type Content = { id: string; reference: string; content: string; copyright?: string; fumsToken?: string | null };
type Translation = { name?: string; nameLocal?: string; abbreviation?: string };


export default function Bible() {
  const { c, t, prefs, setPrefs, bibleLocale, lang, dark } = useApp();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const session = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 400 || fontScale > 1.3;
  const scroller = useRef<ScrollView>(null);
  const positions = useRef<Record<number, { top?: number; lines?: { text: string; y: number }[] }>>({});
  const positioned = useRef<string | null>(null);
  const chapterId = prefs.chapterId ?? 'JHN.1';
  const bookId = chapterId.split('.')[0];
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [content, setContent] = useState<Content | null>(null);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [metadataError, setMetadataError] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [placeFailed, setPlaceFailed] = useState(false);
  const resumed = useRef(false);
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [verseTarget, setVerseTarget] = useState('1');
  const [verseError, setVerseError] = useState('');
  const [annotationAttempt, setAnnotationAttempt] = useState(0);
  const [annotations, setAnnotations] = useState<{ key: string; items: Annotation[]; error: string }>({ key: '', items: [], error: '' });
  const annotationKey = `${session.userId}:${bibleLocale}:${chapterId}`;
  const savedVerses = annotations.key === annotationKey ? annotations.items : [];
  useEffect(() => {
    if (!session.isSignedIn) return;
    const controller = new AbortController();
    (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const items = await api<Annotation[]>(`/bible-annotations?locale=${bibleLocale}&chapterId=${encodeURIComponent(chapterId)}`, token, { signal: controller.signal });
        if (!controller.signal.aborted) setAnnotations({ key: annotationKey, items, error: '' });
      } catch { if (!controller.signal.aborted) setAnnotations({ key: annotationKey, items: [], error: tr('Your saved verses could not be loaded.', 'Vos versets enregistrés n’ont pas pu être chargés.') }); }
    })();
    return () => controller.abort();
  }, [annotationKey, session.isSignedIn, session.getToken, annotationAttempt]);

  // First open: pick up where the reader left off on any device.
  useEffect(() => {
    if (resumed.current || !session.isSignedIn) return;
    resumed.current = true;
    if (prefs.chapterId) return;
    let active = true;
    session.getToken().then(token => active && token ? api<{ locale: 'en' | 'fr'; chapterId: string } | null>('/bible-reading/continue', token) : null)
      .then(item => { if (active && item) setPrefs({ chapterId: item.chapterId, bibleLocale: item.locale }); }).catch(() => undefined);
    return () => { active = false; };
  }, [session.isSignedIn, prefs.chapterId, session.getToken, setPrefs]);

  useEffect(() => {
    let active = true;
    setChapters([]); setTranslation(null); setMetadataError('');
    api<{ data: Chapter[] }>(`/bible-content/books/${encodeURIComponent(bookId)}/chapters?locale=${bibleLocale}`)
      .then(r => { if (active) setChapters(r.data.filter(x => /^\d+$/.test(x.number))); }).catch(() => { if (active) setMetadataError(t.bible.error); });
    api<{ data: Translation }>(`/bible-content/translation?locale=${bibleLocale}`).then(r => { if (active) setTranslation(r.data); }).catch(() => { if (active) setMetadataError(t.bible.error); });
    return () => { active = false; };
  }, [bookId, bibleLocale, attempt, t.bible.error]);

  useEffect(() => {
    let active = true;
    setContent(null); setError(''); setPlaceFailed(false);
    api<{ data: Content }>(`/bible-content/chapters/${encodeURIComponent(chapterId)}?locale=${bibleLocale}`)
      .then(r => {
        if (!active) return;
        positions.current = {}; positioned.current = null; setContent(r.data);
        scroller.current?.scrollTo({ y: 0, animated: false });
        if (session.isSignedIn) requireToken(session.getToken).then(token => active ? api('/bible-reading/history', token, { method: 'PUT', body: JSON.stringify({ locale: bibleLocale, chapterId, ...(prefs.verse ? { verse: prefs.verse } : {}) }) }) : null).catch(() => { if (active) setPlaceFailed(true); });
      })
      .catch(() => { if (active) setError(t.bible.error); });
    return () => { active = false; };
  }, [chapterId, bibleLocale, attempt, session.isSignedIn, session.getToken, t.bible.error]);

  const scrollToTarget = useCallback(() => {
    if (!content || content.id !== chapterId || !prefs.verse) return;
    const key = `${bibleLocale}:${content.id}:${prefs.verse}`;
    if (positioned.current === key) return;
    for (const paragraph of Object.values(positions.current)) {
      const line = paragraph.lines?.find(value => new RegExp(`(^|\\D)${prefs.verse} `).test(value.text));
      if (line && paragraph.top !== undefined) {
        scroller.current?.scrollTo({ y: Math.max(0, paragraph.top + line.y - 24), animated: false });
        positioned.current = key; return;
      }
    }
  }, [content, prefs.verse, bibleLocale, chapterId]);
  useFocusEffect(useCallback(() => {
    positioned.current = null; scrollToTarget();
    if (content) reportScripture(`chapter:${bibleLocale}:${content.id}`, content.fumsToken);
  }, [content, bibleLocale, scrollToTarget]));

  const index = chapters.findIndex(x => x.id === chapterId);
  const previous = index > 0 ? chapters[index - 1] : undefined;
  const next = index >= 0 ? chapters[index + 1] : undefined;
  const paragraphs = useMemo(() => content ? parseVerses(content.content) : [], [content]);
  const { size, leading, family } = readerText(prefs.reader);
  const iconButton = (name: keyof typeof Ionicons.glyphMap, label: string, onPress: (() => void) | undefined) =>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !onPress }} disabled={!onPress} onPress={onPress} style={({ pressed }) => ({ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, opacity: onPress ? 1 : 0.35, backgroundColor: pressed ? c.soft : 'transparent' })}>
      <Ionicons name={name} size={20} color={c.muted} />
    </Pressable>;
  const picker = (label: string, value: string, a11y: string, flex: boolean) =>
    <Pressable accessibilityRole="button" accessibilityLabel={`${a11y}: ${value}`} onPress={() => router.push('/books')} style={({ pressed }) => ({ flex: flex ? 1 : undefined, minWidth: flex ? 0 : 56, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, opacity: pressed ? 0.72 : 1 })}>
      <Text numberOfLines={1} style={{ color: c.ink, fontSize: 15, fontWeight: '700' }}>{label}</Text>
      <Ionicons name="chevron-down" size={14} color={c.muted} />
    </Pressable>;

  return <View style={{ flex: 1, backgroundColor: c.bg }}>
    <View accessibilityLabel={t.bible.nav} style={{ paddingTop: insets.top + 4, paddingLeft: Math.max(12, insets.left), paddingRight: Math.max(12, insets.right), paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: c.bg }}>
      {!compact ? iconButton('chevron-back', t.bible.prev, previous ? () => setPrefs({ chapterId: previous.id }) : undefined) : null}
      {picker(bookName(bookId, bibleLocale), bookName(bookId, bibleLocale), t.bible.book, true)}
      {picker(chapterId.split('.')[1], chapterId.split('.')[1], t.bible.chapter, false)}
      {!compact ? iconButton('chevron-forward', t.bible.next, next ? () => setPrefs({ chapterId: next.id }) : undefined) : null}
      <Pressable accessibilityRole="button" accessibilityLabel={t.bible.settings} onPress={() => router.push('/reader-settings')} style={({ pressed }) => ({ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: pressed ? c.soft : 'transparent' })}>
        <Text style={{ color: c.accent, fontFamily: fonts.serif, fontSize: 18, fontWeight: '700' }}>Aa</Text>
      </Pressable>
    </View>
    {compact ? <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 8 }}>
      <Button kind="quiet" title={t.bible.prev} disabled={!previous} onPress={() => previous && setPrefs({ chapterId: previous.id })} style={{ flex: 1 }} />
      <Button kind="quiet" title={t.bible.next} disabled={!next} onPress={() => next && setPrefs({ chapterId: next.id })} style={{ flex: 1 }} />
    </View> : null}
    <ScrollView ref={scroller} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40, width: '100%', maxWidth: 760, alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
        <Button kind="quiet" title={tr('Search Scripture', 'Rechercher dans la Bible')} onPress={() => router.push('/bible-search')} style={{ flexGrow: 1 }} />
        <Button kind="quiet" title={tr('Reading plans', 'Plans de lecture')} onPress={() => router.push('/reading-plans')} style={{ flexGrow: 1 }} />
        <Button kind="quiet" title={tr('Saved verses', 'Versets enregistrés')} onPress={() => router.push('/saved-verses')} style={{ flexGrow: 1 }} />
      </View>
      {error ? <ErrorLine message={error} onRetry={() => setAttempt(n => n + 1)} />
        : !content ? <View accessible accessibilityLabel={t.bible.loading} style={{ paddingVertical: 60 }}><ActivityIndicator accessibilityLabel={lang === 'fr' ? 'Chargement…' : 'Loading…'} color={c.accent} /></View>
        : <>
          {placeFailed ? <Text accessibilityRole="alert" style={{ color: c.muted, fontSize: 13, marginBottom: 12 }}>{t.bible.placeNotSaved}</Text> : null}
          {metadataError ? <ErrorLine message={metadataError} onRetry={() => setAttempt(n => n + 1)} /> : null}
          {annotations.key === annotationKey && annotations.error ? <ErrorLine message={annotations.error} onRetry={() => setAnnotationAttempt(n => n + 1)} /> : null}
          <View style={{ gap: 10, marginBottom: 18 }}>
            <Text style={{ color: c.muted }}>{tr('Choose a verse or range to bookmark, highlight or add a private note.', 'Choisissez un verset ou une plage pour ajouter un marque-page, un surlignage ou une note privée.')}</Text>
            <TextInput accessibilityLabel={tr('Verse or range, for example 1 or 1-3', 'Verset ou plage, par exemple 1 ou 1-3')} value={verseTarget} onChangeText={value => { setVerseTarget(value); setVerseError(''); }} maxLength={7} autoCapitalize="none" style={{ minHeight: 48, borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 12, color: c.ink, backgroundColor: c.paper, fontSize: 17 }} />
            <Button kind="soft" title={tr('Save a verse', 'Enregistrer un verset')} onPress={() => {
              const [start, end = start] = verseTarget.split('-');
              const numbers = new Set(paragraphs.flat().map(v => v.number));
              if (!validVerseRange(verseTarget) || !numbers.has(start) || !numbers.has(end)) { setVerseError(tr('Choose a verse or range present in this chapter (up to 51 verses).', 'Choisissez un verset ou une plage présente dans ce chapitre (51 versets au maximum).')); return; }
              setSelectedVerse(verseTarget);
            }} />
            {verseError ? <ErrorLine message={verseError} /> : null}
          </View>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center', marginBottom: 22 }}>{content.reference}</Text>
          {paragraphs.map((p, i) => <Text key={i} onLayout={event => { positions.current[i] = { ...positions.current[i], top: event.nativeEvent.layout.y }; scrollToTarget(); }} onTextLayout={event => { positions.current[i] = { ...positions.current[i], lines: event.nativeEvent.lines }; scrollToTarget(); }} style={{ color: c.ink, fontFamily: family, fontSize: size, lineHeight: Math.round(size * leading), marginBottom: size }}>
            {p.map((v, j) => {
              const annotation = annotationAt(savedVerses, chapterId, v.number);
              const colors = highlightColors[dark ? 'dark' : 'light'];
              const color = annotation?.highlight && Object.hasOwn(colors, annotation.highlight) ? colors[annotation.highlight as keyof typeof colors] : undefined;
              return <Text key={j} style={{ backgroundColor: color }}>{v.number ? <Text style={{ color: c.accent, fontSize: Math.max(12, Math.round(size * 0.6)), fontWeight: '700', fontFamily: 'System' }}>{v.number}{' '}</Text> : null}{v.text} </Text>;
            })}
          </Text>)}
          <View style={{ marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.line, gap: 4 }}>
            <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>{translation?.nameLocal ?? translation?.name ?? 'API.Bible'}</Text>
            {content.copyright ? <Text style={{ color: c.muted, fontSize: 12 }}>{content.copyright}</Text> : null}
          </View>
        </>}
    </ScrollView>
    {selectedVerse ? session.isSignedIn ? <AnnotationEditor key={`${chapterId}:${bibleLocale}:${selectedVerse}`} chapterId={chapterId} locale={bibleLocale} verse={selectedVerse} onClose={() => setSelectedVerse(null)} onChanged={() => setAnnotationAttempt(n => n + 1)} /> : <SignInNote onClose={() => setSelectedVerse(null)} /> : null}
  </View>;
}

function SignInNote({ onClose }: { onClose: () => void }) {
  const { c, lang } = useApp();
  return <View style={{ padding: 20, gap: 12, backgroundColor: c.paper }}><Text style={{ color: c.ink }}>{lang === 'fr' ? 'Connectez-vous depuis Vous pour enregistrer des versets et des notes privées.' : 'Sign in from You to save verses and private notes.'}</Text><Button kind="quiet" title={lang === 'fr' ? 'Fermer' : 'Close'} onPress={onClose} /></View>;
}
