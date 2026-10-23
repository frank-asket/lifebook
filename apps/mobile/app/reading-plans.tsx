import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { Button, Card, ErrorLine, Row, Screen, SectionLabel } from '../components/ui';
import type { Enrollment, Plan, PlanDetails } from '../../web/lib/bible-reading-api';
import { passageLabel } from '../../web/lib/scripture';
import { errorMessage } from '../../web/lib/errors';

export default function ReadingPlans() {
  const { c, lang, setPrefs } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [mine, setMine] = useState<Enrollment[]>([]);
  const [privateReady, setPrivateReady] = useState(false);
  const params = useLocalSearchParams<{ plan?: string }>();
  const [id, setId] = useState<string | null>(typeof params.plan === 'string' && /^[a-z0-9-]{1,60}$/.test(params.plan) ? params.plan : null);
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [error, setError] = useState('');
  const [privateError, setPrivateError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setPlans(null); setError(''); setPrivateError(''); setPrivateReady(false);
    api<Plan[]>(`/bible-reading/plans?locale=${lang}`, null, { signal: controller.signal })
      .then(rows => { if (!controller.signal.aborted) setPlans(rows); })
      .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    if (session.isSignedIn) (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const rows = await api<Enrollment[]>(`/bible-reading/my-plans?locale=${lang}`, token, { signal: controller.signal });
        if (!controller.signal.aborted) { setMine(rows); setPrivateReady(true); }
      } catch (e) { if (!controller.signal.aborted) setPrivateError(errorMessage(e, lang)); }
    })();
    else setMine([]);
    return () => controller.abort();
  }, [lang, session.isSignedIn, session.getToken, retry]));

  useEffect(() => {
    if (!id) { setPlan(null); return; }
    const controller = new AbortController();
    setPlan(null); setDetailError('');
    api<PlanDetails>(`/bible-reading/plans/${encodeURIComponent(id)}?locale=${lang}`, null, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setPlan(value); })
      .catch(e => { if (!controller.signal.aborted) setDetailError(errorMessage(e, lang)); });
    return () => controller.abort();
  }, [id, lang, retry]);

  const enrollment = privateReady ? mine.find(e => e.planId === id) : undefined;
  async function change(day?: number) {
    if (busy || !id || !privateReady || !session.isSignedIn || (day !== undefined && !enrollment)) return;
    setBusy(true); setPrivateError('');
    try {
      const token = await requireToken(session.getToken);
      if (!mounted.current) return;
      await api(day !== undefined && enrollment
        ? `/bible-reading/enrollments/${encodeURIComponent(enrollment.id)}/complete-day`
        : `/bible-reading/plans/${encodeURIComponent(id)}/enroll`, token,
      { method: 'POST', ...(day !== undefined ? { body: JSON.stringify({ day }) } : {}) });
      if (!mounted.current) return;
      const rows = await api<Enrollment[]>(`/bible-reading/my-plans?locale=${lang}`, token);
      if (mounted.current) setMine(rows);
    } catch (e) { if (mounted.current) setPrivateError(errorMessage(e, lang)); }
    finally { if (mounted.current) setBusy(false); }
  }
  const open = (chapterId: string) => { setPrefs({ chapterId, bibleLocale: lang }); router.navigate('/bible'); };
  return <Screen title={tr('Reading plans', 'Plans de lecture')}>
    <Button kind="quiet" title={id ? tr('All reading plans', 'Tous les plans') : tr('Back to the Bible', 'Retour à la Bible')} disabled={busy} onPress={() => id ? setId(null) : router.navigate('/bible')} />
    <Text style={{ color: c.muted, lineHeight: 22 }}>{tr('Read at your own pace. Opening a chapter never marks a day complete.', 'Lisez à votre rythme. Ouvrir un chapitre ne marque jamais un jour comme terminé.')}</Text>
    {privateError ? <ErrorLine message={privateError} onRetry={() => setRetry(n => n + 1)} /> : null}
    {!id ? <>
      {privateReady && mine.length ? <>
        <SectionLabel>{tr('YOUR PLANS', 'VOS PLANS')}</SectionLabel>
        {mine.map(e => <Row key={e.id} icon="book-outline" title={e.plan.title} subtitle={tr(`${e.completedDays} of ${e.plan.duration} days completed`, `${e.completedDays} jours sur ${e.plan.duration} terminés`)} onPress={() => setId(e.planId)} />)}
      </> : null}
      <SectionLabel>{tr('EXPLORE', 'EXPLORER')}</SectionLabel>
      {error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} /> : plans === null ? <ActivityIndicator accessibilityLabel={lang === 'fr' ? 'Chargement…' : 'Loading…'} color={c.accent} /> : !plans.length ? <Card><Text style={{ color: c.muted }}>{tr('New reading plans are being prepared.', 'De nouveaux plans de lecture se préparent.')}</Text></Card> : plans.map(p => <Row key={p.id} icon="library-outline" title={p.title} subtitle={`${p.duration} ${tr('days', 'jours')} · ${p.description}`} onPress={() => setId(p.id)} />)}
    </> : !plan ? detailError ? <ErrorLine message={detailError} onRetry={() => setRetry(n => n + 1)} /> : <ActivityIndicator accessibilityLabel={lang === 'fr' ? 'Chargement…' : 'Loading…'} color={c.accent} /> : <>
      <Card style={{ gap: 12 }}>
        <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 25, fontWeight: '700' }}>{plan.title}</Text>
        <Text style={{ color: c.muted, lineHeight: 23 }}>{plan.description}</Text>
        {enrollment ? <View accessibilityRole="progressbar" accessibilityLabel={tr('Plan progress', 'Progression du plan')} accessibilityValue={{ min: 0, max: plan.duration, now: enrollment.completedDays }} style={{ gap: 8 }}>
          <Text style={{ color: c.deep }}>{enrollment.completedDays} / {plan.duration} {tr('days completed', 'jours terminés')}</Text>
          <View style={{ height: 8, backgroundColor: c.soft, borderRadius: 4, overflow: 'hidden' }}><View style={{ height: 8, width: `${Math.min(100, enrollment.completedDays / plan.duration * 100)}%`, backgroundColor: c.accent }} /></View>
        </View> : session.isSignedIn ? <Button title={tr('Start this plan', 'Commencer ce plan')} disabled={!privateReady || busy} onPress={() => void change()} /> : <Text style={{ color: c.muted }}>{tr('Sign in from You to save your progress. You can read every chapter without enrolling.', 'Connectez-vous depuis Vous pour enregistrer votre progression. Vous pouvez lire chaque chapitre sans inscription.')}</Text>}
      </Card>
      {plan.days.map(d => {
        const completed = !!enrollment?.completions.some(item => item.day === d.day);
        return <Card key={d.day} style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 18, fontWeight: '700' }}>{tr('Day', 'Jour')} {d.day} · {passageLabel(d.chapterId, lang)}</Text>
          <Button kind="quiet" title={tr('Read chapter', 'Lire le chapitre')} disabled={busy} onPress={() => open(d.chapterId)} />
          {enrollment ? <Button kind="soft" title={completed ? tr('Completed', 'Terminé') : tr('Mark day complete', 'Marquer le jour comme terminé')} disabled={completed || busy} onPress={() => void change(d.day)} /> : null}
        </Card>;
      })}
    </>}
  </Screen>;
}
