import { useCallback, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { useApp, useSession } from '../lib/app';
import { api, requireToken } from '../lib/api';
import { ApiError } from '../../web/lib/api';
import { errorMessage } from '../../web/lib/errors';
import { Button, Card, ErrorLine, Row, Screen, Segmented } from '../components/ui';
import { ReflectionDetail, type Meditation } from '../components/reflection-detail';

type Collection = 'today' | 'saved' | 'history';
type Entry = { meditation: Meditation; completedAt?: string };
export default function Meditations() {
  const { c, lang } = useApp();
  const session = useSession();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [collection, setCollection] = useState<Collection>('today');
  const [items, setItems] = useState<Entry[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const params = useLocalSearchParams<{ id?: string }>();
  const [selected, setSelected] = useState<string | null>(typeof params.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(params.id) ? params.id : null);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setItems(null); setError('');
    if (collection !== 'today' && !session.isSignedIn) return;
    (async () => {
      try {
        const token = collection === 'today' ? undefined : await requireToken(session.getToken);
        if (controller.signal.aborted) return;
        const rows = collection === 'today'
          ? [{ meditation: await api<Meditation>(`/meditations/today?locale=${lang}`, undefined, { signal: controller.signal }) }]
          : await api<Entry[]>(`/meditations/${collection}`, token, { signal: controller.signal });
        if (!controller.signal.aborted) setItems(rows);
      } catch (e) {
        if (controller.signal.aborted) return;
        if (collection === 'today' && e instanceof ApiError && e.status === 404) setItems([]);
        else setError(errorMessage(e, lang));
      }
    })();
    return () => controller.abort();
  }, [collection, lang, session.isSignedIn, session.getToken, retry]));
  return <Screen title={tr('Meditations', 'Méditations')}>
    <Button kind="quiet" title={tr('Back to Prayer', 'Retour à la prière')} onPress={() => router.navigate('/prayer')} />
    <Text style={{ color: c.muted, fontSize: 16, lineHeight: 24 }}>{tr('Return to a reflection, save a meditation for later, or find a quiet moment today.', 'Retrouvez une réflexion, gardez une méditation pour plus tard ou prenez un moment de calme aujourd’hui.')}</Text>
    <Segmented label={tr('Meditation collection', 'Collection de méditations')} value={collection} onChange={setCollection} options={[
      { value: 'today', label: tr('Today', 'Aujourd’hui') }, { value: 'saved', label: tr('Saved', 'Enregistrées') }, { value: 'history', label: tr('Completed', 'Terminées') },
    ]} />
    {collection !== 'today' && !session.isSignedIn ? <Card><Text style={{ color: c.muted }}>{tr('Sign in from You to see your saved meditations and completion history.', 'Connectez-vous depuis Vous pour retrouver vos méditations enregistrées et terminées.')}</Text></Card>
      : error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} />
      : items === null ? <ActivityIndicator accessibilityLabel={lang === 'fr' ? 'Chargement…' : 'Loading…'} color={c.accent} />
      : items.length === 0 ? <Card><Text style={{ color: c.muted, lineHeight: 23 }}>{collection === 'today'
        ? tr('No meditation has been published in your language yet. Daily Word remains available from Today.', 'Aucune méditation n’a encore été publiée dans votre langue. La Parole du jour reste disponible depuis Aujourd’hui.')
        : collection === 'saved' ? tr('Meditations you save will appear here.', 'Les méditations que vous enregistrez apparaîtront ici.')
          : tr('Meditations you mark complete will appear here. Reading alone does not mark one complete.', 'Les méditations que vous marquez comme terminées apparaîtront ici. La lecture seule ne les termine pas.')}</Text></Card>
      : items.map(row => <Row key={row.meditation.id} icon={collection === 'history' ? 'checkmark-circle-outline' : 'book-outline'} title={row.meditation.title}
        subtitle={`${row.meditation.scriptureReference} · ${row.meditation.locale === 'fr' ? 'Français' : 'English'}${row.completedAt ? ` · ${new Date(row.completedAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}` : ''}`}
        onPress={() => setSelected(row.meditation.id)} />)}
    {collection === 'history' && items && items.length >= 100 ? <Text style={{ color: c.muted }}>{tr('Showing your 100 most recent completions.', 'Vos 100 méditations terminées les plus récentes sont affichées.')}</Text> : null}
    {selected ? <ReflectionDetail key={selected} kind="meditation" id={selected} onClose={() => setSelected(null)} onChanged={() => setRetry(n => n + 1)} /> : null}
  </Screen>;
}
