import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '../lib/app';
import { api } from '../lib/api';
import { Button, Card, ErrorLine, Row, Screen } from '../components/ui';
import { errorMessage } from '../../web/lib/errors';
import type { ScriptureSearch } from '../../web/lib/scripture-search';
export default function Search() {
  const { c, lang, bibleLocale, setPrefs } = useApp(); const router = useRouter(); const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  const [query, setQuery] = useState(''); const [search, setSearch] = useState(''); const [offset, setOffset] = useState(0); const [data, setData] = useState<ScriptureSearch | null>(null); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    if (!search) return;
    const controller = new AbortController(); setData(null); setError('');
    api<ScriptureSearch>(`/bible-content/search?locale=${bibleLocale}&q=${encodeURIComponent(search)}&offset=${offset}`, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setData(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, lang)); });
    return () => controller.abort();
  }, [bibleLocale, search, offset, retry, lang]));
  return <Screen title={tr('Search Scripture', 'Rechercher dans la Bible')}><Button kind="quiet" title={tr('Back to Bible', 'Retour à la Bible')} onPress={() => router.navigate('/bible')} />
    <Text style={{ color: c.muted }}>{tr('Search words or a passage reference in your selected Bible translation.', 'Recherchez des mots ou une référence dans votre traduction biblique sélectionnée.')} · {bibleLocale.toUpperCase()}</Text>
    <TextInput accessibilityLabel={tr('Words or passage reference', 'Mots ou référence biblique')} value={query} onChangeText={setQuery} maxLength={120} returnKeyType="search" onSubmitEditing={() => { setSearch(query.trim()); setOffset(0); }} style={{ minHeight: 48, padding: 14, borderWidth: 1, borderColor: c.line, borderRadius: 12, color: c.ink, backgroundColor: c.paper, fontSize: 17 }} />
    <Button title={tr('Search', 'Rechercher')} disabled={!query.trim()} onPress={() => { setSearch(query.trim()); setOffset(0); }} />
    {error ? <ErrorLine message={error} onRetry={() => setRetry(n => n + 1)} /> : !search ? null : !data ? <ActivityIndicator accessibilityLabel={tr('Searching Scripture', 'Recherche dans les Écritures')} color={c.accent} /> : <>
      {!data.items.length ? <Card><Text style={{ color: c.muted }}>{tr('No matching passages. Try another word or reference.', 'Aucun passage correspondant. Essayez un autre mot ou une autre référence.')}</Text></Card> : data.items.map(item => <Row key={item.id} icon="book-outline" title={item.reference} onPress={() => { setPrefs({ bibleLocale, chapterId: item.chapterId, verse: item.verse }); router.navigate('/bible'); }} />)}
      <Text style={{ color: c.muted }}>{data.total} {tr('results', 'résultats')}</Text><View style={{ flexDirection: 'row', gap: 12 }}><Button kind="quiet" title={tr('Previous', 'Précédent')} disabled={offset === 0} onPress={() => setOffset(n => Math.max(0, n - data.limit))} style={{ flex: 1 }} /><Button kind="quiet" title={tr('Next', 'Suivant')} disabled={offset + data.limit >= data.total} onPress={() => setOffset(n => n + data.limit)} style={{ flex: 1 }} /></View>
    </>}
  </Screen>;
}
