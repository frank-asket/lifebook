import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { Button, Card, ErrorLine, Row, Screen } from '../components/ui';
import { errorMessage } from '../../web/lib/errors';
import { completedLessons, type PathDetail, type PathState, type PathSummary } from '../../web/lib/learning-paths';

export default function Discipleship() {
  const { c, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [items, setItems] = useState<PathSummary[] | null>(null);
  const params = useLocalSearchParams<{ id?: string }>();
  const [id, setId] = useState<string | null>(typeof params.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(params.id) ? params.id : null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setItems(null); setError('');
    api<PathSummary[]>('/paths', null, { signal: controller.signal }).then(rows => { if (!controller.signal.aborted) setItems(rows); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    return () => controller.abort();
  }, [attempt, lang]));
  if (id) return <PathReader key={`${id}:${session.userId ?? 'signed-out'}`} id={id} onBack={() => setId(null)} />;
  return <Screen title={tr('My Journey', 'Mon parcours')}>
    <Button kind="quiet" title={tr('Back to You', 'Retour à Vous')} onPress={() => router.navigate('/you')} />
    <Text style={{ color: c.muted, fontSize: 16, lineHeight: 25 }}>{tr('Learn at your own pace. Course progress never ranks your faith or grants ministry authority.', 'Apprenez à votre rythme. La progression ne classe jamais votre foi et ne confère aucune autorité ministérielle.')}</Text>
    {error ? <ErrorLine message={error} onRetry={() => setAttempt(n => n + 1)} /> : items === null ? <ActivityIndicator accessibilityLabel={tr('Loading pathways', 'Chargement des parcours')} color={c.accent} />
      : items.length === 0 ? <Card><Text style={{ color: c.muted }}>{tr('New pathways are being prepared. You can explore Bible reading plans meanwhile.', 'De nouveaux parcours se préparent. Vous pouvez découvrir les plans de lecture biblique en attendant.')}</Text><Button kind="soft" title={tr('Reading plans', 'Plans de lecture')} onPress={() => router.push('/reading-plans')} /></Card>
        : items.map(item => <Row key={item.id} icon="compass-outline" title={item.title} subtitle={item.description} onPress={() => setId(item.id)} />)}
    {items && items.length >= 100 ? <Text style={{ color: c.muted }}>{tr('Showing the first 100 published pathways.', 'Les 100 premiers parcours publiés sont affichés.')}</Text> : null}
  </Screen>;
}

function PathReader({ id, onBack }: { id: string; onBack: () => void }) {
  const { c, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [path, setPath] = useState<PathDetail | null>(null);
  const [state, setState] = useState<PathState | null>(null);
  const [ready, setReady] = useState(false);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [privateError, setPrivateError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  const saving = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const endpoint = `/paths/${encodeURIComponent(id)}`;
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setError(''); setReady(false); setState(null);
    api<PathDetail>(endpoint, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setPath(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    if (session.isSignedIn) (async () => {
      setPrivateError('');
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const value = await api<PathState>(`${endpoint}/state`, token, { signal: controller.signal });
        if (!controller.signal.aborted) { setState(value); setReady(true); }
      } catch (e) { if (!controller.signal.aborted) setPrivateError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [endpoint, session.isSignedIn, session.getToken, lang, retry]));
  const lesson = path?.lessons.find(value => value.id === lessonId) ?? path?.lessons[0];
  const done = !!state?.enrollment?.completions.some(value => value.lessonId === lesson?.id);
  async function write() {
    if (!ready || !lesson || saving.current) return;
    saving.current = true; setBusy(true); setPrivateError('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      const value = await api<PathState>(state?.enrollment ? `${endpoint}/lessons/${encodeURIComponent(lesson.id)}/complete` : `${endpoint}/enroll`, token, { method: state?.enrollment ? 'PUT' : 'POST' });
      if (mounted.current) setState(value);
    } catch (e) { if (mounted.current) setPrivateError(errorMessage(e, lang)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  return <Screen title={path?.title ?? tr('Learning pathway', 'Parcours d’apprentissage')}>
    <Button kind="quiet" title={tr('All pathways', 'Tous les parcours')} disabled={busy} onPress={onBack} />
    {error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} /> : !path ? <ActivityIndicator accessibilityLabel={tr('Loading pathway', 'Chargement du parcours')} color={c.accent} /> : <>
      <Text style={{ color: c.muted, fontSize: 16, lineHeight: 25 }}>{path.description}</Text>
      <Text style={{ color: c.muted, lineHeight: 23 }}>{tr('Lessons are shown in their published language. Opening one does not mark it complete.', 'Les leçons sont présentées dans leur langue de publication. Ouvrir une leçon ne la marque pas comme terminée.')}</Text>
      {privateError ? <ErrorLine message={privateError} onRetry={() => setRetry(n => n + 1)} /> : null}
      {state?.enrollment ? <Text accessibilityLiveRegion="polite" style={{ color: c.deep }}>{completedLessons(path, state)} / {path.lessons.length} {tr('lessons completed', 'leçons terminées')}</Text> : null}
      {!lesson ? <Card><Text style={{ color: c.muted }}>{tr('Lessons are being prepared. Enrollment will open when they are available.', 'Les leçons se préparent. L’inscription sera disponible lorsqu’elles seront prêtes.')}</Text></Card> : <>
        {path.lessons.map((value, index) => <Button key={value.id} kind={lesson.id === value.id ? 'soft' : 'quiet'} title={`${index + 1}. ${value.title}${state?.enrollment?.completions.some(item => item.lessonId === value.id) ? ` · ${tr('Completed', 'Terminée')}` : ''}`} disabled={busy} onPress={() => setLessonId(value.id)} />)}
        <Card style={{ gap: 16 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 23, fontWeight: '700' }}>{lesson.title}</Text>
          <Text style={{ color: c.ink, fontSize: 17, lineHeight: 29 }}>{lesson.content}</Text>
          {session.isSignedIn ? <Button title={busy ? tr('Saving…', 'Enregistrement…') : !state?.enrollment ? tr('Start this pathway', 'Commencer ce parcours') : done ? tr('Lesson completed', 'Leçon terminée') : tr('Mark lesson complete', 'Marquer la leçon comme terminée')} disabled={!ready || busy || (!!state?.enrollment && done)} onPress={() => void write()} />
            : <Button kind="soft" title={tr('Sign in from You to save progress', 'Connectez-vous depuis Vous pour enregistrer votre progression')} onPress={() => router.navigate('/you')} />}
        </Card>
      </>}
    </>}
  </Screen>;
}
