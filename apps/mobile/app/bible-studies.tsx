import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { Button, Card, ErrorLine, Row, Screen } from '../components/ui';
import { errorMessage } from '../../web/lib/errors';

type Study = { id: string; title: string; description: string; method: string; _count: { lessons: number } };
type Lesson = { id: string; title: string; introduction?: string | null; historicalContext?: string | null; exegesis?: string | null; theology?: string | null; scriptureReference?: string | null; guidedPrayer?: string | null; application?: string | null; reflectionQuestions?: string[] };
type Detail = Study & { lessons: Lesson[] };
type MyStudies = { enrollments: { seriesId: string }[]; completedLessonIds: string[] };

export default function BibleStudies() {
  const { c, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [studies, setStudies] = useState<Study[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [my, setMy] = useState<MyStudies | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const saving = useRef(false);
  const fetchData = useCallback(async (signal: AbortSignal) => {
    setError('');
    try {
      const catalog = await api<Study[]>(`/bible-studies?locale=${lang}`, null, { signal });
      if (!signal.aborted) setStudies(catalog);
      if (selected) {
        const item = await api<Detail>(`/bible-studies/${encodeURIComponent(selected)}`, null, { signal });
        if (!signal.aborted) setDetail(item);
      }
      if (session.isSignedIn) {
        const token = await requireToken(session.getToken);
        if (signal.aborted) return;
        const state = await api<MyStudies>('/bible-studies/my-studies', token, { signal });
        if (!signal.aborted) setMy(state);
      } else if (!signal.aborted) setMy(null);
    } catch (e) { if (!signal.aborted) setError(errorMessage(e, lang)); }
  }, [lang, selected, session.isSignedIn, session.getToken]);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData, retry]));
  async function save(endpoint: string) {
    if (saving.current || !session.isSignedIn) return;
    saving.current = true; setBusy(true); setError('');
    try {
      const token = await requireToken(session.getToken);
      await api(endpoint, token, { method: 'POST' });
      const state = await api<MyStudies>('/bible-studies/my-studies', token);
      setMy(state);
    } catch (e) { setError(errorMessage(e, lang)); }
    finally { saving.current = false; setBusy(false); }
  }
  const lesson = detail?.lessons.find(x => x.id === lessonId) ?? detail?.lessons[0];
  const enrolled = !!selected && !!my?.enrollments.some(x => x.seriesId === selected);
  const done = !!lesson && !!my?.completedLessonIds.includes(lesson.id);
  return <Screen title={selected ? (detail?.title || tr('Bible Study', 'Étude biblique')) : tr('Bible Study', 'Étude biblique')}>
    <Button kind="quiet" title={selected ? tr('All studies', 'Toutes les études') : tr('Back to You', 'Retour à Vous')} onPress={() => { if (selected) { setSelected(null); setDetail(null); setLessonId(null); } else router.navigate('/you'); }} />
    <Text style={{ color: c.muted, fontSize: 15, lineHeight: 23 }}>{tr('Explore Scripture at your own pace. Completing a lesson tracks study activity, not spiritual maturity.', 'Explorez les Écritures à votre rythme. Terminer une leçon suit votre apprentissage, pas votre maturité spirituelle.')}</Text>
    {error ? <ErrorLine message={error} onRetry={() => setRetry(x => x + 1)} /> : null}
    {!selected ? studies === null && !error ? <ActivityIndicator accessibilityLabel={tr('Loading studies', 'Chargement des études')} color={c.accent} /> : studies?.length === 0 ? <Card><Text style={{ color: c.muted }}>{tr('Reviewed Bible studies will appear here when published.', 'Les études bibliques validées apparaîtront ici après publication.')}</Text></Card> : studies?.map(item =>
      <Row key={item.id} icon="book-outline" title={item.title} subtitle={`${item.description} · ${item._count.lessons} ${tr('lessons', 'leçons')}`} onPress={() => { setSelected(item.id); setDetail(null); }} />)
      : !detail && !error ? <ActivityIndicator accessibilityLabel={tr('Loading lessons', 'Chargement des leçons')} color={c.accent} /> : detail ? <>
        <Text style={{ color: c.muted, lineHeight: 23 }}>{detail.description}</Text>
        {session.isSignedIn && my === null ? <ActivityIndicator color={c.accent} /> : !session.isSignedIn ? <Button kind="soft" title={tr('Sign in to save your progress', 'Connectez-vous pour enregistrer votre progression')} onPress={() => router.navigate('/you')} /> : !enrolled ? <Button title={tr('Start this study', 'Commencer cette étude')} disabled={busy} onPress={() => void save(`/bible-studies/${encodeURIComponent(selected)}/enroll`)} /> : null}
        {detail.lessons.length === 0 ? <Card><Text style={{ color: c.muted }}>{tr('Lessons are being prepared.', 'Les leçons sont en préparation.')}</Text></Card> : detail.lessons.map((item, i) =>
          <Button key={item.id} kind={lesson?.id === item.id ? 'soft' : 'quiet'} title={`${i + 1}. ${item.title}${my?.completedLessonIds.includes(item.id) ? ` · ${tr('Completed', 'Terminée')}` : ''}`} onPress={() => setLessonId(item.id)} />)}
        {lesson ? <Card style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 22, fontWeight: '700' }}>{lesson.title}</Text>
          {([['scriptureReference', tr('Scripture', 'Passage')], ['introduction', tr('Introduction', 'Introduction')], ['historicalContext', tr('Context', 'Contexte')], ['exegesis', tr('Explanation', 'Explication')], ['theology', tr('Meaning', 'Signification')], ['guidedPrayer', tr('Prayer', 'Prière')], ['application', tr('Put it into practice', 'Mettre en pratique')]] as const).map(([key, label]) => lesson[key] ? <Text key={key} style={{ color: c.ink, fontSize: 16, lineHeight: 25 }}><Text style={{ fontWeight: '700' }}>{label}: </Text>{lesson[key]}</Text> : null)}
          {lesson.reflectionQuestions?.map((q, i) => <Text key={i} style={{ color: c.ink, fontSize: 16, lineHeight: 25 }}>{i + 1}. {q}</Text>)}
          {session.isSignedIn && enrolled ? <Button title={done ? tr('Lesson completed', 'Leçon terminée') : tr('Mark lesson complete', 'Marquer la leçon comme terminée')} disabled={busy || done} onPress={() => void save(`/bible-studies/lessons/${encodeURIComponent(lesson.id)}/complete`)} /> : null}
        </Card> : null}
      </> : null}
  </Screen>;
}
