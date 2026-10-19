import { useCallback, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { errorMessage } from '../../web/lib/errors';
import { Button, Card, ErrorLine, Row, Screen } from '../components/ui';
import { ReflectionDetail, dailySteps, dayLabel, type DailySession } from '../components/reflection-detail';

export default function DailyWordHistory() {
  const { c, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [items, setItems] = useState<DailySession[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setItems(null); setError('');
    if (!session.isSignedIn) return;
    (async () => {
      try {
        const token = await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const rows = await api<DailySession[]>('/daily-word/sessions?limit=100', token, { signal: controller.signal });
        if (!controller.signal.aborted) setItems(rows);
      } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e, lang)); }
    })();
    return () => controller.abort();
  }, [session.isSignedIn, session.getToken, lang, retry]));
  return <Screen title={tr('Daily Word history', 'Historique de la Parole du jour')}>
    <Button kind="quiet" title={tr('Back to You', 'Retour à Vous')} onPress={() => router.navigate('/you')} />
    <Text style={{ color: c.muted, fontSize: 16, lineHeight: 24 }}>{tr('Revisit your steps and private reflections. Opening a past day does not change its progress.', 'Retrouvez vos étapes et vos réflexions privées. Ouvrir une journée passée ne modifie pas sa progression.')}</Text>
    {!session.isSignedIn ? <Card><Text style={{ color: c.muted }}>{tr('Sign in from You to see your private history.', 'Connectez-vous depuis Vous pour retrouver votre historique privé.')}</Text></Card>
      : error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} />
      : items === null ? <ActivityIndicator accessibilityLabel={lang === 'fr' ? 'Chargement…' : 'Loading…'} color={c.accent} />
      : items.length === 0 ? <Card><Text style={{ color: c.muted, lineHeight: 23 }}>{tr('Your Daily Word sessions will appear here when you begin a moment of peace from Today.', 'Vos séances de la Parole du jour apparaîtront ici lorsque vous commencerez un moment de paix depuis Aujourd’hui.')}</Text></Card>
      : items.map(item => {
        const count = dailySteps.filter(step => item.steps.some(value => value.step === step)).length;
        return <Row key={item.id} icon={item.status === 'COMPLETED' ? 'checkmark-circle-outline' : 'time-outline'} title={dayLabel(item.journeyDate, lang)}
          subtitle={`${count}/5 · ${item.status === 'COMPLETED' ? tr('Completed', 'Terminée') : tr('In progress', 'En cours')}${item.reflection ? ` · ${tr('Private reflection', 'Réflexion privée')}` : ''}`}
          onPress={() => setSelected(item.id)} />;
      })}
    {items && items.length >= 100 ? <Text style={{ color: c.muted }}>{tr('Showing your 100 most recent sessions.', 'Vos 100 séances les plus récentes sont affichées.')}</Text> : null}
    {selected ? <ReflectionDetail key={selected} kind="daily" id={selected} onClose={() => setSelected(null)} onChanged={() => setRetry(n => n + 1)} /> : null}
  </Screen>;
}
