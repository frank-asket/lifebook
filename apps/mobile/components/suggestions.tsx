import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { Button, Card, ErrorLine, Row } from './ui';
import { faithJourneyLabel, learningGoalLabel } from '../../web/lib/api';
import { visible, type SuggestionView, type SuggestionsResponse } from '../../web/lib/suggestions';

export function Suggestions() {
  const session = useSession(); const { lang } = useApp();
  if (!session.isSignedIn || !session.userId) return null;
  return <MemberSuggestions key={`${session.userId}:${lang}`} />;
}

function MemberSuggestions() {
  const { c, lang, setPrefs } = useApp(); const session = useSession(); const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [items, setItems] = useState<SuggestionView[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const dismissed = useRef(new Set<string>());
  const generation = useRef(0); const saving = useRef(false); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useFocusEffect(useCallback(() => {
    const current = ++generation.current; setItems([]); setError(''); setMessage(''); setBusy(saving.current);
    (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (current !== generation.current) return;
        const response = await api<SuggestionsResponse>(`/me/suggestions?locale=${lang}`, token);
        if (current === generation.current) setItems(response.consent ? response.suggestions.filter(item => !dismissed.current.has(item.id)) : []);
      } catch { /* Optional suggestions never block the shared Daily Word. Retry on next focus. */ }
    })();
    return () => { generation.current++; };
  }, [session.getToken, lang]));

  async function hide(id: string) {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError(''); const current = generation.current;
    try {
      const token = await requireToken(session.getToken);
      if (current !== generation.current) return;
      await api(`/me/suggestions/${encodeURIComponent(id)}/dismiss`, token, { method: 'POST' });
      if (mounted.current) {
        // A focus refresh may have started before this write committed.
        dismissed.current.add(id);
        setItems(previous => previous.filter(item => item.id !== id));
        if (current === generation.current) setMessage(tr('Suggestion hidden on your account.', 'Suggestion masquée sur votre compte.'));
      }
    } catch { if (current === generation.current) setError(tr('Could not hide this suggestion. Please try again.', 'Impossible de masquer cette suggestion. Réessayez.')); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }
  function go(item: SuggestionView) {
    if (item.kind === 'plan' && item.id.startsWith('plan:')) router.push({ pathname: '/reading-plans', params: { plan: item.id.slice(5) } });
    else if (item.kind === 'journal') router.navigate('/prayer');
    else if (item.kind === 'prayer-time') { setPrefs({ length: 2 }); router.push('/prayer-time'); }
  }
  const shown = visible(items, []);
  if (!shown.length && !message) return null;
  return <Card style={{ gap: 14 }}>
    <Text accessibilityRole="header" style={{ color: c.ink, fontSize: 21, fontWeight: '700' }}>{tr('Suggested for you', 'Suggéré pour vous')}</Text>
    <Button kind="quiet" title={tr('Change preferences', 'Modifier mes préférences')} onPress={() => router.push('/onboarding')} />
    {shown.map(item => {
      const title = item.kind === 'plan' ? item.title ?? '' : item.kind === 'journal' ? tr('Start your prayer journal', 'Commencez votre journal de prière') : tr('Try a 2-minute prayer time', 'Essayez un temps de prière de 2 minutes');
      const reason = item.reason.type === 'goal' ? learningGoalLabel(item.reason.goal, lang) : faithJourneyLabel(item.reason.journey, lang) ?? item.reason.journey;
      return <View key={item.id} style={{ gap: 10 }}>
        <Row icon={item.kind === 'plan' ? 'book-outline' : item.kind === 'journal' ? 'lock-closed-outline' : 'time-outline'} title={title} subtitle={item.description} onPress={() => go(item)} />
        <Button kind="quiet" title={open === item.id ? tr('Hide explanation', 'Masquer l’explication') : tr('Why this?', 'Pourquoi ?')} onPress={() => setOpen(open === item.id ? null : item.id)} />
        {open === item.id ? <Text style={{ color: c.muted, lineHeight: 23 }}>{tr(`Because you chose “${reason}” in your preferences.`, `Parce que vous avez choisi « ${reason} » dans vos préférences.`)}</Text> : null}
        <Button kind="quiet" title={tr(`Hide “${title}”`, `Masquer « ${title} »`)} disabled={busy} onPress={() => void hide(item.id)} />
      </View>;
    })}
    {error ? <ErrorLine message={error} /> : null}
    {message ? <Text accessibilityLiveRegion="polite" style={{ color: c.muted }}>{message}</Text> : null}
  </Card>;
}
