import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { Button, Card, ErrorLine, Press, Row, Screen, SectionLabel } from '../components/ui';
import { errorMessage } from '../../web/lib/errors';
import { STUDY_METHODS, completedInSeries, isStudyId, matchesStudy, methodLabel, orderedLessons, type MyStudies, type StudyLesson, type StudyMethod, type StudySeries, type StudySummary } from '../../web/lib/bible-studies';

/** Bible Study on native: the same published series, lessons and explicit completion as /bible on the web. */
export default function BibleStudies() {
  const { c, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const params = useLocalSearchParams<{ id?: string }>();
  const [id, setId] = useState<string | null>(isStudyId(params.id) ? params.id : null);
  const [items, setItems] = useState<StudySummary[] | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [method, setMethod] = useState<StudyMethod | null>(null);
  const [query, setQuery] = useState('');
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setItems(null); setError('');
    api<StudySummary[]>(`/bible-studies?locale=${lang === 'fr' ? 'fr' : 'en'}`, null, { signal: controller.signal })
      .then(rows => { if (!controller.signal.aborted) setItems(rows); })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    return () => controller.abort();
  }, [attempt, lang]));
  if (id) return <StudyReader key={`${id}:${session.userId ?? 'signed-out'}`} id={id} onBack={() => setId(null)} />;
  const shown = items?.filter(item => matchesStudy(item, method, query)) ?? [];
  const filtering = method !== null || query.trim() !== '';
  return <Screen title={tr('Bible Study', 'Étude biblique')} eyebrow={tr('Explore · Understand · Apply', 'Explorer · Comprendre · Appliquer')}>
    <Button kind="quiet" title={tr('Back to the Bible', 'Retour à la Bible')} onPress={() => router.navigate('/bible')} />
    <Text style={{ color: c.muted, fontSize: 16, lineHeight: 25 }}>{tr('Discover Scripture through guided, context-aware studies. Go at your own pace; progress never ranks your faith.', 'Découvrez les Écritures grâce à des études guidées et contextualisées. Avancez à votre rythme ; la progression ne classe jamais votre foi.')}</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel={tr('Study type', 'Type d’étude')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {[null, ...STUDY_METHODS].map(value => {
        const on = method === value;
        const label = value ? methodLabel(value, lang) : tr('All', 'Toutes');
        return <Press key={value ?? 'all'} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: on }} onPress={() => setMethod(value)}
          style={{ flexGrow: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.soft : c.paper }}>
          <Text style={{ color: on ? c.deep : c.ink, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
        </Press>;
      })}
    </View>
    <TextInput accessibilityLabel={tr('Search Bible studies', 'Rechercher des études bibliques')} placeholder={tr('Search studies', 'Rechercher des études')} placeholderTextColor={c.muted} value={query} onChangeText={setQuery} maxLength={80} returnKeyType="search" style={{ minHeight: 48, padding: 14, borderWidth: 1, borderColor: c.line, borderRadius: 12, color: c.ink, backgroundColor: c.paper, fontSize: 17 }} />
    {error ? <ErrorLine message={error} onRetry={() => setAttempt(n => n + 1)} />
      : items === null ? <ActivityIndicator accessibilityLabel={tr('Loading studies', 'Chargement des études')} color={c.accent} />
      : shown.length === 0 ? <Card style={{ gap: 12 }}>
        <Text style={{ color: c.ink, fontSize: 17, fontWeight: '700' }}>{filtering && items.length ? tr('No studies match', 'Aucune étude ne correspond') : tr('No published studies yet', 'Aucune étude publiée pour le moment')}</Text>
        <Text style={{ color: c.muted, lineHeight: 23 }}>{filtering && items.length ? tr('Try another word or show every type of study.', 'Essayez un autre mot ou affichez tous les types d’étude.') : tr('Scripture-centred lessons are being prepared and reviewed. Reading plans are available meanwhile.', 'Des leçons centrées sur les Écritures sont en préparation et en relecture. Les plans de lecture sont disponibles en attendant.')}</Text>
        {filtering && items.length ? <Button kind="soft" title={tr('Clear filters', 'Effacer les filtres')} onPress={() => { setMethod(null); setQuery(''); }} />
          : <Button kind="soft" title={tr('Reading plans', 'Plans de lecture')} onPress={() => router.push('/reading-plans')} />}
      </Card>
      : shown.map(item => <Row key={item.id} icon="library-outline" title={item.title} subtitle={`${methodLabel(item.method, lang)} · ${item._count.lessons} ${item._count.lessons === 1 ? tr('lesson', 'leçon') : tr('lessons', 'leçons')}`} onPress={() => setId(item.id)} />)}
  </Screen>;
}

function StudyReader({ id, onBack }: { id: string; onBack: () => void }) {
  const { c, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [series, setSeries] = useState<StudySeries | null>(null);
  const [mine, setMine] = useState<MyStudies | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [privateError, setPrivateError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setError(''); setPrivateError(''); setMine(null);
    api<StudySeries>(`/bible-studies/${encodeURIComponent(id)}`, null, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setSeries(value); })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    if (session.isSignedIn) (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const value = await api<MyStudies>('/bible-studies/my-studies', token, { signal: controller.signal });
        if (!controller.signal.aborted) setMine(value);
      } catch (e) { if (!controller.signal.aborted) setPrivateError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [id, session.isSignedIn, session.getToken, lang, retry]));

  const lessons = series ? orderedLessons(series) : [];
  const lesson = lessons.find(value => value.id === lessonId) ?? lessons[0];
  const ready = mine !== null;
  const enrolled = !!mine?.enrollments.some(value => value.seriesId === id);
  const done = (lessonKey: string) => !!mine?.completedLessonIds.includes(lessonKey);

  /** Writes only on an explicit press, and shows the change only after the server accepts it. */
  async function write(kind: 'enroll' | 'complete') {
    if (!ready || !lesson || saving.current) return;
    saving.current = true; setBusy(true); setPrivateError('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      const endpoint = kind === 'enroll' ? `/bible-studies/${encodeURIComponent(id)}/enroll` : `/bible-studies/lessons/${encodeURIComponent(lesson.id)}/complete`;
      await api(endpoint, token, { method: 'POST' });
      if (!mounted.current) return;
      // Completing a lesson also enrolls on the server, so both writes leave the member enrolled.
      setMine(previous => {
        const base = previous ?? { enrollments: [], completedLessonIds: [] };
        return {
          enrollments: base.enrollments.some(value => value.seriesId === id) ? base.enrollments : [...base.enrollments, { seriesId: id }],
          completedLessonIds: kind === 'complete' && !base.completedLessonIds.includes(lesson.id) ? [...base.completedLessonIds, lesson.id] : base.completedLessonIds,
        };
      });
    } catch (e) { if (mounted.current) setPrivateError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }

  return <Screen title={series?.title ?? tr('Bible Study', 'Étude biblique')} eyebrow={series ? methodLabel(series.method, lang) : undefined}>
    <Button kind="quiet" title={tr('All Bible studies', 'Toutes les études bibliques')} disabled={busy} onPress={onBack} />
    {error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} /> : !series ? <ActivityIndicator accessibilityLabel={tr('Loading study', 'Chargement de l’étude')} color={c.accent} /> : <>
      <Text style={{ color: c.muted, fontSize: 16, lineHeight: 25 }}>{series.description}</Text>
      {privateError ? <ErrorLine message={privateError} onRetry={() => setRetry(n => n + 1)} /> : null}
      {enrolled ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep, fontWeight: '600' }}>{completedInSeries(series, mine?.completedLessonIds ?? [])} / {lessons.length} {tr('lessons completed', 'leçons terminées')}</Text> : null}
      {!lesson ? <Card><Text style={{ color: c.muted, lineHeight: 23 }}>{tr('Lessons are being prepared. You can start this study when they are available.', 'Les leçons se préparent. Vous pourrez commencer cette étude lorsqu’elles seront prêtes.')}</Text></Card> : <>
        <SectionLabel>{tr('Lessons', 'Leçons')}</SectionLabel>
        {lessons.map(value => <Button key={value.id} kind={lesson.id === value.id ? 'soft' : 'quiet'} title={`${value.position}. ${value.title}${done(value.id) ? ` · ${tr('Completed', 'Terminée')}` : ''}`} disabled={busy} onPress={() => setLessonId(value.id)} />)}
        <LessonCard lesson={lesson} />
        {!session.isSignedIn ? <Button kind="soft" title={tr('Sign in from You to save progress', 'Connectez-vous depuis Vous pour enregistrer votre progression')} onPress={() => router.navigate('/you')} />
          : <View style={{ gap: 10 }}>
            {!enrolled ? <Button kind="soft" title={tr('Start this study', 'Commencer cette étude')} disabled={!ready || busy} onPress={() => void write('enroll')} /> : null}
            <Button title={busy ? tr('Saving…', 'Enregistrement…') : done(lesson.id) ? tr('Lesson completed', 'Leçon terminée') : tr('Mark lesson complete', 'Marquer la leçon comme terminée')} disabled={!ready || busy || done(lesson.id)} onPress={() => void write('complete')} />
          </View>}
        <Text style={{ color: c.muted, fontSize: 14, lineHeight: 21 }}>{tr('Opening a lesson does not mark it complete. Lessons are shown in their published language.', 'Ouvrir une leçon ne la marque pas comme terminée. Les leçons sont présentées dans leur langue de publication.')}</Text>
      </>}
    </>}
  </Screen>;
}

function LessonCard({ lesson }: { lesson: StudyLesson }) {
  const { c, lang } = useApp();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const body = { color: c.ink, fontSize: 17, lineHeight: 29 } as const;
  const questions = Array.isArray(lesson.reflectionQuestions) ? lesson.reflectionQuestions.filter(q => q.trim()) : [];
  return <Card style={{ gap: 18 }}>
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>{tr('Lesson', 'Leçon')} {lesson.position}{lesson.scriptureReference ? ` · ${lesson.scriptureReference}` : ''}</Text>
      <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 23, fontWeight: '700', letterSpacing: -0.3 }}>{lesson.title}</Text>
    </View>
    <Text style={body}>{lesson.introduction}</Text>
    <LessonSection title={tr('Historical context', 'Contexte historique')} text={lesson.historicalContext} />
    <LessonSection title={tr('Understanding the passage', 'Comprendre le passage')} text={lesson.exegesis} />
    <LessonSection title={tr('Theological understanding', 'Compréhension théologique')} text={lesson.theology} />
    {questions.length ? <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={{ color: c.deep, fontSize: 15, fontWeight: '700' }}>{tr('Reflect', 'Méditer')}</Text>
      {questions.map((question, index) => <Text key={index} style={body}>{index + 1}. {question}</Text>)}
    </View> : null}
    <LessonSection title={tr('Prayer', 'Prière')} text={lesson.guidedPrayer} />
    <LessonSection title={tr('Apply', 'Mettre en pratique')} text={lesson.application} />
  </Card>;
}

/** One editorial section of a lesson; omitted when the series leaves it empty. */
function LessonSection({ title, text }: { title: string; text: string | null }) {
  const { c } = useApp();
  if (!text?.trim()) return null;
  return <View style={{ gap: 6 }}>
    <Text accessibilityRole="header" style={{ color: c.deep, fontSize: 15, fontWeight: '700' }}>{title}</Text>
    <Text style={{ color: c.ink, fontSize: 17, lineHeight: 29 }}>{text}</Text>
  </View>;
}
